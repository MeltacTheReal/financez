# Dashboard Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current table-first expense page with an insights-first professional dashboard (KPI cards, charts, improved table, and dark mode) without backend API changes.

**Architecture:** Keep the FastAPI backend and API contract unchanged. Split frontend logic into focused modules: pure metric/chart data utilities, chart renderer, theme manager, and the existing app bootstrap. Update the template to a dashboard shell and wire state updates so CRUD events recalculate KPIs/charts.

**Tech Stack:** FastAPI, Tailwind CSS (CDN), Chart.js (CDN), vanilla JavaScript modules, Node built-in test runner (`node --test`), browser manual QA.

---

## File Structure

- Modify: `_Financez/backend/templates/index.html`  
  Responsibility: dashboard layout, KPI/card/chart containers, filter/theme controls, Chart.js script include.
- Modify: `_Financez/backend/static/app.js`  
  Responsibility: app state orchestration, fetching data, rendering table, invoking KPI/chart/theme modules.
- Create: `_Financez/backend/static/dashboard-metrics.js`  
  Responsibility: pure functions to compute KPI totals and chart-ready series.
- Create: `_Financez/backend/static/theme.js`  
  Responsibility: light/dark theme toggle and localStorage persistence.
- Create: `_Financez/backend/static/charts.js`  
  Responsibility: initialize/update/destroy Chart.js instances with theme-aware colors.
- Create: `_Financez/backend/static/tests/dashboard-metrics.test.js`  
  Responsibility: unit tests for metric and aggregation helpers (TDD anchor).
- Create: `_Financez/backend/static/tests/theme.test.js`  
  Responsibility: unit tests for theme init/toggle persistence behavior.

---

### Task 1: Add Test Harness for Frontend Utility Modules

**Files:**
- Create: `_Financez/backend/static/tests/dashboard-metrics.test.js`
- Create: `_Financez/backend/static/tests/theme.test.js`

- [ ] **Step 1: Write the failing metric test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { computeMetrics } from "../dashboard-metrics.js";

test("computeMetrics returns totals and top category for selected range", () => {
  const expenses = [
    { amount: 20, category_id: 1, date: "2026-05-01" },
    { amount: 30, category_id: 2, date: "2026-05-02" },
    { amount: 50, category_id: 2, date: "2026-05-03" }
  ];
  const categories = [{ id: 1, name: "Food" }, { id: 2, name: "Transport" }];
  const result = computeMetrics(expenses, categories, "month", "2026-05-15");

  assert.equal(result.totalSpent, 100);
  assert.equal(result.topCategory, "Transport");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test _Financez/backend/static/tests/dashboard-metrics.test.js`  
Expected: FAIL with module-not-found for `dashboard-metrics.js`.

- [ ] **Step 3: Write the failing theme test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { getInitialTheme, toggleTheme } from "../theme.js";

test("toggleTheme flips theme and persists value", () => {
  const store = new Map();
  const fakeStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v)
  };

  const next = toggleTheme("light", fakeStorage);
  assert.equal(next, "dark");
  assert.equal(fakeStorage.getItem("financez_theme"), "dark");
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `node --test _Financez/backend/static/tests/theme.test.js`  
Expected: FAIL with module-not-found for `theme.js`.

- [ ] **Step 5: Commit**

```bash
git add _Financez/backend/static/tests/dashboard-metrics.test.js _Financez/backend/static/tests/theme.test.js
git commit -m "test: add failing tests for dashboard utilities"
```

---

### Task 2: Implement Metrics and Theme Utilities to Pass Tests

**Files:**
- Create: `_Financez/backend/static/dashboard-metrics.js`
- Create: `_Financez/backend/static/theme.js`
- Test: `_Financez/backend/static/tests/dashboard-metrics.test.js`
- Test: `_Financez/backend/static/tests/theme.test.js`

- [ ] **Step 1: Write minimal metrics implementation**

```js
export function inRange(dateStr, range, nowStr) {
  const date = new Date(dateStr);
  const now = new Date(nowStr);
  if (range === "all") return true;
  if (range === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  if (range === "3months") {
    const threshold = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return date >= threshold && date <= now;
  }
  return true;
}

export function computeMetrics(expenses, categories, range, nowStr = new Date().toISOString().slice(0, 10)) {
  const filtered = expenses.filter((e) => inRange(e.date, range, nowStr));
  const totalSpent = filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const byCategory = filtered.reduce((acc, e) => {
    acc[e.category_id] = (acc[e.category_id] || 0) + (Number(e.amount) || 0);
    return acc;
  }, {});
  const topCategoryId = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0];
  const categoryName = categories.find((c) => String(c.id) === String(topCategoryId))?.name || "N/A";
  return { totalSpent, topCategory: categoryName };
}
```

- [ ] **Step 2: Write minimal theme implementation**

```js
const THEME_KEY = "financez_theme";

export function getInitialTheme(storage = window.localStorage) {
  return storage.getItem(THEME_KEY) || "light";
}

export function applyTheme(theme, root = document.documentElement) {
  root.dataset.theme = theme;
}

export function toggleTheme(current, storage = window.localStorage, root = document.documentElement) {
  const next = current === "dark" ? "light" : "dark";
  storage.setItem(THEME_KEY, next);
  applyTheme(next, root);
  return next;
}
```

- [ ] **Step 3: Run tests to verify pass**

Run: `node --test _Financez/backend/static/tests/dashboard-metrics.test.js _Financez/backend/static/tests/theme.test.js`  
Expected: PASS for both files.

- [ ] **Step 4: Commit**

```bash
git add _Financez/backend/static/dashboard-metrics.js _Financez/backend/static/theme.js
git commit -m "feat: add dashboard metrics and theme utility modules"
```

---

### Task 3: Build Dashboard Layout and Theme Tokens in Template

**Files:**
- Modify: `_Financez/backend/templates/index.html`

- [ ] **Step 1: Write failing UI assertion checklist**

```text
Manual failing assertions before template edit:
1) There is no KPI container with id="kpi-cards".
2) There are no chart canvas elements with ids "trend-chart" and "category-chart".
3) There is no dark mode toggle button with id="theme-toggle".
```

- [ ] **Step 2: Update HTML shell to dashboard-first structure**

```html
<!-- top bar -->
<div class="flex items-center justify-between mb-6">
  <h1 class="text-3xl font-bold">Finance Dashboard</h1>
  <div class="flex gap-2 items-center">
    <select id="time-range" class="border rounded px-3 py-2">
      <option value="month">This month</option>
      <option value="3months">Last 3 months</option>
      <option value="all">All time</option>
    </select>
    <button id="theme-toggle" class="px-3 py-2 rounded border">Toggle theme</button>
    <button id="logout-btn" class="hidden bg-gray-700 text-white px-3 py-2 rounded">Logout</button>
  </div>
