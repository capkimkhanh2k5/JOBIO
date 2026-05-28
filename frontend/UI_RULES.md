# JOBIO Frontend — Unified Design System (UI_RULES.md)

> **Authority:** This document is the single source of truth for all UI decisions across the `admin`, `candidate`, and `company` modules. All new components and refactors must conform to these rules.
>
> **Reference implementation:** The `admin` module is the canonical design reference. When in doubt, match admin patterns.

---

## 1. Tech Stack & Tooling

| Concern | Tool |
|---|---|
| Framework | React 19 + TypeScript 5 |
| Build | Vite 7 |
| Styling | TailwindCSS 4 (`@import "tailwindcss"`) |
| Component primitives | shadcn/ui (New York style, neutral base) |
| Radix UI | Underlying primitives for all interactive components |
| Icons | `lucide-react` exclusively |
| Animation | `framer-motion` (primary), GSAP (public pages only) |
| State | Zustand 5 (client), TanStack Query 5 (server) |
| Forms | react-hook-form + zod + @hookform/resolvers |
| Utilities | `cn()` from `@/lib/utils` (clsx + tailwind-merge) |

---

## 2. Color System

### 2.1 CSS Variables (index.css — canonical)

All colors must use the OKLCH-based CSS variables defined in `src/index.css`. Do **not** use the legacy HSL variables from `globals.css` in new code.

```css
/* Light mode */
--background: oklch(0.98 0.01 250)   /* near-white, slight blue tint */
--foreground: oklch(0.145 0 0)        /* near-black */
--primary: oklch(0.55 0.22 260)       /* violet-blue — brand primary */
--primary-foreground: oklch(0.985 0 0)
--border: oklch(0.9 0.01 250)
--muted-foreground: oklch(0.556 0 0)
--radius: 0.625rem
```

### 2.2 Semantic Color Palette

| Role | Tailwind Class | Usage |
|---|---|---|
| Brand primary | `violet-600` | Active nav, primary CTAs, focus rings |
| Brand accent | `cyan-500` | Gradients, highlights, AI features |
| Success | `emerald-500/600` | Positive states, verified badges |
| Warning | `amber-500` | Pending states, caution |
| Danger | `red-600` | Destructive actions, error badges |
| Info | `blue-600` | Informational, links |
| Neutral text | `slate-900/700/600/500/400` | Heading → body → label → muted |
| Surface | `white` / `slate-50` | Card backgrounds |
| Border | `slate-200` / `slate-100` | Card borders, dividers |

### 2.3 Brand Gradient

```
from-cyan-400 to-violet-500   ← logo text, avatar fallbacks, hero elements
from-violet-600 to-indigo-600 ← primary action buttons
```

### 2.4 Status Color Map (shared across all modules)

```ts
const STATUS_COLORS = {
  pending:     'bg-amber-50  text-amber-700  border-amber-200',
  reviewing:   'bg-blue-50   text-blue-700   border-blue-200',
  shortlisted: 'bg-purple-50 text-purple-700 border-purple-200',
  interview:   'bg-amber-50  text-amber-700  border-amber-200',
  offered:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  accepted:    'bg-green-50  text-green-700  border-green-200',
  rejected:    'bg-red-50    text-red-700    border-red-200',
  withdrawn:   'bg-slate-50  text-slate-500  border-slate-200',
  published:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft:       'bg-slate-50  text-slate-500  border-slate-200',
  closed:      'bg-rose-50   text-rose-700   border-rose-200',
  expired:     'bg-orange-50 text-orange-700 border-orange-200',
  active:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  banned:      'bg-red-50    text-red-700    border-red-200',
  verified:    'bg-emerald-50 text-emerald-700 border-emerald-200',
};
```

---

## 3. Typography Scale

All text uses `'Plus Jakarta Sans', 'Inter', sans-serif` (set on `body`).

| Token | Classes | Usage |
|---|---|---|
| `label-xs` | `text-[10px] font-black uppercase tracking-[0.2em] text-slate-400` | Section labels, table headers, panel titles |
| `label-sm` | `text-xs font-bold uppercase tracking-wider text-slate-500` | Sub-labels, badge text |
| `body-sm` | `text-sm font-medium text-slate-500` | Descriptions, secondary text |
| `body` | `text-sm font-semibold text-slate-700` | Nav items, card labels |
| `body-lg` | `text-base font-bold text-slate-900` | Card titles, section headings |
| `kpi-sm` | `text-xl font-black text-slate-900` | Small KPI values |
| `kpi` | `text-3xl font-black text-slate-900 tracking-tight` | Primary KPI numbers |
| `page-title` | `text-2xl font-black text-slate-900 tracking-tight` | Page headings |

