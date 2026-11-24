/**
 * 21st.dev style Traffic Speed & Friction Dynamics Curve Graph.
 * Visualizes dynamic velocity v(e) and friction factor across 24-hour dispatch windows and weather models.
 */

import { useState } from 'react';
import { Activity, Clock, Zap, Sun, CloudRain, AlertTriangle } from 'lucide-react';

export function TrafficSpeedFrictionGraph({ activeTimeOfDay = 'morning_peak', activeWeather = 'clear', className = '' }) {
  const [hoveredHour, setHoveredHour] = useState(null);

  // 24-hour profile data model
  const HOURS = [
    { hour: 0, label: '12 AM', baseKph: 58, friction: 0.95, period: 'Night' },
    { hour: 2, label: '2 AM', baseKph: 60, friction: 1.0, period: 'Night' },
    { hour: 4, label: '4 AM', baseKph: 59, friction: 0.98, period: 'Early Morning' },
    { hour: 6, label: '6 AM', baseKph: 52, friction: 0.88, period: 'Early Morning' },
    { hour: 8, label: '8 AM', baseKph: 36, friction: 0.62, period: 'Morning Rush' },
    { hour: 9, label: '9 AM', baseKph: 32, friction: 0.55, period: 'Morning Peak' },
    { hour: 10, label: '10 AM', baseKph: 35, friction: 0.60, period: 'Morning Peak' },
    { hour: 12, label: '12 PM', baseKph: 45, friction: 0.76, period: 'Midday' },
    { hour: 14, label: '2 PM', baseKph: 48, friction: 0.82, period: 'Afternoon' },
    { hour: 16, label: '4 PM', baseKph: 42, friction: 0.72, period: 'Late Afternoon' },
    { hour: 18, label: '6 PM', baseKph: 29, friction: 0.50, period: 'Evening Rush' },
    { hour: 19, label: '7 PM', baseKph: 28, friction: 0.48, period: 'Evening Peak' },
    { hour: 20, label: '8 PM', baseKph: 34, friction: 0.58, period: 'Evening' },
    { hour: 22, label: '10 PM', baseKph: 50, friction: 0.85, period: 'Night' },
  ];

  // Weather multiplier
  const weatherMultipliers = {
    clear: 1.0,
    rain: 0.85,
    heavy_rain: 0.65,
    fog: 0.70,
    storm: 0.55,
  };
  const weatherMult = weatherMultipliers[activeWeather] || 1.0;

  // Chart dimensions
  const width = 640;
  const height = 180;
  const paddingX = 40;
  const paddingY = 24;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const maxSpeed = 70;
  const minSpeed = 10;

  // Generate SVG path for speed curve
  const points = HOURS.map((pt, idx) => {
    const x = paddingX + (idx / (HOURS.length - 1)) * chartW;
    const effectiveSpeed = Math.max(10, pt.baseKph * weatherMult);
    const y = paddingY + chartH - ((effectiveSpeed - minSpeed) / (maxSpeed - minSpeed)) * chartH;
    return { ...pt, x, y, effectiveSpeed };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[idx - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingY + chartH} L ${points[0].x} ${paddingY + chartH} Z`;

  const activePoint = hoveredHour !== null ? points.find((p) => p.hour === hoveredHour) : points[5]; // Default 9 AM

  return (
    <div className={`rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] p-4 sm:p-5 shadow-xs font-mono space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 text-[#D62828] dark:text-red-400 flex items-center justify-center border border-red-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              24-Hour Velocity Dynamics: v(e) = v_free × C(t) × W
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
              Dynamic friction decay across peak dispatch windows
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-2xs font-bold">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {activeWeather.toUpperCase()} (×{weatherMult.toFixed(2)})
          </span>
          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Active: {activeTimeOfDay.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* SVG Curve Graph */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D62828" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#D62828" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[20, 40, 60].map((speed) => {
            const y = paddingY + chartH - ((speed - minSpeed) / (maxSpeed - minSpeed)) * chartH;
            return (
              <g key={speed}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  className="text-slate-200 dark:text-slate-800"
                />
                <text
                  x={paddingX - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-400 dark:fill-slate-500 font-mono"
                >
                  {speed}k
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#velocityGradient)" />

          {/* Curve stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#D62828"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((pt) => {
            const isHovered = hoveredHour === pt.hour;
            return (
              <g
                key={pt.hour}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredHour(pt.hour)}
                onMouseLeave={() => setHoveredHour(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5.5 : 3.5}
                  className={`transition-all duration-150 ${
                    isHovered
                      ? 'fill-[#D62828] stroke-white dark:stroke-slate-900 stroke-2'
                      : 'fill-white dark:fill-slate-900 stroke-[#D62828] stroke-2'
                  }`}
                />
                <text
                  x={pt.x}
                  y={height - 6}
                  textAnchor="middle"
                  className="text-[8.5px] fill-slate-400 dark:fill-slate-500 font-mono"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Metric Readout Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-2xs text-slate-500 dark:text-slate-400">
        <div>
          Selected: <strong className="text-slate-800 dark:text-slate-200">{activePoint?.label || '9 AM'} ({activePoint?.period})</strong>
        </div>
        <div className="flex items-center gap-3">
          <span>
            Effective Speed: <strong className="text-[#D62828] dark:text-red-400 font-bold">{Math.round(activePoint?.effectiveSpeed || 32)} km/h</strong>
          </span>
          <span>
            Friction Multiplier: <strong className="text-slate-800 dark:text-slate-200">×{((activePoint?.friction || 0.55) * weatherMult).toFixed(2)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export default TrafficSpeedFrictionGraph;
