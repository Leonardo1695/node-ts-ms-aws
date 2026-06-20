# Active Context — Verdiron Sustainability Module

> Current work focus, recent changes, next steps, and active decisions.
> This is the file to read first when resuming work.

## Current status

**Phase: planned backlog complete through VRD-101; quality tickets VRD-081–083 done.** Full stack, Docker, Terraform, CI, README, architecture diagram, pipeline integration test, OpenAPI contract tests, and Playwright e2e are in place.

| Area | Status |
|------|--------|
| Foundation + shared libs (VRD-001–008) | ✅ Done |
| Local infra + migrations + OTel (VRD-010–016) | ✅ Done |
| Ingestion / processing / API (VRD-020–045) | ✅ Done |
| Device simulator (VRD-050–052) | ✅ Done |
| Python ETL (VRD-060–062) | ✅ Done |
| Web dashboard (VRD-070–076) | ✅ Done |
| Quality & full docker stack (VRD-080–084) | ✅ Done |
| Terraform + CI (VRD-090–091) | ✅ Done |
| README + docs polish (VRD-100–101) | ✅ Done |

## Current work focus

Next recommended tickets (in order):

1. ~~**VRD-084** — wire all apps + web into `docker-compose`~~ ✅
2. ~~**VRD-090** — `infra/terraform` for Kinesis, S3, DynamoDB against LocalStack~~ ✅
3. ~~**VRD-091** — GitHub Actions CI (lint, typecheck, test, build)~~ ✅
4. ~~**VRD-100** — README deliverable~~ ✅
5. ~~**VRD-101** — architecture diagram asset~~ ✅

Quality (VRD-081–083): ✅ pipeline integration test, OpenAPI contract tests, Playwright e2e.

## Recent changes

- **VRD-081–083**: Pipeline integration test (`tests/integration/`), OpenAPI contract tests (`jest-openapi`), Playwright demo e2e; CI jobs for integration + e2e.
- **VRD-101**: Architecture diagram — Mermaid in `docs/architecture/diagram.md`.
- **VRD-075**: Demo Control Panel — sim start/stop, ETL run, live status poll, readiness indicators via `/health/ready`.
- **VRD-074**: Idling & Waste Report — ranked offenders, fuel cost estimate, filters.
- **VRD-073**: Asset Detail — KPIs, telemetry history chart, recent events table, filters, overview drilldown.
- **VRD-072**: Fleet Overview — KPI row, Recharts trend chart, site/period/bucket filters.
- **VRD-071**: API client + TanStack Query hooks + `QueryState` on all routes.
- **VRD-070**: `web-dashboard` scaffold (Vite/React/Tailwind/React Router/TanStack Query).
- **VRD-041–045**: API read endpoints (fleet, asset, idling report) + control routes + readiness/OTel hardening.
- **VRD-060–062**: Python ETL scaffold, pandas rollups, `reporting_daily` upsert + RMQ worker.
- **VRD-050–052**: Device simulator scaffold, generator, emit loop + RMQ control.
- **VRD-020–035**: Full ingest → Kinesis → process → Postgres/DynamoDB/rollup pipeline with OTel.

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
  **React Router**. Chosen react-bits components: **CountUp**, **SpotlightCard**, **GradientText**/
  **ShinyText**, **Aurora**, **AnimatedList**. Used sparingly.
- Observability: **OpenTelemetry** SDK in services → **OTel Collector** → **Jaeger** (traces),
  all via Docker; pino logs. Prometheus + Grafana = optional stretch.
- Apps split: **NestJS** for ingestion/processing/api services only; **device-simulator is a
  light plain-TS Node app** (no Nest); ETL is Python.
- Infra: **Docker** + `docker compose up` runs full stack; **Terraform** targets LocalStack; **GitHub Actions CI** on push/PR.
- Demo control: UI drives simulator + ETL via control routes (RMQ/HTTP); services run locally.

## Next steps (execution order)

1. ~~Foundation through frontend (VRD-001–076)~~ ✅
2. ~~**VRD-084** — Dockerfiles for all services + full compose stack incl. web UI + migrate-on-start~~ ✅
3. ~~**VRD-090** — Terraform modules targeting LocalStack (Kinesis, S3, DynamoDB)~~ ✅
4. ~~**VRD-091** — GitHub Actions CI workflow~~ ✅
5. ~~**VRD-100** — README deliverable~~ ✅
6. ~~**VRD-101** — architecture diagram asset~~ ✅
7. ~~**VRD-081–083** — quality hardening~~ ✅

## Active considerations / open questions

- Stack decisions are **finalized** (see "Final tech stack"). No open architecture questions.
- `docker compose up -d --build` starts **full stack** incl. web UI at `:4200`, API at `:3003`.
- `README.md` is the interviewer-facing run guide; deep design stays in `memory-bank/`.
- Work is broken into tickets in `memory-bank/tickets.md` — the execution backlog.
- Remaining optional stretch: Prometheus + Grafana metrics dashboards.

## Workflow reminders

- Caveman chat style (full) per workspace rules; code/commits stay normal English.
- Windows + PowerShell host: PowerShell-safe commands; rely on Docker for runtime parity.
- Stay in PLAN until the user types ACT / AUTO ACT.
- Read this Memory Bank at the start of each task iteration.
