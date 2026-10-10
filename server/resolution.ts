/**
 * HACCP Deviation Resolution Engine — Codex Alimentarius / HACCP Principle 5 (Corrective Actions)
 *
 * Builds a complete, auditable deviation-resolution package for EVERY critical control point
 * across all four production lines (milk, ice_cream, bakery, meat):
 *
 *   1. Immediate containment & line isolation
 *   2. Affected-product scope determination
 *   3. Product disposition decision (release / hold / rework / reprocess / reject)
 *   4. Root cause analysis
 *   5. Process correction & re-establishment of the critical limit
 *   6. Effectiveness verification with objective evidence
 *   7. Preventive action + CCP plan revalidation
 *   8. Documented QA closure sign-off
 */

export type DeviationStatus =
  | 'OPEN_INVESTIGATION'
  | 'CONTAINED'
  | 'CORRECTED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'PRODUCT_REJECTED';

export type DispositionDecision =
  | 'REPROCESS_THEN_RELEASE'
  | 'HOLD_PENDING_LAB_RELEASE'
  | 'REWORK_THEN_RELEASE'
  | 'REJECT_AFFECTED_LOT'
  | 'REPACK_THEN_RELEASE'
  | 'RELEASE_NO_IMPACT';

export interface ResolutionStep {
  step: number;
  phase: string;
  title: string;
  description: string;
  responsible_role: string;
  timeline: string;
  evidence_required: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
}

export interface RootCauseAnalysis {
  immediate_cause: string;
  root_cause: string;
  contributing_factors: string[];
  analysis_method: '5_whys' | 'fishbone_ica' | 'fault_tree';
  analyzed_by: string;
  analyzed_at: string;
}

export interface VerificationRecord {
  verification_method: string;
  acceptance_criteria: string;
  verification_result: 'pass' | 'fail' | 'conditional';
  verified_by: string;
  verified_at: string;
  evidence_documents: string[];
  notes: string;
}

export interface PreventiveAction {
  action: string;
  responsible_role: string;
  target_date: string;
  status: 'planned' | 'in_progress' | 'implemented' | 'verified_effective';
  effectiveness_check: string;
}

export interface ResolutionRecord {
  plan_id: string;
  ccp_code: string;
  ccp_name: string;
  process_stage: string;
  hazard_type: string;
  unit_of_measure: string;
  critical_limit: string;
  recorded_value: number;
  batch_number: string;
  deviation_status: DeviationStatus;
  product_disposition: DispositionDecision;
  disposition_rationale: string;
  affected_product_scope: string;
  immediate_containment: string;
  root_cause_analysis: RootCauseAnalysis;
  corrective_action_steps: ResolutionStep[];
  verification_record: VerificationRecord;
  preventive_actions: PreventiveAction[];
  revalidation_status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'failed';
  revalidation_date: string;
  capa_reference: string;
  owner_role: string;
  regulatory_reference: string;
  opened_at: string;
  closed_at: string | null;
  closure_authorized_by: string | null;
}

interface Playbook {
  ownerRole: string;
  capaReference: string;
  containment: string;
  disposition: DispositionDecision;
  dispositionRationale: string;
  affectedScope: (v: number, unit: string, batch: string) => string;
  rootCause: {
    immediate: (v: number) => string;
    root: string;
    contributing: string[];
    method: '5_whys' | 'fishbone_ica' | 'fault_tree';
  };
  correction: { title: string; description: (v: number, limit: string) => string; role: string; timeline: string; evidence: string }[];
  verification: {
    method: string;
    criteria: (limit: string) => string;
    evidence: string[];
    notes: string;
  };
  preventive: { action: string; role: string; dueDays: number; effectiveness: string }[];
  revalidation: { status: 'scheduled' | 'in_progress'; dueDays: number; description: string };
  regulatory: string;
}

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10);

