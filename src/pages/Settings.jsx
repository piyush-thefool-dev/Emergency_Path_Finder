/**
 * System Settings & Graph Governance Page (`/settings`).
 * Provides road network dataset switching, mathematical edge-cost formula workbench,
 * and system architecture specification.
 */

import { useState } from 'react';
import { ShieldCheck, Network } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import GraphExplorer from './GraphExplorer.jsx';
import Architecture from './Architecture.jsx';
import { useDispatch } from '../context/DispatchContext.jsx';
import { GRAPH_MODES_CATALOG } from '../services/graphLoader.js';

export function Settings() {
  const { graph } = useDispatch();
  const [tab, setTab] = useState('graph'); // 'graph' | 'architecture'

  const activeCatalogItem =
    GRAPH_MODES_CATALOG.find((m) => m.id === graph.graphMode) || GRAPH_MODES_CATALOG[0];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings &amp; Graph Governance"
        description="Select road network datasets, inspect mathematical travel-time formulas, and review system architecture."
      />

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200/80 dark:border-white/[0.08] pb-3">
        {[
          { id: 'graph', label: 'Road Network & Formula Explorer' },
          { id: 'architecture', label: 'System Architecture & Licensing' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`h-9 px-3.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              tab === item.id
                ? 'bg-[#D62828] text-white'
                : 'bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'graph' && (
        <div className="space-y-4">
          {/* Active Road Network Dataset Selector */}
          <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-xs p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-[#D62828] dark:text-red-400 shrink-0" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Active Graph Dataset</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeCatalogItem?.description || 'Directed weighted street topology used by Dijkstra and A* search.'}
              </p>
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Map geometry &copy; OpenStreetMap contributors (ODbL 1.0).</span>
              </div>
            </div>

            <div className="w-full lg:w-80 shrink-0">
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Switch Network Topology
              </label>
              <select
                aria-label="Active road graph dataset"
                value={graph.graphMode}
                onChange={(e) => graph.setGraphMode(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200/90 dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-950/60 text-xs text-slate-900 dark:text-slate-100"
              >
                {GRAPH_MODES_CATALOG.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <GraphExplorer />
        </div>
      )}

      {tab === 'architecture' && <Architecture />}
    </div>
  );
}

export default Settings;
