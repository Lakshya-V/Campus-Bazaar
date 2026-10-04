/** Generic DRF-style paginated list response. */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ListingCondition = 'Brand New' | 'Like New' | 'Good' | 'Fair Use' | 'Books & Notes';
export type ListingStatus = 'AVAILABLE' | 'SOLD';

export interface User {
  id: number;
  username: string;
  university_email: string;
  hostel_building: string;
  phone_number: string;
  is_verified_student: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

/** GET /api/listings/ response. */
export interface Listing {
  id: number;
  seller: User;
  seller_id: number;
  category: Category;
  title: string;
  description: string;
  price: string;
  condition: ListingCondition;
  status: ListingStatus;
  image_url: string;
  is_favorited: boolean;
  created_at: string;
}

/** POST /api/listings/ request. */
export interface ListingInput {
  title: string;
  description: string;
  price: number;
  condition: ListingCondition;
  category_id: number;
  image?: File;
}

export interface ConversationListing {
  id: number;
  title: string;
  price: string;
  condition: ListingCondition;
  status: ListingStatus;
  image_url: string;
  category: string;
  category_id: number;
  seller_id: number;
}

export interface LastMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  text: string;
  image_url?: string;
  media_type?: 'image' | 'video' | '';
  timestamp: string;
}

/** GET/POST /api/conversations/ response. */
export interface Conversation {
  id: number;
  listing: ConversationListing;
  listing_id: number;
  buyer: User;
  buyer_id: number;
  seller: User;
  seller_id: number;
  last_message: LastMessage | null;
  created_at: string;
}

/** POST /api/conversations/ request. */
export interface ConversationInput {
  listing_id: number;
}

export interface Message {
  id: number;
  conversation: number;
  conversation_id: number;
  sender: User;
  sender_id: number;
  text: string;
  timestamp: string;
}

/** GET/POST /api/messages/ request. */
export interface MessageInput {
  conversation: number;
  text: string;
}

export interface Favorite {
  id: number;
  listing: Listing;
}

export interface FavoriteToggleResponse {
  favorited: boolean;
  listing_id: number;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RefreshResponse {
  access: string;
}
