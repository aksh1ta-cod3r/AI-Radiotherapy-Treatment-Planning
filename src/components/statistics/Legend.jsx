/**
 * Legend.jsx
 * 
 * Purpose: Display the clinical color key for the radiotherapy dose distribution heatmap (in Gy).
 * Props: None.
 * Data Flow: Reads prescription dose from MOCK_METADATA or active prediction results.
 * Design: Smooth color bar representing Blue (low) -> Green -> Yellow -> Orange -> Red (high dose),
 * with labeled ticks corresponding to clinical levels.
 */
import { usePredictionStore } from '../../store/predictionStore';

export function Legend() {
  const { predictionData } = usePredictionStore();
  
  const rxDose = predictionData?.metadata?.rxDose || 70.0;
  
  // Define ticks based on prescription dose
  const ticks = [
    { value: 2.0, label: '>2 Gy', color: 'rgb(0, 0, 255)' },
    { value: Math.round(rxDose * 0.3), label: `${Math.round(rxDose * 0.3)} Gy`, color: 'rgb(0, 255, 255)' },
    { value: Math.round(rxDose * 0.65), label: `${Math.round(rxDose * 0.65)} Gy`, color: 'rgb(0, 255, 0)' },
    { value: Math.round(rxDose * 0.8), label: `${Math.round(rxDose * 0.8)} Gy`, color: 'rgb(255, 255, 0)' },
    { value: Math.round(rxDose * 0.95), label: `${Math.round(rxDose * 0.95)} Gy`, color: 'rgb(255, 125, 0)' },
    { value: Math.round(rxDose * 1.05), label: `${Math.round(rxDose * 1.05)} Gy`, color: 'rgb(255, 0, 0)' },
  ];

  return (
    <div className="flex flex-col gap-2 p-3.5 border border-slate-800 rounded-xl bg-slate-900/50 light:border-slate-200 light:bg-slate-50/50 text-xs w-full select-none select-none">
      <div className="flex justify-between items-center text-slate-400 font-bold tracking-wider text-[10px] uppercase">
        <span>Dose Heatmap Legend</span>
        <span className="text-teal-400 font-mono font-bold">Prescription: {rxDose} Gy</span>
      </div>

      {/* Gradient bar */}
      <div className="relative h-3 w-full rounded bg-gradient-to-r from-blue-600 via-cyan-400 via-emerald-500 via-yellow-400 via-orange-500 to-red-600 border border-slate-800/80 light:border-slate-300" />

      {/* Grid labels */}
      <div className="flex justify-between items-start text-[10px] text-slate-400 mt-1 font-mono">
        {ticks.map((tick, i) => (
          <div key={i} className="flex flex-col items-center">
            <span className="h-1 w-0.5 bg-slate-700 light:bg-slate-300 mb-1" />
            <span className="font-semibold text-slate-300 light:text-slate-700">{tick.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Legend;
