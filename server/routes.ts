import express from 'express';
import { db, seedBaselineAudits } from './db';
import { executeCorrectiveActionWorkflow, CCPRecord, AuditLogRecord } from './workflow';

export const apiRouter = express.Router();

// GET /api/plans - All Industrial HACCP Plans (Milk, Ice Cream, Bakery, RTE Meat)
apiRouter.get('/plans', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM haccp_plans ORDER BY id ASC');
    const rows = stmt.all() as any[];
    const plans = rows.map((p) => ({
      ...p,
      schematic_nodes: safeParseJson(p.schematic_nodes)
    }));
    res.json({ success: true, plans });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ccps - Critical Control Points (optionally filtered by plan_id)
apiRouter.get('/ccps', (req, res) => {
  try {
    const planId = req.query.plan_id as string | undefined;
    let stmt;
    if (planId) {
      stmt = db.prepare('SELECT * FROM critical_control_points WHERE plan_id = ? ORDER BY id ASC');
      const ccps = stmt.all(planId) as unknown as CCPRecord[];
      return res.json({ success: true, ccps });
    } else {
      stmt = db.prepare('SELECT * FROM critical_control_points ORDER BY id ASC');
      const ccps = stmt.all() as unknown as CCPRecord[];
      return res.json({ success: true, ccps });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/stats - Compliance metrics (global or by plan)
apiRouter.get('/stats', (req, res) => {
  try {
    const planId = req.query.plan_id as string | undefined;

    let totalStmt, passStmt, failStmt, actionsStmt, openStmt, closedStmt;

    if (planId) {
      totalStmt = db.prepare(`
        SELECT COUNT(a.id) as total
        FROM audit_logs a
        JOIN critical_control_points c ON a.ccp_id = c.id
        WHERE c.plan_id = ?
      `);
      passStmt = db.prepare(`
        SELECT COUNT(a.id) as passCount
        FROM audit_logs a
        JOIN critical_control_points c ON a.ccp_id = c.id
        WHERE c.plan_id = ? AND a.status = 'PASS'
      `);
      failStmt = db.prepare(`
        SELECT COUNT(a.id) as failCount
        FROM audit_logs a
        JOIN critical_control_points c ON a.ccp_id = c.id
        WHERE c.plan_id = ? AND a.status = 'FAIL'
      `);
      actionsStmt = db.prepare(`
        SELECT COUNT(ca.id) as actionCount
        FROM corrective_actions ca
        JOIN audit_logs a ON ca.audit_log_id = a.id
        JOIN critical_control_points c ON a.ccp_id = c.id
        WHERE c.plan_id = ? AND ca.script_execution_status = 'Executed'
      `);
      // Unresolved deviations: still under investigation / not yet closed
      openStmt = db.prepare(`
        SELECT COUNT(rr.id) as openCount
        FROM resolution_records rr
        WHERE rr.plan_id = ?
          AND rr.deviation_status NOT IN ('CLOSED', 'PRODUCT_REJECTED')
      `);
      closedStmt = db.prepare(`
        SELECT COUNT(rr.id) as closedCount
        FROM resolution_records rr
        WHERE rr.plan_id = ? AND rr.deviation_status IN ('CLOSED', 'PRODUCT_REJECTED')
      `);
    } else {
      totalStmt = db.prepare('SELECT COUNT(*) as total FROM audit_logs');
      passStmt = db.prepare("SELECT COUNT(*) as passCount FROM audit_logs WHERE status = 'PASS'");
      failStmt = db.prepare("SELECT COUNT(*) as failCount FROM audit_logs WHERE status = 'FAIL'");
      actionsStmt = db.prepare("SELECT COUNT(*) as actionCount FROM corrective_actions WHERE script_execution_status = 'Executed'");
      openStmt = db.prepare(`
        SELECT COUNT(*) as openCount FROM resolution_records
        WHERE deviation_status NOT IN ('CLOSED', 'PRODUCT_REJECTED')
      `);
      closedStmt = db.prepare(`
        SELECT COUNT(*) as closedCount FROM resolution_records
        WHERE deviation_status IN ('CLOSED', 'PRODUCT_REJECTED')
      `);
    }

    // Bind the plan filter only when the statement actually has a placeholder
    const run = (stmt: any): any => (planId ? stmt.get(planId) : stmt.get());

    const total = run(totalStmt).total as number;
    const passCount = run(passStmt).passCount as number;
    const failCount = run(failStmt).failCount as number;
    const actionCount = run(actionsStmt).actionCount as number;
    const openDeviations = run(openStmt).openCount as number;
    const closedDeviations = run(closedStmt).closedCount as number;

    // Compliance rate counts only the current shift window
    const complianceRate = total > 0 ? Math.round((passCount / total) * 100) : 100;

    // Shift status is driven by UNRESOLVED deviations, so the red state clears
    // automatically once every deviation has been corrected, verified and closed.
    const shiftStatus: 'NORMAL' | 'ATTENTION' | 'CRITICAL' =
      openDeviations === 0 ? 'NORMAL' : openDeviations > 1 ? 'CRITICAL' : 'ATTENTION';

    return res.json({
      success: true,
      stats: {
        totalLogs: total,
        passCount,
        failCount,
        complianceRate,
        shiftStatus,
        // Historical breaches (retained for the immutable audit trail)
        totalDeviations: failCount,
        // Live, actionable breaches — drives the red alert state
        activeCriticalBreaks: openDeviations,
        openDeviations,
        closedDeviations,
        automatedActionsExecuted: actionCount
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/audit/submit - Real-Time Regulatory Validation & Corrective Automation
apiRouter.post('/audit/submit', async (req, res) => {
  try {
    const { ccp_id, inspector_name, recorded_value, comments, batch_number } = req.body;

    if (!ccp_id || recorded_value === undefined || !inspector_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: ccp_id, inspector_name, and recorded_value are mandatory.'
      });
    }

    const numValue = parseFloat(recorded_value);
    if (isNaN(numValue)) {
      return res.status(400).json({
        success: false,
        error: 'Recorded value must be a valid number.'
      });
    }

    // Fetch the target CCP
    const ccpStmt = db.prepare('SELECT * FROM critical_control_points WHERE id = ?');
    const ccp = ccpStmt.get(Number(ccp_id)) as unknown as CCPRecord | undefined;

    if (!ccp) {
      return res.status(404).json({ success: false, error: 'Specified Critical Control Point not found.' });
    }

    // Regulatory Threshold Validation (HACCP Principle 3: Establish Critical Limits)
    const isWithinLimits = numValue >= ccp.lower_limit && numValue <= ccp.upper_limit;
    const status: 'PASS' | 'FAIL' = isWithinLimits ? 'PASS' : 'FAIL';
    const timestamp = new Date().toISOString();
    const batch = (batch_number && String(batch_number).trim()) || 'BATCH-402';
    const inspector = String(inspector_name).trim();
    const sanitizedComments = comments ? String(comments).trim() : '';

    // Insert into audit_logs table
    const insertAuditStmt = db.prepare(`
      INSERT INTO audit_logs (ccp_id, inspector_name, recorded_value, status, timestamp, comments, batch_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const auditResult = insertAuditStmt.run(
      ccp.id,
      inspector,
      numValue,
      status,
      timestamp,
      sanitizedComments,
      batch
    );

    const auditLog: AuditLogRecord = {
      id: Number(auditResult.lastInsertRowid),
      ccp_id: ccp.id,
      inspector_name: inspector,
      recorded_value: numValue,
      status,
      timestamp,
      comments: sanitizedComments,
      batch_number: batch,
      plan_id: ccp.plan_id
    };

    let correctiveAction = null;

    // Trigger automated corrective action workflow if limit breached
    if (status === 'FAIL') {
      correctiveAction = await executeCorrectiveActionWorkflow(auditLog, ccp);
    }

    res.json({
      success: true,
      auditLog: {
        ...auditLog,
        plan_id: ccp.plan_id,
        ccp_name: ccp.ccp_name,
        ccp_code: ccp.ccp_code,
        process_stage: ccp.process_stage,
        unit_of_measure: ccp.unit_of_measure,
        lower_limit: ccp.lower_limit,
        upper_limit: ccp.upper_limit,
        actuator_id: ccp.actuator_id,
        actuator_name: ccp.actuator_name
      },
      correctiveAction,
      status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/audit-trail - Joined chronological compliance ledger (optional plan_id filter)
apiRouter.get('/audit-trail', (req, res) => {
  try {
    const planId = req.query.plan_id as string | undefined;
    let stmt;

    const baseSql = `
      SELECT 
        a.id,
        a.ccp_id,
        a.inspector_name,
        a.recorded_value,
        a.status,
        a.timestamp,
        a.comments,
        a.batch_number,
        c.plan_id,
        c.ccp_code,
        c.ccp_name,
        c.process_stage,
        c.lower_limit,
        c.upper_limit,
        c.unit_of_measure,
        c.hazard_type,
        c.protocol_context,
        c.actuator_id,
        c.actuator_name,
        ca.id as corrective_action_id,
        ca.action_triggered,
        ca.script_execution_status,
        ca.resolution_notes,
        ca.scada_telemetry,
        ca.logged_at as action_logged_at,
        ca.resolution_data,
        rr.id as resolution_record_id,
        rr.deviation_status,
        rr.product_disposition,
        rr.disposition_rationale,
        rr.affected_product_scope,
        rr.root_cause_analysis,
        rr.corrective_action_steps,
        rr.verification_record,
        rr.preventive_actions,
        rr.revalidation_status,
        rr.revalidation_date,
        rr.capa_reference,
        rr.owner_role,
        rr.opened_at,
        rr.closure_authorized_by,
        rr.closed_at
      FROM audit_logs a
      INNER JOIN critical_control_points c ON a.ccp_id = c.id
      LEFT JOIN corrective_actions ca ON ca.audit_log_id = a.id
      LEFT JOIN resolution_records rr ON rr.corrective_action_id = ca.id
    `;

    const hydrate = (r: any) => ({
      ...r,
      scada_telemetry: r.scada_telemetry ? safeParseJson(r.scada_telemetry) : null,
      root_cause_analysis: r.root_cause_analysis ? safeParseJson(r.root_cause_analysis) : null,
      corrective_action_steps: r.corrective_action_steps ? safeParseJson(r.corrective_action_steps) : null,
      verification_record: r.verification_record ? safeParseJson(r.verification_record) : null,
      preventive_actions: r.preventive_actions ? safeParseJson(r.preventive_actions) : null,
      resolution_data: r.resolution_data ? safeParseJson(r.resolution_data) : null
    });

    if (planId) {
      stmt = db.prepare(`${baseSql} WHERE c.plan_id = ? ORDER BY a.id DESC`);
      const rows = stmt.all(planId) as any[];
      return res.json({ success: true, ledger: rows.map(hydrate) });
    } else {
      stmt = db.prepare(`${baseSql} ORDER BY a.id DESC`);
      const rows = stmt.all() as any[];
      return res.json({ success: true, ledger: rows.map(hydrate) });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/resolutions - Full HACCP deviation-resolution packages (optionally filtered)
apiRouter.get('/resolutions', (req, res) => {
  try {
    const planId = req.query.plan_id as string | undefined;
    const stmt = planId
      ? db.prepare('SELECT * FROM resolution_records WHERE plan_id = ? ORDER BY id DESC')
      : db.prepare('SELECT * FROM resolution_records ORDER BY id DESC');
    const rows = (planId ? stmt.all(planId) : stmt.all()) as any[];

    const resolutions = rows.map((r) => ({
      ...r,
      root_cause_analysis: r.root_cause_analysis ? safeParseJson(r.root_cause_analysis) : null,
      corrective_action_steps: r.corrective_action_steps ? safeParseJson(r.corrective_action_steps) : null,
      verification_record: r.verification_record ? safeParseJson(r.verification_record) : null,
      preventive_actions: r.preventive_actions ? safeParseJson(r.preventive_actions) : null
    }));

    const isOpen = (r: any) => r.deviation_status !== 'CLOSED' && r.deviation_status !== 'PRODUCT_REJECTED';

    const summary = {
      total: resolutions.length,
      open: resolutions.filter(isOpen).length,
      rejected: resolutions.filter((r) => r.deviation_status === 'PRODUCT_REJECTED').length,
      closed: resolutions.filter((r) => r.deviation_status === 'CLOSED').length
    };

    // Active alert feed: only unresolved deviations keep the red alert alive
    const activeAlerts = resolutions
      .filter(isOpen)
      .map((r) => {
        const steps: any[] = r.corrective_action_steps || [];
        return {
          resolution_record_id: r.id,
          audit_log_id: r.audit_log_id,
          ccp_code: r.ccp_code,
          ccp_name: r.ccp_name,
          plan_id: r.plan_id,
          batch_number: r.batch_number,
          recorded_value: r.recorded_value,
          critical_limit: r.critical_limit,
          unit_of_measure: r.unit_of_measure,
          hazard_type: r.hazard_type,
          deviation_status: r.deviation_status,
          product_disposition: r.product_disposition,
          owner_role: r.owner_role,
          capa_reference: r.capa_reference,
          opened_at: r.opened_at,
          revalidation_status: r.revalidation_status,
          completed_steps: steps.filter((s) => s.status === 'completed' || s.status === 'verified').length,
          total_steps: steps.length
        };
      });

    res.json({ success: true, resolutions, summary, activeAlerts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/resolutions/:id/status - Advance or close a deviation (Principle 5 closure)
apiRouter.patch('/resolutions/:id/status', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { deviation_status, closure_authorized_by, verification_result, notes } = req.body || {};

    const valid = ['OPEN_INVESTIGATION', 'CONTAINED', 'CORRECTED', 'VERIFIED', 'CLOSED', 'PRODUCT_REJECTED'];
    if (deviation_status && !valid.includes(deviation_status)) {
      return res.status(400).json({ success: false, error: `Invalid deviation_status. Expected one of: ${valid.join(', ')}` });
    }

    const existing = db.prepare('SELECT * FROM resolution_records WHERE id = ?').get(id) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Resolution record not found.' });
    }

    const isClosing = deviation_status === 'CLOSED';
    if (isClosing && !closure_authorized_by) {
      return res.status(400).json({
        success: false,
        error: 'A named QA closure authorization is required before a deviation can be closed (ISO 22000 Clause 8.5.2).'
      });
    }

    let verification = existing.verification_record ? safeParseJson(existing.verification_record) : null;
    if (verification_result && verification) {
      verification = {
        ...verification,
        verification_result,
        verified_at: new Date().toISOString(),
        notes: notes || verification.notes
      };
    }

    const nextStatus = deviation_status || existing.deviation_status;
    const revalidationStatus = nextStatus === 'CLOSED' ? 'completed' : existing.revalidation_status;

    db.prepare(`
      UPDATE resolution_records
      SET deviation_status = ?,
          verification_record = ?,
          revalidation_status = ?,
          closure_authorized_by = ?,
          closed_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      nextStatus,
      verification ? JSON.stringify(verification) : existing.verification_record,
      revalidationStatus,
      closure_authorized_by || existing.closure_authorized_by,
      isClosing ? new Date().toISOString() : existing.closed_at,
      new Date().toISOString(),
      id
    );

    // Keep corrective_actions.resolution_data in sync for the audit ledger
    if (existing.corrective_action_id) {
      const resolutionData = db
        .prepare('SELECT resolution_data FROM corrective_actions WHERE id = ?')
        .get(existing.corrective_action_id) as any;
      if (resolutionData?.resolution_data) {
        const parsed = safeParseJson(resolutionData.resolution_data);
        if (parsed && typeof parsed === 'object') {
          parsed.deviation_status = nextStatus;
          parsed.revalidation_status = revalidationStatus;
          parsed.closure_authorized_by = closure_authorized_by || parsed.closure_authorized_by;
          parsed.closed_at = isClosing ? new Date().toISOString() : parsed.closed_at;
          if (verification) parsed.verification_record = verification;
          db.prepare('UPDATE corrective_actions SET resolution_data = ? WHERE id = ?')
            .run(JSON.stringify(parsed), existing.corrective_action_id);
        }
      }
    }

    const updated = db.prepare('SELECT * FROM resolution_records WHERE id = ?').get(id) as any;
    res.json({
      success: true,
      resolution: {
        ...updated,
        root_cause_analysis: updated.root_cause_analysis ? safeParseJson(updated.root_cause_analysis) : null,
        corrective_action_steps: updated.corrective_action_steps ? safeParseJson(updated.corrective_action_steps) : null,
        verification_record: updated.verification_record ? safeParseJson(updated.verification_record) : null,
        preventive_actions: updated.preventive_actions ? safeParseJson(updated.preventive_actions) : null
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Shared handler for simulating realistic test scenarios
const handleSimulateTestScenario = async (req: express.Request, res: express.Response) => {
  try {
    const { plan_id, ccp_code } = req.body || {};
    const targetCode = ccp_code || (plan_id === 'ice_cream' ? 'CCP-2C' : plan_id === 'bakery' ? 'CCP-3A' : plan_id === 'meat' ? 'CCP-4A' : 'CCP-1A');

    const ccpStmt = db.prepare('SELECT * FROM critical_control_points WHERE ccp_code = ?');
    const ccp = ccpStmt.get(targetCode) as unknown as CCPRecord | undefined;

    if (!ccp) {
      return res.status(404).json({ success: false, error: `CCP ${targetCode} not found.` });
    }

    let recordedValue = 68.5;
    let inspectorName = 'John Doe (Shift Lead)';
    let comments = 'Steam valve pressure fluctuated briefly during batch #402.';
    let batchNumber = 'BATCH-402';

    if (ccp.ccp_code === 'CCP-1A') {
      recordedValue = 68.5; // Below 72.0°C
      inspectorName = 'John Doe (Shift Lead)';
      comments = 'Steam valve pressure fluctuated briefly during batch #402.';
      batchNumber = 'BATCH-402';
    } else if (ccp.ccp_code === 'CCP-2C') {
      recordedValue = 2.1; // Above 1.2mm limit
      inspectorName = 'Marcus Vance (Lead Freezing Tech)';
      comments = 'Inline metal sentry triggered on Tub #892. Stainless steel particle detected.';
      batchNumber = 'BATCH-IC-89';
    } else if (ccp.ccp_code === 'CCP-3A') {
      recordedValue = 88.0; // Below 93.0°C
      inspectorName = 'Elena Rostova (Master Baker)';
      comments = 'Tunnel burner Zone 3 gas pressure dropped. Crumb temperature under lethality limit.';
      batchNumber = 'BATCH-BK-512';
    } else if (ccp.ccp_code === 'CCP-4A') {
      recordedValue = 71.2; // Below 74.0°C
      inspectorName = 'David Miller (Lead Operator)';
      comments = 'Internal core probe read 71.2°C at cycle conclusion. Fails USDA 74.0°C standard.';
      batchNumber = 'BATCH-MT-104';
    }

    const timestamp = new Date().toISOString();

    const insertAuditStmt = db.prepare(`
      INSERT INTO audit_logs (ccp_id, inspector_name, recorded_value, status, timestamp, comments, batch_number)
      VALUES (?, ?, ?, 'FAIL', ?, ?, ?)
    `);

    const result = insertAuditStmt.run(
      ccp.id,
      inspectorName,
      recordedValue,
      timestamp,
      comments,
      batchNumber
    );

    const auditLog: AuditLogRecord = {
      id: Number(result.lastInsertRowid),
      ccp_id: ccp.id,
      inspector_name: inspectorName,
      recorded_value: recordedValue,
      status: 'FAIL',
      timestamp,
      comments,
      batch_number: batchNumber,
      plan_id: ccp.plan_id
    };

    const correctiveAction = await executeCorrectiveActionWorkflow(auditLog, ccp);

    res.json({
      success: true,
      message: `Simulated realistic failure scenario on ${ccp.ccp_name}.`,
      auditLog: {
        ...auditLog,
        plan_id: ccp.plan_id,
        ccp_name: ccp.ccp_name,
        ccp_code: ccp.ccp_code,
        process_stage: ccp.process_stage,
        unit_of_measure: ccp.unit_of_measure,
        lower_limit: ccp.lower_limit,
        upper_limit: ccp.upper_limit,
        actuator_id: ccp.actuator_id,
        actuator_name: ccp.actuator_name
      },
      correctiveAction
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};

apiRouter.post('/audit/simulate-test-scenario', handleSimulateTestScenario);
apiRouter.post('/api/audit/simulate-test-scenario', handleSimulateTestScenario);

// POST /api/audit/stream-iot - Generate real-time live telemetry stream reading
apiRouter.post('/audit/stream-iot', async (req, res) => {
  try {
    const { ccp_id } = req.body;
    const ccpStmt = db.prepare('SELECT * FROM critical_control_points WHERE id = ?');
    const ccp = ccpStmt.get(Number(ccp_id || 1)) as unknown as CCPRecord;

    if (!ccp) {
      return res.status(404).json({ success: false, error: 'CCP not found' });
    }

    // Generate slight variation within nominal range (90% chance pass, 10% chance slight excursion)
    const isPassing = Math.random() > 0.15;
    let reading: number;
    if (isPassing) {
      const range = ccp.upper_limit - ccp.lower_limit;
      reading = Number((ccp.lower_limit + range * (0.3 + Math.random() * 0.4)).toFixed(1));
    } else {
      // Excursion
      reading = Number((ccp.lower_limit - 1.5 - Math.random() * 2).toFixed(1));
    }

    const status: 'PASS' | 'FAIL' = reading >= ccp.lower_limit && reading <= ccp.upper_limit ? 'PASS' : 'FAIL';
    const timestamp = new Date().toISOString();
    const batch = 'IOT-STREAM-' + Math.floor(100 + Math.random() * 900);

    const insertAuditStmt = db.prepare(`
      INSERT INTO audit_logs (ccp_id, inspector_name, recorded_value, status, timestamp, comments, batch_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertAuditStmt.run(
      ccp.id,
      'SCADA IoT Stream Agent',
      reading,
      status,
      timestamp,
      `Continuous telemetry sample via calibrated RTD probe [Actuator: ${ccp.actuator_id || 'AUTO'}].`,
      batch
    );

    const auditLog: AuditLogRecord = {
      id: Number(result.lastInsertRowid),
      ccp_id: ccp.id,
      inspector_name: 'SCADA IoT Stream Agent',
      recorded_value: reading,
      status,
      timestamp,
      comments: 'Continuous automated telemetry',
      batch_number: batch,
      plan_id: ccp.plan_id
    };

    let correctiveAction = null;
    if (status === 'FAIL') {
      correctiveAction = await executeCorrectiveActionWorkflow(auditLog, ccp);
    }

    res.json({
      success: true,
      auditLog,
      correctiveAction,
      status
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/audit/reset - Reset and re-seed baseline shift state
apiRouter.post('/audit/reset', (req, res) => {
  try {
    db.exec('DELETE FROM corrective_actions;');
    db.exec('DELETE FROM audit_logs;');
    seedBaselineAudits();
    res.json({ success: true, message: 'Audit ledger reset to clean initial baseline shift.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

function safeParseJson(str: any) {
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
