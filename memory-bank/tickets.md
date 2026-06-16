# Tickets — Verdiron Sustainability Module (Execution Backlog)

> This is the **source of truth for work items**. The plan and decisions live in the other
> Memory Bank files (`projectbrief`, `productContext`, `systemPatterns`, `techContext`,
> `designSystem`, `activeContext`); `progress.md` tracks high-level status. This file breaks the
> plan into sequenced, self-contained tickets so any engineer can pick one up and follow through.
>
> The author who planned this is **not** the implementer — tickets must be unambiguous on their own.

## Conventions

- ID format: `VRD-NNN`. Grouped by epic.
- Each ticket has: **Goal**, **Depends on**, **Tasks**, **Acceptance criteria**, **Covers**
  (job requirement it demonstrates), and **Teaching** (whether it needs extra explanatory
  comments/docs because the author is learning the topic).
- Requirement tags (Covers): `NODE-TS`, `AWS`, `MSA` (microservices), `SQL`, `NOSQL`, `MQ`,
  `API`, `DOCKER`, `IAC`, `ETL`, `IOT`, `OBS` (observability), `FE`, `TEST`, `DOCS`.
- Status: `TODO` / `WIP` / `DONE` / `BLOCKED`. All currently `TODO`.
- Definition of Done (global): code typechecks, lint passes, relevant tests pass, runs under
  `docker-compose up`, and any teaching-flagged work has the required explanatory docs/comments.

## Constraints reminder

- **Local-first**: everything runs via Docker locally; no cloud deploy. Terraform + CI are
  demonstrative artifacts only.
- **No real company name/branding** — use "Verdiron".
- **Frontend is the only operator surface** during a demo (no manual DB/API ops).
- **NestJS only for the backend services** (ingestion, processing, api). Device-simulator is a
  light plain-TS Node app. ETL is Python.

---

## Suggested execution order (topological)

A (foundation) → B (infra) → C/D/E (services, roughly in order) → F (simulator) →
G (ETL) → H (frontend) → I (tests/docker) → J (IaC/CI) → K (docs). Observability (VRD-015)
lands early in B so every service is traced from the start.

---

## EPIC A — Foundation & tooling

### VRD-001 — Initialize repo & Nx workspace
- **Goal**: Create the monorepo skeleton.
- **Depends on**: —
- **Tasks**:
  - `git init`, add `.gitignore` (node, dist, env, coverage, .nx, localstack volumes).
  - Create an **Nx** workspace with `apps/` and `libs/` layout (package manager: npm or pnpm).
  - Add root `README.md` placeholder (filled in VRD-100).
- **Acceptance**: `nx graph` runs; empty workspace builds.
- **Covers**: NODE-TS, MSA · **Teaching**: no

### VRD-002 — Base TS / ESLint / Prettier / EditorConfig
- **Goal**: Consistent strict tooling across all projects.
- **Depends on**: VRD-001
- **Tasks**: strict `tsconfig.base.json` (Node 22 target), shared ESLint + Prettier configs,
  `.editorconfig`, Nx targets for `lint`/`typecheck`/`test`/`build`.
- **Acceptance**: `nx run-many -t lint typecheck` passes on the empty workspace.
- **Covers**: NODE-TS · **Teaching**: no

### VRD-003 — Lib: `config`
- **Goal**: Centralized, validated configuration.
- **Depends on**: VRD-002
- **Tasks**: `libs/config` exporting a `@nestjs/config` module with a **zod**-validated env schema
  (DB, RabbitMQ, AWS/LocalStack endpoints, API key, OTel endpoint). Fail fast on invalid env.
- **Acceptance**: importing the module with a bad env throws a clear, typed error.
- **Covers**: NODE-TS, API · **Teaching**: no

### VRD-004 — Lib: `logger`
- **Goal**: Structured logging with correlation ids.
- **Depends on**: VRD-002
- **Tasks**: `libs/logger` wrapping **nestjs-pino**; request id / correlation id propagation;
  pretty transport in dev, JSON in prod-like.
- **Acceptance**: a service logs JSON with a correlation id that survives across an HTTP call.
- **Covers**: NODE-TS, OBS · **Teaching**: no

### VRD-005 — Lib: `domain` (types + schemas)
- **Goal**: Shared contracts.
- **Depends on**: VRD-002
- **Tasks**: `libs/domain` with **zod** schemas + inferred TS types for `TelemetryEvent`,
  `Asset`, `Site`, metric DTOs, and the `metrics.updated` event. Framework-free.
