# Progress — Verdiron Sustainability Module

> What works, what's left, current status, and known issues.

## Current status

**Core product built (VRD-001 through VRD-101 + quality VRD-081–083).** `docker compose up -d --build` runs the full stack including web UI.

> Detailed tickets live in `memory-bank/tickets.md`. This file tracks milestone-level status.

### Ticket completion snapshot

| Epic | Tickets | Status |
|------|---------|--------|
| A — Foundation | VRD-001–008 | ✅ Done |
| B — Local infra | VRD-010–016 | ✅ Done |
| C — Ingestion | VRD-020–024 | ✅ Done |
| D — Processing | VRD-030–035 | ✅ Done |
| E — API | VRD-040–045 | ✅ Done |
| F — Simulator | VRD-050–052 | ✅ Done |
| G — Python ETL | VRD-060–062 | ✅ Done |
| H — Frontend | VRD-070–076 | ✅ Done |
| I — Quality & containers | VRD-080–084 | ✅ Done |
| J — IaC & CI | VRD-090–091 | ✅ Done |
| K — Documentation | VRD-100–101 | ✅ Done |

## What works

### Monorepo & shared libs
- Nx workspace with strict TS, ESLint, Prettier, EditorConfig.
- `@verdiron/config`, `@verdiron/logger`, `@verdiron/domain`, `@verdiron/messaging`, `@verdiron/persistence`, `@verdiron/tracing`.
- Domain sustainability calculations + unit tests (VRD-006).

### Local infra (docker-compose)
- `docker compose up -d --build` — full stack: Postgres, RabbitMQ, LocalStack, OTel, Jaeger, **db-migrate**, ingestion, processing, api, simulator, python-etl, **web-dashboard** (VRD-010–016, VRD-084).
- LocalStack ready.d init — Kinesis `telemetry`, S3 `verdiron-raw`, DynamoDB `telemetry-hot` (VRD-011).
- Migrations: core tables, partitioned `telemetry_events`, `metric_rollups` matview, reference seed (VRD-012–016).

### Backend services
- **ingestion-service** — telemetry intake, Kinesis producer, S3 archive, API key, health, OTel (VRD-020–024).
- **processing-service** — Kinesis consumer, metric engine, Postgres writes, DynamoDB hot store, rollup refresh + RMQ, linked spans (VRD-030–035).
- **api-service** — fleet/asset/idling metrics, control routes, readiness probes, OTel (VRD-040–045).

### Simulator & ETL
- **device-simulator** — generator, emit loop, RMQ control, Dockerfile (VRD-050–052).
- **python-etl** — S3 JSONL rollups, `reporting_daily` upsert, RMQ worker, Dockerfile (VRD-060–062).

### Frontend
- **web-dashboard** — Overview, Asset Detail, Idling Report, Control Panel; API client; react-bits polish (VRD-070–076).
- Verified: `nx run web-dashboard:test` and `nx run web-dashboard:build` pass.

### Tests (partial)
- Broad **unit test** coverage across libs and services.
- **Integration specs** exist (gated: `RUN_INTEGRATION_TESTS=true` + Docker): persistence, messaging, ingestion, processing, api-service modules, tracing.
- **web-dashboard**: Vitest (18 tests).

## What's left to build

Legend: [ ] not started · [~] partial · [x] done

### Foundation & product (VRD-001–076)
- [x] All tickets through VRD-076

### Quality & tooling (EPIC I — VRD-080–084)
- [x] Domain unit tests (VRD-006 / VRD-080 largely satisfied)
- [x] Consolidated ingest→process→read pipeline integration test (VRD-081 ✅)
- [x] OpenAPI contract tests with `jest-openapi` (VRD-082 ✅)
- [x] Playwright e2e: control panel → fleet overview charts (VRD-083 ✅)
- [x] Dockerfiles + full `docker-compose` app wiring (VRD-084 ✅)

### IaC & CI (EPIC J — VRD-090–091)
- [x] Terraform modules for LocalStack (`infra/terraform`) (VRD-090 ✅)
- [x] GitHub Actions CI — `.github/workflows/ci.yml` (VRD-091 ✅)

### Documentation (EPIC K — VRD-100–101)
- [x] README deliverable — story, skills mapping, run guide, demo tour (VRD-100 ✅)
- [x] Architecture diagram — Mermaid (`docs/architecture/diagram.md`) (VRD-101 ✅)

## Known gaps (honest)

| Gap | Impact |
|-----|--------|
| ~~No app services in compose~~ | ~~Demo requires multiple `nx serve` terminals~~ — **fixed in VRD-084** |
| No CI | ~~No `.github/workflows`~~ — **added in VRD-091** |
| No Terraform | ~~`infra/terraform` missing~~ — **added in VRD-090**; use `import-existing.ps1` if compose init already ran |
| README placeholder | ~~Fixed in VRD-100~~ — full quick start + demo tour in `README.md` |
| react-bits MCP down | VRD-076 used vendored lightweight components instead of upstream copy |

## Known issues / risks

- Docker Desktop required for integration smoke tests and LocalStack.
- LocalStack Kinesis/DynamoDB parity — validate during Terraform/compose work.
- Windows/PowerShell quirks — prefer Docker for runtime parity.
- Scope creep risk — remaining tickets are bounded (I/J/K epics).

## Milestones

| Milestone | Scope | Status |
|-----------|-------|--------|
| **M1** Foundation + Memory Bank | VRD-001–008 | ✅ Done |
| **M2** Domain + local infra runnable | VRD-010–016 | ✅ Done |
| **M3** End-to-end pipeline | VRD-020–035, VRD-050–052 | ✅ Done (incl. `docker compose up`) |
| **M4** Frontend on live API data | VRD-040–045, VRD-070–076 | ✅ Done |
| **M5** ETL + Terraform + CI | VRD-060–062, VRD-090–091 | ✅ Done |
| **M6** Quality + docs + demo polish | VRD-080–084, VRD-100–101 | ✅ Done |

## Suggested next ACT order

1. ~~VRD-084 — full Docker stack~~ ✅
2. ~~VRD-090 — Terraform~~ ✅
3. ~~VRD-091 — CI~~ ✅
4. ~~VRD-100 — README~~ ✅
5. ~~VRD-101 — architecture diagram~~ ✅
6. ~~VRD-081–083 — quality hardening~~ ✅
