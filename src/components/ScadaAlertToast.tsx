import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  X,
  ShieldCheck,
  Siren,
  Lock,
  Wrench,
  Microscope,
  ChevronRight,
  Loader2,
  PackageCheck,
  FileWarning
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DeviationAlertItem, DeviationStatus, DispositionDecision } from '../types';

interface ScadaAlertToastProps {
  /** Live unresolved deviations. When this is empty the red alert clears automatically. */
  alerts: DeviationAlertItem[];
  /** Most recently created deviation — flashes the "new alert" treatment. */
  latestResolutionId: number | null;
  onDismiss: () => void;
  onAdvance: (resolutionId: number, payload: Record<string, any>) => Promise<void>;
  onOpenLedger: (auditLogId: number) => void;
  updatingId: number | null;
  compact?: boolean;
}

const LIFECYCLE: { status: DeviationStatus; label: string; icon: any }[] = [
  { status: 'OPEN_INVESTIGATION', label: 'Alert Raised', icon: Siren },
  { status: 'CONTAINED', label: 'Contained', icon: Lock },
  { status: 'CORRECTED', label: 'Corrected', icon: Wrench },
  { status: 'VERIFIED', label: 'Verified', icon: Microscope },
  { status: 'CLOSED', label: 'Closed', icon: ShieldCheck }
];

const DISPOSITION_SHORT: Record<DispositionDecision, string> = {
  REPROCESS_THEN_RELEASE: 'Reprocess → Release',
  HOLD_PENDING_LAB_RELEASE: 'Hold → Lab Release',
  REWORK_THEN_RELEASE: 'Rework → Release',
  REJECT_AFFECTED_LOT: 'Reject Lot',
  REPACK_THEN_RELEASE: 'Repack → Release',
  RELEASE_NO_IMPACT: 'Release — No Impact'
};

const lifecycleIndex = (s: DeviationStatus) => {
  if (s === 'PRODUCT_REJECTED') return 1;
  const i = LIFECYCLE.findIndex((l) => l.status === s);
  return i < 0 ? 0 : i;
};