- **Acceptance**: schemas exported and reused by at least two apps later; unit-importable.
- **Covers**: NODE-TS, API · **Teaching**: no

### VRD-006 — Lib: `domain` sustainability calculations
- **Goal**: The metric engine math, pure and tested.
- **Depends on**: VRD-005
- **Tasks**: pure functions for CO2 (per fuel type factor), idle time + idle fuel waste,
  utilization, fuel efficiency, and fleet rollups. Constants documented (diesel 2.68 kg CO2/L,
  idle threshold, etc.). Full **Jest** unit tests with edge cases.
- **Acceptance**: ≥90% coverage on this lib; formulas documented with rationale.
- **Covers**: NODE-TS, ETL · **Teaching**: **yes** (explain each formula + units)

### VRD-007 — Lib: `messaging`
- **Goal**: Reusable Kinesis + RabbitMQ plumbing.
- **Depends on**: VRD-003
- **Tasks**: `libs/messaging` with a Kinesis producer/consumer helper (raw `@aws-sdk`, LocalStack
  endpoint) and a NestJS **RMQ transport** config factory + event publisher helper.
- **Acceptance**: a smoke test publishes/consumes one message against local RabbitMQ + Kinesis.
- **Covers**: AWS, MQ · **Teaching**: no

### VRD-008 — Lib: `persistence`
- **Goal**: DB access foundations.
- **Depends on**: VRD-003
- **Tasks**: `libs/persistence` with a **TypeORM** DataSource (Postgres) + entity base config and
  a **DynamoDB** client (`@aws-sdk/lib-dynamodb`, LocalStack endpoint). Migration runner wiring.
- **Acceptance**: TypeORM connects to local Postgres; Dynamo client lists the local table.
- **Covers**: SQL, NOSQL, AWS · **Teaching**: no

---

## EPIC B — Local infrastructure

### VRD-010 — docker-compose base
- **Goal**: One-command local infra.
- **Depends on**: VRD-001
- **Tasks**: compose services for **Postgres**, **RabbitMQ** (with mgmt UI), **LocalStack**
  (kinesis, s3, dynamodb). Named volumes, healthchecks, a shared network, `.env.example`.
- **Acceptance**: `docker-compose up` brings all three up healthy.
- **Covers**: DOCKER, AWS, SQL, MQ · **Teaching**: no

### VRD-011 — LocalStack resource init
- **Goal**: Auto-create AWS resources on startup.
- **Depends on**: VRD-010
- **Tasks**: init scripts (`infra/localstack/`) creating the **Kinesis stream**, **S3 bucket**,
  and **DynamoDB table** (PK `ASSET#<id>`, SK `TS#<iso>`).
- **Acceptance**: after `up`, the stream/bucket/table exist (verify via awslocal).
- **Covers**: AWS · **Teaching**: no

### VRD-012 — Migration: core tables
- **Goal**: Relational schema for reference data.
- **Depends on**: VRD-008
- **Tasks**: TypeORM migration creating `sites` and `assets` (with `fuel_type`, `asset_class`,
  `rated_power_kw`, `site_id` FK).
- **Acceptance**: migration runs clean up/down.
- **Covers**: SQL · **Teaching**: no

### VRD-013 — Migration: partitioned `telemetry_events` (raw SQL)
- **Goal**: Time-partitioned telemetry table for advanced SQL.
- **Depends on**: VRD-012
- **Tasks**: raw-SQL TypeORM migration creating a **range-partitioned** `telemetry_events`
  table (partition by day/month on `ts`) + a couple of initial partitions + indexes. Heavily
  commented: what partitioning is, why, and how pruning helps.
- **Acceptance**: inserts route to correct partitions; a time-filtered query prunes partitions
  (shown via `EXPLAIN`).
- **Covers**: SQL · **Teaching**: **yes**

### VRD-014 — Migration: `metric_rollups` materialized view (raw SQL)
- **Goal**: Precomputed dashboard aggregates.
- **Depends on**: VRD-013
- **Tasks**: raw-SQL migration creating a **materialized view** rolling up CO2/fuel/idle/
  utilization per asset/site/time-bucket, plus a unique index to allow `REFRESH ... CONCURRENTLY`.
  Commented: view vs matview, refresh strategy.
- **Acceptance**: matview builds; `REFRESH MATERIALIZED VIEW CONCURRENTLY` works.
- **Covers**: SQL · **Teaching**: **yes**