**Rules:**
- Use `font-black` (900) for all headings, KPI values, and page titles.
- Use `font-bold` (700) for card titles and section headings.
- Use `font-semibold` (600) for nav items and interactive labels.
- Use `font-medium` (500) for body text and descriptions.
- Never use `font-normal` (400) in dashboard UIs.

---

## 4. Spacing & Layout

### 4.1 Page Layout

```
Page padding:   p-6 lg:p-8
Section gaps:   space-y-6 (standard) | space-y-8 (generous)
Card padding:   p-4 (compact) | p-5 (standard) | p-6 (large)
Grid gaps:      gap-4 (tight) | gap-6 (standard)
```

### 4.2 Sidebar

- Width: `w-64` (256px), fixed
- Admin: `h-screen sticky top-0` (full viewport height, no offset)
- Candidate/Company: `h-[calc(100vh-112px)] sticky top-[112px]` (offset for public Header)

### 4.3 Content Area

- All dashboard pages: `p-6 lg:p-8 space-y-6 w-full flex-1`
- Never use `max-w-*` constraints on dashboard content — let it fill the available space.

---

## 5. Border Radius Scale

| Token | Class | Usage |
|---|---|---|
| `sm` | `rounded-lg` (8px) | Inputs, small buttons, tags |
| `md` | `rounded-xl` (12px) | Nav items, icon containers, small cards |
| `lg` | `rounded-2xl` (16px) | Standard cards, modals |
| `xl` | `rounded-3xl` (24px) | Large cards, stat cards, containers |
| `pill` | `rounded-full` | Badges, avatars, pill buttons |
| `hero` | `rounded-[32px]` | Glass cards, header pill |

**Rule:** Dashboard cards use `rounded-2xl` (admin) or `rounded-3xl` (candidate/company). Never mix within the same module.

---

## 6. Card Patterns

### 6.1 Admin Card (canonical — clean white)

```tsx
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
  {/* content */}
</div>
```

### 6.2 Dashboard Card (candidate/company — clean white, consistent with admin)

```tsx
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
  {/* content */}
</div>
```

> **Note:** The candidate module previously used heavy glassmorphism (`bg-white/60 backdrop-blur-xl border border-white/40`). This has been **standardized to clean white** to match the admin design language. Glassmorphism is reserved for the public-facing site only.

### 6.3 Card Icon Header Pattern

```tsx
<div className="flex items-center gap-3 mb-5">
  <div className="w-9 h-9 rounded-xl bg-{color}-100 flex items-center justify-center shrink-0">
    <Icon className="w-4 h-4 text-{color}-600" />
  </div>
  <div>
    <h3 className="font-bold text-base text-slate-900">{title}</h3>
    <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
  </div>
</div>
```

---

## 7. KPI Card Component

Use the shared `DashboardKpiCard` component from `@/components/shared/DashboardKpiCard` for all metric cards across all modules.

```tsx
<DashboardKpiCard
  icon={<Users className="w-5 h-5" />}
  label="Tổng ứng viên"
  value={1234}
  deltaValue={12}          // optional: % change
  iconGradient="from-violet-500 to-violet-600"  // optional
  isLoading={false}
/>
```

**Props:**
- `icon` — Lucide icon element
- `label` — metric label string
- `value` — numeric value
- `formattedValue` — override display string (e.g. currency)
- `deltaValue` — trend delta (positive = up, negative = down)
- `unit` — unit suffix (e.g. "₫")
- `iconGradient` — Tailwind gradient classes for icon background
- `isLoading` — shows skeleton when true

---

## 8. Navigation & Active States

### 8.1 Sidebar Nav Item (all modules)

```tsx
// Active state
'bg-violet-50 text-violet-700 border border-violet-100'

// Inactive state
'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'

// Active indicator bar (framer-motion layoutId)
<motion.span
  layoutId="{module}-sidebar-active"
  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-600 rounded-r-md -ml-3"
/>
```

### 8.2 Tab Navigation

```tsx
// Underline tab style (used in list pages)
<TabsTrigger className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-600 data-[state=active]:text-violet-700 px-1 py-3 text-sm font-semibold text-slate-500 shadow-none data-[state=active]:shadow-none" />

// Pill tab style (used in filter panels)
<TabsTrigger className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-6 py-2 text-sm font-semibold" />
```

### 8.3 Badge Counts (notification badges)

```tsx
<span className="min-w-[20px] h-5 text-[10px] font-bold bg-red-100 text-red-700 rounded-full flex items-center justify-center px-1.5 border border-red-200">
  {count > 99 ? '99+' : count}
</span>
```

