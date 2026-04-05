# Ultrasooq Messaging System — Technical Documentation

## Overview

A multi-panel real-time messaging system for buyer-vendor communication, RFQ negotiation, product management, and support. Built with Next.js 16, Zustand, Socket.io, and NestJS.

**URL**: `/messages`
**Widget**: Floating chat button on all pages (except auth pages)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Messages Page Layout                         │
├──────────┬───────────┬─────────────────────┬───────────────────────┤
│   P1     │    P2     │       P5 (chat)     │      P6 (products)   │
│ Channels │  Convos   │  or P4 (basic chat) │  or ProductSearch    │
│ 130/240  │  130/260  │      flex            │       420px          │
│  hover   │   hover   │                     │                      │
└──────────┴───────────┴─────────────────────┴───────────────────────┘
```

### Panel Breakdown

| Panel | Width | Purpose | File |
|-------|-------|---------|------|
| **P1** | 130px / 240px (hover) | Channel categories tree (Unread, Support, Vendor Ops, Customer, Orders, Payment, Team) | `MsgPanel1.tsx` |
| **P2** | 130px / 260px (hover) | Conversation tree per channel (parent items + expandable children) | `MsgPanel2.tsx` |
| **P4** | flex | Basic chat (non-RFQ/Product channels) | `MsgPanel4.tsx` |
| **P5** | flex | RFQ/Product chat (system notifications, RFQ updates) | `MsgPanel5.tsx` |
| **P6** | 420px | Product list + Specs & Note (vendor/customer role-aware) | `MsgPanel6.tsx` |
| **ProductSearch** | 420px (overlay in P6) | Search and add products from vendor's store | `ProductSearch.tsx` |

### Panel Routing

```
Channel starts with "v_rfq", "v_product", "c_rfq", "c_product"
  → Show P5 (chat) + P6 (products)

All other channels
  → Show P4 (basic chat)
```

---

## Data Flow

```
Backend API  →  TanStack Query (useMessageData)  →  Zustand Store  →  Panels
Socket.io    →  messageSocket bridge              →  Zustand Store  →  Panels
User action  →  Panel callback                    →  Socket emit / API call
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/messageStore.ts` | Zustand store — messages, channels, counts, RFQ products, presence |
| `lib/messageSocket.ts` | Socket.io → Store bridge + latency tracking |
| `components/messaging/useChat.ts` | Shared chat hook (P4/P5) — send, scroll, read, typing |
| `components/messaging/useMessageData.ts` | TanStack Query → Store bridge (fetches real API data) |
| `components/messaging/useMessageTracking.ts` | Analytics — 12 event types |
| `app/messages/page.tsx` | Page orchestrator — store, socket, tracking, panel layout |

---

## Zustand Store (`lib/messageStore.ts`)

### State

```typescript
interface MessageState {
  // Navigation
  selectedChannelId: string | null;   // P1 selection
  chatPersonId: string | null;        // P2 selection
  chatRoomId: string | null;          // Active room for chat

  // Data
  messages: Record<string, ChatMessage[]>;   // roomId → messages
  channelItems: Record<string, TreeItem[]>;  // channelId → P2 tree
  channelCounts: ChannelCount[];             // P1 badge counts
  rfqProducts: Record<string, RfqProduct[]>; // roomId → P6 products

  // Presence
  onlineUsers: Set<number>;
  typingUsers: Record<string, number[]>;     // roomId → userIds

  // Optimistic
  sendingIds: Set<string>;                   // temp message IDs in flight
}
```

### Actions

| Action | What it does |
|--------|-------------|
| `selectChannel(id)` | Set P1 channel, clear person/room |
| `selectPerson(id, roomId?)` | Set P2 person + room |
| `setMessages(roomId, msgs)` | Replace messages for room |
| `addMessage(roomId, msg)` | Append message |
| `addOptimisticMessage(roomId, msg)` | Append + track in sendingIds |
| `confirmMessage(roomId, tempId, realMsg)` | Replace temp with confirmed |
| `markAsRead(roomId)` | Set readAt on all messages |
| `setChannelItems(channelId, items)` | Set P2 tree data |
| `updateChildUnread(ch, parent, child, count)` | Update unread + recalculate parent |
| `setChannelCounts(counts)` | Set P1 counts |
| `incrementCount(ch, child?)` | +1 unread |
| `decrementCount(ch, child?)` | -1 unread |
| `setRfqProducts(roomId, products)` | Set P6 products |
| `updateAlternativePrice/Stock` | Edit alternative in store |
| `setUserOnline/Offline` | Toggle presence |
| `setTyping/clearTyping` | Typing indicators |

---

## P1 — Channel Tree (`MsgPanel1.tsx`)

### Structure (static — icons/labels/hierarchy)
```
Unread (count from API)
Support
  ├── Bot Support
  ├── Admin Support
  └── Notifications
