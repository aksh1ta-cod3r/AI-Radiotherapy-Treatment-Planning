/**
 * DoseSummary.jsx
 * 
 * Purpose: Render high-level clinical statistics for the dose prediction.
 * Props: None.
 * Data Flow: Reads dose parameters (max, mean, min, coverage, etc.) from `predictionStore`.
 * Design: Grid of clean card items, animated with Framer Motion, with color highlights.
 */
import { motion } from 'framer-motion';
import { usePredictionStore } from '../../store/predictionStore';
import { Shield, Activity, Percent, Star, Award, ChevronUp } from 'lucide-react';

export function DoseSummary() {
  const { predictionData, isLoading } = usePredictionStore();

  const summary = predictionData?.doseSummary;

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-900/60 rounded-xl border border-slate-800/80 light:bg-slate-200" />
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/30 text-center py-6 light:border-slate-200">
        <p className="text-xs text-slate-500 font-medium">Awaiting prediction output to display dosimetry summary...</p>
      </div>
    );
  }

  const statItems = [
    {
      title: 'Maximum Dose',
      value: `${summary.maxDose.toFixed(1)} Gy`,
      sub: 'Point Dose',
      color: 'text-rose-500',
      icon: ChevronUp,
    },
    {
      title: 'Mean Dose',
      value: `${summary.meanDose.toFixed(1)} Gy`,
      sub: 'Integral Dose',
      color: 'text-teal-400',
      icon: Activity,
    },
    {
      title: 'Target Coverage',
      value: `${summary.coverage.toFixed(1)}%`,
      sub: `V${Math.round(summary.prescriptionDose)} >= 95% Rx`,
      color: 'text-emerald-400',
      icon: Percent,
    },
    {
      title: 'Conformity Index',
      value: summary.conformityIndex.toFixed(2),
      sub: 'Ideal: 1.0 (V95/V_ptv)',
      color: 'text-sky-400',
      icon: Award,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 select-none"
    >
      {statItems.map((item, idx) => (
        <motion.div
          key={idx}
          variants={itemVariants}
          className="border border-slate-800 rounded-xl p-3 bg-slate-900/40 backdrop-blur hover:border-slate-700/60 transition-colors flex items-center justify-between dark:border-slate-800 dark:bg-slate-900/40 light:border-slate-200 light:bg-slate-50/50"
        >
          <div className="min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              {item.title}
            </span>
            <span className={`text-base font-extrabold tracking-tight mt-1 block ${item.color}`}>
              {item.value}
            </span>
            <span className="text-[9px] text-slate-500 block truncate font-medium mt-0.5">
              {item.sub}
            </span>
          </div>

          <div className={`p-1.5 rounded-lg bg-slate-800/80 light:bg-slate-100 ${item.color}`}>
            <item.icon className="w-4 h-4" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default DoseSummary;
