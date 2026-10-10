import React, { useState, useEffect } from 'react';
import { CriticalControlPoint, HaccpPlan } from '../types';
import { 
  ClipboardCheck, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  Cpu, 
  Radio, 
  Zap, 
  Sliders,
  AlertTriangle
} from 'lucide-react';

interface DigitalAuditFormProps {
  plan: HaccpPlan;
  ccps: CriticalControlPoint[];
  selectedCcpId: number | null;
  onSelectCcpId: (id: number) => void;
  onSubmitAudit: (data: {
    ccp_id: number;
    inspector_name: string;
    recorded_value: number;
    comments: string;
    batch_number: string;
  }) => Promise<void>;
  onTriggerIotSample: (ccpId: number) => Promise<void>;
  isSubmitting: boolean;
  isDemoMode?: boolean;
}

export const DigitalAuditForm: React.FC<DigitalAuditFormProps> = ({
  plan,
  ccps,
  selectedCcpId,
  onSelectCcpId,
  onSubmitAudit,
  onTriggerIotSample,
  isSubmitting,
  isDemoMode = false,
}) => {
  const [inspectorName, setInspectorName] = useState<string>('John Doe (Shift Lead)');
  const [recordedValue, setRecordedValue] = useState<string>('68.5');
  const [batchNumber, setBatchNumber] = useState<string>(plan.active_batch_default || 'BATCH-402');
  const [comments, setComments] = useState<string>('Steam valve pressure fluctuated briefly during batch #402.');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isStreamingIot, setIsStreamingIot] = useState<boolean>(false);

  // When plan changes, set default CCP and batch
  useEffect(() => {
    if (ccps.length > 0) {
      const planCcps = ccps.filter((c) => c.plan_id === plan.id);
      if (planCcps.length > 0) {
        if (!selectedCcpId || !planCcps.some((c) => c.id === selectedCcpId)) {
          onSelectCcpId(planCcps[0].id);
        }
      }
    }
    setBatchNumber(plan.active_batch_default || 'BATCH-402');
  }, [plan.id, ccps]);

  const activePlanCcps = ccps.filter((c) => !c.plan_id || c.plan_id === plan.id);
  const selectedCcp = activePlanCcps.find((c) => c.id === selectedCcpId) || activePlanCcps[0];

  // Update default comments and sample values when selected CCP changes
  useEffect(() => {
    if (selectedCcp) {
      if (selectedCcp.ccp_code === 'CCP-1A') {
        setRecordedValue('68.5');
        setComments('Steam valve pressure fluctuated briefly during batch #402.');
      } else if (selectedCcp.ccp_code === 'CCP-2C') {
        setRecordedValue('2.1');
        setComments('Inline metal sentry triggered on Tub #892. Stainless steel particle detected.');
      } else if (selectedCcp.ccp_code === 'CCP-3A') {
        setRecordedValue('88.0');
        setComments('Tunnel burner Zone 3 gas pressure dropped. Crumb temperature under lethality limit.');
      } else if (selectedCcp.ccp_code === 'CCP-4A') {
        setRecordedValue('71.2');
        setComments('Internal core probe read 71.2°C at cycle conclusion. Fails USDA 74.0°C standard.');
      }
    }
  }, [selectedCcp?.id]);

  const numVal = parseFloat(recordedValue);
  const hasValue = !isNaN(numVal);
  const isBreach = selectedCcp && hasValue && (numVal < selectedCcp.lower_limit || numVal > selectedCcp.upper_limit);

  // Quick Preset Handlers
  const handleLoadBreachPreset = () => {
    if (!selectedCcp) return;
    if (selectedCcp.ccp_code === 'CCP-1A') {
      setRecordedValue('68.5');
      setComments('Steam valve pressure fluctuated briefly during batch #402.');
    } else if (selectedCcp.ccp_code === 'CCP-2C') {
      setRecordedValue('2.1');
      setComments('Inline eddy-current sensor detected 2.1mm metal particle in sealed tub.');
    } else if (selectedCcp.ccp_code === 'CCP-3A') {
      setRecordedValue('88.0');
      setComments('Convection oven burner failure. Crumb core temperature dropped to 88.0°C.');
    } else if (selectedCcp.ccp_code === 'CCP-4A') {
      setRecordedValue('71.2');
      setComments('USDA lethality failure: core meat temperature stalled at 71.2°C.');
    } else {
      setRecordedValue(String(selectedCcp.lower_limit - 2));
      setComments(`Operational parameter breach below legal threshold of ${selectedCcp.lower_limit}${selectedCcp.unit_of_measure}.`);
    }
    setValidationError(null);
  };

  const handleLoadPassPreset = () => {
    if (!selectedCcp) return;
    const nominal = ((selectedCcp.lower_limit + selectedCcp.upper_limit) / 2).toFixed(1);
    setRecordedValue(nominal);
    setComments(`Routine operational audit. Telemetry verified within legal limits (${selectedCcp.lower_limit}–${selectedCcp.upper_limit} ${selectedCcp.unit_of_measure}).`);
    setValidationError(null);
  };

  const handleIotSample = async () => {
    if (!selectedCcp) return;
    setIsStreamingIot(true);
    try {
      await onTriggerIotSample(selectedCcp.id);
    } finally {
      setIsStreamingIot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!selectedCcp) {
      setValidationError('Please select a valid Critical Control Point.');
      return;
    }

    if (!inspectorName.trim()) {
      setValidationError('Inspector name is required by ISO 22000 regulatory mandate.');
      return;
    }

    if (isNaN(numVal)) {
      setValidationError('Please input a valid numeric reading.');
      return;
    }

    await onSubmitAudit({
      ccp_id: selectedCcp.id,
      inspector_name: inspectorName.trim(),
      recorded_value: numVal,
      batch_number: batchNumber.trim() || plan.active_batch_default,
      comments: comments.trim(),
    });
  };

  return (
    <div className="bg-haccp-surface-900 border border-haccp-surface-800 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col">
      
      {/* Cockpit Card Header */}
      <div className="bg-haccp-surface-950 border-b border-haccp-surface-800 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-haccp-500/10 border border-haccp-500/30 flex items-center justify-center text-haccp-400">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-wide text-haccp-surface-50 uppercase flex items-center gap-2">
              <span>FIELD AUDIT CALIBRATION INPUT</span>
              <span className="text-[10px] text-haccp-400 font-mono bg-haccp-950/60 px-2 py-0.5 rounded border border-haccp-800">
                {plan.id.toUpperCase()}
              </span>
            </h2>
            <div className="text-[11px] text-haccp-surface-400">
              Regulatory Framework: {plan.regulatory_standard.split('&')[0]}
            </div>
          </div>
        </div>

        <span className="text-[10px] font-bold bg-haccp-surface-850 text-haccp-surface-300 px-2.5 py-1 rounded font-mono border border-haccp-surface-750">
          ISO 22000 PRINCIPLE 4
        </span>
      </div>

      {/* Workflow Guide */}
      {isDemoMode && (
        <div className="bg-haccp-950/60 border-b border-haccp-surface-800 px-5 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-haccp-400" />
            <span className="text-xs font-bold text-haccp-300">CCP Trigger Workflow:</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-haccp-surface-400 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-haccp-500/20 border border-haccp-500/30 flex items-center justify-center text-[10px] font-bold text-haccp-400">6</span>
              Select CCP
            </span>
            <ArrowRight className="w-3 h-3 text-haccp-surface-600" />
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-haccp-500/20 border border-haccp-500/30 flex items-center justify-center text-[10px] font-bold text-haccp-400">7</span>
              Enter Reading
            </span>
            <ArrowRight className="w-3 h-3 text-haccp-surface-600" />
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-haccp-500/20 border border-haccp-500/30 flex items-center justify-center text-[10px] font-bold text-haccp-400">8</span>
              Submit Trigger
            </span>
            <ArrowRight className="w-3 h-3 text-haccp-surface-600" />
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded bg-haccp-500/20 border border-haccp-500/30 flex items-center justify-center text-[10px] font-bold text-haccp-400">9</span>
              View CAPA
            </span>
          </div>
        </div>
      )}

      {/* Quick Action Presets */}
      <div className="bg-haccp-surface-850/80 border-b border-haccp-surface-800 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-semibold text-haccp-surface-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-haccp-critical-400" />
          <span>Quick Simulation Presets:</span>
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleLoadBreachPreset}
            className="text-xs font-bold text-haccp-critical-300 bg-haccp-critical-950/80 hover:bg-haccp-critical-900 px-3 py-1.5 rounded-lg transition-colors border border-haccp-critical-700/80 cursor-pointer"
            title="Load an intentional failure reading to trigger the automated safety interlock"
          >
            ⚠️ Load Breach
          </button>
          <button
            type="button"
            onClick={handleLoadPassPreset}
            className="text-xs font-medium text-haccp-300 bg-haccp-950/80 hover:bg-haccp-900 px-3 py-1.5 rounded-lg transition-colors border border-haccp-700/80 cursor-pointer"
          >
            ✓ Load Pass
          </button>
          <button
            type="button"
            onClick={handleIotSample}
            disabled={isStreamingIot}
            className="text-xs font-semibold text-haccp-teal-300 bg-haccp-teal-950/80 hover:bg-haccp-teal-900 px-3 py-1.5 rounded-lg transition-colors border border-haccp-teal-700/80 cursor-pointer flex items-center gap-1"
            title="Stream an automated live IoT sensor reading directly into the database"
          >
            <Radio className={`w-3 h-3 ${isStreamingIot ? 'animate-spin' : ''}`} />
            <span>{isStreamingIot ? 'Sampling...' : 'IoT Sample'}</span>
          </button>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-5 space-y-5 text-haccp-surface-200">
        
        {/* 1. Select CCP for the Active Plan */}
        <div>
          <label htmlFor="ccp-select" className="block text-[11px] font-bold text-haccp-surface-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Select CCP Target for {plan.title}:</span>
            <span className="text-[10px] text-haccp-400 font-mono">
              {activePlanCcps.length} Regulated CCPs Active
            </span>
          </label>
          <select
            id="ccp-select"
            value={selectedCcp?.id || ''}
            onChange={(e) => onSelectCcpId(Number(e.target.value))}
            className="w-full text-xs font-semibold bg-haccp-surface-950 border border-haccp-surface-750 rounded-xl px-3.5 py-2.5 text-haccp-surface-50 focus:outline-hidden focus:ring-2 focus:ring-haccp-500 focus:border-haccp-500 transition"
          >
            {activePlanCcps.map((c) => (
              <option key={c.id} value={c.id}>
                {c.ccp_name} — [{c.lower_limit} to {c.upper_limit} {c.unit_of_measure}]
              </option>
            ))}
          </select>
          
          {selectedCcp && (
            <div className="mt-2 p-2.5 rounded-lg bg-haccp-surface-950/60 border border-haccp-surface-800 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-haccp-surface-400">
                <span>Stage: <strong className="text-haccp-surface-200">{selectedCcp.process_stage}</strong></span>
                <span>Limit: <strong className="text-haccp-400 font-mono">{selectedCcp.lower_limit} – {selectedCcp.upper_limit} {selectedCcp.unit_of_measure}</strong></span>
              </div>
              <div className="flex items-center justify-between text-haccp-surface-400 font-mono">
                <span>Hazard: <span className="text-haccp-warm-300">{selectedCcp.hazard_type}</span></span>
                <span>Actuator: <span className="text-haccp-teal-300">{selectedCcp.actuator_id || 'SCADA-AUTO'}</span></span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Inspector Identity */}
        <div>
          <label htmlFor="inspector-name" className="block text-[11px] font-bold text-haccp-surface-300 uppercase tracking-wider mb-1.5">
            Inspector Name / Operator Call-Sign:
          </label>
          <input
            id="inspector-name"
            type="text"
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
            placeholder="e.g. John Doe (Shift Lead)"
            className="w-full text-xs bg-haccp-surface-950 border border-haccp-surface-750 rounded-xl px-3.5 py-2 text-haccp-surface-50 focus:outline-hidden focus:ring-2 focus:ring-haccp-500 transition"
            required
          />
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-haccp-surface-400">Quick sign:</span>
            {['John Doe (Shift Lead)', 'Sarah Jenkins (QC Tech)', 'Marcus Vance (Lead Tech)', 'Elena Rostova (Master Baker)'].map((name) => (
              <button
                type="button"
                key={name}
                onClick={() => setInspectorName(name)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                  inspectorName === name
                    ? 'bg-haccp-600 text-haccp-surface-950 border-haccp-500 font-bold'
                    : 'bg-haccp-surface-800 text-haccp-surface-400 border-haccp-surface-750 hover:bg-haccp-surface-750'
                }`}
              >
                {name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Recorded Value Reading & Batch ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="recorded-value" className="block text-[11px] font-bold text-haccp-surface-300 uppercase tracking-wider mb-1.5">
              Live Reading:
            </label>
            <div className="relative">
              <input
                id="recorded-value"
                type="number"
                step="0.1"
                value={recordedValue}
                onChange={(e) => setRecordedValue(e.target.value)}
                placeholder="68.5"
                className={`w-full text-base font-black rounded-xl pl-3.5 pr-14 py-2 border transition font-mono ${
                  isBreach
                    ? 'bg-haccp-critical-950/80 border-haccp-critical-500 text-haccp-critical-200 focus:ring-haccp-critical-500'
                    : 'bg-haccp-surface-950 border-haccp-surface-750 text-haccp-surface-50 focus:ring-haccp-500'
                }`}
                required
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-haccp-surface-400 font-mono">
                {selectedCcp?.unit_of_measure || '°C'}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="batch-number" className="block text-[11px] font-bold text-haccp-surface-300 uppercase tracking-wider mb-1.5">
              Manufacturing Batch ID:
            </label>
            <input
              id="batch-number"
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              placeholder={plan.active_batch_default}
              className="w-full text-xs font-mono font-bold bg-haccp-surface-950 border border-haccp-surface-750 rounded-xl px-3.5 py-2.5 text-haccp-surface-50 focus:outline-hidden focus:ring-2 focus:ring-haccp-500 transition"
              required
            />
          </div>
        </div>

        {/* Real-Time Threshold Tolerance Bar */}
        {selectedCcp && hasValue && (
          <div className="p-3 rounded-xl bg-haccp-surface-950 border border-haccp-surface-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-haccp-surface-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-haccp-surface-400" />
                Tolerance Compliance Envelope:
              </span>
              <span className={`font-bold font-mono text-[11px] px-2 py-0.5 rounded ${
                isBreach ? 'bg-haccp-critical-900/60 text-haccp-critical-300 border border-haccp-critical-700' : 'bg-haccp-900/60 text-haccp-300 border border-haccp-700'
              }`}>
                {isBreach ? '⚠️ CRITICAL LIMIT BREACH' : '✓ LEGAL RANGE VERIFIED'}
              </span>
            </div>

            {/* Visual Tolerance Bar */}
            <div className="space-y-1">
              <div className="relative h-3 bg-haccp-surface-800 rounded-full overflow-hidden border border-haccp-surface-700">
                <div className="absolute inset-y-0 left-1/4 right-1/4 bg-haccp-500/20 border-x border-haccp-500" />
                <div 
                  className={`absolute inset-y-0 w-2.5 rounded-full ${isBreach ? 'bg-haccp-critical-500 animate-ping' : 'bg-haccp-400'}`}
                  style={{
                    left: `${Math.min(Math.max(((numVal - selectedCcp.lower_limit) / (selectedCcp.upper_limit - selectedCcp.lower_limit)) * 50 + 25, 5), 95)}%`
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-haccp-surface-400">
                <span>Lower Limit: {selectedCcp.lower_limit} {selectedCcp.unit_of_measure}</span>
                <span className="text-haccp-surface-50 font-bold">Input: {numVal} {selectedCcp.unit_of_measure}</span>
                <span>Upper Limit: {selectedCcp.upper_limit} {selectedCcp.unit_of_measure}</span>
              </div>
            </div>

            <div className="text-[11px] text-haccp-surface-400 leading-tight pt-1">
              {isBreach ? (
                <div className="bg-haccp-critical-950/60 border border-haccp-critical-700/50 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-haccp-critical-300 font-bold mb-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>CRITICAL LIMIT BREACH</span>
                  </div>
                  <p className="text-haccp-critical-200">
                    Breach will immediately trip <strong>{selectedCcp.actuator_name || selectedCcp.actuator_id}</strong>, dump batch to quarantine, and log nonconformity under ISO 22000:2018 Clause 8.9.2.
                  </p>
                </div>
              ) : (
                <div className="bg-haccp-950/60 border border-haccp-700/50 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-haccp-400 font-bold mb-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>LEGAL RANGE VERIFIED</span>
                  </div>
                  <p className="text-haccp-300">
                    Reading satisfies regulatory lethality/physical safety threshold. Audit will commit as PASS.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Comments / Field Observation */}
        <div>
          <label htmlFor="inspector-comments" className="block text-[11px] font-bold text-haccp-surface-300 uppercase tracking-wider mb-1.5">
            Log Comments & Sensory Observations:
          </label>
          <textarea
            id="inspector-comments"
            rows={2}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Field observation notes..."
            className="w-full text-xs bg-haccp-surface-950 border border-haccp-surface-750 rounded-xl p-3 text-haccp-surface-50 focus:outline-hidden focus:ring-2 focus:ring-haccp-500 transition resize-none"
          />
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-3 bg-haccp-critical-950/80 border border-haccp-critical-600 rounded-xl text-haccp-critical-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* 5. Submit Audit Log Button */}
        <button
          id="submit-audit-btn"
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-haccp-surface-950 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 ${
            isBreach
              ? 'bg-gradient-to-r from-haccp-critical-600 to-haccp-critical-500 hover:from-haccp-critical-500 hover:to-haccp-critical-400'
              : 'bg-gradient-to-r from-haccp-600 to-haccp-teal-600 hover:from-haccp-500 hover:to-haccp-teal-500'
          }`}
        >
          <span>{isSubmitting ? 'COMMITTING TO SQLITE LEDGER...' : '📄 SUBMIT DIGITAL AUDIT RECORD'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[10px] text-haccp-surface-500 text-center font-mono">
          Cryptographically timestamped & persisted to SQLite WAL. Audit records cannot be backdated or modified.
        </p>

      </form>
    </div>
  );
};