# Visual Rework: Lovable.ai Design System

The user requested to implement the UI/UX from the reference repository `lumen-ponto-venda` (Lovable.ai). This involves a significant stylistic overhaul, focusing on a "Dark POS Theme" with custom gradients, animations, and specific components.

## User Review Required
> [!IMPORTANT]
> This plan replaces the current frontend styling with the "Lovable" theme.
> - **Theme**: Dark Mode only (Hardcoded HSL variables).
> - **Font**: Inter & JetBrains Mono.
> - **Dependencies**: Requires `tailwindcss-animate`, `lucide-react`, `recharts`.

## Proposed Changes

### 1. Foundation & Theming
Copy the core design tokens and configuration from the reference project.
#### [MODIFY] [tailwind.config.js](file:///g:/GitHub/Vibecoding/LumenConsumer/vibe-one/tailwind.config.js)
- Update to match `reference-ui/tailwind.config.ts`.
- Add custom colors (`sidebar`, `status`), animations (`glow`, `slide-in`), and keyframes.

#### [MODIFY] [index.css](file:///g:/GitHub/Vibecoding/LumenConsumer/vibe-one/src/index.css)
- Replace content with `reference-ui/src/index.css`.
- Define all HSL CSS variables for the dark theme.
- Add utility classes (`.glow-primary`, `.status-badge`).

### 2. Design System Components (Shadcn)
Ensure we have the necessary UI primitives.
#### [NEW/VERIFY] `src/components/ui/`
- `badge.tsx` (Status indicators)
- `card.tsx` (Kanban items)
- `scroll-area.tsx` (Kanban columns)
- `separator.tsx`
- `sheet.tsx` (Mobile sidebar)
- `tooltip.tsx`

### 3. Core Feature Components
Port the high-level components that define the Lovable UX.
#### [NEW] [Sidebar.tsx](file:///g:/GitHub/Vibecoding/LumenConsumer/vibe-one/src/components/Sidebar.tsx)
- **Replace existing Sidebar**: Update with the "Floating/Glass" aesthetic.
- Uses `NavLink` component for active states.

#### [NEW] [StatsCard.tsx](file:///g:/GitHub/Vibecoding/LumenConsumer/vibe-one/src/components/StatsCard.tsx)
- Displays metrics (Orders, Revenue) with `recharts` sparklines or simple counts.
- Uses `card-gradient` and `glow` effects.

#### [NEW] [KanbanBoard.tsx](file:///g:/GitHub/Vibecoding/LumenConsumer/vibe-one/src/components/KanbanBoard.tsx)
- **KanbanColumn**: Handles "Pending", "Preparing", "Ready" states.
- **OrderCard**: The "Ticket" look with timer and status badges.
- **Animations**: `framer-motion` or CSS animations for dragging/updating.

### 4. Page Integration
#### [MODIFY] [Dashboard.tsx](file:///g:/GitHub/Vibecoding/LumenConsumer/vibe-one/src/pages/Dashboard.tsx)
- Implement the "Grid Layout" with Stats on top and Kanban below.
- Integrate the new `Sidebar` layouts.

## Verification Plan
### Automated Tests
- Build verification: `npm run build` to ensure Tailwind config is valid.

### Manual Verification
- **Visual Check**: Run `npm run dev` and compare side-by-side with reference.
- **Responsiveness**: Check mobile view (Sidebar should collapse/sheet).
- **Theme**: Verify variables (`--primary`, `--background`) are correctly applied.
