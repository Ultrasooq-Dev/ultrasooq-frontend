# Ultrasooq Frontend

Customer-facing marketplace frontend for the Ultrasooq B2B/B2C platform. Supports buyers, sellers, freelancers, and company accounts with full e-commerce workflows including product browsing, RFQ (Request for Quote), cart, checkout, chat, wallet, and vendor dashboards.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4 + SCSS modules
- **State Management:** Zustand, React Context
- **Server State:** TanStack React Query 5
- **Forms:** React Hook Form + Zod validation
- **UI Components:** Radix UI primitives, Lucide icons, shadcn/ui
- **Rich Text:** Plate editor (Slate-based)
- **Auth:** NextAuth 4 (JWT session, cookie-based)
- **i18n:** next-intl (multilingual support)
- **Real-time:** Socket.IO client
- **Payments:** Stripe React SDK

## Prerequisites

- Node.js 18+

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd xmartech-ultrasooq-frontend-main

# 2. Install dependencies
npm install

# 3. Configure environment
# Create a .env.local file with:
NEXT_PUBLIC_API_URL=http://localhost:3000

# 4. Start development server (port 4001, Turbopack enabled)
npm run dev
```

The app starts on `http://localhost:4001`.

## Available Scripts

| Script  | Command                         | Description                      |
|---------|---------------------------------|----------------------------------|
| `dev`   | `next dev --turbopack -p 4001`  | Start dev server with Turbopack  |
| `build` | `next build`                    | Create production build          |
| `start` | `next start`                    | Start production server          |
| `lint`  | `next lint`                     | Run ESLint                       |

## Project Structure

```
app/                        # Next.js App Router pages
  layout.tsx                # Root layout (providers, fonts, metadata)
  page.tsx                  # Home page
  login/                   # Login page
  register/                # Registration page
  product/                 # Product detail pages
  search/                  # Search results
  cart/                    # Shopping cart
  checkout/                # Checkout flow
  checkout-complete/       # Order confirmation
  my-orders/               # Buyer order history
  seller-orders/           # Seller order management
  vendor-dashboard/        # Seller analytics dashboard
  manage-products/         # Seller product management
  manage-services/         # Service management
  rfq/                     # RFQ marketplace
  rfq-request/             # Create RFQ requests
  rfq-quotes/              # View/manage RFQ quotes
  wallet/                  # Wallet balance and transactions
  notifications/           # Notification center
  my-settings/             # Account settings
  team-members/            # Seller team member management
  profile/                 # User profile
  company-profile/         # Company profile pages
  factories/               # Factory product listings
  dropship-products/       # Dropshipping catalog
  dropship-management/     # Dropship order management
  trending/                # Trending products
  wishlist/                # Saved items
  ...

components/
  modules/                 # Page-specific component groups
    home/                  # Homepage sections
    products/              # Product cards, grids, filters
    cart/                  # Cart items, summaries
    checkout/              # Checkout forms, payment
    chat/                  # Chat UI components
    orders/                # Order lists, details
    profile/               # Profile forms
    wallet/                # Wallet UI
    ...
  shared/                  # Reusable components (Header, Footer, Sidebar)
  ui/                      # Base UI primitives (Button, Input, Dialog, etc.)
  plate-ui/                # Rich text editor components
  icons/                   # Custom icon components

apis/
  http.ts                  # Axios instance with auth interceptor
  queries/                 # TanStack Query hooks (data fetching)
  requests/                # API request functions

config/                    # App configuration (API URL, constants)
context/                   # React Context providers
hooks/                     # Custom React hooks
helpers/                   # Utility functions
utils/                     # Constants, formatters, validators
types/                     # TypeScript type definitions
translations/              # i18n translation files
providers/                 # App-wide providers (Query, Session, Locale)
layout/                    # Layout components
scss/                      # Global SCSS styles
public/                    # Static assets (images, fonts)
```

## Key Features

- **Multi-role support:** Buyer, Seller (Company), Freelancer, Team Member accounts
- **Product management:** Full CRUD with variants, pricing, images, specifications
- **RFQ system:** Request for Quote workflow for B2B bulk purchasing
- **Shopping cart:** Regular cart, RFQ cart, and Factories cart
- **Checkout:** Stripe and Paymob payment integration
- **Real-time chat:** Socket.IO-powered messaging between buyers and sellers
- **Wallet system:** Balance management, transfers, transaction history
- **Dropshipping:** Product sourcing and dropship order management
- **Notifications:** In-app notification center
- **Internationalization:** Multi-language support via next-intl
- **Vendor dashboard:** Sales analytics, order management, product approval status
- **Team management:** Role-based access for seller team members
- **Sub-accounts:** Multi-account switching for business users

## Environment Variables

| Variable               | Description                              | Default                    |
|------------------------|------------------------------------------|----------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend API base URL                     | Auto-detected from hostname |
| `NEXTAUTH_SECRET`      | NextAuth session encryption secret       | (required for production)  |
| `NEXTAUTH_URL`         | Canonical URL of the app                 | `http://localhost:4001`    |

## API Layer

All backend communication goes through the Axios instance in `apis/http.ts`. The auth token is automatically attached from cookies on every request. The base URL is resolved dynamically:

- If `NEXT_PUBLIC_API_URL` is set, it uses that value.
- In the browser, it detects the current hostname and points to port 3000 on the same host.
- On the server side, it falls back to the configured default.
