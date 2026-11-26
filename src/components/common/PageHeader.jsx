/**
 * Standard Enterprise Section Header matching Light & Dark frosted glass styling.
 */

export function PageHeader({ title, description, actions = null, className = '' }) {
  return (
    <div
      className={`dispatch-section-header flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-white/[0.08] ${className}`}
    >
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-normal max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
