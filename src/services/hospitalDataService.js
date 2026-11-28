/**
 * Lazy loader and cache for the Pan-India 35,000-hospital registry.
 * Uses dynamic import() so Vite code-splits the dataset out of the main bundle.
 */

export const DEFAULT_NATIONAL_EMERGENCY_NUMBERS = [
  {
    code: '108',
    label: '108 Emergency Ambulance',
    description: 'National & State 24/7 Free Emergency Ambulance Dispatch (All India)',
    tel: 'tel:108',
  },
  {
    code: '112',
    label: '112 Unified National Emergency',
    description: 'All-in-One Emergency Response (Police, Fire, Medical Ambulance)',
    tel: 'tel:112',
  },
  {
    code: '102',
    label: '102 Medical Helpline',
    description: 'Free Maternal, Infant & Neonatal Emergency Transport',
    tel: 'tel:102',
  },
];

let cachedHospitals = null;
let cachedEmergencyNumbers = DEFAULT_NATIONAL_EMERGENCY_NUMBERS;
let hospitalsPromise = null;

export async function loadPanIndiaHospitals() {
  if (cachedHospitals) {
    return cachedHospitals;
  }
  if (hospitalsPromise) {
    return hospitalsPromise;
  }

  hospitalsPromise = import('../data/panIndiaHospitals.js')
    .then((mod) => {
      cachedHospitals = mod.PAN_INDIA_HOSPITALS || [];
      if (Array.isArray(mod.NATIONAL_EMERGENCY_NUMBERS) && mod.NATIONAL_EMERGENCY_NUMBERS.length > 0) {
        cachedEmergencyNumbers = mod.NATIONAL_EMERGENCY_NUMBERS;
      }
      hospitalsPromise = null;
      return cachedHospitals;
    })
    .catch((err) => {
      hospitalsPromise = null;
      throw err;
    });

  return hospitalsPromise;
}

export function getCachedPanIndiaHospitals() {
  return cachedHospitals || [];
}

export function getNationalEmergencyNumbers() {
  return cachedEmergencyNumbers;
}
