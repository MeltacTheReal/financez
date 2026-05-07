# Dashboard Visual Refresh Design

## Context

The current `backend/templates/index.html` is functional but table-first and visually basic.  
This design modernizes the UI into a professional dashboard focused on at-a-glance insights, while preserving existing backend/API behavior and current modal workflows.

## Goals

- Deliver a modern, professional dashboard look and feel.
- Prioritize insights over raw table browsing.
- Add chart-based visualizations with a lightweight library.
- Support both light and dark modes in the first iteration.
- Keep implementation low-risk by reusing current data and flows.

## Non-Goals

- No backend endpoint or schema changes.
- No frontend framework migration.
- No full frontend architecture rewrite.

## Chosen Approach

Incremental dashboard shell (recommended option).

Why this option:

- Fastest path to meaningful UX upgrade.
- Low technical risk by preserving current business logic.
- Clear extension path for future iterations.

## Architecture and Screen Structure

The page is restructured from table-first to dashboard-first:

1. Top bar
   - App title
   - Time range selector
   - Dark mode toggle
   - Logout button
2. KPI row (4 cards)
   - Total spent
   - This month spend
   - Average per day
   - Top category
3. Charts row
   - Spend trend over time (line/area)
   - Category distribution (doughnut or bar)
4. Transactions section
   - Filters + sortable table
5. Floating add button
   - Retained for quick expense entry

Existing auth, expense, and category modals remain, but are visually restyled for consistency.

## Components

- `TopBar`: branding, time filter, theme toggle, session actions.
- `KpiCards`: compact summary metrics with optional trend deltas.
- `ChartsPanel`: Chart.js visualizations responsive to filter/theme state.
- `TransactionsTable`: improved spacing/legibility with quick filters.
- `ModalLayer`: existing modal interactions with unified design language.

## Data Flow

- On initial load, fetch expenses and categories once (existing flow).
- Store data in a minimal client state object:
  - `appState = { expenses, categories, timeRange, theme }`
- Derived computations happen client-side:
  - `computeMetrics(expenses, timeRange)`
  - `buildTrendSeries(expenses, timeRange)`
  - `buildCategorySeries(expenses, timeRange)`
- Any CRUD change (add/edit/delete) triggers recomputation and rerender of metrics/charts/table.

## Theme Strategy (Light + Dark)

- Use CSS variables for semantic tokens (background, surface, text, muted, border, accent).
- Tailwind utility classes remain primary; token variables cover theme switching.
- Theme toggle updates root theme attribute/class and persists preference in `localStorage`.
- Chart palette adapts to active theme to preserve contrast and readability.

## Error Handling and Empty States

- Preserve current auth/API error behavior.
- Add dashboard-specific graceful fallbacks:
  - Empty filtered dataset => explicit "No data for selected period" in charts area.
  - Chart library load/render issue => textual summary fallback for insights.
- Guard metric/chart builders against malformed or incomplete expense records.

## Testing Strategy

Manual test matrix:

- Auth: sign-in/sign-out, error rendering.
- Expenses: add/edit/delete updates table + KPIs + charts correctly.
- Categories: add/edit/delete remains functional and reflected in UI.
- Filters: time range impacts metrics and charts as expected.
- Themes: light/dark toggle works and persists across refresh.
- Responsiveness: mobile and desktop layouts remain usable.
- Visual quality: no clipped controls, overflow, or inaccessible contrast issues.

## Rollout

- Single-phase replacement of current dashboard template.
- Keep existing interaction patterns (modals, actions) for continuity.
- No migration tasks required.

## Risks and Mitigations

- Risk: Chart complexity increases UI maintenance.
  - Mitigation: keep chart config centralized and minimal.
- Risk: Theme inconsistency across old/new elements.
  - Mitigation: enforce shared tokens across cards, tables, and modals.
- Risk: Metric confusion due to filter scope.
  - Mitigation: display active time range label near KPI/charts.

## Acceptance Criteria

- Dashboard-first layout is implemented with KPI + charts above transactions.
- Chart library is integrated and renders trend + category insights.
- Dark mode is available and persisted.
- Existing CRUD/auth/category flows continue to work.
- UI is responsive and visually consistent in light and dark modes.
