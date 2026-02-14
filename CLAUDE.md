# DineDate 2026

"Blind Date x Restaurant Discovery" mobile app. Users create date orders at partner restaurants, others apply, matches happen anonymously (DiceBear anime avatars), real identities revealed only after mutual "want to meet again" reviews.

## Rules

- **Language**: ALL UI text in **Vietnamese with proper diacritics** (dấu). No ASCII-only Vietnamese.
- **Color scheme**: Romantic **pink + white**. Primary `#EC4899`. Use `Colors.*` tokens from `theme.ts` — never hardcode hex.
- **No mock data**: Every hook tries Supabase first. Show real empty states when data is empty. `src/mocks/` has been deleted.
- **No hardcoded credentials**: Supabase URL/key loaded from `process.env.EXPO_PUBLIC_*` in `.env`. No fallback strings.
- **Auth storage**: `expo-secure-store` on native, `localStorage` on web. Never `AsyncStorage` for tokens.

## Tech Stack

- Expo SDK 54, React 19.1, expo-router 6, React Native 0.81.5
- `expo-image` (not `<Image>` from RN), native `StyleSheet` (not Tailwind/NativeWind)
- Supabase (auth + postgres + RLS), `@supabase/supabase-js` v2
- Supabase project: `https://cgnbicnayzifjyupweki.supabase.co`

## Project Structure

```
mobile/
├── .env                          # EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
├── eas.json                      # EAS Build — all 3 profiles have Supabase env vars
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout + ErrorBoundary export
│   ├── (auth)/login.tsx          # Login + "Quên mật khẩu?" link
│   ├── (auth)/register.tsx
│   ├── (tabs)/                   # 4-tab navigation (explore, create, bookings, profile)
│   ├── date/[id].tsx             # Date order detail
│   ├── restaurants/[id].tsx      # Restaurant detail
│   ├── review/[id].tsx           # Post-date review (person + restaurant 4-rating)
│   ├── connection/[id].tsx       # Connection detail (real Supabase data)
│   ├── wallet.tsx, vip.tsx, connections.tsx, my-reviews.tsx
│   ├── settings.tsx              # Password reset + account deletion
│   ├── safety.tsx, support.tsx
│   └── all-restaurants.tsx, all-date-orders.tsx
├── src/
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client (SecureStore, env vars, no hardcoded keys)
│   │   ├── dicebear.ts           # DiceBear avatar generator
│   │   ├── format.ts             # formatPrice, formatDate
│   │   └── haptics.ts            # Haptic feedback
│   ├── constants/
│   │   ├── theme.ts              # Colors, Spacing, FontSize, BorderRadius, PLATFORM_FEE_PER_PERSON
│   │   └── types.ts              # All TypeScript interfaces
│   ├── contexts/
│   │   └── auth-context.tsx      # Auth provider (login, register, logout, resetPassword, deleteAccount)
│   ├── hooks/
│   │   ├── use-restaurants.ts    # useRestaurants, useCombos
│   │   ├── use-date-orders.ts    # useDateOrders, useMyDateOrders
│   │   ├── use-applications.ts   # useApplyToDate
│   │   ├── use-reviews.ts       # useSubmitReview (4 restaurant ratings), useMyReviews
│   │   ├── use-wallet.ts         # useWallet (balance + transactions)
│   │   └── use-connections.ts    # useConnections (user1_id/user2_id JOIN date_orders)
│   └── components/
│       ├── auth-guard.tsx
│       ├── date-order-card.tsx
│       └── restaurant-card.tsx
supabase/migrations/
├── 20260214000000_reset_database.sql
├── 20260214000100_restaurants_and_combos.sql    # restaurants + combos tables
├── 20260214000200_date_orders.sql               # date_orders + applications + table_bookings
├── 20260214000300_reviews_and_connections.sql    # person_reviews + restaurant_reviews + mutual_connections + triggers
├── 20260214000400_vip_subscriptions.sql
└── 20260214000500_wallet_transactions.sql       # wallet_transactions table
```

## Database Schema — Critical Column Names

These have caused bugs before. Always verify against the migration files.

### `person_reviews`
- `date_order_id` (NOT `order_id`)
- `reviewer_id` ✓
- `reviewed_id` (NOT `target_user_id`)
- `rating`, `comment`, `want_to_meet_again`

