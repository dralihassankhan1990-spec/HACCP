import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'haccp_shield.sqlite');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance and integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  // 1. HACCP Plans Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS haccp_plans (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      facility_line TEXT NOT NULL,
      regulatory_standard TEXT NOT NULL,
      description TEXT NOT NULL,
      active_batch_default TEXT NOT NULL,
      schematic_nodes TEXT NOT NULL
    );
  `);

  // 2. Critical Control Points (CCPs) Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS critical_control_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id TEXT NOT NULL,
      ccp_code TEXT UNIQUE NOT NULL,
      ccp_name TEXT NOT NULL,
      process_stage TEXT NOT NULL,
      lower_limit REAL NOT NULL,
      upper_limit REAL NOT NULL,
      unit_of_measure TEXT NOT NULL,
      hazard_type TEXT NOT NULL,
      protocol_context TEXT NOT NULL,
      actuator_id TEXT NOT NULL,
      actuator_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES haccp_plans (id) ON DELETE CASCADE
    );
  `);

  // 3. Audit Logs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ccp_id INTEGER NOT NULL,
      inspector_name TEXT NOT NULL,
      recorded_value REAL NOT NULL,
      status TEXT CHECK(status IN ('PASS', 'FAIL')) NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      comments TEXT,
      batch_number TEXT NOT NULL,
      FOREIGN KEY (ccp_id) REFERENCES critical_control_points (id) ON DELETE CASCADE
    );
  `);

  // 4. Corrective Actions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS corrective_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_log_id INTEGER NOT NULL,
      action_triggered TEXT NOT NULL,
      script_execution_status TEXT CHECK(script_execution_status IN ('Executed', 'Failed', 'Pending')) NOT NULL,
      resolution_notes TEXT,
      scada_telemetry TEXT,
      logged_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (audit_log_id) REFERENCES audit_logs (id) ON DELETE CASCADE
    );
  `);

  // 5. Resolution Records Table (HACCP Principle 5 deviation closure workflow)
  db.exec(`
    CREATE TABLE IF NOT EXISTS resolution_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      corrective_action_id INTEGER NOT NULL,
      audit_log_id INTEGER NOT NULL,
      ccp_code TEXT NOT NULL,
      ccp_name TEXT NOT NULL,
      plan_id TEXT,
      hazard_type TEXT,
      product_disposition TEXT NOT NULL,
      disposition_rationale TEXT,
      affected_product_scope TEXT,
      root_cause_analysis TEXT,
      corrective_action_steps TEXT,
      verification_record TEXT,
      preventive_actions TEXT,
      revalidation_status TEXT DEFAULT 'pending',
      deviation_status TEXT DEFAULT 'OPEN_INVESTIGATION' CHECK(deviation_status IN (
        'OPEN_INVESTIGATION','CONTAINED','CORRECTED','VERIFIED','CLOSED','PRODUCT_REJECTED'
      )),
      owner_role TEXT,
      opened_at TEXT DEFAULT CURRENT_TIMESTAMP,
      revalidation_date TEXT,
      closure_authorized_by TEXT,
      closed_at TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(corrective_action_id),
      FOREIGN KEY (corrective_action_id) REFERENCES corrective_actions (id) ON DELETE CASCADE,
      FOREIGN KEY (audit_log_id) REFERENCES audit_logs (id) ON DELETE CASCADE
    );
  `);

  // Backfill migration: add resolution_data JSON column to corrective_actions
  const correctiveActionColumns = db.prepare('PRAGMA table_info(corrective_actions)').all() as any[];
  if (!correctiveActionColumns.some((c) => c.name === 'resolution_data')) {
    db.exec('ALTER TABLE corrective_actions ADD COLUMN resolution_data TEXT;');
  }

  const resolutionColumns = db.prepare('PRAGMA table_info(resolution_records)').all() as any[];
  if (!resolutionColumns.some((c) => c.name === 'capa_reference')) {
    db.exec('ALTER TABLE resolution_records ADD COLUMN capa_reference TEXT;');
  }

  seedHaccpPlansAndCcps();
}

