// src/data/mockListings.ts
//
// Fallback data so the browse/listings grid has rich items to render —
// and the Apple3DCard tilt/gloss/lighting is visible immediately —
// whenever the backend call fails or returns an empty set.

import type { Listing } from '../types/api';

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 101,
    title: 'TI-84 Plus CE Graphing Calculator',
    description: 'Mint condition color screen calculator, required for calculus and linear algebra. Includes charging cable and slide case.',
    price: '65.00',
    condition: 'good',
    is_favorited: false,
    category: {
      id: 1,
      name: 'Electronics & Tech',
      slug: 'electronics',
    },
    images: [
      {
        id: 1,
        url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 1,
      username: 'alex_mit',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    },
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 102,
    title: 'Sony WH-1000XM5 Noise Canceling Headphones',
    description: 'Black, purchased 4 months ago for library study sessions. Industry-leading ANC, pristine sound, with original carry case and cables.',
    price: '240.00',
    condition: 'new',
    is_favorited: true,
    category: {
      id: 1,
      name: 'Electronics & Tech',
      slug: 'electronics',
    },
    images: [
      {
        id: 2,
        url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 2,
      username: 'sarah_c',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&q=80',
    },
    created_at: '2026-09-02T12:30:00Z',
    updated_at: '2026-09-02T12:30:00Z',
  },
  {
    id: 103,
    title: 'Organic Chemistry, 8th Edition + Solutions Manual',
    description: 'Wade & Simek. Essential for CHEM 210/212. No missing pages, very minimal highlighter marks in chapters 3-5.',
    price: '45.00',
    condition: 'good',
    is_favorited: false,
    category: {
      id: 2,
      name: 'Textbooks',
      slug: 'textbooks',
    },
    images: [
      {
        id: 3,
        url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 3,
      username: 'jordan_premed',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&q=80',
    },
    created_at: '2026-09-03T15:15:00Z',
    updated_at: '2026-09-03T15:15:00Z',
  },
  {
    id: 104,
    title: 'IKEA MICKE Study Desk — Pure White',
    description: 'Clean minimalist white desk with cable management slot and drawer. Perfect compact size for campus dorms and student apartments.',
    price: '40.00',
    condition: 'good',
    is_favorited: false,
    category: {
      id: 3,
      name: 'Dorm & Furniture',
      slug: 'furniture',
    },
    images: [
      {
        id: 4,
        url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 4,
      username: 'elena_arch',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    },
    created_at: '2026-09-04T09:45:00Z',
    updated_at: '2026-09-04T09:45:00Z',
  },
  {
    id: 105,
    title: 'Midea 3.3 Cu. Ft. Mini Fridge with Freezer',
    description: 'Whisper quiet, energy efficient, separate small freezer section. Spotless interior, kept sanitized and clean.',
    price: '70.00',
    condition: 'good',
    is_favorited: true,
    category: {
      id: 4,
      name: 'Appliances',
      slug: 'appliances',
    },
    images: [
      {
        id: 5,
        url: 'https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=800&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 5,
      username: 'marcus_eng',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    },
    created_at: '2026-09-05T14:20:00Z',
    updated_at: '2026-09-05T14:20:00Z',
  },
  {
    id: 106,
    title: 'Trek FX 2 Commuter Hybrid Bicycle (Medium)',
    description: 'Lightweight aluminum frame, 18-speed Shimano drivetrain, hydraulic disc brakes. Perfect for campus commuting between classes. Kryptonite U-lock included.',
    price: '210.00',
    condition: 'good',
    is_favorited: false,
    category: {
      id: 5,
      name: 'Transport & Sports',
      slug: 'transport',
    },
    images: [
      {
        id: 6,
        url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 6,
      username: 'dave_senior',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    },
    created_at: '2026-09-06T11:00:00Z',
    updated_at: '2026-09-06T11:00:00Z',
  },
  {
    id: 107,
    title: 'Apple iPad Air M1 (64GB, Space Gray) + Pencil',
    description: 'Like new condition with matte paper-feel screen protector applied on day one. Comes with Apple Pencil 2 and magnetic folio case.',
    price: '410.00',
    condition: 'new',
    is_favorited: false,
    category: {
      id: 1,
      name: 'Electronics & Tech',
      slug: 'electronics',
    },
    images: [
      {
        id: 7,
        url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 7,
      username: 'chloe_design',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
    },
    created_at: '2026-09-07T16:40:00Z',
    updated_at: '2026-09-07T16:40:00Z',
  },
  {
    id: 108,
    title: 'Dell UltraSharp 27" 4K USB-C Monitor',
    description: 'Charges your laptop over a single USB-C cable while displaying crystal clear 4K resolution. Height-adjustable stand and rotate-to-vertical pivot.',
    price: '185.00',
    condition: 'good',
    is_favorited: false,
    category: {
      id: 1,
      name: 'Electronics & Tech',
      slug: 'electronics',
    },
    images: [
      {
        id: 8,
        url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 8,
      username: 'kevin_cs',
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&q=80',
    },
    created_at: '2026-09-08T08:10:00Z',
    updated_at: '2026-09-08T08:10:00Z',
  },
  {
    id: 109,
    title: 'Campbell Biology (12th Global Edition)',
    description: 'Required text for BIO 150/151. Hardcover edition, tight binding, completely legible with zero tears or water stains.',
    price: '38.00',
    condition: 'fair',
    is_favorited: false,
    category: {
      id: 2,
      name: 'Textbooks',
      slug: 'textbooks',
    },
    images: [
      {
        id: 9,
        url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
        order: 0,
      },
    ],
    owner: {
      id: 9,
      username: 'maya_neuro',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80',
    },
    created_at: '2026-09-09T13:05:00Z',
    updated_at: '2026-09-09T13:05:00Z',
  },
];