Vendor Ops
  ├── Questions
  ├── Reviews
  ├── Complaints
  ├── RFQ
  ├── Product
  ├── Service
  └── Buy Group
Customer
  ├── Questions
  ├── My Reviews
  ├── Complaints
  ├── My RFQ
  └── Product Chat
Orders
  ├── Active
  ├── Shipping
  ├── Returns
  └── Disputes
Payment
  ├── Issues
  ├── Wallet
  └── Invoices
Team
  ├── Team Chat
  └── Notes
```

### Modes
- **Collapsed (130px)**: Compact tree — icon + short label + badge
- **Expanded (240px)**: Full tree with chevrons, labels, badges, active indicator
- **Hover**: Auto-expand on mouse enter, auto-collapse on leave (400ms delay)

### Data Source
- Counts from `useMessageStore().channelCounts` (API via `GET /chat/channels/summary`)
- Structure is static (`TREE_DEFAULT`) — only counts are dynamic

---

## P2 — Conversation Tree (`MsgPanel2.tsx`)

### Structure (from API)
Each channel has items (L1) with optional children (L2):

```
v_rfq channel:
  RFQ #5 · Bulk Electronics (L1, expandable)
    ├── Ahmed Al-Busaidi (L2, click → chat)
    └── Khalid Hassan (L2, click → chat)
  RFQ #6 · Audio Equipment (L1, expandable)
    └── Omar Al-Rawahi (L2, click → chat)
```

### Features
- **Per-item actions** (hover): Pin, Archive, Delete
- **Archived section** at bottom (collapsible)
- **Unread channel**: Dynamically collects all unread leaves from all channels
- **Same tree style as P1** — compact rows, no avatar cards

### Data Source
- Items from `useMessageStore().channelItems[channelId]` (API via `GET /chat/channels/:channelId/conversations`)
- Title from `CHANNEL_TREE` lookup (static)

### Mutations (real API)
- `useTogglePin()` → `PATCH /chat/rooms/:id/pin`
- `useToggleArchive()` → `PATCH /chat/rooms/:id/archive`
- `useDeleteRoom()` → `DELETE /chat/rooms/:id`

---

## P4 — Basic Chat (`MsgPanel4.tsx`)

Used for: Support, Orders, Payment, Team channels.

### Features
- Message list with bubbles (own = primary, other = muted)
- System messages (centered badges)
- Typing indicator (bouncing dots)
- Optimistic send with spinner
- Auto-scroll on new messages
- Mark-as-read on room open
- Enter to send, Shift+Enter for newline
- Attachment button (UI only)

### Data Source
- Messages from `useMessageStore().messages[chatRoomId]` via `useChat()` hook
- Send via `useSendMessage()` → socket emit + optimistic add

---

## P5 — RFQ/Product Chat (`MsgPanel5.tsx`)

Same as P4 but used for: `v_rfq`, `v_product`, `c_rfq`, `c_product` channels.

### Additional Features
- RFQ update system messages (amber for own, blue for other)
- Larger message width (80% vs 75%)
- Close button (X) instead of info button

---

## P6 — Product Panel (`MsgPanel6.tsx`)

### Role-Aware Rendering

| Feature | Vendor | Customer |
|---------|--------|----------|
| Edit price/stock | Input fields | Read-only text |
| Edit specs | Editable form | Read-only |
| Add from Store | Button → ProductSearch | Hidden |
| Delete alternative | Trash icon | Hidden |
| View specs | Pencil icon (edit) | Eye icon (view) |
| Action button | "Update Quote" (green) | "Add to Cart" (primary) |
| Pin/Archive | On hover | On hover |
| Delete product | On hover | Hidden |

### Tabs
1. **Products** — RFQ product cards with expandable alternatives
2. **Specs & Note** — Full product detail (editable for vendor, read-only for customer)

### Sticky Header
`[count] products  [total] OMR  [Update Quote / Add to Cart]` — always visible at top

### ProductSearch Overlay
When vendor clicks "Add Product from Store":
- P6 content replaced with single-column search interface
- Search input with autocomplete (`/product/searchSuggestions`)
- Tools: OCR, Barcode, Lens, Excel
- Filters: Price range, Rating stars, Stock only
- Product result cards with image, name, price, rating, stock, "Add" button
- Cards turn green after adding
- Back button returns to product list

### Data Source
- Products from `useMessageStore().rfqProducts[chatRoomId]` (API via `GET /chat/rooms/:id/rfq-products`)
- Price/stock changes → `updateAlternativePrice/Stock` in store
- Update Quote → socket emit `updateRfqQuote`

---

## Socket.io Events

### Frontend → Backend

| Event | Payload | Purpose |
|-------|---------|---------|
| `sendMessage` | `{ content, userId, roomId, rfqId }` | Send chat message |
| `typing` | `{ roomId, userId }` | Typing indicator |
| `markAsRead` | `{ roomId, userId }` | Mark messages read |
| `createPrivateRoom` | `{ creatorId, participants[], rfqId }` | Create new room |
| `updateRfqPriceRequest` | `{ id, status, roomId, ... }` | Approve/reject price |

### Backend → Frontend

| Event | Purpose | Store Action |
|-------|---------|-------------|
| `receivedMessage` | New message arrived | `addMessage()` |
| `messageConfirmed` | Server confirmed optimistic send | `confirmMessage()` |
| `typing` | Other user typing | `setTyping()` |
| `messagesRead` | Other user read messages | — |
| `userOnline` | User connected | `setUserOnline()` |
| `userOffline` | User disconnected | `setUserOffline()` |
| `updatedRfqPriceRequest` | RFQ price update | `addMessage()` (system) |
| `newRoomCreated` | Room created | — |

---

## REST API Endpoints

### Existing (reused)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/chat/createPrivateRoom` | Create room |
| POST | `/chat/send-message` | Send message (REST) |
| GET | `/chat/messages?roomId=X` | Get message history |
| PATCH | `/chat/read-messages` | Mark as read |
| GET | `/chat/find-room?rfqId=X&userId=X` | Find existing room |

