// src/types/api.ts
//
// Shared TypeScript interfaces for the Campus Bazaar API, matching the
// endpoints documented in the Campus Bazaar Blueprint (v2).

/** Generic DRF-style paginated list response. */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ListingCondition = 'new' | 'good' | 'fair';

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ListingImage {
  id: number;
  url: string;
  order: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
  date_joined?: string;
}

/** Minimal seller/owner info as embedded in a Listing response. */
export interface ListingOwner {
  id: number;
  username: string;
  avatar_url?: string | null;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  /**
   * DRF DecimalField serializes as a string by default.
   * Convert with Number(listing.price) before doing arithmetic.
   */
  price: string;
  condition: ListingCondition;
  category: Category;
  images: ListingImage[];
  owner: ListingOwner;
  is_favorited: boolean;
  created_at: string;
  updated_at: string;
}

/** Payload for POST/PUT /api/listings/. */
export interface ListingInput {
  title: string;
  description: string;
  price: number;
  condition: ListingCondition;
  category: number; // category id
}

export interface Favorite {
  id: number;
  listing: Listing;
  created_at: string;
}

export interface Conversation {
  id: number;
  listing: Pick<Listing, 'id' | 'title' | 'images'>;
  participants: User[];
  last_message: Message | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation: number; // conversation id
  sender: User;
  content: string;
  is_read: boolean;
  created_at: string;
}

/** Payload for POST /api/messages/. */
export interface MessageInput {
  conversation: number;
  content: string;
}

/** GET /api/conversations/unread-count/ */
export interface UnreadCountResponse {
  unread_count: number;
}

/** POST /api/auth/login/ response shape. */
export interface LoginResponse {
  access: string;
  user: User;
}

/** POST /api/auth/refresh/ response shape. */
export interface RefreshResponse {
  access: string;
}