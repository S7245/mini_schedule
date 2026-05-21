# Admin + Brand Backoffice Design

## Summary

This document defines how the current `web/` monorepo evolves from three independent Next.js apps into a shared backoffice system for `apps/admin` and `apps/brand`, while keeping `apps/app` on a separate consumer-facing product path.

The project does **not** adopt `next-shadcn-dashboard-starter` as an implementation scaffold. Instead, it absorbs its strengths as a reference for:

- protected backoffice shell structure
- page-level product patterns
- consistent information hierarchy
- reusable admin-oriented UI building blocks
- responsive admin skeleton behavior, including collapsible desktop navigation and mobile navigation

The selected direction is to introduce a shared package named `packages/admin-system` that provides a reusable backoffice design system for `admin` and `brand`, without coupling to API logic or authentication storage details.

## Problem

The current `admin` experience is functionally correct but visually and structurally primitive:

- protected pages are rendered inside a simple sidebar + content wrapper
- dashboard pages are card demos rather than product-level overview pages
- list/detail/settings page patterns are not formalized
- login pages are plain forms without a dedicated backoffice entry shell
- `admin` and `brand` are likely to diverge into duplicated shells and page conventions if developed independently

This creates two risks:

1. the team cannot reach a mature admin product experience by iterating page-by-page without a shared system
2. `admin` and `brand` will accumulate separate layout and component stacks that become expensive to unify later

## Goals

- Build a shared backoffice product system for `apps/admin` and `apps/brand`
- Keep the current monorepo direction and avoid replacing the architecture with an external admin scaffold
- Use `next-shadcn-dashboard-starter` only as a structural and UX reference
- Keep business logic, routing, and API hooks app-specific
- Keep `apps/app` completely outside the backoffice system
- Allow the current `admin` dashboard and login flow to evolve into mature product pages without changing the underlying auth flow

## Non-Goals

- Do not introduce a shared UI system for `apps/app`
- Do not move business hooks or business DTOs into the shared backoffice package
- Do not let the shared backoffice package own authentication persistence or token refresh
- Do not copy template code directly from the reference starter
- Do not redesign the API layer as part of this work

## Chosen Approach

### Recommendation

Adopt a three-layer backoffice architecture:

1. `packages/config`
   - visual tokens, shared Tailwind and lint rules
2. `packages/admin-system`
   - shared shell, page templates, and backoffice UI building blocks
3. `apps/admin` and `apps/brand`
   - route definitions, page composition, business hooks, business forms, permission rules

This provides the closest match to the desired "mature admin product experience" while preserving the existing monorepo direction.

### Alternatives Considered

#### A. Keep evolving each app independently

Pros:

- lowest short-term cost
- no new shared package required

Cons:

- duplicates shell and page patterns across `admin` and `brand`
- weak consistency
- does not scale into a shared backoffice language

#### B. Share only the outer shell

Pros:

- unifies sidebar, topbar, and page container quickly
- lower complexity than a full design system

Cons:

- list/detail/settings/dashboard pages still drift
- solves structure, not product language

#### C. Share a backoffice design system

Pros:

- matches the target outcome
- gives `admin` and `brand` a long-lived shared foundation
- keeps business logic local to each app

Cons:

- needs more careful boundary design up front
- requires phased migration rather than one-off page edits

This document selects **C**.

## Package Boundaries

### `packages/config`

Responsibilities:

- color, radius, spacing, typography tokens
- Tailwind base rules
- ESLint and shared config

Rules:

- `admin-system` consumes tokens from here
- `admin-system` does not define a parallel visual token set

### `packages/admin-system`

Responsibilities:

- backoffice application shell
- page templates
- shared admin-oriented components
- navigation and page metadata models
- login shell and protected-area shell

Rules:

- no API calls
- no direct dependency on app business concepts like brands, courses, admins, or users
- no ownership of session persistence or token storage
- owns the shared backoffice skeleton components it needs instead of importing shadcn/ui files from `apps/admin` or `apps/brand`
- may depend directly on generic UI primitives such as Radix components, `lucide-react`, `clsx`, and `tailwind-merge` when those dependencies serve shared shell behavior

### `apps/admin`

Responsibilities:

- admin route tree
- admin business data composition
- admin permission rules
- admin-specific forms and operations
- admin navigation configuration

### `apps/brand`

Responsibilities:

- brand route tree
- brand business data composition
- brand permission rules
- brand-specific forms and operations
- brand navigation configuration

### `apps/app`

Responsibilities:

- remains consumer-facing
- does not depend on `packages/admin-system`

## Proposed Directory Layout

