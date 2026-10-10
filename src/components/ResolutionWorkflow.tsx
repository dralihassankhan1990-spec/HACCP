import React, { useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Lock,
  Microscope,
  PackageCheck,
  ShieldCheck,
  Siren,
  Wrench,
  CircleDot,
  Loader2,
  LockKeyhole,
  User,
  Shield,
  Users,
  Briefcase
} from 'lucide-react';
import {
  AuditTrailItem,
  DeviationStatus,
  DispositionDecision,
  CorrectiveActionStep,
  RootCauseAnalysis,
  VerificationRecord,
  PreventiveAction
} from '../types';

interface ResolutionWorkflowProps {
  item: AuditTrailItem;
  onStatusChange: (id: number, payload: Record<string, any>) => Promise<void>;
  updating: boolean;
}

const PHASES: { status: DeviationStatus; label: string; icon: any; tone: string; role: string; roleIcon: any }[] = [
  { status: 'OPEN_INVESTIGATION', label: 'Deviation Opened', icon: Siren, tone: 'critical', role: 'QC Operator', roleIcon: User },
  { status: 'CONTAINED', label: 'Product Contained', icon: Lock, tone: 'warm', role: 'Production Manager', roleIcon: Briefcase },
  { status: 'CORRECTED', label: 'Process Corrected', icon: Wrench, tone: 'teal', role: 'Quality Manager', roleIcon: Shield },
  { status: 'VERIFIED', label: 'Effectiveness Verified', icon: Microscope, tone: 'teal', role: 'Quality Manager', roleIcon: Shield },
  { status: 'CLOSED', label: 'Deviation Closed', icon: ShieldCheck, tone: 'safe', role: 'Plant Manager', roleIcon: Users }
];

const DISPOSITION_META: Record<DispositionDecision, { label: string; tone: string; icon: any }> = {
  REPROCESS_THEN_RELEASE: { label: 'Reprocess then Release', tone: 'text-haccp-teal-300 border-haccp-teal-700 bg-haccp-teal-950/40', icon: PackageCheck },
  HOLD_PENDING_LAB_RELEASE: { label: 'Hold Pending Lab Release', tone: 'text-haccp-warm-300 border-haccp-warm-700 bg-haccp-warm-950/40', icon: FileWarning },
  REWORK_THEN_RELEASE: { label: 'Rework then Release', tone: 'text-haccp-teal-300 border-haccp-teal-700 bg-haccp-teal-950/40', icon: Wrench },
  REJECT_AFFECTED_LOT: { label: 'Reject Affected Lot', tone: 'text-haccp-critical-300 border-haccp-critical-700 bg-haccp-critical-950/40', icon: FileWarning },
  REPACK_THEN_RELEASE: { label: 'Repack then Release', tone: 'text-haccp-300 border-haccp-700 bg-haccp-950/40', icon: PackageCheck },
  RELEASE_NO_IMPACT: { label: 'Release — No Impact', tone: 'text-haccp-400 border-haccp-800 bg-haccp-950/40', icon: BadgeCheck }
};

const phaseIndex = (s: DeviationStatus) => {
  if (s === 'PRODUCT_REJECTED') return 1;
  const i = PHASES.findIndex((p) => p.status === s);
  return i < 0 ? 0 : i;
};

const TONE_CLASS: Record<string, { dot: string; text: string; border: string; bg: string }> = {
  critical: { dot: 'bg-haccp-critical-400', text: 'text-haccp-critical-300', border: 'border-haccp-critical-700', bg: 'bg-haccp-critical-950/40' },
  warm: { dot: 'bg-haccp-warm-400', text: 'text-haccp-warm-300', border: 'border-haccp-warm-700', bg: 'bg-haccp-warm-950/30' },
  teal: { dot: 'bg-haccp-teal-400', text: 'text-haccp-teal-300', border: 'border-haccp-teal-700', bg: 'bg-haccp-teal-950/30' },
  safe: { dot: 'bg-haccp-400', text: 'text-haccp-400', border: 'border-haccp-800', bg: 'bg-haccp-950/40' }
};

