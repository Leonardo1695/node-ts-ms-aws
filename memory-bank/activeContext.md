# Active Context — Verdiron Sustainability Module

> Current work focus, recent changes, next steps, and active decisions.
> This is the file to read first when resuming work.

## Current status

**Phase: VRD-032 metric engine + Postgres writes done.** Next: VRD-033 (DynamoDB hot raw writer).

## Current work focus

VRD-033 — Write hot raw telemetry to DynamoDB (`ASSET#<id>` / `TS#<iso>`).

## Recent changes

- VRD-032: `TelemetryEventEntity` + `TelemetryEventRepository` in `@verdiron/persistence`; `MetricEngineService` applies `computeAssetMetricsFromIntervals` and inserts normalized rows into partitioned `telemetry_events` (idempotent via `ON CONFLICT DO NOTHING`).
- VRD-024: `ApiKeyGuard` on `POST /api/v1/telemetry` (`x-api-key` → 401); `/health/live` + `/health/ready` (legacy `/health` kept); `enableShutdownHooks` + `TracingShutdownService`; custom OTel spans `telemetry.accept` / `telemetry.produce` on intake.
- VRD-023: S3 JSONL archive on intake (`raw/dt=YYYY-MM-DD/asset=<id>/<batch>.jsonl`); Kinesis + S3 in parallel; path-style S3 for LocalStack.
- VRD-021: `POST /api/v1/telemetry` — single or batch intake via `@verdiron/domain` zod schemas + nestjs-zod `ZodValidationPipe`; 202 accepted / 400 validation errors.
- VRD-020: `apps/ingestion-service` — Nest skeleton with config, logger, OTel bootstrap (tracing before imports), Swagger at `/docs`, `GET /health`, unit + Jaeger integration tests.
- VRD-016: `SeedReferenceData1740000000003` + `reference-data.seed.ts` — 3 sites, 8 assets (excavators, loaders, trucks, generators); idempotent `ON CONFLICT DO NOTHING`; integration test verifies seed + down.

## Locked decisions

1. Fictional name: **Verdiron**.
2. NoSQL hot store: **DynamoDB** via LocalStack.
3. Scope: **full** (4 services + simulator + Python ETL + frontend + Terraform + CI + tests).
4. Polyglot: **Python ETL/analytics** job included.
5. Posture: **local-first** — no deployment; Terraform + CI are skill artifacts only.
6. Frontend: **React + Vite + TS**, **Tailwind + react-bits** components, Recharts, TanStack Query.
7. Everything demoable through the frontend (control panel drives simulator + ETL).
8. Docs split: lean **README** deliverable + full **Memory Bank**.
9. Memory Bank kept to the **7 core files** (extras folded in).
10. **Teaching mode**: advanced SQL + Python/pandas get extra comments + docs (learning material).

## Final tech stack (locked)

- Runtime: **Node 22 LTS** + TypeScript strict; **Python 3.11+** for ETL.
- Framework: **NestJS** on **Express** adapter.
- Monorepo: **Nx** (apps in `apps/`, libs in `libs/`).
- Postgres access: **TypeORM**; migrations: **TypeORM migrations** + **raw SQL** for partitioning
  + materialized views.
- Advanced SQL: **full** — range partitioning + window functions + materialized view.
- Validation: **zod** via **nestjs-zod**. Config: **@nestjs/config** + zod. Logging: **nestjs-pino**.
- Messaging: **NestJS RabbitMQ transport** (domain events) + **Kinesis** ingest (raw @aws-sdk consumer).
- NoSQL: **DynamoDB** via **@aws-sdk/lib-dynamodb**. Object store: **S3**. All AWS via **LocalStack**.
- API: **REST** + **@nestjs/swagger** (OpenAPI) + **API key** header auth.
- Tests: **Jest** + **supertest** + **testcontainers** (+ LocalStack); **Playwright** (1 e2e).
- Frontend: React + Vite + TS, **Tailwind** + **react-bits**, **Recharts**, **TanStack Query**,
  **React Router**. Chosen react-bits components: **CountUp** (KPI numbers), **SpotlightCard**
  (KPI/cards), **GradientText**/**ShinyText** (brand headings), **Aurora** (subtle overview
  header background), **AnimatedList** (idling offenders / live activity feed). Used sparingly.
- Observability: **OpenTelemetry** SDK in services → **OTel Collector** → **Jaeger** (traces),
  all via Docker; pino logs. Prometheus + Grafana = optional stretch.
- Apps split: **NestJS** for ingestion/processing/api services only; **device-simulator is a
  light plain-TS Node app** (no Nest); ETL is Python.
- Infra: **Docker** + docker-compose; **Terraform** (LocalStack-shaped, unused);
  **GitHub Actions** CI (no deploy).
- Demo control: services always running; UI drives simulator + ETL via control routes (RMQ/HTTP).

## Next steps (execution order)

1. ~~Shared libs: `config`, `logger`, `domain` (VRD-003–005)~~ ✅
2. ~~Domain calculations + unit tests (VRD-006)~~ ✅
3. ~~`messaging` + `persistence` libs (VRD-007–008)~~ ✅
4. ~~LocalStack init scripts (VRD-011)~~ ✅
5. ~~Migrations: core tables (VRD-012)~~ ✅
6. ~~Partitioned telemetry migration (VRD-013)~~ ✅
7. ~~Materialized view migration (VRD-014)~~ ✅
8. ~~OpenTelemetry stack (VRD-015)~~ ✅
9. ~~Reference data seed (VRD-016)~~ ✅
10. ~~Ingestion service scaffold (VRD-020)~~ ✅
11. ~~Telemetry intake endpoint (VRD-021)~~ ✅
12. ~~Kinesis producer (VRD-022)~~ ✅
13. ~~S3 raw archive (VRD-023)~~ ✅
14. ~~Ingestion hardening (VRD-024)~~ ✅
15. ~~Processing service scaffold (VRD-030)~~ ✅
16. ~~Processing Kinesis consumer loop (VRD-031)~~ ✅
17. ~~Processing metric engine + Postgres writes (VRD-032)~~ ✅
18. `processing-service`: DynamoDB hot raw + rollup refresh + RabbitMQ events.
16. `api-service`: REST + OpenAPI + control routes.
17. `device-simulator`: realistic fleet telemetry.
18. `python-etl`: S3 raw → daily rollups → Postgres reporting.
19. `web-dashboard`: screens + control panel.
20. Terraform (LocalStack-targeted) + GitHub Actions CI (no deploy).
21. README deliverable + architecture diagram.

## Active considerations / open questions

- Stack decisions are **finalized** (see "Final tech stack"). No open architecture questions.
- All prior tiny-opens resolved: device-simulator = light Node app; OpenTelemetry = in scope
  (Collector + Jaeger via Docker); react-bits components = chosen (see Final tech stack).
- Work is broken into tickets in `memory-bank/tickets.md` — the execution backlog others follow.
- Remaining optional stretch: Prometheus + Grafana metrics dashboards.

## Workflow reminders

- Caveman chat style (full) per workspace rules; code/commits stay normal English.
- Windows + PowerShell host: PowerShell-safe commands; rely on Docker for runtime parity.
- Stay in PLAN until the user types ACT / AUTO ACT.
- Read this Memory Bank at the start of each task iteration.
