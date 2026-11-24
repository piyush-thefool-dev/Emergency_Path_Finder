/**
 * Pan-India & Delhi-NCR Apex Hospital Emergency Registry Dataset.
 * Re-exports the complete Pan-India Apex Hospital Registry (80 verified facilities)
 * for backward compatibility across all existing modules.
 */

import { PAN_INDIA_HOSPITALS, NATIONAL_EMERGENCY_NUMBERS as PAN_INDIA_NUMBERS } from './panIndiaHospitals.js';

export const SAMPLE_HOSPITALS = PAN_INDIA_HOSPITALS;
export const NATIONAL_EMERGENCY_NUMBERS = PAN_INDIA_NUMBERS;
export default SAMPLE_HOSPITALS;
