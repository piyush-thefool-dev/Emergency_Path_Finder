/**
 * Application Footer: Technical Specification & Academic Attribution.
 * Adheres to standard municipal/research system documentation layout.
 */

export function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-[#070B12] text-slate-300 dark:text-slate-400 text-xs mt-auto border-t border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-7 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-7 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-400">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#D62828]"></span>
              <h4 className="font-bold text-slate-100 uppercase tracking-wider text-[11px] font-mono">
                Emergency Path Finder for Ambulances
              </h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              B.Tech Computer Science & Engineering
              <br />
              <span className="text-slate-300">Delhi Technical Campus, Greater Noida</span> (Affiliated to GGSIPU)
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-100 uppercase tracking-wider text-[11px] font-mono mb-2">
              Who Made This
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed font-mono">
              Created By: Piyush Kumar · Nilesh Kumar Singh · Abhishek Maurya
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-100 uppercase tracking-wider text-[11px] font-mono mb-2">
              Licensing & Map Data Governance
            </h4>
            <p className="text-slate-400 text-xs leading-relaxed">
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

        <div className="pt-4 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
          <p>
            <strong>OPERATIONAL NOTICE:</strong> Computer-Aided Dispatch (CAD) System · Real-time A* dynamic corridor optimization & hospital triage routing.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Node G=(V,E,w) Engine
            </span>
            <span>MIT License</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
