/**
 * Dashboard.jsx
 * 
 * Purpose: Main workspace view for CT slice analysis and dosimetry analytics.
 * Props: None.
 * Data Flow:
 *   - Reads activeTab, predictionData, isLoading from predictionStore.
 *   - Renders SliceViewer or ThreeDViewer depending on the selected tab in the central viewport.
 *   - Automatically displays an empty state if no patient file is loaded.
 */
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePredictionStore } from '../store/predictionStore';
import Sidebar from '../components/dashboard/Sidebar';
import SliceViewer from '../components/viewer/SliceViewer';
import ThreeDViewer from '../components/threed/ThreeDViewer';
import DVHChart from '../components/charts/DVHChart';
import DoseSummary from '../components/statistics/DoseSummary';
import OrganStats from '../components/statistics/OrganStats';
import Legend from '../components/statistics/Legend';
import UploadZone from '../components/dashboard/UploadZone';
import { Sparkles, FileText, ChevronRight, Activity, BookOpen } from 'lucide-react';

export function Dashboard() {
  const {
    activeTab,
    setActiveTab,
    predictionData,
    isLoading,
    triggerSimulation,
  } = usePredictionStore();

  // Tab controls configuration
  const tabs = [
    { id: 'ct', label: 'CT slice view' },
    { id: 'dose', label: 'Dose Heatmap' },
    { id: 'contour', label: 'Body contour' },
    { id: 'threed', label: '3D rendering' },
  ];

  return (
    <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-950 dark:bg-slate-950 light:bg-slate-50 transition-colors duration-300">
      {/* Sidebar - controls inputs, metadata, and layers */}
      <Sidebar />

      {/* Main Container - divides into Center Viewer and Right Analytics panel */}
      {predictionData ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          
          {/* Center Column: Slice/3D Viewer Workspace */}
          <main className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto min-w-0">
            {/* Main Tabs Selection */}
            <div className="flex justify-between items-center bg-slate-900/40 border border-slate-900 p-1.5 rounded-xl shrink-0 light:bg-white light:border-slate-200 shadow-md">
              <div className="flex gap-1.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-teal-500 text-slate-950 shadow-md scale-102'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 light:hover:text-slate-800 light:hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Viewport Layer */}
            <div className="flex-1 flex flex-col min-h-0">
              {activeTab === 'threed' ? (
                <ThreeDViewer />
              ) : (
                <SliceViewer />
              )}
            </div>

            {/* Dose Legend scale - displayed for CT/Heatmap tabs */}
            {activeTab !== 'contour' && activeTab !== 'threed' && (
              <div className="shrink-0">
                <Legend />
              </div>
            )}
          </main>

          {/* Right Column: Radiotherapy Plan Analytics */}
          <section className="w-full md:w-[380px] border-l border-slate-850 p-4 flex flex-col gap-4 overflow-y-auto shrink-0 bg-slate-900/10 light:border-slate-200 light:bg-white">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 select-none border-b border-slate-850 pb-2 light:border-slate-200">
              <Activity className="w-4 h-4 text-teal-400 shrink-0" />
              Treatment Plan Dosimetry
            </h2>

            {/* 1. Global Metrics Cards */}
            <DoseSummary />

            {/* 2. DVH Graph Overlay */}
            <DVHChart />

            {/* 3. Detailed Volumetric Table */}
            <OrganStats />
          </section>
        </div>
      ) : (
        /* Workspace Empty State */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-dots select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md border border-slate-850 rounded-2xl p-8 bg-slate-900/60 backdrop-blur shadow-2xl flex flex-col items-center light:border-slate-200 light:bg-white"
          >
            <div className="w-14 h-14 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 ring-2 ring-teal-500/25 mb-4">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <h2 className="text-lg font-bold text-white dark:text-white light:text-slate-900">
              Radiotherapy planning workspace
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-sm">
              Upload a processed patient CT volume file (<code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300 light:bg-slate-200">.npz</code>) on the left panel, or trigger the simulation below to pre-populate clinical dose distributions.
            </p>

            <button
              onClick={triggerSimulation}
              disabled={isLoading}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Initializing simulation...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  Load Simulator Demo Case
                </>
              )}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
