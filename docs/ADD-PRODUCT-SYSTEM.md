# Ultrasooq Add Product System — Technical Documentation

## Overview

A multi-panel product creation system at `/add-product` supporting two modes:
- **Regular Products**: Search existing products as templates → edit → save
- **Spare Parts**: Vehicle catalog tree + interactive car diagram → bulk select parts → edit → save

**URL**: `/add-product` (regular) or `/add-product` with Spare Part toggle

---

## Architecture

### Regular Product Mode (3 panels)
```
┌──────────────┬──────────────┬────────────────────────────────────┐
│  P1: Product │  P2: Browse  │  P3: Product Editor                │
│  List 240px  │  300px       │  flex                              │
└──────────────┴──────────────┴────────────────────────────────────┘
```

### Spare Part Mode (4 panels)
```
┌──────────┬────────────┬──────────────┬─────────────────────────────┐
│  P1      │  P4: Part  │  P2: Selected│  P5: Car Diagram            │
│  List    │  Catalog   │  Parts       │  (or P3: Editor when        │
│  200px   │  240px     │  flex        │   editing a part)           │
└──────────┴────────────┴──────────────┴─────────────────────────────┘
```

---

## Panel Breakdown

### P1 — Product List Panel (`ProductListPanel.tsx`)

**Purpose**: Add product names, manage the working list, switch between Product/Spare Part mode.

**Key Features**:
- **Product/Spare Part toggle** — switches the entire page layout
- **Text input** with autocomplete from `/product/searchSuggestions` API
- **Multi-product parsing** — newlines/commas split into separate items
- **Tools**: OCR, Barcode, Lens, Excel (UI only, not wired yet)
- **Item list** with status indicators:
  - 📦 blue icon = regular product
  - 🔧 orange icon = spare part
  - ○ Draft / ● Editing / ● Ready
- **Footer**: Clear all + Submit all (count) buttons
- **Delete on hover** (group hover pattern)

**Props**:
```typescript
interface ProductListPanelProps {
  items: ProductDraft[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (names: string[], kind: ProductKind) => void;
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  onKindChange?: (kind: ProductKind) => void;
  onStatusChange: (id: string, status: "draft" | "editing" | "ready") => void;
  locale: string;
}
```

**Types**:
```typescript
type ProductKind = "product" | "sparepart";

interface ProductDraft {
  id: string;
  name: string;
  kind: ProductKind;
  status: "draft" | "editing" | "ready";
  templateId?: number;
}
```

---

### P2 — Product Browse Panel (`ProductBrowsePanel.tsx`)

**Purpose**: Search existing products in DB to use as templates for P3.

**Key Features**:
- **Search** with debounced API call to `/product/getAllProduct`
- **AI Search** button (UI, not wired)
- **"Create Manually"** — always first item, lets user skip template
- **List/Grid view toggle**
- **Filters**: price range, star rating, stock only
- **Product cards**: image, name, price, rating, SKU, category
- **Selection highlight** with checkmark

**API**: `GET /product/getAllProduct?term=X&page=N&limit=12`

---

### P3 — Product Editor Panel (`ProductEditorPanel.tsx`)

**Purpose**: Full product creation form — auto-filled from template, user edits all fields.

**Key Features**:
- **Auto-fill from template** when product selected in P2 (regular) or P5 (spare part)
- **AI auto-suggest**: specs, keywords, tags based on product name
- **Rich text editor** (MDEditor from `@uiw/react-md-editor`) for descriptions
- **All fields from `/product` page** (see field list below)

**Sections** (single scroll, no tabs):
1. 📦 **Basic Information** — Name, Nickname, Brand, Type, Condition, SKU, Keywords, AI Tags
2. 🖼 **Images & Videos** — Multi-image display + add
3. 📄 **Description** — Short descriptions (repeatable, max 200 chars, rich text) + Full description (rich text)
4. 📐 **Specifications** — Key-value rows (add/remove), AI auto-populated based on product category
5. 🎨 **Product Variants** — Type + values (Color→Red/Blue, Size→S/M/L)
6. 💰 **Pricing** — Set Up Price toggle, Price/Offer/Stock, Sell Type, Consumer Type, Discounts (FLAT/%), Quantities, Customer limits, Date/Time windows, Delivery days, Customizable toggle
7. 📍 **Location & Shipping** — Origin, Warehouse country/state/city/town, Sell regions (multi-select)
8. 🏷 **Custom Fields** — Dynamic label-value pairs

