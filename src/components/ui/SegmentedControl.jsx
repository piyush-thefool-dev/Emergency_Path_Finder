/**
 * 21st.dev style Segmented Control with animated sliding pill indicator.
 */

import { motion } from 'motion/react';

export function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  className = '',
}) {
  const sizeStyles = {
    sm: 'text-2xs py-1 px-2.5',
    md: 'text-xs py-1.5 px-3',
    lg: 'text-sm py-2 px-4',
  };

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-md select-none ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative rounded-lg font-sans font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              sizeStyles[size] || sizeStyles.md
            } ${
              isSelected
                ? 'text-slate-900 dark:text-white font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="segmented-indicator"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 rounded-lg bg-white dark:bg-slate-800 shadow-xs border border-slate-200/60 dark:border-white/10"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {opt.icon && <opt.icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{opt.label}</span>
              {opt.badge && (
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700">
                  {opt.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
