import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { axiosInstance } from '../api/axios';
import type {
  User,
  Item,
  Category,
  ChatSession,
  Message,
  WishlistItem,
  Rating,
  ListingCondition,
} from '../types/market';
import { useAuth } from './AuthContext';

interface ApiCategory {
  id: number;
  name: string;
  slug: string;
}

interface ApiListing {
  id: number;
  seller: number;
  category: number | null;
  title: string;
  description: string;
  price: string | number;
  condition: string;
  status: string;
  image_url: string;
  created_at: string;
}

interface ApiConversation {
  id: number;
  listing: number;
  buyer: number;
  seller: number;
  created_at: string;
}

interface ApiMessage {
  id: number;
  conversation: number;
  sender: number;
  text: string;
  timestamp: string;
}

interface ApiFavorite {
  id: number;
  listing: ApiListing;
}

interface ListingFilters {
  search?: string;
  category?: string;
  condition?: string;
}

export interface NewItemInput {
  Title: string;
  Category: string;
  Price: number;
  Condition: ListingCondition;
  Description: string;
  Images: string[];
  imageFile?: File;
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
  fetchListings: (filters?: ListingFilters) => Promise<void>;
  getItem: (itemId: string) => Item | undefined;
  addItem: (input: NewItemInput) => Promise<Item>;
  markItemSold: (itemId: string, winningBuyerId?: string) => void;
  incrementItemView: (itemId: string) => void;
  categories: Category[];
  addCategory: (name: string) => Category;
  wishlist: WishlistItem[];
  toggleWishlist: (itemId: string) => Promise<void>;
  isWishlisted: (itemId: string) => boolean;
  recentlyViewedIds: string[];
  recordViewedItem: (itemId: string) => void;
  chatSessions: ChatSession[];
  messages: Message[];
  getSessionsForUser: (userId: string) => ChatSession[];
  getSessionById: (sessionId: string) => ChatSession | undefined;
  getMessagesForSession: (sessionId: string) => Message[];
  startChatSession: (itemId: string, sellerId: string) => Promise<ChatSession>;
  sendMessage: (
    sessionId: string,
    text: string,
    media?: { type: 'image' | 'video'; url: string }
  ) => Promise<Message>;
  ratings: Rating[];
  addRating: (sessionId: string, ratedUserId: string, score: number, comment: string) => void;
  hasRated: (sessionId: string, raterUserId: string) => boolean;
  getRatingsForUser: (userId: string) => Rating[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
}

const MarketContext = createContext<MarketContextValue | undefined>(undefined);

function listData<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results;
}