### New (added for messaging system)
| Method | Path | Purpose | Panel |
|--------|------|---------|-------|
| GET | `/chat/channels/summary` | Channel unread counts | P1 |
| GET | `/chat/channels/:channelId/conversations` | Conversation tree | P2 |
| PATCH | `/chat/rooms/:roomId/pin` | Toggle pin | P2 |
| PATCH | `/chat/rooms/:roomId/archive` | Toggle archive | P2 |
| DELETE | `/chat/rooms/:roomId` | Leave room | P2 |
| GET | `/chat/rooms/:roomId/rfq-products` | RFQ products | P6 |
| PUT | `/chat/rooms/:roomId/rfq-products/:productId` | Update alternative | P6 |

---

## Database Schema (additions)

### Room (existing + new fields)
```prisma
model Room {
  type           String?   @db.VarChar(20)   // rfq, product, support, order, team
  channelId      String?   @db.VarChar(30)   // v_rfq, c_product, s_admin, etc.
  name           String?                      // display name
  lastMessageAt  DateTime?                    // for sorting
  @@index([channelId])
  @@index([lastMessageAt])
}
```

### Message (existing + new field)
```prisma
model Message {
  contentType    String?   @default("text") @db.VarChar(20)  // text, file, system, rfq_update
}
```

### RoomParticipants (existing + new fields)
```prisma
model RoomParticipants {
  lastReadAt     DateTime?
  isPinned       Boolean   @default(false)
  isArchived     Boolean   @default(false)
  @@unique([userId, roomId])
}
```

---

## Chat Widget (`components/support/ChatWidget.tsx`)

Floating button on all pages. Two modes:

### Support Tab
- Opens MessagingHub popup with bot greeting + Quick Actions menu
- Bot → Admin escalation flow
- Poll for responses every 3s

### Users Tab
- Fetches real rooms from API (`GET /chat/channels/summary` → conversations)
- Shows unread conversations with name, last message, time, badge
- "Open All" button opens all unread as simultaneous PopChat windows
- Clicking a conversation opens PopChat inside widget (not navigation)
- PopChat for user-to-user: real messages from API, send via REST, poll every 3s
- "View all in Messages" link at bottom → navigates to `/messages`

---

## Analytics Events (12 total)

