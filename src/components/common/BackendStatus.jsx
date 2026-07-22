/**
 * BackendStatus.jsx
 * 
 * Purpose: Display status indicator representing connection to Flask backend API.
 * Props: None.
 * Data Flow: Polls `apiService.checkStatus()` every 10 seconds, writing status to `predictionStore`.
 * Design: Small pills with animatable indicator rings. Red when offline, teal when online.
 */
import { useEffect } from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { apiService } from '../../services/api';
import { usePredictionStore } from '../../store/predictionStore';

export function BackendStatus() {
  const { isBackendConnected, setBackendConnected, simulationMode } = usePredictionStore();

  useEffect(() => {
    let active = true;

    const checkBackend = async () => {
      const isOnline = await apiService.checkStatus();
      if (active) {
        setBackendConnected(isOnline);
      }
    };

    // Run immediately and then poll
    checkBackend();
    const interval = setInterval(checkBackend, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [setBackendConnected]);

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-slate-900/60 dark:bg-slate-900/60 border-slate-700/50 transition-all duration-300">
      {isBackendConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5" />
            Backend Connected
          </span>
        </>
      ) : simulationMode ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="pulse-active absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          <span className="text-teal-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Simulation Mode (Active)
          </span>
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="text-rose-400 flex items-center gap-1">
            <WifiOff className="w-3.5 h-3.5" />
            Backend Offline
          </span>
        </>
      )}
    </div>
  );
}

export default BackendStatus;
