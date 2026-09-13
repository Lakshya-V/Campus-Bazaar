// src/data/mockMarketData.ts
//
// In-memory mock data store matching the Campus Bazaar schema.
// All users participate dynamically as both buyers and sellers depending on context.

import type { User, Item, Category, ChatSession, Message, WishlistItem, Rating } from '../types/market';

export const INITIAL_CATEGORIES: Category[] = [
  { Category_ID: 'cat_all', Name: 'All Categories' },
  { Category_ID: 'cat_tech', Name: 'Electronics & Tech' },
  { Category_ID: 'cat_books', Name: 'Textbooks' },
  { Category_ID: 'cat_dorm', Name: 'Dorm & Furniture' },
  { Category_ID: 'cat_appliances', Name: 'Appliances' },
  { Category_ID: 'cat_transport', Name: 'Transport & Sports' },
];

export const INITIAL_USERS: User[] = [
  {
    User_ID: 'user_alex',
    Name: 'Alex Rivera',
    InstitutionalEmail: 'alex.rivera@campus.edu',
    Role: 'Undergraduate Senior • CS',
    AvatarSeed: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
    Rating: 4.9,
    RatingCount: 18,
    IsVerified: true,
  },
  {
    User_ID: 'user_sarah',
    Name: 'Sarah Chen',
    InstitutionalEmail: 'sarah.chen@campus.edu',
    Role: 'Graduate Assistant • Data Science',
    AvatarSeed: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&q=80',
    Rating: 4.8,
    RatingCount: 12,
    IsVerified: true,
  },
  {
    User_ID: 'user_jordan',
    Name: 'Jordan Taylor',
    InstitutionalEmail: 'jordan.t@campus.edu',
    Role: 'Pre-Med Student • Biology',
    AvatarSeed: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&q=80',
    Rating: 5.0,
    RatingCount: 24,
    IsVerified: true,
  },
  {
    User_ID: 'user_marcus',
    Name: 'Marcus Vance',
    InstitutionalEmail: 'm.vance@campus.edu',
    Role: 'Sophomore • MechE',
    AvatarSeed: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
    Rating: 4.7,
    RatingCount: 9,
    IsVerified: true,
  },
  {
    User_ID: 'user_dave',
    Name: 'Dave Miller',
    InstitutionalEmail: 'dave.m@campus.edu',
    Role: 'Senior • Civil Engineering',
    AvatarSeed: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80',
    Rating: 4.9,
    RatingCount: 15,
    IsVerified: true,
  },
  {
    User_ID: 'user_chloe',
    Name: 'Chloe Zhao',
    InstitutionalEmail: 'chloe.z@campus.edu',
    Role: 'Junior • Graphic Design',
    AvatarSeed: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80',
    Rating: 5.0,
    RatingCount: 31,
    IsVerified: true,
  },
  {
    User_ID: 'user_kevin',
    Name: 'Kevin Patel',
    InstitutionalEmail: 'kevin.p@campus.edu',
    Role: 'Junior • Electrical Engineering',
    AvatarSeed: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&q=80',
    Rating: 4.8,
    RatingCount: 8,
    IsVerified: true,
  },
];