function normalizeCondition(value: string): ListingCondition {
  const condition = value.toLowerCase();
  if (condition.includes('new') && !condition.includes('like')) return 'new';
  if (condition.includes('fair')) return 'fair';
  return 'good';
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const currentUserId = user?.User_ID || '';
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>(user ? [user] : []);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    setUsers(user ? [user] : []);
  }, [user]);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [Number(category.Category_ID), category.Name])),
    [categories]
  );

  const toItem = useCallback(
    (listing: ApiListing): Item => ({
      Item_ID: String(listing.id),
      Seller_ID: String(listing.seller),
      Title: listing.title,
      Category: categoryById.get(Number(listing.category)) || 'Uncategorized',
      Price: Number(listing.price),
      Condition: normalizeCondition(listing.condition),
      Status: listing.status === 'SOLD' ? 'SOLD' : 'AVAILABLE',
      Images: listing.image_url ? [listing.image_url] : [],
      Description: listing.description,
      PostedAt: listing.created_at,
      ViewCount: 0,
    }),
    [categoryById]
  );

  const loadMarket = useCallback(async () => {
    const [categoryResponse, listingResponse, conversationResponse, messageResponse, favoriteResponse] =
      await Promise.all([
        axiosInstance.get<ApiCategory[] | { results: ApiCategory[] }>('/categories/'),
        axiosInstance.get<ApiListing[] | { results: ApiListing[] }>('/listings/'),
        currentUserId
          ? axiosInstance.get<ApiConversation[] | { results: ApiConversation[] }>('/conversations/')
          : Promise.resolve({ data: [] as ApiConversation[] }),
        currentUserId
          ? axiosInstance.get<ApiMessage[] | { results: ApiMessage[] }>('/messages/')
          : Promise.resolve({ data: [] as ApiMessage[] }),
        currentUserId
          ? axiosInstance.get<ApiFavorite[]>('/favorites/')
          : Promise.resolve({ data: [] as ApiFavorite[] }),
      ]);

    const apiCategories = listData(categoryResponse.data);
    const nextCategories = [
      { Category_ID: 'cat_all', Name: 'All Categories' },
      ...apiCategories.map((category) => ({
        Category_ID: String(category.id),
        Name: category.name,
      })),
    ];
    setCategories(nextCategories);
    const namesById = new Map(nextCategories.map((category) => [Number(category.Category_ID), category.Name]));
    setItems(listData(listingResponse.data).map((listing) => ({
      ...toItem(listing),
      Category: namesById.get(Number(listing.category)) || 'Uncategorized',
    })));

    const apiConversations = listData(conversationResponse.data);
    setChatSessions(
      apiConversations.map((conversation) => ({
        Session_ID: String(conversation.id),
        Item_ID: String(conversation.listing),
        Buyer_ID: String(conversation.buyer),
        Seller_ID: String(conversation.seller),
        CreatedAt: conversation.created_at,
      }))
    );
    const apiMessages = listData(messageResponse.data);
    setMessages(
      apiMessages.map((message) => ({
        Message_ID: String(message.id),
        Session_ID: String(message.conversation),
        Sender_ID: String(message.sender),
        Text: message.text,
        Timestamp: message.timestamp,
      }))
    );
    setWishlist(
      favoriteResponse.data.map((favorite) => ({
        User_ID: currentUserId,
        Item_ID: String(favorite.listing.id),
        SavedAt: '',
      }))
    );
  }, [currentUserId, toItem]);

  const fetchListings = useCallback(async (filters: ListingFilters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
    );
    const { data } = await axiosInstance.get<ApiListing[] | { results: ApiListing[] }>('/listings/', { params });
    setItems(listData(data).map(toItem));
  }, [toItem]);

  useEffect(() => {
    if (!currentUserId) {
      setCategories([]);
      setItems([]);
      setChatSessions([]);
      setMessages([]);
      setWishlist([]);
      return;
    }
    void loadMarket().catch(() => undefined);
  }, [currentUserId, loadMarket]);

  const getUser = useCallback(
    (userId: string) => users.find((candidate) => candidate.User_ID === userId),
    [users]
  );
  const getItem = useCallback(
    (itemId: string) => items.find((item) => item.Item_ID === itemId),
    [items]
  );

  const addCategory = useCallback((name: string): Category => {
    const category: Category = { Category_ID: `pending-${Date.now()}`, Name: name.trim() };
    setCategories((previous) => [...previous, category]);
    void axiosInstance.post('/categories/', { name: category.Name, slug: category.Name.toLowerCase().replace(/\s+/g, '-') });
    return category;
  }, []);

  const addItem = useCallback(async (input: NewItemInput): Promise<Item> => {
    const category = categories.find((candidate) => candidate.Name === input.Category);
    const formData = new FormData();
    formData.append('title', input.Title);
    formData.append('description', input.Description);
    formData.append('price', String(input.Price));
    formData.append('condition', input.Condition);
    if (category && /^\d+$/.test(category.Category_ID)) {
      formData.append('category', category.Category_ID);
    }
    if (input.imageFile) formData.append('image', input.imageFile);

    const { data } = await axiosInstance.post<ApiListing>('/listings/', formData);
    const newItem = toItem(data);
    setItems((previous) => [newItem, ...previous]);
    return newItem;
  }, [categories, toItem]);

  const markItemSold = useCallback((itemId: string) => {
    setItems((previous) => previous.map((item) => item.Item_ID === itemId ? { ...item, Status: 'SOLD' } : item));
    void axiosInstance.patch(`/listings/${itemId}/`, { status: 'SOLD' });
  }, []);

  const incrementItemView = useCallback((_itemId: string) => undefined, []);
  const recordViewedItem = useCallback((itemId: string) => {
    setRecentlyViewedIds((previous) => [itemId, ...previous.filter((id) => id !== itemId)].slice(0, 10));
  }, []);

  const isWishlisted = useCallback(
    (itemId: string) => wishlist.some((favorite) => favorite.User_ID === currentUserId && favorite.Item_ID === itemId),
    [currentUserId, wishlist]
  );

  const toggleWishlist = useCallback(async (itemId: string) => {
    await axiosInstance.post('/favorites/', { listing_id: Number(itemId) });
    setWishlist((previous) => {
      const exists = previous.some((favorite) => favorite.Item_ID === itemId && favorite.User_ID === currentUserId);
      return exists
        ? previous.filter((favorite) => !(favorite.Item_ID === itemId && favorite.User_ID === currentUserId))
        : [...previous, { User_ID: currentUserId, Item_ID: itemId, SavedAt: new Date().toISOString() }];
    });
  }, [currentUserId]);

  const getSessionsForUser = useCallback(
    (userId: string) => chatSessions.filter((session) => session.Buyer_ID === userId || session.Seller_ID === userId),
    [chatSessions]
  );
  const getSessionById = useCallback(
    (sessionId: string) => chatSessions.find((session) => session.Session_ID === sessionId),
    [chatSessions]
  );
  const getMessagesForSession = useCallback(
    (sessionId: string) => messages.filter((message) => message.Session_ID === sessionId),
    [messages]
  );

  const startChatSession = useCallback(async (itemId: string): Promise<ChatSession> => {
    const existing = chatSessions.find((session) => session.Item_ID === itemId && session.Buyer_ID === currentUserId);
    if (existing) return existing;
    const { data } = await axiosInstance.post<ApiConversation>('/conversations/', { listing: Number(itemId) });
    const session: ChatSession = {
      Session_ID: String(data.id),
      Item_ID: String(data.listing),
      Buyer_ID: String(data.buyer),
      Seller_ID: String(data.seller),
      CreatedAt: data.created_at,
    };
    setChatSessions((previous) => [session, ...previous]);
    return session;
  }, [chatSessions, currentUserId]);

  const sendMessage = useCallback(async (sessionId: string, text: string): Promise<Message> => {
    const { data } = await axiosInstance.post<ApiMessage>('/messages/', {
      conversation: Number(sessionId),
      text: text.trim(),
    });
    const message: Message = {
      Message_ID: String(data.id),
      Session_ID: String(data.conversation),
      Sender_ID: String(data.sender),
      Text: data.text,
      Timestamp: data.timestamp,
    };
    setMessages((previous) => [...previous, message]);
    return message;
  }, []);

  const addRating = useCallback((sessionId: string, ratedUserId: string, score: number, comment: string) => {
    setRatings((previous) => [...previous, {
      Rating_ID: `local-${Date.now()}`,
      Session_ID: sessionId,
      RatedUserID: ratedUserId,
      RaterUserID: currentUserId,
      Score: score,
      Comment: comment,
      CreatedAt: new Date().toISOString(),
    }]);
  }, [currentUserId]);
  const hasRated = useCallback((sessionId: string, raterUserId: string) => ratings.some((rating) => rating.Session_ID === sessionId && rating.RaterUserID === raterUserId), [ratings]);
  const getRatingsForUser = useCallback((userId: string) => ratings.filter((rating) => rating.RatedUserID === userId), [ratings]);

  const notifications = useMemo<NotificationItem[]>(() => messages.slice(-10).reverse().map((message) => ({
    id: message.Message_ID,
    sessionId: message.Session_ID,
    senderName: getUser(message.Sender_ID)?.Name || 'Campus Peer',
    senderAvatar: getUser(message.Sender_ID)?.AvatarSeed || '',
    itemTitle: getItem(getSessionById(message.Session_ID)?.Item_ID || '')?.Title || 'Campus Listing',
    previewText: message.Text,
    timestamp: message.Timestamp,
    unread: message.Sender_ID !== currentUserId,
  })), [currentUserId, getItem, getSessionById, getUser, messages]);

  const value = useMemo<MarketContextValue>(() => ({
    users, getUser, items, fetchListings, getItem, addItem, markItemSold, incrementItemView,
    categories, addCategory, wishlist, toggleWishlist, isWishlisted,
    recentlyViewedIds, recordViewedItem, chatSessions, messages,
    getSessionsForUser, getSessionById, getMessagesForSession, startChatSession,
    sendMessage, ratings, addRating, hasRated, getRatingsForUser,
    notifications, unreadNotificationCount: notifications.filter((notification) => notification.unread).length,
  }), [
    users, getUser, items, fetchListings, getItem, addItem, markItemSold, incrementItemView,
    categories, addCategory, wishlist, toggleWishlist, isWishlisted,
    recentlyViewedIds, recordViewedItem, chatSessions, messages,
    getSessionsForUser, getSessionById, getMessagesForSession, startChatSession,
    sendMessage, ratings, addRating, hasRated, getRatingsForUser, notifications,
  ]);

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) throw new Error('useMarket must be used within a MarketProvider');
  return context;
}

export function useItems() {
  const market = useMarket();
  return { items: market.items, getItem: market.getItem, addItem: market.addItem, markItemSold: market.markItemSold, incrementItemView: market.incrementItemView };
}

export function useWishlist() {
  const market = useMarket();
  return { wishlist: market.wishlist, toggleWishlist: market.toggleWishlist, isWishlisted: market.isWishlisted };
}

export function useChat() {
  const market = useMarket();
  return { chatSessions: market.chatSessions, messages: market.messages, getSessionsForUser: market.getSessionsForUser, getSessionById: market.getSessionById, getMessagesForSession: market.getMessagesForSession, startChatSession: market.startChatSession, sendMessage: market.sendMessage };
}

export function useRatings() {
  const market = useMarket();
  return { ratings: market.ratings, addRating: market.addRating, hasRated: market.hasRated, getRatingsForUser: market.getRatingsForUser };
}
