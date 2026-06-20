# Progress — Verdiron Sustainability Module

> What works, what's left, current status, and known issues.

## Current status

**Core product built (VRD-001 through VRD-076).** End-to-end code exists for ingest → process → API → dashboard, plus simulator and Python ETL. **Not yet done:** one-command full stack in Docker, Terraform, CI, README deliverable, and several quality tickets.

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
| I — Quality & containers | VRD-080–084 | ❌ Mostly open (see below) |
| J — IaC & CI | VRD-090–091 | ❌ Not started |
| K — Documentation | VRD-100–103 | ❌ Open (VRD-103 in progress this session) |

## What works

### Monorepo & shared libs
- Nx workspace with strict TS, ESLint, Prettier, EditorConfig.
- `@verdiron/config`, `@verdiron/logger`, `@verdiron/domain`, `@verdiron/messaging`, `@verdiron/persistence`, `@verdiron/tracing`.
- Domain sustainability calculations + unit tests (VRD-006).

### Local infra (docker-compose)
- `docker compose up -d` — Postgres, RabbitMQ, LocalStack, OTel Collector, Jaeger (VRD-010, VRD-015).
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
- [~] Integration tests — specs exist per service; full ingest→process→read pipeline suite not consolidated (VRD-081)
- [ ] API contract test vs OpenAPI (VRD-082)
- [ ] Playwright e2e: simulator → dashboard (VRD-083)
- [~] Dockerfiles — **only** `device-simulator` + `python-etl` today; missing ingestion, processing, api, web (VRD-084)
- [ ] Full `docker-compose` app wiring + migrate-on-start + UI (VRD-084)

### IaC & CI (EPIC J — VRD-090–091)
- [ ] Terraform modules for LocalStack (`infra/terraform` does not exist yet) (VRD-090)
- [ ] GitHub Actions CI — no `.github/workflows` yet (VRD-091)

### Documentation (EPIC K — VRD-100–103)
- [ ] README deliverable — story, skills mapping, run guide, demo tour (VRD-100; `README.md` is placeholder)
- [ ] Architecture diagram asset (VRD-101)
- [ ] Teaching docs: SQL partitioning, window funcs, matview, pandas ETL (VRD-102)
- [~] Memory Bank sync (VRD-103 — updated this session)

## Known gaps (honest)

| Gap | Impact |
|-----|--------|
| No app services in compose | Demo requires multiple `nx serve` terminals + manual migration |
| No CI | No automated lint/test/build on push/PR |
| No Terraform | LocalStack resources only via shell init script |
| README placeholder | New reader cannot run full demo from README alone |
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
| **M3** End-to-end pipeline | VRD-020–035, VRD-050–052 | ✅ Done (code); needs VRD-084 for one-command run |
| **M4** Frontend on live API data | VRD-040–045, VRD-070–076 | ✅ Done |
| **M5** ETL + Terraform + CI | VRD-060–062, VRD-090–091 | [~] ETL done; Terraform + CI missing |
| **M6** Quality + docs + demo polish | VRD-080–084, VRD-100–102 | ❌ Not started |

## Suggested next ACT order

1. VRD-084 — full Docker stack (unblocks honest README)
2. VRD-090 — Terraform
3. VRD-091 — CI
4. VRD-100 + VRD-101 — README + diagram
5. VRD-081–083 — quality hardening (as time allows)
