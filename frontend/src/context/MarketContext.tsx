// src/context/MarketContext.tsx
//
// In-memory reactive state context & hooks for Campus Bazaar.
// Backed by localStorage so items, status changes, chats, wishlist,
// and ratings persist across navigations without requiring any real backend.

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  User,
  Item,
  ChatSession,
  Message,
  WishlistItem,
  Rating,
  ListingCondition,
} from '../types/market';
import {
  INITIAL_USERS,
  INITIAL_ITEMS,
  INITIAL_CHAT_SESSIONS,
  INITIAL_MESSAGES,
  INITIAL_WISHLIST,
  INITIAL_RATINGS,
  INITIAL_CATEGORIES,
} from '../data/mockMarketData';
import { useAuth } from './AuthContext';

export interface NewItemInput {
  Title: string;
  Category: string;
  Price: number;
  Condition: ListingCondition;
  Description: string;
  Images: string[];
}

export interface NotificationItem {
  id: string;
  sessionId: string;
  senderName: string;
  senderAvatar: string;
  itemTitle: string;
  previewText: string;
  timestamp: string;
  unread: boolean;
}

interface MarketContextValue {
  users: User[];
  getUser: (userId: string) => User | undefined;
  items: Item[];
  getItem: (itemId: string) => Item | undefined;
  addItem: (input: NewItemInput) => Item;
  markItemSold: (itemId: string, winningBuyerId?: string) => void;
  incrementItemView: (itemId: string) => void;

  categories: typeof INITIAL_CATEGORIES;

  // Wishlist
  wishlist: WishlistItem[];
  toggleWishlist: (itemId: string) => void;
  isWishlisted: (itemId: string) => boolean;

  // Recently viewed
  recentlyViewedIds: string[];
  recordViewedItem: (itemId: string) => void;

  // Chats & Messages
  chatSessions: ChatSession[];
  messages: Message[];
  getSessionsForUser: (userId: string) => ChatSession[];
  getSessionById: (sessionId: string) => ChatSession | undefined;
  getMessagesForSession: (sessionId: string) => Message[];
  startChatSession: (itemId: string, sellerId: string) => ChatSession;
  sendMessage: (sessionId: string, text: string) => Message;

  // Ratings
  ratings: Rating[];
  addRating: (sessionId: string, ratedUserId: string, score: number, comment: string) => void;
  hasRated: (sessionId: string, raterUserId: string) => boolean;
  getRatingsForUser: (userId: string) => Rating[];

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
}

