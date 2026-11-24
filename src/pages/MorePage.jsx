/**
 * More Page (Mobile Tab).
 * Secondary research, algorithmic analysis views, system architecture & theme configuration.
 */

import { Link } from 'react-router-dom';
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
  { to: '/benchmark', icon: Cpu, tint: 'text-[#D62828] dark:text-red-400 bg-red-500/10', title: 'Algorithmic Benchmark', text: 'Dijkstra vs A* Empirical Performance Audit' },
  { to: '/evaluation', icon: BarChart3, tint: 'text-sky-600 dark:text-sky-400 bg-sky-500/10', title: 'Model Evaluation Framework', text: 'Speed Prediction Models & Verification Metrics' },
  { to: '/graph-explorer', icon: Network, tint: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10', title: 'Graph Model Explorer', text: 'Mathematical Formulas & Road Network Inspection' },
  { to: '/architecture', icon: GitCommit, tint: 'text-purple-600 dark:text-purple-400 bg-purple-500/10', title: 'System Architecture', text: '5-Stage Pipeline, Tiered Design & ODbL Compliance' },
];

export function MorePage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="page-shell">
      <PageHeader icon={Menu} title="System Operations" subtitle="Research Views, Architecture & Settings" />
      <div className="px-3.5 pt-3.5 pb-8 space-y-4 font-mono">
        {/* Theme Toggle Card */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 shadow-xs text-left cursor-pointer active:scale-[0.99] transition-transform"
        >
          <span className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
              {isDark ? 'Switch to Light Theme' : 'Switch to Dark Cockpit Theme'}
            </span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              Applies tactical contrast to map and operations console
            </span>
          </span>
        </button>

        {/* Research Links */}
        <ul className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/80 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
          {LINKS.map(({ to, icon: Icon, tint, title, text }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex items-center gap-3 px-3.5 py-3 min-h-[56px] hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
              >
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tint}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {title}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {text}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Advisory Attribution */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed">
          <p>
            Tactical Emergency Path Finder · Computer-Aided Dispatch (CAD) System · Greater Noida Road Grid. Map data © OpenStreetMap contributors under Open Database Licence (ODbL).
          </p>
        </div>
      </div>
    </div>
  );
}

export default MorePage;
