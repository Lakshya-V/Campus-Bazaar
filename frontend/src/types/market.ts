// src/types/market.ts
//
// Peer-to-peer campus marketplace data model matching the prompt specification.

export type ListingCondition = 'new' | 'good' | 'fair';
export type ItemStatus = 'AVAILABLE' | 'SOLD';

export interface User {
  User_ID: string;
  Name: string;
  InstitutionalEmail: string;
  Role: string; // e.g., 'Student', 'Graduate Assistant', 'Alumni'
  AvatarSeed: string;
  Rating: number; // average rating (e.g. 4.9)
  RatingCount: number;
  IsVerified: boolean;
}

export interface Item {
  Item_ID: string;
  Seller_ID: string;
  Title: string;
  Category: string; // matches Category.Name
  Price: number;
  Condition: ListingCondition;
  Status: ItemStatus;
  Images: string[];
  Description: string;
  PostedAt: string;
  ViewCount: number;
  WinningBuyer_ID?: string;
}

export interface Category {
  Category_ID: string;
  Name: string;
}

export interface ChatSession {
  Session_ID: string;
  Item_ID: string;
  Buyer_ID: string;
  Seller_ID: string;
  CreatedAt: string;
  SoldToBuyer?: boolean;
}

export interface Message {
  Message_ID: string;
  Session_ID: string;
  Sender_ID: string;
  Text: string;
  Timestamp: string;
}

export interface WishlistItem {
  User_ID: string;
  Item_ID: string;
  SavedAt: string;
}

export interface Rating {
  Rating_ID: string;
  Session_ID: string;
  RatedUserID: string;
  RaterUserID: string;
  Score: number; // 1 to 5
  Comment: string;
  CreatedAt: string;
}
