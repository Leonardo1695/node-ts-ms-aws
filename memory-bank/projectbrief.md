# Project Brief — Verdiron Sustainability Module

> Foundation document. Source of truth for scope. All other memory-bank files build on this.

## What this is

A focused, senior-level **backend showcase project** built to demonstrate engineering skill
for a Node.js + TypeScript recruitment process. It simulates the product and technology
context of a real construction-fleet IoT company **without using any real company name or
branding**. The fictional stand-in is **Verdiron**.

This is **not** a full product clone. It is a small, deliberately-scoped slice that exercises
every requirement in the target job description end-to-end.

## The fictional product: Verdiron

Verdiron is a construction technology platform that tracks, manages, and optimizes equipment,
vehicles, and assets across fleet operations using GPS, sensors, and telematics. Heavy
equipment (excavators, loaders, trucks, generators) carries IoT trackers that stream telemetry
(location, fuel, engine hours, idling, diagnostics).

## The module we build: Sustainability / Emissions

The slice = the **new sustainability module**. Backend responsibilities mirrored from the job:

- Build the **data ingestion pipeline** for IoT telemetry.
- Build the **data processing engine** that calculates sustainability metrics.
- Build the **APIs** that support the frontend dashboard.
- Use Node.js, AWS, and PostgreSQL in a scalable, reliable **microservices** architecture.

Plus a small **frontend dashboard** so the whole system is demonstrable through a UI (no manual
DB operations or raw API calls during a demo).

## Core goals

1. Visibly tick every requirement of the job description (see `techContext.md` mapping).
2. Show seniority: clean boundaries, tests, observability, IaC, documented decisions.
3. Be **local-first**: one command (`docker-compose up`) runs the whole stack on a laptop,
   no cloud account, no deployment.
4. Tell a clear story to an interviewer via a tight README + a one-click demo UI.

## Explicit scope

In scope:
- 4 Node/TS microservices + a device simulator + a Python ETL batch job + a React frontend.
- Local AWS via LocalStack (Kinesis, S3, DynamoDB).
- PostgreSQL (advanced SQL), DynamoDB (NoSQL), RabbitMQ (events), Kinesis (stream).
- Docker Compose, Terraform (LocalStack-targeted, **not deployed**), GitHub Actions CI (no deploy).
- Tests (unit, integration, contract, one e2e) and documentation.

Out of scope (for now):
- Real cloud deployment, real AWS account, production hardening, auth/SSO, multi-tenancy,
  the rest of Verdiron's product surface (maintenance, compliance, dash cams, etc.).

## Non-negotiable constraints

- **Local-first**: no deployment yet. CI/CD + Terraform exist only to demonstrate the skill.
- **No real company name or branding** anywhere in code, docs, or UI. Use "Verdiron".
- **Everything demoable through the frontend** — no manual DB edits or direct API hits needed.
- **Two doc layers**: a lean README (deliverable) + this full Memory Bank (deep reference).