### VRD-015 — OpenTelemetry: Collector + Jaeger + tracing bootstrap
- **Goal**: Distributed tracing across services, local via Docker.
- **Depends on**: VRD-010
- **Tasks**: add **OTel Collector** + **Jaeger** to compose; OTel Collector config (OTLP in →
  Jaeger out); a shared tracing bootstrap module (`@opentelemetry/sdk-node` +
  auto-instrumentations for HTTP, Nest, TypeORM/pg, amqplib, aws-sdk) imported first by each app.
- **Acceptance**: a request through ingestion→processing→api shows a connected trace in Jaeger UI.
- **Covers**: OBS · **Teaching**: light (note what a span/trace is)

### VRD-016 — Reference data seed
- **Goal**: Realistic sites + assets to demo against.
- **Depends on**: VRD-012
- **Tasks**: seed migration/script inserting a handful of sites and a mixed fleet of assets
  (excavators, loaders, trucks, generators) with fuel types.
- **Acceptance**: seed runs idempotently; assets visible via API later.
- **Covers**: SQL, IOT · **Teaching**: no

---

## EPIC C — Ingestion service (NestJS)

### VRD-020 — Scaffold ingestion-service
- **Status**: DONE
- **Goal**: NestJS app skeleton.
- **Depends on**: VRD-003, VRD-004, VRD-015
- **Tasks**: Nest app (Express adapter) wiring config, logger, OTel bootstrap, Swagger.
- **Acceptance**: boots, `/health` returns ok, appears in Jaeger.
- **Covers**: NODE-TS, MSA, API, OBS · **Teaching**: no

### VRD-021 — Telemetry intake endpoint
- **Status**: DONE
- **Goal**: Accept + validate IoT telemetry.
- **Depends on**: VRD-020, VRD-005
- **Tasks**: `POST /api/v1/telemetry` (single + batch) validated with **zod**/nestjs-zod against
  `TelemetryEvent`; reject malformed with clear 400s.
- **Acceptance**: valid payload 202; invalid payload 400 with details.
- **Covers**: API, IOT · **Teaching**: no

### VRD-022 — Kinesis producer
- **Status**: DONE
- **Goal**: Stream raw telemetry.
- **Depends on**: VRD-021, VRD-007, VRD-011
- **Tasks**: publish validated events to the Kinesis stream (batched `PutRecords`, partition key =
  assetId, backpressure-aware).
- **Acceptance**: events land on the stream (verified by a consumer/awslocal).
- **Covers**: AWS, MQ, ETL · **Teaching**: no

### VRD-023 — S3 raw archive
- **Status**: DONE
- **Goal**: Durable raw landing zone for ETL.
- **Depends on**: VRD-021, VRD-011
- **Tasks**: write raw batches to S3 as JSONL under `raw/dt=YYYY-MM-DD/asset=<id>/<batch>.jsonl`.
- **Acceptance**: objects appear in the local S3 bucket with the partitioned key layout.
- **Covers**: AWS, ETL · **Teaching**: no

### VRD-024 — Hardening: API key + health + OTel
- **Goal**: Production-shaped basics.
- **Depends on**: VRD-020
- **Tasks**: API key guard (`x-api-key`), readiness/liveness, graceful shutdown, trace spans on
  intake → produce.
- **Acceptance**: missing key → 401; spans visible end-to-end in Jaeger.
- **Covers**: API, OBS · **Teaching**: no

---

## EPIC D — Processing service (NestJS)

### VRD-030 — Scaffold processing-service
- **Goal**: NestJS app skeleton (consumer-oriented).
- **Depends on**: VRD-003, VRD-004, VRD-015
- **Acceptance**: boots, `/health` ok, traced.
- **Covers**: NODE-TS, MSA, OBS · **Teaching**: no

### VRD-031 — Kinesis consumer loop
- **Goal**: Reliably consume the stream.
- **Depends on**: VRD-030, VRD-007, VRD-022
- **Tasks**: raw `@aws-sdk` shard polling loop with checkpointing and **idempotent** handling
  (dedupe by `eventId`); handles at-least-once delivery.
- **Acceptance**: consumes produced events; replays don't double-count.
- **Covers**: AWS, MQ, MSA · **Teaching**: no

### VRD-032 — Metric engine + normalized writes
- **Goal**: Turn raw telemetry into stored metrics.
- **Depends on**: VRD-031, VRD-006, VRD-013
- **Tasks**: apply `libs/domain` calculations; write normalized rows to the partitioned
  `telemetry_events` table via TypeORM.
