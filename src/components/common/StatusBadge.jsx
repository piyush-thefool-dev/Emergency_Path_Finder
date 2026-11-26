/**
 * Semantic Status Pill Badge supporting Light & Dark glassmorphic UI.
 */

const TONE_MAP = {
  critical: 'bg-red-500/10 text-[#D62828] dark:text-red-400 border-red-500/25',
  danger: 'bg-red-500/10 text-[#D62828] dark:text-red-400 border-red-500/25',
  high: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
  progress: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
  primary: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  available: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  resolved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  neutral: 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]',
};

const DOT_MAP = {
  critical: 'bg-[#D62828]',
  danger: 'bg-[#D62828]',
  high: 'bg-amber-500',
  warning: 'bg-amber-500',
  progress: 'bg-blue-600',
  primary: 'bg-blue-600',
  success: 'bg-emerald-500',
  available: 'bg-emerald-500',
  resolved: 'bg-emerald-500',
  neutral: 'bg-slate-400',
};

export function StatusBadge({ tone = 'neutral', dot = false, children, className = '' }) {
  const toneClasses = TONE_MAP[tone] || TONE_MAP.neutral;
  const dotColor = DOT_MAP[tone] || DOT_MAP.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-mono font-semibold whitespace-nowrap ${toneClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      <span>{children}</span>
    </span>
  );
}

export default StatusBadge;
