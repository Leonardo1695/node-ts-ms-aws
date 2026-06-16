# Progress — Verdiron Sustainability Module

> What works, what's left, current status, and known issues.

## Current status

**Planning + Memory Bank: done. Foundation (VRD-001/002): done. Shared libs (VRD-003–008): done (unit/typecheck).**

> Detailed, sequenced work items live in `memory-bank/tickets.md` (the execution backlog).
> This file tracks high-level status and milestones; tickets are the source of truth for tasks.

## What works

- Project plan defined and approved.
- All key decisions locked (see `activeContext.md`).
- Memory Bank initialized (7 core files + tickets).
- Nx monorepo skeleton: `git init`, `apps/` + `libs/`, strict TS, ESLint, Prettier, EditorConfig.
- `nx graph` runs; `nx run-many -t typecheck test` passes for `config`, `logger`, `domain`, `messaging`, `persistence`.
- `@verdiron/config` — zod-validated env + NestJS `VerdironConfigModule`.
- `@verdiron/logger` — nestjs-pino + correlation id header propagation.
- `@verdiron/domain` — framework-free zod schemas + pure sustainability calculations (VRD-005/006).
- `@verdiron/messaging` — Kinesis helpers + RabbitMQ transport config + metrics publisher (VRD-007). No S3.
- `@verdiron/persistence` — TypeORM DataSource + DynamoDB client + **S3 raw archive** + migration runner wiring (VRD-008).
- Integration smoke specs exist; run `RUN_INTEGRATION_TESTS=true nx run-many -t integration-test -p messaging,persistence` with Docker running.
- `docker compose up -d` — Postgres, RabbitMQ, LocalStack (VRD-010); copy `.env.example` → `.env` first.
- LocalStack ready.d init creates `telemetry` stream, `verdiron-raw` bucket, `telemetry-hot` DynamoDB table (VRD-011).
- `@verdiron/tracing` — OTel bootstrap; Jaeger UI at http://localhost:16686 (VRD-015).
- `ingestion-service` — Nest scaffold: config + logger + OTel + Swagger; `/health` ok; Jaeger integration test (VRD-020).
- `ingestion-service` — `POST /api/v1/telemetry` single/batch intake with nestjs-zod (VRD-021).
- `ingestion-service` — Kinesis producer on intake via `@verdiron/messaging` (VRD-022).
- `ingestion-service` — S3 JSONL raw archive on intake via `@verdiron/persistence` (VRD-023).
- `ingestion-service` — API key guard, live/ready health, graceful shutdown, intake OTel spans (VRD-024).
- `processing-service` — Nest scaffold: config + logger + OTel; `/health` ok; Jaeger integration test (VRD-030).

## What's left to build

Legend: [ ] not started · [~] in progress · [x] done

### Foundation
- [x] git init + `.gitignore`
- [x] Nx workspace (apps/ + libs/)
- [x] strict TypeScript base config (tsconfig base + per-project)
- [x] eslint + prettier
- [x] shared libs: `config`, `logger`, `domain`, `messaging`, `persistence` (schemas/types + plumbing)

### Domain
- [x] sustainability calculation functions (CO2, idle, utilization, efficiency) — pure
- [x] unit tests for domain calculations

### Local infra
- [x] docker-compose: postgres, rabbitmq, localstack (VRD-010)
- [x] LocalStack init scripts (Kinesis stream, S3 bucket, DynamoDB table) (VRD-011)
- [x] PostgreSQL migration: `sites`, `assets` (VRD-012)
- [x] PostgreSQL migration: partitioned `telemetry_events` (VRD-013)
- [x] PostgreSQL migration: `metric_rollups` materialized view (VRD-014)
- [x] docker-compose: otel-collector, jaeger (VRD-015)
- [x] `@verdiron/tracing` OpenTelemetry bootstrap module (VRD-015)
- [x] Reference data seed migration: sites + mixed fleet assets (VRD-016)

### Services
- [x] `ingestion-service` scaffold — health, Swagger, OTel (VRD-020)
- [x] `ingestion-service` telemetry intake — `POST /api/v1/telemetry` (VRD-021)
- [x] `ingestion-service` Kinesis producer on intake (VRD-022)
- [x] `ingestion-service` S3 raw archive on intake (VRD-023)
- [x] `ingestion-service` hardening — API key, health probes, shutdown, spans (VRD-024)
- [x] `processing-service` scaffold — health, OTel (VRD-030)
- [ ] `processing-service` Kinesis consumer loop (VRD-031)
- [ ] `api-service` (REST + OpenAPI + API key guard + control routes)
- [ ] `device-simulator` (light plain-TS Node app, fleet telemetry emitter)
- [ ] `python-etl` (S3 raw → daily rollups → Postgres reporting)

### Frontend
- [ ] `web-dashboard` scaffold (React + Vite + TS + Tailwind + react-bits)
- [ ] Fleet Sustainability Overview screen
- [ ] Asset Detail screen
- [ ] Idling & Waste Report screen
- [ ] Demo Control Panel (simulator + ETL controls, live counter)

### Quality & tooling
- [ ] Per-service Dockerfiles
- [ ] Unit tests (domain) + integration tests (testcontainers + LocalStack)
- [ ] Contract test (OpenAPI response validation)
- [ ] One e2e (Playwright): simulator → dashboard shows data
- [ ] Terraform (LocalStack-targeted, real-AWS-shaped) — not deployed
- [ ] GitHub Actions CI (lint, typecheck, test, build) — no deploy stage

### Documentation
- [ ] README deliverable (story, architecture diagram, skills mapping, local run guide, demo tour)
- [ ] Teaching-mode docs/comments for advanced SQL (partitioning, window funcs, matview) + Python ETL
- [ ] Keep Memory Bank updated as work progresses

## Known issues / risks

- Docker Desktop must be running for testcontainers integration smoke tests.
- Risk: scope creep — keep frontend small and focused.
- Risk: LocalStack feature parity for Kinesis/DynamoDB; validate early in the infra step.
- Risk: Windows/PowerShell command quirks — rely on Docker for runtime consistency.

## Milestones

1. M1 — Foundation + Memory Bank ✅ (foundation tooling done; shared libs pending)
2. M2 — Domain + local infra runnable
3. M3 — End-to-end pipeline (simulator → ingest → process → API)
4. M4 — Frontend dashboards live on API data
5. M5 — Python ETL + Terraform + CI artifacts
6. M6 — README deliverable + polish + demo rehearsal