- **Acceptance**: rows land in correct partitions; metrics match unit-tested formulas.
- **Covers**: SQL, ETL · **Teaching**: light

### VRD-033 — DynamoDB hot raw writer
- **Goal**: Fast recent-telemetry access.
- **Depends on**: VRD-031, VRD-008
- **Tasks**: write hot raw events to DynamoDB (PK `ASSET#<id>`, SK `TS#<iso>`), with TTL concept noted.
- **Acceptance**: latest events queryable by asset, time-ordered.
- **Covers**: NOSQL, AWS · **Teaching**: light (NoSQL access pattern note)

### VRD-034 — Rollup refresh + publish event
- **Goal**: Keep dashboard aggregates fresh and notify the API.
- **Depends on**: VRD-032, VRD-014, VRD-007
- **Tasks**: refresh `metric_rollups` (debounced/periodic, CONCURRENTLY); publish `metrics.updated`
  via NestJS **RMQ transport**.
- **Acceptance**: matview reflects new data; api-service receives the event.
- **Covers**: SQL, MQ · **Teaching**: no

### VRD-035 — Hardening: health + OTel
- **Depends on**: VRD-030
- **Acceptance**: consumer spans linked to ingestion spans in Jaeger.
- **Covers**: OBS · **Teaching**: no

---

## EPIC E — API service (NestJS)

### VRD-040 — Scaffold api-service + Swagger + API key
- **Goal**: Public read/control API.
- **Depends on**: VRD-003, VRD-004, VRD-015
- **Tasks**: Nest app, `@nestjs/swagger` at `/docs`, API key guard, OTel.
- **Acceptance**: Swagger UI lists endpoints; key enforced.
- **Covers**: API, MSA, OBS · **Teaching**: no

### VRD-041 — Fleet metrics endpoints
- **Goal**: Power the overview dashboard.
- **Depends on**: VRD-040, VRD-014
- **Tasks**: `GET /api/v1/fleet/metrics?siteId&from&to&bucket` reading the matview; trends using
  **window functions** (moving averages / running totals). Consistent `{data, meta}` envelope + units.
- **Acceptance**: returns bucketed KPIs + trend series; matches expected aggregates.
- **Covers**: API, SQL · **Teaching**: **yes** (explain the window-function query)

### VRD-042 — Asset detail endpoints
- **Goal**: Per-asset drilldown.
- **Depends on**: VRD-040, VRD-033, VRD-014
- **Tasks**: `GET /api/v1/assets/:id/metrics` + recent raw from DynamoDB.
- **Acceptance**: returns per-asset metrics + recent telemetry.
- **Covers**: API, SQL, NOSQL · **Teaching**: no

### VRD-043 — Idling & waste report endpoint
- **Goal**: Ranked actionable report.
- **Depends on**: VRD-040, VRD-014
- **Tasks**: `GET /api/v1/reports/idling` ranking offenders by idle fuel/CO2 using window funcs
  (`RANK()`/`ROW_NUMBER()` OVER ...).
- **Acceptance**: returns ordered offenders with idle cost + CO2.
- **Covers**: API, SQL · **Teaching**: **yes** (explain ranking window function)

### VRD-044 — Control routes + RMQ subscribe
- **Goal**: Drive the demo from the UI; refresh caches on events.
- **Depends on**: VRD-040, VRD-007
- **Tasks**: `POST /sim/start`, `POST /sim/stop`, `GET /sim/status`, `POST /etl/run`
  (send commands to simulator + trigger ETL); subscribe to `metrics.updated` to invalidate caches.
- **Acceptance**: UI can start/stop simulator and run ETL via these routes; caches refresh on event.
- **Covers**: API, MQ · **Teaching**: no

### VRD-045 — Hardening: health + OTel
- **Depends on**: VRD-040
- **Covers**: OBS · **Teaching**: no

---

## EPIC F — Device simulator (light Node app)

### VRD-050 — Scaffold device-simulator
- **Goal**: Light plain-TS Node app (no Nest).
- **Depends on**: VRD-005
- **Tasks**: minimal TS Node app + Dockerfile; reads config; imports `libs/domain` schemas.
- **Acceptance**: builds and runs standalone.
- **Covers**: NODE-TS, IOT · **Teaching**: no

### VRD-051 — Telemetry generator
- **Goal**: Realistic fleet behavior.
- **Depends on**: VRD-050, VRD-016
- **Tasks**: generate plausible telemetry per asset (movement, engine on/off, idling bursts, fuel
  burn correlated to RPM/load), seeded for repeatability.
