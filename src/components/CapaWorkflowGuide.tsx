import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  User, 
  ShieldCheck, 
  FileText, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface CapaWorkflowGuideProps {
  isDemoMode?: boolean;
}

export const CapaWorkflowGuide: React.FC<CapaWorkflowGuideProps> = ({ isDemoMode = false }) => {
  const workflowSteps = [
    {
      step: 1,
      title: 'CCP Trigger',
      description: 'Sensor detects parameter breach',
      icon: <AlertTriangle className="w-5 h-5" />,
      color: '244, 63, 94', // Red
      role: 'Automated System',
      action: 'Immediate diversion activated'
    },
    {
      step: 2,
      title: 'Notification',
      description: 'Alert sent to master dashboard',
      icon: <AlertCircle className="w-5 h-5" />,
      color: '245, 158, 11', // Orange
      role: 'System Alert',
      action: 'Real-time notification to QC team'
    },
    {
      step: 3,
      title: 'Verification',
      description: 'QC operator verifies breach',
      icon: <User className="w-5 h-5" />,
      color: '59, 130, 246', // Blue
      role: 'QC Operator',
      action: 'Confirm deviation and document'
    },
    {
      step: 4,
      title: 'Hold Product',
      description: 'Batch placed on hold',
      icon: <Clock className="w-5 h-5" />,
      color: '245, 158, 11', // Orange
      role: 'Production Manager',
      action: 'Quarantine affected batch'
    },
    {
      step: 5,
      title: 'Corrective Action',
      description: 'Root cause analysis & fix',
      icon: <ShieldCheck className="w-5 h-5" />,
      color: '168, 85, 247', // Purple
      role: 'Quality Manager',
      action: 'Implement CAPA procedures'
    },
    {
      step: 6,
      title: 'Resolution',
      description: 'Manager approves closure',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: '34, 197, 94', // Green
      role: 'Plant Manager',
      action: 'Close deviation & release batch'
    }
  ];

  return (
    <div className="bg-haccp-surface-900 border border-haccp-surface-800 rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-haccp-500/10 border border-haccp-500/30 flex items-center justify-center text-haccp-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-haccp-surface-50">CAPA Workflow Guide</h3>
            <p className="text-[10px] text-haccp-surface-400">CCP Trigger to Resolution Process</p>
          </div>
        </div>
        {!isDemoMode && (
          <span className="text-[10px] font-mono text-haccp-surface-500 bg-haccp-surface-800 px-2 py-1 rounded">
            ISO 22000 PRINCIPLE 5
          </span>
        )}
      </div>

      {/* Workflow Steps */}
      <div className="space-y-3">
        {workflowSteps.map((step, index) => (
          <motion.div
            key={step.step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex items-start gap-3"
          >
            {/* Step Number */}
            <div className="flex-shrink-0">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ 
                  background: `rgb(${step.color})`,
                  boxShadow: `0 4px 12px rgba(${step.color}, 0.3)`
                }}
              >
                {step.step}
              </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className="text-sm font-bold text-haccp-surface-50"
                  style={{ color: `rgb(${step.color})` }}
                >
                  {step.title}
                </span>
                <span className="text-[10px] text-haccp-surface-500">•</span>
                <span className="text-[10px] text-haccp-surface-400">{step.role}</span>
              </div>
              <p className="text-xs text-haccp-surface-300 mb-1">{step.description}</p>
              <div className="flex items-center gap-1 text-[10px] text-haccp-surface-500">
                <span className="font-mono">Action:</span>
                <span className="text-haccp-surface-400">{step.action}</span>
              </div>
            </div>

            {/* Connector Arrow */}
            {index < workflowSteps.length - 1 && (
              <div className="flex-shrink-0 flex items-center justify-center pt-4">
                <ChevronRight className="w-4 h-4 text-haccp-surface-600" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Color Legend */}
      <div className="mt-4 pt-3 border-t border-haccp-surface-800">
        <div className="flex items-center gap-4 text-[10px] text-haccp-surface-400 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: 'rgb(244, 63, 94)' }} />
            <span>Critical Trigger</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: 'rgb(245, 158, 11)' }} />
            <span>Warning/Hold</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: 'rgb(59, 130, 246)' }} />
            <span>Verification</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: 'rgb(168, 85, 247)' }} />
            <span>Corrective Action</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ background: 'rgb(34, 197, 94)' }} />
            <span>Resolution</span>
          </div>
        </div>
      </div>
    </div>
  );
};