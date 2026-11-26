/**
 * System Architecture Page: 5-Stage Operational Pipeline & Architectural Design.
 * Implements Sections 3, 9, and 10 of the DTC B.Tech project report.
 */

import { GitCommit, ArrowRight, Database, Cpu, Navigation, MapPin, ShieldCheck, Layers } from 'lucide-react';

export function Architecture() {
  const pipelineStages = [
    {
      num: '01',
      title: 'Data Ingestion',
      icon: Database,
      desc: 'OSM road geometry via OSMnx / Overpass, historical traffic congestion windows, weather telemetry, and hospital registries.',
      output: 'Validated directed graph G=(V,E) & spatial nodes',
    },
    {
      num: '02',
      title: 'Preprocessing & Match',
      icon: GitCommit,
      desc: 'Coordinate validation, nearest-intersection node snapping, topology sanitization, and road attribute verification.',
      output: 'Clean network feature matrix & topology sanity',
    },
    {
      num: '03',
      title: 'Travel-Time Model',
      icon: Cpu,
      desc: 'Friction modeling and regression baseline compute road speed v(e) and traversal time t(e) = L/v + delay penalties.',
      output: 'Non-negative edge weights w(e) in seconds',
    },
    {
      num: '04',
      title: 'Routing Core',
      icon: Navigation,
      desc: 'Constrained multi-hospital specialty filtering, Dijkstra and A* pathfinding, and dynamic incident re-routing.',
      output: 'Optimal path P, traversal cost t(P), selected facility',
    },
    {
      num: '05',
      title: 'Dispatch Presentation',
      icon: MapPin,
      desc: 'Interactive 2D Leaflet map with 3D ambulance & hospital markers, corridor polylines, arrival countdowns, and caution advisories.',
      output: 'Dispatcher situational awareness & navigation',
    },
  ];

  return (
    <div className="page-shell space-y-4 font-mono">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs transition-colors">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#D62828]" />
          System Architecture & Pipeline Specification
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
          Structured as a decoupled, multi-tiered pipeline separating raw spatial data from velocity modeling, search algorithms, and presentation dispatch.
        </p>
      </div>

      {/* 5-Stage Operational Pipeline */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Report Figure 1: 5-Stage Operational Pipeline
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            End-to-end data flow from OpenStreetMap extracts to CAD dispatch route manifest.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.num}
                className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-lg p-3.5 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-[#D62828] dark:text-red-400">{stage.num}</span>
                    <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs mb-1">{stage.title}</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">{stage.desc}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-950/70 p-2 rounded">
                  <span className="text-slate-400 block uppercase font-bold text-[9px]">Stage Output:</span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">{stage.output}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input / Output Specification Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="border-b border-slate-100 dark:border-slate-800/80 pb-2">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            System Input & Output Parameter Specifications (Section 3)
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Interface contract definitions governing algorithmic modules.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-500 bg-slate-50 dark:bg-slate-900/60">
                <th className="py-2.5 px-3">Input / Parameter</th>
                <th className="py-2.5 px-3">Type Specification</th>
                <th className="py-2.5 px-3">Operational Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px]">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">Ambulance location</td>
                <td className="py-2.5 px-3 text-slate-500">Lat & lon coordinates (decimal WGS84)</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-sans">Identifies source location and snaps to nearest valid road-network intersection node.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">Emergency category</td>
                <td className="py-2.5 px-3 text-slate-500">Enum (trauma, cardiac, burn, general)</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-sans">Constrains and filters destination hospital candidates by verified emergency specialty.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">Road-network attributes</td>
                <td className="py-2.5 px-3 text-slate-500">Length, directionality, highway class, limit</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-sans">Defines physically plausible and legally valid street traversal corridors.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">Traffic context</td>
                <td className="py-2.5 px-3 text-slate-500">Congestion window, friction multiplier, weather</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-sans">Calculates dynamic traversal delay t(e) across directed graph edges.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">Hospital information</td>
                <td className="py-2.5 px-3 text-slate-500">Coordinates, specialties, capacity registry</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-sans">Supplies target destination nodes for graph traversal.</td>
              </tr>
              <tr className="bg-red-500/10 font-medium">
                <td className="py-2.5 px-3 font-bold text-[#D62828] dark:text-red-400">System Outputs</td>
                <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">Polyline, ETA, Triage Ranking, Alternates</td>
                <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 font-sans">Optimal route corridor, predicted duration, alternate contingency facilities, and cautions.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4-Tier Layered Architecture Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400">Tiers 1 & 2</span>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
            Data Ingestion & Speed Prediction Layers
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
            The data layer ingests OpenStreetMap street topology and contextual telemetry. The prediction layer computes segment velocity v(e). Critically, prediction is isolated from search so the routing core operates purely on non-negative travel times.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800/80 p-4 sm:p-5 shadow-xs space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400">Tiers 3 & 4</span>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm text-[#D62828] dark:text-red-400">
            Pathfinding Engine & Tactical CAD Presentation
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
            The routing core executes Dijkstra and A* pathfinding using custom binary min-heaps. The presentation tier displays the 2D Leaflet situational map with 3D ambulance & hospital diagrams, route polylines, and live telemetry.
          </p>
        </div>
      </div>

      {/* Open Database Licence (ODbL) Compliance */}
      <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 text-xs space-y-2 text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>OpenStreetMap Open Database Licence (ODbL 1.0) Governance</span>
        </div>
        <p className="text-[11px] font-sans leading-relaxed">
          OpenStreetMap data are provided under the Open Database Licence (ODbL 1.0). In accordance with Sections 10 and 11 of the report, all map interfaces explicitly display the &copy; OpenStreetMap contributors attribution.
        </p>
      </div>
    </div>
  );
}

export default Architecture;
