/**
 * 21st.dev style KPI Metric Stat Card with icon highlight, glowing accent, and tabular figure metrics.
 */

import { motion } from 'motion/react';

export function KpiStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  tint = 'blue',
  action,
  className = '',
}) {
  const tintConfig = {
    red: {
      bg: 'bg-red-500/10 dark:bg-red-500/10',
      border: 'border-red-500/25',
      text: 'text-red-700 dark:text-red-400',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.12)]',
    },
    emerald: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/10',
      border: 'border-emerald-500/25',
      text: 'text-emerald-700 dark:text-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
    },
    blue: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/10',
      border: 'border-blue-500/25',
      text: 'text-blue-700 dark:text-blue-400',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.12)]',
    },
    amber: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/10',
      border: 'border-amber-500/25',
      text: 'text-amber-700 dark:text-amber-400',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.12)]',
    },
  };

  const style = tintConfig[tint] || tintConfig.blue;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`relative rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] p-4 sm:p-5 shadow-xs ${style.glow} flex flex-col justify-between select-none ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              {title}
            </span>
            {trend && (
              <span
                className={`px-1.5 py-0.5 rounded font-bold font-mono text-[9px] uppercase tracking-wider shrink-0 ${
                  trendPositive
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {trend}
              </span>
            )}
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100 tabular-nums truncate">
            {value}
          </div>
        </div>

        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl ${style.bg} border ${style.border} ${style.text} flex items-center justify-center shrink-0 shadow-xs`}
          >
            <Icon className="w-5 h-5 stroke-[2.2]" />
          </div>
        )}
      </div>

      {/* Bottom Subtitle & Action (Zero Overlap Guaranteed) */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-x-2 gap-y-1 min-w-0 text-2xs font-mono text-slate-500 dark:text-slate-400">
        <span className="truncate min-w-0 flex-1" title={typeof subtitle === 'string' ? subtitle : undefined}>
          {subtitle}
        </span>
        {action && (
          <div className="flex items-center shrink-0">
            {action}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default KpiStatCard;
