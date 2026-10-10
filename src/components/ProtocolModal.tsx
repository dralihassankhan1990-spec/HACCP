import React from 'react';
import { X, ShieldCheck, Cpu, Database, AlertCircle, Award, CheckCircle, FileText, Globe } from 'lucide-react';
import { CriticalControlPoint, HaccpPlan } from '../types';
import { motion } from 'motion/react';

interface ProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: HaccpPlan[];
  ccps: CriticalControlPoint[];
  activePlanId: string;
}

export const ProtocolModal: React.FC<ProtocolModalProps> = ({ isOpen, onClose, plans, ccps, activePlanId }) => {
  if (!isOpen) return null;

  const currentPlan = plans.find((p) => p.id === activePlanId) || plans[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-haccp-surface-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-haccp-surface-900 text-haccp-surface-200 rounded-2xl max-w-4xl w-full border border-haccp-surface-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-haccp-surface-950 text-haccp-surface-50 p-5 border-b border-haccp-surface-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-haccp-surface-950 shadow-lg"
              style={{ background: 'linear-gradient(135deg, rgb(34, 197, 94), rgb(20, 184, 166))' }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <ShieldCheck className="w-6 h-6" />
            </motion.div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Veritas HACCP Multi-Plan Regulatory Dossier</span>
                <span className="text-[10px] bg-haccp-surface-800 text-haccp-400 font-mono px-2 py-0.5 rounded border border-haccp-surface-700">
                  ISO 22000:2018
                </span>
              </h3>
              <p className="text-xs text-haccp-surface-400">
                Bridging Global Food Safety Standard Operating Procedures with Industrial SCADA Interlocks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-haccp-surface-400 hover:text-haccp-surface-100 hover:bg-haccp-surface-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-haccp-surface-300">
          
          {/* Author Profile Context */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-haccp-surface-950 to-haccp-surface-900 border border-haccp-500/40 rounded-xl p-4 flex items-start gap-3.5"
          >
            <Award className="w-6 h-6 text-haccp-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <div className="font-bold text-sm text-haccp-300">
                Cross-Disciplinary Engineering: MPhil Food Safety × Senior IT Operations Architecture
              </div>
              <p className="mt-1 text-haccp-surface-300 text-[11px] leading-relaxed">
                Veritas HACCP bridges deep domain understanding of biological, physical, and chemical pathogen control (7 HACCP Principles, FDA PMO, USDA FSIS 9 CFR 417, AIB International, and Codex Alimentarius) with deterministic PLC automation, sub-second actuator tripping, and tamper-evident SQLite WAL ledgering.
              </p>
            </div>
          </motion.div>

          {/* 4 Multi-Plan Regulatory Standards Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h4 className="text-xs font-bold text-haccp-surface-50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-haccp-400" />
              Supported Industrial Production Lines & Governing Standards
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {plans.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-3.5 rounded-xl bg-haccp-surface-950 border border-haccp-surface-800 space-y-1.5 hover:border-haccp-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-haccp-surface-50 text-xs">{p.title}</span>
                    <span className="text-[10px] font-mono text-haccp-400 bg-haccp-950/60 px-1.5 py-0.5 rounded border border-haccp-800">
                      {p.id.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-haccp-surface-400">
                    <strong>Facility Line:</strong> {p.facility_line}
                  </div>
                  <div className="text-[10px] font-mono text-haccp-warm-300/90 bg-haccp-surface-900 p-1.5 rounded border border-haccp-surface-800">
                    {p.regulatory_standard}
                  </div>
                  <p className="text-[11px] text-haccp-surface-400 leading-snug">
                    {p.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Active Critical Control Points in Database */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-xs font-bold text-haccp-surface-50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-haccp-400" />
              Active Critical Control Points (CCPs) for {currentPlan.title}
            </h4>
            <div className="space-y-2.5">
              {ccps.filter(c => !c.plan_id || c.plan_id === activePlanId).map((ccp, i) => (
                <motion.div
                  key={ccp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="p-3.5 rounded-xl border border-haccp-surface-800 bg-haccp-surface-950 space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-haccp-surface-50 flex items-center gap-2">
                      <span className="bg-haccp-600 text-haccp-surface-950 text-xs px-2 py-0.5 rounded font-mono font-black">
                        {ccp.ccp_code}
                      </span>
                      <span>{ccp.ccp_name}</span>
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-haccp-surface-900 border border-haccp-surface-750 text-haccp-400">
                      Limits: {ccp.lower_limit} – {ccp.upper_limit} {ccp.unit_of_measure}
                    </span>
                  </div>
                  
                  <div className="text-[11px] text-haccp-surface-400 flex items-center gap-3 flex-wrap">
                    <span><strong>Process Stage:</strong> {ccp.process_stage}</span>
                    <span>•</span>
                    <span><strong>Hazard:</strong> <span className="text-haccp-warm-300">{ccp.hazard_type}</span></span>
                    <span>•</span>
                    <span><strong>Actuator:</strong> <span className="text-haccp-teal-300 font-mono">{ccp.actuator_name || ccp.actuator_id}</span></span>
                  </div>

                  <p className="text-[11px] text-haccp-surface-300 leading-relaxed bg-haccp-surface-900/80 p-2.5 rounded-lg border border-haccp-surface-800/80 font-mono">
                    {ccp.protocol_context}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Automation Architecture */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="border-t border-haccp-surface-800 pt-4"
          >
            <h4 className="text-xs font-bold text-haccp-surface-50 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-haccp-teal-400" />
              Tripartite Industrial SCADA Automation Tripping
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-haccp-surface-950 border border-haccp-surface-800 space-y-1">
                <div className="font-bold text-haccp-surface-50 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-haccp-400" />
                  1. Server-Side Enforcement
                </div>
                <p className="text-haccp-surface-400 text-[11px] leading-relaxed">
                  Evaluates reading against strict legal bounds on Express server. Client-side state tampering is mathematically barred.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-haccp-surface-950 border border-haccp-surface-800 space-y-1">
                <div className="font-bold text-haccp-surface-50 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-haccp-critical-400" />
                  2. Sub-200ms Actuator Tripping
                </div>
                <p className="text-haccp-surface-400 text-[11px] leading-relaxed">
                  Instantaneous trigger of diverter solenoids, pneumatic reject blast rams, or thermal hold locks via simulated PLC register commands.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-haccp-surface-950 border border-haccp-surface-800 space-y-1">
                <div className="font-bold text-haccp-surface-50 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-haccp-teal-400" />
                  3. ISO 22000 Audit Lock
                </div>
                <p className="text-haccp-surface-400 text-[11px] leading-relaxed">
                  Generates an unalterable audit row and foreign-keyed corrective action record with SCADA hardware latency logs.
                </p>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Footer */}
        <div className="bg-haccp-surface-950 border-t border-haccp-surface-800 p-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-haccp-600 to-haccp-teal-600 hover:from-haccp-500 hover:to-haccp-teal-500 text-haccp-surface-950 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Close Regulatory Dossier
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
};