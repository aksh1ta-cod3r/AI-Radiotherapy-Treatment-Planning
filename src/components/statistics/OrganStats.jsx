/**
 * OrganStats.jsx
 * 
 * Purpose: Display detailed dosimetry and volumetric data for the active focused organ.
 * Props: None.
 * Data Flow:
 *   - Subscribes to `selectedOrganForStats` and `organConfigs` from `predictionStore`.
 *   - Displays statistics (mean, max, min, D95, volume) fetched from mockData.js or store.
 * Design: High quality table/grid list with colored visual markers, clear units, and descriptive tooltips.
 */
import { usePredictionStore } from '../../store/predictionStore';
import { getOrganStats } from '../../utils/mockData';
import { Layers, Activity, Volume2, Shield } from 'lucide-react';

export function OrganStats() {
  const { selectedOrganForStats, organConfigs, predictionData } = usePredictionStore();

  if (!predictionData) {
    return (
      <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/30 text-center py-10 h-64 flex flex-col justify-center items-center light:border-slate-200">
        <Layers className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-xs text-slate-500 font-medium">Awaiting prediction output to display organ metrics...</p>
      </div>
    );
  }

  // Retrieve focused organ configuration and stats
  const activeOrgan = selectedOrganForStats || 'PTV High';
  const config = organConfigs[activeOrgan] || { color: '#94a3b8' };
  const organData = predictionData?.organsList?.find(o => o.name === activeOrgan);
  const stats = organData?.stats || getOrganStats(activeOrgan);

  const metricRows = [
    { label: 'Mean Dose', value: `${stats.meanDose.toFixed(1)} Gy`, desc: 'Average dose over structure volume' },
    { label: 'Maximum Dose', value: `${stats.maxDose.toFixed(1)} Gy`, desc: 'Maximum point dose (D2% limit)' },
    { label: 'Minimum Dose', value: `${stats.minDose.toFixed(1)} Gy`, desc: 'Minimum point dose (D98% limit)' },
    { label: 'D50 (Median)', value: `${stats.d50.toFixed(1)} Gy`, desc: 'Dose received by 50% of the volume' },
    { label: 'D95 Dose', value: `${stats.d95.toFixed(1)} Gy`, desc: 'Dose received by 95% of the volume (near min)' },
    { label: 'D98 Dose', value: `${stats.d98.toFixed(1)} Gy`, desc: 'Dose received by 98% of the volume' },
    { label: 'V95 Volume', value: `${stats.v95.toFixed(1)} %`, desc: 'Volume receiving >= 95% of prescription dose' },
    { label: 'V100 Volume', value: `${stats.v100.toFixed(1)} %`, desc: 'Volume receiving >= 100% of prescription dose' },
    { label: 'Physical Volume', value: `${stats.volume.toFixed(1)} cc`, desc: 'Anatomical volume in cubic centimeters' },
  ];

  return (
    <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/40 dark:border-slate-800 dark:bg-slate-900/40 light:border-slate-200 light:bg-slate-50/50 flex flex-col min-h-0 select-none">
      {/* Panel Header */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-teal-400 shrink-0" />
          Anatomical Dosimetry
        </span>

        {/* Selected Organ Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-800 bg-slate-950/80 light:bg-white light:border-slate-200 text-xs font-bold text-white dark:text-white light:text-slate-800">
          <div
            className="w-2 h-2 rounded-full border border-slate-800 shrink-0"
            style={{ backgroundColor: config.color }}
          />
          {activeOrgan}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {metricRows.map((row, i) => (
          <div
            key={i}
            className="border border-slate-850 p-2.5 rounded-xl bg-slate-950/40 hover:border-slate-800 transition-colors flex flex-col justify-center light:border-slate-200 light:bg-white"
            title={row.desc}
          >
            <span className="text-[10px] text-slate-400 font-bold tracking-wide">
              {row.label}
            </span>
            <span className="text-sm font-extrabold text-slate-100 dark:text-slate-100 light:text-slate-900 mt-1">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrganStats;