- **Acceptance**: output validates against `TelemetryEvent`; idling/fuel patterns look realistic.
- **Covers**: IOT, ETL · **Teaching**: light

### VRD-052 — Emit loop + remote control
- **Goal**: Controllable from the dashboard.
- **Depends on**: VRD-051, VRD-021, VRD-044
- **Tasks**: configurable fleet size + emit rate; POST to ingestion; start/stop + status via
  RMQ/HTTP commands from the API control routes; expose a live counter.
- **Acceptance**: starting from the UI produces a visible ingestion rate; stop halts it.
- **Covers**: IOT, MQ · **Teaching**: no

---

## EPIC G — Python ETL

### VRD-060 — Scaffold python-etl
- **Goal**: Polyglot batch job.
- **Depends on**: VRD-011
- **Tasks**: `jobs/python-etl` with `boto3`, `psycopg`, `pandas`; Dockerfile; config via env;
  generous comments (author learning Python here).
- **Acceptance**: container runs and connects to local S3 + Postgres.
- **Covers**: ETL · **Teaching**: **yes**

### VRD-061 — S3 → pandas → daily rollups
- **Goal**: Batch analytics.
- **Depends on**: VRD-060, VRD-023
- **Tasks**: list/read raw JSONL from S3 into a **pandas** DataFrame; compute daily per-asset/site
  rollups using the same formulas as `libs/domain` (documented to match). Explain DataFrame ops.
- **Acceptance**: produces a correct daily rollup DataFrame from sample raw data.
- **Covers**: ETL · **Teaching**: **yes**

### VRD-062 — Write reporting + trigger hook
- **Goal**: Surface ETL output + run on demand.
- **Depends on**: VRD-061, VRD-044
- **Tasks**: upsert into `reporting_daily` (Postgres); triggerable via the API `/etl/run` control
  route; idempotent re-runs.
- **Acceptance**: running ETL from the UI populates `reporting_daily`; visible in a dashboard view.
- **Covers**: ETL, SQL · **Teaching**: light

---

## EPIC H — Frontend dashboard

### VRD-070 — Scaffold web-dashboard
- **Goal**: React app skeleton.
- **Depends on**: VRD-001
- **Tasks**: Vite + React + TS, Tailwind, React Router, TanStack Query, base layout + theme
  (designSystem colors/typography).
- **Acceptance**: app runs; routes render placeholders.
- **Covers**: FE · **Teaching**: no

### VRD-071 — API client
- **Goal**: Typed, keyed access to the API.
- **Depends on**: VRD-070, VRD-041
- **Tasks**: fetch client sending `x-api-key`; types from `libs/domain` (or generated from OpenAPI);
  TanStack Query hooks; loading/empty/error states.
- **Acceptance**: hooks fetch real data with proper states.
- **Covers**: FE, API · **Teaching**: no

### VRD-072 — Fleet Sustainability Overview
- **Goal**: Primary dashboard.
- **Depends on**: VRD-071
- **Tasks**: KPI row (CO2, fuel, idle waste, utilization), trend chart (Recharts), site/period filters.
- **Acceptance**: shows live metrics; filters re-query.
- **Covers**: FE · **Teaching**: no

### VRD-073 — Asset Detail
- **Depends on**: VRD-071, VRD-042
- **Tasks**: per-asset metrics, fuel efficiency, idle %, history chart, recent telemetry.
- **Acceptance**: drilldown works from overview.
- **Covers**: FE · **Teaching**: no

### VRD-074 — Idling & Waste Report
- **Depends on**: VRD-071, VRD-043
- **Tasks**: ranked offenders table with idle fuel cost + CO2.
- **Acceptance**: matches API ranking.
- **Covers**: FE · **Teaching**: no

### VRD-075 — Demo Control Panel
- **Goal**: Drive the whole system from the browser.
- **Depends on**: VRD-071, VRD-044, VRD-052, VRD-062
- **Tasks**: start/stop simulator (fleet size + rate inputs), run ETL button, live ingestion
  counter, health indicators.
- **Acceptance**: full demo runnable from UI with no terminal/DB access.
- **Covers**: FE · **Teaching**: no

