# Ultrasooq Frontend — Next.js 16

**Port**: 4001 | **Dev**: `npm run dev` | **Test**: `npm test`

## Stack
Next.js 16.1.6 · React 19 · TypeScript strict · Tailwind 4 (Vite plugin, no config) · TanStack Query 5 · Zustand 5 · React Hook Form + Zod 4 · next-intl 4 (20 langs) · next-auth 4 · Plate.js v49 · Socket.io 4 · shadcn/ui + Radix · Lucide · Jest 30

## Directory Map
```
app/                    # App Router (60+ routes)
apis/http.ts            # Axios client, auto token refresh, 30s timeout
apis/queries/           # 28 TanStack Query hook files
apis/requests/          # 29 Axios request files
components/ui/          # shadcn/ui (30+ components)
components/modules/     # Feature components (30+ domains)
components/shared/      # Reusable components (30+)
context/                # AuthContext, SocketContext, NotificationContext, SidebarContext
hooks/                  # 7 custom hooks
lib/                    # Zustand stores (category, order, rfq, user, wallet)
layout/MainLayout/      # Header.tsx, Sidebar.tsx
translations/           # 20 language JSON files
config/api.ts           # BASE_URL config
proxy.ts                # Route protection middleware
utils/constants.ts      # Token keys, currencies, roles, statuses
```

## Conventions
- **Bilingual**: always `field_en` + `field_ar`
- **RTL**: logical CSS only — `ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`
- **Never use**: `ml-`, `mr-`, `pl-`, `pr-`, `text-left`, `text-right`
- **API base**: `NEXT_PUBLIC_API_URL` → `http://localhost:3000/api/v1`
- **Auth cookies**: `ultrasooq_accessToken`, `ultrasooq_refreshToken`
- **Imports**: `@/*` alias maps to project root
- **shadcn config**: `components.json` (radix-maia style, zinc base, RTL true)
- **Package manager**: npm (`legacy-peer-deps=true` in .npmrc)

## Providers (root layout order)
SessionWrapper → ThemeProvider → DirectionProvider → ReactQueryProvider → AuthProvider → SocketProvider → SidebarProvider → NotificationProvider → LocaleProvider → ConditionalLayout

## State Management
- **Server state**: TanStack Query (queries/ hooks)
- **Client state**: Zustand stores in lib/ (orderStore, rfqStore persisted to localStorage)
- **Auth/i18n/socket**: React Context in context/
- **Route guard**: proxy.ts middleware

## Key Constants
- Currencies: OMR, USD, SAR, AED, EUR, GBP
- Trade roles: BUYER, FREELANCER, COMPANY
- Product types: P (normal), R (RFQ), F (factory), D (dropship)
- Menu IDs: STORE=8, BUYGROUP=9, FACTORIES=10, RFQ=11

## Testing
- Jest 30 + Testing Library
- Config: `jest.config.mjs`
- Tests: `__tests__/**/*.test.{ts,tsx}`
- Setup: `jest.setup.ts` (mocks next/navigation, cookies-next)