---

## 9. Button Standards

Use the shadcn `Button` component from `@/components/ui/button` with these conventions:

| Variant | Usage |
|---|---|
| `default` | Primary actions (uses `--primary` CSS var = violet) |
| `destructive` | Delete, remove, ban actions |
| `outline` | Secondary actions, cancel |
| `ghost` | Tertiary actions, icon buttons |
| `link` | Inline text links |

**Custom primary button (gradient):**
```tsx
<Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md">
  Action
</Button>
```

**Sizes:**
- `sm` — `h-8 px-3 text-xs` — inline actions, table row buttons
- `default` — `h-9 px-4` — standard
- `lg` — `h-10 px-8` — primary CTAs

---

## 10. Animation Standards

### 10.1 Page Entry Animation

Use the `fadeUp` helper consistently:

```ts
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
});
```

Apply with staggered delays: `0`, `0.06`, `0.12`, `0.18`, `0.24`...

### 10.2 Sidebar Item Stagger

```ts
const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.04, duration: 0.3 }
  }),
};
```

### 10.3 List Item Entry

```ts
// For list/grid items
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.95 }}
transition={{ duration: 0.2, delay: idx * 0.05 }}
```

### 10.4 Card Hover

```tsx
whileHover={{ y: -3, transition: { duration: 0.15 } }}
```

### 10.5 Rules

- Use `AnimatePresence` with `mode="popLayout"` for list mutations.
- Use `layoutId` for shared element transitions (active nav indicator).
- Keep animations under 500ms. No infinite animations in dashboard areas.
- Lenis smooth scroll is **disabled** in all dashboard areas (`/admin`, `/candidate`, `/company`).

---

## 11. Layout Architecture

### 11.1 Admin Layout

```
AdminLayout
├── AdminSidebar (w-64, h-screen, sticky top-0, bg-white, border-r border-slate-200)
└── div.flex-1.flex.flex-col
    ├── AdminTopNav (h-14, sticky top-0, bg-white/80 backdrop-blur-md, border-b)
    └── main (bg-[#fcfcfd])
        └── Outlet (p-6 lg:p-8)
```

### 11.2 Candidate Layout

```
CandidateLayout
├── ScrollProgress
├── Header (public, fixed, glass pill, z-50)
└── div.flex.flex-1.pt-[112px]
    ├── CandidateSidebar (w-64, h-[calc(100vh-112px)], sticky top-[112px])
    └── main.flex-1
        ├── Outlet
        └── MiniFooter
```

### 11.3 Company Layout

```
CompanyLayout (identical structure to CandidateLayout)
├── ScrollProgress
├── Header (public, fixed, glass pill, z-50)
└── div.flex.flex-1.pt-[112px]
    ├── CompanySidebar (w-64, h-[calc(100vh-112px)], sticky top-[112px])
    └── main.flex-1
        ├── Outlet
        └── MiniFooter
```

### 11.4 Sidebar Background

- **Admin:** `bg-white border-r border-slate-200` — clean, opaque
- **Candidate/Company:** `bg-white border-r border-slate-200` — **standardized to match admin** (previously used `bg-white/2 backdrop-blur-lg border-r border-white/5`)

---

## 12. Page Header Component

Use `PageHeader` from `@/components/shared/PageHeader` on every dashboard page.

```tsx
<PageHeader
  title="Page Title"
  description="Optional subtitle text."
  icon={IconComponent}
  action={<Button>Primary Action</Button>}
/>
```

**Rules:**
- Always wrap in `<div className="sticky top-0 z-20">` for scroll behavior.
- Icon color: `text-violet-600` (default in component).
- Title: `text-2xl font-black text-slate-900 tracking-tight`.

---

## 13. Empty State Component

Use `EmptyState` from `@/components/shared/EmptyState` for all empty data states.

```tsx
<EmptyState
  icon={<FileText className="w-8 h-8 text-slate-400" />}
  title="Không có dữ liệu"
  description="Mô tả ngắn gọn về trạng thái trống."
  action={{ label: "Thêm mới", onClick: () => {} }}
/>
```

**Standard empty state styling:**
```tsx
// Container
className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white h-[300px]"

// Icon container
className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4"
```

---

## 14. Loading States

### 14.1 Skeleton Pattern

```tsx
// Card skeleton
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
  <Skeleton className="w-10 h-10 rounded-xl" />
  <Skeleton className="h-8 w-24" />
  <Skeleton className="h-4 w-32" />
</div>

// List skeleton
{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
```

### 14.2 Inline Spinner

