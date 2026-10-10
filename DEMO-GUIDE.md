# Veritas HACCP — Demo Guide (5 minutes)

A click-by-click walkthrough for showing this prototype to anyone — a hiring manager, a food
safety colleague, or a client. No preparation needed beyond `npm install && npm run dev`.

> All telemetry in this demo is **simulated locally**. Say so out loud at the start — it builds
> credibility rather than costing it.

## Setup (30 seconds)

```bash
npm install
npm run dev
# open http://localhost:3000
```

Click through the **guided tour** when it appears (or press "Take the tour" in the header later).

## The story to tell

*"This is the digital version of the paper CCP logbook. I'll show you what happens when a
critical limit is breached — in the old world, that's a missed line in a binder; here, the
system catches it, contains it, and walks you through the full corrective-action workflow
that HACCP Principle 5 requires."*

## Steps

**1. Set the scene (30 sec)**
- Select the **Fluid Milk & HTST Dairy Processing** plan (top of the dashboard).
- Point at the **digital twin** schematic: "Each node is a process step; the shield icons are
  the CCPs — pasteurization temp, CIP wash, cold storage."
- Point at the **compliance gauges**: "Live numbers from the audit ledger, not hard-coded."

**2. Inject the breach (30 sec)**
- In the **header**, click **⚡ Simulate CCP Deviation**.
- Narrate: *"A pasteurization temperature just dropped below 72°C."*
- Watch: the twin node turns **red**, a deviation **toast** slides in, the plan badge shows an
  open deviation, gauges drop.

**3. Triage the deviation (1 min)**
- Click the failed (red) row in the ledger → the **resolution panel** opens.
- Walk through: **deviation status** (OPEN_INVESTIGATION) → **product disposition** choices
  (hold / rework / reject) → pick HOLD_PENDING_LAB_RELEASE.
- Say: *"Containment first, paperwork second — that's the discipline the system enforces."*

**4. Root cause + corrective actions (1.5 min)**
- Open **Root Cause Analysis**: pick the 5-Whys method, enter the immediate cause and the real
  root cause (e.g., "steam valve actuator lag").
- Step through the **corrective-action steps**: each has an owner role, a timeline and required
  evidence. Mark them complete as you narrate.
- Add a **preventive action** (e.g., "weekly actuator response test") with a target date.

**5. Verify and close (1 min)**
- Record **verification**: method, acceptance criteria, result, verifier name.
- Set **revalidation** to scheduled with a date, then **close** the deviation.
- Watch the toast clear, the twin node return to green, the gauges recover.

**6. Prove the audit trail (30 sec)**
- Scroll the ledger: *"Every reading, every action, every signature — timestamped, in order,
  in one place. This is what an auditor gets instead of a binder."*
- Open the **protocol/dossier modal** (header button) to show the regulatory framing.

## Reset between demos

Header → **Reset** (or POST `/api/audit/reset`) restores the seeded baseline instantly.

## Talking points if asked "why did you build this?"

- Food-safety domain depth (MPhil, CIEH L3/L4, years on dairy/bakery/hospital floors) plus
  hands-on digital delivery (PITB/PAFDA: LIMS, QMS, Data Bank).
- Demonstrates the full loop: domain model → working software → auditable workflow — the same
  loop used when digitizing compliance at government scale.
- Honest about limits: it's a prototype with simulated telemetry, not a certified system —
  and that honesty is the point.
