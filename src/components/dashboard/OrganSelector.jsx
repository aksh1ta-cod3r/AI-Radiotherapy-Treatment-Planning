/**
 * OrganSelector.jsx
 * 
 * Purpose: Interactive panel for toggling organ/PTV layer overlays, colors, and opacities.
 * Props: None.
 * Data Flow: 
 *   - Updates visibility (`toggleOrganSelection`) and color/opacity (`updateOrganConfig`) in predictionStore.
 *   - Triggers re-renders in 2D CT viewer, 3D Canvas, and DVH charts.
 * Design: Expandable list rows, separate OAR vs PTV groups, custom slider, and native color-picker buttons.
 */
import { useState } from 'react';
import { Eye, EyeOff, Settings, Search, CheckSquare, Square, Sliders, Palette } from 'lucide-react';
import { usePredictionStore } from '../../store/predictionStore';

export function OrganSelector() {
  const { predictionData, organConfigs, toggleOrganSelection, updateOrganConfig, selectedOrganForStats, setSelectedOrganForStats } = usePredictionStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrgan, setExpandedOrgan] = useState(null);

  if (!predictionData) {
    return (
      <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/30 text-center py-6 light:border-slate-200">
        <p className="text-xs text-slate-500 font-medium">Awaiting prediction data to load organ structures...</p>
      </div>
    );
  }

  // Get organs from the active store configs
  const organsList = Object.keys(organConfigs).map(name => ({
    name,
    ...organConfigs[name],
    type: name.startsWith('PTV') ? 'PTV' : 'OAR'
  }));

  const filteredOrgans = organsList.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ptvs = filteredOrgans.filter(o => o.type === 'PTV');
  const oars = filteredOrgans.filter(o => o.type === 'OAR');

  const toggleExpand = (name) => {
    setExpandedOrgan(expandedOrgan === name ? null : name);
  };

  const renderOrganRow = (organ) => {
    const isExpanded = expandedOrgan === organ.name;
    const isStatTarget = selectedOrganForStats === organ.name;

    return (
      <div
        key={organ.name}
        className={`border-b border-slate-800/60 dark:border-slate-800/60 transition-colors last:border-0 hover:bg-slate-900/40 light:border-slate-200 light:hover:bg-slate-100/50 ${
          isStatTarget ? 'bg-teal-500/5 dark:bg-teal-500/5 border-l-2 border-l-teal-500' : ''
        }`}
      >
        <div className="flex items-center justify-between p-2 text-xs">
          {/* Left: Checkbox + Color Indicator + Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => toggleOrganSelection(organ.name)}
              className="text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer"
            >
              {organ.visible ? (
                <CheckSquare className="w-4 h-4 text-teal-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>

            {/* Custom Color Dot */}
            <div
              className="w-3.5 h-3.5 rounded shrink-0 border border-slate-700/50 dark:border-slate-700/50"
              style={{ backgroundColor: organ.color }}
            />

            <span
              onClick={() => setSelectedOrganForStats(organ.name)}
              className={`font-medium cursor-pointer truncate ${
                organ.visible
                  ? 'text-white dark:text-white light:text-slate-900'
                  : 'text-slate-500 line-through'
              } hover:text-teal-300 transition-colors`}
              title="Click to select for DVH / statistics focus"
            >
              {organ.name}
            </span>
          </div>

          {/* Right: Expand Config Button + Stats indicator */}
          <div className="flex items-center gap-2">
            {isStatTarget && (
              <span className="text-[9px] bg-teal-500/10 text-teal-400 px-1 py-0.2 rounded uppercase font-bold tracking-wider">
                Stats
              </span>
            )}
            
            <button
              onClick={() => toggleExpand(organ.name)}
              className={`p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors light:hover:bg-slate-200 light:hover:text-slate-800 ${
                isExpanded ? 'bg-slate-800 text-teal-400 light:bg-slate-200' : ''
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable options (opacity & custom color input) */}
        {isExpanded && (
          <div className="px-8 pb-3 pt-1 text-xs space-y-3.5 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50/50 border-t border-slate-800/30">
            {/* Opacity slider */}
            <div>
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3" />
                  Layer Opacity
                </span>
                <span className="font-bold">{Math.round(organ.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={organ.opacity}
                onChange={(e) => updateOrganConfig(organ.name, { opacity: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 light:bg-slate-200"
              />
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Color Profile
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={organ.color}
                  onChange={(e) => updateOrganConfig(organ.name, { color: e.target.value })}
                  className="w-6 h-6 border-0 p-0 rounded-md cursor-pointer bg-transparent overflow-hidden"
                />
                <span className="font-mono text-[10px] text-slate-400 uppercase select-all">
                  {organ.color}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-slate-800 rounded-xl bg-slate-900/20 flex flex-col min-h-0 h-[380px] overflow-hidden light:border-slate-200 light:bg-slate-50/20">
      {/* Selector Header & Search Bar */}
      <div className="p-3 border-b border-slate-800 light:border-slate-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
          Organ & PTV Layers
        </h3>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search anatomy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 light:bg-white light:border-slate-300 light:text-slate-900"
          />
        </div>
      </div>

      {/* Accordion Organ List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 dark:divide-slate-800/40">
        {/* Targets (PTVs) */}
        {ptvs.length > 0 && (
          <div>
            <div className="bg-slate-900/60 dark:bg-slate-900/60 px-3 py-1.5 text-[10px] font-bold text-teal-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md border-b border-slate-800/40 light:bg-slate-100 light:text-teal-600 light:border-slate-200">
              Targets (PTVs)
            </div>
            {ptvs.map(renderOrganRow)}
          </div>
        )}

        {/* Organs at Risk (OARs) */}
        {oars.length > 0 && (
          <div>
            <div className="bg-slate-900/60 dark:bg-slate-900/60 px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md border-b border-slate-800/40 light:bg-slate-100 light:text-slate-600 light:border-slate-200">
              Organs at Risk (OARs)
            </div>
            {oars.map(renderOrganRow)}
          </div>
        )}

        {filteredOrgans.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-500">
            No matching structures found
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganSelector;
