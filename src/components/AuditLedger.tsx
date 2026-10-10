import React, { useEffect, useState } from 'react';
import { AuditTrailItem } from '../types';
import { ResolutionWorkflow } from './ResolutionWorkflow';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  Cpu, 
  Search, 
  Filter, 
  Download, 
  RotateCcw, 
  ShieldAlert, 
  Layers, 
  ExternalLink,
  Flame,
  Activity
} from 'lucide-react';

interface AuditLedgerProps {
  ledger: AuditTrailItem[];
  activePlanId: string;
  onSelectProtocol: (item: AuditTrailItem) => void;
  onResetLedger: () => Promise<void>;
  onTriggerTestScenario: () => Promise<void>;
  isResetting: boolean;
  onResolutionStatusChange: (resolutionId: number, payload: Record<string, any>) => Promise<void>;
  updatingResolutionId: number | null;
  /** Auto-expand and focus a specific audit log (e.g. from the active alert panel). */
  focusAuditLogId?: number | null;
}

export const AuditLedger: React.FC<AuditLedgerProps> = ({
  ledger,
  activePlanId,
  onSelectProtocol,
  onResetLedger,
  onTriggerTestScenario,
  isResetting,
  onResolutionStatusChange,
  updatingResolutionId,
  focusAuditLogId,
}) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');
  const [planFilterMode, setPlanFilterMode] = useState<'CURRENT' | 'ALL'>('CURRENT');

  // Expand + scroll to the requested record when it changes
  useEffect(() => {
    if (focusAuditLogId == null) return;
    setExpandedId(focusAuditLogId);
    setStatusFilter('ALL');
    setPlanFilterMode('ALL');
    setSearchTerm('');
    const timer = setTimeout(() => {
      document
        .querySelector(`[data-audit-row="${focusAuditLogId}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => clearTimeout(timer);
  }, [focusAuditLogId]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter items
  const filteredLedger = ledger.filter((item) => {
    // Plan filter
    if (planFilterMode === 'CURRENT' && item.plan_id && item.plan_id !== activePlanId) {
      return false;
    }
    // Status filter
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchInspector = item.inspector_name?.toLowerCase().includes(q);
      const matchBatch = item.batch_number?.toLowerCase().includes(q);
      const matchCcp = item.ccp_code?.toLowerCase().includes(q) || item.ccp_name?.toLowerCase().includes(q);
      const matchComments = item.comments?.toLowerCase().includes(q);
      return matchInspector || matchBatch || matchCcp || matchComments;
    }
    return true;
  });

  const handleExportCsv = () => {
    if (filteredLedger.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Plan', 'CCP Code', 'Stage', 'Recorded Value', 'Unit', 'Status', 'Batch', 'Inspector', 'Corrective Action', 'Actuator'];
    const rows = filteredLedger.map((i) => [
      i.id,
      i.timestamp,
      i.plan_id || 'milk',
      i.ccp_code,
      `"${i.process_stage.replace(/"/g, '""')}"`,
      i.recorded_value,
      i.unit_of_measure,
      i.status,
      i.batch_number,
      `"${i.inspector_name.replace(/"/g, '""')}"`,
      `"${(i.action_triggered || 'None').replace(/"/g, '""')}"`,
      `"${(i.actuator_id || 'N/A').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HACCP_Audit_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-haccp-surface-900 border border-haccp-surface-800 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col">
      
      {/* Ledger Header & Action Bar */}
      <div className="bg-haccp-surface-950 border-b border-haccp-surface-800 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-haccp-500/10 border border-haccp-500/30 flex items-center justify-center text-haccp-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wide text-haccp-surface-50 uppercase flex items-center gap-2">
              <span>UNALTERABLE COMPLIANCE AUDIT LEDGER</span>
              <span className="text-[10px] text-haccp-400 font-mono bg-haccp-950/60 px-2 py-0.5 rounded border border-haccp-800">
                SQLITE WAL ENGINE
              </span>
            </h2>
            <div className="text-[11px] text-haccp-surface-400">
              Immutable chain-of-custody records for regulatory certification & audits
            </div>
          </div>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="text-xs font-semibold text-haccp-surface-300 bg-haccp-surface-800 hover:bg-haccp-surface-750 px-2.5 py-1.5 rounded-lg transition border border-haccp-surface-700 flex items-center gap-1.5 cursor-pointer"
            title="Download CSV for official compliance records"
          >
            <Download className="w-3.5 h-3.5 text-haccp-surface-400" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={onResetLedger}
            disabled={isResetting}
            className="text-xs font-semibold text-haccp-surface-400 hover:text-haccp-surface-200 bg-haccp-surface-850 hover:bg-haccp-surface-800 px-2.5 py-1.5 rounded-lg transition border border-haccp-surface-750 flex items-center gap-1.5 cursor-pointer"
            title="Re-seed clean shift state"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Shift</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-haccp-surface-850/70 border-b border-haccp-surface-800 px-5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        {/* Left: Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Plan Scope Toggle */}
          <div className="inline-flex rounded-lg bg-haccp-surface-900 p-0.5 border border-haccp-surface-750">
            <button
              onClick={() => setPlanFilterMode('CURRENT')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                planFilterMode === 'CURRENT'
                  ? 'bg-haccp-600 text-haccp-surface-950 shadow-xs'
                  : 'text-haccp-surface-400 hover:text-haccp-surface-200'
              }`}
            >
              Current Plan Line
            </button>
            <button
              onClick={() => setPlanFilterMode('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                planFilterMode === 'ALL'
                  ? 'bg-haccp-600 text-haccp-surface-950 shadow-xs'
                  : 'text-haccp-surface-400 hover:text-haccp-surface-200'
              }`}
            >
              All Plant Lines
            </button>
          </div>

          <div className="h-4 w-px bg-haccp-surface-750 hidden sm:block" />

          {/* Status Filter */}
          <div className="inline-flex rounded-lg bg-haccp-surface-900 p-0.5 border border-haccp-surface-750">
            {(['ALL', 'PASS', 'FAIL'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setStatusFilter(mode)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  statusFilter === mode
                    ? mode === 'FAIL'
                      ? 'bg-haccp-critical-600 text-white shadow-xs'
                      : mode === 'PASS'
                      ? 'bg-haccp-600 text-haccp-surface-950 shadow-xs'
                      : 'bg-haccp-surface-750 text-haccp-surface-50 shadow-xs'
                    : 'text-haccp-surface-400 hover:text-haccp-surface-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <span className="text-haccp-surface-400 text-[11px] font-mono">
            Showing {filteredLedger.length} of {ledger.length} entries
          </span>
        </div>

        {/* Right: Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-haccp-surface-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inspector, batch, CCP..."
            className="w-full bg-haccp-surface-950 border border-haccp-surface-750 rounded-lg pl-8 pr-3 py-1.5 text-xs text-haccp-surface-50 placeholder-haccp-surface-500 focus:outline-hidden focus:ring-1 focus:ring-haccp-500"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-haccp-surface-950/80 border-b border-haccp-surface-800 text-[11px] font-mono uppercase text-haccp-surface-400">
              <th className="py-2.5 px-4 font-bold">Status</th>
              <th className="py-2.5 px-3 font-bold">Timestamp</th>
              <th className="py-2.5 px-3 font-bold">CCP Code</th>
              <th className="py-2.5 px-3 font-bold">Process Stage</th>
              <th className="py-2.5 px-3 font-bold">Reading</th>
              <th className="py-2.5 px-3 font-bold">Batch ID</th>
              <th className="py-2.5 px-3 font-bold">Inspector</th>
              <th className="py-2.5 px-4 font-bold text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-haccp-surface-800/60 font-sans">
            {filteredLedger.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-haccp-surface-500">
                  No compliance audit records match the selected filter parameters.
                </td>
              </tr>
            ) : (
              filteredLedger.map((item) => {
                const isPass = item.status === 'PASS';
                const isExpanded = expandedId === item.id;
                const formattedTime = new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const formattedDate = new Date(item.timestamp).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      data-audit-row={item.id}
                      onClick={() => toggleExpand(item.id)}
                      className={`hover:bg-haccp-surface-850/70 transition-colors cursor-pointer ${
                        !isPass ? 'bg-haccp-critical-950/20' : ''
                      }`}
                    >
                      {/* Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isPass ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase text-haccp-400 bg-haccp-950/80 border border-haccp-800 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] uppercase text-haccp-critical-300 bg-haccp-critical-950/90 border border-haccp-critical-700 px-2 py-0.5 rounded-full animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-haccp-critical-400" />
                            CRITICAL FAIL
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-3 whitespace-nowrap text-haccp-surface-300 font-mono text-[11px]">
                        <div>{formattedTime}</div>
                        <div className="text-[10px] text-haccp-surface-400">{formattedDate}</div>
                      </td>

                      {/* CCP Code & Plan */}
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-haccp-surface-50 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className={isPass ? 'text-haccp-400' : 'text-haccp-critical-400'}>
                            {item.ccp_code}
                          </span>
                          {item.plan_id && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-haccp-surface-800 text-haccp-surface-400 border border-haccp-surface-700">
                              {item.plan_id}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Process Stage */}
                      <td className="py-3 px-3 text-haccp-surface-300 max-w-[180px] truncate">
                        {item.process_stage}
                      </td>

                      {/* Reading vs Limits */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-haccp-surface-50">
                          <span className={isPass ? 'text-haccp-300' : 'text-haccp-critical-400 font-extrabold'}>
                            {item.recorded_value} {item.unit_of_measure}
                          </span>
                        </div>
                        <div className="text-[10px] text-haccp-surface-400 font-mono">
                          Limit: {item.lower_limit}–{item.upper_limit}
                        </div>
                      </td>

                      {/* Batch ID */}
                      <td className="py-3 px-3 whitespace-nowrap text-haccp-surface-300 font-mono text-[11px]">
                        {item.batch_number}
                      </td>

                      {/* Inspector */}
                      <td className="py-3 px-3 text-haccp-surface-300 max-w-[140px] truncate">
                        {item.inspector_name}
                      </td>

                      {/* Actions/Expand */}
                      <td className="py-3 px-4 whitespace-nowrap text-right text-haccp-surface-400">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isPass && item.action_triggered && (
                            <span className="text-[10px] bg-haccp-critical-900/60 border border-haccp-critical-700 text-haccp-critical-300 px-1.5 py-0.5 rounded font-mono">
                              SCADA TRIP
                            </span>
                          )}
                          {!isPass && item.deviation_status && (
                            <span
                              className={`text-[10px] border px-1.5 py-0.5 rounded font-mono ${
                                item.deviation_status === 'CLOSED'
                                  ? 'bg-haccp-950/60 border-haccp-800 text-haccp-400'
                                  : item.deviation_status === 'PRODUCT_REJECTED'
                                  ? 'bg-haccp-critical-950/60 border-haccp-critical-700 text-haccp-critical-300'
                                  : 'bg-haccp-warm-950/60 border-haccp-warm-700 text-haccp-warm-300'
                              }`}
                              title="HACCP deviation resolution status"
                            >
                              {item.deviation_status === 'OPEN_INVESTIGATION' ? 'DEVIATION OPEN' : item.deviation_status.replace(/_/g, ' ')}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(item.id);
                            }}
                            className="p-1 hover:text-haccp-surface-100 transition"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-haccp-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable SCADA Execution & Audit Detail Drawer */}
                    {isExpanded && (
                      <tr className="bg-haccp-surface-950/90 border-b border-haccp-surface-800">
                        <td colSpan={8} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            
                            {/* Left: Inspector Observations & Protocol Context */}
                            <div className="space-y-3 bg-haccp-surface-900 border border-haccp-surface-800 p-3.5 rounded-xl">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-haccp-surface-300 uppercase tracking-wider flex items-center gap-1.5">
                                  <ShieldAlert className="w-3.5 h-3.5 text-haccp-warm-400" />
                                  Regulatory Protocol & Hazard Context
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onSelectProtocol(item)}
                                  className="text-[10px] text-haccp-400 hover:text-haccp-300 underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>View ISO Standard Protocol</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>

                              <p className="text-haccp-surface-300 text-[11px] leading-relaxed">
                                {item.protocol_context}
                              </p>

                              <div className="pt-2 border-t border-haccp-surface-800 space-y-1">
                                <div className="text-[11px] text-haccp-surface-400">
                                  <strong>Field Notes:</strong>{' '}
                                  {item.comments ? (
                                    <span className="text-haccp-surface-200 italic">"{item.comments}"</span>
                                  ) : (
                                    <span className="text-haccp-surface-500">No extra observations noted.</span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-haccp-surface-400">
                                  Hazard Category: <span className="text-haccp-warm-300 font-semibold">{item.hazard_type}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right: SCADA Automated Corrective Action Workflow */}
                            <div className={`p-3.5 rounded-xl border ${
                              item.status === 'FAIL'
                                ? 'bg-haccp-critical-950/40 border-haccp-critical-800/80 text-haccp-critical-200'
                                : 'bg-haccp-surface-900 border-haccp-surface-800 text-haccp-surface-300'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                  <Cpu className="w-3.5 h-3.5 text-haccp-teal-400" />
                                   Automated Interlock Response
                                </span>
                                {item.action_logged_at && (
                                  <span className="text-[10px] font-mono text-haccp-surface-400">
                                    Triggered {new Date(item.action_logged_at).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>

                              {item.status === 'FAIL' && item.action_triggered ? (
                                <div className="space-y-2">
                                  <div className="font-bold text-haccp-critical-300 text-xs">
                                    {item.action_triggered}
                                  </div>
                                  <div className="text-[11px] text-haccp-critical-200 leading-relaxed">
                                    {item.resolution_notes}
                                  </div>

                                  {/* SCADA Telemetry Metadata JSON Box */}
                                  {item.scada_telemetry && (
                                    <div className="mt-2 p-2.5 rounded-lg bg-haccp-surface-950 border border-haccp-critical-900/60 font-mono text-[10px] text-haccp-surface-300 space-y-1">
                                      <div className="text-haccp-critical-400 font-bold uppercase text-[9px]">
                                        PLC Telemetry Stream Packet:
                                      </div>
                                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                        <div>Actuator: <strong className="text-haccp-surface-50">{item.scada_telemetry.actuator || item.actuator_id}</strong></div>
                                        <div>Valve Pos: <strong className="text-haccp-critical-400">{item.scada_telemetry.valve_position || 'DIVERTED'}</strong></div>
                                        <div>Trip Latency: <strong className="text-haccp-400">{item.scada_telemetry.divert_latency_ms || item.scada_telemetry.reject_latency_ms || 184} ms</strong></div>
                                        <div>Containment: <strong className="text-haccp-surface-50">{item.scada_telemetry.quarantine_tank || item.scada_telemetry.containment_bin || 'RECYCLE_SILO'}</strong></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="py-4 text-center text-haccp-surface-500 text-xs">
                                   ✓ Nominal Reading. Standard inline production flow maintained. No interlock trip required.
                                </div>
                              )}
                            </div>

                            {/* Full HACCP Deviation Resolution Workflow (Principle 5) */}
                            <div className="lg:col-span-2">
                              <ResolutionWorkflow
                                item={item}
                                updating={updatingResolutionId === item.resolution_record_id}
                                onStatusChange={onResolutionStatusChange}
                              />
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};