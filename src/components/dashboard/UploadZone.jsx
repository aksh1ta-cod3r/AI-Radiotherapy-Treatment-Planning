/**
 * UploadZone.jsx
 * 
 * Purpose: Manage file uploading (drag & drop for NPZ).
 * Props: None.
 * Data Flow: 
 *   - Receives file -> Uploads to Flask backend API (via apiService) OR executes simulation mode.
 *   - Triggers progress updates and writes predicted results into predictionStore.
 * Design: High contrast drop area with interactive dashed borders, upload animations, and error cards.
 */
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertTriangle, RefreshCw, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePredictionStore } from '../../store/predictionStore';
import { apiService } from '../../services/api';
import { toast } from 'react-hot-toast';

export function UploadZone() {
  const {
    uploadedFile,
    uploadProgress,
    isLoading,
    error,
    simulationMode,
    isBackendConnected,
    setUploadedFile,
    setUploadProgress,
    setLoading,
    setError,
    setPredictionData,
    triggerSimulation,
    resetStore
  } = usePredictionStore();

  const handleUpload = useCallback(async (file) => {
    if (!file.name.endsWith('.npy')) {
      toast.error('Invalid file format. Please upload an NPY file.');
      return;
    }

    setUploadedFile({ name: file.name, size: file.size });
    setUploadProgress(0);
    setError(null);

    // If simulation mode or backend is down, run simulated prediction
    if (simulationMode || !isBackendConnected) {
      if (!isBackendConnected && !simulationMode) {
        toast.error('Backend offline. Reverting to Simulation Mode.');
      }
      triggerSimulation();
      return;
    }

    // Live mode upload
    setLoading(true);
    try {
      const data = await apiService.predictDose(file, (progress) => {
        setUploadProgress(progress);
      });
      setPredictionData(data);
      toast.success('Dose prediction complete!');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Connection timeout. Dose prediction failed.');
      toast.error('Prediction failed');
    } finally {
      setLoading(false);
    }
  }, [simulationMode, isBackendConnected, triggerSimulation, setUploadedFile, setUploadProgress, setError, setLoading, setPredictionData]);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
    }
  }, [handleUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.npy'],
      'application/x-zip-compressed': ['.npy'],
    },
    multiple: false,
    disabled: isLoading,
  });

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          /* Dropzone Area */
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-teal-400 bg-teal-500/5 shadow-inner'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 light:border-slate-300 light:bg-slate-50/50 light:hover:bg-slate-100/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-11 h-11 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3 group-hover:text-teal-400 transition-colors light:bg-slate-100 light:text-slate-500">
              <Upload className="w-5.5 h-5.5 animate-bounce" />
            </div>
            
            <p className="text-sm font-semibold text-white dark:text-white light:text-slate-800">
              Drag & drop patient file
            </p>
            <p className="text-[11px] text-slate-400 mt-1 mb-2">
              Supported files: <code className="bg-slate-800/60 px-1 py-0.5 rounded font-mono light:bg-slate-200">.npy</code>
            </p>
            
            <button
              type="button"
              className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 shadow-md hover:bg-teal-400 transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-current" />
              Demo Simulated Load
            </button>
          </motion.div>
        ) : (
          /* Progress / Status Area */
          <motion.div
            key="status"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="border border-slate-800 rounded-xl p-4 bg-slate-900/70 light:border-slate-200 light:bg-white"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800/80 text-teal-400 light:bg-slate-100">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white dark:text-white light:text-slate-800 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatSize(uploadedFile.size)}
                </p>
              </div>
              
              {!isLoading && !error && (
                <div className="text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Error state */}
            {error && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2 text-xs text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-300">Upload failed</p>
                  <p className="text-[10px] leading-relaxed mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Progress bar / Prediction spinner */}
            {isLoading && (
              <div className="mt-4">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    AI predicting dose...
                  </span>
                  <span className="text-teal-400 font-bold">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden light:bg-slate-100">
                  <motion.div
                    className="h-full bg-teal-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
            )}

            {/* Action buttons (Clear / Retry) */}
            {!isLoading && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={resetStore}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors light:border-slate-200 light:text-slate-700 light:hover:bg-slate-100"
                >
                  Reset Upload
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UploadZone;