**AI Spec Templates** (matched by product name):
```
headphones → Driver, ANC, Bluetooth, Battery, Weight...
laptop → Processor, RAM, Storage, Display, GPU...
phone → Display, Processor, RAM, Camera, Battery...
monitor → Size, Resolution, Panel, Refresh Rate...
keyboard → Type, Switch, Layout, Connectivity...
mouse → Sensor, DPI, Buttons, Connectivity...
chair → Material, Max Weight, Adjustable Height...
(14 categories + default fallback)
```

---

### P4 — Part Catalog Panel (`PartCatalogPanel.tsx`)

**Purpose**: RockAuto-style vehicle make/model/year/engine tree with parts.

**Key Features**:
- **Unlimited depth tree** — Make → Year → Model → Engine → Category → Sub-category → Part group → Individual parts
- **A-Z sidebar** for quick letter navigation
- **Search** across makes
- **Expand All / Collapse** buttons
- **4-mode selection** for categories:
  - None (empty)
  - Self (orange "S" — sell category as one product, e.g. "Engine Complete")
  - All (blue checkmark — select all children)
  - Cycle: None → Self → All → None
- **Simple toggle** for leaf parts (check/uncheck)
- **Bulk action bar** — shows when parts checked: count + total price + "Add All" button
- **Part info inline**: OEM badge, price (green), stock indicator (●/○)
- **Search box** at engine level (where `searchable: true`)

**Tree Structure** (sample):
```
🇯🇵 TOYOTA
  └─ 2024
      └─ Camry
          └─ 2.5L 4Cyl [🔍]
              ├─ Brake & Wheel Hub (12)
              │   ├─ Brake Pad (5)
              │   │   ├─ Front Pad Set (3)
              │   │   │   ├─ Brembo P83148N       45 ●
              │   │   │   ├─ Toyota OEM 04465      65 ● OEM
              │   │   │   └─ TRW GDB3604           38 ●
              │   │   └─ Rear Pad Set (2)
              │   ├─ Brake Rotor (4)
              │   └─ Brake Caliper (2)
              ├─ Cooling System (4)
              ├─ Engine (8)
              ├─ Electrical (5)
              ├─ Steering (2)
              ├─ Suspension (3)
              └─ Transmission (2)
```

**Data**: Currently hardcoded in `CATALOG` array. Full tree for Toyota Camry 2024 2.5L with 43 individual parts across 7 categories. Other makes have empty children (placeholder).

---

### P5 — Car Diagram Panel (`CarDiagramPanel.tsx`)

**Purpose**: Interactive visual car parts map — click zones and individual parts.

**Key Features**:
- **SVG car outline** (top-down view) with 10 clickable color-coded zones
- **Zone colors**: Front=red, Engine=orange, FL=yellow, FR=green, RL=cyan, RR=purple, Rear=pink, Underbody=slate, Interior=violet, Roof=sky
- **Per-zone badge** showing checked count
- **Zone detail view**: Click zone → shows part position diagram + checklist
- **Part dots** on diagram at x,y coordinates — clickable, with tooltip on hover
- **Highlight**: When part selected in P4/P2, it pulses red on the diagram
- **Zone actions**: Select All / Clear per zone
- **Bulk actions**: "Add Selected (N)" button + Clear all
- **Sync**: Diagram ↔ P2 selected parts ↔ P4 catalog tree

**Zones & Part Counts**:
| Zone | Parts | Color |
|------|-------|-------|
| Front | 12 | Red |
| Engine Bay | 18 | Orange |
| Front Left | 7 | Yellow |
| Front Right | 5 | Green |
| Rear Left | 4 | Cyan |
| Rear Right | 4 | Purple |
| Rear | 8 | Pink |
| Underbody | 21 | Slate |
| Interior | 15 | Violet |
| Roof & Glass | 4 | Sky |
| **Total** | **98** | — |

