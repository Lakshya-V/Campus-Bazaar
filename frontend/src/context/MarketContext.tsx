import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AUTH_LOGOUT_EVENT, axiosInstance } from '../api/axios';
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

interface ApiUser {
  id: number;
  username: string;
  university_email: string;
  hostel_building?: string;
  phone_number?: string;
  is_verified_student?: boolean;
  rating_average?: number;
  rating_count?: number;
}

interface ApiRating {
  id: number;
  conversation_id: number;
  rater: ApiUser;
  rated_user: ApiUser;
  score: number;
  comment: string;
  created_at: string;
}

interface ApiNotification {
  id: number;
  conversation_id: number;
  message_id: number | null;
  sender_id: number;
  sender_name: string;
  item_title: string;
  preview_text: string;
  is_read: boolean;
  created_at: string;
}

interface ApiCategory {
  id: number;
  name: string;
  slug: string;
}

interface ApiListing {
  id: number;
  seller: ApiUser | number;
  seller_id?: number;
  category: ApiCategory | number | null;
  category_id?: number | null;
  title: string;
  description: string;
  price: string | number;
  condition: string;
  status: string;
  image_url: string;
  is_favorited?: boolean;
  created_at: string;
}

interface ApiConversation {
  id: number;
  listing: {
    id: number;
    title: string;
    price: string | number;
    condition?: string;
    status?: string;
    image_url?: string;
    category?: string;
    category_id?: number | null;
    seller_id?: number;
  } | number;
  listing_id?: number;
  buyer: ApiUser | number;
  buyer_id?: number;
  seller: ApiUser | number;
  seller_id?: number;
  last_message?: {
    id: number;
    sender_id: number;
    sender_name: string;
    text: string;
    timestamp: string;
  } | null;
  created_at: string;
}

interface ApiMessage {
  id: number;
  conversation: number;
  conversation_id?: number;
  sender: ApiUser | number;
  sender_id?: number;
  text: string;
  image_url?: string;
  media_type?: 'image' | 'video' | '';
  timestamp: string;
}

interface ApiFavorite {
  id: number;
  listing: ApiListing;
  listing_id?: number;
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
  Image?: File;
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
  isLoadingMarket: boolean;
  fetchListings: (filters?: ListingFilters) => Promise<void>;
  getItem: (itemId: string) => Item | undefined;
  addItem: (input: NewItemInput) => Promise<Item>;
  markItemSold: (itemId: string, winningBuyerId?: string) => Promise<void>;
  toggleItemStatus: (itemId: string) => Promise<void>;
  incrementItemView: () => void;
  categories: Category[];
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
  fetchSessionMessages: (sessionId: string) => Promise<void>;
  loadingMessagesFor: string | null;
  startChatSession: (itemId: string) => Promise<ChatSession>;
  sendMessage: (
    sessionId: string,
    text: string,
    media?: { type: 'image' | 'video'; url: string; file: File }
  ) => Promise<Message>;
  ratings: Rating[];
  addRating: (sessionId: string, ratedUserId: string, score: number, comment: string) => Promise<void>;
  hasRated: (sessionId: string, raterUserId: string) => boolean;
  getRatingsForUser: (userId: string) => Rating[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationsRead: (sessionId: string) => Promise<void>;
}

const MarketContext = createContext<MarketContextValue | undefined>(undefined);

function listData<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results;
}

function normalizeImageUrl(imageUrl?: string): string | undefined {
  if (!imageUrl) return undefined;
  const apiBaseUrl = axiosInstance.defaults.baseURL || window.location.origin;
  const backendOrigin = new URL(apiBaseUrl, window.location.origin).origin;
  return new URL(imageUrl, backendOrigin).toString();
}

