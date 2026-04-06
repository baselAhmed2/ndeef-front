+++# Laundry Service App UI - Project Analysis

## Purpose

This project is a frontend prototype for a laundry marketplace called `Nadeef`.
It lets a user:

- browse nearby laundries
- open a laundry profile and view services
- place an order
- pay or choose cash
- track and review orders
- manage profile, billing, and support pages

The app is currently built as a demo-first UI, not a production-connected system.

## Stack

- Next.js 15 with App Router
- React 18
- TypeScript
- Tailwind CSS v4
- Framer Motion via `motion/react`
- Radix UI based components in `src/app/components/ui`
- `lucide-react` for icons
- `sonner` for toasts

## Project Shape

The important app code lives under `src/app`.

- `src/app/layout.tsx`
  Root layout. Loads global CSS, wraps the app in `AuthProvider`, and mounts the toast system.
- `src/app/(app)/layout.tsx`
  Shared shell for routed pages. Handles page transitions, top navigation, and auth-page behavior.
- `src/app/(app)/**/page.tsx`
  Actual Next.js routes.
- `src/app/pages/*.tsx`
  Screen implementations. Most route files simply re-export these page components.
- `src/app/components`
  Shared navigation, helpers, order status UI, modals, and generated Radix UI primitives.
- `src/app/context/AuthContext.tsx`
  Demo auth state using `localStorage`.
- `src/app/data/laundries.ts`
  Mock laundry catalog and service pricing.
- `src/app/data/sampleOrders.ts`
  Mock order persistence and order helpers using `localStorage`.

## Route Map

Current routed pages under `src/app/(app)`:

- `/` -> Home
- `/login` -> Login
- `/signup` -> Signup
- `/nearby` -> Nearby laundries
- `/laundry/[id]` -> Laundry details
- `/order/[laundryId]` -> Create order
- `/payment` -> Payment page
- `/orders` -> Orders list
- `/track-order/[id]` -> Order tracking
- `/rate-order/[id]` -> Rating flow
- `/profile` -> Profile
- `/billing` -> Billing
- `/help` -> Help
- `/services` -> Services

There are also extra page components in `src/app/pages` that are not clearly routed today, including pages like `Account`, `Preferences`, `Refer`, `Notifications`, `Schedule`, and others. That means the codebase contains both active screens and parked/unused screens.

## Main User Flow

### 1. Landing / discovery

`src/app/pages/Home.tsx`

- marketing-heavy landing page
- uses motion animations heavily
- shows nearby laundries preview from mock data
- if a user is logged in, shows a personalized welcome
- links users into `/nearby` or auth

### 2. Find laundries

`src/app/pages/NearbyLaundries.tsx`

- simulates location permission
- simulates GPS lookup
- simulates laundry fetching
- supports UI flow states such as permission request, locating, loading, errors, and success
- filters mock laundries to active items

This is still frontend simulation. No browser geolocation API or backend request is wired in yet.

### 3. Laundry details

`src/app/pages/LaundryDetails.tsx`

- fetches one laundry from local mock data by route param
- validates status and service availability
- groups services by category
- links a selected service into `/order/[laundryId]?service=...`

### 4. Order creation

`src/app/pages/OrderPage.tsx`

- requires login
- reads the selected laundry and service from route + query params
- collects pickup and delivery info
- calculates subtotal, delivery fee, and total
- stores pending order data in `localStorage` when card payment is chosen
- saves the order directly when cash is chosen

### 5. Payment / orders / tracking

These screens continue the mock order lifecycle using `src/app/data/sampleOrders.ts`.

- `payment` finalizes pending order data
- `orders` reads stored orders
- `track-order/[id]` shows order progress
- `rate-order/[id]` lets users rate delivered orders

## State and Data Model

### Auth

`src/app/context/AuthContext.tsx`

Auth is fully demo-based:

- session is stored in `localStorage` under `nadeef_user`
- login accepts any email/password after a delay
- signup creates a local user object
- social login is simulated
- no API, token, refresh flow, or server auth exists yet

Important behavior:

- `src/app/(app)/layout.tsx` waits for auth readiness before rendering
- logged-in users trying to open `/login` or `/signup` are redirected to `/`

### Laundry data

`src/app/data/laundries.ts`

Defines:

- `Laundry`
- `ServiceItem`
- category labels and ordering
- a static list of laundries and services