| Event | When |
|-------|------|
| `messaging_page_viewed` | Page loads |
| `messaging_channel_selected` | P1 channel clicked |
| `messaging_conversation_opened` | P2 person clicked |
| `messaging_message_sent` | Message sent |
| `messaging_message_latency` | Server confirms send (ms) |
| `messaging_rfq_quote_updated` | Vendor clicks Update Quote |
| `messaging_rfq_added_to_cart` | Customer clicks Add to Cart |
| `messaging_panel_expanded` | Hover expands P1/P2 |
| `messaging_panel_collapsed` | Mouse leaves P1/P2 |
| `messaging_socket_connected` | Socket connects |
| `messaging_socket_disconnected` | Socket disconnects |
| `messaging_socket_error` | Socket error |
| `messaging_product_added_from_store` | Product added via search |

---

## Tests

### Frontend Unit (36 tests)
- `__tests__/messaging/messageStore.test.ts` — 21 tests (navigation, messages, counts, items, RFQ, presence)
- `__tests__/messaging/messageSocket.test.ts` — 5 tests (optimistic send, incoming, presence, counts)
- `__tests__/messaging/panelIntegration.test.ts` — 10 tests (full flows, concurrent ops)

### Frontend Integration (22 tests)
- `__tests__/e2e/api-integration.test.ts` — 9 tests (HTTP round-trip per endpoint)
- `__tests__/e2e/store-integration.test.ts` — 5 tests (API → Store transformation)
- `__tests__/e2e/socket-integration.test.ts` — 8 tests (socket delivery, typing, read)

### Frontend Connection (8 tests)
- `__tests__/e2e/connection.test.ts` — Health, auth, DB round-trip, socket, CORS

### Backend E2E (11 tests)
- `src/chat/e2e-messaging.spec.ts` — Full multi-user flow (create room, messages, channels, pin/archive, socket)

**Total: 77 tests across frontend + backend**

---

## File Inventory

```
frontend/
  app/messages/page.tsx                          # Page orchestrator
  components/messaging/
    MsgPanel1.tsx                                # P1 — Channel tree
    MsgPanel2.tsx                                # P2 — Conversation tree
    MsgPanel4.tsx                                # P4 — Basic chat
    MsgPanel5.tsx                                # P5 — RFQ/Product chat
    MsgPanel6.tsx                                # P6 — Product panel
    ProductSearch.tsx                            # Product search overlay (in P6)
    useChat.ts                                   # Shared chat hook
    useMessageData.ts                            # API → Store bridge
    useMessageTracking.ts                        # Analytics
  components/support/
    ChatWidget.tsx                               # Floating button
    MessagingHub.tsx                             # Popup hub (support + users)
  lib/
    messageStore.ts                              # Zustand store
    messageSocket.ts                             # Socket.io bridge
  apis/
    requests/chat.requests.ts                    # API functions (12 existing + 7 new)
    queries/chat.queries.ts                      # TanStack Query hooks (4 existing + 7 new)

backend/
  prisma/schema.prisma                           # Room, Message, RoomParticipants (updated)
  src/chat/
    chat.controller.ts                           # REST endpoints (15 existing + 7 new)
    chat.service.ts                              # Service methods (22 existing + 7 new)
    chat.gateway.ts                              # Socket events (5 existing + 4 new)
    dto/channel-conversations.dto.ts             # New DTO
    e2e-messaging.spec.ts                        # E2E test
```

---

## TODO / Future Work

- [ ] Wire ProductSearch "Add" to actually persist product to RFQ via API
- [ ] Wire OCR/Barcode/Lens/Excel tools in ProductSearch (currently UI only)
- [ ] AI Search button in ProductSearch (use AI endpoint)
- [ ] Real archived items from API (currently empty)
- [ ] Attachment upload in chat (UI button exists, not wired)
- [ ] Voice/video call buttons (UI exists, not wired)
- [ ] P6 Specs & Note tab — load real product specs from API
- [ ] Notification sound on new messages
- [ ] Unread badge on browser tab title
- [ ] Mobile responsive layout (current: desktop only)
- [ ] RTL testing across all panels
- [ ] Rate limit handling in API calls
- [ ] Reconnection handling for socket drops
- [ ] Message search across all rooms
- [ ] File/image preview in chat messages
- [ ] Message reply/quote functionality
- [ ] Read receipts (double check marks)
- [ ] Group chat support (team channels)