const MarketContext = createContext<MarketContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  ITEMS: 'campus_bazaar_items_v2',
  USERS: 'campus_bazaar_users_v2',
  SESSIONS: 'campus_bazaar_sessions_v2',
  MESSAGES: 'campus_bazaar_messages_v2',
  WISHLIST: 'campus_bazaar_wishlist_v2',
  RATINGS: 'campus_bazaar_ratings_v2',
  RECENT: 'campus_bazaar_recent_v2',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore parse errors, use fallback
  }
  return fallback;
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const currentUserId = user?.User_ID || 'user_alex';

  const [users, setUsers] = useState<User[]>(() =>
    loadFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS)
  );

  const [items, setItems] = useState<Item[]>(() =>
    loadFromStorage(STORAGE_KEYS.ITEMS, INITIAL_ITEMS)
  );

  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() =>
    loadFromStorage(STORAGE_KEYS.SESSIONS, INITIAL_CHAT_SESSIONS)
  );

  const [messages, setMessages] = useState<Message[]>(() =>
    loadFromStorage(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES)
  );

  const [wishlist, setWishlist] = useState<WishlistItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.WISHLIST, INITIAL_WISHLIST)
  );

  const [ratings, setRatings] = useState<Rating[]>(() =>
    loadFromStorage(STORAGE_KEYS.RATINGS, INITIAL_RATINGS)
  );

  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() =>
    loadFromStorage(STORAGE_KEYS.RECENT, ['item_102', 'item_101'])
  );

  // Sync state to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(chatSessions));
  }, [chatSessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(ratings));
  }, [ratings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recentlyViewedIds));
  }, [recentlyViewedIds]);

  const getUser = useCallback(
    (userId: string) => users.find((u) => u.User_ID === userId),
    [users]
  );

  const getItem = useCallback(
    (itemId: string) => items.find((item) => item.Item_ID === itemId),
    [items]
  );

  const addItem = useCallback(
    (input: NewItemInput): Item => {
      const newItem: Item = {
        Item_ID: `item_${Date.now()}`,
        Seller_ID: currentUserId,
        Title: input.Title,
        Category: input.Category,
        Price: input.Price,
        Condition: input.Condition,
        Status: 'AVAILABLE',
        Images: input.Images.length > 0 ? input.Images : ['https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80'],
        Description: input.Description,
        PostedAt: new Date().toISOString(),
        ViewCount: 0,
      };

      setItems((prev) => [newItem, ...prev]);
      return newItem;
    },
    [currentUserId]
  );

  const markItemSold = useCallback(
    (itemId: string, winningBuyerId?: string) => {
      setItems((prev) =>
        prev.map((item) =>
          item.Item_ID === itemId
            ? { ...item, Status: 'SOLD', WinningBuyer_ID: winningBuyerId }
            : item
        )
      );

      // If a winning buyer is provided, mark that chat session's SoldToBuyer = true
      if (winningBuyerId) {
        setChatSessions((prev) =>
          prev.map((session) =>
            session.Item_ID === itemId && session.Buyer_ID === winningBuyerId
              ? { ...session, SoldToBuyer: true }
              : session
          )
        );
      }
    },
    []
  );

  const incrementItemView = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.Item_ID === itemId ? { ...item, ViewCount: item.ViewCount + 1 } : item
      )
    );
  }, []);

  const toggleWishlist = useCallback(
    (itemId: string) => {
      setWishlist((prev) => {
        const exists = prev.some(
          (w) => w.User_ID === currentUserId && w.Item_ID === itemId
        );
        if (exists) {
          return prev.filter(
            (w) => !(w.User_ID === currentUserId && w.Item_ID === itemId)
          );
        } else {
          return [
            ...prev,
            { User_ID: currentUserId, Item_ID: itemId, SavedAt: new Date().toISOString() },
          ];
        }
      });
    },
    [currentUserId]
  );

  const isWishlisted = useCallback(
    (itemId: string) => {
      return wishlist.some(
        (w) => w.User_ID === currentUserId && w.Item_ID === itemId
      );
    },
    [wishlist, currentUserId]
  );

  const recordViewedItem = useCallback((itemId: string) => {
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== itemId);
      return [itemId, ...filtered].slice(0, 10);
    });
  }, []);

  const getSessionsForUser = useCallback(
    (userId: string) => {
      return chatSessions.filter(
        (session) => session.Buyer_ID === userId || session.Seller_ID === userId
      );
    },
    [chatSessions]
  );

  const getSessionById = useCallback(
    (sessionId: string) => chatSessions.find((s) => s.Session_ID === sessionId),
    [chatSessions]
  );

  const getMessagesForSession = useCallback(
    (sessionId: string) =>
      messages
        .filter((m) => m.Session_ID === sessionId)
        .sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime()),
    [messages]
  );

  const startChatSession = useCallback(
    (itemId: string, sellerId: string): ChatSession => {
      const existing = chatSessions.find(
        (s) =>
          s.Item_ID === itemId &&
          s.Buyer_ID === currentUserId &&
          s.Seller_ID === sellerId
      );
      if (existing) {
        return existing;
      }

      const newSession: ChatSession = {
        Session_ID: `session_${Date.now()}`,
        Item_ID: itemId,
        Buyer_ID: currentUserId,
        Seller_ID: sellerId,
        CreatedAt: new Date().toISOString(),
      };

      setChatSessions((prev) => [newSession, ...prev]);

      // Seed initial automated inquiry greeting if wanted
      const item = items.find((i) => i.Item_ID === itemId);
      if (item) {
        const initialMsg: Message = {
          Message_ID: `msg_${Date.now()}`,
          Session_ID: newSession.Session_ID,
          Sender_ID: currentUserId,
          Text: `Hi! I am interested in purchasing your "${item.Title}" listed for $${item.Price}. Is it still available?`,
          Timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, initialMsg]);
      }

      return newSession;
    },
    [chatSessions, currentUserId, items]
  );

  const sendMessage = useCallback(
    (sessionId: string, text: string): Message => {
      const newMsg: Message = {
        Message_ID: `msg_${Date.now()}`,
        Session_ID: sessionId,
        Sender_ID: currentUserId,
        Text: text.trim(),
        Timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newMsg]);
      return newMsg;
    },
    [currentUserId]
  );

  const addRating = useCallback(
    (sessionId: string, ratedUserId: string, score: number, comment: string) => {
      const newRating: Rating = {
        Rating_ID: `rating_${Date.now()}`,
        Session_ID: sessionId,
        RatedUserID: ratedUserId,
        RaterUserID: currentUserId,
        Score: score,
        Comment: comment.trim(),
        CreatedAt: new Date().toISOString(),
      };

      setRatings((prev) => [newRating, ...prev]);

      // Update rated user's average rating in users list
      setUsers((prev) =>
        prev.map((u) => {
          if (u.User_ID === ratedUserId) {
            const userRatings = [...ratings.filter((r) => r.RatedUserID === ratedUserId), newRating];
            const avg =
              userRatings.reduce((sum, r) => sum + r.Score, 0) / userRatings.length;
            return {
              ...u,
              Rating: parseFloat(avg.toFixed(1)),
              RatingCount: userRatings.length,
            };
          }
          return u;
        })
      );
    },
    [currentUserId, ratings]
  );

  const hasRated = useCallback(
    (sessionId: string, raterUserId: string) => {
      return ratings.some(
        (r) => r.Session_ID === sessionId && r.RaterUserID === raterUserId
      );
    },
    [ratings]
  );

  const getRatingsForUser = useCallback(
    (userId: string) => ratings.filter((r) => r.RatedUserID === userId),
    [ratings]
  );

  // Compute notifications: list of other users' recent messages in sessions the current user belongs to
  const notifications = useMemo<NotificationItem[]>(() => {
    const userSessions = chatSessions.filter(
      (s) => s.Buyer_ID === currentUserId || s.Seller_ID === currentUserId
    );

    const list: NotificationItem[] = [];

    for (const session of userSessions) {
      const sessionMsgs = messages
        .filter((m) => m.Session_ID === session.Session_ID)
        .sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());

      const latestMsg = sessionMsgs[0];
      if (latestMsg) {
        const otherUserId =
          session.Buyer_ID === currentUserId ? session.Seller_ID : session.Buyer_ID;
        const otherUser = users.find((u) => u.User_ID === otherUserId);
        const item = items.find((i) => i.Item_ID === session.Item_ID);

        list.push({
          id: latestMsg.Message_ID,
          sessionId: session.Session_ID,
          senderName: otherUser?.Name || 'Campus Peer',
          senderAvatar: otherUser?.AvatarSeed || '',
          itemTitle: item?.Title || 'Campus Listing',
          previewText: latestMsg.Text,
          timestamp: latestMsg.Timestamp,
          unread: latestMsg.Sender_ID !== currentUserId,
        });
      }
    }

    return list.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [chatSessions, currentUserId, messages, users, items]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => n.unread).length;
  }, [notifications]);

  const value = useMemo<MarketContextValue>(
    () => ({
      users,
      getUser,
      items,
      getItem,
      addItem,
      markItemSold,
      incrementItemView,
      categories: INITIAL_CATEGORIES,
      wishlist,
      toggleWishlist,
      isWishlisted,
      recentlyViewedIds,
      recordViewedItem,
      chatSessions,
      messages,
      getSessionsForUser,
      getSessionById,
      getMessagesForSession,
      startChatSession,
      sendMessage,
      ratings,
      addRating,
      hasRated,
      getRatingsForUser,
      notifications,
      unreadNotificationCount,
    }),
    [
      users,
      getUser,
      items,
      getItem,
      addItem,
      markItemSold,
      incrementItemView,
      wishlist,
      toggleWishlist,
      isWishlisted,
      recentlyViewedIds,
      recordViewedItem,
      chatSessions,
      messages,
      getSessionsForUser,
      getSessionById,
      getMessagesForSession,
      startChatSession,
      sendMessage,
      ratings,
      addRating,
      hasRated,
      getRatingsForUser,
      notifications,
      unreadNotificationCount,
    ]
  );

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return ctx;
}

export function useItems() {
  const { items, getItem, addItem, markItemSold, incrementItemView } = useMarket();
  return { items, getItem, addItem, markItemSold, incrementItemView };
}

export function useWishlist() {
  const { wishlist, toggleWishlist, isWishlisted } = useMarket();
  return { wishlist, toggleWishlist, isWishlisted };
}

export function useChat() {
  const {
    chatSessions,
    messages,
    getSessionsForUser,
    getSessionById,
    getMessagesForSession,
    startChatSession,
    sendMessage,
  } = useMarket();
  return {
    chatSessions,
    messages,
    getSessionsForUser,
    getSessionById,
    getMessagesForSession,
    startChatSession,
    sendMessage,
  };
}

export function useRatings() {
  const { ratings, addRating, hasRated, getRatingsForUser } = useMarket();
  return { ratings, addRating, hasRated, getRatingsForUser };
}
