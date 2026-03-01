# Google Analytics & Business Services Integration

## Context
UltraSooq is a B2B/B2C marketplace (Oman region) with 75+ pages, 404+ components, 20 languages. Currently there is **zero** analytics, tracking, SEO metadata, sitemap, or robots.txt. The user wants to add Google Analytics, Tag Manager, Search Console, and enhanced SEO to support business growth and discoverability.

Additionally: the "Use This Data" button on the AI product autofill modal should navigate to the next step after populating the form.

---

## Phase 1: Foundation (Environment + Consent)

### Step 1: Environment Variables
**Modify:** `.env.local`

Add:
```
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code
NEXT_PUBLIC_SITE_URL=https://ultrasooq.com
```

### Step 2: Cookie Consent System
**New:** `context/CookieConsentContext.tsx`
- `"use client"` context provider (follows `AuthContext.tsx` pattern)
- Manages `analyticsConsent`, `marketingConsent` booleans
- Persists in localStorage (`ultrasooq_cookie_consent`)
- Exposes `hasResponded` to control banner visibility

**New:** `components/shared/CookieBanner.tsx`
- Bottom banner with "Accept All" / "Reject All" / "Customize"
- Uses project's `Button` component
- Only shows when `!hasResponded`

---

## Phase 2: Analytics & GTM Scripts

### Step 3: Analytics Utility Module
**New:** `lib/analytics.ts`
- Core `gtag()` wrapper with window safety check
- E-commerce events (GA4 standard): `trackPageView`, `trackViewItem`, `trackAddToCart`, `trackRemoveFromCart`, `trackBeginCheckout`, `trackPurchase`, `trackSearch`
- GTM `pushToDataLayer()` helper
- Default currency: `'OMR'`

### Step 4: Analytics Provider
**New:** `providers/AnalyticsProvider.tsx`
- `"use client"` component using `next/script` with `strategy="afterInteractive"`
- Loads GA4 script only when `analyticsConsent === true` AND `GA4_ID` is set
- Loads GTM script only when `analyticsConsent === true` AND `GTM_ID` is set
- Tracks page views on `usePathname()` changes
- Uses `send_page_view: false` in GA4 config (manual SPA tracking)
- GTM noscript iframe included

### Step 5: Wire into Root Layout
**Modify:** `app/layout.tsx`

Provider nesting (new items marked with ✨):
```
SessionWrapper > html > body > ThemeProvider > DirectionProvider
  > ✨CookieConsentProvider > ✨AnalyticsProvider
    > ReactQueryProvider > AuthProvider > SocketProvider > SidebarProvider
      > ... content ...
      > ✨CookieBanner (sibling of Toaster)
```

Enhanced root metadata:
```typescript
export const metadata: Metadata = {
  title: { template: "%s | Ultrasooq", default: "Ultrasooq" },
  description: "UltraSooq - B2B/B2C Multi-Vendor Marketplace in Oman.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://ultrasooq.com'),
  openGraph: {
    type: 'website',
    siteName: 'UltraSooq',
    locale: 'ar_OM',
    alternateLocale: ['en_US'],
  },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  robots: { index: true, follow: true },
};
```

---

## Phase 3: SEO & Discovery

### Step 6: Sitemap & Robots
**New:** `app/sitemap.ts`
- Dynamic sitemap (Next.js App Router convention)
- Static pages: `/`, `/home`, `/trending`, `/search`, `/services`, `/rfq`, `/buygroup`, `/factories`, `/login`, `/register`
- Dynamic product pages fetched from backend API with 1hr cache
- Graceful fallback if API is unavailable

**New:** `app/robots.ts`
- Allow crawling on all public routes
- Disallow private routes: `/api/`, `/my-settings/`, `/my-orders/`, `/wallet/`, `/checkout/`, `/vendor-dashboard/`, `/team-members/`, etc.
- Reference sitemap URL

### Step 7: Structured Data (JSON-LD)
**New:** `lib/structured-data.ts`
- `generateOrganizationSchema()` — Organization for Google Business Profile
- `generateWebSiteSchema()` — WebSite with SearchAction for sitelinks search box
- `generateProductSchema(product)` — Product schema with offers, ratings, brand
- `generateBreadcrumbSchema(items)` — Breadcrumb for navigation

**New:** `components/shared/JsonLd.tsx`
- Reusable `<script type="application/ld+json">` component

---

## Phase 4: Integration into Pages

### Step 8: Add Tracking Events to Key Pages

| Page | File | Event |
|------|------|-------|
| Home | `app/home/page.tsx` | Organization + WebSite JSON-LD |
| Product detail | `app/product/[id]/page.tsx` | `trackViewItem()` + Product JSON-LD |
| Search | `app/search/page.tsx` | `trackSearch(term)` |
| Checkout | `app/checkout/page.tsx` | `trackBeginCheckout()` |
| Checkout complete | `app/checkout-complete/page.tsx` | `trackPurchase()` |
| Add to cart | Various ProductCard components | `trackAddToCart()` on mutation success |

---

## Phase 5: "Use This Data" Navigation Fix

**Context:** The AI product autofill modal shows product details (brand, description, specs). When user clicks "Use This Data", the form should be populated AND the user should be advanced to the next step.

**File to modify:** The add-product page component that handles the modal's "Use This Data" button click handler — populate form fields and then call the step navigation function (e.g., `setCurrentStep(next)` or router push to next step).

---

## Files Summary

**New files (8):**
| File | Purpose |
|------|---------|
| `lib/analytics.ts` | GA4 event tracking utilities |
| `lib/structured-data.ts` | JSON-LD schema generators |
| `providers/AnalyticsProvider.tsx` | GA4 + GTM script loader |
| `context/CookieConsentContext.tsx` | Cookie consent state |
| `components/shared/CookieBanner.tsx` | Consent UI banner |
| `components/shared/JsonLd.tsx` | JSON-LD injection component |
| `app/sitemap.ts` | Dynamic sitemap |
| `app/robots.ts` | Robots.txt |

**Modified files (7-8):**
| File | Change |
|------|--------|
| `.env.local` | Add 4 Google env vars |
| `app/layout.tsx` | Enhanced metadata, new providers, cookie banner |
| `app/home/page.tsx` | Organization + WebSite JSON-LD |
| `app/product/[id]/page.tsx` | view_item tracking + Product JSON-LD |
| `app/checkout/page.tsx` | begin_checkout tracking |
| `app/checkout-complete/page.tsx` | purchase tracking |
| `app/search/page.tsx` | search event tracking |
| Add-product modal handler | "Use This Data" → next step navigation |

---

## Verification

1. Set placeholder env vars → start dev server → verify no scripts load (no consent yet)
2. Click "Accept All" on cookie banner → verify GA4 + GTM scripts load in Network tab
3. Navigate between pages → verify `page_view` events fire in console (`dataLayer` pushes)
4. Visit `/sitemap.xml` → verify static + dynamic product URLs render
5. Visit `/robots.txt` → verify allow/disallow rules and sitemap reference
6. View page source on home page → verify Organization + WebSite JSON-LD
7. Run `next build` → verify zero TypeScript errors
8. Test "Reject All" → verify zero Google scripts load
