import React from 'react';
import { ShieldCheck, Siren, Wrench, CheckCircle2, Bell, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ComplianceStats } from '../types';
import { BRAND } from '../config/brand';

interface DeviationStatusBannerProps {
  stats: ComplianceStats | null;
  activePlanTitle: string;
  onReopenAlerts: () => void;
}

/**
 * Plant control status banner.
 *
 * The red state is driven exclusively by UNRESOLVED deviations. As soon as every
 * deviation has been corrected, verified and closed, the line returns to the
 * green "under control" state — the historical breach count is still retained
 * and shown separately in the audit ledger.
 */
export const DeviationStatusBanner: React.FC<DeviationStatusBannerProps> = ({
  stats,
  activePlanTitle,
  onReopenAlerts
}) => {
  const open = stats?.openDeviations ?? 0;
  const closed = stats?.closedDeviations ?? 0;
  const total = stats?.totalDeviations ?? 0;
  const isClear = open === 0;

  if (isClear) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-3xl"
      >
        <div className="flex items-center gap-3 rounded-xl border border-haccp-700/70 bg-haccp-950/95 backdrop-blur-xl px-4 py-3 shadow-[0_18px_45px_-15px_rgba(0,0,0,0.7)]">
          <div className="w-9 h-9 rounded-lg bg-haccp-600/20 border border-haccp-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-haccp-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black uppercase tracking-wide text-haccp-300">
              Line Under Control — No Active Deviations
            </div>
            <div className="text-[11px] text-haccp-surface-300 mt-0.5">
              {activePlanTitle}
              {total > 0 && (
                <>
                  {' '}· All {total} deviation{total === 1 ? '' : 's'} on this line {total === 1 ? 'has' : 'have'} been corrected, verified and closed.
                </>
              )}{' '}
              The complete event chain is retained in the audit ledger.
            </div>
          </div>
          {closed > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-haccp-400 border border-haccp-800 bg-haccp-900/60 rounded-lg px-2.5 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {closed} closed · {open} open
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-3xl"
    >
      <div className="relative rounded-xl border-2 border-haccp-critical-600 bg-haccp-critical-950/95 backdrop-blur-xl px-4 py-3 shadow-[0_18px_45px_-15px_rgba(244,63,94,0.4)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-haccp-critical-900/40 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-haccp-critical-500 via-haccp-critical-400 to-haccp-critical-500 animate-pulse" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-haccp-critical-600 flex items-center justify-center shrink-0 shadow-lg">
            <Siren className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wide text-haccp-critical-300">
                ⚠️ {open} Active CCP Deviation{open === 1 ? '' : 's'}
              </span>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-haccp-warm-900 text-haccp-warm-300 border border-haccp-warm-700">
                <Wrench className="w-2.5 h-2.5" />
                Resolution In Progress
              </span>
            </div>
            <div className="text-[11px] text-haccp-critical-100 mt-0.5">
              {activePlanTitle} · {total - open} of {total} deviation{total === 1 ? '' : 's'} already closed.
              The alert clears automatically once every deviation reaches verified closure.
            </div>
          </div>
          <button
            type="button"
            onClick={onReopenAlerts}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-lg bg-haccp-critical-600 text-white hover:bg-haccp-critical-500 transition cursor-pointer shrink-0 shadow-lg"
          >
            <Bell className="w-3.5 h-3.5" />
            Resolve Now
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
