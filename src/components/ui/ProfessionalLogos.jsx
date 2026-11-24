/**
 * Professional Medical & CAD Telemetry Vector Logos and Badges.
 * Provides high-fidelity SVG logos for Indian apex hospital networks,
 * emergency triage clinical specialties, and CAD dispatch operations.
 */

import React from 'react';

/**
 * Official Emergency Path Finder CAD Brand Emblem.
 * Sleek Star of Life with integrated pulse wave and dynamic navigation vector.
 */
export function CadBrandLogo({ className = 'w-6 h-6', ...props }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Emergency Path Finder CAD Emblem"
      {...props}
    >
      <defs>
        <linearGradient id="cadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <linearGradient id="starGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FEE2E2" />
        </linearGradient>
      </defs>

      {/* Outer Caduceus Shield Body */}
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#cadGrad)" />
      <rect x="2.5" y="2.5" width="27" height="27" rx="7.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

      {/* Star of Life 6-Point Silhouette */}
      <path
        d="M16 5V27M7.5 10.5L24.5 21.5M7.5 21.5L24.5 10.5"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Clinical Medical Cross Accent */}
      <path
        d="M16 8V24M8 16H24"
        stroke="url(#starGlow)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dynamic ECG Traversal Pulse Wave */}
      <path
        d="M10 16.5H13.2L14.6 11.5L17.4 20.8L18.8 16.5H22"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Intelligent Hospital Network Logo Resolver.
 * Renders dedicated professional crests and emblems for major Indian healthcare systems.
 */
