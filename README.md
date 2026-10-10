# Veritas HACCP — Digital CCP Monitoring & Deviation Resolution

A working prototype of a HACCP (Hazard Analysis and Critical Control Points) compliance platform:
live CCP monitoring, automatic deviation detection, a full corrective-action workflow (HACCP
Principle 5), and an append-only audit ledger — all running locally on Node.js + SQLite.

> **What this is:** a demonstration/prototype built to show how paper HACCP logbooks translate
> into a real-time digital system. Telemetry from the "Simulate IoT sample" and "Run Test
> Scenario" buttons is **generated locally for demonstration** — it is not live plant data.

## Features

- **4 built-in HACCP plans** — Fluid Milk & HTST Dairy, Industrial Ice Cream, Commercial Bakery,
  RTE Deli Meats — each with realistic CCPs, critical limits and regulatory standards
  (FDA PMO, Codex, AIB, USDA FSIS)
- **Operations Control Center dashboard** — plan selector, CAPA workflow guide, process-flow
  digital twin with live node status, compliance health gauges, CCP reading form, audit ledger
- **Deviation lifecycle** — a breached limit instantly opens a deviation: root-cause analysis
  (5 Whys / fishbone), corrective-action steps with owners, timelines and evidence, verification
  records, preventive actions, revalidation tracking, product disposition decisions
- **Audit ledger** — every reading and action in an append-only, timestamped trail
- **First-run guided tour** — a 60-second overlay that explains each panel (replayable from the
  header's "Take the tour" button)
- **Demo mode** — simplified interface for walkthroughs (`?demo=true` or the header toggle)
- **REST API** — plans, CCPs, stats, audit submit/trail, resolutions, IoT stream simulation,
  test-scenario simulation, reset

## Quick start

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev        # starts API + UI on http://localhost:3000
```

The SQLite database (`data/haccp_shield.sqlite`) is created and seeded automatically on first
run with 4 plans, 12 CCPs and baseline audit records. No API keys, no cloud, no build step needed
for development.

For production: `npm run build` then `NODE_ENV=production npm start` (serves `dist/`).

## 5-minute demo script

Full click-by-click version: see **[DEMO-GUIDE.md](DEMO-GUIDE.md)**.

1. Open http://localhost:3000 → take the 60-second guided tour.
2. Pick the **Fluid Milk** plan. In the header, click **⚡ Simulate CCP Deviation** — a CCP breach
   is injected: watch the digital-twin node turn red and the alert toast appear.
3. Open the failed ledger row → walk the resolution workflow: log root cause → complete the
   corrective steps → record verification → add a preventive action → close the deviation.
4. Watch the compliance gauges and plan badge return to green. Every step is in the ledger.

## Project structure

```
├── server.ts               # Express bootstrap (dev: Vite middleware, prod: serves dist/)
├── server/
│   ├── db.ts               # node:sqlite database, schema + seed data
│   ├── routes.ts           # REST API (/api/plans, /api/ccps, /api/stats, /api/audit/*, /api/resolutions)
│   ├── workflow.ts         # deviation workflow helpers
│   └── resolution.ts       # Principle-5 resolution engine
├── src/
│   ├── App.tsx             # routes: landing page → dashboard
│   ├── types.ts            # domain model (plans, CCPs, deviations, RCA, verification…)
│   ├── config/brand.ts     # central product naming
│   └── components/
│       ├── GuidedTour.tsx      # first-run onboarding overlay (new)
│       ├── Dashboard.tsx       # operations control center
│       ├── LandingPage.tsx     # marketing/landing page
│       ├── DigitalTwinPipeline.tsx  # process-flow schematic
│       ├── DigitalAuditForm.tsx     # CCP reading entry
│       ├── AuditLedger.tsx          # append-only trail + resolution UI
│       ├── ResolutionWorkflow.tsx   # RCA → corrective → verification → preventive
│       ├── ComplianceHealthRing.tsx # compliance gauges
│       ├── DeviationStatusBanner.tsx / ScadaAlertToast.tsx
│       ├── NotificationCenter.tsx / ProtocolModal.tsx / CapaWorkflowGuide.tsx
│       └── HaccpPlanSelector.tsx
└── data/                   # SQLite database (auto-created, WAL mode)
```

## API reference (base `/api`)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | service status |
| GET | `/plans` | list HACCP plans |
| GET | `/ccps?planId=` | CCP definitions for a plan |
| GET | `/stats?planId=` | live compliance stats |
| POST | `/audit/submit` | log a CCP reading (auto-opens deviation on breach) |
| GET | `/audit-trail?planId=` | full audit trail with resolution data |
| GET | `/resolutions` | open deviations + active alerts |
| POST | `/audit/simulate-test-scenario` | inject a scripted breach (demo) |
| POST | `/audit/stream-iot` | generate a simulated telemetry sample (demo) |
| POST | `/audit/reset` | reseed demo data |

## Tech stack

React 18 + TypeScript + Vite + Tailwind CSS · `motion` animations · `lucide-react` icons ·
Express · `node:sqlite` (WAL mode) · `react-router-dom`

## Author's note

Built to demonstrate the combination of food-safety domain knowledge (MPhil Food Safety & Control,
UVAS; CIEH Levels 3 & 4; HACCP training) and digital delivery — business analysis, documentation,
UAT and prototype engineering for regulated food operations. The domain model (CCPs, limits,
deviation workflow) reflects real HACCP practice; the software is a prototype, not a certified
compliance system.