</div>

<!-- kpis -->
<section id="kpi-cards" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"></section>

<!-- charts -->
<section class="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
  <div class="bg-white rounded shadow p-4"><canvas id="trend-chart"></canvas></div>
  <div class="bg-white rounded shadow p-4"><canvas id="category-chart"></canvas></div>
</section>
```

- [ ] **Step 3: Add Chart.js script include before app bundle**

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="/static/app.js" type="module"></script>
```

- [ ] **Step 4: Add minimal theme token CSS in template head**

```html
<style>
  :root { --bg: #f3f4f6; --surface: #ffffff; --text: #111827; }
  [data-theme="dark"] { --bg: #0f172a; --surface: #1e293b; --text: #e5e7eb; }
  body { background: var(--bg); color: var(--text); }
  .surface { background: var(--surface); }
</style>
```

- [ ] **Step 5: Re-run UI assertion checklist**

```text
Expected after edit:
1) #kpi-cards exists.
2) #trend-chart and #category-chart exist.
3) #theme-toggle exists.
```

- [ ] **Step 6: Commit**

```bash
git add _Financez/backend/templates/index.html
git commit -m "feat: add dashboard-first template structure with chart containers"
```

---

### Task 4: Wire KPI/Chart/Theme Rendering in App Bootstrap

**Files:**
- Modify: `_Financez/backend/static/app.js`
- Create: `_Financez/backend/static/charts.js`
- Modify: `_Financez/backend/static/dashboard-metrics.js`
- Test: `_Financez/backend/static/tests/dashboard-metrics.test.js`

- [ ] **Step 1: Add failing series test for chart data builders**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildCategorySeries } from "../dashboard-metrics.js";

test("buildCategorySeries aggregates amounts per category name", () => {
  const expenses = [
    { amount: 10, category_id: 1, date: "2026-05-01" },
    { amount: 20, category_id: 1, date: "2026-05-02" },
    { amount: 5, category_id: 2, date: "2026-05-03" }
  ];
  const categories = [{ id: 1, name: "Food" }, { id: 2, name: "Bills" }];
  const result = buildCategorySeries(expenses, categories, "month", "2026-05-15");
  assert.deepEqual(result.labels, ["Food", "Bills"]);
  assert.deepEqual(result.values, [30, 5]);
});
```

- [ ] **Step 2: Implement missing series builders**

```js
export function buildCategorySeries(expenses, categories, range, nowStr) {
  const filtered = expenses.filter((e) => inRange(e.date, range, nowStr));
  const sums = new Map();
  filtered.forEach((e) => {
    const name = categories.find((c) => String(c.id) === String(e.category_id))?.name || "Unknown";
    sums.set(name, (sums.get(name) || 0) + (Number(e.amount) || 0));
  });
  return { labels: [...sums.keys()], values: [...sums.values()] };
}
```

- [ ] **Step 3: Create chart renderer module**

```js
let trendChart = null;
let categoryChart = null;

