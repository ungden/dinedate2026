# Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom configuration (custom gradients, colors, glassmorphism)
- **State Management**: Zustand (with persist middleware)
- **Authentication & Backend**: Supabase
- **Icons**: Lucide React
- **Animation**: Framer Motion
- **Utilities**: `clsx` and `tailwind-merge` for class composition

# Development Rules

## 1. Styling & UI
- **Library**: Use **Tailwind CSS** exclusively.
- **Design Tokens**: Utilize the custom color palette defined in `tailwind.config.js` and `globals.css` (e.g., `text-primary-600`, `bg-gradient-primary`, `bg-gradient-premium`).
- **Class Merging**: Always use the `cn()` utility from `@/lib/utils` when combining conditional classes or accepting `className` props.
- **Effects**: Use specific utility classes for visual effects like `.glass` (glassmorphism) and `.hide-scrollbar` found in `globals.css`.

## 2. Components & Structure
- **Client Components**: Place complex page logic in `src/components/pages/[PageName]Client.tsx` and import them into the `src/app/` page files.
- **Icons**: Use **Lucide React** for all iconography.
- **Images**: Use `next/image` with proper sizing or `fill` prop for responsive images.

## 3. State Management
- **Global State**: Use **Zustand** (`src/hooks/useDateStore.ts`) for app data like requests, bookings, and notifications.
- **Authentication**: Use `useAuth()` hook from `@/contexts/AuthContext` for user sessions.
- **Persistence**: Ensure critical store data is persisted via the Zustand persist middleware configuration.

## 4. Animation
- **Library**: Use **Framer Motion** for complex interactions and transitions.
- **Import**: Import `motion` and `AnimatePresence` from `@/lib/motion` (which wraps framer-motion) rather than the package directly.
- **CSS Animations**: Use defined CSS animation classes (e.g., `animate-fadeIn`, `animate-pulse-ring`) for simple standard animations.

## 5. Data & Types
- **Types**: Define and import shared interfaces from `@/types/index.ts`.
- **Formatting**: Use utility functions in `@/lib/utils.ts` for:
  - Currency: `formatCurrency`
  - Dates: `formatDate`, `formatRelativeTime`
  - VIP/Activity Styling: `getVIPBadgeColor`, `getActivityColor`
- **Mock Data**: When building new features without backend readiness, use/extend data in `src/mocks/`.