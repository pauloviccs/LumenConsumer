# Design Spec: Food POS "VibeOne"

> [!IMPORTANT]
> **Core Directive**: Simplicity, Speed, and "No-Nonsense" Operations.
> **North Star**: Real-time synchronization. The kitchen sees what the payment server confirms instantly.

## 1. System Architecture

### High-Level Flow
`Customer (WhatsApp)` -> `Evolution API` -> `Webhook (Edge Function)` -> `Supabase DB` -> `Frontend (Realtime)`

1.  **Input**: Customer initiates order via WhatsApp bot (handled by Evolution API).
2.  **Processing**: Bot collects order -> Sends payload to Supabase Edge Function `create-order`.
3.  **Persistence**: Order saved in Supabase `orders` table with status `pending_payment`.
4.  **Payment**: Backend generates PIX Copy-Paste (Mercado Pago API) -> Returns to WhatsApp.
5.  **Confirmation**: Customer pays -> Mercado Pago Webhook hits Supabase -> Updates order to `paid`.
6.  **Realtime**: Supabase `on('UPDATE')` triggers Frontend.
    *   **Dashboard**: Card turns GREEN.
    *   **Kitchen**: Card APPEARS/FLASHES.
    *   **Audio**: "Cha-ching" sound plays.

## 2. Tech Stack

*   **Platform**: Windows Desktop App (Electron)
*   **Frontend**: Vite + React + TypeScript
*   **Styling**: TailwindCSS (Dark Mode Default) + Shadcn/UI
*   **State/Data**: Supabase Client (Realtime Subscriptions)
*   **Icons**: Lucide React
*   **Routing**: React Router DOM (MemoryRouter recommended for Electron)
*   **Utils**: `date-fns` (time), `use-sound` (notification audio)

## 3. Database Schema (Supabase)

### `orders`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `customer_phone` | text | from WhatsApp |
| `customer_name` | text | |
| `status` | enum | `pending_payment`, `paid`, `preparing`, `ready`, `delivering`, `completed`, `cancelled` |
| `total_amount` | numeric | |
| `payment_id` | text | MP reference |
| `created_at` | timestamp | |

### `order_items`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `order_id` | uuid | FK -> orders.id |
| `product_name` | text | Snapshot of name at time of order |
| `quantity` | int | |
| `price` | numeric | Snapshot of price |
| `notes` | text | "Sem cebola", etc. |

### `products`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `name` | text | |
| `price` | numeric | |
| `category` | text | |
| `is_available` | boolean | Toggle for kitchen to 86 items |

## 4. UI/UX Specifications

### Global Styles
*   **Background**: `#09090b` (Zinc 950 - Deep Dark)
*   **Card Surface**: `#18181b` (Zinc 900)
*   **Text**: `#f4f4f5` (Zinc 100)
*   **Status Colors**:
    *   🔴 `pending_payment`: `bg-red-500/10 text-red-500 border-red-500/20`
    *   🟡 `preparing`: `bg-yellow-500/10 text-yellow-500 border-yellow-500/20`
    *   🟢 `ready/delivering`: `bg-green-500/10 text-green-500 border-green-500/20`

### Views

#### 1. `/dashboard` (The "Control Center")
*   **Layout**: Kanban-style or Grid of active cards.
*   **Card Anatomy**:
    *   **Header**: Order #ID (Last 4 chars) + Time Elapsed (e.g., "12 min ago" in RED if > 30min).
    *   **Body**: List of items (condensed).
    *   **Footer**: BIG Action Button.
        *   If `paid`: Button "ENVIAR P/ COZINHA" (or Auto).
        *   If `preparing`: Button "DESPACHAR".
*   **Alerts**: Top banner if WhatsApp/Socket disconnects.

#### 2. `/kitchen` (The "Chef's Display")
*   **Layout**: High contrast, huge generic font.
*   **Focus**: Only `preparing` orders.
*   **Interaction**: Touch anywhere on card to mark "READY".

#### 3. `/admin` (The "Owner's Safe")
*   **Security**: Requires 4-digit PIN.
*   **Content**: Daily total, Product Editor (Enable/Disable items), WhatsApp Connection Status.

## 5. Implementation Phases

### Phase 1: The Skeleton
1.  Setup Vite project with Tailwind.
2.  Define Supabase Typedefs.
3.  Create Mock Data hook for frontend dev (before hooking up real backend).

### Phase 2: The Interface
1.  Build `OrderCard` component (The atomic unit of the UI).
2.  Build `KanbanBoard` layout.
3.  Implement Color/Status logic.

### Phase 3: The Brain (Realtime)
1.  Connect Supabase Client.
2.  Implement `useRealtimeOrders` hook.
3.  Test "Fake Webhook" (manually inserting row in DB to see UI update).

### Phase 4: Integration (Stubbed for now)
1.  Since we don't have the live WhatsApp instance yet, we will simulate the "Input" via a hidden "Debug Panel" that injects orders.

## User Review Required
> [!WARNING]
> We will initially mock the Evolution API and Mercado Pago webhooks using a "Debug Panel" in the app so we can build the UI/UX immediately without needing the actual WhatsApp infrastructure live yet. Is this acceptable?