function normalizeCondition(value: string): ListingCondition {
  const condition = (value || '').toLowerCase();
  if (condition.includes('book') || condition.includes('note')) return 'Books & Notes';
  if (condition.includes('like')) return 'Like New';
  if (condition.includes('new')) return 'Brand New';
  if (condition.includes('fair')) return 'Fair Use';
  return 'Good';
}

function toUserFromApi(apiUser: ApiUser): User {
  return {
    User_ID: String(apiUser.id),
    Name: apiUser.username,
    InstitutionalEmail: apiUser.university_email || `${apiUser.username}@vitstudent.ac.in`,
    Role: 'Student',
    AvatarSeed: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(apiUser.username)}`,
    Rating: Number(apiUser.rating_average ?? 0),
    RatingCount: Number(apiUser.rating_count ?? 0),
    IsVerified: apiUser.is_verified_student ?? false,
    HostelBuilding: apiUser.hostel_building,
    PhoneNumber: apiUser.phone_number,
  };
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoadingMarket, setIsLoadingMarket] = useState(false);
  const [loadingMessagesFor, setLoadingMessagesFor] = useState<string | null>(null);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [Number(category.Category_ID), category.Name])),
    [categories]
  );

  const toItem = useCallback(
    (listing: ApiListing): Item => {
      const categoryName =
        typeof listing.category === 'object' && listing.category
          ? listing.category.name
          : categoryById.get(Number(listing.category)) || 'All Categories';

      const sellerId =
        typeof listing.seller === 'object' && listing.seller
          ? String(listing.seller.id)
          : String(listing.seller_id ?? listing.seller ?? '');

      const sellerName =
        typeof listing.seller === 'object' && listing.seller
          ? listing.seller.username
          : undefined;
      const imageUrl = normalizeImageUrl(listing.image_url);

      return {
        Item_ID: String(listing.id),
        Seller_ID: sellerId,
        SellerName: sellerName,
        Title: listing.title,
        Category: categoryName,
        CategoryId:
          typeof listing.category === 'object' && listing.category
            ? listing.category.id
            : Number(listing.category) || undefined,
        Price: Number(listing.price),
        Condition: normalizeCondition(listing.condition),
        Status: listing.status === 'SOLD' ? 'SOLD' : 'AVAILABLE',
        Images: imageUrl ? [imageUrl] : [],
        Description: listing.description,
        PostedAt: listing.created_at,
        ViewCount: 0,
        IsFavorited: listing.is_favorited,
      };
    },
    [categoryById]
  );

  const loadMarket = useCallback(async () => {
    setIsLoadingMarket(true);
    try {
      const [categoryResponse, listingResponse, conversationResponse, messageResponse, favoriteResponse, ratingResponse, notificationResponse] =
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
            ? axiosInstance.get<ApiFavorite[] | { results: ApiFavorite[] }>('/favorites/')
            : Promise.resolve({ data: [] as ApiFavorite[] }),
          currentUserId
            ? axiosInstance.get<ApiRating[] | { results: ApiRating[] }>('/ratings/')
            : Promise.resolve({ data: [] as ApiRating[] }),
          currentUserId
            ? axiosInstance.get<ApiNotification[] | { results: ApiNotification[] }>('/notifications/')
            : Promise.resolve({ data: [] as ApiNotification[] }),
        ]);

      const apiCategories = listData(categoryResponse.data);
      const nextCategories = [
        { Category_ID: 'cat_all', Name: 'All Categories' },
        ...apiCategories.map((category) => ({
          Category_ID: String(category.id),
          Name: category.name,
          Slug: category.slug,
        })),
      ];
      setCategories(nextCategories);

      // Collect relational users from listings, conversations, etc.
      const discoveredUsers: User[] = user ? [user] : [];
      const userMap = new Map<string, User>(discoveredUsers.map((u) => [u.User_ID, u]));

      const rawListings = listData(listingResponse.data);
      rawListings.forEach((l) => {
        if (typeof l.seller === 'object' && l.seller && !userMap.has(String(l.seller.id))) {
          const u = toUserFromApi(l.seller);
          userMap.set(u.User_ID, u);
        }
      });

      const rawConversations = listData(conversationResponse.data);
      rawConversations.forEach((conv) => {
        if (typeof conv.buyer === 'object' && conv.buyer && !userMap.has(String(conv.buyer.id))) {
          const u = toUserFromApi(conv.buyer);
          userMap.set(u.User_ID, u);
        }
        if (typeof conv.seller === 'object' && conv.seller && !userMap.has(String(conv.seller.id))) {
          const u = toUserFromApi(conv.seller);
          userMap.set(u.User_ID, u);
        }
      });

      setUsers(Array.from(userMap.values()));

      const namesById = new Map(
        nextCategories.map((category) => [Number(category.Category_ID), category.Name])
      );
      setItems(
        rawListings.map((listing) => ({
          ...toItem(listing),
          Category:
            typeof listing.category === 'object' && listing.category
              ? listing.category.name
              : namesById.get(Number(listing.category)) || 'All Categories',
        }))
      );

      setChatSessions(
        rawConversations.map((conversation) => {
          const listingObj =
            typeof conversation.listing === 'object' && conversation.listing
              ? conversation.listing
              : undefined;
          const buyerObj =
            typeof conversation.buyer === 'object' && conversation.buyer
              ? conversation.buyer
              : undefined;
          const sellerObj =
            typeof conversation.seller === 'object' && conversation.seller
              ? conversation.seller
              : undefined;

          return {
            Session_ID: String(conversation.id),
            Item_ID: String(listingObj ? listingObj.id : conversation.listing_id ?? conversation.listing),
            Buyer_ID: String(buyerObj ? buyerObj.id : conversation.buyer_id ?? conversation.buyer),
            Seller_ID: String(sellerObj ? sellerObj.id : conversation.seller_id ?? conversation.seller),
            CreatedAt: conversation.created_at,
            ListingTitle: listingObj?.title,
            ListingPrice: listingObj?.price ? Number(listingObj.price) : undefined,
            ListingImage: normalizeImageUrl(listingObj?.image_url),
            BuyerName: buyerObj?.username,
            SellerName: sellerObj?.username,
            LastMessageText: conversation.last_message?.text,
            LastMessageTime: conversation.last_message?.timestamp,
          };
        })
      );

      const apiMessages = listData(messageResponse.data);
      setMessages(
        apiMessages.map((message) => ({
          Message_ID: String(message.id),
          Session_ID: String(message.conversation_id ?? message.conversation),
          Sender_ID:
            typeof message.sender === 'object' && message.sender
              ? String(message.sender.id)
              : String(message.sender_id ?? message.sender),
          SenderName:
            typeof message.sender === 'object' && message.sender
              ? message.sender.username
              : undefined,
          Text: message.text,
          Timestamp: message.timestamp,
          MediaType: message.media_type || undefined,
          MediaUrl: normalizeImageUrl(message.image_url),
        }))
      );

      const apiFavorites = listData(favoriteResponse.data);
      setWishlist(
        apiFavorites.map((favorite) => ({
          User_ID: currentUserId,
          Item_ID: String(favorite.listing ? favorite.listing.id : favorite.listing_id),
          SavedAt: '',
        }))
      );
      const apiRatings = listData(ratingResponse.data);
      setRatings(apiRatings.map((rating) => ({
        Rating_ID: String(rating.id),
        Session_ID: String(rating.conversation_id),
        RatedUserID: String(rating.rated_user.id),
        RaterUserID: String(rating.rater.id),
        Score: rating.score,
        Comment: rating.comment,
        CreatedAt: rating.created_at,
      })));
      const apiNotifications = listData(notificationResponse.data);
      setNotifications(apiNotifications.map((notification) => ({
        id: String(notification.id),
        sessionId: String(notification.conversation_id),
        senderName: notification.sender_name,
        senderAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(notification.sender_name)}`,
        itemTitle: notification.item_title,
        previewText: notification.preview_text,
        timestamp: notification.created_at,
        unread: !notification.is_read,
      })));
    } catch (e) {
      console.error('Error loading market:', e);
    } finally {
      setIsLoadingMarket(false);
    }
  }, [currentUserId, toItem, user]);

  const fetchListings = useCallback(
    async (filters: ListingFilters = {}) => {
      const params: Record<string, string> = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.condition) {
        const value = filters.condition.toLowerCase();
        params.condition =
          value === 'new' || value === 'brand new' ? 'Brand New' :
          value === 'like new' ? 'Like New' :
          value === 'fair' ? 'Fair Use' :
          value === 'books & notes' ? 'Books & Notes' : 'Good';
      }
      const { data } = await axiosInstance.get<ApiListing[] | { results: ApiListing[] }>('/listings/', {
        params,
      });
      const raw = listData(data);
      setItems(raw.map(toItem));
    },
    [toItem]
  );

  useEffect(() => {
    if (!currentUserId) return;
    const requestTimer = window.setTimeout(() => {
      void loadMarket().catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(requestTimer);
  }, [currentUserId, loadMarket]);

  useEffect(() => {
    const clearPrivateMarketState = () => {
      setCategories([]);
      setItems([]);
      setChatSessions([]);
      setMessages([]);
      setWishlist([]);
      setRatings([]);
      setNotifications([]);
      setIsLoadingMarket(false);
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, clearPrivateMarketState);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, clearPrivateMarketState);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const refreshTimer = window.setInterval(() => {
      void loadMarket();
    }, 15000);
    return () => window.clearInterval(refreshTimer);
  }, [currentUserId, loadMarket]);

  const getUser = useCallback(
    (userId: string) => users.find((candidate) => candidate.User_ID === userId),
    [users]
  );
  const getItem = useCallback(
    (itemId: string) => items.find((item) => item.Item_ID === itemId),
    [items]
  );

  const addItem = useCallback(
    async (input: NewItemInput): Promise<Item> => {
      const category = categories.find(
        (candidate) =>
          candidate.Name.toLowerCase() === input.Category.toLowerCase() ||
          candidate.Category_ID === input.Category
      );
      if (!category || !/^\d+$/.test(category.Category_ID)) {
        throw new Error('Choose a category before publishing the listing.');
      }

      const formData = new FormData();
      formData.append('title', input.Title.trim());
      formData.append('description', input.Description.trim());
      formData.append('price', String(input.Price));
      formData.append('condition', input.Condition);
      formData.append('category_id', String(Number(category.Category_ID)));
      if (input.Image) formData.append('image', input.Image);
      const { data } = await axiosInstance.post<ApiListing>('/listings/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newItem = toItem(data);
      setItems((previous) => [newItem, ...previous]);
      return newItem;
    },
    [categories, toItem]
  );

  const markItemSold = useCallback(async (itemId: string, winningBuyerId?: string) => {
    const originalItem = items.find((item) => item.Item_ID === itemId);
    if (!originalItem) throw new Error('Listing not found.');
    setItems((previous) =>
      previous.map((item) =>
        item.Item_ID === itemId ? { ...item, Status: 'SOLD', WinningBuyer_ID: winningBuyerId } : item
      )
    );
    try {
      await axiosInstance.patch(`/listings/${itemId}/`, { status: 'SOLD' });
    } catch (err) {
      setItems((previous) => previous.map((item) =>
        item.Item_ID === itemId ? originalItem : item
      ));
      throw err;
    }
  }, [items]);

  const toggleItemStatus = useCallback(async (itemId: string): Promise<void> => {
    const currentItem = items.find((item) => item.Item_ID === itemId);
    if (!currentItem) throw new Error('Listing not found.');
    const nextStatus = currentItem.Status === 'SOLD' ? 'AVAILABLE' : 'SOLD';
    setItems((previous) => previous.map((item) =>
      item.Item_ID === itemId ? { ...item, Status: nextStatus } : item
    ));
    try {
      await axiosInstance.patch(`/listings/${itemId}/`, { status: nextStatus });
    } catch (error) {
      setItems((previous) => previous.map((item) =>
        item.Item_ID === itemId ? { ...item, Status: currentItem.Status } : item
      ));
      throw error;
    }
  }, [items]);

  const incrementItemView = useCallback(() => undefined, []);
  const recordViewedItem = useCallback((itemId: string) => {
    setRecentlyViewedIds((previous) =>
      [itemId, ...previous.filter((id) => id !== itemId)].slice(0, 10)
    );
  }, []);

  const isWishlisted = useCallback(
    (itemId: string) =>
      wishlist.some((favorite) => favorite.User_ID === currentUserId && favorite.Item_ID === itemId),
    [currentUserId, wishlist]
  );

  const toggleWishlist = useCallback(
    async (itemId: string) => {
      const currentlyWishlisted = wishlist.some(
        (favorite) => favorite.Item_ID === itemId && favorite.User_ID === currentUserId
      );

      // Instant optimistic update
      setWishlist((previous) =>
        currentlyWishlisted
          ? previous.filter((fav) => !(fav.Item_ID === itemId && fav.User_ID === currentUserId))
          : [...previous, { User_ID: currentUserId, Item_ID: itemId, SavedAt: new Date().toISOString() }]
      );
      setItems((previous) =>
        previous.map((item) =>
          item.Item_ID === itemId ? { ...item, IsFavorited: !currentlyWishlisted } : item
        )
      );

      try {
        const { data } = await axiosInstance.post<{ favorited: boolean; listing_id: number }>(
          '/favorites/toggle/',
          { listing_id: Number(itemId) }
        );
        if (data && typeof data.favorited === 'boolean') {
          const isFav = data.favorited;
          setWishlist((previous) => {
            const has = previous.some((fav) => fav.Item_ID === itemId && fav.User_ID === currentUserId);
            if (isFav && !has) {
              return [
                ...previous,
                { User_ID: currentUserId, Item_ID: itemId, SavedAt: new Date().toISOString() },
              ];
            } else if (!isFav && has) {
              return previous.filter(
                (fav) => !(fav.Item_ID === itemId && fav.User_ID === currentUserId)
              );
            }
            return previous;
          });
          setItems((previous) =>
            previous.map((item) =>
              item.Item_ID === itemId ? { ...item, IsFavorited: isFav } : item
            )
          );
        }
      } catch (err) {
        console.error('Failed to toggle wishlist:', err);
        // Revert on error
        setWishlist((previous) =>
          currentlyWishlisted
            ? [
                ...previous,
                { User_ID: currentUserId, Item_ID: itemId, SavedAt: new Date().toISOString() },
              ]
            : previous.filter((fav) => !(fav.Item_ID === itemId && fav.User_ID === currentUserId))
        );
        setItems((previous) =>
          previous.map((item) =>
            item.Item_ID === itemId ? { ...item, IsFavorited: currentlyWishlisted } : item
          )
        );
      }
    },
    [currentUserId, wishlist]
  );

  const getSessionsForUser = useCallback(
    (userId: string) =>
      chatSessions.filter((session) => session.Buyer_ID === userId || session.Seller_ID === userId),
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

  const fetchSessionMessages = useCallback(async (sessionId: string) => {
    setLoadingMessagesFor(sessionId);
    try {
      const { data } = await axiosInstance.get<ApiMessage[] | { results: ApiMessage[] }>(
        `/messages/?conversation=${sessionId}`
      );
      const list = listData(data);
      const loaded: Message[] = list.map((msg) => ({
        Message_ID: String(msg.id),
        Session_ID: String(msg.conversation_id ?? msg.conversation),
        Sender_ID:
          typeof msg.sender === 'object' && msg.sender
            ? String(msg.sender.id)
            : String(msg.sender_id ?? msg.sender),
        SenderName:
          typeof msg.sender === 'object' && msg.sender ? msg.sender.username : undefined,
        Text: msg.text,
        Timestamp: msg.timestamp,
        MediaType: msg.media_type || undefined,
        MediaUrl: normalizeImageUrl(msg.image_url),
      }));
      setMessages((previous) => {
        const others = previous.filter((m) => m.Session_ID !== sessionId);
        return [...others, ...loaded];
      });
    } catch (err) {
      console.error('Failed to fetch session messages:', err);
    } finally {
      setLoadingMessagesFor((current) => current === sessionId ? null : current);
    }
  }, []);

  const startChatSession = useCallback(
    async (itemId: string): Promise<ChatSession> => {
      const existing = chatSessions.find(
        (session) =>
          session.Item_ID === itemId &&
          (session.Buyer_ID === currentUserId || session.Seller_ID === currentUserId)
      );
      if (existing) return existing;

      const { data } = await axiosInstance.post<ApiConversation>('/conversations/', {
        listing_id: Number(itemId),
      });

      const listingObj =
        typeof data.listing === 'object' && data.listing ? data.listing : undefined;
      const buyerObj = typeof data.buyer === 'object' && data.buyer ? data.buyer : undefined;
      const sellerObj = typeof data.seller === 'object' && data.seller ? data.seller : undefined;

      const session: ChatSession = {
        Session_ID: String(data.id),
        Item_ID: String(listingObj ? listingObj.id : data.listing_id ?? data.listing),
        Buyer_ID: String(buyerObj ? buyerObj.id : data.buyer_id ?? data.buyer),
        Seller_ID: String(sellerObj ? sellerObj.id : data.seller_id ?? data.seller),
        CreatedAt: data.created_at,
        ListingTitle: listingObj?.title,
        ListingPrice: listingObj?.price ? Number(listingObj.price) : undefined,
        ListingImage: normalizeImageUrl(listingObj?.image_url),
        BuyerName: buyerObj?.username,
        SellerName: sellerObj?.username,
        LastMessageText: data.last_message?.text,
        LastMessageTime: data.last_message?.timestamp,
      };

      if (buyerObj) {
        setUsers((prev) =>
          prev.some((u) => u.User_ID === String(buyerObj.id)) ? prev : [...prev, toUserFromApi(buyerObj)]
        );
      }
      if (sellerObj) {
        setUsers((prev) =>
          prev.some((u) => u.User_ID === String(sellerObj.id)) ? prev : [...prev, toUserFromApi(sellerObj)]
        );
      }

      setChatSessions((previous) => {
        const exists = previous.some((s) => s.Session_ID === session.Session_ID);
        return exists ? previous : [session, ...previous];
      });

      return session;
    },
    [chatSessions, currentUserId]
  );

  const sendMessage = useCallback(
    async (
      sessionId: string,
      text: string,
      media?: { type: 'image' | 'video'; url: string; file: File }
    ): Promise<Message> => {
      const trimmed = text.trim();
      const formData = new FormData();
      formData.append('conversation_id', sessionId);
      formData.append('text', trimmed || (media ? `[Shared ${media.type}]` : ''));
      if (media) {
        formData.append('media_type', media.type);
        formData.append('attachment', media.file);
      }
      const { data } = await axiosInstance.post<ApiMessage>('/messages/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const senderId =
        typeof data.sender === 'object' && data.sender
          ? String(data.sender.id)
          : String(data.sender_id ?? data.sender);
      const senderName =
        typeof data.sender === 'object' && data.sender ? data.sender.username : undefined;

      const message: Message = {
        Message_ID: String(data.id),
        Session_ID: String(data.conversation_id ?? data.conversation),
        Sender_ID: senderId,
        SenderName: senderName,
        Text: data.text,
        Timestamp: data.timestamp,
        MediaType: data.media_type || media?.type,
        MediaUrl: normalizeImageUrl(data.image_url) || media?.url,
      };

      setMessages((previous) => [...previous, message]);
      setChatSessions((previous) =>
        previous.map((s) =>
          s.Session_ID === sessionId
            ? { ...s, LastMessageText: message.Text, LastMessageTime: message.Timestamp }
            : s
        )
      );

      return message;
    },
    []
  );

  const addRating = useCallback(async (sessionId: string, _ratedUserId: string, score: number, comment: string) => {
    const { data } = await axiosInstance.post<ApiRating>('/ratings/', {
      conversation: Number(sessionId),
      score,
      comment,
    });
    setRatings((previous) => [...previous, {
      Rating_ID: String(data.id),
      Session_ID: String(data.conversation_id),
      RatedUserID: String(data.rated_user.id),
      RaterUserID: String(data.rater.id),
      Score: data.score,
      Comment: data.comment,
      CreatedAt: data.created_at,
    }]);
    setUsers((previous) => previous.map((candidate) =>
      candidate.User_ID === String(data.rated_user.id)
        ? {
            ...candidate,
            Rating: Number(data.rated_user.rating_average ?? candidate.Rating),
            RatingCount: Number(data.rated_user.rating_count ?? candidate.RatingCount + 1),
          }
        : candidate
    ));
  }, []);
  const hasRated = useCallback((sessionId: string, raterUserId: string) => ratings.some((rating) => rating.Session_ID === sessionId && rating.RaterUserID === raterUserId), [ratings]);
  const getRatingsForUser = useCallback((userId: string) => ratings.filter((rating) => rating.RatedUserID === userId), [ratings]);

  const markNotificationsRead = useCallback(async (sessionId: string) => {
    await axiosInstance.post('/notifications/mark-read/', {
      conversation_id: Number(sessionId),
    });
    setNotifications((previous) => previous.map((notification) =>
      notification.sessionId === sessionId ? { ...notification, unread: false } : notification
    ));
  }, []);

  const value = useMemo<MarketContextValue>(() => ({
    users, getUser, items, isLoadingMarket, fetchListings, getItem, addItem, markItemSold, toggleItemStatus, incrementItemView,
    categories, wishlist, toggleWishlist, isWishlisted,
    recentlyViewedIds, recordViewedItem, chatSessions, messages,
    getSessionsForUser, getSessionById, getMessagesForSession, fetchSessionMessages, loadingMessagesFor, startChatSession,
    sendMessage, ratings, addRating, hasRated, getRatingsForUser,
    notifications,
    unreadNotificationCount: notifications.filter((notification) => notification.unread).length,
    markNotificationsRead,
  }), [
    users, getUser, items, isLoadingMarket, fetchListings, getItem, addItem, markItemSold, toggleItemStatus, incrementItemView,
    categories, wishlist, toggleWishlist, isWishlisted,
    recentlyViewedIds, recordViewedItem, chatSessions, messages,
    getSessionsForUser, getSessionById, getMessagesForSession, fetchSessionMessages, loadingMessagesFor, startChatSession,
    sendMessage, ratings, addRating, hasRated, getRatingsForUser, notifications, markNotificationsRead,
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
  return { chatSessions: market.chatSessions, messages: market.messages, getSessionsForUser: market.getSessionsForUser, getSessionById: market.getSessionById, getMessagesForSession: market.getMessagesForSession, fetchSessionMessages: market.fetchSessionMessages, startChatSession: market.startChatSession, sendMessage: market.sendMessage };
}

export function useRatings() {
  const market = useMarket();
  return { ratings: market.ratings, addRating: market.addRating, hasRated: market.hasRated, getRatingsForUser: market.getRatingsForUser };
}