---

### P2 (Spare) — Selected Parts Panel (`SelectedPartsPanel.tsx`)

**Purpose**: Manage selected parts before editing — mark damaged, remove, bulk actions.

**Key Features**:
- **Summary bar**: good count, damaged count, total price
- **Bulk actions**: "Remove Damaged (N)", "Mark All Ready"
- **Good parts list**: green dot, name, zone, brand, OEM badge, price
- **Damaged parts section**: red header, strikethrough names, Restore button
- **Click part → opens P3 editor** (replaces P5 diagram)
- **Mark as damaged** (⚠️ icon) — moves part to damaged section
- **Remove** (✕) — deletes from list entirely

---

## State Management

### Page-level state (`app/add-product/page.tsx`)

```typescript
// P1
items: ProductDraft[]              // product list
selectedId: string | null          // selected item in P1
activeKind: ProductKind            // current toggle state

// P2 (regular)
selectedProductId: number | null   // selected in P2 browse
selectedProduct: any               // template data for P3

// P4
selectedVehicle: { make, model, year } | null

// P5
diagramParts: Set<string>          // checked parts on diagram

// P2 (spare)
selectedParts: SelectedPart[]      // all selected spare parts
selectedPartForEdit: string | null // which part is being edited in P3
showSelectedParts: boolean         // whether P2 spare is visible
```

### Data Flow
```
P1 (kind toggle)
  → isSparePart = true/false
  → switches between P2+P3 (regular) and P4+P2spare+P5/P3 (spare)

P4 (catalog) → handleSelectPart → adds to selectedParts → shows P2 spare
P5 (diagram) → onTogglePart → adds to diagramParts + selectedParts → shows P2 spare
P2 spare → onSelectPart → sets selectedPartForEdit → shows P3 (replaces P5)
P3 (editor) → onUpdate → marks item as "editing" in P1

Sync: P4 checkboxes ↔ P5 diagram dots ↔ P2 selected list
```

---

## Dynamic Grid Layout

```typescript
const getGridCols = () => {
  if (!isSparePart) return "240px 300px 1fr";                    // P1 + P2browse + P3
  if (showSelectedParts && selectedPartForEdit) return "200px 240px 240px 1fr";  // P1 + P4 + P2sel + P3
  if (showSelectedParts) return "200px 280px 1fr 320px";         // P1 + P4 + P2sel + P5
  return "240px 1fr 1fr";                                        // P1 + P4 + P5
};
```

---

## File Inventory

```
app/add-product/
  page.tsx                          # Page orchestrator — state, layout, panel wiring

components/add-product/
  ProductListPanel.tsx              # P1 — product name list + kind toggle
  ProductBrowsePanel.tsx            # P2 — search DB for templates
  ProductEditorPanel.tsx            # P3 — full product form (all fields)
  PartCatalogPanel.tsx              # P4 — vehicle make/model/year/parts tree
  CarDiagramPanel.tsx               # P5 — SVG car diagram + zone grid
  SelectedPartsPanel.tsx            # P2 (spare) — selected parts manager
  DetailPanel.tsx                   # P3 alt — product detail preview (legacy, replaced by EditorPanel)
  ProductSearch.tsx                 # In-P6 product search (for messaging system)
```

---

## TODO / Future Work

### High Priority
- [ ] **Car diagram per make/model** — load different ZONES data per vehicle
- [ ] **Real SVG car illustrations** — replace simple outline with detailed per-zone SVGs
- [ ] **Backend: POST /product/create** — wire Save Product to real API
- [ ] **Image upload** — wire to S3 via `/chat/upload-attachment` or dedicated endpoint
- [ ] **Category dropdown** — use real category tree from `/category/getAll` API
- [ ] **Brand dropdown** — use real brands from `/brand/getAll` API
- [ ] **Rich text for specifications** — currently plain text, could use MDEditor

