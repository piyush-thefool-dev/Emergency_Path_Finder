/**
 * 3D Glossy Navigation & Medical Telemetry Logos and Hospital Network Emblems.
 * Unified dark/day depth-lit visual identity inspired by Uber, Rapido, and Google Maps.
 */

import React from 'react';

/**
 * Official Pathfinder 3D Navigation & Medical Cross Brand Emblem.
 */
export function CadBrandLogo({ className = 'w-7 h-7', alt = 'Pathfinder 3D Dispatch Emblem', ...props }) {
  return (
    <img
      src="/assets/pathfinder-logo.png"
      alt={alt}
      className={`${className} rounded-xl object-cover shadow-md select-none`}
      draggable={false}
      {...props}
    />
  );
}

/**
 * Unified 3D Isometric Hospital Building Landmark Logo.
 * Uses `/assets/hospital-3d.png` consistently across all hospital cards, search lists, and popups.
 */
export function HospitalBrandLogo({ hospitalName = '', className = 'w-6 h-6', ...props }) {
  return (
    <img
      src="/assets/hospital-3d.png"
      alt={hospitalName || '3D Hospital Building'}
      className={`${className} rounded-lg object-contain drop-shadow-xs select-none bg-slate-100 dark:bg-slate-800/80 p-0.5`}
      draggable={false}
      {...props}
    />
  );
}

/**
 * 3D Depth-Lit Clinical Triage Specialty Logos.
 */
export function TraumaTriageLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="9.5" fill="rgba(239,68,68,0.16)" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3V21M3 12H21" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
      <path d="M6.5 12H9.2L11 8L13 16L14.8 12H17.5" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CardiacTriageLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
        fill="rgba(244,63,94,0.22)"
        stroke="#E11D48"
        strokeWidth="1.8"
      />
      <path d="M5.5 11.5H8.2L9.5 8L11.5 15L13 11.5H18" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BurnTriageLogo({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M12 2C9.5 6.5 7 9 7 13C7 16.3 9.2 19 12 19C14.8 19 17 16.3 17 13C17 9 14.5 6.5 12 2Z"
        fill="rgba(245,158,11,0.25)"
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
      <circle cx="12" cy="12" r="9.5" fill="rgba(59,130,246,0.2)" stroke="#2563EB" strokeWidth="1.8" />
      <path d="M12 7V17M7 12H17" stroke="#2563EB" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}