### `restaurant_reviews`
- `date_order_id` (NOT `order_id`)
- `reviewer_id` (NOT implicit)
- `restaurant_id`
- 4 separate NOT NULL ratings: `food_rating`, `ambiance_rating`, `service_rating`, `overall_rating`
- `comment`, `images`

### `mutual_connections`
- `user1_id`, `user2_id` (NOT `user_id`/`other_user_id`)
- `date_order_id`, `connected_at`
- NO `restaurant_id`, `date_time` — must JOIN through `date_orders` -> `restaurants`

### `date_orders`
- `restaurant_commission` INTEGER NOT NULL (no default — must calculate: `combo_price * commission_rate`)
- `expires_at` TIMESTAMPTZ NOT NULL (must send — e.g. 1h before `date_time`)
- `preferred_gender` nullable, CHECK IN ('male', 'female', 'other')
- `applicant_count` defaults to 0

### `wallet_transactions`
- `user_id`, `type` (topup/payment/escrow/refund/withdraw), `amount`, `description`
- `date_order_id` nullable FK, `status` (pending/completed/failed/cancelled)

## Auth Context API

```typescript
const { user, session, isLoading, isAuthenticated,
        login, register, logout, refreshProfile,
        resetPassword, deleteAccount } = useAuth();
```

- `resetPassword(email)` — calls `supabase.auth.resetPasswordForEmail`
- `deleteAccount()` — deletes user data from all tables, then signs out

## Completed Work (all blockers fixed)

- B1: Supabase credentials in `.env` + SecureStore auth storage
- B2: All mock data removed — hooks return `[]` on error, `console.warn` for debugging
- B3: Schema mismatches fixed (column names, 4 restaurant ratings, connection JOINs)
- B4: `wallet_transactions` migration created
- B5: EAS build profiles have Supabase env vars
- B6: `ErrorBoundary` exported from `_layout.tsx`
- B7: Password reset flow (login screen link + settings)
- B8: Date order creation sends `restaurant_commission`, `expires_at`, `preferred_gender`
- W5: Account deletion implemented (double-confirm, deletes data, signs out)
- W6: `connection/[id].tsx` fetches real Supabase data with JOINs

## Launch Fixes Applied (migration 20260214000600)

- **C1**: RLS enabled on `public.users` with proper policies (read own, update own, admin bypass)
- **C2**: `reviewer_id` now explicitly sent in `use-reviews.ts` + DEFAULT `auth.uid()` in migration
- **C3**: `update_user_rating` trigger fixed (`average_rating` → `rating` column name)
- **H1**: Wallet top-up calls `request_topup()` RPC (pending → admin confirms via `confirm_topup()`)
- **H2**: VIP upgrade/downgrade via `upgrade_vip()` / `downgrade_vip()` RPCs (deducts wallet, creates subscription)
- **H3**: `applicant_count` auto-incremented via trigger on `date_order_applications` INSERT/DELETE
- **H4**: All FK references to `auth.users` now have ON DELETE CASCADE (or SET NULL for matched_user_id)
- **H5**: `handle_new_user()` trigger recreated — auto-creates `public.users` row on signup
- **H7**: Reports table + `submit_report()` RPC — safety/support screens now save to backend
- **M4**: `email_notifications` column on `users` — settings toggle persists to Supabase
- **M5**: Separate index on `mutual_connections.user2_id` + `person_reviews.reviewer_id`
- **M7**: Hardcoded Unsplash fallback removed — uses local placeholder asset
- **M8**: `expire_stale_date_orders()` function to mark expired orders (call via pg_cron or Edge Function)
- **Bonus**: `updated_at` trigger on `restaurants` and `combos`, commission rate constraint

## Remaining (not blockers)

- Submit credentials in `eas.json` still empty (appleId, ascAppId, appleTeamId, serviceAccountKeyPath)
- In-app messaging between connections (placeholder alert)
- Profile editing screen (placeholder alert)
- Dark mode (placeholder)
- Push notifications not configured
- Supabase Edge Function for hard-deleting `auth.users` row (current deleteAccount only deletes public data + signs out)
- Payment gateway integration (MoMo/bank) — top-up creates pending tx, needs external webhook to auto-confirm
- pg_cron setup for `expire_stale_date_orders()` scheduled execution
