/**
 * Prediction.jsx
 * 
 * Purpose: Diagnostic analytics page displaying deep learning model parameters and validation charts.
 * Props: None.
 * Data Flow: Uses Recharts to plot simulated validation metrics (loss / epoch).
 * Design: High-end medical analytics widgets, parameters cards, and validation curve plots.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ArrowLeft, Cpu, Activity, ShieldCheck, Database, Award } from 'lucide-react';

export function Prediction() {
  // Simulated epoch validation loss curves
  const trainingData = [
    { epoch: 10, trainLoss: 0.125, valLoss: 0.145 },
    { epoch: 20, trainLoss: 0.082, valLoss: 0.098 },
    { epoch: 30, trainLoss: 0.054, valLoss: 0.071 },
    { epoch: 40, trainLoss: 0.041, valLoss: 0.058 },
    { epoch: 50, trainLoss: 0.032, valLoss: 0.049 },
    { epoch: 60, trainLoss: 0.026, valLoss: 0.042 },
    { epoch: 70, trainLoss: 0.022, valLoss: 0.038 },
    { epoch: 80, trainLoss: 0.019, valLoss: 0.035 },
    { epoch: 90, trainLoss: 0.017, valLoss: 0.033 },
    { epoch: 100, trainLoss: 0.015, valLoss: 0.031 },
  ];

  const modelMetrics = [
    { label: 'Architecture', value: '3D Res-UNet', desc: 'ResNet backbone with skip links', icon: Cpu },
    { label: 'Parameters', value: '48.2 Million', desc: 'Dense convolutional tensors', icon: Database },
    { label: 'Validation Loss', value: '1.24% MAE', desc: 'Mean absolute voxel error', icon: Activity },
    { label: 'Gamma Evaluation', value: '97.2%', desc: '3mm / 3% criteria threshold', icon: Award },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-dots bg-slate-950 dark:bg-slate-950 light:bg-slate-50 transition-colors duration-300 select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Planning Workspace
          </Link>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
            Model Diagnostic Center
          </span>
        </div>

        {/* Header Title */}
        <div>
          <h1 className="text-2xl font-black text-white dark:text-white light:text-slate-900 tracking-tight">
            AI Dose Engine Specifications
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-600 mt-1">
            Performance metrics and training history benchmarks for RadDose-AI Net model.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {modelMetrics.map((metric, i) => (
            <div
              key={i}
              className="border border-slate-900 rounded-2xl p-4 bg-slate-900/35 backdrop-blur-sm light:border-slate-200 light:bg-white flex items-start gap-3.5"
            >
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
                <metric.icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  {metric.label}
                </span>
                <span className="text-lg font-black text-white dark:text-white light:text-slate-900 mt-1 block">
                  {metric.value}
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5 font-medium leading-tight">
                  {metric.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Validation Plots Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Epoch Loss Curves Chart (takes 2 cols) */}
          <div className="border border-slate-905 p-4 rounded-2xl bg-slate-900/20 light:border-slate-200 light:bg-white md:col-span-2 flex flex-col min-h-[300px]">
            <h3 className="text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-800 uppercase tracking-wider mb-4">
              Training & Validation Loss Convergence
            </h3>
            
            <div className="flex-1 w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trainingData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.15)" />
                  <XAxis dataKey="epoch" stroke="#64748b" fontSize={10} tickFormatter={(v) => `Epoch ${v}`} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderColor: '#1e293b',
                      fontSize: '11px',
                      borderRadius: '8px',
                      color: '#f8fafc'
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  <Line name="Training Loss" type="monotone" dataKey="trainLoss" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  <Line name="Validation Loss" type="monotone" dataKey="valLoss" stroke="#2dd4bf" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model information card (takes 1 col) */}
          <div className="border border-slate-905 p-4 rounded-2xl bg-slate-900/20 light:border-slate-200 light:bg-white flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 dark:text-slate-300 light:text-slate-800 uppercase tracking-wider">
                Clinical Dataset Benchmark
              </h3>
              
              <div className="space-y-3.5 text-xs text-slate-400">
                <div>
                  <span className="font-semibold text-slate-300 light:text-slate-700 block">Dataset Origin</span>
                  <p className="text-[10px] mt-0.5">C3D-RT Open Dataset: 650 high-resolution planning cases.</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-300 light:text-slate-700 block">Anatomical Region</span>
                  <p className="text-[10px] mt-0.5">Head & Neck (OAR sparing optimization constraints).</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-300 light:text-slate-700 block">Prescription Doses</span>
                  <p className="text-[10px] mt-0.5">Range 50.0 Gy to 70.0 Gy voxel intensity target normalization.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 light:border-slate-200 flex items-start gap-2.5 text-[10px] text-emerald-400 font-semibold bg-emerald-500/5 p-2.5 rounded-xl">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-emerald-300">Model Certified</p>
                <p className="font-normal text-slate-400 mt-0.5 leading-relaxed">RadDose-AI Net v4 has completed validation tests (Gamma test index &gt; 95% threshold criteria).</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Prediction;