```tsx
<div className="flex items-center justify-center" style={{ height }}>
  <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
</div>
```

---

## 15. Form Standards

### 15.1 Input

```tsx
<Input
  className="bg-white border-slate-200 focus-visible:ring-violet-500/20 focus-visible:border-violet-300 rounded-xl"
  placeholder="..."
/>
```

### 15.2 Search Input

```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
  <Input className="pl-9 bg-white border-slate-200 rounded-xl" placeholder="Tìm kiếm..." />
</div>
```

### 15.3 Form Layout

- Use `react-hook-form` + `zod` for all forms.
- Wrap fields in `<Form>` from `@/components/ui/form`.
- Error messages: `text-sm text-red-600 mt-1`.

---

## 16. Table Standards

```tsx
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
  <table className="w-full text-sm">
    <thead>
      <tr className="bg-slate-50/50 border-b border-slate-100">
        <th className="text-left py-3 px-6 font-black text-[10px] uppercase tracking-wider text-slate-500">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100">
      <tr className="hover:bg-slate-50/50 transition-colors">
        <td className="py-3 px-6 text-sm text-slate-700">...</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 17. Responsive Standards

| Breakpoint | Behavior |
|---|---|
| `< md` (< 768px) | Sidebar hidden, single column layout |
| `md` (768px+) | Sidebar visible (`hidden md:flex`), 2-column grids |
| `lg` (1024px+) | Full padding (`p-8`), 3-4 column grids |
| `xl` (1280px+) | Multi-column dashboard layouts |

**Grid patterns:**
```
KPI cards:    grid-cols-2 lg:grid-cols-4
Charts:       grid-cols-1 xl:grid-cols-3 (2/3 + 1/3 split)
Content:      grid-cols-1 md:grid-cols-12 (8/4 split)
```

**Rules:**
- Sidebars are always `hidden md:flex` — never visible on mobile without a drawer.
- All text must be readable at 320px viewport width.
- Touch targets minimum 44×44px.

---

## 18. Accessibility Standards

- All interactive elements must have `aria-label` when icon-only.
- Use semantic HTML: `<header>`, `<nav>`, `<main>`, `<aside>`, `<section>`.
- Sidebars: `<aside aria-label="{Module} Navigation">`.
- Focus rings: `focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:ring-offset-2`.
- Color contrast: minimum 4.5:1 for body text, 3:1 for large text.
- Loading states: use `aria-busy="true"` on loading containers.
- Keyboard navigation: all interactive elements reachable via Tab.
- `disabled` buttons: `disabled:pointer-events-none disabled:opacity-50`.

---

## 19. Coding Conventions

### 19.1 Component Structure

```tsx
// 1. Imports (external → internal → types)
// 2. Types/interfaces
// 3. Constants (outside component)
// 4. Component function
//    a. Hooks
//    b. Derived state / memos
//    c. Handlers
//    d. Render
// 5. Sub-components (if small, co-located)
```

### 19.2 Naming

- Components: `PascalCase`
- Files: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- CSS classes: Tailwind only, no custom CSS unless adding to `index.css` utilities
- Event handlers: `handle{Action}` (e.g. `handleDelete`, `handleSubmit`)
- Query keys: `['module', 'resource', 'qualifier']` (e.g. `['candidate', 'applications']`)

### 19.3 cn() Usage

Always use `cn()` from `@/lib/utils` for conditional class merging:

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className
)} />
```

### 19.4 Data Fetching

```tsx
const { data, isLoading } = useQuery({
  queryKey: ['module', 'resource'],
  queryFn: () => service.method().then(r => r.data),
  staleTime: 60_000,  // tune per data freshness need
});
```

### 19.5 Mutation Pattern

```tsx
const mutation = useMutation({
  mutationFn: (id: string) => service.delete(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['module', 'resource'] });
    toast.success('Thành công');
  },
  onError: () => toast.error('Có lỗi xảy ra, vui lòng thử lại.'),
});
```

---

## 20. UX Consistency Rules

