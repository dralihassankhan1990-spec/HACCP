import React from 'react';
import { AlertOctagon, CheckCircle2, Zap, FileCheck, ShieldCheck, Activity } from 'lucide-react';
import { ComplianceStats } from '../types';

interface ComplianceHealthRingProps {
  stats: ComplianceStats | null;
  activePlanTitle: string;
}

export const ComplianceHealthRing: React.FC<ComplianceHealthRingProps> = ({ stats, activePlanTitle }) => {
  const rate = stats ? stats.complianceRate : 100;
  const breaks = stats ? stats.activeCriticalBreaks : 0;
  const total = stats ? stats.totalLogs : 0;
  const automatedActions = stats ? stats.automatedActionsExecuted : 0;

  // SVG circular ring calculation (r = 38, circumference ~ 238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  let ringColor = 'text-haccp-400';
  let statusTextColor = 'text-haccp-400';
  let glowColor = 'rgba(34, 197, 94, 0.4)';
  if (rate < 85) {
    ringColor = 'text-haccp-critical-500';
    statusTextColor = 'text-haccp-critical-400';
    glowColor = 'rgba(244, 63, 94, 0.4)';
  } else if (rate < 95) {
    ringColor = 'text-haccp-warm-400';
    statusTextColor = 'text-haccp-warm-400';
    glowColor = 'rgba(245, 158, 11, 0.4)';
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      
      {/* 1. Cockpit Shift Compliance Ring */}
      <div 
        id="compliance-health-card" 
        className="bg-haccp-surface-900 border border-haccp-surface-800 rounded-xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] flex items-center justify-between relative overflow-hidden"
      >
        <div className="space-y-1 relative z-10">
          <div className="text-[10px] font-black uppercase tracking-widest text-haccp-surface-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-haccp-400" />
            Shift Compliance Rate
          </div>
          <div className="text-2xl font-black text-haccp-surface-50 tracking-tight flex items-baseline gap-1.5">
            <span className={statusTextColor}>{rate}%</span>
            <span className="text-xs font-semibold text-haccp-surface-400 uppercase">Passing</span>
          </div>
          <div className="text-[11px] text-haccp-surface-400 font-mono">
            Line Target: <strong className="text-haccp-surface-200">≥ 95.0%</strong>
          </div>
        </div>

        {/* Circular Ring Gauge */}
        <div className="relative w-18 h-18 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-haccp-surface-800"
              strokeWidth="9"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={`${ringColor} transition-all duration-700 ease-out`}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-black text-haccp-surface-50 leading-tight font-mono">
              {rate}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Active (Unresolved) Deviations */}
      <div 
        id="critical-breaks-card" 
        className={`rounded-xl p-4 border shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] flex items-center justify-between transition-colors relative overflow-hidden ${
          breaks > 0 
            ? 'bg-haccp-critical-950/80 border-haccp-critical-600/80' 
            : 'bg-haccp-surface-900 border-haccp-surface-800'
        }`}
      >
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-haccp-surface-400">
            Active Unresolved Deviations
          </div>
          <div className="text-2xl font-black tracking-tight flex items-baseline gap-2">
            <span className={breaks > 0 ? 'text-haccp-critical-400 animate-pulse' : 'text-haccp-400'}>
              {breaks}
            </span>
            <span className="text-xs font-semibold text-haccp-surface-400 uppercase">
              {breaks === 0 ? 'All Clear' : breaks === 1 ? '1 Open' : `${breaks} Open`}
            </span>
          </div>
          <div className="text-[11px] text-haccp-surface-400 font-mono">
            {breaks > 0
              ? 'Alert active until closure'
              : `${stats?.closedDeviations ?? 0} resolved & closed`}
          </div>
        </div>

        <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
          breaks > 0 ? 'bg-haccp-critical-600 text-white shadow-lg' : 'bg-haccp-800/60 text-haccp-400'
        }`}>
          {breaks > 0 ? (
            <AlertOctagon className="w-6 h-6 animate-spin" />
          ) : (
            <CheckCircle2 className="w-6 h-6" />
          )}
        </div>
      </div>

      {/* 3. Automated Corrective Actions Executed */}
      <div 
        id="automated-actions-card" 
        className="bg-haccp-surface-900 border border-haccp-surface-800 rounded-xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] flex items-center justify-between"
      >
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-haccp-surface-400">
            Automated Corrections
          </div>
          <div className="text-2xl font-black text-haccp-surface-50 tracking-tight flex items-baseline gap-2">
            <span className="text-haccp-teal-400 font-mono">{automatedActions}</span>
            <span className="text-xs font-semibold text-haccp-surface-400 uppercase">Trips Logged</span>
          </div>
          <div className="text-[11px] text-haccp-surface-400 font-mono">
            {'Hardware response < 200ms'}
          </div>
        </div>

        <div className="w-11 h-11 rounded-lg bg-haccp-teal-950/80 border border-haccp-teal-700/50 text-haccp-teal-400 flex items-center justify-center shrink-0">
          <Zap className="w-6 h-6" />
        </div>
      </div>

      {/* 4. Deviations Resolved & Closed */}
      <div 
        id="total-audits-card" 
        className="bg-haccp-surface-900 border border-haccp-surface-800 rounded-xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] flex items-center justify-between"
      >
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-haccp-surface-400">
            Deviations Closed
          </div>
          <div className="text-2xl font-black text-haccp-surface-50 tracking-tight flex items-baseline gap-2">
            <span className="text-haccp-400 font-mono">{stats?.closedDeviations ?? 0}</span>
            <span className="text-xs font-semibold text-haccp-surface-400 uppercase">
              of {stats?.totalDeviations ?? 0} total
            </span>
          </div>
          <div className="text-[11px] text-haccp-surface-400 font-mono">
            {stats ? `${stats.passCount} PASS • ${stats.failCount} FAIL • ${total} records` : 'Synchronizing...'}
          </div>
        </div>

        <div className="w-11 h-11 rounded-lg bg-haccp-950/80 border border-haccp-700/50 text-haccp-400 flex items-center justify-center shrink-0">
          <FileCheck className="w-6 h-6" />
        </div>
      </div>

    </div>
  );
};