export const INITIAL_ITEMS: Item[] = [
  {
    Item_ID: 'item_101',
    Seller_ID: 'user_alex', // Current default demo user's own item
    Title: 'TI-84 Plus CE Graphing Calculator',
    Category: 'Electronics & Tech',
    Price: 65,
    Condition: 'good',
    Status: 'AVAILABLE',
    Images: ['https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&q=80'],
    Description:
      'Mint condition color screen calculator, required for calculus and linear algebra. Includes USB charging cable and protective slide cover. Battery holds full charge for weeks.',
    PostedAt: '2026-09-10T10:00:00Z',
    ViewCount: 42,
  },
  {
    Item_ID: 'item_102',
    Seller_ID: 'user_sarah',
    Title: 'Sony WH-1000XM5 Noise Canceling Headphones',
    Category: 'Electronics & Tech',
    Price: 240,
    Condition: 'new',
    Status: 'AVAILABLE',
    Images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'],
    Description:
      'Black finish, purchased 4 months ago for library focus. Industry-leading active noise canceling, pristine high-resolution sound, includes original magnetic carry case and 3.5mm aux audio cord.',
    PostedAt: '2026-09-11T12:30:00Z',
    ViewCount: 98,
  },
  {
    Item_ID: 'item_103',
    Seller_ID: 'user_jordan',
    Title: 'Organic Chemistry, 8th Edition + Solutions Manual',
    Category: 'Textbooks',
    Price: 45,
    Condition: 'good',
    Status: 'AVAILABLE',
    Images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80'],
    Description:
      'Authors: Wade & Simek. Essential textbook for CHEM 210 and CHEM 212. Complete solutions manual included. Zero missing pages, very light pencil annotations on reaction mechanisms in Chapter 4.',
    PostedAt: '2026-09-11T15:15:00Z',
    ViewCount: 76,
  },
  {
    Item_ID: 'item_104',
    Seller_ID: 'user_alex', // Another item by Alex Rivera
    Title: 'IKEA MICKE Study Desk — Pure White',
    Category: 'Dorm & Furniture',
    Price: 40,
    Condition: 'good',
    Status: 'AVAILABLE',
    Images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80'],
    Description:
      'Clean minimalist white desk with integrated cable management slot and smooth-gliding drawer. Compact footprint engineered for standard campus dorm bedrooms.',
    PostedAt: '2026-09-08T09:45:00Z',
    ViewCount: 34,
  },
  {
    Item_ID: 'item_105',
    Seller_ID: 'user_marcus',
    Title: 'Midea 3.3 Cu. Ft. Mini Fridge with Freezer',
    Category: 'Appliances',
    Price: 70,
    Condition: 'good',
    Status: 'AVAILABLE',
    Images: ['https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=800&q=80'],
    Description:
      'Whisper quiet compressor, Energy Star certified, with separate top freezer section that actually makes ice. Sanitized inside and out, perfect for freshman dorm rooms.',
    PostedAt: '2026-09-09T14:20:00Z',
    ViewCount: 88,
  },
  {
    Item_ID: 'item_106',
    Seller_ID: 'user_dave',
    Title: 'Trek FX 2 Commuter Hybrid Bicycle (Medium)',
    Category: 'Transport & Sports',
    Price: 210,
    Condition: 'good',
    Status: 'AVAILABLE',
    Images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80'],
    Description:
      'Lightweight Alpha Gold aluminum frame, 18-speed Shimano drivetrain, hydraulic disc brakes with instant stopping power. Smooth campus commuter. Heavy-duty U-lock included.',
    PostedAt: '2026-09-07T11:00:00Z',
    ViewCount: 112,
  },
  {
    Item_ID: 'item_107',
    Seller_ID: 'user_chloe',
    Title: 'Apple iPad Air M1 (64GB, Space Gray) + Pencil 2',
    Category: 'Electronics & Tech',
    Price: 410,
    Condition: 'new',
    Status: 'AVAILABLE',
    Images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80'],
    Description:
      'Pristine condition iPad Air with blazing M1 chip. Paper-feel matte screen protector installed since unboxing. Bundled with genuine Apple Pencil 2 and magnetic smart folio case.',
    PostedAt: '2026-09-12T16:40:00Z',
    ViewCount: 154,
  },
  {
    Item_ID: 'item_108',
    Seller_ID: 'user_kevin',
    Title: 'Dell UltraSharp 27" 4K USB-C Monitor',
    Category: 'Electronics & Tech',
    Price: 185,
    Condition: 'good',
    Status: 'AVAILABLE',
    Images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80'],
    Description:
      'Power your laptop and transmit 4K 60Hz display over a single USB-C cable. 99% sRGB color gamut with fully adjustable ergonomic pivot and height stand.',
    PostedAt: '2026-09-06T08:10:00Z',
    ViewCount: 65,
  },
  {
    Item_ID: 'item_109',
    Seller_ID: 'user_jordan',
    Title: 'Campbell Biology (12th Global Edition)',
    Category: 'Textbooks',
    Price: 38,
    Condition: 'fair',
    Status: 'AVAILABLE',
    Images: ['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80'],
    Description:
      'Standard textbook for General Biology 101/102. Solid binding, completely readable without tears, some yellow highlighter in the genetics unit.',
    PostedAt: '2026-09-05T13:05:00Z',
    ViewCount: 29,
  },
];

