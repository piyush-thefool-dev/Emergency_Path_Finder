/**
 * 21st.dev style Animated Toggle Switch with micro-spring transitions.
 */

import { motion } from 'motion/react';

export function Switch({ checked, onChange, disabled = false, label = '', id = '' }) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          checked ? 'bg-[#D62828] dark:bg-red-600' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      {label && (
        <span className="text-xs font-sans font-semibold text-slate-800 dark:text-slate-200">
          {label}
        </span>
      )}
    </label>
  );
}

export default Switch;