1. **Toast notifications:** Use `sonner` (`toast.success`, `toast.error`, `toast.warning`). Position: `top-center`.
2. **Confirmation dialogs:** Use `AlertDialog` from shadcn for all destructive actions.
3. **Detail panels:** Use `Sheet` (slide-in) for detail views, not full-page navigation.
4. **Pagination:** Always show page info, rows-per-page selector, and prev/next buttons.
5. **Search:** Debounce at 250ms. Show clear button when query is non-empty.
6. **Date formatting:** Use `date-fns` with `vi` locale. Format: `dd/MM/yyyy` for dates, `HH:mm` for times.
7. **Currency:** Use `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.
8. **Error states:** Always show a user-friendly message. Never expose raw API errors.
9. **Optimistic updates:** Use `queryClient.setQueryData` for immediate UI feedback on mutations.
10. **Scroll to top:** Handled globally in `App.tsx` on route change — do not add per-page scroll logic.

---

## 21. Detected Inconsistencies (Pre-Refactor)

The following inconsistencies were identified and resolved in the refactor:

| Issue | Location | Fix |
|---|---|---|
| Glassmorphism cards (`bg-white/60 backdrop-blur-xl`) | Candidate module | Replaced with clean white cards matching admin |
| Sidebar background (`bg-white/2 backdrop-blur-lg border-white/5`) | Candidate + Company sidebars | Standardized to `bg-white border-r border-slate-200` |
| `rounded-3xl` on all cards | Candidate module | Standardized to `rounded-2xl` for cards, `rounded-3xl` for large containers |
| Inline `StarIcon` SVG component | `MyApplications.tsx` | Replaced with `lucide-react` `Star` icon |
| `CompanyTopNav` unused (company uses public `Header`) | Company module | Removed from layout, `Header` is canonical |
| Duplicate `EmptyState` inline implementations | Multiple pages | Replaced with shared `EmptyState` component |
| Inconsistent tab styles (underline vs pill) | Candidate pages | Standardized: underline for list filters, pill for mode switches |
| `PageHeader` not sticky in some pages | Company pages | Wrapped in `<div className="sticky top-0 z-20">` consistently |
| Pagination buttons using raw `border-white/10 bg-white/5` | `ManageJobs.tsx` | Standardized to `border-slate-200 bg-white` |
| `font-semibold` vs `font-bold` inconsistency in sidebar | Candidate vs Admin | Standardized to `font-semibold` for nav items |

---

## 22. Reusable Components Inventory

### Shared (`@/components/shared/`)

| Component | Purpose |
|---|---|
| `DashboardKpiCard` | **NEW** — Unified KPI metric card for all modules |
| `PageHeader` | Page title + description + action slot |
| `EmptyState` | Empty data state with icon, title, description, CTA |
| `ConfirmModal` | Reusable confirmation dialog |
| `Logo` | Brand logo with configurable sizes |
| `ScrollProgress` | Fixed top progress bar |
| `QueryState` | Loading/error/empty state handler |
| `ErrorBoundary` | React error boundary |
| `PageSkeleton` / `SuspenseFallback` | Route-level loading states |
| `AuroraBackground` | Public pages only — animated aurora orbs |
| `GlassCard` | Public pages only — glassmorphism card |
| `NotificationBell` | Bell icon with unread badge |

### UI Primitives (`@/components/ui/`)

All shadcn/ui components. Use as-is. Extend via `className` prop only.

---

## 23. File Organization

```
src/
├── components/
│   ├── admin/          # Admin-specific components
│   ├── candidate/      # Candidate-specific components
│   ├── company/        # Company-specific components
│   ├── layout/         # Public site layout (Header, Footer, RouteGuards)
│   ├── shared/         # Cross-module shared components ← prefer here
│   └── ui/             # shadcn primitives ← never modify directly
├── pages/
│   ├── admin/
│   ├── candidate/
│   ├── company/
│   └── shared/         # Shared pages (BlogManagement, etc.)
├── services/           # API service layer (axios)
├── store/              # Zustand stores
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
└── lib/
    └── utils.ts        # cn(), formatDate(), formatCurrency(), etc.
```

---

## 24. Do's and Don'ts

### ✅ Do

- Use `cn()` for all conditional class merging
- Use `DashboardKpiCard` for all metric cards
- Use `PageHeader` on every dashboard page
- Use `EmptyState` for all empty data states
- Use `framer-motion` `fadeUp` helper for page sections
- Use `toast.success/error` for all user feedback
- Use `AlertDialog` for all destructive confirmations
- Use semantic HTML elements
- Add `aria-label` to all icon-only buttons
- Use `staleTime` on all queries

### ❌ Don't

- Don't use glassmorphism (`backdrop-blur`, `bg-white/60`) in dashboard areas
- Don't use inline SVG icons — use `lucide-react`
- Don't use `max-w-*` constraints on dashboard content areas
- Don't use `font-normal` in dashboard UIs
- Don't add custom CSS outside `index.css` utilities
- Don't use `globals.css` HSL variables in new code
- Don't create duplicate status color maps — use the shared one
- Don't use `window.location` for navigation — use `useNavigate`
- Don't skip loading states — always show skeleton or spinner
- Don't expose raw API error messages to users
