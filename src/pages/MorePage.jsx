/**
 * 21st.dev style More Page (Mobile Tab).
 * Secondary research, algorithmic analysis views, system architecture & theme configuration.
 */

import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Menu,
  Cpu,
  BarChart3,
  Network,
  GitCommit,
  Sun,
  Moon,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const LINKS = [
  { to: '/benchmark', icon: Cpu, tint: 'text-[#D62828] dark:text-red-400 bg-red-500/10 border-red-500/20', title: 'Algorithmic Benchmark', text: 'Dijkstra vs A* Empirical Performance Audit' },
  { to: '/evaluation', icon: BarChart3, tint: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20', title: 'Model Evaluation Framework', text: 'Speed Prediction Models & Verification Metrics' },
  { to: '/graph-explorer', icon: Network, tint: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20', title: 'Graph Model Explorer', text: 'Mathematical Formulas & Road Network Inspection' },
  { to: '/architecture', icon: GitCommit, tint: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20', title: 'System Architecture', text: '5-Stage Pipeline, Tiered Design & ODbL Compliance' },
];

export function MorePage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="page-shell">
      <PageHeader icon={Menu} title="System Operations" subtitle="Research Views, Architecture & Settings" />
      <div className="px-4 pt-4 pb-8 space-y-4 font-sans">
        {/* Theme Toggle Card */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs text-left cursor-pointer transition-colors"
        >
          <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0 shadow-xs">
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              {isDark ? 'Switch to Light Theme' : 'Switch to Dark Cockpit Theme'}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Applies tactical contrast to map and operations console
            </span>
          </span>
        </motion.button>

        {/* Research Links */}
        <ul className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
          {LINKS.map(({ to, icon: Icon, tint, title, text }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex items-center gap-3.5 px-4 py-3.5 min-h-[60px] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${tint} shadow-xs`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {title}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                    {text}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Advisory Attribution */}
        <div className="p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.06] text-[11px] text-slate-500 leading-relaxed font-sans">
          <p>
            Tactical Emergency Path Finder · Computer-Aided Dispatch (CAD) System · Pan-India & Delhi-NCR Road Grid. Map data © OpenStreetMap contributors under Open Database Licence (ODbL).
          </p>
        </div>
      </div>
    </div>
  );
}

export default MorePage;
