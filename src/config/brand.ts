/**
 * Central brand configuration.
 * Change the product name here and it propagates across the UI, document title
 * and server identity strings.
 */
export const BRAND = {
  /** Product / company name */
  name: 'Veritas HACCP',
  /** Short name for tight UI slots */
  shortName: 'Veritas',
  /** Product category line */
  category: 'Food Safety Operations Platform',
  /** Value proposition tagline */
  tagline: 'Verify. Correct. Prove.',
  /** Long descriptive subtitle */
  description:
    'Real-time CCP verification, automated deviation correction, and audit-ready chain of custody for regulated food production.',
  /** Name of the live monitoring workspace (replaces the jargon "SCADA Dashboard") */
  workspaceName: 'Operations Control Center',
  /** Engineering-facing name, still shown where PLC/SCADA context is accurate */
  engineeringName: 'SCADA Control Layer',
  /** Document title suffix */
  titleSuffix: 'CCP Monitoring & Deviation Resolution',
} as const;
