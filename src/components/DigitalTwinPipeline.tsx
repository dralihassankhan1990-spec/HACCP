import React from 'react';
import { HaccpPlan, CriticalControlPoint, AuditTrailItem } from '../types';
import { 
  Activity, 
  Cpu, 
  AlertOctagon, 
  CheckCircle2, 
  Radio, 
  ArrowRight, 
  ShieldAlert, 
  Zap, 
  Thermometer, 
  Gauge 
} from 'lucide-react';
import { motion } from 'motion/react';

interface DigitalTwinPipelineProps {
  plan: HaccpPlan;
  ccps: CriticalControlPoint[];
  recentBreach: AuditTrailItem | null;
  onSelectCcp: (ccpId: number) => void;
  selectedCcpId: number | null;
}

export const DigitalTwinPipeline: React.FC<DigitalTwinPipelineProps> = ({
  plan,
  ccps,
  recentBreach,
  onSelectCcp,
  selectedCcpId,
}) => {
  const isBreached = Boolean(recentBreach && recentBreach.plan_id === plan.id);

  return (
    <div className="bg-haccp-surface-900 border border-haccp-surface-800 rounded-2xl p-4 sm:p-5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] relative overflow-hidden">
      
      {/* Background Micro Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(74,85,69,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(74,85,69,0.15)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
      <div className="absolute inset-0 bg-haccp-food-pattern opacity-5" />

      {/* Top Header Information */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 relative z-10 border-b border-haccp-surface-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-haccp-500/10 border border-haccp-500/30 flex items-center justify-center text-haccp-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-haccp-surface-50 tracking-wide flex items-center gap-1.5">
                <span>DIGITAL TWIN:</span>
                <span className="text-haccp-400 font-mono">{plan.facility_line}</span>
              </h3>
              <span className="text-[10px] font-mono bg-haccp-surface-800 text-haccp-surface-300 px-2 py-0.5 rounded border border-haccp-surface-750">
                PLC Interlock: ONLINE
              </span>
            </div>
            <p className="text-xs text-haccp-surface-400 mt-0.5">
              Interactive process automation flow. Click any CCP node to load calibration parameters.
            </p>
          </div>
        </div>

        {/* Live Interlock Status Badge */}
        <div className="flex items-center gap-2">
          {isBreached ? (
            <div className="flex items-center gap-2 bg-haccp-critical-950/80 border border-haccp-critical-600 px-3 py-1.5 rounded-lg text-xs font-bold text-haccp-critical-300 animate-pulse">
              <AlertOctagon className="w-4 h-4 text-haccp-critical-400" />
              <span>ACTUATOR SAFETY TRIP ENGAGED</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-haccp-950/50 border border-haccp-700/50 px-3 py-1.5 rounded-lg text-xs font-semibold text-haccp-300">
              <span className="w-2 h-2 rounded-full bg-haccp-400 animate-pulse" />
              <span>CONTINUOUS INLINE FLOW NOMINAL</span>
            </div>
          )}
        </div>
      </div>

      {/* Process Nodes Pipeline View */}
      <div className="relative z-10 py-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-haccp-surface-700">
          {plan.schematic_nodes.map((node, index) => {
            const isLast = index === plan.schematic_nodes.length - 1;
            const matchingCcp = ccps.find((c) => c.ccp_code === node.ccpCode);
            const isTargetSelected = matchingCcp && selectedCcpId === matchingCcp.id;
            const nodeHasBreach = isBreached && matchingCcp && recentBreach?.ccp_code === matchingCcp.ccp_code;

            return (
              <React.Fragment key={node.id}>
                {/* Node Box */}
                <div
                  onClick={() => matchingCcp && onSelectCcp(matchingCcp.id)}
                  className={`shrink-0 p-3 rounded-xl border transition-all duration-200 text-left min-w-[140px] max-w-[170px] ${
                    nodeHasBreach
                      ? 'bg-haccp-critical-950/90 border-haccp-critical-500 shadow-lg ring-2'
                      : isTargetSelected
                      ? 'bg-haccp-950/80 border-haccp-400 shadow-md ring-1'
                      : node.isCcp
                      ? 'bg-haccp-surface-800/90 hover:bg-haccp-surface-750 border-haccp-warm-500/50 cursor-pointer'
                      : node.isActuator && isBreached
                      ? 'bg-haccp-critical-900/60 border-haccp-critical-400 animate-pulse'
                      : 'bg-haccp-surface-850/80 border-haccp-surface-750'
                  }`}
                  style={{
                    boxShadow: nodeHasBreach ? '0 10px 40px -10px rgba(244, 63, 94, 0.4)' : undefined,
                    borderColor: nodeHasBreach ? 'rgba(244, 63, 94, 0.8)' : isTargetSelected ? 'rgba(34, 197, 94, 0.8)' : node.isCcp ? 'rgba(245, 158, 11, 0.5)' : undefined,
                  }}
                >
                  {/* Node Type Label */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    {node.isCcp ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-haccp-warm-400/20 text-haccp-warm-300 border border-haccp-warm-400/30 flex items-center gap-1">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        {node.ccpCode}
                      </span>
                    ) : node.isActuator ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-haccp-teal-400/20 text-haccp-teal-300 border border-haccp-teal-400/30 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" />
                        ACTUATOR
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-haccp-surface-400">
                        STEP #{index + 1}
                      </span>
                    )}

                    {nodeHasBreach ? (
                      <span className="w-2 h-2 rounded-full bg-haccp-critical-500 animate-ping" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-haccp-400" />
                    )}
                  </div>

                  {/* Stage Title */}
                  <div className="text-xs font-bold text-haccp-surface-50 leading-tight">
                    {node.label}
                  </div>

                  {/* Telemetry metadata */}
                  <div className="mt-2 pt-1.5 border-t border-haccp-surface-700/60 flex items-center justify-between text-[10px] font-mono text-haccp-surface-400">
                    {node.temp && (
                      <span className="flex items-center gap-0.5 text-haccp-surface-300">
                        <Thermometer className="w-3 h-3 text-haccp-surface-400" />
                        {node.temp}
                      </span>
                    )}
                    {node.pressure && (
                      <span className="flex items-center gap-0.5 text-haccp-surface-300">
                        <Gauge className="w-3 h-3 text-haccp-surface-400" />
                        {node.pressure}
                      </span>
                    )}
                    {matchingCcp && (
                      <span className="text-haccp-warm-300 font-bold">
                        {matchingCcp.lower_limit}–{matchingCcp.upper_limit}{matchingCcp.unit_of_measure}
                      </span>
                    )}
                    {node.isActuator && (
                      <span className={isBreached ? 'text-haccp-critical-300 font-bold' : 'text-haccp-surface-400'}>
                        {isBreached ? 'TRIPPED (184ms)' : 'STANDBY'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pipeline Flow Connector */}
                {!isLast && (
                  <div className="shrink-0 flex items-center justify-center text-haccp-surface-600 px-1">
                    <ArrowRight className={`w-4 h-4 ${isBreached && index >= 3 ? 'text-haccp-critical-400' : 'text-haccp-surface-500'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Dynamic Divert Path Animation for Breaches */}
        {isBreached && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-xl bg-haccp-critical-950/80 border border-haccp-critical-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-haccp-critical-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Radio className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <div className="font-bold text-haccp-critical-200 flex items-center gap-2">
                  <span>AUTOMATED DIVERSION ROUTE ACTIVE</span>
                  <span className="bg-haccp-critical-800 text-white font-mono px-1.5 py-0.2 rounded text-[10px]">
                    INTERLOCK: ENGAGED
                  </span>
                </div>
                <p className="text-haccp-critical-300 mt-0.5 text-[11px] leading-relaxed">
                  {recentBreach?.action_triggered || 'Batch diversion solenoid engaged. Material re-routed to quarantine recycle tank.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 bg-haccp-critical-900/60 border border-haccp-critical-700/80 px-3 py-1.5 rounded-lg text-right font-mono text-[11px] text-haccp-critical-200">
              <div>Actuator: {recentBreach?.actuator_id || 'FDV-301-SOLENOID'}</div>
              <div>Quarantine: {recentBreach?.batch_number || 'BATCH-402'}</div>
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
};