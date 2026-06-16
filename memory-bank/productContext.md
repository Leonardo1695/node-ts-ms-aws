# Product Context — Verdiron Sustainability Module

> Why this project exists, the problems it solves, how it should work, and UX goals.

## Why this project exists

The project exists to prove engineering capability and seniority during a recruitment process
for a Node.js + TypeScript backend role at a construction-fleet IoT company. Rather than a toy
demo, it recreates the company's real problem domain and technology context (anonymized as
**Verdiron**) so the interviewer sees relevant, production-shaped work.

## The real-world problem being modeled

Construction contractors run mixed fleets of heavy equipment and vehicles. These assets burn
fuel, idle wastefully, and are often under- or over-utilized. Sustainability reporting (CO2
emissions, fuel waste, idling, utilization) is increasingly required for compliance, cost
control, and ESG goals — but the data is scattered across telematics devices.

The sustainability module turns the raw IoT telemetry firehose into trustworthy sustainability
metrics and dashboards that operations teams can act on.

## What problems it solves

1. **Ingestion at scale** — accept high-volume IoT telemetry reliably, durably archive raw data.
2. **Processing into metrics** — compute CO2, fuel burn, idle waste, and utilization correctly.
3. **Serving dashboards** — fast, well-designed APIs that power operational dashboards.
4. **Actionability** — surface the worst idling offenders and underutilized assets so teams
   can change behavior and cut emissions/cost.

## How it should work (user-facing flow)

1. IoT trackers (simulated) on assets emit telemetry continuously: location, speed, engine on/off,
   fuel level, fuel rate, engine hours, odometer, RPM.
2. The platform ingests, validates, streams, and archives that telemetry.
3. A processing engine computes per-asset and fleet-level sustainability metrics over time.
4. Operations users open the **dashboard** to see:
   - Fleet-wide CO2, fuel consumed, idle waste, and utilization, with trends.
   - Per-asset detail and fuel efficiency.
   - A ranked idling/waste report to target the biggest offenders.
5. A daily batch ETL job produces richer reporting aggregates from the archived raw data.

## Primary persona

**Fleet Sustainability / Operations Manager** — wants a clear picture of emissions and waste
across sites and projects, and a short list of where to act. Not technical; lives in the
dashboard.

## UX goals (frontend)

- **Pretty but focused**: small set of high-quality screens, strong visual hierarchy, clean charts.
- **Self-driving demo**: a control panel starts/stops the device simulator, triggers the ETL job,
  and shows a live ingestion counter — so the entire system is demonstrable from the browser.
- **API-only data**: the UI consumes only our REST API. No direct DB access, no manual steps.
- **Trustworthy numbers**: metrics shown with units and clear definitions; consistent rounding.

## Success criteria for the demo

- `docker-compose up` then open the UI.
- Click "Start simulator"; within seconds charts begin filling with live metrics.
- Drill into an asset; view the idling report; trigger the ETL job; see reporting update.
- The interviewer never touches the database or a terminal beyond the single compose command.
