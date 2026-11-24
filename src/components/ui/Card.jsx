/**
 * 21st.dev style Card Container Primitive with subtle glassmorphism and specular highlights.
 */

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`relative rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      className={`p-4 sm:p-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', icon: Icon, badge, children, ...props }) {
  return (
    <div className={`flex items-center justify-between gap-2.5 w-full ${className}`} {...props}>
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0 text-slate-800 dark:text-slate-200 shadow-xs">
            <Icon className="w-4 h-4 stroke-[2.2]" />
          </div>
        )}
        <h3 className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 dark:text-slate-100 font-sans truncate">
          {children}
        </h3>
      </div>
      {badge}
    </div>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-4 sm:p-5 space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div
      className={`p-3.5 sm:p-4 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-white/[0.06] rounded-b-2xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
