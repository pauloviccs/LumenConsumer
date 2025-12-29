# Implementation Plan - Backend Integration & Sidecar Adaptation

**Goal**: Eradicate all "placeholder" logic in `vibe-one` by implementing real backend services and adapting superior UI/UX from the `sidecar` (Lovable) repository.

## User Review Required
> [!IMPORTANT]
> The `useOrders.ts` hook currently drives the application with static array data. This will be completely rewritten to fetch from Supabase. Any components relying strictly on the mock array structure might need type adjustments.

## Proposed Changes

### 1. Replace Mock Data (`useOrders.ts`)
The current `useOrders.ts` contains a hardcoded `mockOrders` array.
- **Action**: Rewrite `useOrders` to using `supabase.from('orders').select(...)`.
- **Realtime**: Ensure it subscribes to changes (already validated in Dashboard, but needs to be central).

### 2. Implement Real Order Creation
Currently `addMockOrder` in `Dashboard.tsx` generates random garbage data.
- **Action**: Create `CreateOrderDialog.tsx` (using Shadcn Dialog).
- **Features**: Select Product, Quantity, Customer Name.
- **Backend**: Insert into `orders` and `order_items` via valid internal API/Supabase.

### 3. Sidecar Adaptation (Lovable UI)
Analyze `sidecar/src` for better components.
- **Action**: specific components identified in `sidecar` will be ported to `vibe-one` to match the "100% adaptation" goal.
- **Priority**: Login Screen, Order Card, Kanban styling.

## Verification Plan

### Manual Verification
- **Create Order**: Use the new Dialog to create an order. Verify it appears in Supabase `orders` table.
- **Realtime**: open two tabs. Create in one, see in the other.
- **Persistence**: Refresh page. Orders must remain (replacing the temporary memory state of mocks).
