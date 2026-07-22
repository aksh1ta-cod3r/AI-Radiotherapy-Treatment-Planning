/**
 * Navbar.jsx
 * 
 * Purpose: Top navigation bar for the Radiotherapy dashboard.
 * Includes: Logo, Title, Backend Status, Simulation Toggle, Dark/Light Mode switch, Profile icon.
 * Props: None.
 * Data Flow: Dispatches changes to simulationMode and dark/light settings in predictionStore.
 */
import { Sun, Moon, Database, Activity, Sparkles, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePredictionStore } from '../../store/predictionStore';
import BackendStatus from '../common/BackendStatus';

export function Navbar() {
  const { isDarkMode, toggleDarkMode, simulationMode, setSimulationMode, resetStore, predictionData } = usePredictionStore();

  const handleSimToggle = () => {
    // Reset any state and toggle
    resetStore();
    setSimulationMode(!simulationMode);
  };

  return (
    <header className="h-16 border-b bg-slate-900/50 backdrop-blur-md border-slate-800/80 px-6 flex items-center justify-between z-40 transition-colors duration-300 light:bg-white/70 light:border-slate-200">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3 select-none">
        <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 ring-1 ring-teal-500/30">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white dark:text-white light:text-slate-900 flex items-center gap-1.5">
            AI Radiotherapy Dose Prediction
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
            Clinical Planning Assistant
          </p>
        </div>
      </div>

      {/* Control Actions & Status */}
      <div className="flex items-center gap-4">
        {/* Status indicator */}
        <BackendStatus />

        {/* Simulation toggle */}
        <button
          onClick={handleSimToggle}
          title={simulationMode ? "Switch to Live Server Mode" : "Switch to Demo Simulation Mode"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold select-none transition-all duration-300 ${
            simulationMode
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20'
              : 'bg-slate-900 border-slate-700/50 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          {simulationMode ? "Sim Active" : "Go Sim"}
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-800 light:bg-slate-200" />

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/30 text-slate-300 transition-all light:bg-slate-100 light:border-slate-200 light:text-slate-700 light:hover:bg-slate-200"
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </motion.button>

        {/* User profile */}
        <div className="w-8.5 h-8.5 rounded-full border border-slate-700/40 bg-slate-800/80 flex items-center justify-center text-slate-300 hover:border-slate-600 transition-colors cursor-pointer light:bg-slate-100 light:border-slate-200 light:text-slate-700">
          <User className="w-4.5 h-4.5" />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
