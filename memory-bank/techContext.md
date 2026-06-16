# Tech Context — Verdiron Sustainability Module

> Technologies, development setup, constraints, dependencies, and the all-important
> job-requirement → feature mapping.

## Technology stack

### Language & runtime
- **Node.js 22 LTS + TypeScript** (strict mode) for all services and the frontend.
- **Python 3.11+** for the batch ETL/analytics job (polyglot showcase).

### Backend
- Framework: **NestJS** on the **Express** adapter (DI, modules, microservices transports).
- Validation: **zod** via **nestjs-zod** (schemas shared from `libs/domain`).
- API docs: **OpenAPI** via **@nestjs/swagger** (Swagger UI served per service).
- Config: **@nestjs/config** with a **zod**-validated env schema.
- Logging: **nestjs-pino** structured logs with correlation ids.
- Inter-service events: **NestJS microservices RabbitMQ transport**.
- Auth: **simple API key header** (e.g. `x-api-key`) — light realism, not full auth.
- Tracing: **OpenTelemetry** SDK (auto-instrumentation for HTTP, NestJS, TypeORM/pg, amqplib,
  aws-sdk) exporting via an **OTel Collector** to **Jaeger** for distributed traces.

Note: NestJS is used **only** for the backend services (ingestion, processing, api). The
**device-simulator is a light plain-TypeScript Node app** (no Nest), and the ETL is Python.

### Data & messaging
- **PostgreSQL** via **TypeORM** — aggregates + advanced SQL (window functions, range
  partitioning, materialized views). Partitioning + matviews created through **raw SQL
  migrations** (TypeORM migrations), since they are not expressible in the entity model.
- **DynamoDB** (via LocalStack), client **@aws-sdk/lib-dynamodb** (DocumentClient) — NoSQL hot
  store for raw telemetry.
- **Amazon Kinesis** (via LocalStack), consumed with a raw **@aws-sdk** polling loop — real-time
  ingestion stream.
- **Amazon S3** (via LocalStack) — raw telemetry archive / data lake landing zone.
- **RabbitMQ** — inter-service domain events via the NestJS RMQ transport.

### Frontend
- **React + Vite + TypeScript**.
- **Tailwind CSS** + **react-bits** components (via react-bits MCP) for polished UI flair.
- **Recharts** for charts; **TanStack Query** for API data fetching/caching; **React Router**.

### Tooling & infra (local-first)
- Monorepo: **Nx** (apps in `apps/`, shared libraries in `libs/`).
- Containers: **Docker** + **docker-compose** (Postgres, RabbitMQ, LocalStack, **OTel Collector**,
  **Jaeger**, all services, web).
- Observability: **OpenTelemetry Collector** + **Jaeger** (traces) running locally via Docker;
  pino structured logs; health/readiness endpoints. (Prometheus + Grafana for metrics = optional stretch.)
- IaC: **Terraform** targeting LocalStack, shaped like real AWS (EC2/VPC/ECS/Kinesis/S3/DynamoDB).
  Present to show the skill; **not deployed**.
- CI: **GitHub Actions** — lint, typecheck, test, build, docker build. Deploy stage commented out.
- Tests: **Jest** (unit/integration), **testcontainers** + LocalStack (integration), **Playwright**
  (one e2e happy path).

## Local development setup (target)

- Prereqs: Docker Desktop, Node 22, (optional) Python 3.11+ for running ETL outside Docker.
- One command: `docker-compose up` brings up infra + services + web dashboard.
- LocalStack init scripts create the Kinesis stream, S3 bucket, and DynamoDB table on startup.
- DB migrations (TypeORM, incl. raw-SQL partition/matview migrations) run on startup or via a
  one-shot migrate service.
- Seed/demo: started from the dashboard control panel (no manual scripts needed).
- Nx is used for dev/build/test orchestration locally; Docker keeps the runtime consistent.

## Technical constraints

- **Local-first / no deployment.** No real AWS account; everything offline via LocalStack.
- **No real company name/branding** anywhere — fictional "Verdiron" only.
- **Frontend is the only operator surface** — no manual DB ops or raw API calls in a demo.
- **Windows + PowerShell** dev host: use PowerShell-safe command syntax; avoid bash-only `&&`
  chaining. Docker keeps the runtime cross-platform.
- Keep scope small and focused; quality over breadth.

### Teaching mode (project convention)

The author is learning some parts. Code touching **advanced SQL** (partitioning, window
functions, materialized views) and the **Python/pandas ETL** must include **extra explanatory
comments and documentation** — explain the "what" and "why", not just the "how". These areas get
richer inline comments and dedicated README/Memory Bank notes so they double as learning material.
This overrides the usual "no narration comments" preference **for these specific topics only**.

## Sustainability metric definitions (domain constants)

- **CO2 from fuel**: `co2_kg = fuel_liters * factor`. Diesel factor ≈ **2.68 kg CO2/L**
  (gasoline ≈ 2.31). Fuel type per asset.
- **Idle time**: engineOn = true AND speedKph < idle threshold (≈ 2 kph) for the interval.
- **Idle fuel waste**: `idle_minutes * idle_burn_rate_lpm` (per asset class), → idle CO2 + cost.
- **Utilization**: `active_engine_hours / available_hours` over the window.
- **Fuel efficiency**: liters per engine hour (and/or per km) per asset.
- **Fleet rollups**: sums/averages grouped by site, project, asset class, and time bucket.

## Job-requirement → feature mapping (the selling table)

| Job requirement | Where it shows up |
|---|---|
| Node.js + TypeScript | entire monorepo, strict TS, NestJS services |
| AWS (EC2, S3, Kinesis, etc.) | Kinesis ingest, S3 archive, DynamoDB (LocalStack); EC2/VPC/ECS shaped in Terraform |
| Microservices Architecture | NestJS ingestion, processing, api services + simulator + ETL |
| Advanced SQL (PostgreSQL) | TypeORM + raw SQL: window functions, range partitioning, materialized views |
| NoSQL Databases | DynamoDB hot store for raw telemetry |
| Message Queues (RabbitMQ/SQS) | RabbitMQ via NestJS transport + Kinesis stream |
| API Design, Integration, Impl | REST + @nestjs/swagger + zod, versioned routes, API key, control routes |
| Docker | per-service Dockerfiles + full docker-compose |
| CI/CD (Terraform) | Terraform IaC + GitHub Actions CI (no deploy) |
| Data Engineering / ETL | ingest→process pipeline + Python batch ETL from S3 |
| IoT Platforms | device simulator emitting realistic telematics |
| C#/.NET/Python background | Python ETL/analytics job (polyglot breadth) |

## Key dependencies (planned, versions resolved at install)

- Backend: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/config`,
  `@nestjs/swagger`, `@nestjs/microservices`, `nestjs-zod`, `zod`, `nestjs-pino`, `pino`,
  `typeorm`, `pg`, `@aws-sdk/client-kinesis`, `@aws-sdk/client-s3`,
  `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `amqplib`.
- Observability: `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`,
  `@opentelemetry/exporter-trace-otlp-http` (+ OTel Collector & Jaeger as containers).
- Frontend: `react`, `react-dom`, `vite`, `tailwindcss`, `recharts`, `@tanstack/react-query`,
  `react-router-dom`.
- Tooling: `typescript`, `nx`, `eslint`, `prettier`, `jest`, `ts-jest`, `supertest`,
  `testcontainers`, `@playwright/test`.
- Python ETL: `boto3`, `psycopg`, `pandas`.