export const ScadaAlertToast: React.FC<ScadaAlertToastProps> = ({
  alerts,
  latestResolutionId,
  onDismiss,
  onAdvance,
  onOpenLedger,
  updatingId,
  compact = false
}) => {
  const [expanded, setExpanded] = useStateSafe(true);

  // All-clear state: every deviation has been corrected, verified and closed.
  if (alerts.length === 0) {
    return (
      <AnimatePresence>
        {latestResolutionId !== null && (
          <motion.div
            key="all-clear"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-18 right-4 sm:right-8 z-50 w-full max-w-md bg-haccp-950 text-white rounded-xl p-4 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-2 border-haccp-500"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-haccp-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-xs uppercase tracking-wide text-haccp-300">
                    All Deviations Resolved
                  </span>
                  <button onClick={onDismiss} className="text-haccp-300 hover:text-white p-1 rounded transition cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-haccp-100 mt-1 leading-relaxed">
                  Corrective action completed, effectiveness verified and the QA closure authorization is recorded.
                  The process is back under full control and the audit trail retains the full event chain.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        key="alert-stack"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-18 right-4 sm:right-8 z-50 w-full max-w-lg bg-haccp-critical-950 text-white rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-2 border-haccp-critical-500 overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 flex items-start gap-3 bg-gradient-to-r from-haccp-critical-900/60 to-transparent">
          <div className="w-10 h-10 rounded-lg bg-haccp-critical-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs uppercase tracking-wide text-haccp-critical-300">
                  CCP Deviation Active
                </span>
                <span className="inline-flex items-center gap-1 bg-haccp-700/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-haccp-300" />
                  Auto-Correction Executed
                </span>
              </div>
              <button onClick={onDismiss} className="text-haccp-critical-300 hover:text-white p-1 rounded transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-haccp-critical-100 font-medium mt-1 leading-relaxed">
              {alerts.length === 1
                ? 'Resolve the deviation below to clear the alert. The audit record is retained permanently.'
                : `${alerts.length} unresolved deviations. Resolve each to return the line to full control.`}
            </p>
          </div>
        </div>

        {/* Alert list */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-haccp-critical-900/50">
          {alerts.map((alert) => {
            const idx = lifecycleIndex(alert.deviation_status);
            const isNew = alert.resolution_record_id === latestResolutionId;
            const isRejected = alert.deviation_status === 'PRODUCT_REJECTED';
            const isClosed = alert.deviation_status === 'CLOSED';
            const next = LIFECYCLE[idx + 1];
            const isOpen = !isClosed && !isRejected;
            const progress = alert.total_steps > 0
              ? Math.round((idx / (LIFECYCLE.length - 1)) * 100)
              : 0;

            return (
              <div key={alert.resolution_record_id} className="p-3.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-white">{alert.ccp_code}</span>
                      <span className="text-[11px] text-haccp-critical-100 font-semibold truncate">{alert.ccp_name}</span>
                      {isNew && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-haccp-critical-600 text-white">
                          New
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-haccp-critical-200 font-mono mt-0.5">
                      {alert.plan_id} · {alert.batch_number} · {alert.capa_reference}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-haccp-critical-700 bg-haccp-critical-900/70 text-haccp-critical-200 whitespace-nowrap">
                    {DISPOSITION_SHORT[alert.product_disposition] || alert.product_disposition.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Lifecycle rail */}
                <div className="flex items-center gap-1 mb-2">
                  {LIFECYCLE.map((l, i) => {
                    const reached = isRejected ? i <= 1 : i <= idx;
                    const isCurrent = !isRejected && i === idx;
                    const Icon = l.icon;
                    return (
                      <React.Fragment key={l.status}>
                        {i > 0 && <div className={`h-px flex-1 ${i <= idx ? 'bg-haccp-500' : 'bg-haccp-critical-900'}`} />}
                        <div
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${
                            reached ? 'border-haccp-500/60 bg-haccp-700/30' : 'border-haccp-critical-900 opacity-50'
                          }`}
                          title={l.label}
                        >
                          {reached
                            ? <Icon className="w-3 h-3 text-haccp-300" />
                            : <span className="w-3 h-3 rounded-full border border-haccp-critical-700" />}
                          {isCurrent && <span className="w-1 h-1 rounded-full bg-haccp-300 animate-pulse" />}
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-haccp-critical-200 mb-2">
                  <span>
                    Status: <strong className="text-white">{isRejected ? 'Lot Rejected' : alert.deviation_status.replace(/_/g, ' ')}</strong>
                  </span>
                  <span>{progress}% complete</span>
                </div>
                <div className="h-1 rounded-full bg-haccp-critical-900 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-haccp-critical-500 to-haccp-400 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="text-[10px] text-haccp-critical-200 font-mono mb-2.5">
                  <div>Reading: <strong className="text-white">{alert.recorded_value}{alert.unit_of_measure}</strong> · Limit {alert.critical_limit}</div>
                  <div>Owner: <strong className="text-white">{alert.owner_role}</strong> · {alert.total_steps} corrective steps</div>
                </div>

                {isOpen && next && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={updatingId === alert.resolution_record_id}
                      onClick={() => onAdvance(alert.resolution_record_id, { deviation_status: next.status })}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-white text-haccp-critical-900 hover:bg-haccp-100 transition disabled:opacity-50 cursor-pointer"
                    >
                      {updatingId === alert.resolution_record_id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <next.icon className="w-3.5 h-3.5" />}
                      {next.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpanded(!expanded)}
                      className="text-[11px] text-haccp-critical-200 hover:text-white underline cursor-pointer"
                    >
                      {expanded ? 'Hide' : 'Show'} resolution
                    </button>
                  </div>
                )}

                {isRejected && (
                  <div className="text-[10px] text-haccp-critical-200 flex items-center gap-1.5">
                    <FileWarning className="w-3.5 h-3.5" />
                    Zero-tolerance lot rejection. CAPA effectiveness review remains open.
                  </div>
                )}

                {isClosed && (
                  <div className="text-[10px] text-haccp-300 flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5" />
                    Deviation closed and QA authorization recorded.
                  </div>
                )}

                {isOpen && (
                  <button
                    type="button"
                    onClick={() => onOpenLedger(alert.audit_log_id)}
                    className="mt-2 text-[10px] text-haccp-critical-200 hover:text-white underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Open in audit ledger <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Tiny local hook so this component stays self-contained
function useStateSafe(initial: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = React.useState(initial);
  return [value, setValue];
}
