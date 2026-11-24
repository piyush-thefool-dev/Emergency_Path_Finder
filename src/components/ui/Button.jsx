/**
 * 21st.dev style Interactive Button Primitive with Framer Motion spring physics.
 */

import { motion } from 'motion/react';

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  children,
  ...props
}) {
  const variantStyles = {
    primary:
      'bg-[#1F3C6D] hover:bg-[#162D54] text-white border border-blue-700/40 shadow-sm hover:shadow-md hover:shadow-blue-900/20',
    destructive:
      'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white border border-red-500/50 shadow-md shadow-red-600/30',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/40 shadow-sm shadow-emerald-600/20',
    secondary:
      'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700',
    outline:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent',
    glass:
      'bg-white/70 dark:bg-slate-900/70 hover:bg-white/90 dark:hover:bg-slate-900/90 backdrop-blur-xl text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 shadow-sm',
  };

  const sizeStyles = {
    sm: 'h-8 px-2.5 text-xs rounded-lg gap-1.5',
    md: 'h-10 px-3.5 text-xs sm:text-sm rounded-xl gap-2 font-medium',
    lg: 'h-12 px-5 text-sm sm:text-base rounded-2xl gap-2.5 font-bold',
    icon: 'h-9 w-9 rounded-xl p-0 flex items-center justify-center',
    iconSm: 'h-8 w-8 rounded-lg p-0 flex items-center justify-center',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.015 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      disabled={disabled}
      className={`inline-flex items-center justify-center select-none font-sans cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
        variantStyles[variant] || variantStyles.primary
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default Button;
