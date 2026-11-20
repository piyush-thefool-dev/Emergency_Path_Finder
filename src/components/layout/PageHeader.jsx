/**
 * Sticky app bar used on mobile sub-pages.
 * Clean, high-contrast, tactical header.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PageHeader({ title, subtitle, icon: Icon, backTo, right }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 pt-safe transition-colors">
      <div className="flex items-center gap-3 px-4 h-14">
        {backTo ? (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            aria-label="Back"
            className="w-9 h-9 -ml-1 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          Icon && (
            <span className="w-8 h-8 rounded-lg bg-[#D62828] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Icon className="w-4 h-4 stroke-[2.2]" />
            </span>
          )
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-extrabold text-[#1F3C6D] dark:text-slate-50 tracking-tight leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight truncate">
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </div>
    </header>
  );
}

export default PageHeader;
