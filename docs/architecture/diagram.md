# Verdiron — System Architecture

Canonical architecture diagram for the Sustainability module. Renders on GitHub, in VS Code, and most Markdown viewers that support Mermaid.

## Diagram

```mermaid
flowchart TB
  subgraph client [Client]
    WEB["web-dashboard :4200<br/>React · TanStack Query"]
  end

  subgraph services [Application services]
    SIM["device-simulator :3010<br/>IoT telemetry emulator"]
    ING["ingestion-service :3001<br/>NestJS · validate · produce"]
    PROC["processing-service :3002<br/>NestJS · Kinesis consumer"]
    API["api-service :3003<br/>NestJS · REST · control"]
  end

  subgraph aws [AWS via LocalStack]
    KIN[["Kinesis · telemetry"]]
    S3[("S3 · verdiron-raw")]
    DDB[("DynamoDB · telemetry-hot")]
  end

  subgraph platform [Platform]
    PG[("PostgreSQL<br/>partitions · matview")]
    RMQ[["RabbitMQ<br/>domain events"]]
  end

  subgraph batch [Batch analytics]
    ETL["python-etl<br/>pandas rollups"]
  end

  subgraph obs [Observability]
    OTEL["OTel Collector :4318"]
    JAE["Jaeger :16686"]
  end

  WEB -->|"REST + x-api-key"| API
  WEB -->|"control UI"| API

  SIM -->|"POST telemetry"| ING
  ING --> KIN
  ING --> S3
  KIN --> PROC

  PROC --> PG
  PROC --> DDB
  PROC --> RMQ
  RMQ -->|"metrics.updated"| API
  API -->|"SQL reads"| PG

  API -.->|"start/stop sim · run ETL"| RMQ
  ETL -->|"read archives"| S3
  ETL -->|"reporting_daily"| PG

  ING -.-> OTEL
  PROC -.-> OTEL
  API -.-> OTEL
  OTEL --> JAE
```

## Primary flows

1. **Live telemetry** — simulator → ingestion → Kinesis + S3 → processing → PostgreSQL + DynamoDB → API → dashboard.
2. **Domain events** — processing publishes `metrics.updated` on RabbitMQ; API consumes for cache invalidation.
3. **Demo control** — dashboard control routes → API → RabbitMQ → simulator / Python ETL worker.
4. **Batch analytics** — Python ETL reads S3 JSONL, writes daily rollups to `reporting_daily`.
5. **Tracing** — all NestJS services export OpenTelemetry spans to the collector → Jaeger.

## Also see

- [`README.md`](../../README.md) — quick start and demo tour
- [`memory-bank/systemPatterns.md`](../../memory-bank/systemPatterns.md) — design decisions
