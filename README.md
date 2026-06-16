# Verdiron — Sustainability Module

> Placeholder README. Full deliverable content will be added in VRD-100.

Local-first Node.js + TypeScript microservices showcase for fleet sustainability metrics
(CO2, fuel, idling, utilization).

## Quick start

Copy `.env.example` to `.env`, then:

```bash
docker compose up -d
```

Services: Postgres (`5432`), RabbitMQ (`5672`, mgmt UI `15672`), LocalStack (`4566`), OTel Collector (`4317`/`4318`), Jaeger UI (`16686`).

## Docs

Deep project reference lives in `memory-bank/`.
