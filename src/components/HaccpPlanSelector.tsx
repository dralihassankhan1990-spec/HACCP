import React from 'react';
import { motion } from 'motion/react';
import { HaccpPlan } from '../types';
import { Milk, IceCream, Utensils, Beef, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';

interface HaccpPlanSelectorProps {
  plans: HaccpPlan[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  unresolvedBreaksByPlan: Record<string, number>;
}

export const HaccpPlanSelector: React.FC<HaccpPlanSelectorProps> = ({
  plans,
  selectedPlanId,
  onSelectPlan,
  unresolvedBreaksByPlan,
}) => {
  const getPlanIcon = (id: string) => {
    switch (id) {
      case 'milk':
        return <Milk className="w-5 h-5" />;
      case 'ice_cream':
        return <IceCream className="w-5 h-5" />;
      case 'bakery':
        return <Utensils className="w-5 h-5" />;
      case 'meat':
        return <Beef className="w-5 h-5" />;
      default:
        return <Milk className="w-5 h-5" />;
    }
  };

  const planColors: Record<string, string> = {
    milk: '34, 197, 94',
    ice_cream: '20, 184, 166',
    bakery: '245, 158, 11',
    meat: '244, 63, 94',
  };

  return (
    <div className="bg-haccp-surface-900 border border-haccp-surface-800 rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] relative overflow-hidden">
      <div className="absolute inset-0 bg-haccp-food-pattern opacity-5" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-haccp-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-haccp-400 animate-ping" />
            Active Facility HACCP Plans & Production Modules
          </span>
          <h2 className="text-sm font-bold text-haccp-surface-50 mt-0.5">
            Select Industrial Process Category to Switch Active Control Line
          </h2>
        </div>
        <span className="text-xs text-haccp-surface-400 font-mono">
          4 Certified Lines Online • ISO 22000:2018
        </span>
      </div>

      {/* Category Tabs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          const breaks = unresolvedBreaksByPlan[plan.id] || 0;
          const color = planColors[plan.id] || '34, 197, 94';

          return (
            <button
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className={`p-3 rounded-xl text-left transition-all duration-300 relative border cursor-pointer group ${
                isSelected
                  ? 'bg-gradient-to-b from-haccp-surface-800 to-haccp-surface-850 border-haccp-500 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] ring-1'
                  : 'bg-haccp-surface-850/60 hover:bg-haccp-surface-800 border-haccp-surface-750 text-haccp-surface-300'
              }`}
              style={{ 
                boxShadow: isSelected ? `0 10px 40px -10px rgba(${color}, 0.3)` : undefined,
                borderColor: isSelected ? `rgba(${color}, 0.5)` : undefined,
              }}
            >
              {/* Top Row: Icon + Batch + Status */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isSelected
                      ? 'shadow-md'
                      : ''
                  }`}
                  style={{ 
                    background: isSelected ? `rgb(${color})` : 'rgb(51, 65, 49)',
                    color: isSelected ? 'white' : 'rgb(154, 169, 148)',
                  }}
                >
                  {getPlanIcon(plan.id)}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-haccp-surface-900 border border-haccp-surface-750 text-haccp-surface-300">
                    {plan.active_batch_default}
                  </span>
                  {breaks > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-haccp-critical-300 bg-haccp-critical-950/80 border border-haccp-critical-800 px-1.5 py-0.5 rounded-full animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-haccp-critical-400" />
                      {breaks}
                    </span>
                  ) : (
                    <span className="text-haccp-400" title="Nominal">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Line */}
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-haccp-surface-50 flex items-center justify-between">
                  <span className="truncate">{plan.title}</span>
                  {isSelected && <ChevronRight className="w-3.5 h-3.5" style={{ color: `rgb(${color})` }} />}
                </div>
                <div className="text-[11px] text-haccp-surface-400 truncate">
                  {plan.facility_line.split(' - ')[0]} • {plan.category}
                </div>
              </div>

              {/* Regulatory Standard Badge */}
              <div className="mt-2 pt-2 border-t border-haccp-surface-750/70 text-[10px] text-haccp-surface-400 truncate font-mono">
                {plan.regulatory_standard.split('&')[0].trim()}
              </div>

              {/* Active Selection Glow Pill */}
              {isSelected && (
                <div className="absolute top-0 right-3 -translate-y-1/2 text-[9px] font-black uppercase px-2 py-0.2 rounded-full tracking-wider shadow-xs"
                     style={{ background: `rgb(${color})`, color: 'rgb(30, 35, 26)' }}>
                  Active Control
                </div>
              )}

              {/* Hover glow line */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `linear-gradient(90deg, transparent, rgb(${color}), transparent)` }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};