# System Patterns — Verdiron Sustainability Module

> Architecture, key technical decisions, design patterns, and component relationships.

## High-level architecture

Event-driven microservices. IoT data flows ingest → stream → process → store → serve.
Mirrors the real target stack: Node.js microservices communicating via RabbitMQ + HTTP,
real-time ingestion via Kinesis, storage in PostgreSQL + a NoSQL hot store, raw archive in S3.

```
[web-dashboard] ──REST──► [api-service] ◄── RabbitMQ (metrics.updated) ── [processing-service]
  React/Vite/TS            OpenAPI + zod                                       Kinesis consumer
   charts + control          ▲   │ control routes                                  │ compute
        │ start/stop sim,     │   └─ orchestrates simulator + ETL                   │
        │ run ETL, filters    │ queries                                            ▼
        ▼                     │                              PostgreSQL (aggregates, advanced SQL)
  browser only ──────────────┘                              DynamoDB (hot raw telemetry)
                                                                    ▲
                              [device-simulator] ──HTTP──► [ingestion-service]
                                emits telemetry              validate (zod)
                                                             ├→ Kinesis stream (LocalStack)
                                                             └→ S3 raw landing (LocalStack)

[python-etl] (batch)  reads S3 raw  →  daily rollups/analytics  →  Postgres reporting table
```

## Components and responsibilities

- **device-simulator** (light plain-TS Node app, no Nest): emulates a fleet of IoT trackers; configurable fleet size and
  emit rate; posts telemetry to ingestion over HTTP. Driven from the dashboard control panel.
- **ingestion-service** (NestJS): HTTP intake; validates payloads (zod); writes raw events to a
  **Kinesis** stream and archives raw batches to **S3**. Thin, fast, stateless.
- **processing-service** (NestJS): consumes the Kinesis stream (raw @aws-sdk polling); runs the
  **metric engine** (pure functions from `libs/domain`); writes normalized telemetry to a
  **partitioned PostgreSQL** table via TypeORM (for advanced SQL) and hot raw to **DynamoDB**;
  refreshes the rollup matview; publishes `metrics.updated` events via the **NestJS RMQ transport**.
- **api-service** (NestJS): REST API with **@nestjs/swagger** + zod validation and an **API key**
  guard; serves dashboard queries from PostgreSQL (window functions, materialized views);
  subscribes to RabbitMQ for cache invalidation; exposes **control routes** so the UI can
  start/stop the simulator and trigger ETL.
- **python-etl** (Python): scheduled/triggered batch job; reads archived raw from S3; computes
  daily rollups and richer analytics; writes a Postgres reporting table. Polyglot showcase.
- **web-dashboard** (React/Vite/TS): the only human entry point; charts + control panel.

## Shared libraries (Nx `libs/`, DRY, clear boundaries)

- `libs/domain` — shared TypeScript types + zod schemas + **pure** sustainability calculations
  (unit-tested, framework-free).
- `libs/messaging` — Kinesis producer/consumer helpers + RabbitMQ (NestJS RMQ transport) config.
- `libs/persistence` — TypeORM data source + entities + migrations + DynamoDB (lib-dynamodb) client + **S3 object-store helpers** (`createS3Client`, `TelemetryRawArchive`) + **`TelemetryEventEntity` / repository** for partitioned telemetry inserts.
- `libs/config` — `@nestjs/config` module + zod-validated environment schema.
- `libs/logger` — nestjs-pino logging with request/correlation ids.

(Apps live in `apps/`; the Python ETL lives in `jobs/python-etl`, outside the Nx TS graph.)

## Key technical decisions

1. **Local-first via LocalStack** — all AWS calls use the real `@aws-sdk` against LocalStack
   (Kinesis, S3, DynamoDB). Genuine AWS code, zero cloud cost, fully offline.
2. **Kinesis for ingestion stream, RabbitMQ for domain events** — matches the target company's
   pattern (high-volume stream ingest + service-to-service messaging). Demonstrates both.
3. **PostgreSQL for aggregates + advanced SQL; DynamoDB for hot raw** — shows SQL depth (window
   functions, partitioning, materialized views) and NoSQL access patterns side by side.
4. **Pure domain calculations** — metric math lives in `libs/domain` as pure functions, fully
   unit-tested and reused by processing-service (python-etl re-implements the same formulas,
   documented to match). Postgres access via **TypeORM**; partitioning + matviews via raw SQL
   migrations because they are not expressible in the entity model.
5. **Frontend talks only to the API** — no direct DB or manual ops; control routes let the UI
   orchestrate the demo.
6. **Terraform + CI present but unused** — IaC targets LocalStack and is shaped like real AWS;
   CI runs lint/typecheck/test/build with a commented-out deploy stage. Skill shown, nothing shipped.

## Design patterns in use

- **Pipeline / staged processing**: ingest → stream → process → store → serve.
- **Producer/consumer** over Kinesis; **publish/subscribe** over RabbitMQ.
- **Hexagonal-ish boundaries**: services depend on shared packages (ports) not each other directly.
- **CQRS-lite**: writes go through processing; reads served from aggregates/materialized views.
- **Idempotent consumers**: processing handles at-least-once delivery (dedupe by event id).
- **Backpressure-aware ingestion**: batch + buffer to the stream.

## Data flow contracts

- **TelemetryEvent** (canonical zod schema in `libs/domain`): eventId, deviceId, assetId, ts,
  lat, lon, speedKph, engineOn, fuelLevelPct, fuelRateLph, engineHours, odometerKm, rpm.
- **metrics.updated** RabbitMQ event: { assetId, siteId, windowStart, windowEnd } — signals the
  API to invalidate/refresh cached rollups.

## Data model (PostgreSQL)

- `sites` (site_id, name, region)
- `assets` (asset_id, name, asset_type, asset_class, site_id, fuel_type, rated_power_kw)
- `telemetry_events` — **range-partitioned by time** (for window-function demos and pruning)
- `metric_rollups` — **materialized view**: per asset/site/time-bucket CO2, fuel, idle, utilization
- `reporting_daily` — written by python-etl from S3 raw (daily analytics)

## Resilience & observability patterns

- Structured logs (pino) with correlation ids across services.
- Health/readiness endpoints per service.
- Graceful shutdown; consumer checkpointing.
- **OpenTelemetry distributed tracing**: each NestJS service boots the OTel SDK with
  auto-instrumentation (HTTP, Nest, TypeORM/pg, amqplib, aws-sdk). Spans flow to an **OTel
  Collector** container, which exports to **Jaeger**. A single telemetry event can be traced
  end-to-end: ingestion → Kinesis → processing → DB/RMQ → api. All local via Docker.
- Optional stretch: Prometheus metrics + Grafana dashboards.
