import React, { useEffect, useLayoutEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Sparkles } from 'lucide-react';

interface TourStep {
  /** value of the data-tour attribute to anchor to; omit for a centered card */
  target?: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    title: 'Welcome to your digital CCP control room',
    body: 'This is a working HACCP compliance prototype: live CCP monitoring, deviation detection, corrective-action workflows and an audit ledger — all running on a local database. This 60-second tour shows you where everything lives. Nothing here sends data anywhere; it is all simulated for demonstration.',
  },
  {
    target: 'plans',
    title: '1 · Select a production line',
    body: 'Four built-in HACCP plans (dairy, ice cream, bakery, RTE meat), each with its own CCPs, critical limits and regulatory standard. The red badge on a plan means it has an unresolved deviation right now.',
  },
  {
    target: 'twin',
    title: '2 · Process flow & digital twin',
    body: 'A live schematic of the line. Nodes light up as product moves; a CCP node turns red the moment its limit is breached. Click any CCP node to load it into the reading form.',
  },
  {
    target: 'metrics',
    title: '3 · Compliance metrics',
    body: 'Shift-level health at a glance: compliance rate, open vs closed deviations, and automated actions executed. These numbers are computed live from the audit ledger — never hard-coded.',
  },
  {
    target: 'form',
    title: '4 · Log a CCP reading',
    body: 'The digital replacement for the paper logbook. Enter a reading (or fire a simulated IoT sample). A value outside the critical limits instantly opens a deviation and triggers the corrective-action workflow — no silent failures.',
  },
  {
    target: 'ledger',
    title: '5 · Audit ledger & deviation resolution',
    body: 'Every reading lands here in an append-only trail. Open a failed row to walk the full Principle-5 workflow: root-cause analysis, corrective steps with owners and evidence, verification, preventive actions and revalidation — then close the deviation.',
  },
  {
    title: 'Try the 5-minute demo',
    body: 'Fastest way to see it end-to-end: press "Simulate CCP Deviation" in the header above, watch the twin node go red and the alert toast appear, then open the failed row in the Audit Ledger and resolve it step by step. The DEMO-GUIDE.md file in the project walks you through it click by click.',
  },
];

interface GuidedTourProps {
  onClose: () => void;
}

interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);
  const step = STEPS[stepIndex];

  useLayoutEffect(() => {
    const update = () => {
      if (!step.target) {
        setAnchor(null);
        return;
      }
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (!el) {
        setAnchor(null);
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Measure after the scroll settles
      window.setTimeout(() => {
        const r = el.getBoundingClientRect();
        setAnchor({ top: r.top, left: r.left, width: r.width, height: r.height });
      }, 350);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [stepIndex, step.target]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
      if (e.key === 'ArrowLeft') setStepIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isLast = stepIndex === STEPS.length - 1;

  // Position the card: prefer below the anchor, else above, else centered
  const cardStyle: React.CSSProperties = (() => {
    if (!anchor) return {};
    const cardW = 340;
    const gap = 16;
    let left = Math.min(Math.max(16, anchor.left), window.innerWidth - cardW - 16);
    let top = anchor.top + anchor.height + gap;
    if (top + 300 > window.innerHeight) top = Math.max(16, anchor.top - 300 - gap);
    return { left, top, width: cardW };
  })();

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Guided tour">
      {/* dim layer with a spotlight cutout around the anchor */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      {anchor && (
        <div
          className="absolute rounded-xl border-2 border-haccp-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.72)] pointer-events-none transition-all duration-300"
          style={{ top: anchor.top - 8, left: anchor.left - 8, width: anchor.width + 16, height: anchor.height + 16 }}
        />
      )}

      {/* tour card */}
      <div
        className={`absolute bg-haccp-surface-900 border border-haccp-500/40 rounded-2xl shadow-2xl p-5 ${
          anchor ? '' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,430px)]'
        }`}
        style={anchor ? cardStyle : undefined}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-haccp-300">
            {stepIndex === 0 ? <Sparkles className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            <span className="text-xs font-bold uppercase tracking-wider">
              Tour · {stepIndex + 1} of {STEPS.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-haccp-surface-400 hover:text-white hover:bg-haccp-surface-800 transition-colors"
            aria-label="Close tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
        <p className="text-sm text-haccp-surface-300 leading-relaxed mb-4">{step.body}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${i === stepIndex ? 'bg-haccp-400' : 'bg-haccp-surface-700'}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-haccp-surface-300 hover:text-white transition-colors"
            >
              Skip
            </button>
            {stepIndex > 0 && (
              <button
                onClick={() => setStepIndex((i) => i - 1)}
                className="p-1.5 rounded-lg bg-haccp-surface-800 hover:bg-haccp-surface-700 text-haccp-surface-200 transition-colors"
                aria-label="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => (isLast ? onClose() : setStepIndex((i) => i + 1))}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-haccp-500 hover:bg-haccp-400 text-haccp-surface-950 transition-colors flex items-center gap-1"
            >
              {isLast ? 'Start exploring' : 'Next'}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TOUR_STORAGE_KEY = 'veritas-haccp-tour-seen-v1';
