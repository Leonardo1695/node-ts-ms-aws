# Design System — Verdiron Sustainability Module

> Brand identity, visual language for the dashboard, and the API/data design conventions
> that keep the backend consistent. (This is a backend-led project; the design system covers
> both the small frontend and backend interface conventions.)

## Brand identity (fictional: Verdiron)

- Name: **Verdiron** — "verde" (green) + "iron" (heavy equipment). Sustainability for heavy iron.
- Tone: industrial, trustworthy, data-forward, clean. Not playful.
- Tagline (placeholder): "Green metrics for heavy iron."

## Color palette

- Primary (green / sustainability): `#1F9D55` (emerald) with darker `#15724A`.
- Accent (construction): amber/safety `#F2A516`.
- Neutrals: slate scale (`#0F172A` … `#F8FAFC`) for text, surfaces, borders.
- Semantic: success `#1F9D55`, warning `#F2A516`, danger `#DC2626`, info `#2563EB`.
- Chart series: emerald, amber, slate, blue, violet — colorblind-considerate ordering.

## Typography

- UI font: Inter (system fallback). Numeric/metric font: tabular figures for aligned numbers.
- Scale: display 30/24, heading 20/18, body 14, caption 12. Consistent line-heights.

## Spacing & layout

- 4px base spacing unit (Tailwind default scale).
- Dashboard grid: responsive cards; KPI row on top, charts below, tables last.
- Generous whitespace; one primary action per view.

## Component patterns (frontend)

- Built with **Tailwind** + **react-bits** components for polished motion/flair; **Recharts** for graphs.
- Chosen react-bits components (used sparingly — accent, not noise; pulled via the react-bits MCP):
  - **CountUp** — animate KPI numbers and the live ingestion counter.
  - **SpotlightCard** — KPI / summary cards (subtle hover spotlight).
  - **GradientText** / **ShinyText** — brand headings and the Verdiron wordmark.
  - **Aurora** — soft animated background, only behind the Overview header.
  - **AnimatedList** — idling offenders list / live activity feed entrance animation.
  - Motion stays subtle; respect `prefers-reduced-motion`.
- **KPI Card**: label, big tabular number, unit, trend delta (up/down + color semantics).
- **Trend Chart**: time-series line/area for CO2, fuel, idle over selectable window.
- **Ranked Table**: idling/waste offenders, utilization leaders/laggards.
- **Filters Bar**: site/project + time-range selectors, applied via API query params.
- **Control Panel**: simulator start/stop, fleet size + rate inputs, "Run ETL" button, live
  ingestion counter, connection/health indicators.
- States: every data view has loading, empty, and error states. No silent blanks.
- Accessibility: WCAG AA contrast, keyboard-navigable controls, labelled inputs, aria on charts.

## Dashboard screens (focused set)

1. **Fleet Sustainability Overview** — KPI row (CO2, fuel, idle waste, utilization) + trend chart + filters.
2. **Asset Detail** — per-asset metrics, fuel efficiency, idle %, history chart.
3. **Idling & Waste Report** — ranked offenders with idle fuel cost + CO2.
4. **Demo Control Panel** — drive simulator + ETL, observe live ingestion.

## API design conventions (backend)

- REST, JSON, versioned base path: `/api/v1`.
- Resource-oriented routes, e.g.:
  - `GET /api/v1/fleet/metrics?siteId=&from=&to=&bucket=`
  - `GET /api/v1/assets/:assetId/metrics?from=&to=`
  - `GET /api/v1/reports/idling?siteId=&from=&to=&limit=`
  - Control: `POST /api/v1/sim/start`, `POST /api/v1/sim/stop`, `POST /api/v1/etl/run`,
    `GET /api/v1/sim/status`.
- All inputs validated with **zod** (nestjs-zod); all responses described in **OpenAPI** (@nestjs/swagger).
- Auth: **API key** via `x-api-key` header (NestJS guard); the frontend sends it on every request.
- Consistent envelope: `{ data, meta }` for collections (paging in `meta`); errors as
  `{ error: { code, message, details } }` with proper HTTP status.
- Numbers carry explicit units in field names (e.g. `co2Kg`, `fuelLiters`, `idleMinutes`,
  `utilizationPct`). Consistent rounding at the API boundary.
- Time as ISO-8601 UTC; ranges are half-open `[from, to)`.

## Data design conventions

- snake_case in PostgreSQL; camelCase in API/JSON; mapping handled in the persistence layer.
- IDs: UL/UUID for events; stable human-meaningful ids for assets/sites where natural.
- DynamoDB keys: PK = `ASSET#<assetId>`, SK = `TS#<iso>` for time-ordered hot reads.
- S3 layout: `raw/dt=YYYY-MM-DD/asset=<id>/<batch>.jsonl` (partition-friendly for ETL).
