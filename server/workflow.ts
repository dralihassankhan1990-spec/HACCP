import { db } from './db';
import { buildResolution, ResolutionRecord } from './resolution';

export interface CCPRecord {
  id: number;
  plan_id?: string;
  ccp_code: string;
  ccp_name: string;
  process_stage: string;
  lower_limit: number;
  upper_limit: number;
  unit_of_measure: string;
  hazard_type: string;
  protocol_context: string;
  actuator_id?: string;
  actuator_name?: string;
}

export interface AuditLogRecord {
  id: number;
  ccp_id: number;
  inspector_name: string;
  recorded_value: number;
  status: 'PASS' | 'FAIL';
  timestamp: string;
  comments: string;
  batch_number: string;
  plan_id?: string;
}

export interface CorrectiveActionResult {
  id: number;
  audit_log_id: number;
  action_triggered: string;
  script_execution_status: 'Executed' | 'Failed';
  resolution_notes: string;
  scada_telemetry: string;
  logged_at: string;
  /** Full HACCP Principle 5 deviation-resolution package (stored in corrective_actions.resolution_data). */
  resolution: ResolutionRecord;
  /** Row id of the persistent resolution_records record. */
  resolution_record_id: number;
}

/**
 * Executes industrial corrective action automation workflow upon CCP threshold breach.
 * Simulates industrial SCADA PLC hardware tripping, batch quarantine, and automated alert dispatch.
 */
