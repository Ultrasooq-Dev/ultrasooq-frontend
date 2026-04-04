# Product Hub — `/product-hub`

## Overview
Unified 4-panel page for product search, RFQ creation, and direct purchasing. Replaces the old `/rfq` browse page and `/search` page with a single powerful interface.

## URLs
| URL | Opens with |
|-----|-----------|
| `/product-hub` | RFQ tab (default) |
| `/product-hub?mode=rfq` | RFQ tab — create/manage RFQ sessions |
| `/product-hub?mode=search&q=headphones` | Search tab — auto-creates session with search query |

## Layout (4 panels)
```
┌──────────┬──────────────┬──────────────────────────┬────────────┐
│ Panel 1  │   Panel 2    │       Panel 3            │  Panel 4   │
│ Sessions │  Items List  │   Product Detail         │  Cart      │
│ 170px    │   280px      │   flex-1                 │  260px     │
│(collapse │              │                          │(collapse   │
│  to 50px)│              │                          │  to 50px)  │
└──────────┴──────────────┴──────────────────────────┴────────────┘
```

## Panel 1 — Sessions (RFQ + Search)
- **Two tabs**: RFQ | Search — switches the session list
- **New button**: Creates empty session, auto-selects it
- **Real data**: RFQ sessions from `GET /product/getAllRfqQuotesByBuyerID`
- **Search sessions**: stored locally
- **Actions per session**: Favorite (⭐), Archive (📦), Delete (🗑️) via ⋯ menu
- **Collapsible**: shrinks to 50px icon column

## Panel 2 — Request Items
- **Search input** with autocomplete from `GET /product/searchSuggestions`
- **Multi-product parsing**: "50 headphones, 10 laptops" → 2 separate items
- **Two submit modes**: 🔍 Search (text only) | ⚡ AI Search (text + attachments, 50/day)
- **5 Free tools**:
  | Tool | Library | What it does |
  |------|---------|-------------|
  | 📎 Attach | native | Upload files for RFQ |
  | 📄 OCR | tesseract.js | Extract text from images; pdf.js for PDFs (text + scanned) |
  | ▦ Barcode | html5-qrcode | Scan barcode/QR from image |
  | 📷 Lens | - | Upload photo → AI visual search |
  | 📊 Excel | papaparse | Import product list from CSV/Excel |
- **Delete items**: hover shows 🗑️, cascades to clear Panel 3

## Panel 3 — Product Detail (3 tabs)
### Tab 1: Products
- Real search from `GET /product/getAllProduct?term=X`
- "Can't find?" → Create RFQ | AI Suggest (50/day with counter)
- Filter bar: Sort + Retail/Wholesale/BuyGroup chips + Customizable toggle + expandable dynamic filters from category SpecTemplate
- Per product: RFQ button + Buy/Customize button
- Discussion chat at bottom (50/day limit)

### Tab 2: Buy / Customize
- Shows **vendors** selling the selected product model (not different products)
- Each vendor card: seller info, price, discount, stock, warranty, shipping
- Two actions per vendor: Buy Now | Customize
- Click vendor name → full product detail page (gallery, bulk pricing, reviews, Q&A, seller card)

### Tab 3: Specs & Req.
- Product specs from category (collapsible grid)
- Rich text editor with toolbar (B/I/U, lists, headings, image, table, AI assist)
- Quick requirement chips (Quality Cert, Warranty, Samples, etc.)
- Multi-file attachments
- Two action buttons: Add to RFQ Cart | Ask {vendor} to Customize

## Panel 4 — Cart (RFQ + Buy Now)
- **Two tabs**: RFQ | Buy Now
- Each item: name, seller, quantity `[-] qty [+]`, price
- Summary: item count, total estimate
- Submit buttons: "Submit RFQ" | "Checkout"
- **Collapsible**: shrinks to 50px with cart/RFQ/buy icons + total

## Data Flow
```
Panel 1 ──select──▶ Panel 2 ──select──▶ Panel 3
(session)           (items)              (products/vendors)

API: useAllRfq      Local state +        GET /product/getAllProduct
  QuotesByBuyerId   useFindOneRfq        GET /product/searchSuggestions
                    QuotesUsers          GET /specification/filters/{catId}
```

## Tracking Events
All events use the piggyback system (X-Track-* headers, zero extra HTTP calls):

| Event | Panel | Trigger |
|-------|-------|---------|
| `page_view` | Page | Auto on load |
| `rfq_session_selected` | P1 | Click session |
| `rfq_new_session` | P1 | New RFQ/Search |
| `rfq_session_removed` | P1 | Delete/archive |
| `rfq_item_selected` | P2 | Click item |
| `rfq_item_deleted` | P2 | Delete item |
| `rfq_tool_ocr` / `_success` / `_error` | P2 | OCR used |
| `rfq_tool_barcode` / `_success` / `_error` | P2 | Barcode scanned |
| `rfq_tool_lens` | P2 | Visual search |
| `rfq_tool_excel` | P2 | Excel imported |
| `rfq_product_search` | P3 | Search executed |
| `rfq_add_to_cart` | P3 | Product added to cart |

## Files
| File | Purpose |
|------|---------|
| `app/product-hub/page.tsx` | Main page — grid layout, state owner, API hooks |
| `components/rfq-builder/SessionPanel.tsx` | Panel 1 — session list with tabs/favorites/archive |
| `components/rfq-builder/RequestListPanel.tsx` | Panel 2 — items + search + tools |
| `components/rfq-builder/ItemDetailPanel.tsx` | Panel 3 — products/vendors/specs |
| `components/rfq-builder/CartPanel.tsx` | Panel 4 — dual cart |
| `components/rfq-builder/tools.ts` | OCR, barcode, PDF, Excel parsers |

## Dependencies Added
```json
{
  "tesseract.js": "OCR for images",
  "html5-qrcode": "Barcode/QR scanning",
  "papaparse": "CSV/Excel parsing",
  "pdfjs-dist": "PDF text extraction"
}
```

## Redirects
- Header search bar → `/product-hub?mode=search&q={term}`
- Header RFQ nav link → `/product-hub?mode=rfq`
- Old `/rfq` → replaced by `/product-hub?mode=rfq`

## Limits
- **AI Search**: 50/day per user (localStorage, TODO: backend tracking)
- **AI Suggest**: 50/day per user (shared counter)
- **Discussion chat**: 50/day per user (shared counter)
- **OCR/Barcode/Excel**: Unlimited (free, runs client-side)

## Future TODOs
- Wire Panel 2 items to real session data from API (currently local state)
- Wire "Submit RFQ" button to `POST /product/addRfqQuotes`
- Wire "Checkout" to existing cart/checkout flow
- Connect AI Search to `GET /product/search/ai` endpoint
- Connect AI Suggest to backend AI product creation
- Move daily limits to backend tracking (currently localStorage)
- Add real-time product image rendering (currently placeholders)
- Connect Discussion chat to backend chat/support system
