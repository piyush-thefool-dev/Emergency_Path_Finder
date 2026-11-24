/**
 * 21st.dev / shadcn style Badge Primitive.
 */

export function Badge({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const variantStyles = {
    default:
      'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/80',
    primary:
      'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    destructive:
      'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.2)]',
    success:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
    warning:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    outline:
      'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    glass:
      'bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-slate-900 dark:text-slate-100 border-white/20 dark:border-white/10 shadow-xs',
  };

  const sizeStyles = {
    sm: 'text-[9px] px-1.5 py-0.5 font-mono font-bold tracking-wider',
    md: 'text-[10px] px-2 py-0.5 font-mono font-bold tracking-wider',
    lg: 'text-xs px-2.5 py-1 font-mono font-bold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border uppercase select-none transition-colors ${
        variantStyles[variant] || variantStyles.default
      } ${sizeStyles[size] || sizeStyles.md} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
