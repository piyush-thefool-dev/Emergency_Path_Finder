/**
 * Emergency triage categories and their corresponding clinical specialty requirements.
 * Used for constrained hospital selection rather than simple nearest-neighbour lookups.
 */

export const EMERGENCY_CATEGORIES = {
  TRAUMA: {
    id: 'TRAUMA',
    label: 'Major Trauma / Road Accident',
    shortLabel: 'Trauma',
    requiredSpecialty: 'trauma_center',
    description: 'Severe physical injury, multiple fractures, hemorrhage. Requires Level 1/2 Trauma or Advanced Surgical OT.',
    color: '#D62828',
  },
  CARDIAC: {
    id: 'CARDIAC',
    label: 'Acute Cardiac / STEMI',
    shortLabel: 'Cardiac',
    requiredSpecialty: 'cardiology',
    description: 'Myocardial infarction, cardiac arrest, unstable arrhythmia. Requires 24/7 Cath Lab and CCU.',
    color: '#E11D48',
  },
  BURN: {
    id: 'BURN',
    label: 'Severe Burns / Inhalation',
    shortLabel: 'Burn',
    requiredSpecialty: 'burn_unit',
    description: 'High-degree thermal or chemical burns. Requires dedicated Sterile Isolation Burn ICU.',
    color: '#D97706',
  },
  GENERAL: {
    id: 'GENERAL',
    label: 'General Emergency / Medical',
    shortLabel: 'General',
    requiredSpecialty: 'general_emergency',
    description: 'Acute respiratory distress, severe sepsis, medical stabilization. Requires standard 24/7 Emergency Ward.',
    color: '#1F3C6D',
  },
};
