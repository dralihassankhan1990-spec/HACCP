export interface SchematicNode {
  id: string;
  label: string;
  status: 'normal' | 'active' | 'breach' | 'diverted';
  isCcp?: boolean;
  ccpCode?: string;
  isActuator?: boolean;
  actuatorId?: string;
  temp?: string;
  pressure?: string;
}

export interface HaccpPlan {
  id: string;
  title: string;
  category: string;
  facility_line: string;
  regulatory_standard: string;
  description: string;
  active_batch_default: string;
  schematic_nodes: SchematicNode[];
}

export interface CriticalControlPoint {
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
  created_at?: string;
  // HACCP Resolution Steps (Principle 5: Corrective Actions)
  corrective_action_steps?: CorrectiveActionStep[];
  root_cause_categories?: string[];
  verification_methods?: string[];
  preventive_measures?: string[];
  revalidation_requirements?: string[];
}

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

export interface CorrectiveActionStep {
  step: number;
  phase?: string;
  title: string;
  description: string;
  responsible_role: string;
  timeline: string;
  evidence_required: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
}

export interface ScadaTelemetry {
  actuator?: string;
  actuator_name?: string;
  valve_position?: string;
  holding_tube_temp?: string;
  threshold_target?: string;
  divert_latency_ms?: number;
  quarantine_tank?: string;
  alert_status?: string;
  iso_clause?: string;
  conveyor_status?: string;
  detected_signal_mm?: number;
  threshold_max_mm?: number;
  containment_bin?: string;
  tunnel_speed_hz?: number;
  core_probe_temp?: string;
  target_lethality_temp?: string;
  booster_output_pct?: number;
  status?: string;
  [key: string]: any;
}

export interface CorrectiveAction {
  id: number;
  audit_log_id: number;
  action_triggered: string;
  script_execution_status: 'Executed' | 'Failed' | 'Pending';
  resolution_notes: string;
  scada_telemetry: ScadaTelemetry | string | null;
  logged_at: string;
  // Enhanced HACCP Resolution Fields
  root_cause_analysis?: RootCauseAnalysis;
  corrective_action_steps?: CorrectiveActionStep[];
  verification_record?: VerificationRecord;
  preventive_actions?: PreventiveAction[];
  revalidation_status?: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'failed';
  revalidation_date?: string;
  closure_authorized_by?: string;
  closure_date?: string;
}

export interface RootCauseAnalysis {
  immediate_cause: string;
  root_cause: string;
  contributing_factors: string[];
  analysis_method: '5_whys' | 'fishbone' | 'fault_tree' | 'rca_other';
  analyzed_by: string;
  analyzed_at: string;
}

export interface VerificationRecord {
  verification_method: string;
  acceptance_criteria?: string;
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
  effectiveness_check_date?: string;
  effectiveness_result?: 'effective' | 'partially_effective' | 'ineffective';
}

export interface AuditTrailItem {
  id: number;
  ccp_id: number;
  plan_id?: string;
  inspector_name: string;
  recorded_value: number;
  status: 'PASS' | 'FAIL';
  timestamp: string;
  comments: string;
  batch_number: string;
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
  corrective_action_id: number | null;
  action_triggered: string | null;
  script_execution_status: 'Executed' | 'Failed' | 'Pending' | null;
  resolution_notes: string | null;
  scada_telemetry: ScadaTelemetry | null;
  action_logged_at: string | null;
  // Full HACCP deviation-resolution package (Principle 5)
  root_cause_analysis?: RootCauseAnalysis;
  corrective_action_steps?: CorrectiveActionStep[];
  verification_record?: VerificationRecord;
  preventive_actions?: PreventiveAction[];
  revalidation_status?: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'failed';
  revalidation_date?: string;
  closure_authorized_by?: string;
  closed_at?: string;
  // Joined resolution_records columns
  resolution_record_id?: number | null;
  deviation_status?: DeviationStatus | null;
  product_disposition?: DispositionDecision | null;
  disposition_rationale?: string | null;
  affected_product_scope?: string | null;
  capa_reference?: string | null;
  owner_role?: string | null;
  opened_at?: string | null;
  resolution_data?: Record<string, any> | null;
}

export interface ComplianceStats {
  totalLogs: number;
  passCount: number;
  failCount: number;
  complianceRate: number;
  shiftStatus: 'NORMAL' | 'ATTENTION' | 'CRITICAL';
  /** Unresolved deviations — drives the live red alert state. Clears when all deviations are closed. */
  activeCriticalBreaks: number;
  openDeviations: number;
  closedDeviations: number;
  totalDeviations: number;
  automatedActionsExecuted: number;
}

export interface DeviationAlertItem {
  resolution_record_id: number;
  audit_log_id: number;
  ccp_code: string;
  ccp_name: string;
  plan_id: string;
  batch_number: string;
  recorded_value: number;
  critical_limit: string;
  unit_of_measure: string;
  hazard_type: string;
  deviation_status: DeviationStatus;
  product_disposition: DispositionDecision;
  owner_role: string;
  capa_reference: string;
  opened_at: string;
  revalidation_status: string;
  completed_steps: number;
  total_steps: number;
}