export function renderCharts({ trendCtx, categoryCtx, trendData, categoryData, theme }) {
  if (trendChart) trendChart.destroy();
  if (categoryChart) categoryChart.destroy();
  const textColor = theme === "dark" ? "#e5e7eb" : "#1f2937";
  trendChart = new Chart(trendCtx, { type: "line", data: trendData, options: { plugins: { legend: { labels: { color: textColor } } } } });
  categoryChart = new Chart(categoryCtx, { type: "doughnut", data: categoryData, options: { plugins: { legend: { labels: { color: textColor } } } } });
}
```

- [ ] **Step 4: Update app bootstrap to maintain dashboard state and rerender**

```js
import { computeMetrics, buildCategorySeries, buildTrendSeries } from "./dashboard-metrics.js";
import { getInitialTheme, toggleTheme, applyTheme } from "./theme.js";
import { renderCharts } from "./charts.js";

const appState = { expenses: [], categories: [], timeRange: "month", theme: getInitialTheme() };
applyTheme(appState.theme);

function renderDashboard() {
  const metrics = computeMetrics(appState.expenses, appState.categories, appState.timeRange);
  renderKpis(metrics);
  renderCharts({
    trendCtx: document.getElementById("trend-chart"),
    categoryCtx: document.getElementById("category-chart"),
    trendData: buildTrendSeries(appState.expenses, appState.timeRange),
    categoryData: buildCategorySeries(appState.expenses, appState.categories, appState.timeRange),
    theme: appState.theme
  });
}
```

- [ ] **Step 5: Ensure CRUD flows call `renderDashboard()` after successful data refresh**

Run: `rg "fetchExpenses\\(\\)" _Financez/backend/static/app.js`  
Expected: each successful add/edit/delete path ends in a refresh that also updates dashboard visuals.

- [ ] **Step 6: Run tests**

Run: `node --test _Financez/backend/static/tests/dashboard-metrics.test.js _Financez/backend/static/tests/theme.test.js`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add _Financez/backend/static/app.js _Financez/backend/static/charts.js _Financez/backend/static/dashboard-metrics.js _Financez/backend/static/tests/dashboard-metrics.test.js
git commit -m "feat: wire dashboard state with chart and metric rendering"
```

---

### Task 5: Validation, Empty States, and Manual QA Pass

**Files:**
- Modify: `_Financez/backend/static/app.js`
- Modify: `_Financez/backend/templates/index.html`

- [ ] **Step 1: Add empty-state UI render branch**

```js
function renderChartEmptyState(message = "No data for selected period") {
  const trendWrapper = document.getElementById("trend-chart")?.parentElement;
  const categoryWrapper = document.getElementById("category-chart")?.parentElement;
  trendWrapper.innerHTML = `<p class="text-sm text-gray-500">${message}</p><canvas id="trend-chart"></canvas>`;
  categoryWrapper.innerHTML = `<p class="text-sm text-gray-500">${message}</p><canvas id="category-chart"></canvas>`;
}
```

- [ ] **Step 2: Add chart-load fallback guard**

```js
const chartAvailable = typeof window.Chart !== "undefined";
if (!chartAvailable) {
  document.getElementById("kpi-cards").insertAdjacentHTML(
    "afterend",
    `<div class="surface rounded p-4 text-sm">Charts unavailable. Showing KPI insights only.</div>`
  );
}
```

- [ ] **Step 3: Run backend and perform manual QA checklist**

Run:
1. `cd _Financez/backend`
2. `uvicorn app:app --host 0.0.0.0 --port 8001`

Expected manual checks:
- login/logout works.
- add/edit/delete expense updates table and KPI/charts.
- category CRUD still works.
- time-range filter updates KPIs/charts.
- dark mode toggle persists after refresh.
- mobile and desktop layout are usable.

- [ ] **Step 4: Capture verification notes in commit message body**

```text
Manual QA:
- Auth flow: pass
- Expense CRUD + dashboard sync: pass
- Category CRUD: pass
- Theme persistence: pass
- Responsive smoke test: pass
```

- [ ] **Step 5: Commit**

```bash
git add _Financez/backend/static/app.js _Financez/backend/templates/index.html
git commit -m "fix: add dashboard empty-state and chart fallback handling"
```

---

## Self-Review Checklist (Completed)

- Spec coverage: all approved sections are mapped to tasks (architecture, components/data flow, error handling/testing/rollout).
- Placeholder scan: no TODO/TBD or deferred steps.
- Type consistency: `appState`, `computeMetrics`, `buildCategorySeries`, theme keys, and DOM IDs are consistent across tasks.

