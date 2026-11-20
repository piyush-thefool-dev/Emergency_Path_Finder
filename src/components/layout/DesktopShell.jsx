/**
 * Desktop Shell (>= 1024px):
 * Tactical CAD Command Header + Main Viewport + Operational Footer.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import Dashboard from '../../pages/Dashboard.jsx';
import Benchmark from '../../pages/Benchmark.jsx';
import Evaluation from '../../pages/Evaluation.jsx';
import GraphExplorer from '../../pages/GraphExplorer.jsx';
import Architecture from '../../pages/Architecture.jsx';

export function DesktopShell() {
  return (
    <div className="min-h-dvh flex flex-col bg-[#EEF3FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-[#D62828] selection:text-white transition-colors duration-150">
      <Navbar />
      <main className="app-main flex-1 max-w-7xl w-full mx-auto py-5 pb-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/benchmark" element={<Benchmark />} />
          <Route path="/evaluation" element={<Evaluation />} />
          <Route path="/graph-explorer" element={<GraphExplorer />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default DesktopShell;
