/**
 * Home.jsx
 * 
 * Purpose: Interactive welcome page providing product info, model specifications, and planning triggers.
 * Props: None.
 * Data Flow: Simple React Router navigate links to /dashboard.
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Sparkles, Box, BarChart3, ArrowRight, BookOpen, Layers } from 'lucide-react';

export function Home() {
  // Card stagger animation settings
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 90 } }
  };

  const features = [
    {
      title: '3D Voxel Dose Prediction',
      desc: 'Predict complete 3D dosage distributions from patient segmentations under 2 seconds, trained on VMAT/IMRT cases.',
      icon: Activity,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10'
    },
    {
      title: 'PACS Slice Canvas Viewer',
      desc: 'High-performance axial slice viewer supporting window width/leveling contrast, slice traversal, and zoom/pan.',
      icon: Layers,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10'
    },
    {
      title: '3D Organ Volume Renderer',
      desc: 'WebGL volumetric mesh layouts render body outlines, organs-at-risk (OARs), targets (PTVs), and scatter dose clouds.',
      icon: Box,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10'
    },
    {
      title: 'Clinical DVH Diagnostics',
      desc: 'Plot real-time Dose-Volume Histograms for custom organ selections, with native CSV dosimetry table exporting.',
      icon: BarChart3,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 relative bg-dots select-none bg-slate-950 dark:bg-slate-950 light:bg-slate-50 transition-colors duration-300">
      {/* Decorative backdrop glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Primary Landing Card */}
      <div className="max-w-4xl w-full text-center relative z-10 py-12">
        {/* Glowing badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 text-xs font-bold uppercase tracking-wider mb-6"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Next-Generation RT Dosimetry
        </motion.div>

        {/* Hero title */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-black text-white dark:text-white light:text-slate-900 tracking-tight leading-none"
        >
          AI Radiotherapy Dose <br className="hidden md:inline" />
          <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Prediction System
          </span>
        </motion.h1>

        {/* Supporting description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xs md:text-sm text-slate-400 light:text-slate-600 mt-4 max-w-xl mx-auto leading-relaxed"
        >
          An advanced web portal designed for medical physics analysis. Instantly upload patient structure sets, parse 3D voxel dose predictions, and evaluate planning safety metrics.
        </motion.p>

        {/* CTA workspace trigger */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex justify-center gap-3.5"
        >
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/10 hover:shadow-teal-400/20 transition-all flex items-center gap-2 cursor-pointer scale-102"
          >
            Open Planning Workspace
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Key Features Columns Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 text-left"
        >
          {features.map((feat, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="border border-slate-900 rounded-2xl p-4 bg-slate-900/30 hover:border-slate-800 hover:bg-slate-900/50 transition-all light:border-slate-200 light:bg-white light:hover:bg-slate-50 flex flex-col h-full"
            >
              <div className={`w-10 h-10 rounded-xl ${feat.bg} ${feat.color} flex items-center justify-center mb-4`}>
                <feat.icon className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-white dark:text-white light:text-slate-900 uppercase tracking-wider">
                {feat.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed flex-1">
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Model parameters information sheet */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-4 border border-slate-900 rounded-2xl bg-slate-900/15 max-w-xl mx-auto flex items-start gap-3.5 text-left text-xs light:border-slate-200 light:bg-slate-100/50"
        >
          <ShieldAlert className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-white dark:text-white light:text-slate-800">Clinical Warning & Context</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              This system utilizes deep learning models for radiotherapy dose prediction. The generated dose volumes are for research purposes, clinical validation, and pre-planning reviews. All dosage distributions must be verified and approved by a qualified medical physicist before delivery.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Home;