```txt
web/
├── apps/
│   ├── admin/
│   ├── brand/
│   └── app/
├── packages/
│   ├── api/
│   ├── config/
│   ├── types/
│   └── admin-system/
│       └── src/
│           ├── shell/
│           │   ├── app-shell.tsx
│           │   ├── sidebar.tsx
│           │   ├── topbar.tsx
│           │   ├── page-container.tsx
│           │   └── protected-app-layout.tsx
│           ├── templates/
│           │   ├── dashboard-page-template.tsx
│           │   ├── resource-list-page.tsx
│           │   ├── resource-detail-page.tsx
│           │   ├── settings-page-template.tsx
│           │   └── login-shell.tsx
│           ├── components/
│           │   ├── page-header.tsx
│           │   ├── stat-card.tsx
│           │   ├── section-card.tsx
│           │   ├── status-badge.tsx
│           │   ├── filter-bar.tsx
│           │   ├── data-table.tsx
│           │   ├── empty-state.tsx
│           │   └── loading-state.tsx
│           └── models/
│               ├── nav.ts
│               └── page-meta.ts
```

## Page Pattern System

The backoffice system standardizes five page modes. `admin` and `brand` pages must be composed from these modes instead of free-form layout composition.

### 1. Dashboard Page

Use for:

- `/dashboard`

Required sections:

- page header with title, description, and optional actions
- stats row with 3-4 summary metrics
- main content grid
- recent activity or trend panel
- quick actions or system state panel

Why:

- A mature dashboard is not a row of cards
- It must show summary, recent change, and immediate next actions

### 2. Resource List Page

Use for:

- `brands`
- `admins`
- `users`
- `courses`
- similar management lists

Required sections:

- page header
- filter bar
- optional bulk-action or support area
- data table
- pagination
- loading, empty, and error states

### 3. Resource Detail Page

Use for:

- `brands/[id]`
- `users/[id]`
- `courses/[id]`

Required sections:

- page header with back action and primary actions
- overview summary card
- two-column detail content
- optional related data or history section

### 4. Settings / Form Page

Use for:

- create/edit pages
- settings pages
- account/profile settings inside backoffice

Required sections:

- page header
- sectioned forms
- optional sticky summary or helper panel
- bottom save area

### 5. Auth Entry Page

Use for:

- `/login`

Required sections:

- login shell
- title and supporting description
- form area
- optional environment/help/support block

Important:

- the login page can still use a simple username/password form
- maturity comes from shell, hierarchy, and supporting context
- the form implementation itself does not need to become complex

## Shared Component Tiers

### Tier 1: Shell Components

Examples:

- `AppShell`
- `Sidebar`
- `Topbar`
- `PageContainer`
- `ProtectedAppLayout`

Use:

- define the global backoffice frame for `admin` and `brand`

### Tier 2: Page Templates

Examples:

- `DashboardPageTemplate`
- `ResourceListPage`
- `ResourceDetailPage`
- `SettingsPageTemplate`
- `LoginShell`

Use:

- enforce page-level product patterns

### Tier 3: Admin UI Building Blocks

Examples:

- `PageHeader`
- `StatCard`
- `SectionCard`
- `StatusBadge`
- `FilterBar`
- `DataTable`
- `EmptyState`
- `LoadingState`

Use:

- consistent admin-style composition primitives

### Tier 4: App Business Pages

Examples:

- admin dashboard data composition
- brand user management page
- admin brand detail page

Use:

- combine business data with shared templates and components

## Authentication Design

Authentication is split into three responsibilities.

### 1. Route Guard

Owned by each app.

Responsibilities:

- determine whether a route is accessible
- redirect unauthenticated or unauthorized users

Reason:

- route access rules are app-specific

### 2. Protected Backoffice Shell

Owned by `packages/admin-system`.

Responsibilities:

- render sidebar, topbar, page container, user menu, and shared backoffice structure

Reason:

- once the user is inside the protected area, the visual shell should be shared

### 3. Auth Data and Actions

Owned by `packages/api`.

Responsibilities:

- login
- logout
- token updates
- user session state

Reason:

- auth storage and auth mutation logic are data concerns, not visual concerns

## Login Page Design

The login page is upgraded by wrapping the existing form logic in a product-level shell.

Recommended structure:

- `LoginShell`
  - title
  - description
  - optional support or environment section
  - slot for app-specific form
- `LoginForm`
  - remains inside `apps/admin` or `apps/brand`
  - keeps `react-hook-form`, `zod`, and mutation logic

This preserves the current auth flow while making the page feel like a proper backoffice entry point.

## Use of `DESIGN.md`

`web/DESIGN.md` is a useful visual direction reference, but it should not be copied wholesale into the backoffice system.

Use from `DESIGN.md`:

- token direction for colors, spacing, radius, typography
- surface hierarchy ideas
- brand warmth and editorial restraint

Do not transfer directly:

- marketing-first hero pacing
- overly promotional content bands
- large editorial headline usage across routine admin surfaces

Backoffice adaptation rule:

- retain the warm palette and brand tone
- make hierarchy denser and more operational
- keep serif display usage limited to selected top-level headings
- adapt the cream canvas, coral primary accent, warm ink text, hairline borders, and restrained dark surfaces into the backoffice theme
- avoid marketing-page pacing such as oversized hero typography, broad CTA bands, large editorial section gaps, and decorative brand marks
- keep routine backoffice typography sans-first with `letter-spacing: 0`; do not carry over display negative tracking into operational UI
- use the `DESIGN.md` theme as the token source for Admin first-stage visuals, while preserving the starter-inspired skeleton and responsive behavior

## Migration Plan

### Phase 1: Extract the shared shell

Deliverables:

- `AppShell`
- `Sidebar`
- `Topbar`
- `ProtectedAppLayout`
- collapsible desktop sidebar with icon mode and persisted open state
- mobile sidebar drawer opened from the topbar
- sticky topbar with sidebar trigger, breadcrumb slot, search slot, and user menu slot
- responsive page container shared by dashboard, list, and detail pages
- sidebar open/collapsed preference persisted in a cookie, not localStorage, to avoid client-only layout flashes and to preserve a future server-layout path
- topbar search is a first-stage lightweight entry point, not a full global search engine; it may expose UI and route-aware affordances before backend search APIs exist

Outcome:

- `admin` and `brand` share the same protected-area frame
- `admin` reaches the first-stage skeleton quality target inspired by `next-shadcn-dashboard-starter`

### Phase 2: Upgrade dashboard primitives

Deliverables:

- `PageHeader`
- `StatCard`
- `SectionCard`
- `DashboardPageTemplate`
- 4-card metric row with trend/status affordances
- two-column responsive dashboard content grid for charts, activity, quick actions, and status panels

Outcome:

- `/dashboard` stops being a demo-like card row and becomes a product overview page

Data integration rule:

- the first Admin dashboard iteration uses existing real data where available, such as total brands and total platform administrators
- metrics that require all-row aggregation or new backend endpoints must render as empty, pending, or explicitly placeholder states
- paginated list data must not be treated as whole-platform summary data
- `apps/admin` may introduce a dashboard summary hook shape before the backend endpoint exists, but the UI must not present fabricated operational facts as real metrics

Routing rule:

- the Admin overview stays at `/dashboard`
- do not introduce a template-inspired `/dashboard/overview` route unless the Mini Schedule information architecture later gains multiple dashboard subpages
- sidebar navigation should continue to treat `/dashboard` as the platform overview entry

First-stage exclusions:

- command palette / KBar
- runtime theme selector
- notification center
- right-side info sidebar
- complex RBAC menu filtering
- template-specific concepts such as billing, organization switching, and GitHub calls to action

### Phase 3: Standardize list pages

Deliverables:

- `FilterBar`
- `DataTable`
- `ResourceListPage`
- shared empty/loading patterns

Outcome:

- `brands`, `admins`, `users`, and `courses` pages share the same management-page language

### Phase 4: Standardize login entry

Deliverables:

- `LoginShell`

Outcome:

- `admin` and `brand` login pages feel like part of the same product family

### Phase 5: Expand detail and settings templates

Deliverables:

- `ResourceDetailPage`
- `SettingsPageTemplate`

Outcome:

- the backoffice system becomes comprehensive instead of only shell-deep

## Implementation Rules

- Share backoffice commonality, not business meaning
- Keep business hooks inside app code
- Let templates accept data, config, and slots
- Validate abstractions in `admin` first, then migrate to `brand`
- Keep `apps/app` outside the backoffice package

## Risks

### Risk 1: Over-sharing too early

If business-specific widgets are moved into `admin-system`, the package becomes hard to reuse.

Mitigation:

- only promote components that are clearly generic across `admin` and `brand`

### Risk 2: Visual system copied too literally from marketing design

If `DESIGN.md` is applied without adaptation, the backoffice becomes too decorative and loses operational clarity.

Mitigation:

- use its tokens and tone, but not its page pacing

### Risk 3: Auth shell coupled to auth storage

If the shared shell reads tokens or storage directly, auth changes will force UI refactors.

Mitigation:

- keep storage and auth mutations in `packages/api`
- pass user state and handlers into the shell

## Success Criteria

- `admin` and `brand` share one protected backoffice shell
- `admin` and `brand` use the same page template vocabulary
- dashboard, list, detail, settings, and login pages all have explicit page patterns
- backoffice visuals align with the project design direction without becoming a marketing clone
- `apps/app` remains independent from the shared backoffice system

## Final Decision

The project continues on the current monorepo path.

It does **not** integrate an external admin scaffold.

Instead, it introduces `packages/admin-system` as a shared backoffice design system for `apps/admin` and `apps/brand`, starting with shell, dashboard, list-page, and login-shell extraction.

The target for the first Admin iteration is to match the overall skeleton and responsive product feel of `next-shadcn-dashboard-starter`, while keeping Mini Schedule's platform-management language and avoiding template-specific concepts such as Clerk organization switching, billing, GitHub calls to action, and demo navigation.