const Section: React.FC<{ title: string; icon: any; children: React.ReactNode; tone?: string }> = ({ title, icon: Icon, children, tone = 'text-haccp-surface-200' }) => (
  <div className="bg-haccp-surface-900 border border-haccp-surface-800 rounded-xl p-3.5">
    <div className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2.5 ${tone}`}>
      <Icon className="w-3.5 h-3.5" />
      {title}
    </div>
    {children}
  </div>
);

export const ResolutionWorkflow: React.FC<ResolutionWorkflowProps> = ({ item, onStatusChange, updating }) => {
  const [signOff, setSignOff] = useState('');
  const [showSignOff, setShowSignOff] = useState(false);

  if (item.status !== 'FAIL' || !item.corrective_action_id) return null;

  const status: DeviationStatus = item.deviation_status || 'OPEN_INVESTIGATION';
  const steps: CorrectiveActionStep[] = item.corrective_action_steps || [];
  const rca: RootCauseAnalysis | null = item.root_cause_analysis || null;
  const verification: VerificationRecord | null = item.verification_record || null;
  const preventives: PreventiveAction[] = item.preventive_actions || [];
  const disposition = (item.product_disposition || 'HOLD_PENDING_LAB_RELEASE') as DispositionDecision;
  const dispoMeta = DISPOSITION_META[disposition] || DISPOSITION_META.HOLD_PENDING_LAB_RELEASE;
  const DispoIcon = dispoMeta.icon;
  const currentIdx = phaseIndex(status);
  const isRejected = status === 'PRODUCT_REJECTED';
  const isClosed = status === 'CLOSED';

  const nextPhase = PHASES[currentIdx + 1];

  return (
    <div className="mt-4 border border-haccp-800 rounded-xl overflow-hidden bg-haccp-surface-950">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-haccp-950 via-haccp-surface-900 to-haccp-surface-900 flex flex-wrap items-center justify-between gap-3 border-b border-haccp-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-haccp-critical-500/10 border border-haccp-critical-700/60 flex items-center justify-center text-haccp-critical-400">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-haccp-surface-50 flex items-center gap-2">
              HACCP Deviation Resolution — Principle 5
              {item.capa_reference && (
                <span className="text-[9px] font-mono text-haccp-300 bg-haccp-950/70 border border-haccp-800 px-1.5 py-0.5 rounded">
                  {item.capa_reference}
                </span>
              )}
            </div>
            <div className="text-[10px] text-haccp-surface-400 font-mono">
              {item.ccp_code} · {item.ccp_name} · Batch {item.batch_number} · Owner: {item.owner_role || 'QA Manager'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${dispoMeta.tone}`}>
            <DispoIcon className="w-3 h-3" />
            {dispoMeta.label}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
            isClosed || isRejected
              ? 'border-haccp-800 bg-haccp-950/50 text-haccp-surface-300'
              : 'border-haccp-warm-700 bg-haccp-warm-950/40 text-haccp-warm-300'
          }`}>
            {isClosed ? <CheckCircle2 className="w-3 h-3" /> : isRejected ? <FileWarning className="w-3 h-3" /> : <CircleDot className="w-3 h-3" />}
            {isClosed ? 'Closed' : isRejected ? 'Lot Rejected' : status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Phase progress */}
      <div className="px-4 py-3 border-b border-haccp-800 bg-haccp-surface-900/50">
        <div className="flex items-center gap-1.5">
          {PHASES.map((p, i) => {
            const reached = isRejected ? i <= 1 : i <= currentIdx;
            const isCurrent = !isRejected && i === currentIdx;
            const tone = TONE_CLASS[p.tone];
            const PhaseRoleIcon = p.roleIcon;
            return (
              <React.Fragment key={p.status}>
                {i > 0 && <div className={`h-px flex-1 ${i <= currentIdx ? 'bg-haccp-600' : 'bg-haccp-800'}`} />}
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition ${reached ? tone.border : 'border-haccp-800 opacity-50'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center ${reached ? tone.dot : 'bg-haccp-800'}`}>
                    {reached && <CheckCircle2 className="w-3 h-3 text-haccp-surface-950" />}
                  </span>
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold uppercase whitespace-nowrap ${reached ? tone.text : 'text-haccp-surface-500'}`}>
                      {p.label}
                    </span>
                    <span className={`text-[8px] flex items-center gap-0.5 ${reached ? tone.text : 'text-haccp-surface-600'}`}>
                      <PhaseRoleIcon className="w-2 h-2" />
                      {p.role}
                    </span>
                  </div>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-haccp-400 animate-pulse" />}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Advance action */}
      {!isClosed && !isRejected && nextPhase && (
        <div className="px-4 py-3 border-b border-haccp-800 bg-haccp-surface-900/30 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-haccp-surface-300">
            <span className="text-haccp-surface-500">Next required action:</span>{' '}
            <strong className="text-haccp-surface-50">Mark deviation as {nextPhase.label.toLowerCase()}</strong>
            {nextPhase.status === 'CLOSED' && (
              <span className="text-haccp-warm-300"> — requires a named QA authorization</span>
            )}
          </div>

          {nextPhase.status === 'CLOSED' ? (
            showSignOff ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={signOff}
                  onChange={(e) => setSignOff(e.target.value)}
                  placeholder="QA Manager full name (authorization)"
                  className="flex-1 sm:w-64 bg-haccp-surface-950 border border-haccp-700 rounded-lg px-2.5 py-1.5 text-[11px] text-haccp-surface-50 placeholder-haccp-surface-500 focus:outline-hidden focus:ring-1 focus:ring-haccp-500"
                />
                <button
                  type="button"
                  disabled={updating || !signOff.trim()}
                  onClick={() => onStatusChange(item.resolution_record_id as number, { deviation_status: 'CLOSED', closure_authorized_by: signOff.trim() })}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-haccp-600 text-haccp-surface-950 hover:bg-haccp-500 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LockKeyhole className="w-3.5 h-3.5" />}
                  Authorize &amp; Close
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignOff(false)}
                  className="text-[11px] text-haccp-surface-400 hover:text-haccp-surface-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSignOff(true)}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-haccp-600 text-haccp-surface-950 hover:bg-haccp-500 transition cursor-pointer"
              >
                <LockKeyhole className="w-3.5 h-3.5" />
                Close Deviation
              </button>
            )
          ) : (
            <button
              type="button"
              disabled={updating}
              onClick={() => onStatusChange(item.resolution_record_id as number, { deviation_status: nextPhase.status })}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-haccp-600 text-haccp-surface-950 hover:bg-haccp-500 transition disabled:opacity-40 cursor-pointer"
            >
              {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Mark {nextPhase.label}
            </button>
          )}
        </div>
      )}

      {/* Body */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Containment + Scope + Disposition */}
        <Section title="Immediate Containment & Product Scope" icon={Lock} tone="text-haccp-critical-300">
          <p className="text-[11px] text-haccp-surface-200 leading-relaxed">{item.resolution_notes}</p>
          <div className="mt-2.5 pt-2.5 border-t border-haccp-surface-800">
            <div className="text-[10px] font-bold uppercase text-haccp-surface-400 mb-1">Affected Product Scope</div>
            <p className="text-[11px] text-haccp-surface-300 leading-relaxed">{item.affected_product_scope}</p>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-haccp-surface-800">
            <div className="text-[10px] font-bold uppercase text-haccp-surface-400 mb-1">Disposition Rationale</div>
            <p className="text-[11px] text-haccp-surface-300 leading-relaxed">{item.disposition_rationale}</p>
          </div>
        </Section>

        {/* Root Cause */}
        <Section title="Root Cause Analysis" icon={Microscope} tone="text-haccp-warm-300">
          {rca ? (
            <div className="space-y-2.5">
              <div>
                <div className="text-[10px] font-bold uppercase text-haccp-surface-400">Immediate Cause</div>
                <p className="text-[11px] text-haccp-surface-200 leading-relaxed">{rca.immediate_cause}</p>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-haccp-surface-400">Root Cause</div>
                <p className="text-[11px] text-haccp-surface-200 leading-relaxed">{rca.root_cause}</p>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-haccp-surface-400">Contributing Factors</div>
                <ul className="mt-1 space-y-0.5">
                  {rca.contributing_factors.map((f, i) => (
                    <li key={i} className="text-[11px] text-haccp-surface-300 flex gap-1.5">
                      <span className="text-haccp-warm-400">▸</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-haccp-surface-800 flex items-center justify-between text-[10px] font-mono text-haccp-surface-400">
                <span>Method: <span className="text-haccp-warm-300">{rca.analysis_method.replace(/_/g, ' ').toUpperCase()}</span></span>
                <span>{new Date(rca.analyzed_at).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-haccp-surface-500">Root cause analysis pending QA assignment.</p>
          )}
        </Section>

        {/* Corrective Action Steps */}
        <Section title={`Corrective Action Plan (${steps.length} steps)`} icon={Wrench} tone="text-haccp-teal-300">
          {steps.length === 0 ? (
            <p className="text-[11px] text-haccp-surface-500">Corrective action plan pending.</p>
          ) : (
            <ol className="space-y-2">
              {steps.map((s) => (
                <li key={s.step} className="flex gap-2.5">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="w-5 h-5 rounded-full bg-haccp-teal-900 border border-haccp-teal-700 text-haccp-teal-300 text-[9px] font-black flex items-center justify-center">
                      {s.step}
                    </span>
                    {s.step < steps.length && <span className="w-px flex-1 bg-haccp-800 mt-1" />}
                  </div>
                  <div className="pb-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-haccp-surface-50">{s.title}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-haccp-surface-800 border border-haccp-700 text-haccp-surface-400">
                        {s.phase}
                      </span>
                    </div>
                    <p className="text-[11px] text-haccp-surface-300 leading-relaxed mt-0.5">{s.description}</p>
                    <div className="text-[10px] text-haccp-surface-400 font-mono mt-1 flex flex-wrap gap-x-3">
                      <span>Owner: <span className="text-haccp-teal-300">{s.responsible_role}</span></span>
                      <span>Due: <span className="text-haccp-surface-300">{s.timeline}</span></span>
                    </div>
                    <div className="text-[10px] text-haccp-surface-400 mt-0.5">
                      <span className="font-bold">Evidence:</span> {s.evidence_required}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Section>

        {/* Verification + Preventive */}
        <Section title="Verification & Preventive Action" icon={BadgeCheck} tone="text-haccp-400">
          {verification && (
            <div className="pb-2.5 mb-2.5 border-b border-haccp-surface-800 space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-haccp-surface-400">Verification Method</div>
              <p className="text-[11px] text-haccp-surface-200 leading-relaxed">{verification.verification_method}</p>
              <div className="text-[10px] font-bold uppercase text-haccp-surface-400">Acceptance Criteria</div>
              <p className="text-[11px] text-haccp-surface-200 leading-relaxed">{verification.acceptance_criteria}</p>
              <div>
                <div className="text-[10px] font-bold uppercase text-haccp-surface-400">Evidence Required</div>
                <ul className="mt-0.5 space-y-0.5">
                  {verification.evidence_documents.map((e, i) => (
                    <li key={i} className="text-[11px] text-haccp-surface-300 flex gap-1.5">
                      <span className="text-haccp-400">▸</span>
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[10px] text-haccp-surface-400 italic pt-1">{verification.notes}</p>
            </div>
          )}

          <div className="text-[10px] font-bold uppercase text-haccp-surface-400 mb-1">
            Preventive Actions ({preventives.length})
          </div>
          {preventives.length === 0 ? (
            <p className="text-[11px] text-haccp-surface-500">Preventive actions pending.</p>
          ) : (
            <ol className="space-y-1.5">
              {preventives.map((p, i) => (
                <li key={i} className="text-[11px] text-haccp-surface-300 flex gap-1.5">
                  <span className="text-haccp-400 shrink-0">▸</span>
                  <span>
                    {p.action}
                    <span className="text-[10px] text-haccp-surface-400 font-mono block">
                      Owner: {p.responsible_role} · Target: {p.target_date} · Status: {p.status.replace(/_/g, ' ')}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-2.5 pt-2.5 border-t border-haccp-surface-800 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
            <span className="text-haccp-surface-400">
              Revalidation:{' '}
              <span className={item.revalidation_status === 'completed' ? 'text-haccp-400' : 'text-haccp-warm-300'}>
                {item.revalidation_status || 'pending'}
              </span>
              {item.revalidation_date ? ` · ${item.revalidation_date}` : ''}
            </span>
            {item.closure_authorized_by && (
              <span className="text-haccp-400">Closed by {item.closure_authorized_by}</span>
            )}
          </div>
        </Section>
      </div>

      {/* Closure banner */}
      {isClosed && (
        <div className="px-4 py-2.5 bg-haccp-950 border-t border-haccp-800 flex items-center gap-2 text-[11px] text-haccp-300">
          <ShieldCheck className="w-3.5 h-3.5" />
          Deviation formally closed by <strong>{item.closure_authorized_by}</strong>
          {item.closed_at ? ` on ${new Date(item.closed_at).toLocaleString()}` : ''}. CAPA effectiveness review scheduled — record retained for regulatory audit.
        </div>
      )}
      {isRejected && (
        <div className="px-4 py-2.5 bg-haccp-critical-950 border-t border-haccp-critical-800 flex items-center gap-2 text-[11px] text-haccp-critical-300">
          <AlertTriangle className="w-3.5 h-3.5" />
          Affected lot rejected under the zero-tolerance pathway. Deviation remains open pending documented CAPA
          effectiveness verification and QA authorization.
        </div>
      )}
    </div>
  );
};