export async function executeCorrectiveActionWorkflow(
  auditLog: AuditLogRecord,
  ccp: CCPRecord
): Promise<CorrectiveActionResult> {
  const loggedAt = new Date().toISOString();
  const batchRef = auditLog.batch_number || 'BATCH-UNKNOWN';

  let actionTriggered = '';
  let resolutionNotes = '';
  let scadaTelemetry = '';

  switch (ccp.ccp_code) {
    // --- FLUID MILK & DAIRY PROCESSING (HACCP-PLAN-MILK) ---
    case 'CCP-1A':
      actionTriggered = `CRITICAL FAILURE: Diverter valve automatically tripped. ${batchRef} redirected to raw milk tank for re-processing. Automated alert dispatched to plant director.`;
      resolutionNotes = `Divert valve switch confirmed OPEN at flow divert station #3. Plant SCADA logged 3-way solenoid actuation in 180ms. Thermal hold tube dump initiated. ${batchRef} locked in holding silo B-4. Quality Assurance Notification Sent (SMTP/MQTT: id#QA-EMERGENCY-${auditLog.id}).`;
      scadaTelemetry = JSON.stringify({
        actuator: 'FDV-301-SOLENOID',
        actuator_name: '3-Way Sanitary Flow Divert Valve',
        valve_position: 'DIVERT_ACTIVE',
        holding_tube_temp: `${auditLog.recorded_value}°C`,
        threshold_target: `${ccp.lower_limit}°C`,
        divert_latency_ms: 184,
        quarantine_tank: 'SILO_RAW_RECYCLE_B4',
        alert_status: 'DISPATCHED_TO_DIRECTOR',
        iso_clause: 'ISO 22000:2018 Clause 8.9.2 - Control of nonconformities'
      });
      break;

    case 'CCP-1B':
      actionTriggered = `CIP SANITATION INTERLOCK: Caustic loop temperature deficit. Clean-in-Place cycle aborted. Automated chemical dosing valve opened.`;
      resolutionNotes = `Caustic wash temperature of ${auditLog.recorded_value}°C breached minimum 65.0°C requirement for milkstone and biofilm eradication. CIP skid paused recirculation timer. Steam injection booster valve opened to restore 75°C target.`;
      scadaTelemetry = JSON.stringify({
        actuator: 'CIP-DOSING-V2',
        actuator_name: 'Caustic Injection Modulator',
        cip_state: 'PAUSED_RECIRCULATION',
        current_temp: `${auditLog.recorded_value}°C`,
        required_temp: '≥ 65.0°C',
        booster_solenoid: 'STEAM_INJECT_100%',
        alert_status: 'NOTIFIED_SANITATION_LEAD'
      });
      break;

    case 'CCP-1C':
      actionTriggered = `COLD CHAIN EXCURSION: Finished storage silo exceeded 4.0°C. Secondary ammonia glycol booster chiller auto-engaged. Outflow valve locked.`;
      resolutionNotes = `Silo 4 temperature reached ${auditLog.recorded_value}°C. Automated safety interlock locked out packaging line feed pump. Glycol circulation pump speed ramped to 60Hz. Hold tag placed on ${batchRef}.`;
      scadaTelemetry = JSON.stringify({
        actuator: 'GLYCOL-CHILLER-B4',
        actuator_name: 'Ammonia Glycol Secondary Chiller',
        pump_hertz: 60,
        silo_id: 'SILO_4_PASTEURIZED',
        recorded_temp: `${auditLog.recorded_value}°C`,
        feed_pump_status: 'LOCKED_OUT',
        alert_status: 'DISPATCHED_TO_REFRIGERATION_CREW'
      });
      break;

    // --- INDUSTRIAL ICE CREAM & FROZEN DESSERT (HACCP-PLAN-ICE) ---
    case 'CCP-2A':
      actionTriggered = `MIX VAT LETHALITY HAZARD: Vat pasteurization dwell aborted. Steam jacket pressure increased to 3.5 bar. Batch hold timer reset.`;
      resolutionNotes = `Thermal probe detected ${auditLog.recorded_value}°C, below 69.0°C requirement. Continuous agitator speed held at 45 RPM. 30-minute regulatory dwell timer reset to zero under FDA dairy rules.`;
      scadaTelemetry = JSON.stringify({
        actuator: 'STEAM-VAT-REG-1',
        actuator_name: 'Pneumatic Steam Inflow Regulator',
        steam_pressure_bar: 3.5,
        recorded_temp: `${auditLog.recorded_value}°C`,
        target_temp: '≥ 69.0°C',
        vat_id: 'BLEND_VAT_01',
        timer_status: 'RESET_TO_0_MIN',
        alert_status: 'DISPATCHED_TO_ICE_CREAM_OPERATOR'
      });
      break;

    case 'CCP-2B':
      actionTriggered = `FREEZING TEMPERATURE BREACH: Scraped surface freezer exit temperature too warm. Feed pump halted. Freon suction valve modulated.`;
      resolutionNotes = `Continuous freezer exit was ${auditLog.recorded_value}°C (threshold: max -3.0°C). Emulsion pump stopped to avoid slush packaging and ice recrystallization. Suction pressure dropped by 0.4 bar.`;
      scadaTelemetry = JSON.stringify({
        actuator: 'FREON-BACKPRESSURE-V1',
        actuator_name: 'Suction Backpressure Regulator',
        suction_delta_bar: -0.4,
        barrel_temp: `${auditLog.recorded_value}°C`,
        emulsion_feed_pump: 'INTERLOCKED_OFF',
        alert_status: 'DISPATCHED_TO_FREEZING_SPECIALIST'
      });
      break;

    case 'CCP-2C':
      actionTriggered = `CRITICAL PHYSICAL HAZARD: Metal detection threshold breached. High-speed pneumatic air blast reject ram actuated. Conveyor section stopped.`;
      resolutionNotes = `Inline eddy-current sensor triggered at ${auditLog.recorded_value}mm (critical limit: 1.2mm). Pneumatic blast ram fired in 32ms. Contaminated tub deflected into tamper-evident locked stainless collection bin #3. 10 consecutive packages quarantined.`;
      scadaTelemetry = JSON.stringify({
        actuator: 'AIRBLAST-RAM-03',
        actuator_name: 'High-Speed Air Blast Rejection Ram',
        reject_latency_ms: 32,
        detected_signal_mm: auditLog.recorded_value,
        threshold_max_mm: ccp.upper_limit,
        containment_bin: 'LOCKED_BIN_03',
        belt_speed_fpm: 0,
        alert_status: 'LINE_STOP_CALL_QA'
      });
      break;

    // --- COMMERCIAL BAKERY & EXTRUDED BREAD (HACCP-PLAN-BAKE) ---
    case 'CCP-3A':
      actionTriggered = `LETHALITY DEFICIT: Tunnel oven core bake temperature under limit. Inverter slowed conveyor speed by 15%. Direct gas burners boosted to 100%.`;
      resolutionNotes = `Internal crumb temperature of ${auditLog.recorded_value}°C is insufficient for 6-log Bacillus cereus spore eradication. Convection tunnel speed automatically adjusted from 2.4 m/min to 2.0 m/min to extend baking dwell time.`;
      scadaTelemetry = JSON.stringify({
        actuator: 'BURNER-ZONE-MOD-SV9',
        actuator_name: 'Gas Burner Modulation Inverter',
        tunnel_speed_adjusted: '2.0 m/min',
        burner_output_pct: 100,
        recorded_temp: `${auditLog.recorded_value}°C`,
        target_temp: '≥ 93.0°C',
        alert_status: 'NOTIFIED_HEAD_BAKER'
      });
      break;

    case 'CCP-3B':
      actionTriggered = `HEPA COOLING EXCURSION: Spiral cooling chamber above 24.0°C. Desiccant air handler dehumidification boosted. Slicer intake halted.`;
      resolutionNotes = `Ambient air in spiral cooler reached ${auditLog.recorded_value}°C. Condensation risk flagged. Infeed to high-speed slicer paused to avoid moisture condensation inside bread bags.`;
      scadaTelemetry = JSON.stringify({
        actuator: 'DEHUMIDIFIER-DAH-1',
        actuator_name: 'Cleanroom Desiccant Dehumidifier',
        recorded_temp: `${auditLog.recorded_value}°C`,
        max_allowed_temp: '24.0°C',
        rh_setpoint_pct: 45,
        slicer_feed_gate: 'BLOCKED',
        alert_status: 'DISPATCHED_TO_HVAC_TEAM'
      });
      break;

    case 'CCP-3C':
      actionTriggered = `BLADE FRAGMENT DETECTED: Slicer metal detector triggered. Pneumatic drop-flap reject gate opened. Bread loaf quarantined.`;
      resolutionNotes = `Ferrous reading of ${auditLog.recorded_value}mm exceeds 1.0mm critical limit. Drop-flap mechanism actuated in 28ms. Loaf routed to isolation chute. High-speed slicer blade inspection alarm dispatched.`;
      scadaTelemetry = JSON.stringify({
        actuator: 'FLIPPER-GATE-02',
        actuator_name: 'Drop-Flap Conveyor Rejector',
        gate_status: 'DROPPED',
        actuation_ms: 28,
        detected_ferrous_mm: auditLog.recorded_value,
        threshold_limit_mm: 1.0,
        alert_status: 'MAINTENANCE_BLADE_CHECK_REQUIRED'
      });
      break;

    // --- READY-TO-EAT DELI MEATS (HACCP-PLAN-MEAT) ---
    case 'CCP-4A':
      actionTriggered = `USDA LETHALITY VIOLATION: Smokehouse thermal core temperature breached. Hold door interlock locked. Steam injection cycle initiated.`;
      resolutionNotes = `Internal core meat probe registered ${auditLog.recorded_value}°C, breaching mandatory 74.0°C standard. Pneumatic door locks engaged. 15-minute auxiliary steam dwell cycle activated to achieve certified 7-log Salmonella lethality.`;
      scadaTelemetry = JSON.stringify({
        actuator: 'SMOKEHOUSE-DAMPER-LOCK',
        actuator_name: 'Thermal Hold Door Interlock',
        door_lock_status: 'INTERLOCKED_SEALED',
        recorded_core_temp: `${auditLog.recorded_value}°C`,
        target_core_temp: '74.0°C',
        extended_dwell_min: 15,
        alert_status: 'USDA_INSPECTOR_LOGGED'
      });
      break;

    case 'CCP-4B':
      actionTriggered = `STABILIZATION CHILL EXCURSION: Rapid blast chill lag detected. Liquid nitrogen injection booster fired at maximum flow.`;
      resolutionNotes = `Core temperature was ${auditLog.recorded_value}°C, exceeding stabilization limit of 4.4°C. Cryogenic N2 manifold opened to halt Clostridium perfringens toxin incubation. ${batchRef} tagged for hold & release testing.`;
      scadaTelemetry = JSON.stringify({
        actuator: 'CRYO-N2-BOOSTER-SV1',
        actuator_name: 'Cryogenic Liquid N2 Injection Nozzle',
        n2_flow_rate_lpm: 120,
        recorded_chill_temp: `${auditLog.recorded_value}°C`,
        stabilization_target: '≤ 4.4°C within 6h',
        batch_hold_tag: 'HOLD_CLOSTRIDIUM_VERIFICATION',
        alert_status: 'DISPATCHED_TO_QA_DIRECTOR'
      });
      break;

    case 'CCP-4C':
      actionTriggered = `MODIFIED ATMOSPHERE FAILURE: Packaging residual oxygen above 0.5%. Sealing jaws retracted. Gas flushing manifold pressure elevated.`;
      resolutionNotes = `O2 sensor read ${auditLog.recorded_value}% (critical limit: 0.5%). Thermoformer packaging head auto-cycled. Defective packages rejected prior to case boxing. Nitrogen flush ratio re-metered.`;
      scadaTelemetry = JSON.stringify({
        actuator: 'GAS-FLUSH-SERVO-04',
        actuator_name: 'N2/CO2 Gas Mixture Metering Servo',
        residual_o2_pct: auditLog.recorded_value,
        threshold_max_pct: 0.5,
        jaw_status: 'RETRACTED',
        flushing_ratio: '80% N2 / 20% CO2',
        alert_status: 'DISPATCHED_TO_PACKAGING_TECH'
      });
      break;

    default:
      actionTriggered = `HAZARD ALERT: Process excursion detected for ${ccp.ccp_name}. Automated interlock engaged. ${batchRef} quarantined pending QA investigation.`;
      resolutionNotes = `Automatic shutdown sequence completed. QA manager notified. Root cause investigation initiated under HACCP Principle 5.`;
      scadaTelemetry = JSON.stringify({
        actuator: ccp.actuator_id || 'GENERIC_SAFETY_INTERLOCK',
        actuator_name: ccp.actuator_name || 'Safety Interlock',
        status: 'INTERLOCKED',
        recorded: auditLog.recorded_value,
        limits: [ccp.lower_limit, ccp.upper_limit]
      });
  }

  // Build the full HACCP deviation-resolution package for this specific CCP
  const resolution = buildResolution({
    planId: auditLog.plan_id || ccp.plan_id || 'unknown',
    ccp: {
      ccp_code: ccp.ccp_code,
      ccp_name: ccp.ccp_name,
      process_stage: ccp.process_stage,
      lower_limit: ccp.lower_limit,
      upper_limit: ccp.upper_limit,
      unit_of_measure: ccp.unit_of_measure,
      hazard_type: ccp.hazard_type
    },
    recordedValue: auditLog.recorded_value,
    batchNumber: batchRef,
    inspectorName: auditLog.inspector_name,
    deviationTimestamp: loggedAt
  });

  // Insert record into corrective_actions table
  const insertStmt = db.prepare(`
    INSERT INTO corrective_actions (
      audit_log_id, action_triggered, script_execution_status, resolution_notes, scada_telemetry, logged_at, resolution_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    auditLog.id,
    actionTriggered,
    'Executed',
    resolutionNotes,
    scadaTelemetry,
    loggedAt,
    JSON.stringify(resolution)
  );

  const correctiveActionId = Number(result.lastInsertRowid);

  // Persist the resolution as a first-class, closable deviation record
  const insertResolution = db.prepare(`
    INSERT INTO resolution_records (
      corrective_action_id, audit_log_id, ccp_code, ccp_name, plan_id, hazard_type,
      product_disposition, disposition_rationale, affected_product_scope,
      root_cause_analysis, corrective_action_steps, verification_record, preventive_actions,
      revalidation_status, deviation_status, owner_role, opened_at, revalidation_date, capa_reference, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const resolutionResult = insertResolution.run(
    correctiveActionId,
    auditLog.id,
    ccp.ccp_code,
    ccp.ccp_name,
    resolution.plan_id,
    ccp.hazard_type,
    resolution.product_disposition,
    resolution.disposition_rationale,
    resolution.affected_product_scope,
    JSON.stringify(resolution.root_cause_analysis),
    JSON.stringify(resolution.corrective_action_steps),
    JSON.stringify(resolution.verification_record),
    JSON.stringify(resolution.preventive_actions),
    resolution.revalidation_status,
    resolution.deviation_status,
    resolution.owner_role,
    resolution.opened_at,
    resolution.revalidation_date,
    resolution.capa_reference,
    loggedAt
  );

  return {
    id: correctiveActionId,
    audit_log_id: auditLog.id,
    action_triggered: actionTriggered,
    script_execution_status: 'Executed',
    resolution_notes: resolutionNotes,
    scada_telemetry: scadaTelemetry,
    logged_at: loggedAt,
    resolution,
    resolution_record_id: Number(resolutionResult.lastInsertRowid)
  };
}