function seedHaccpPlansAndCcps() {
  // Check if plans exist
  const planCountStmt = db.prepare('SELECT COUNT(*) as count FROM haccp_plans');
  const planCount = (planCountStmt.get() as { count: number }).count;

  if (planCount === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO haccp_plans (id, title, category, facility_line, regulatory_standard, description, active_batch_default, schematic_nodes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Plan 1: Fluid Milk & Dairy Processing
    insertPlan.run(
      'milk',
      'Fluid Milk & HTST Dairy Processing',
      'Dairy & Liquid Food',
      'Line 1 - High Velocity HTST Thermal Unit',
      'FDA Grade "A" Pasteurized Milk Ordinance (PMO) & ISO 22000:2018',
      'Automated high-temperature short-time pasteurization line for whole and skim milk with sanitary divert interlocks.',
      'BATCH-402',
      JSON.stringify([
        { id: 'intake', label: 'Raw Milk Intake', status: 'normal', temp: '3.8°C' },
        { id: 'balance', label: 'Constant Level Tank', status: 'normal' },
        { id: 'regen', label: 'Regenerative Pre-Heat', status: 'normal', temp: '58.0°C' },
        { id: 'ccp1', label: 'HTST Hold Tube [CCP-1A]', status: 'active', isCcp: true, ccpCode: 'CCP-1A' },
        { id: 'divert', label: '3-Way Flow Divert Valve', status: 'normal', isActuator: true, actuatorId: 'FDV-301-SOLENOID' },
        { id: 'chiller', label: 'Aseptic Plate Cooler', status: 'normal', temp: '2.5°C' },
        { id: 'packaging', label: 'Sterile Cartoning Line', status: 'normal' }
      ])
    );

    // Plan 2: Industrial Ice Cream & Frozen Dairy
    insertPlan.run(
      'ice_cream',
      'Industrial Ice Cream & Frozen Dessert',
      'Frozen Dairy & Confectionery',
      'Line 3 - Scraped Surface Cryo-Extrusion',
      'Codex Alimentarius CXC 57 & ISO 22000 Dairy Safety Standard',
      'Multi-stage emulsion mixing, vat holding, high-overrun scraped surface continuous freezing, and in-line metal detection.',
      'BATCH-IC-89',
      JSON.stringify([
        { id: 'blend', label: 'Cream & Sugar Blend', status: 'normal' },
        { id: 'vat_ccp', label: 'Vat Pasteurizer [CCP-2A]', status: 'active', isCcp: true, ccpCode: 'CCP-2A' },
        { id: 'homo', label: '2-Stage Homogenizer', status: 'normal', pressure: '220 bar' },
        { id: 'age', label: 'Aging Tank (4°C)', status: 'normal' },
        { id: 'freezer_ccp', label: 'Continuous Freezer [CCP-2B]', status: 'active', isCcp: true, ccpCode: 'CCP-2B' },
        { id: 'xray_ccp', label: 'Inline Metal/X-Ray [CCP-2C]', status: 'active', isCcp: true, ccpCode: 'CCP-2C' },
        { id: 'hardening', label: '-30°C Hardening Tunnel', status: 'normal' }
      ])
    );

    // Plan 3: Commercial Bakery & Extruded Bread
    insertPlan.run(
      'bakery',
      'Commercial High-Speed Bakery & Extrusion',
      'Grains & Baked Goods',
      'Line 2 - 40M Direct Gas-Fired Tunnel Oven',
      'AIB International Consolidated Standards & ISO 22000 Hazard Controls',
      'Continuous high-volume dough fermentation, traveling tunnel oven lethality verification, spiral HEPA cooling, and blade fragment screening.',
      'BATCH-BK-512',
      JSON.stringify([
        { id: 'mixing', label: 'Continuous Spiral Mixer', status: 'normal' },
        { id: 'proofer', label: 'Humidity Proofer (38°C)', status: 'normal' },
        { id: 'oven_ccp', label: 'Tunnel Oven Lethality [CCP-3A]', status: 'active', isCcp: true, ccpCode: 'CCP-3A' },
        { id: 'cooling_ccp', label: 'HEPA Spiral Cooler [CCP-3B]', status: 'active', isCcp: true, ccpCode: 'CCP-3B' },
        { id: 'slicer', label: 'High-Speed Blade Slicer', status: 'normal' },
        { id: 'metal_ccp', label: 'Packaging Metal Sentry [CCP-3C]', status: 'active', isCcp: true, ccpCode: 'CCP-3C' },
        { id: 'pallet', label: 'Robotic Case Packer', status: 'normal' }
      ])
    );

    // Plan 4: Ready-To-Eat (RTE) Deli Meats & Thermal Cook
    insertPlan.run(
      'meat',
      'Ready-To-Eat (RTE) Deli Meats & Cook',
      'Meat & Poultry Processing',
      'Line 4 - Computerized Smokehouse & Cryo-Chill',
      'USDA FSIS 9 CFR Part 417 & Pathogen Reduction HACCP Rule',
      'Fully automated thermal lethality smokehouse process, compliance-mandated 6-hour stabilization chill, and MAP anaerobic packaging.',
      'BATCH-MT-104',
      JSON.stringify([
        { id: 'brine', label: 'Vacuum Massage & Tumbling', status: 'normal' },
        { id: 'stuffing', label: 'Cellulose Casing Stuffer', status: 'normal' },
        { id: 'smoke_ccp', label: 'Smokehouse Lethality [CCP-4A]', status: 'active', isCcp: true, ccpCode: 'CCP-4A' },
        { id: 'chill_ccp', label: 'Rapid Blast Chill [CCP-4B]', status: 'active', isCcp: true, ccpCode: 'CCP-4B' },
        { id: 'peeling', label: 'Cleanroom Casing Peeler', status: 'normal' },
        { id: 'map_ccp', label: 'MAP Residual O₂ Seal [CCP-4C]', status: 'active', isCcp: true, ccpCode: 'CCP-4C' },
        { id: 'pack', label: 'Carton Seal & Cold Chain', status: 'normal' }
      ])
    );
  }

  // Re-seed CCPs
  const ccpCountStmt = db.prepare('SELECT COUNT(*) as count FROM critical_control_points');
  const ccpCount = (ccpCountStmt.get() as { count: number }).count;

  if (ccpCount === 0) {
    const insertCcp = db.prepare(`
      INSERT INTO critical_control_points (
        plan_id, ccp_code, ccp_name, process_stage, lower_limit, upper_limit, unit_of_measure, hazard_type, protocol_context, actuator_id, actuator_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Plan 1: Milk CCPs
    insertCcp.run(
      'milk',
      'CCP-1A',
      'Pasteurization Thermal Step (CCP-1A)',
      'Milk Thermal Processing Room',
      72.0,
      85.0,
      '°C',
      'Biological Hazard (Pathogens)',
      'High-Temperature Short-Time (HTST) pasteurization requires holding milk at a minimum of 72°C for 15 seconds to eliminate Coxiella burnetii.',
      'FDV-301-SOLENOID',
      '3-Way Sanitary Flow Divert Valve'
    );

    insertCcp.run(
      'milk',
      'CCP-1B',
      'Clean-in-Place (CIP) Caustic Wash Temp (CCP-1B)',
      'CIP Loop #2 Plate Heat Exchanger',
      65.0,
      82.0,
      '°C',
      'Chemical/Microbiological Biofilm',
      'Minimum caustic soda circulating temperature of 65°C required to dissolve milkstone and eradicate persistent Listeria monocytogenes biofilms.',
      'CIP-DOSING-V2',
      'Caustic Injection Modulator'
    );

    insertCcp.run(
      'milk',
      'CCP-1C',
      'Finished Cold Silo Storage (CCP-1C)',
      'Pasteurized Product Storage Silo 4',
      0.0,
      4.0,
      '°C',
      'Biological Hazard (Psychrotrophic Bacteria)',
      'Storage above 4.0°C promotes growth of Pseudomonas and Bacillus cereus spores in pasteurized milk. Chiller interlock triggers alarm.',
      'GLYCOL-CHILLER-B4',
      'Ammonia Glycol Secondary Chiller'
    );

    // Plan 2: Ice Cream CCPs
    insertCcp.run(
      'ice_cream',
      'CCP-2A',
      'Mix Vat Pasteurization Dwell (CCP-2A)',
      'Batch Mixing & Blend Vat #1',
      69.0,
      78.0,
      '°C',
      'Biological Hazard (Salmonella & Listeria)',
      'High-fat and high-sugar ice cream formulations require 69.0°C minimum for 30 minutes continuous thermal agitation for complete lethality.',
      'STEAM-VAT-REG-1',
      'Pneumatic Steam Inflow Regulator'
    );

    insertCcp.run(
      'ice_cream',
      'CCP-2B',
      'Continuous Freezer Exit Temp (CCP-2B)',
      'Scraped Surface Cryo-Freezer',
      -6.5,
      -3.0,
      '°C',
      'Physical Integrity & Cold Shock',
      'Exit temperatures warmer than -3.0°C cause ice recrystallization and allow micro-growth during packaging transfer. Halts pump.',
      'FREON-BACKPRESSURE-V1',
      'Suction Backpressure Regulator'
    );

    insertCcp.run(
      'ice_cream',
      'CCP-2C',
      'Inline Packaging Metal Detection (CCP-2C)',
      'Post-Lidding High-Speed Conveyor',
      0.0,
      1.2,
      'mm',
      'Physical Hazard (Metal Fragments)',
      'Inline magnetic eddy-current detector. Sensitivity threshold 1.2mm ferrous/stainless. Breaches trip pneumatic air blast.',
      'AIRBLAST-RAM-03',
      'High-Speed Air Blast Rejection Ram'
    );

    // Plan 3: Bakery CCPs
    insertCcp.run(
      'bakery',
      'CCP-3A',
      'Tunnel Oven Core Bake Lethality (CCP-3A)',
      'Direct Gas-Fired Oven Zone 3',
      93.0,
      100.0,
      '°C',
      'Biological Hazard (Bacillus cereus spores)',
      'Internal crumb temperature must reach 93.0°C to achieve 6-log lethality of spore-forming bacteria and set gluten structure.',
      'BURNER-ZONE-MOD-SV9',
      'Gas Burner Modulation Inverter'
    );

    insertCcp.run(
      'bakery',
      'CCP-3B',
      'HEPA Cooling Zone Humidity & Temp (CCP-3B)',
      'Spiral Cleanroom Cooling Chamber',
      18.0,
      24.0,
      '°C',
      'Biological Hazard (Mold & Condensation)',
      'Exceeding 24°C leads to condensation inside packaging bag, causing rapid Aspergillus and Penicillium mold contamination.',
      'DEHUMIDIFIER-DAH-1',
      'Cleanroom Desiccant Dehumidifier'
    );

    insertCcp.run(
      'bakery',
      'CCP-3C',
      'End-of-Line Slicer Metal Detection (CCP-3C)',
      'Packaging Feed Conveyor',
      0.0,
      1.0,
      'mm',
      'Physical Hazard (Broken Slicer Blades)',
      'Detects metallic particles from high-speed rotary bread slicer blades. Limit 1.0mm ferrous test sphere.',
      'FLIPPER-GATE-02',
      'Drop-Flap Conveyor Rejector'
    );

    // Plan 4: Meat CCPs
    insertCcp.run(
      'meat',
      'CCP-4A',
      'Smokehouse Core Thermal Lethality (CCP-4A)',
      'Industrial Steam Smokehouse #2',
      74.0,
      88.0,
      '°C',
      'Biological Hazard (Salmonella & Listeria)',
      'USDA FSIS lethality standard: internal core temperature must maintain 74.0°C minimum to achieve certified 7-log pathogen eradication.',
      'SMOKEHOUSE-DAMPER-LOCK',
      'Thermal Hold Door Interlock'
    );

    insertCcp.run(
      'meat',
      'CCP-4B',
      'Rapid Stabilization Blast Chill (CCP-4B)',
      'Cryogenic Blast Chill Cell',
      0.0,
      4.4,
      '°C',
      'Biological Hazard (Clostridium perfringens)',
      'Cooked poultry and cured meats must chill from 54°C to 4.4°C in ≤ 6 hours to prevent spore germination of toxin-producing clostridia.',
      'CRYO-N2-BOOSTER-SV1',
      'Cryogenic Liquid N2 Injection Nozzle'
    );

    insertCcp.run(
      'meat',
      'CCP-4C',
      'MAP Modified Atmosphere Residual O₂ (CCP-4C)',
      'Thermoformer Gas Flush Station',
      0.0,
      0.5,
      '%',
      'Chemical/Biological (C. botulinum & Oxidation)',
      'Residual oxygen must not exceed 0.5% in vacuum-flushed packages to prevent rancidity and eliminate facultative bacterial proliferation.',
      'GAS-FLUSH-SERVO-04',
      'N2/CO2 Gas Mixture Metering Servo'
    );
  }

  // Seed realistic baseline logs across the plans if empty
  const auditCountStmt = db.prepare('SELECT COUNT(*) as count FROM audit_logs');
  const auditResult = auditCountStmt.get() as { count: number };

  if (auditResult.count === 0) {
    seedBaselineAudits();
  }
}

export function seedBaselineAudits() {
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (ccp_id, inspector_name, recorded_value, status, timestamp, comments, batch_number)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  const timeOffset = (minutesAgo: number) => new Date(now - minutesAgo * 60 * 1000).toISOString();

  // Baseline Pass 1: Milk Pasteurization
  insertAudit.run(
    1,
    'Sarah Jenkins (QC Tech)',
    74.2,
    'PASS',
    timeOffset(65),
    'Holding tube temperature nominal. Flow rate 120 L/min stable.',
    'BATCH-401'
  );

  // Baseline Pass 2: Ice Cream Freezer Exit
  insertAudit.run(
    5,
    'Marcus Vance (Lead Freezing Tech)',
    -5.1,
    'PASS',
    timeOffset(45),
    'Overrun validated at 105%. Extrusion temperature uniform across 6 nozzles.',
    'BATCH-IC-88'
  );

  // Baseline Pass 3: Bakery Oven Lethality
  insertAudit.run(
    7,
    'Elena Rostova (Master Baker)',
    96.5,
    'PASS',
    timeOffset(30),
    'Zone 3 gas burners firing at 68% load. Crumb core temperature verified with calibrated wireless probe.',
    'BATCH-BK-511'
  );

  // Baseline Pass 4: Meat Smokehouse
  insertAudit.run(
    10,
    'David Miller (Lead Operator)',
    76.8,
    'PASS',
    timeOffset(15),
    'Core lethality dwell timer completed 3 minutes sustained hold. USDA lethality certificate generated.',
    'BATCH-MT-103'
  );
}
