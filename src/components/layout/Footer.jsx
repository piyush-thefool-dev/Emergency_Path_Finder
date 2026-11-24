/**
 * 21st.dev style Application Footer: Technical Specification & Academic Attribution.
 */

import { Activity, ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-[#070B12] text-slate-300 dark:text-slate-400 text-xs mt-auto border-t border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-400">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D62828] shadow-[0_0_8px_rgba(214,40,40,0.6)]"></span>
              <h4 className="font-bold text-slate-100 uppercase tracking-wider text-[11px] font-mono">
                Emergency Path Finder for Ambulances
              </h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              B.Tech Computer Science & Engineering
              <br />
              <span className="text-slate-200 font-semibold">Delhi Technical Campus, Greater Noida</span> (Affiliated to GGSIPU)
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-100 uppercase tracking-wider text-[11px] font-mono">
              Research & Development
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed font-mono">
              Created By: Piyush Kumar · Nilesh Kumar Singh · Abhishek Maurya
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-100 uppercase tracking-wider text-[11px] font-mono">
              Licensing & Map Data Governance
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">
              Street geometry:{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white transition-colors"
              >
                © OpenStreetMap contributors
              </a>{' '}
              under ODbL 1.0. Live weather telemetry via Open-Meteo.
            </p>
          </div>
        </div>

        <div className="pt-5 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
          <p>
            <strong className="text-slate-400">OPERATIONAL NOTICE:</strong> Computer-Aided Dispatch (CAD) System · Real-time A* dynamic corridor optimization & hospital triage routing.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Node G=(V,E,w) Engine
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
