/**
 * Sticky Mobile & Sub-Page Navigation Header with optional Back button and icon badge.
 */

import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { CadBrandLogo } from '../ui/BrandLogos.jsx';

export function MobilePageHeader({ title, subtitle, icon: Icon, backTo, right }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 lg:static z-20 bg-white/80 dark:bg-slate-950/80 lg:bg-transparent lg:dark:bg-transparent backdrop-blur-2xl lg:backdrop-blur-none border-b border-slate-200/80 dark:border-white/[0.08] lg:border-0 pt-safe lg:pt-0 transition-colors">
      <div className="flex items-center gap-3 px-4 lg:px-0 h-16 lg:h-auto lg:pb-3 max-w-7xl mx-auto">
        {backTo ? (
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => navigate(backTo)}
            aria-label="Back"
            className="lg:hidden w-9 h-9 -ml-1 rounded-xl border border-slate-200/80 dark:border-white/[0.1] bg-white/60 dark:bg-slate-900/60 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
        ) : null}
        {Icon && (
          <span className={`${backTo ? 'hidden lg:flex' : 'flex'} w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white items-center justify-center shrink-0 shadow-xs border border-red-400/40`}>
            <Icon className="w-4 h-4 stroke-[2.2]" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-tight truncate font-sans">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tracking-tight truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {right}
          <Link
            to="/"
            aria-label="Emergency Path Finder Home"
            title="Emergency Path Finder"
            className="lg:hidden inline-flex shrink-0"
          >
            <CadBrandLogo className="w-8 h-8 border border-white/10" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export default MobilePageHeader;