### VRD-076 — react-bits polish
- **Goal**: Tasteful flair.
- **Depends on**: VRD-072..075
- **Tasks**: integrate (via react-bits MCP) **CountUp** (KPI numbers + live counter),
  **SpotlightCard** (KPI cards), **GradientText**/**ShinyText** (brand headings), **Aurora**
  (overview header bg), **AnimatedList** (offenders/activity). Respect `prefers-reduced-motion`.
- **Acceptance**: subtle, performant animations; no layout jank.
- **Covers**: FE · **Teaching**: no

---

## EPIC I — Quality & containers

### VRD-080 — Unit tests (domain)
- **Goal**: Confidence in the metric math. (Largely delivered in VRD-006; keep extended here.)
- **Covers**: TEST · **Teaching**: no

### VRD-081 — Integration tests
- **Goal**: Verify the pipeline wiring.
- **Depends on**: VRD-032, VRD-041
- **Tasks**: **testcontainers** (Postgres, RabbitMQ) + LocalStack; ingest→process→read path.
- **Acceptance**: green integration suite in CI.
- **Covers**: TEST · **Teaching**: no

### VRD-082 — API contract test
- **Depends on**: VRD-041
- **Tasks**: validate API responses against the OpenAPI schema.
- **Covers**: TEST, API · **Teaching**: no

### VRD-083 — e2e (Playwright)
- **Depends on**: VRD-075
- **Tasks**: one happy path — start simulator from UI → charts populate.
- **Covers**: TEST, FE · **Teaching**: no

### VRD-084 — Dockerfiles + compose app wiring
- **Goal**: All apps containerized in the one-command stack.
- **Depends on**: VRD-024, VRD-035, VRD-045, VRD-052, VRD-060, VRD-070
- **Tasks**: per-app Dockerfiles; add all apps + web to docker-compose; migrate-on-start.
- **Acceptance**: `docker-compose up` runs the entire system incl. the UI.
- **Covers**: DOCKER, MSA · **Teaching**: no

---

## EPIC J — IaC & CI (demonstrative, unused)

### VRD-090 — Terraform modules
- **Goal**: Show IaC skill; runnable against LocalStack.
- **Depends on**: VRD-011
- **Tasks**: `infra/terraform` defining Kinesis, S3, DynamoDB (+ commented real-AWS EC2/VPC/ECS
  shapes). Targets LocalStack endpoints. **Not deployed to cloud.**
- **Acceptance**: `terraform plan/apply` works against LocalStack.
- **Covers**: IAC, AWS · **Teaching**: light

### VRD-091 — GitHub Actions CI
- **Goal**: Show CI/CD skill without deploying.
- **Depends on**: VRD-002
- **Tasks**: workflow running lint, typecheck, test, build, docker build. **Deploy stage present
  but commented out** with notes.
- **Acceptance**: CI is green on push/PR.
- **Covers**: IAC · **Teaching**: no

---

## EPIC K — Documentation

### VRD-100 — README deliverable
- **Goal**: The interviewer-facing guide.
- **Depends on**: VRD-084
- **Tasks**: lean README — Verdiron story, architecture diagram, **skills→requirements mapping**,
  prerequisites, `docker-compose up` run guide, sample flows, and a suggested **demo tour**.
- **Acceptance**: a new reader can run + demo the system from the README alone.
- **Covers**: DOCS · **Teaching**: no

### VRD-101 — Architecture diagram asset
- **Depends on**: —
- **Tasks**: produce a clean architecture diagram (image) for README + Memory Bank.
- **Covers**: DOCS · **Teaching**: no

### VRD-102 — Teaching docs: advanced SQL + pandas
- **Goal**: Learning material for the unfamiliar topics.
- **Depends on**: VRD-013, VRD-014, VRD-041, VRD-043, VRD-061
- **Tasks**: short explainers (in README or a docs note) on partitioning, window functions,
  materialized views, and the pandas ETL — what/why, with examples from this codebase.
- **Covers**: DOCS, SQL, ETL · **Teaching**: **yes**

### VRD-103 — Keep Memory Bank in sync
- **Goal**: Docs reflect reality.
- **Depends on**: ongoing
- **Tasks**: update `activeContext.md` + `progress.md` (+ others as needed) as tickets complete.
- **Covers**: DOCS · **Teaching**: no

---

## Milestone mapping

- **M1 Foundation**: VRD-001..008
- **M2 Infra runnable**: VRD-010..016
- **M3 End-to-end pipeline**: VRD-020..035, VRD-050..052
- **M4 API + Frontend on live data**: VRD-040..045, VRD-070..076
- **M5 ETL + IaC + CI**: VRD-060..062, VRD-090..091
- **M6 Quality + docs + demo polish**: VRD-080..084, VRD-100..103
