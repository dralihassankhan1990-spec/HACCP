import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from './Header';
import { ComplianceHealthRing } from './ComplianceHealthRing';
import { HaccpPlanSelector } from './HaccpPlanSelector';
import { DigitalTwinPipeline } from './DigitalTwinPipeline';
import { DigitalAuditForm } from './DigitalAuditForm';
import { AuditLedger } from './AuditLedger';
import { ProtocolModal } from './ProtocolModal';
import { ScadaAlertToast } from './ScadaAlertToast';
import { DeviationStatusBanner } from './DeviationStatusBanner';
import { CapaWorkflowGuide } from './CapaWorkflowGuide';
import { GuidedTour, TOUR_STORAGE_KEY } from './GuidedTour';
import { 
  CriticalControlPoint, 
  AuditTrailItem, 
  ComplianceStats, 
  HaccpPlan,
  DeviationAlertItem
} from '../types';
import { AlertTriangle, RefreshCw, Shield, Sparkles, ChevronLeft, ShieldCheck, Siren, ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';
import { BRAND } from '../config/brand';

export function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPlanId = searchParams.get('plan') || 'milk';
  
  const [plans, setPlans] = useState<HaccpPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(urlPlanId);
  const [ccps, setCcps] = useState<CriticalControlPoint[]>([]);
  const [selectedCcpId, setSelectedCcpId] = useState<number | null>(null);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [ledger, setLedger] = useState<AuditTrailItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmittingScenario, setIsSubmittingScenario] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState<boolean>(false);
  const [showMobileMenu, setShowMobileMenu] = useState<boolean>(false);
  const [updatingResolutionId, setUpdatingResolutionId] = useState<number | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    digitalTwin: false,
    complianceMetrics: false,
    auditLedger: false,
    capaGuide: false,
  });

  // First-run guided tour — shows once, replayable from the header
  const [showTour, setShowTour] = useState<boolean>(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_STORAGE_KEY)) setShowTour(true);
    } catch {
      setShowTour(true);
    }
  }, []);
  const closeTour = useCallback(() => {
    setShowTour(false);
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, '1');
    } catch { /* private mode — tour will simply show again */ }
  }, []);

  // Live deviation alert state — drives the red alert lifecycle
  const [activeAlerts, setActiveAlerts] = useState<DeviationAlertItem[]>([]);
  const [latestResolutionId, setLatestResolutionId] = useState<number | null>(null);
  const [showAllClear, setShowAllClear] = useState<boolean>(true);
  const [focusedAuditId, setFocusedAuditId] = useState<number | null>(null);

  // Active breach item for Digital Twin animation
  const [recentBreach, setRecentBreach] = useState<AuditTrailItem | null>(null);

  // Fetch all initial data
  const fetchData = useCallback(async () => {
    try {
      const [plansRes, ccpsRes, statsRes, ledgerRes, resolutionsRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/ccps'),
        fetch(`/api/stats?plan_id=${selectedPlanId}`),
        fetch('/api/audit-trail'),
        fetch('/api/resolutions'),
      ]);

      const [plansData, ccpsData, statsData, ledgerData, resolutionsData] = await Promise.all([
        plansRes.json(),
        ccpsRes.json(),
        statsRes.json(),
        ledgerRes.json(),
        resolutionsRes.json(),
      ]);

      if (plansData.success && plansData.plans) {
        setPlans(plansData.plans);
      }

      if (ccpsData.success && ccpsData.ccps) {
        setCcps(ccpsData.ccps);
      }

      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }

      if (resolutionsData.success && resolutionsData.activeAlerts) {
        const forPlan: DeviationAlertItem[] = resolutionsData.activeAlerts.filter(
          (a: DeviationAlertItem) => a.plan_id === selectedPlanId
        );
        setActiveAlerts(forPlan);
      }

      if (ledgerData.success && ledgerData.ledger) {
        setLedger(ledgerData.ledger);
        // Digital Twin only animates a breach while the deviation is still unresolved.
        // Once the deviation is CLOSED or the lot REJECTED, the line returns to normal.
        const latestOpenFail = ledgerData.ledger.find(
          (item: AuditTrailItem) =>
            item.status === 'FAIL' &&
            item.plan_id === selectedPlanId &&
            item.deviation_status !== 'CLOSED' &&
            item.deviation_status !== 'PRODUCT_REJECTED'
        );
        setRecentBreach(latestOpenFail || null);
      }
    } catch (err) {
      console.error('Failed to load initial HACCP compliance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlanId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync URL with selected plan and demo mode
  useEffect(() => {
    if (urlPlanId !== selectedPlanId) {
      setSelectedPlanId(urlPlanId);
    }
    const demoParam = searchParams.get('demo');
    setIsDemoMode(demoParam === 'true');
  }, [urlPlanId, selectedPlanId, searchParams]);

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    setSearchParams({ plan: planId });
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
    // In demo mode, collapse complex sections by default
    if (!isDemoMode) {
      setCollapsedSections({
        digitalTwin: true,
        complianceMetrics: true,
        auditLedger: false,
        capaGuide: false,
      });
    } else {
      setCollapsedSections({
        digitalTwin: false,
        complianceMetrics: false,
        auditLedger: false,
        capaGuide: false,
      });
    }
  };

  // Unresolved breaks per plan for category badges — closed deviations do not count
  const unresolvedBreaksByPlan = useMemo(() => {
    const breaks: Record<string, number> = {};
    ledger.forEach((item) => {
      if (item.status === 'FAIL' && item.deviation_status !== 'CLOSED' && item.deviation_status !== 'PRODUCT_REJECTED') {
        const pid = item.plan_id || 'milk';
        breaks[pid] = (breaks[pid] || 0) + 1;
      }
    });
    return breaks;
  }, [ledger]);

  const activePlan = useMemo(() => 
    plans.find((p) => p.id === selectedPlanId) || plans[0] || {
      id: 'milk',
      title: 'Fluid Milk & HTST Dairy Processing',
      category: 'Dairy & Liquid Food',
      facility_line: 'Line 1 - High Velocity HTST Thermal Unit',
      regulatory_standard: 'FDA Grade "A" Pasteurized Milk Ordinance (PMO) & ISO 22000:2018',
      description: 'Automated high-temperature short-time pasteurization line with sanitary divert interlocks.',
      active_batch_default: 'BATCH-402',
      schematic_nodes: []
    }, 
  [plans, selectedPlanId]);

  // Submit Field Audit
  const handleAuditSubmit = async (formData: {
    ccp_id: number;
    inspector_name: string;
    recorded_value: number;
    comments: string;
    batch_number: string;
  }) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/audit/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        if (data.status === 'FAIL') {
          // A new deviation opens the alert lifecycle; the red state stays until it is closed.
          setLatestResolutionId(data.correctiveAction?.resolution_record_id ?? null);
          setShowAllClear(true);
          setRecentBreach(data.auditLog);
        } else {
          // If pass on the currently breached ccp, clear recent breach
          if (recentBreach?.ccp_code === data.auditLog.ccp_code) {
            setRecentBreach(null);
          }
        }
        await fetchData();
      } else {
        alert(`Audit submission error: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Network error during audit submission: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Live Business Test Scenario
  const handleRunTestScenario = async () => {
    setIsSubmittingScenario(true);
    try {
      const response = await fetch('/api/audit/simulate-test-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: selectedPlanId }),
      });

      const data = await response.json();

      if (data.success) {
        setLatestResolutionId(data.correctiveAction?.resolution_record_id ?? null);
        setShowAllClear(true);
        setRecentBreach(data.auditLog);
        await fetchData();
      } else {
        alert(`Test scenario failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Network error during test execution: ${err.message}`);
    } finally {
      setIsSubmittingScenario(false);
    }
  };

  // Trigger live IoT sensor reading
  const handleTriggerIotSample = async (ccpId: number) => {
    try {
      const response = await fetch('/api/audit/stream-iot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ccp_id: ccpId }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.status === 'FAIL') {
          setLatestResolutionId(data.correctiveAction?.resolution_record_id ?? null);
          setShowAllClear(true);
          setRecentBreach(data.auditLog);
        }
        await fetchData();
      }
    } catch (err) {
      console.error('IoT sample error:', err);
    }
  };

  // Advance / close a HACCP deviation resolution (Principle 5)
  const handleResolutionStatusChange = async (resolutionId: number, payload: Record<string, any>) => {
    setUpdatingResolutionId(resolutionId);
    try {
      const response = await fetch(`/api/resolutions/${resolutionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        await fetchData();
      } else {
        console.error('Resolution update rejected:', data.error);
        alert(data.error || 'Unable to update the deviation resolution.');
      }
    } catch (err) {
      console.error('Failed to update resolution status:', err);
      alert('Network error while updating the deviation resolution.');
    } finally {
      setUpdatingResolutionId(null);
    }
  };

  // Reset shift ledger
  const handleResetLedger = async () => {
    if (!window.confirm('Reset shift records to clean initial baseline state?')) return;
    setIsResetting(true);
    try {
      const response = await fetch('/api/audit/reset', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setRecentBreach(null);
        setActiveAlerts([]);
        setLatestResolutionId(null);
        setShowAllClear(false);
        setFocusedAuditId(null);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to reset shift:', err);
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-haccp-surface-950 text-haccp-surface-50 flex flex-col items-center justify-center p-4">
        <motion.div
          className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, rgb(34, 197, 94), rgb(20, 184, 166))' }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Shield className="w-8 h-8 text-haccp-surface-950" />
        </motion.div>
        <div className="text-sm font-bold tracking-wide text-haccp-300">INITIALIZING {BRAND.name.toUpperCase()} OPERATIONS CORE...</div>
        <div className="text-xs text-haccp-surface-500 font-mono mt-1">Connecting to SQLite WAL Database & Actuator Bus</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-haccp-surface-950 text-haccp-surface-100 flex flex-col selection:bg-haccp-500 selection:text-haccp-surface-950">
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-haccp-food-pattern opacity-10 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-radial from-haccp-950/20 via-transparent to-haccp-teal-950/10 pointer-events-none" />
      
      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-haccp-surface-950/95 backdrop-blur-xl"
          onClick={() => setShowMobileMenu(false)}
        >
          <div className="p-6 md:p-8 max-w-md mx-auto mt-20 glass-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-haccp-surface-50">Select Production Line</h2>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-lg text-haccp-surface-400 hover:text-haccp-surface-100 hover:bg-haccp-surface-800 transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => {
                    handlePlanChange(plan.id);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedPlanId === plan.id
                      ? 'bg-haccp-950/50 border-haccp-500/30 text-haccp-surface-50'
                      : 'bg-haccp-surface-800/50 border-haccp-surface-700 text-haccp-surface-300 hover:bg-haccp-surface-700 hover:border-haccp-500/30'
                  } border`}
                >
                  <div className="font-semibold mb-1">{plan.title}</div>
                  <div className="text-xs text-haccp-surface-500">{plan.facility_line}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* 1. Global Header Command Center */}
      <Header
        stats={stats}
        onRunTestScenario={handleRunTestScenario}
        onReset={handleResetLedger}
        onOpenProtocols={() => setIsProtocolModalOpen(true)}
        isSubmittingScenario={isSubmittingScenario}
        activePlanTitle={activePlan.title}
        plans={plans}
        selectedPlanId={selectedPlanId}
        onSelectPlan={handlePlanChange}
        showMobileMenu={showMobileMenu}
        setShowMobileMenu={setShowMobileMenu}
        unresolvedBreaksByPlan={unresolvedBreaksByPlan}
        isDemoMode={isDemoMode}
        onToggleDemoMode={toggleDemoMode}
        onStartTour={() => setShowTour(true)}
      />

      {/* Main SCADA Operations Floor */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        
        {/* 2. Top HACCP Plans & Production Line Category Selector */}
        <motion.div
          data-tour="plans"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-haccp-surface-50 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-haccp-500/20 border border-haccp-500/30 flex items-center justify-center text-xs font-bold text-haccp-400">1</span>
              Select Production Line
            </h3>
          </div>
          <HaccpPlanSelector
            plans={plans}
            selectedPlanId={selectedPlanId}
            onSelectPlan={handlePlanChange}
            unresolvedBreaksByPlan={unresolvedBreaksByPlan}
          />
        </motion.div>

        {/* CAPA Workflow Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-haccp-surface-50 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-haccp-500/20 border border-haccp-500/30 flex items-center justify-center text-xs font-bold text-haccp-400">2</span>
              CAPA Workflow (Trigger → Resolution)
            </h3>
            <button
              onClick={() => toggleSection('capaGuide')}
              className="p-1.5 rounded-lg bg-haccp-surface-800 hover:bg-haccp-surface-700 text-haccp-surface-400 transition-colors"
            >
              {collapsedSections.capaGuide ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
          {!collapsedSections.capaGuide && (
            <CapaWorkflowGuide isDemoMode={isDemoMode} />
          )}
        </motion.div>

        {/* 3. SCADA Digital Twin Process Schematic */}
        <motion.div
          data-tour="twin"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-haccp-surface-50 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-haccp-500/20 border border-haccp-500/30 flex items-center justify-center text-xs font-bold text-haccp-400">3</span>
              Process Flow & Digital Twin
            </h3>
            <button
              onClick={() => toggleSection('digitalTwin')}
              className="p-1.5 rounded-lg bg-haccp-surface-800 hover:bg-haccp-surface-700 text-haccp-surface-400 transition-colors"
            >
              {collapsedSections.digitalTwin ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
          {!collapsedSections.digitalTwin && (
            <DigitalTwinPipeline
              plan={activePlan}
              ccps={ccps}
              recentBreach={recentBreach}
              onSelectCcp={(ccpId) => setSelectedCcpId(ccpId)}
              selectedCcpId={selectedCcpId}
            />
          )}
        </motion.div>

        {/* 4. Shift Compliance Metrics Cockpit Gauges */}
        <motion.div
          data-tour="metrics"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-haccp-surface-50 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-haccp-500/20 border border-haccp-500/30 flex items-center justify-center text-xs font-bold text-haccp-400">5</span>
              Compliance Metrics
            </h3>
            <button
              onClick={() => toggleSection('complianceMetrics')}
              className="p-1.5 rounded-lg bg-haccp-surface-800 hover:bg-haccp-surface-700 text-haccp-surface-400 transition-colors"
            >
              {collapsedSections.complianceMetrics ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
          {!collapsedSections.complianceMetrics && (
            <ComplianceHealthRing
              stats={stats}
              activePlanTitle={activePlan.title}
            />
          )}
        </motion.div>

        {/* 5. Core Operational Split: Field Input & SCADA Audit Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-2">
          
          {/* Left Column: Digital Audit Form (5 Cols) */}
          <div className="lg:col-span-5" data-tour="form">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-haccp-surface-50 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-haccp-500/20 border border-haccp-500/30 flex items-center justify-center text-xs font-bold text-haccp-400">6</span>
                Input CCP Readings
              </h3>
            </div>
            <DigitalAuditForm
              plan={activePlan}
              ccps={ccps}
              selectedCcpId={selectedCcpId}
              onSelectCcpId={(id) => setSelectedCcpId(id)}
              onSubmitAudit={handleAuditSubmit}
              onTriggerIotSample={handleTriggerIotSample}
              isSubmitting={isSubmitting}
              isDemoMode={isDemoMode}
            />
          </div>

          {/* Right Column: Unalterable SQLite Audit Trail (7 Cols) */}
          <div className="lg:col-span-7" data-tour="ledger">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-haccp-surface-50 flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-haccp-500/20 border border-haccp-500/30 flex items-center justify-center text-xs font-bold text-haccp-400">7</span>
                Audit Ledger & Logs
              </h3>
              <button
                onClick={() => toggleSection('auditLedger')}
                className="p-1.5 rounded-lg bg-haccp-surface-800 hover:bg-haccp-surface-700 text-haccp-surface-400 transition-colors"
              >
                {collapsedSections.auditLedger ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
            {!collapsedSections.auditLedger && (
              <AuditLedger
                ledger={ledger}
                activePlanId={selectedPlanId}
                onSelectProtocol={() => setIsProtocolModalOpen(true)}
                onResetLedger={handleResetLedger}
                onTriggerTestScenario={handleRunTestScenario}
                isResetting={isResetting}
                onResolutionStatusChange={handleResolutionStatusChange}
                updatingResolutionId={updatingResolutionId}
                focusAuditLogId={focusedAuditId}
              />
            )}
          </div>

        </div>

      </main>

      {/* Live deviation alert lifecycle — red until every deviation is closed */}
      {showAllClear && (
        <ScadaAlertToast
          alerts={activeAlerts}
          latestResolutionId={latestResolutionId}
          onDismiss={() => { setShowAllClear(false); setLatestResolutionId(null); }}
          onAdvance={handleResolutionStatusChange}
          onOpenLedger={(auditLogId) => setFocusedAuditId(auditLogId)}
          updatingId={updatingResolutionId}
        />
      )}

      {/* Plant Control Status Banner — reflects the live deviation state */}
      <DeviationStatusBanner
        stats={stats}
        activePlanTitle={activePlan.title}
        onReopenAlerts={() => setShowAllClear(true)}
      />

      {/* ISO 22000 / HACCP Regulatory Dossier Modal */}
      <ProtocolModal
        isOpen={isProtocolModalOpen}
        onClose={() => setIsProtocolModalOpen(false)}
        plans={plans}
        ccps={ccps}
        activePlanId={selectedPlanId}
      />

      {/* First-run guided tour */}
      {showTour && <GuidedTour onClose={closeTour} />}

      {/* Footer */}
      <footer className="border-t border-haccp-surface-800 bg-haccp-surface-950/50 backdrop-blur-xl py-4 px-4 text-center text-xs text-haccp-surface-500 font-mono relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            {BRAND.name} • {BRAND.category} • Industrial Compliance Logger & Automated Interlocks
          </div>
          <div>
            Built with MPhil Food Safety Domain Depth × Enterprise Node.js SQLite WAL Architecture
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;