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
  ChevronRight,
  AlertTriangle,
  Truck,
  Building2,
  Route,
  Settings,
} from 'lucide-react';
import MobilePageHeader from '../components/layout/MobilePageHeader.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';

const OPERATIONS_LINKS = [
  { to: '/incidents', icon: AlertTriangle, tint: 'text-[#D62828] dark:text-red-400 bg-red-500/10 border-red-500/20', title: 'Emergency Incidents', text: 'Active dispatch queue, severity & ambulance assignment', showCount: true },
  { to: '/fleet', icon: Truck, tint: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20', title: 'Ambulance Fleet', text: 'Unit readiness, AMB-01 live telemetry & staging roster' },
  { to: '/directory', icon: Building2, tint: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20', title: 'Hospitals', text: 'All 360 facilities state-wise with Distance, ETA & beds' },
  { to: '/routing', icon: Route, tint: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20', title: 'Route Optimization', text: 'Dijkstra vs A* corridor planner, live road probe & weather' },
  { to: '/analytics', icon: BarChart3, tint: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20', title: 'Analytics & Reports', text: 'Empirical speed benchmarks & regional ICU capacity' },
  { to: '/settings', icon: Settings, tint: 'text-slate-700 dark:text-slate-300 bg-slate-500/10 border-slate-500/20', title: 'Settings', text: 'Road network dataset switcher, formulas & governance' },
];

const LINKS = [
  { to: '/benchmark', icon: Cpu, tint: 'text-[#D62828] dark:text-red-400 bg-red-500/10 border-red-500/20', title: 'Algorithmic Benchmark', text: 'Dijkstra vs A* Empirical Performance Audit' },
  { to: '/evaluation', icon: BarChart3, tint: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20', title: 'Model Evaluation Framework', text: 'Speed Prediction Models & Verification Metrics' },
  { to: '/graph-explorer', icon: Network, tint: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20', title: 'Graph Model Explorer', text: 'Mathematical Formulas & Road Network Inspection' },
  { to: '/architecture', icon: GitCommit, tint: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20', title: 'System Architecture', text: '5-Stage Pipeline, Tiered Design & ODbL Compliance' },
];

export function MorePage() {
  const { dispatchIncidents } = useDispatch();
  const openIncidentCount = dispatchIncidents.filter((i) => i.status !== 'RESOLVED').length;

  return (
    <div className="page-shell">
      <MobilePageHeader icon={Menu} title="System Operations" subtitle="Research Views, Architecture & Settings" backTo="/" />
      <div className="px-4 pt-4 pb-8 space-y-4 font-sans">
        {/* Dispatch & Operations Modules */}
        <div className="space-y-1.5">
          <span className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Dispatch Operations &amp; Planning
          </span>
          <ul className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden">
            {OPERATIONS_LINKS.map(({ to, icon: Icon, tint, title, text, showCount }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="flex items-center gap-3.5 px-4 py-3.5 min-h-[60px] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors no-underline"
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
                  {showCount && openIncidentCount > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-[#D62828] text-white text-[10px] font-mono font-bold tabular-nums">
                      {openIncidentCount}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Research Links */}
        <div className="space-y-1.5">
          <span className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Research &amp; Engineering Models
          </span>
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
        </div>

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