const PLAYBOOKS: Record<string, Playbook> = {
  /* ============================ FLUID MILK ============================ */
  'milk:CCP-1A': {
    ownerRole: 'Dairy QA Manager / Shift Lead',
    capaReference: 'CAPA-MILK-01',
    containment:
      'FDV-301 sanitary 3-way flow divert valve driven to DIVERT position; HTST unit locked out; ' +
      'flow downstream of the hold tube routed to SILO_RAW_RECYCLE_B4 and hold-tagged. Filler and cartoner line stopped.',
    disposition: 'REPROCESS_THEN_RELEASE',
    dispositionRationale:
      'Sub-lethality pasteurized milk is not intrinsically unsafe if it never reached distribution. ' +
      'All diverted material is returned to the balance tank and re-pasteurized through a validated HTST cycle before release.',
    affectedScope: (v, unit, batch) =>
      `100% of ${batch} produced from the last passing CCP-1A check until this ${v}${unit} reading. ` +
      `Quantity = flow rate 120 L/min x 15 s hold tube residence x elapsed excursion window. No finished-good release permitted until reprocessed.`,
    rootCause: {
      immediate: (v) => `Holding tube outlet temperature dropped to ${v}°C, below the 72.0°C HTST critical limit.`,
      root: 'Steam supply pressure to the regenerative preheater fell below setpoint, reducing the regenerative section outlet temperature available to the hold tube.',
      contributing: [
        'Steam header pressure fluctuation during peak boiler demand',
        'Regenerative section fouling reducing heat-transfer coefficient',
        'Flow-rate drift above 120 L/min shortening effective residence time',
        'Single RTD sensor without independent redundant verification probe',
      ],
      method: 'fishbone_ica',
    },
    correction: [
      {
        title: 'Confirm and lock the critical limit',
        description: (v, limit) => `Independently verify with a calibrated second probe that the hold tube is at or above ${limit}, not just the ${v}°C indicated value. Two-person rule required.`,
        role: 'Dairy QA Manager',
        timeline: 'Immediate (< 15 min)',
        evidence: 'Dual-probe verification record with calibration certificate numbers',
      },
      {
        title: 'Re-establish thermal process',
        description: (v) => `Restore steam header to 8.5 bar, purge the air bleed on the hold tube, and re-establish ≥72.0°C for 15 s at ≤120 L/min. Do not release the previously diverted milk into saleable stock until the cycle is re-validated.`,
        role: 'Shift Lead / Maintenance',
        timeline: 'Within 30 min',
        evidence: 'SCADA trend export showing 15 s dwell at target temperature',
      },
      {
        title: 'Reprocess the diverted lot',
        description: (_v, _limit) => 'Transfer SILO_RAW_RECYCLE_B4 contents back through the HTST unit as a single re-pasteurized batch with batch suffix -R1 and full CCP-1A monitoring at 30-second intervals.',
        role: 'Dairy QA Manager',
        timeline: 'Next available validated cycle (< 4 h)',
        evidence: 'Reprocessing batch record, 30-second CCP monitoring chart',
      },
      {
        title: 'Microbiological release testing',
        description: () => 'Test the reprocessed lot for total plate count and coliforms per PMO Table 2 before the QA release decision.',
        role: 'Lab Supervisor',
        timeline: 'Within 24 h',
        evidence: 'Accredited lab report with PMO compliance statement',
      },
    ],
    verification: {
      method: 'Three consecutive validated HTST cycles at target lethality, plus finished-product micro testing.',
      criteria: (limit) => `All hold-tube probes ≥ ${limit} for the full validated residence time with no single excursion, and total plate count / coliform results within PMO limits.`,
      evidence: ['Validated cycle trend charts (3 cycles)', 'PMO Table 2 lab report', 'Probe calibration certificates'],
      notes: 'Effective corrective action is only proven after three consecutive conforming cycles.',
    },
    preventive: [
      { action: 'Install redundant independent hold-tube RTD with automatic cross-check comparison and alarm on >1.0°C divergence.', role: 'Automation Engineer', dueDays: 30, effectiveness: 'Simulated dual-probe fault must raise alarm within 2 s during validation test.' },
      { action: 'Add steam header pressure low-alarm interlock that blocks the HTST pump start below 7.5 bar.', role: 'Maintenance Lead', dueDays: 21, effectiveness: 'Interlock proven by forcing low header pressure during commissioning.' },
      { action: 'Quarterly descaling and heat-transfer verification of the regenerative preheater.', role: 'Maintenance Lead', dueDays: 90, effectiveness: 'U-coil heat-transfer coefficient within 10% of commissioning baseline.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 30, description: 'Full CCP-1A critical-limit revalidation including time/temperature distribution study after the redundant probe installation.' },
    regulatory: 'FDA Grade "A" PMO Appendix H; 21 CFR 1240.61; ISO 22000:2018 Clause 8.5.2'
  },

  'milk:CCP-1B': {
    ownerRole: 'Sanitation Lead / CIP Engineer',
    capaReference: 'CAPA-MILK-02',
    containment:
      'CIP skid recirculation timer paused, caustic dosing valve closed, and all product-contact surfaces ' +
      'flagged as "unverified sanitation" in the line clearance record. Filler released only after a re-CIP cycle.',
    disposition: 'REJECT_AFFECTED_LOT',
    dispositionRationale:
      'A failed clean-in-place sanitation cycle means the microbiological efficacy of the post-CIP rinse is unproven. ' +
      'Product packed on those surfaces between CIP completion and the breach cannot be assured as safe, so it is rejected.',
    affectedScope: (v, unit, batch) =>
      `All product of ${batch} packed between the last validated CIP release and the ${v}${unit} caustic temperature breach. Hold tags applied to every pallet produced in that window.`,
    rootCause: {
      immediate: (v) => `Caustic wash loop temperature fell to ${v}°C, below the ≥65.0°C minimum required for milkstone and biofilm protein denaturation.`,
      root: 'Steam injection booster valve on the CIP skid failed to open on demand, so the loop lost heat faster than the jacket could replace it.',
      contributing: [
        'Booster solenoid coil burnt out without fault annunciation',
        'CIP temperature control loop tuned too tightly (no deadband)',
        'No independent verification probe in the caustic return line',
        'Caustic concentration drift accelerating heat demand',
      ],
      method: 'fault_tree',
    },
    correction: [
      { title: 'Isolate and hold affected product', description: () => 'Apply electronic and physical hold tags to all pallets packed since the last validated CIP release. Physically segregate in the QA hold bay.', role: 'Warehouse QA', timeline: 'Immediate (< 15 min)', evidence: 'Pallet hold register with tag photographs' },
      { title: 'Repair the CIP heat recovery system', description: () => 'Replace the booster solenoid and recalibrate the temperature control loop with a ±2.0°C deadband. Verify against an independent reference thermometer.', role: 'Maintenance Lead', timeline: 'Within 4 h', evidence: 'Maintenance work order, calibration record' },
      { title: 'Re-run a full validated CIP cycle', description: () => 'Execute a complete alkaline then acid cycle, verifying caustic ≥65.0°C, final rinse conductivity ≤50 µS/cm and ATP swab <50 RLU on product-contact surfaces.', role: 'Sanitation Lead', timeline: 'Within 12 h', evidence: 'CIP cycle printout, conductivity log, ATP swab results' },
      { title: 'Disposition held product', description: () => 'QA Manager reviews hold register, ATP and micro data, then issues a written release or rejection decision per pallet.', role: 'Dairy QA Manager', timeline: 'Within 24 h', evidence: 'Signed disposition decision record' },
    ],
    verification: {
      method: 'Two consecutive validated CIP cycles with independent temperature and hygiene verification.',
      criteria: () => 'Caustic loop ≥65.0°C throughout the wash dwell, rinse conductivity ≤50 µS/cm, ATP <50 RLU on all product-contact surfaces.',
      evidence: ['CIP cycle printouts (2 cycles)', 'Reference thermometer comparison', 'ATP swab report', 'Rinse conductivity log'],
      notes: 'The line is only released for production after two consecutive conforming CIP cycles.',
    },
    preventive: [
      { action: 'Add an interlock that aborts the CIP cycle and alarms if the caustic temperature falls below 65.0°C for more than 60 s.', role: 'Automation Engineer', dueDays: 21, effectiveness: 'Forced under-temperature test must abort the cycle and raise a SCADA alarm.' },
      { action: 'Add solenoid coil continuity monitoring with predictive failure alarm to all CIP actuator coils.', role: 'Automation Engineer', dueDays: 45, effectiveness: 'Open-circuit simulation triggers the alarm before the valve fails.' },
      { action: 'Introduce a weekly CIP verification check to the plant sanitation SOP and pre-operational checklist.', role: 'Sanitation Lead', dueDays: 7, effectiveness: 'Four weeks of signed checklists with zero unverified steps.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 21, description: 'Re-run the validated CIP cycle study for the milk line after the control-loop recalibration and interlock installation.' },
    regulatory: 'FDA 21 CFR 117 Subpart B; ISO 22000:2018 Clause 8.5.1'
  },

  'milk:CCP-1C': {
    ownerRole: 'Refrigeration Supervisor / QA Manager',
    capaReference: 'CAPA-MILK-03',
    containment:
      'Packaging line feed pump locked out, silo 4 temperature setpoint alarm latched, and batch hold tag applied. ' +
      'Finished product in silo 4 and downstream WIP quarantined.',
    disposition: 'HOLD_PENDING_LAB_RELEASE',
    dispositionRationale:
      'A cold-chain excursion does not automatically render pasteurized milk unsafe, but growth potential must be assessed. ' +
      'Product is held until the cumulative time-temperature history is reviewed and microbiological results confirm compliance.',
    affectedScope: (v, unit, batch) => `100% of ${batch} held in SILO_4_PASTEURIZED and all downstream packaging WIP, from the first reading above 4.0°C to the ${v}${unit} peak.`,
    rootCause: {
      immediate: (v) => `Pasteurized milk silo 4 reached ${v}°C, above the 4.0°C maximum cold-chain critical limit.`,
      root: 'Secondary ammonia glycol chiller failed to hold setpoint because the evaporator fan VFD derated on a high-pressure alarm following a condenser water supply loss.',
      contributing: [
        'Condenser cooling water supply valve stuck partially open',
        'Evaporator fan VFD thermal derate at high head pressure',
        'No redundant temperature sensor for the secondary chiller loop',
        'Silo insulation degradation on the north wall allowing warm-air ingress',
      ],
      method: '5_whys',
    },
    correction: [
      { title: 'Stop the warm hold', description: (v) => `Verify the silo has returned to ≤4.0°C and hold at that temperature. Do not feed packaging until the full ${v}°C excursion duration is known from the trend historian.`, role: 'Refrigeration Supervisor', timeline: 'Immediate', evidence: 'Temperature trend historian export' },
      { title: 'Restore refrigeration capacity', description: () => 'Repair the condenser water supply valve, reset the fan VFD derate, and confirm glycol loop return temperature within ±0.5°C of setpoint.', role: 'Maintenance Lead', timeline: 'Within 4 h', evidence: 'Maintenance work order, glycol loop trend' },
      { title: 'Assess the affected product', description: () => 'QA microbiologist calculates cumulative time above 4.0°C and compares against the pasteurized milk shelf-life model. Sample for total plate count, coliforms and psychrotrophic counts.', role: 'Lab Supervisor', timeline: 'Within 24 h', evidence: 'Excursion assessment report, lab results' },
      { title: 'QA disposition decision', description: () => 'Release only if cumulative abuse is within the validated shelf-life model and lab results conform; otherwise reject and record in the market withdrawal register if already distributed.', role: 'Dairy QA Manager', timeline: 'Within 24 h', evidence: 'Signed release/rejection decision' },
    ],
    verification: {
      method: '72-hour continuous temperature mapping of the silo with an independent logger, plus microbiological results.',
      criteria: () => 'Independent logger confirms ≤4.0°C for 72 h with no drift beyond ±0.5°C, and microbiological results remain within PMO limits.',
      evidence: ['Independent 72 h logger download', 'Time-temperature excursion assessment', 'Microbiological test report'],
      notes: 'If product left plant control, escalate to a documented market withdrawal assessment within 24 h.',
    },
    preventive: [
      { action: 'Install a redundant independent silo temperature sensor with a high-high trip to the packaging feed pump.', role: 'Automation Engineer', dueDays: 30, effectiveness: 'Simulated sensor failure must trip the feed pump within 2 s.' },
      { action: 'Repair silo 4 north-wall insulation and re-survey all four pasteurized silos with thermography.', role: 'Maintenance Lead', dueDays: 45, effectiveness: 'Thermography shows no ΔT above 2.0°C across the vessel envelope.' },
      { action: 'Add chilled-water supply pressure low-alarm to the chiller PLC with automatic condenser valve reset.', role: 'Automation Engineer', dueDays: 21, effectiveness: 'Forced low-pressure test raises the alarm and the valve reopens automatically.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 30, description: 'Re-map the cold chain for the pasteurized storage loop and revalidate the shelf-life model against the observed excursion profile.' },
    regulatory: 'FDA 21 CFR 117 Subpart B; ISO 22000:2018 Clause 8.5.3'
  },

  /* ============================ ICE CREAM ============================ */
  'ice_cream:CCP-2A': {
    ownerRole: 'Ice Cream QA Manager / Freezing Supervisor',
    capaReference: 'CAPA-ICE-01',
    containment:
      'Blend vat 1 steam jacket pressure raised, 30-minute regulatory dwell timer reset to zero, ' +
      'packaging line interlocked so no sub-lethality mix can reach the freezer.',
    disposition: 'REPROCESS_THEN_RELEASE',
    dispositionRationale:
      'The pasteurization lethality step was incomplete, so the mix must be re-pasteurized in full before freezing. ' +
      'Only once a validated 69.0°C / 30-minute cycle is complete may the batch proceed to freezing and release.',
    affectedScope: (v, unit, batch) => `100% of ${batch} in BLEND_VAT_01 from the start of the incomplete dwell to the ${v}${unit} trip point, plus all downstream freezer and hardening WIP.`,
    rootCause: {
      immediate: (v) => `Blend vat temperature fell to ${v}°C, below the 69.0°C minimum pasteurization requirement for frozen dairy desserts.`,
      root: 'Steam jacket condensate backup reduced the effective heat-transfer area, and the interlock that should have locked out the agitator on low temperature had its fail-safe defeated by a bypassed PLC input.',
      contributing: [
        'Condensate trap blocked on the jacket return',
        'Low-temperature agitator interlock input bypassed during prior maintenance',
        'Single temperature sensor with no independent dwell-time confirmation',
        'Operator log showed an unrecorded pre-shift setpoint change',
      ],
      method: 'fishbone_ica',
    },
    correction: [
      { title: 'Hold and tag the incomplete mix', description: () => 'Tag BLEND_VAT_01 and all downstream WIP as "incomplete pasteurization — do not freeze or release". Segregate physically.', role: 'Freezing Supervisor', timeline: 'Immediate', evidence: 'Vessel hold tag register' },
      { title: 'Repair the heating system and restore the interlock', description: () => 'Clear the jacket condensate trap, restore the agitator low-temperature interlock input, and verify it trips on a forced low-temperature simulation.', role: 'Maintenance Lead', timeline: 'Within 4 h', evidence: 'Work order, forced interlock test video/record' },
      { title: 'Re-pasteurize the full batch', description: () => 'Reheat the mix to ≥69.0°C and hold for the full validated 30-minute dwell with continuous recording. The timer must be interlocked to temperature, not operator-startable.', role: 'Ice Cream QA Manager', timeline: 'Within 8 h', evidence: 'Dwell timer printout and temperature chart' },
      { title: 'Micro release testing', description: () => 'Test the re-pasteurized mix for coliforms and total plate count before the batch is released to the freezing tunnel.', role: 'Lab Supervisor', timeline: 'Within 24 h', evidence: 'Lab report' },
    ],
    verification: {
      method: 'One complete validated 69.0°C / 30-minute cycle with interlocked timing, plus two subsequent conforming cycles.',
      criteria: () => 'Continuous temperature ≥69.0°C for the full 30-minute interlocked dwell with no bypass, and coliform / total plate count within specification.',
      evidence: ['Dwell timer certification record', 'Continuous temperature chart', 'Lab release results'],
      notes: 'A dwell completed with the timer manually restarted is not acceptable verification evidence.',
    },
    preventive: [
      { action: 'Make the dwell timer non-restartable and interlocked to a validated temperature sensor, with a hardware start inhibit at low temperature.', role: 'Automation Engineer', dueDays: 30, effectiveness: 'Attempting to start the dwell below 69.0°C is physically blocked and logged.' },
      { action: 'Add jacket condensate trap purge to the automated CIP recipe with a low-flow alarm.', role: 'Process Engineer', dueDays: 21, effectiveness: 'Simulated blocked trap raises the alarm before temperature falls below limit.' },
      { action: 'Add a pre-shift setpoint change log requiring dual QA authorization.', role: 'QA Manager', dueDays: 7, effectiveness: 'Four weeks of authorization records with zero unauthorized changes.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 30, description: 'Re-run the blend vat pasteurization lethality study and update the CCP-2A critical limit basis after the interlock upgrade.' },
    regulatory: '21 CFR 131.130 Frozen Desserts; 21 CFR 117; ISO 22000:2018 Clause 8.5.2'
  },

  'ice_cream:CCP-2B': {
    ownerRole: 'Freezing Supervisor / Refrigeration Engineer',
    capaReference: 'CAPA-ICE-02',
    containment:
      'Emulsion feed pump interlocked off, suction backpressure valve modulated, and the scraped-surface ' +
      'freezer barrel flagged so no warm product is extruded into packaging.',
    disposition: 'HOLD_PENDING_LAB_RELEASE',
    dispositionRationale:
      'Warm extrusion degrades ice crystal structure and allows partial product softening, which can permit ' +
      'post-freeze microbial growth. The batch is held pending texture assessment and microbiological testing.',
    affectedScope: (v, unit, batch) => `All ${batch} extruded while the barrel exit temperature exceeded -3.0°C, plus the first 20 minutes of product after the setpoint was restored.`,
    rootCause: {
      immediate: (v) => `Continuous freezer barrel exit temperature was ${v}°C, above the -3.0°C maximum critical limit.`,
      root: 'Ammonia refrigerant charge was low following an unplanned compressor changeover, and the suction backpressure regulator drifted open, reducing expansion at the evaporator.',
      contributing: [
        'Ammonia charge low after changeover with no low-charge alarm',
        'Backpressure regulator stem wear causing calibration drift',
        'Overrun pump cavitation reducing the scraped-surface heat transfer rate',
        'Barrel wall frost build-up not cleared on schedule',
      ],
      method: '5_whys',
    },
    correction: [
      { title: 'Stop extrusion of warm product', description: () => 'Interlock the emulsion feed pump and hold all product extruded during the excursion. Do not send to the hardening tunnel.', role: 'Freezing Supervisor', timeline: 'Immediate', evidence: 'Hold tag register, line stoppage log' },
      { title: 'Restore refrigeration capacity', description: () => 'Top up the ammonia charge, recalibrate the suction backpressure regulator, and clear the barrel frost layer. Confirm stable barrel exit temperature within ±0.5°C of setpoint.', role: 'Refrigeration Engineer', timeline: 'Within 6 h', evidence: 'Refrigeration service report, barrel temperature trend' },
      { title: 'Assess product quality', description: () => 'Measure hardness and overrun of the held product, and test for total plate count and coliforms. Compare against the frozen dessert specification.', role: 'Lab Supervisor', timeline: 'Within 24 h', evidence: 'Texture analysis report, lab results' },
      { title: 'QA disposition decision', description: () => 'Release if texture and microbiological results conform, otherwise reject the affected extrusion window.', role: 'Ice Cream QA Manager', timeline: 'Within 24 h', evidence: 'Signed disposition record' },
    ],
    verification: {
      method: 'Two consecutive production runs with barrel exit temperature held at setpoint and post-extrusion texture testing.',
      criteria: () => 'Barrel exit ≤-3.0°C (±0.5°C) for the full run, hardness within specification, and microbiological results conforming.',
      evidence: ['Barrel temperature trend (2 runs)', 'Hardness / overrun test data', 'Microbiological report'],
      notes: 'A single conforming run is not sufficient; two consecutive runs are required for verification.',
    },
    preventive: [
      { action: 'Install an ammonia low-charge and high-discharge-pressure alarm on the freezing system with automatic compressor changeover interlock.', role: 'Refrigeration Engineer', dueDays: 30, effectiveness: 'Simulated low charge raises the alarm and forces verified changeover.' },
      { action: 'Add a scheduled barrel frost-clear cycle with a runtime counter alert to the maintenance system.', role: 'Maintenance Planner', dueDays: 14, effectiveness: 'Four weeks of counter data showing every cycle executed within the interval.' },
      { action: 'Include backpressure regulator stroke verification in the quarterly calibration schedule.', role: 'QA Manager', dueDays: 7, effectiveness: 'Calibration certificate on file with stroke deviation within manufacturer tolerance.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 60, description: 'Re-run the barrel exit temperature distribution study across all six extrusion nozzles after the refrigeration overhaul.' },
    regulatory: '21 CFR 131.130; ISO 22000:2018 Clause 8.5.2'
  },

  'ice_cream:CCP-2C': {
    ownerRole: 'Metal Detection QA / Packaging Line Lead',
    capaReference: 'CAPA-ICE-03',
    containment:
      'Pneumatic air-blast reject ram fired, conveyor section stopped, detected tub deflected into the tamper-evident ' +
      'locked collection bin, and a line clearance was performed.',
    disposition: 'REJECT_AFFECTED_LOT',
    dispositionRationale:
      'Physical contamination is a direct hazard with no downstream kill step capable of removing a metal particle. ' +
      'Every unit produced since the last proven-good detection check must be rejected. This is a zero-tolerance CCP.',
    affectedScope: (v, unit, batch) =>
      `All product of ${batch} from the last proven-good detection check up to and including the rejected tub — ` +
      `at conveyor speed 32 fpm this is the material still on the belt plus the upstream infeed accumulation. Detected fragment of ${v}mm retained as evidence.`,
    rootCause: {
      immediate: (v) => `Inline eddy-current sensor detected a ${v}mm stainless steel particle, above the 1.2mm ferrous/non-ferrous critical limit.`,
      root: 'A worn gear-box spacer on the tub filler indexing arm fragmented and released a stainless shard into the product stream.',
      contributing: [
        'Preventive maintenance interval for the filler gear-box exceeded',
        'Eddy-current sensor balance drifted from a prior product change without re-verification',
        'No scheduled metal-fragment screening on the upstream filler wear parts',
        'Reject bin tamper-evident seal check not part of the line clearance routine',
      ],
      method: 'fishbone_ica',
    },
    correction: [
      { title: 'Stop the line and segregate product', description: () => 'Stop the conveyor, apply line clearance, and physically segregate all product from the last proven-good check to the rejected unit into a dedicated quarantine zone.', role: 'Packaging Line Lead', timeline: 'Immediate', evidence: 'Quarantine zone photographs, line clearance record' },
      { title: 'Reclaim and document the fragment', description: () => 'Recover the fragment from locked bin 3, photograph it, weigh it, and log it against the batch. Retain as physical evidence for the investigation.', role: 'Metal Detection QA', timeline: 'Within 2 h', evidence: 'Fragment evidence form with photographs' },
      { title: 'Root cause physical inspection', description: () => 'Strip and inspect the filler indexing arm, gear-box, and all wear surfaces. Identify the exact fracture origin.', role: 'Maintenance Engineer', timeline: 'Within 8 h', evidence: 'Inspection report with failure analysis and photographs' },
      { title: 'Replace the failed component and screen the assembly', description: () => 'Replace the failed part, then metal-screen every adjacent wear component and verify no loose fragments remain in the product path.', role: 'Maintenance Engineer', timeline: 'Within 24 h', evidence: 'Replacement part record, screening log' },
      { title: 'Rebalance and requalify the detector', description: () => 'Rebalance the eddy-current detector for the current product and requalify with ferrous, non-ferrous and stainless test pieces at startup, mid-run and end-of-run.', role: 'Metal Detection QA', timeline: 'Before restart', evidence: 'Detector qualification record with all test-piece results' },
    ],
    verification: {
      method: 'Detector requalification plus a documented three-piece challenge test at startup, first changeover, and every 2 hours.',
      criteria: () => 'All ferrous, non-ferrous and stainless test pieces of 1.2mm (and 2.0mm / 2.5mm where applicable) detected and rejected with 100% detection rate.',
      evidence: ['Detector challenge test log', 'Component replacement record', 'Fragment evidence report', 'Retained sample screening results'],
      notes: 'Detection capability must be re-proven before any held or new product is released.',
    },
    preventive: [
      { action: 'Shorten the filler gear-box preventive maintenance interval and add wear-part condition monitoring.', role: 'Maintenance Planner', dueDays: 14, effectiveness: 'Two completed PM cycles with wear measurements inside tolerance.' },
      { action: 'Require detector rebalance verification at every product changeover, logged automatically.', role: 'Metal Detection QA', dueDays: 7, effectiveness: 'Four weeks of changeover records with zero missing rebalance entries.' },
      { action: 'Implement a metal-fragment screening checklist for all filler wear components during changeover.', role: 'Packaging Line Lead', dueDays: 30, effectiveness: '100% of changeovers carry a signed screening checklist for one month.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 14, description: 'Full requalification of the inline metal detection CCP including challenge-piece sensitivity study at all product speeds.' },
    regulatory: '21 CFR 113.40; HACCP Principles 3 & 5; ISO 22000:2018 Clause 8.5.2'
  },

  /* ============================ BAKERY ============================ */
  'bakery:CCP-3A': {
    ownerRole: 'Master Baker / Bakery QA Manager',
    capaReference: 'CAPA-BAKE-01',
    containment:
      'Tunnel conveyor speed reduced from 2.4 to 2.0 m/min, gas burners in zones 2-4 driven to 100% output, ' +
      'downstream slicer and bagger stopped until lethality is re-established.',
    disposition: 'REWORK_THEN_RELEASE',
    dispositionRationale:
      'A lethality shortfall on baked product is recoverable by re-baking, because the product is a stable, ' +
      'low-moisture matrix and the re-bake adds a further validated lethality step. Re-baking is only permitted once, ' +
      'with total cumulative time-temperature exposure documented.',
    affectedScope: (v, unit, batch) => `All loaves and rolls of ${batch} baked between the last conforming core-temperature check and the ${v}${unit} reading, plus the first three downstream mixing zones.`,
    rootCause: {
      immediate: (v) => `Internal crumb temperature reached only ${v}°C, below the ≥93.0°C lethality target required for the spore reduction claim.`,
      root: 'Zone 3 gas manifold pressure dropped because of a partially blocked burner orifice, so the middle of the tunnel under-heated the product core.',
      contributing: [
        'Burner orifice partially blocked with flour and crumb carbon',
        'Gas manifold regulator diaphragm drift reducing delivered pressure',
        'Conveyor speed creep from a worn drive gearbox',
        'Only one core-temperature probe fitted, positioned at the leading edge of the load',
      ],
      method: 'fishbone_ica',
    },
    correction: [
      { title: 'Hold affected bake and stop the line', description: () => 'Stop the slicer and bagger, hold the affected bake, and prevent the under-lethality loaves from reaching retail packing.', role: 'Bakery QA', timeline: 'Immediate', evidence: 'Pallet hold register' },
      { title: 'Restore the heat zone', description: () => 'Clean or replace the Zone 3 burner orifice, recalibrate the gas manifold regulator, and verify a stable flame pattern across the full zone.', role: 'Maintenance Engineer', timeline: 'Within 4 h', evidence: 'Burner service record, flame photograph' },
      { title: 'Re-establish and confirm lethality', description: (_v, limit) => `Confirm core temperature ≥${limit} across the full load width using probes at the leading edge, centre and trailing edge, at three conveyor positions.`, role: 'Master Baker', timeline: 'Within 4 h', evidence: 'Core temperature matrix record' },
      { title: 'Re-bake the held product', description: () => 'Re-bake the held bake once through a validated lethal cycle, documenting cumulative time-temperature exposure and total cumulative moisture loss.', role: 'Master Baker', timeline: 'Within 24 h', evidence: 'Re-bake batch record with cumulative exposure' },
      { title: 'Quality and micro verification', description: () => 'Verify crumb structure, weight and moisture after re-bake, and run a finished-product microbiological screen on the re-baked lot.', role: 'Bakery QA', timeline: 'Within 48 h', evidence: 'Quality inspection report, lab results' },
    ],
    verification: {
      method: 'Three consecutive conforming bakes with a full core-temperature matrix, plus finished-product results on the re-baked lot.',
      criteria: (limit) => `Core temperature ≥${limit} at every probe position in three consecutive bakes, with acceptable crumb quality and conforming micro results.`,
      evidence: ['Core temperature matrix (3 bakes)', 'Re-bake cumulative exposure record', 'Quality inspection report', 'Microbiological results'],
      notes: 'Re-baked product must not be re-baked a second time; a second failure results in rejection.',
    },
    preventive: [
      { action: 'Add automated burner orifice flame-failure detection to zones 1-4 with interlocked tunnel shutdown.', role: 'Automation Engineer', dueDays: 30, effectiveness: 'Forced flame-out simulation shuts the tunnel down within 3 s.' },
      { action: 'Install three core-temperature probes per tunnel zone (leading, centre, trailing) with continuous trending.', role: 'Controls Engineer', dueDays: 45, effectiveness: 'Continuous trend available for all three positions during validation runs.' },
      { action: 'Add weekly conveyor gearbox speed verification against the 2.0-2.4 m/min setpoint.', role: 'Maintenance Planner', dueDays: 7, effectiveness: 'Four weeks of speed verification records with drift within ±0.05 m/min.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 45, description: 'Re-validate the tunnel lethality zone map and core temperature distribution after the burner and probe upgrades.' },
    regulatory: '21 CFR 113 Subpart B; HACCP Principles 3 & 5; ISO 22000:2018 Clause 8.5.2'
  },

  'bakery:CCP-3B': {
    ownerRole: 'Bakery Production Supervisor / HVAC Engineer',
    capaReference: 'CAPA-BAKE-02',
    containment:
      'Slicer infeed gate blocked, spiral cooling chamber dehumidification boosted, and affected loaves held ' +
      'pending condensation and packaging-integrity assessment.',
    disposition: 'HOLD_PENDING_LAB_RELEASE',
    dispositionRationale:
      'Elevated cooling-chamber ambient temperature risks condensation inside sealed bags, which can create a ' +
      'moisture activity that favours mould growth. Product is held until moisture activity and package seal integrity are confirmed.',
    affectedScope: (v, unit, batch) => `All ${batch} loaves passing through the spiral cooling chamber between the first reading above 24.0°C and the ${v}${unit} peak, together with their already-bagged siblings.`,
    rootCause: {
      immediate: (v) => `Spiral cooling chamber ambient temperature reached ${v}°C, above the 24.0°C maximum, with relative humidity above the 45% setpoint.`,
      root: 'The desiccant dehumidifier rotor regeneration cycle stalled, so the unit could not hold the 45% RH setpoint and the chamber warmed.',
      contributing: [
        'Dehumidifier rotor drive chain failure with no run-hour alarm',
        'Chilled water coil valve stuck at partial stroke',
        'Chamber air balance doors left in a non-standard position after maintenance',
        'No continuous RH trend review in the daily shift handover',
      ],
      method: '5_whys',
    },
    correction: [
      { title: 'Block the slicer and hold product', description: () => 'Block the high-speed slicer infeed, hold all bagged product from the excursion window, and inspect for visible condensation and seal delamination.', role: 'Bakery Production Supervisor', timeline: 'Immediate', evidence: 'Hold register, inspection photographs' },
      { title: 'Restore chamber environmental control', description: () => 'Repair the dehumidifier rotor drive, service the chilled water coil valve, and restore the standard chamber air balance damper positions.', role: 'HVAC Engineer', timeline: 'Within 6 h', evidence: 'Maintenance record, restored damper position sheet' },
      { title: 'Re-establish temperature and humidity', description: () => `Run the chamber until both temperature ≤24.0°C and relative humidity ≤45% are stable, then confirm on the independent reference hygrometer.`, role: 'HVAC Engineer', timeline: 'Within 8 h', evidence: 'Independent hygrometer comparison, chamber trend' },
      { title: 'Product quality and moisture assessment', description: () => 'Measure water activity inside the sealed bag and verify package seal integrity across the held pallets.', role: 'Bakery QA', timeline: 'Within 24 h', evidence: 'Water activity results, seal integrity test report' },
    ],
    verification: {
      method: '72-hour continuous chamber mapping with independent logger plus water activity and seal integrity testing.',
      criteria: () => 'Chamber temperature ≤24.0°C and RH ≤45% continuously for 72 h, water activity below the specification limit in all samples, and no seal failures.',
      evidence: ['Independent 72 h logger download', 'Water activity report', 'Seal integrity test report'],
      notes: 'Any water activity result above specification results in rejection of the affected pallet.',
    },
    preventive: [
      { action: 'Add dehumidifier rotor run-hour monitoring with a stall alarm and automatic backup unit start.', role: 'Automation Engineer', dueDays: 30, effectiveness: 'Simulated rotor stall raises the alarm and starts the backup within 30 s.' },
      { action: 'Interlock the high-speed slicer infeed to the chamber humidity sensor so the line cannot run above 45% RH.', role: 'Automation Engineer', dueDays: 21, effectiveness: 'Forced high humidity blocks slicer infeed and logs the event.' },
      { action: 'Add chamber temperature and RH to the daily shift handover checklist with sign-off.', role: 'Production Supervisor', dueDays: 7, effectiveness: 'Four weeks of signed handover records with zero missing entries.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 30, description: 'Re-map the spiral cooling chamber thermal and humidity profile after the dehumidifier repair and revalidate the 24.0°C / 45% RH critical limits.' },
    regulatory: '21 CFR 117 Subpart B; ISO 22000:2018 Clause 8.5.3'
  },

  'bakery:CCP-3C': {
    ownerRole: 'Metal Detection QA / Bakery Maintenance Lead',
    capaReference: 'CAPA-BAKE-03',
    containment:
      'Drop-flap reject gate dropped, conveyor stopped, the affected loaf routed to the isolation chute, ' +
      'and blade-fragment hazard warning issued to all operators.',
    disposition: 'REJECT_AFFECTED_LOT',
    dispositionRationale:
      'A metal fragment from a slicer blade is a serious physical hazard and cannot be removed by any subsequent ' +
      'process step. All product back to the last proven-good detection check is rejected and the slicer is taken out of service.',
    affectedScope: (v, unit, batch) => `All ${batch} loaves sliced since the last proven-good detection check. At 1.8 m/s belt speed this covers the full product accumulation between the check point and the reject gate, including product still inside the slicer infeed.`,
    rootCause: {
      immediate: (v) => `Detector reported a ${v}mm ferrous reading, above the 1.0mm critical limit for the sliced-bread line.`,
      root: 'The high-speed slicer blade had a chip along its cutting edge that fractured under load and released a ferrous fragment into the product stream.',
      contributing: [
        'Blade change interval exceeded with no chip inspection criterion',
        'Detector sensitivity set for the whole-loaf product but not re-verified after the blade change',
        'No magnetic pre-separation stage upstream of the slicer',
        'Slicer blade balance not verified after the last regrind',
      ],
      method: '5_whys',
    },
    correction: [
      { title: 'Stop the slicer and isolate the product', description: () => 'Stop the slicer, apply line clearance, and move all product since the last proven-good check to the quarantine bay with hold tags.', role: 'Bakery Production Supervisor', timeline: 'Immediate', evidence: 'Quarantine register, line clearance record' },
      { title: 'Recover and document the fragment', description: () => 'Recover the ferrous fragment from the reject chute, photograph and weigh it, and log it against the batch as retained evidence.', role: 'Metal Detection QA', timeline: 'Within 2 h', evidence: 'Fragment evidence form' },
      { title: 'Take the slicer out of service and inspect', description: () => 'Lock out the slicer, remove the blade, and inspect the cutting edge, shaft and guard for fragmentation or secondary damage.', role: 'Bakery Maintenance Lead', timeline: 'Within 8 h', evidence: 'Lockout record, blade inspection report with photographs' },
      { title: 'Replace the blade and inspect the assembly', description: () => 'Install a new blade with verified balance, inspect all guards and fasteners for secondary fragments, and metal-screen the product path.', role: 'Bakery Maintenance Lead', timeline: 'Within 24 h', evidence: 'Blade replacement and balance record, screening checklist' },
      { title: 'Requalify the detector before restart', description: () => 'Rebalance for sliced-bread product and requalify with 1.0mm and 2.0mm ferrous and non-ferrous test pieces at startup, mid-run and end-of-run.', role: 'Metal Detection QA', timeline: 'Before restart', evidence: 'Detector qualification record with test-piece results' },
    ],
    verification: {
      method: 'Detector requalification plus a documented challenge-test schedule and post-maintenance verification of the new blade.',
      criteria: () => '100% detection of 1.0mm ferrous, non-ferrous and stainless test pieces across all product speeds, with zero bypass events.',
      evidence: ['Detector challenge test log', 'Blade balance certificate', 'Fragment evidence report', 'Screening checklist'],
      notes: 'The slicer must not return to production until both the blade and detector qualifications are complete.',
    },
    preventive: [
      { action: 'Introduce a blade chip-inspection criterion and change the blade on condition rather than on fixed hours only.', role: 'Bakery Maintenance Lead', dueDays: 14, effectiveness: 'Documented chip inspection at every changeover for four weeks with no chip found in service.' },
      { action: 'Add a secondary magnetic separation stage upstream of the slicer to capture ferrous debris before product is cut.', role: 'Process Engineer', dueDays: 60, effectiveness: 'Commissioning test detects introduced ferrous test pieces with 100% capture.' },
      { action: 'Add an automatic blade-hour counter that raises a warning at 80% of the change interval.', role: 'Automation Engineer', dueDays: 30, effectiveness: 'Counter warning appears in the PLC and SCADA at the configured threshold.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 14, description: 'Full requalification of the sliced-bread metal detection CCP after blade replacement and addition of the upstream magnetic stage.' },
    regulatory: 'HACCP Principles 3 & 5; ISO 22000:2018 Clause 8.5.2'
  },

  /* ============================ RTE DELI MEATS ============================ */
  'meat:CCP-4A': {
    ownerRole: 'Ready-to-Eat QA Manager / Smokehouse Supervisor',
    capaReference: 'CAPA-MEAT-01',
    containment:
      'Smokehouse doors pneumatically interlocked and sealed, RTE packaging line stopped, and the cycle ' +
      'placed on hold so no sub-lethality product can be labelled ready-to-eat.',
    disposition: 'REPROCESS_THEN_RELEASE',
    dispositionRationale:
      'Ready-to-eat meat that did not reach the required lethality cannot be released as RTE. It must be ' +
      're-cooked to the full validated time/temperature standard, or rejected if the cumulative abuse already ' +
      'exceeded the safe-while-incomplete limit.',
    affectedScope: (v, unit, batch) => `100% of ${batch} processed in the affected smokehouse cycle, plus all RTE WIP staged downstream. Held in the smokehouse hold bay pending re-cook decision.`,
    rootCause: {
      immediate: (v) => `Internal core temperature reached only ${v}°C, below the 74.0°C mandatory lethality standard for ready-to-eat meats.`,
      root: 'Smokehouse steam injection was insufficient because the humidity generator output had fallen after a scale build-up, and the core probe that should have extended the cycle was not interlocked to the dwell timer.',
      contributing: [
        'Steam generator scale build-up reducing humidification output',
        'Core probe not wired to extend the dwell timer on low temperature',
        'Air balance in the chamber pulling heat away from the load centre',
        'Load density higher than the validated thermal-mass profile',
      ],
      method: 'fault_tree',
    },
    correction: [
      { title: 'Seal and hold the cycle', description: () => 'Maintain the door interlock seal, tag the cycle hold in the QA system, and physically hold all RTE product from the affected cycle.', role: 'Smokehouse Supervisor', timeline: 'Immediate', evidence: 'Cycle hold tag register' },
      { title: 'Correct the thermal process', description: () => 'Descale the steam generator, restore full humidification output, and verify chamber air balance and load placement against the validated profile.', role: 'Maintenance Engineer', timeline: 'Within 4 h', evidence: 'Descaling record, humidifier output verification' },
      { title: 'Re-cook the affected product', description: (_v, limit) => `Re-cook the held product to ≥${limit}°C core for the full validated dwell, with the core probe now interlocked to extend the timer rather than terminate the cycle.`, role: 'RTE QA Manager', timeline: 'Within 8 h', evidence: 'Re-cook cycle record with interlocked core temperature chart' },
      { title: 'Cumulative abuse assessment', description: () => 'QA microbiologist confirms the pre-re-cook time-temperature history remained within the safe window for incomplete cooking; otherwise reject the lot.', role: 'QA Microbiological Lead', timeline: 'Within 24 h', evidence: 'Cumulative abuse assessment report' },
      { title: 'Finished product release testing', description: () => 'Test the re-cooked lot for Salmonella (n=5, 375g) and Listeria monocytogenes per the RTE sampling plan before release.', role: 'Lab Supervisor', timeline: 'Within 5 days', evidence: 'Accredited lab RTE test report' },
    ],
    verification: {
      method: 'Three consecutive cycles with interlocked core temperature control, plus the RTE pathogen test panel on the re-cooked lot.',
      criteria: (limit) => `Core temperature ≥${limit}°C maintained for the validated dwell in three consecutive cycles with no manual override, and all RTE pathogen tests conforming.`,
      evidence: ['Interlocked core temperature charts (3 cycles)', 'RTE pathogen test report', 'Cumulative abuse assessment'],
      notes: 'RTE product may not be released on temperature evidence alone; pathogen testing is mandatory.',
    },
    preventive: [
      { action: 'Interlock the core temperature probe to the dwell timer so a low reading extends the cycle instead of ending it.', role: 'Automation Engineer', dueDays: 30, effectiveness: 'Forced low core reading automatically extends the cycle and logs the event.' },
      { action: 'Add automated steam generator scale detection with a descaling alert at defined water hardness limits.', role: 'Maintenance Engineer', dueDays: 45, effectiveness: 'Alert fires during a simulated high-hardness cycle before output degrades.' },
      { action: 'Enforce validated load density and placement with an in-chamber load pattern guide and pre-op check.', role: 'Smokehouse Supervisor', dueDays: 7, effectiveness: 'Four weeks of pre-operational load checks with zero deviations.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 30, description: 'Re-validate the smokehouse lethality cycle including a worst-case load thermal distribution study after the interlock upgrade.' },
    regulatory: 'USDA FSIS 9 CFR 417; FDA 21 CFR 117; HACCP Principles 3 & 5; ISO 22000:2018 Clause 8.5.2'
  },

  'meat:CCP-4B': {
    ownerRole: 'Ready-to-Eat QA Manager / Blast Chill Supervisor',
    capaReference: 'CAPA-MEAT-02',
    containment:
      'Cryogenic N2 manifold at maximum flow, batch moved to the dedicated hold chiller, hold tag applied with a ' +
      'strict 6-hour clock from the start of cooking.',
    disposition: 'HOLD_PENDING_LAB_RELEASE',
    dispositionRationale:
      'A stabilization shortfall risks germination and toxin production by Clostridium perfringens. The batch is held ' +
      'and requires negative laboratory results before release; the 2-hour/4-hour rule is documented in the disposition.',
    affectedScope: (v, unit, batch) => `100% of ${batch} in the blast chill cell from the end of cooking to the ${v}°C stabilization reading, plus all downstream RTE packaging WIP.`,
    rootCause: {
      immediate: (v) => `Product core was still at ${v}°C after the stabilization period, exceeding the ≤4.4°C limit within 6 hours.`,
      root: 'The blast chiller fan array was running at reduced output because two fans had tripped on a door-open interlock left asserted after an interrupted loading cycle.',
      contributing: [
        'Door interlock not reset after an interrupted load, silently derating the chiller',
        'Load entered above the validated 65°C entry temperature, exceeding chiller capacity',
        'N2 manifold flow not verified at commissioning after the last retrofit',
        'No continuous 6-hour stabilization clock display for the operator',
      ],
      method: 'fault_tree',
    },
    correction: [
      { title: 'Maximise chilling and start the clock', description: () => 'Open the N2 manifold to maximum flow, place the batch in the dedicated hold chiller, and record the end-of-cook time to start the 6-hour stabilization clock.', role: 'Blast Chill Supervisor', timeline: 'Immediate', evidence: 'Hold tag with recorded clock start time' },
      { title: 'Restore chiller capacity', description: () => 'Reset the door interlock, return all six fans to full output, and verify the N2 manifold delivered flow against the commissioning specification.', role: 'Maintenance Engineer', timeline: 'Within 4 h', evidence: 'Chiller performance verification, N2 flow measurement' },
      { title: 'Complete the stabilization curve', description: () => `Drive the product to ≤4.4°C and confirm the 54°C to 4.4°C transition was achieved within 6 hours from the recorded clock start.`, role: 'Blast Chill Supervisor', timeline: 'Within 6 h', evidence: 'Continuous core temperature curve' },
      { title: 'Microbiological release testing', description: () => 'Test the held batch for Clostridium perfringens and total plate count. Any positive result results in rejection.', role: 'Lab Supervisor', timeline: 'Within 24 h', evidence: 'Accredited lab report' },
    ],
    verification: {
      method: 'Documented core temperature curve demonstrating 54°C to ≤4.4°C within 6 hours, plus conforming microbiological results.',
      criteria: () => 'Complete 54°C to ≤4.4°C transition within 6 hours on the recorded curve, and C. perfringens / total plate count within specification.',
      evidence: ['Core temperature curve', 'Chiller performance verification', 'Microbiological report'],
      notes: 'A conforming temperature curve is not sufficient on its own; microbiological results are required for release.',
    },
    preventive: [
      { action: 'Add an interlock-reset prompt and a loud derate alarm whenever any blast chiller fan trips.', role: 'Automation Engineer', dueDays: 21, effectiveness: 'Forced fan trip raises the alarm and blocks cycle start until all fans are verified.' },
      { action: 'Display a live 6-hour stabilization countdown timer at the blast chill cell for the operator.', role: 'Controls Engineer', dueDays: 30, effectiveness: 'Timer visible and accurate to ±5 s during validation.' },
      { action: 'Verify N2 manifold delivered flow at every planned maintenance shutdown.', role: 'Maintenance Engineer', dueDays: 14, effectiveness: 'Flow measurement records within specification for three consecutive shutdowns.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 30, description: 'Re-validate the blast chill stabilization profile at worst-case load density and maximum entry temperature.' },
    regulatory: 'USDA FSIS 9 CFR 417; HACCP Principles 3 & 5; ISO 22000:2018 Clause 8.5.2'
  },

  'meat:CCP-4C': {
    ownerRole: 'Packaging Supervisor / QA Packaging Technician',
    capaReference: 'CAPA-MEAT-03',
    containment:
      'Sealing jaws retracted, thermoformer head auto-cycled, defective packages ejected before case packing, ' +
      'and all affected cartons held pending re-pack decision.',
    disposition: 'REPACK_THEN_RELEASE',
    dispositionRationale:
      'Excess residual oxygen in RTE packaging promotes lipid oxidation and allows aerobic spoilage organisms to grow. ' +
      'The product itself is unaffected, so affected packages may be re-flushed and re-sealed, then re-tested for residual oxygen and seal integrity.',
    affectedScope: (v, unit, batch) => `All ${batch} packages produced during the affected flush period, typically the production window between the last good residual-oxygen check and the ${v}% reading, plus the first 30 minutes of the following case-pack operation.`,
    rootCause: {
      immediate: (v) => `Residual oxygen measured ${v}%, above the 0.5% maximum critical limit for RTE packaging.`,
      root: 'The nitrogen flush ratio drifted because the gas mixing servo was operating with a partially obstructed restrictor orifice, delivering an incorrect N2/CO2 ratio under flow.',
      contributing: [
        'Restrictor orifice partially obstructed by seal oil residue',
        'Flush flow not interlocked to package fill volume',
        'Residual oxygen sensor not in the automated check routine',
        'No automatic calibration trigger on gas composition change',
      ],
      method: 'fishbone_ica',
    },
    correction: [
      { title: 'Stop and hold affected packages', description: () => 'Retract the sealing jaws, eject defective packages, and hold all cartons from the affected flush period in the QA hold bay.', role: 'Packaging Supervisor', timeline: 'Immediate', evidence: 'Carton hold register' },
      { title: 'Correct the gas flush system', description: () => 'Clean or replace the restrictor orifice, recalibrate the mixing servo against a certified reference gas, and verify delivered N2/CO2 ratio at production flow.', role: 'Maintenance Engineer', timeline: 'Within 4 h', evidence: 'Service record, calibration certificate, flow verification' },
      { title: 'Verify residual oxygen control', description: () => 'Run a verification pack and test residual oxygen on every 10th package across the pack, requiring all results ≤0.5%.', role: 'QA Packaging Technician', timeline: 'Within 8 h', evidence: 'Residual oxygen test series with instrument printout' },
      { title: 'Re-pack the held product', description: () => 'Open, re-flush and re-seal the held packages under the corrected settings, then re-test residual oxygen and seal integrity on each case.', role: 'Packaging Line Lead', timeline: 'Within 24 h', evidence: 'Re-pack batch record, re-test results' },
    ],
    verification: {
      method: 'Residual oxygen testing series on verification and re-packed product, plus seal integrity testing.',
      criteria: () => 'Residual oxygen ≤0.5% in 100% of tested packages across the pack, and seal integrity passing on all re-packed cases.',
      evidence: ['Residual oxygen test series', 'Gas calibration certificate', 'Seal integrity test report', 'Re-pack batch record'],
      notes: 'Any single residual oxygen result above 0.5% stops the line and repeats the investigation.',
    },
    preventive: [
      { action: 'Interlock package fill volume to the flush flow so gas delivery matches the pack format automatically.', role: 'Automation Engineer', dueDays: 45, effectiveness: 'Format change test shows the flush flow adjusts and residual oxygen stays within limit.' },
      { action: 'Add the residual oxygen sensor to the automated in-line check routine with an automatic reject at 0.5%.', role: 'QA Packaging Technician', dueDays: 30, effectiveness: 'Simulated high oxygen package is auto-rejected and logged.' },
      { action: 'Add a gas composition changeover trigger to force sensor recalibration.', role: 'Process Engineer', dueDays: 21, effectiveness: 'Forced changeover event raises the recalibration prompt and blocks restart until acknowledged.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 45, description: 'Re-validate residual oxygen control across all pack formats after the gas flush system correction.' },
    regulatory: 'FDA 21 CFR 117 Subpart B; HACCP Principle 3 & 5; ISO 22000:2018 Clause 8.5.2'
  }
};

/** Generic fallback for any CCP without a bespoke playbook (keeps the workflow total). */
function genericPlaybook(ccpCode: string, ccpName: string, unit: string, hazard: string): Playbook {
  return {
    ownerRole: 'HACCP Team Leader / QA Manager',
    capaReference: `CAPA-${ccpCode.replace(/[^A-Za-z0-9]/g, '')}-GEN`,
    containment: `Automatic interlock engaged for ${ccpName}. The affected batch is stopped, segregated and hold-tagged pending QA investigation.`,
    disposition: 'HOLD_PENDING_LAB_RELEASE',
    dispositionRationale: `A deviation from the ${ccpName} critical limit has been detected. Because the hazard (${hazard}) cannot be assessed as negligible without data, the batch is held pending investigation and analytical results.`,
    affectedScope: (v, u, batch) => `100% of ${batch} produced from the last conforming ${ccpName} check up to this ${v}${u} reading.`,
    rootCause: {
      immediate: (v) => `${ccpName} measured ${v}${unit}, outside its validated critical limits.`,
      root: `Loss of control of the ${ccpName} process step; detailed root cause analysis is required to confirm the systemic failure mode.`,
      contributing: ['Equipment degradation', 'Operator technique deviation', 'Environmental parameter drift', 'Preventive maintenance gap'],
      method: '5_whys',
    },
    correction: [
      { title: 'Contain and hold', description: () => 'Isolate the affected product, stop the process step, and notify the HACCP team leader.', role: 'Line Operator', timeline: 'Immediate', evidence: 'Hold tag register' },
      { title: 'Restore control of the process', description: () => `Adjust and re-establish the ${ccpName} critical limit, then confirm with an independent verification measurement.`, role: 'Process Engineer', timeline: 'Within 4 h', evidence: 'Independent verification record' },
      { title: 'Disposition the affected batch', description: () => 'QA reviews the excursion and analytical data, then issues a written release or rejection decision.', role: 'QA Manager', timeline: 'Within 24 h', evidence: 'Signed disposition decision' },
    ],
    verification: {
      method: 'Three consecutive conforming measurements of the critical limit plus finished-product analytical results.',
      criteria: () => `All consecutive measurements within the ${ccpName} critical limits with conforming analytical results.`,
      evidence: ['Verification measurement series', 'Analytical laboratory report'],
      notes: 'Verification requires objective evidence, not operator confirmation alone.',
    },
    preventive: [
      { action: `Strengthen monitoring and preventive maintenance for ${ccpName}.`, role: 'Maintenance Lead', dueDays: 30, effectiveness: 'Two completed PM cycles with parameters inside tolerance.' },
      { action: 'Retrain operators on the critical limit and monitoring frequency for this CCP.', role: 'QA Manager', dueDays: 14, effectiveness: '100% operator competency sign-off for all shifts.' },
    ],
    revalidation: { status: 'scheduled', dueDays: 30, description: `Revalidate the ${ccpName} critical limits after corrective action implementation.` },
    regulatory: 'Codex Alimentarius General Principles of Food Hygiene; HACCP Principles 3 & 5; ISO 22000:2018 Clause 8.5.2'
  };
}

export function buildResolution(params: {
  planId: string;
  ccp: { ccp_code: string; ccp_name: string; process_stage: string; lower_limit: number; upper_limit: number; unit_of_measure: string; hazard_type: string };
  recordedValue: number;
  batchNumber: string;
  inspectorName: string;
  deviationTimestamp: string;
}): ResolutionRecord {
  const { planId, ccp, recordedValue, batchNumber, inspectorName, deviationTimestamp } = params;

  const key = `${planId}:${ccp.ccp_code}`;
  const playbook = PLAYBOOKS[key] ?? genericPlaybook(ccp.ccp_code, ccp.ccp_name, ccp.unit_of_measure, ccp.hazard_type);

  const limit = `${ccp.lower_limit} - ${ccp.upper_limit}${ccp.unit_of_measure}`;
  const deviationStatus: DeviationStatus =
    playbook.disposition === 'REJECT_AFFECTED_LOT' ? 'PRODUCT_REJECTED' : 'OPEN_INVESTIGATION';

  const correctiveActionSteps: ResolutionStep[] = playbook.correction.map((c, i) => ({
    step: i + 1,
    phase:
      i === 0 ? 'Immediate containment & correction'
      : i < 2 ? 'Process correction'
      : 'Disposition & release decision',
    title: c.title,
    description: c.description(recordedValue, limit),
    responsible_role: c.role,
    timeline: c.timeline,
    evidence_required: c.evidence,
    status: 'in_progress' as const,
  }));

  return {
    plan_id: planId,
    ccp_code: ccp.ccp_code,
    ccp_name: ccp.ccp_name,
    process_stage: ccp.process_stage,
    hazard_type: ccp.hazard_type,
    unit_of_measure: ccp.unit_of_measure,
    critical_limit: limit,
    recorded_value: recordedValue,
    batch_number: batchNumber,
    deviation_status: deviationStatus,
    product_disposition: playbook.disposition,
    disposition_rationale: playbook.dispositionRationale,
    affected_product_scope: playbook.affectedScope(recordedValue, ccp.unit_of_measure, batchNumber),
    immediate_containment: playbook.containment,
    root_cause_analysis: {
      immediate_cause: playbook.rootCause.immediate(recordedValue),
      root_cause: playbook.rootCause.root,
      contributing_factors: playbook.rootCause.contributing,
      analysis_method: playbook.rootCause.method,
      analyzed_by: `${playbook.ownerRole} (investigation raised by ${inspectorName})`,
      analyzed_at: deviationTimestamp,
    },
    corrective_action_steps: correctiveActionSteps,
    verification_record: {
      verification_method: playbook.verification.method,
      acceptance_criteria: playbook.verification.criteria(limit),
      verification_result: 'conditional',
      verified_by: playbook.ownerRole,
      verified_at: hoursFromNow(24),
      evidence_documents: playbook.verification.evidence,
      notes: playbook.verification.notes,
    },
    preventive_actions: playbook.preventive.map((p) => ({
      action: p.action,
      responsible_role: p.role,
      target_date: daysFromNow(p.dueDays),
      status: 'planned' as const,
      effectiveness_check: p.effectiveness,
    })),
    revalidation_status: playbook.revalidation.status,
    revalidation_date: daysFromNow(playbook.revalidation.dueDays),
    capa_reference: playbook.capaReference,
    owner_role: playbook.ownerRole,
    regulatory_reference: playbook.regulatory,
    opened_at: deviationTimestamp,
    closed_at: null,
    closure_authorized_by: null,
  };
}

export const RESOLUTION_PHASE_LABELS: { status: DeviationStatus; label: string; description: string }[] = [
  { status: 'OPEN_INVESTIGATION', label: 'Deviation Opened', description: 'Critical limit breach recorded and HACCP team notified.' },
  { status: 'CONTAINED', label: 'Product Contained', description: 'Affected product isolated, stopped and hold-tagged.' },
  { status: 'CORRECTED', label: 'Process Corrected', description: 'Critical limit re-established and correction verified.' },
  { status: 'VERIFIED', label: 'Effectiveness Verified', description: 'Verification monitoring and evidence confirm the correction worked.' },
  { status: 'CLOSED', label: 'Deviation Closed', description: 'Preventive actions raised, plan revalidated and QA sign-off recorded.' },
  { status: 'PRODUCT_REJECTED', label: 'Product Rejected', description: 'Affected lot rejected; deviation closed under the rejection pathway.' },
];
