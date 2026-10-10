import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle2, RotateCcw, BookOpen, PlayCircle, Clock, Radio, Activity, Cpu, Menu, X, ChevronDown, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { BRAND } from '../config/brand';
import { ComplianceStats } from '../types';
import { motion } from 'motion/react';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  stats: ComplianceStats | null;
  onRunTestScenario: () => void;
  onReset: () => void;
  onOpenProtocols: () => void;
  isSubmittingScenario: boolean;
  activePlanTitle: string;
  plans: { id: string; title: string }[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
  unresolvedBreaksByPlan: Record<string, number>;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onStartTour: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  onRunTestScenario,
  onReset,
  onOpenProtocols,
  isSubmittingScenario,
  activePlanTitle,
  plans,
  selectedPlanId,
  onSelectPlan,
  showMobileMenu,
  setShowMobileMenu,
  unresolvedBreaksByPlan,
  isDemoMode,
  onToggleDemoMode,
  onStartTour,
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isAttention = stats?.shiftStatus === 'ATTENTION' || stats?.shiftStatus === 'CRITICAL';

  return (
    <header className="border-b border-haccp-surface-800 bg-haccp-surface-950/95 backdrop-blur-xl sticky top-0 z-40 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          
          {/* Brand & Industrial Plant Identity */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-haccp-surface-950 shadow-lg"
              style={{ background: 'linear-gradient(135deg, rgb(34, 197, 94), rgb(20, 184, 166))' }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              whileHover={{ scale: 1.1, rotate: 180 }}
            >
              <Shield className="w-5 h-5 text-white" />
            </motion.div>
            
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight text-haccp-surface-50 flex items-center gap-1.5">
                    {BRAND.name.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-haccp-surface-800 text-haccp-400 px-1.5 py-0.5 rounded border border-haccp-surface-700">
                    OPS CENTER v4.2
                  </span>
                </div>

                {/* Status Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    isAttention
                      ? 'bg-haccp-critical-950/90 text-haccp-critical-300 border border-haccp-critical-700 animate-pulse'
                      : 'bg-haccp-950/90 text-haccp-300 border border-haccp-700'
                  }`}
                >
                  {isAttention ? (
                    <AlertTriangle className="w-3 h-3 text-haccp-critical-400" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-haccp-400" />
                  )}
                  <span>Status: {stats?.shiftStatus || 'NORMAL'}</span>
                </div>
              </div>

              {/* Plant Meta Details */}
              <div className="flex items-center gap-2 text-xs text-haccp-surface-400 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 text-haccp-surface-300 font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-haccp-surface-400" />
                  {timeString || '12:00:00 UTC'} • Shift A (06:00 - 14:00)
                </span>
                <span className="text-haccp-surface-600">•</span>
                <span className="text-haccp-400 font-medium text-[11px] truncate">
                  Active Control: {activePlanTitle}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Notification Center */}
            <NotificationCenter isDemoMode={isDemoMode} />

            {/* Demo Mode Toggle */}
            <button
              onClick={onToggleDemoMode}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isDemoMode
                  ? 'bg-gradient-to-r from-haccp-500 to-haccp-teal-500 text-haccp-surface-950 shadow-glow-green'
                  : 'bg-haccp-surface-800 hover:bg-haccp-surface-750 text-haccp-surface-200 border border-haccp-surface-700'
              }`}
              title={isDemoMode ? 'Exit Demo Mode' : 'Enter Demo Mode - Simplified Interface'}
            >
              {isDemoMode ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              <span>{isDemoMode ? 'Full Mode' : 'Demo Mode'}</span>
            </button>

            {/* Guided Tour */}
            <button
              onClick={onStartTour}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer bg-haccp-surface-800 hover:bg-haccp-surface-750 text-haccp-surface-200 border border-haccp-surface-700"
              title="Replay the guided tour of this dashboard"
            >
              <Sparkles className="w-3.5 h-3.5 text-haccp-400" />
              <span>Take the tour</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg text-haccp-surface-400 hover:text-haccp-surface-100 hover:bg-haccp-surface-800 transition"
              aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Plan Selector Dropdown (Desktop) */}
            <div className="hidden lg:relative">
              <button
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-haccp-surface-800 hover:bg-haccp-surface-750 text-haccp-surface-200 transition-colors border border-haccp-surface-700 cursor-pointer"
                id="plan-selector-btn"
              >
                <Cpu className="w-3.5 h-3.5 text-haccp-400" />
                <span>{plans.find(p => p.id === selectedPlanId)?.title || 'Select Line'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-haccp-surface-400" />
              </button>
              
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-72 glass-card rounded-xl border-haccp-surface-700 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden z-50"
              >
                <div className="p-2">
                  {plans.map((plan) => {
                    const breaks = unresolvedBreaksByPlan[plan.id] || 0;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => onSelectPlan(plan.id)}
                        className={`w-full p-3 rounded-lg text-left transition-all border cursor-pointer ${
                          selectedPlanId === plan.id
                            ? 'bg-haccp-950/50 border-haccp-500/30 text-haccp-surface-50'
                            : 'bg-haccp-surface-800/50 hover:bg-haccp-surface-700 border-haccp-surface-700 text-haccp-surface-300'
                        }`}
                      >
                        <div className="font-semibold">{plan.title}</div>
                        <div className="text-xs text-haccp-surface-500 flex items-center gap-1 mt-0.5">
                          {breaks > 0 ? (
                            <span className="flex items-center gap-1 text-haccp-critical-300">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {breaks} critical
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-haccp-400">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Nominal
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Recruiter Live Demo Scenario Quick Trigger */}
            <button
              id="run-recruiter-scenario-btn"
              onClick={onRunTestScenario}
              disabled={isSubmittingScenario}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-haccp-critical-600 to-haccp-critical-500 hover:from-haccp-critical-500 hover:to-haccp-critical-400 text-white transition-all shadow-glow-critical disabled:opacity-50 cursor-pointer"
              title="Execute the live business test scenario: Pasteurization 68.5°C Breach with Automated Valve Diversion"
            >
              <PlayCircle className="w-4 h-4 text-haccp-critical-200" />
              <span>{isSubmittingScenario ? 'Triping Interlock...' : '⚡ Simulate CCP Deviation'}</span>
            </button>

            {/* Regulatory Protocol Docs */}
            <button
              id="open-protocols-btn"
              onClick={onOpenProtocols}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-haccp-surface-800 hover:bg-haccp-surface-750 text-haccp-surface-200 transition-colors border border-haccp-surface-700 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-haccp-surface-400" />
              <span>HACCP Protocols</span>
            </button>

            {/* Reset Shift Ledger */}
            <button
              id="reset-ledger-btn"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-haccp-surface-400 hover:text-haccp-surface-200 bg-haccp-surface-900 hover:bg-haccp-surface-850 border border-haccp-surface-800 transition cursor-pointer"
              title="Reset ledger back to clean baseline shift state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};