### Medium Priority
- [ ] **OCR/Barcode/Lens/Excel tools** in P1 — wire to extraction libraries
- [ ] **AI Search** — call AI endpoint for product suggestions
- [ ] **AI Category assignment** — auto-categorize on save
- [ ] **Variant pricing** — per-variant combination price/stock matrix
- [ ] **Dropship mode** — select existing product to dropship with markup
- [ ] **Country/State/City dropdowns** — use real API with cascading selects
- [ ] **Sell regions multi-select** — real react-select with country data

### Low Priority / Future
- [ ] **Zod form validation** — add schema like `/product` page
- [ ] **React Hook Form** — migrate from useState to useForm for better validation
- [ ] **Form persistence** — save draft to localStorage
- [ ] **Undo/Redo** in editor
- [ ] **Product preview** — live preview panel showing how product will appear to buyers
- [ ] **Bulk import** — CSV/Excel upload to create multiple products at once
- [ ] **Template library** — save custom templates for reuse

### Car Diagram System (Phase 2)
- [ ] **Car data files** — one JSON per make/model with zones, parts, SVG paths
- [ ] **SVG zone illustrations** — detailed per-zone diagrams (engine bay, suspension, interior)
- [ ] **Part position editor** — admin tool to place parts on diagrams
- [ ] **Vehicle database** — API endpoint to fetch car data by make/model/year
- [ ] **Cross-reference** — link diagram parts to catalog parts (P4 ↔ P5 deep sync)
- [ ] **3D view** — future: Three.js car model with clickable parts
- [ ] **Damage assessment** — photo upload → AI identifies damaged parts → auto-marks

---

## Color Design System

### P4 Catalog Tree — Level Colors
| Level | Style | Example |
|-------|-------|---------|
| 0 (Make) | Bold, flag emoji, dark text | 🇯🇵 **TOYOTA** |
| 1 (Year) | Medium, muted | 2024 |
| 2 (Model) | Medium weight | Camry |
| 3 (Engine) | Has search box | 2.5L 4Cyl [🔍] |
| 4+ (Category) | Colored per type | Brake=red, Engine=orange |
| Leaf (Part) | Light, with price | Brembo P83148N 45 ● |

### P5 Diagram — Zone Colors
| Zone | Color | Hex |
|------|-------|-----|
| Front | Red | #ef4444 |
| Engine Bay | Orange | #f97316 |
| Front Left | Yellow | #eab308 |
| Front Right | Green | #22c55e |
| Rear Left | Cyan | #06b6d4 |
| Rear Right | Purple | #8b5cf6 |
| Rear | Pink | #ec4899 |
| Underbody | Slate | #64748b |
| Interior | Violet | #a855f7 |
| Roof & Glass | Sky | #0ea5e9 |

### Selection States
| State | Visual |
|-------|--------|
| Unchecked | Empty border |
| Checked (leaf) | Green filled + checkmark |
| Self (category) | Orange "S" badge |
| All (category) | Primary filled + checkmark |
| Some (branch) | Partial fill |
| Damaged | Red dot + strikethrough |
| Highlighted | Red pulse animation |

---

## Spare Part Workflow Example

```
1. User opens /add-product
2. Clicks [🔧 Spare Part] toggle in P1
3. Sees: P1 (empty) | P4 (catalog) | P5 (car diagram)

4. In P4: Clicks TOYOTA → 2024 → Camry → 2.5L 4Cyl
5. Tree expands showing Brakes, Engine, Electrical, etc.

6. In P5: Clicks "Front" zone on car SVG
7. Sees dots on diagram + checklist: Bumper, Hood, Headlights...
8. Checks Bumper (220 OMR), Hood (380 OMR), Headlights (95×2)

9. Alternatively in P4: Checks [✓] entire "Brake & Wheel Hub" category
10. All 12 brake parts added to P2 selected list

11. P2 appears: Shows all selected parts
12. User clicks ⚠️ on "Front Grille" → moves to Damaged section
13. Clicks "Remove Damaged" → grille removed

14. Clicks "Front Bumper" in P2 → P3 editor opens
15. Edits price, adds photos, writes description
16. Clicks "Save Product" → status in P1: 🔧 Front Bumper ● Ready

17. Clicks "Mark All Ready" → all remaining parts added to P1 as ready
18. Clicks "Submit All (15)" → creates 15 product listings
```