This file is effectively the product catalog source for the current app.

### Orders

`src/app/data/sampleOrders.ts`

Defines:

- `Order`
- `OrderStatus`
- `PaymentStatus`
- sample seeded orders
- helpers like `getOrders`, `getOrder`, `saveOrder`, and `cancelOrder`

Persistence is local-only:

- `nadeef_orders`
- `nadeef_pending_order`

## Shared UI and Navigation

### Top navigation

`src/app/components/TopNav.tsx`

- fixed header
- desktop and mobile navigation
- auth-aware menu
- shows sign-in/sign-up when logged out
- shows account menu and logout when logged in

### Bottom navigation

`src/app/components/BottomNav.tsx`

- mobile-style bottom nav
- appears to be older or less integrated than `TopNav`
- currently checks `location.pathname` directly instead of relying on `usePathname()`

### UI primitives

`src/app/components/ui/*`

This folder contains a large set of reusable Radix-based primitives, likely scaffolded from a UI generator or starter kit. Many may not be actively used yet, but they provide a base for future consistency.

### Image fallback

`src/app/components/figma/ImageWithFallback.tsx`

Used across image-heavy screens to handle missing images safely.

## Styling Approach

- Global styles are minimal in `src/app/globals.css`
- Tailwind utilities do most of the styling
- Brand colors used repeatedly:
  - `#1D6076`
  - `#0d3d50`
  - `#EBA050`
- The visual design is strongly marketing/UI driven with cards, gradients, rounded corners, and animated transitions

## Architectural Observations

### What is working well

- Clear separation between route files and screen files
- App Router structure is already in place
- Demo data is centralized
- Auth and order state are simple to understand
- The main user journey is coherent
- The UI has a strong visual identity

### Current limitations

- No backend integration
- No real authentication or payment processing
- No API layer or server actions
- Heavy reliance on `localStorage`
- Many async flows are simulated with `setTimeout`
- Some screens in `src/app/pages` are not connected to App Router routes
- The repo still contains import/export leftovers from a design-export workflow

## Technical Risks / Cleanup Opportunities

### 1. Encoding issues

Several files contain broken characters like `â€”`, `â€“`, and similar mojibake text. This usually means UTF-8 text was saved or read with the wrong encoding. It should be cleaned up before production polish.

### 2. Mixed maturity levels in the codebase

The project combines:

- polished routed pages
- generated UI utility components
- imported prototype files under `src/imports`
- extra page components that may not be active

This is normal for a fast-moving prototype, but a cleanup pass would make the repo easier to maintain.

### 3. Demo logic mixed into UI screens

A lot of fetching, validation, and simulated state transitions live directly inside page components. For a production version, that logic should move into:

- services
- hooks
- API clients
- server actions or route handlers

### 4. Client-heavy architecture

Most screens are client components. That is fine for a prototype, but it means:

- more browser-side logic
- less SSR/data loading structure
- more reliance on runtime `localStorage`

### 5. Inconsistent navigation patterns

`TopNav` is the main shell component, but there are older secondary nav components and some pages that may still follow slightly different patterns.

## Recommended Folder Mental Model

If you want to understand or extend this project quickly, think of it in this order:

1. `src/app/(app)` tells you what routes actually exist.
2. `src/app/pages` contains the screen implementations.
3. `src/app/data` contains the mock business data.
4. `src/app/context` contains auth/session behavior.
5. `src/app/components` contains reusable UI building blocks.

## Best Next Steps

If this project is going to keep growing, the highest-value improvements would be:

1. Create a `docs/` area and move long-term project knowledge there.
2. Decide which screens in `src/app/pages` are active vs archived.
3. Clean up text encoding issues.
4. Extract mock async logic into reusable hooks/services.
5. Add a real backend contract for auth, laundries, orders, and payments.
6. Add a route inventory and component ownership notes.

## Suggested Use Of This File

Use this Markdown file as the persistent project memory for:

- onboarding future AI sessions
- onboarding teammates
- planning refactors
- identifying which parts are demo-only
- deciding where new features should live

## Quick Summary

This is a strong UI prototype for a laundry ordering app built with Next.js App Router, TypeScript, Tailwind, motion, and local mock state. The core user journey is implemented and visually polished, but the project is still mostly frontend simulation backed by `localStorage` rather than a real backend.