export const INITIAL_CHAT_SESSIONS: ChatSession[] = [
  {
    Session_ID: 'session_001',
    Item_ID: 'item_101', // TI-84
    Buyer_ID: 'user_sarah',
    Seller_ID: 'user_alex', // Alex is the seller here
    CreatedAt: '2026-09-12T09:00:00Z',
  },
  {
    Session_ID: 'session_002',
    Item_ID: 'item_102', // Sony Headphones
    Buyer_ID: 'user_alex', // Alex is the buyer here
    Seller_ID: 'user_sarah',
    CreatedAt: '2026-09-12T14:30:00Z',
  },
  {
    Session_ID: 'session_003',
    Item_ID: 'item_103', // Chem Textbook
    Buyer_ID: 'user_marcus',
    Seller_ID: 'user_jordan',
    CreatedAt: '2026-09-11T18:20:00Z',
  },
];

export const INITIAL_MESSAGES: Message[] = [
  // Session 001: Sarah asking Alex about the TI-84
  {
    Message_ID: 'msg_1001',
    Session_ID: 'session_001',
    Sender_ID: 'user_sarah',
    Text: 'Hi Alex! Is the TI-84 still available? Would you consider $60 for cash pickup at the campus library?',
    Timestamp: '2026-09-12T09:01:00Z',
  },
  {
    Message_ID: 'msg_1002',
    Session_ID: 'session_001',
    Sender_ID: 'user_alex',
    Text: 'Hey Sarah, yes it is! $60 works for me if we can meet by the 2nd floor study tables around 4 PM.',
    Timestamp: '2026-09-12T09:15:00Z',
  },
  {
    Message_ID: 'msg_1003',
    Session_ID: 'session_001',
    Sender_ID: 'user_sarah',
    Text: 'Perfect! See you at 4 PM by the 2nd floor entrance.',
    Timestamp: '2026-09-12T09:18:00Z',
  },

  // Session 002: Alex inquiring about Sarah's Sony Headphones
  {
    Message_ID: 'msg_2001',
    Session_ID: 'session_002',
    Sender_ID: 'user_alex',
    Text: 'Hello Sarah! I noticed your XM5 headphones. Does it still have the original warranty receipt?',
    Timestamp: '2026-09-12T14:31:00Z',
  },
  {
    Message_ID: 'msg_2002',
    Session_ID: 'session_002',
    Sender_ID: 'user_sarah',
    Text: 'Hi Alex! Yes, I have the digital Best Buy receipt and can forward the PDF copy upon pickup.',
    Timestamp: '2026-09-12T14:40:00Z',
  },

  // Session 003: Marcus asking Jordan about Chem book
  {
    Message_ID: 'msg_3001',
    Session_ID: 'session_003',
    Sender_ID: 'user_marcus',
    Text: 'Hey Jordan, does this copy include the online homework access code?',
    Timestamp: '2026-09-11T18:21:00Z',
  },
  {
    Message_ID: 'msg_3002',
    Session_ID: 'session_003',
    Sender_ID: 'user_jordan',
    Text: 'The online code was already redeemed for last semester, so this is just the physical book and printed solutions manual.',
    Timestamp: '2026-09-11T18:35:00Z',
  },
];

export const INITIAL_WISHLIST: WishlistItem[] = [
  {
    User_ID: 'user_alex',
    Item_ID: 'item_102', // Alex has Sarah's headphones saved
    SavedAt: '2026-09-12T10:00:00Z',
  },
  {
    User_ID: 'user_alex',
    Item_ID: 'item_106', // Alex has Dave's bike saved
    SavedAt: '2026-09-12T11:00:00Z',
  },
];

export const INITIAL_RATINGS: Rating[] = [
  {
    Rating_ID: 'rating_01',
    Session_ID: 'session_past_01',
    RatedUserID: 'user_alex',
    RaterUserID: 'user_chloe',
    Score: 5,
    Comment: 'Super fast meetup outside the campus center! Item was spotless as described.',
    CreatedAt: '2026-09-01T16:00:00Z',
  },
  {
    Rating_ID: 'rating_02',
    Session_ID: 'session_past_02',
    RatedUserID: 'user_sarah',
    RaterUserID: 'user_kevin',
    Score: 5,
    Comment: 'Great communication and verified student. Highly recommend trading with Sarah!',
    CreatedAt: '2026-09-02T11:30:00Z',
  },
];
