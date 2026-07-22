/**
 * DVHChart.jsx
 * 
 * Purpose: Render Dose-Volume Histograms (DVH) mapping Dose (Gy) to Organ Volume percentage (%).
 * Props: None.
 * Data Flow:
 *   - Pulls mathematical DVH arrays from mockData.js.
 *   - Subscribes to `selectedOrgans` and `organConfigs` in predictionStore to filter plotted lines.
 *   - Updates chart curves dynamically with matching line colors.
 * Design: High contrast dark chart layout, smooth curves, rich tooltips, and PNG/CSV download triggers.
 */
import { useRef } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Download, FileSpreadsheet, Image } from 'lucide-react';
import { usePredictionStore } from '../../store/predictionStore';
import { generateDVHData } from '../../utils/mockData';
import { toast } from 'react-hot-toast';

export function DVHChart() {
  const { selectedOrgans, organConfigs, predictionData } = usePredictionStore();
  const chartRef = useRef(null);

  // Generate full DVH data array
  const dvhData = predictionData?.metadata?.dvhData || generateDVHData();

  if (!predictionData) {
    return (
      <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/30 text-center py-10 h-72 flex flex-col justify-center items-center light:border-slate-200">
        <FileSpreadsheet className="w-8 h-8 text-slate-600 mb-2" />
        <p className="text-xs text-slate-500 font-medium">Awaiting radiotherapy prediction output to plot DVH...</p>
      </div>
    );
  }

  // Export plotted data as clinical CSV sheet
  const downloadCSV = () => {
    try {
      if (selectedOrgans.length === 0) {
        toast.error('No organs selected to export');
        return;
      }

      // Build header row
      const headers = ['Dose (Gy)', ...selectedOrgans.map(name => `${name} (%)`)];
      const csvRows = [headers.join(',')];

      // Add data rows
      dvhData.forEach(row => {
        const values = [
          row.dose,
          ...selectedOrgans.map(name => row[name] !== undefined ? row[name].toFixed(2) : '0.00')
        ];
        csvRows.push(values.join(','));
      });

      // Assemble download link
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DVH_Data_${predictionData.metadata.patientId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('DVH CSV exported successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV');
    }
  };

  // Export Recharts SVG layout directly into a PNG image download
  const downloadPNG = () => {
    try {
      const chartContainer = chartRef.current;
      if (!chartContainer) return;

      // Locate recharts SVG node
      const svgElement = chartContainer.querySelector('.recharts-wrapper svg');
      if (!svgElement) {
        toast.error('SVG chart elements not found');
        return;
      }

      // Convert SVG node to clean XML text
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgElement);

      // Force transparent backgrounds to solid color depending on dark/light setting
      const isDark = !document.body.classList.contains('light');
      const bgColor = isDark ? '#020617' : '#f8fafc';
      const textColor = isDark ? '#ffffff' : '#000000';
      svgString = svgString.replace('<svg', `<svg style="background: ${bgColor}; font-family: sans-serif; color: ${textColor};"`);

      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const image = new window.Image();
      image.onload = () => {
        // Draw onto a temporary canvas
        const canvas = document.createElement('canvas');
        canvas.width = svgElement.clientWidth * 2; // High-res retina scale
        canvas.height = svgElement.clientHeight * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, svgElement.clientWidth, svgElement.clientHeight);
        ctx.drawImage(image, 0, 0);

        // Download canvas to PNG
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `DVH_Chart_${predictionData.metadata.patientId}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        URL.revokeObjectURL(svgUrl);
        toast.success('DVH Chart exported as PNG');
      };
      
      image.src = svgUrl;
    } catch (err) {
      console.error(err);
      toast.error('Failed to export PNG');
    }
  };

  return (
    <div className="border border-slate-800 rounded-2xl p-4 bg-slate-900/40 flex flex-col min-h-0 select-none light:border-slate-200 light:bg-slate-50/50">
      {/* Chart Ribbon Header */}
      <div className="flex justify-between items-center mb-4 text-xs font-semibold text-slate-400">
        <span className="flex items-center gap-1.5 text-teal-400">
          Dose-Volume Histograms (DVH)
        </span>
        
        <div className="flex items-center gap-2">
          {/* CSV export */}
          <button
            onClick={downloadCSV}
            title="Download plotted DVH coordinates as CSV"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer light:bg-white light:border-slate-200 light:text-slate-700 light:hover:text-slate-900"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            CSV
          </button>
          
          {/* PNG Export */}
          <button
            onClick={downloadPNG}
            title="Export chart as PNG image"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-850 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer light:bg-white light:border-slate-200 light:text-slate-700 light:hover:text-slate-900"
          >
            <Image className="w-3.5 h-3.5" />
            PNG
          </button>
        </div>
      </div>

      {/* Recharts Plotted Container */}
      <div ref={chartRef} className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dvhData}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.25)" />
            <XAxis
              type="number"
              domain={[0, 80]}
              tickCount={9}
              dataKey="dose"
              stroke="#64748b"
              fontSize={10}
              tickFormatter={(v) => `${v} Gy`}
            />
            <YAxis
              type="number"
              domain={[0, 100]}
              tickCount={6}
              stroke="#64748b"
              fontSize={10}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                borderColor: '#1e293b',
                fontSize: '11px',
                borderRadius: '8px',
                color: '#f8fafc'
              }}
              labelFormatter={(dose) => `Dose: ${dose} Gy`}
            />
            
            {/* Draw active lines corresponding to selected organs */}
            {selectedOrgans.map(name => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={organConfigs[name]?.color || '#94a3b8'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                animationDuration={800}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default DVHChart;
