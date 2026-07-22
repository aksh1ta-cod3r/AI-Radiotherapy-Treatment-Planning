/**
 * PatientInfo.jsx
 * 
 * Purpose: Display CT scan specifications and AI model parameters.
 * Props: None.
 * Data Flow: Reads metadata from usePredictionStore.
 * Design: Two-column grid with labeled metrics, skeleton states during loading, and clear placeholder alerts.
 */
import { User, Activity, CheckCircle, Info } from 'lucide-react';
import { usePredictionStore } from '../../store/predictionStore';

export function PatientInfo() {
  const { predictionData, isLoading } = usePredictionStore();

  if (isLoading) {
    return (
      <div className="border border-slate-800/80 rounded-xl p-4 bg-slate-900/40 animate-pulse light:border-slate-200 light:bg-slate-50/50">
        <div className="h-4 bg-slate-800 w-1/3 rounded mb-3 light:bg-slate-200"></div>
        <div className="space-y-2">
          <div className="h-3.5 bg-slate-800 rounded light:bg-slate-200"></div>
          <div className="h-3.5 bg-slate-800 rounded light:bg-slate-200"></div>
          <div className="h-3.5 bg-slate-800 rounded light:bg-slate-200"></div>
        </div>
      </div>
    );
  }

  const meta = predictionData?.metadata;

  return (
    <div className="border border-slate-800/80 rounded-xl p-4 bg-slate-900/40 transition-colors light:border-slate-200 light:bg-slate-50/50">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5" />
        Patient Information
      </h3>

      {!meta ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-xs text-slate-500 font-medium">No patient data loaded</p>
          <p className="text-[10px] text-slate-600 mt-0.5">Upload an NPZ file to begin prediction</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Patient ID</span>
            <span className="font-bold text-white dark:text-white light:text-slate-900 font-mono">
              {meta.patientId}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Prediction Time</span>
            <span className="font-bold text-teal-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-teal-500 shrink-0" />
              {meta.predictionTime}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Grid Size</span>
            <span className="font-medium text-slate-300 light:text-slate-700">
              {meta.imageSize}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Voxel Size</span>
            <span className="font-medium text-slate-300 light:text-slate-700">
              {meta.voxelSize}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Slice Count</span>
            <span className="font-medium text-slate-300 light:text-slate-700">
              {meta.sliceCount} slices
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Organs / PTVs</span>
            <span className="font-medium text-slate-300 light:text-slate-700">
              {meta.numOrgans} volumes
            </span>
          </div>

          <div className="col-span-2 pt-2 border-t border-slate-800/80 light:border-slate-200 mt-1">
            <span className="text-slate-400 block mb-0.5">Dose Model Version</span>
            <span className="font-bold text-slate-300 dark:text-slate-300 light:text-slate-700 font-mono text-[11px]">
              {meta.modelVersion}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientInfo;