export function HospitalBrandLogo({ hospitalName = '', className = 'w-6 h-6', ...props }) {
  const name = String(hospitalName || '').toLowerCase();

  // 1. AIIMS (All India Institute of Medical Sciences)
  if (name.includes('aiims')) {
    return (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#1E3A8A" />
        <circle cx="16" cy="16" r="10" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="3 1" />
        {/* Ashoka Chakra & Caduceus motif */}
        <path d="M16 8V24M11 16H21" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 10C18 10 19 12 19 14C19 18 16 21 16 21C16 21 13 18 13 14C13 12 14 10 16 10Z" fill="#F59E0B" />
        <circle cx="16" cy="14" r="1.5" fill="#1E3A8A" />
      </svg>
    );
  }

  // 2. Apollo Hospitals
  if (name.includes('apollo')) {
    return (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#0284C7" />
        {/* Apollo Golden Sunburst & Beacon */}
        <circle cx="16" cy="16" r="11" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <path d="M16 6L18 12L24 14L19 18L20 24L16 20L12 24L13 18L8 14L14 12Z" fill="#F59E0B" />
        <circle cx="16" cy="16" r="3.5" fill="#FFFFFF" />
        <path d="M16 14V18M14 16H18" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 3. Fortis Healthcare
  if (name.includes('fortis')) {
    return (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#047857" />
        {/* Fortis Healing Hands & Medical Flame */}
        <path d="M16 6C11.5 6 8 9.5 8 14C8 19 16 26 16 26C16 26 24 19 24 14C24 9.5 20.5 6 16 6Z" fill="#059669" />
        <path d="M16 9C14 11 13 13 13 15C13 17 14.5 18.5 16 18.5C17.5 18.5 19 17 19 15C19 13 18 11 16 9Z" fill="#EF4444" />
        <path d="M16 10V18M12 14H20" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  // 4. Max Healthcare
  if (name.includes('max')) {
    return (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#BE123C" />
        {/* Max Starburst Cross */}
        <rect x="6" y="13" width="20" height="6" rx="2" fill="#FFFFFF" />
        <rect x="13" y="6" width="6" height="20" rx="2" fill="#FFFFFF" />
        <circle cx="16" cy="16" r="2.5" fill="#BE123C" />
      </svg>
    );
  }

  // 5. Medanta - The Medicity
  if (name.includes('medanta')) {
    return (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#4338CA" />
        {/* Medanta Stethoscope Care Spiral */}
        <path d="M10 14C10 10.6 12.6 8 16 8C19.3 8 22 10.6 22 14V17C22 20.3 19.3 23 16 23C12.6 23 10 20.3 10 17" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="16" cy="16" r="3.5" fill="#F43F5E" />
      </svg>
    );
  }

  // 6. Kailash Hospital & Heart Institute
  if (name.includes('kailash')) {
    return (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#1D4ED8" />
        {/* Kailash Mountain Apex & Heart Cross */}
        <path d="M7 23L16 9L25 23H7Z" stroke="#93C5FD" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M16 13V21M12 17H20" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 7. Sharda Super Speciality Hospital
  if (name.includes('sharda')) {
    return (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#0F172A" />
        {/* Sharda Sunburst Shield */}
        <circle cx="16" cy="16" r="10" stroke="#F97316" strokeWidth="2" />
        <path d="M16 7V25M7 16H25M9.6 9.6L22.4 22.4M9.6 22.4L22.4 9.6" stroke="#FB923C" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="4.5" fill="#EF4444" />
        <path d="M16 13.5V18.5M13.5 16H18.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 8. Sir Ganga Ram Hospital
  if (name.includes('ganga') || name.includes('ram')) {
    return (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#B45309" />
        <circle cx="16" cy="16" r="10.5" stroke="#FDE68A" strokeWidth="1.5" />
        <path d="M16 8V24M10 14H22" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2.5" fill="#B45309" />
      </svg>
    );
  }

  // 9. Yatharth Super Speciality Hospital
  if (name.includes('yatharth')) {
    return (
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#0D9488" />
        <path d="M16 6C10 6 7 11 7 16C7 22 16 26 16 26C16 26 25 22 25 16C25 11 22 6 16 6Z" stroke="#99F6E4" strokeWidth="1.5" />
        <path d="M16 11V21M11 16H21" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  // Default Verified Apex Healthcare System Emblem
  return (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#DC2626" />
      <path d="M16 7V25M7 16H25" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="2.5" fill="#991B1B" />
    </svg>
  );
}

/**
 * Professional Clinical Triage Specialty Logos.
 */
export function TraumaTriageLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3V21M3 12H21" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
      <path d="M7 12H9.5L11 8.5L13 15.5L14.5 12H17" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CardiacTriageLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
        fill="rgba(239,68,68,0.15)"
        stroke="#E11D48"
        strokeWidth="1.8"
      />
      <path d="M5.5 11.5H8.2L9.5 8L11.5 15L13 11.5H18" stroke="#E11D48" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BurnTriageLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M12 2C9.5 6.5 7 9 7 13C7 16.3 9.2 19 12 19C14.8 19 17 16.3 17 13C17 9 14.5 6.5 12 2Z"
        fill="rgba(245,158,11,0.2)"
        stroke="#D97706"
        strokeWidth="1.8"
      />
      <path
        d="M12 9C10.8 11.5 9.5 13 9.5 15C9.5 16.6 10.6 18 12 18C13.4 18 14.5 16.6 14.5 15C14.5 13 13.2 11.5 12 9Z"
        fill="#F59E0B"
      />
    </svg>
  );
}

export function GeneralEmergencyLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="9.5" fill="rgba(59,130,246,0.15)" stroke="#2563EB" strokeWidth="1.8" />
      <path d="M12 7V17M7 12H17" stroke="#2563EB" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Top KPI Mission-Critical Telemetry Insignias.
 */
export function KpiFacilityLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="4" fill="rgba(239,68,68,0.12)" stroke="#DC2626" strokeWidth="1.8" />
      <path d="M12 7V17M7 12H17" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

export function KpiEtaRadarLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="9" fill="rgba(16,185,129,0.12)" stroke="#059669" strokeWidth="1.8" />
      <path d="M12 7V12L15.5 14" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2" fill="#10B981" />
    </svg>
  );
}

export function KpiIcuBedLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="3.5" fill="rgba(37,99,235,0.12)" stroke="#2563EB" strokeWidth="1.8" />
      <path d="M4 14H20M4 9H9V14H4ZM12 8H17V14H12Z" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6.5" cy="11.5" r="1" fill="#3B82F6" />
    </svg>
  );
}

export function KpiVelocityGaugeLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M3 14C3 9 7 5 12 5C17 5 21 9 21 14C21 16.5 19.8 18.7 18 20.2" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="14" r="2.5" fill="#F59E0B" />
      <path d="M12 14L16.5 9" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="6" cy="14" r="1" fill="#D97706" />
      <circle cx="12" cy="8" r="1" fill="#D97706" />
      <circle cx="18" cy="14" r="1" fill="#D97706" />
    </svg>
  );
}
