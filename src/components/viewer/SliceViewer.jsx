/**
 * SliceViewer.jsx
 * 
 * Purpose: Interactive 3-View (Axial, Coronal, Sagittal) CT slice viewer with medical imaging controls.
 * Data Flow:
 *   - Reads activeTab, axialIndex, coronalIndex, sagittalIndex, windowWidth, windowLevel, opacity values from predictionStore.
 *   - Loads flat 3D arrays (from public/*.bin) and slices them dynamically.
 *   - Updates slice indices in response to mouse clicks/dragging (PACS crosshair sync).
 * Why this approach was chosen:
 *   - Supports dynamic patient dimensions loaded from arr_0.npy.
 *   - Aspect ratios are set dynamically via styling to prevent clinical image distortion.
 *   - Canvas upscaling with bilinear filtering offers extremely fast slice traversals.
 */
import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize, Crosshair, HelpCircle, Sliders } from 'lucide-react';
import { usePredictionStore } from '../../store/predictionStore';
import { generate3DVolumes } from '../../utils/volumeData';

export function SliceViewer() {
  const {
    activeTab,
    axialIndex,
    setAxialIndex,
    coronalIndex,
    setCoronalIndex,
    sagittalIndex,
    setSagittalIndex,
    predictionData,
    organConfigs,
    windowWidth,
    setWindowWidth,
    windowLevel,
    setWindowLevel,
    ctOpacity,
    doseOpacity,
    setDoseOpacity,
    contourOpacity,
    setContourOpacity,
    crosshairEnabled,
    toggleCrosshair,
  } = usePredictionStore();

  const axialCanvasRef = useRef(null);
  const coronalCanvasRef = useRef(null);
  const sagittalCanvasRef = useRef(null);

  // Local pan, zoom, and mouse position state
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Hover stats tracking
  const [hoveredView, setHoveredView] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [hoverValue, setHoverValue] = useState({ hu: 0, dose: 0, xCoord: 0, yCoord: 0, zCoord: 0 });

  // Get dynamic dimensions from prediction metadata or fall back to default
  const dimensions = predictionData?.metadata || { width: 128, height: 128, depth: 120 };
  const dimW = dimensions.width;
  const dimH = dimensions.height;
  const dimD = dimensions.depth;

  // Defensive fallback: If simulation data is present but volume arrays are missing, generate them on the fly
  useEffect(() => {
    if (predictionData && !predictionData.ctVolume) {
      const volumes = generate3DVolumes();
      usePredictionStore.setState({
        predictionData: {
          ...predictionData,
          ...volumes
        }
      });
    }
  }, [predictionData]);

  // Main rendering loop for all three canvases
  useEffect(() => {
    if (!predictionData || !predictionData.ctVolume) return;

    renderSlice(axialCanvasRef.current, 'axial', axialIndex);
    renderSlice(coronalCanvasRef.current, 'coronal', coronalIndex);
    renderSlice(sagittalCanvasRef.current, 'sagittal', sagittalIndex);
  }, [
    predictionData,
    axialIndex,
    coronalIndex,
    sagittalIndex,
    activeTab,
    zoom,
    pan,
    windowWidth,
    windowLevel,
    ctOpacity,
    doseOpacity,
    contourOpacity,
    organConfigs,
    crosshairEnabled
  ]);

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 128, g: 128, b: 128 };
  };

  const getDoseRGB = (dose) => {
    if (dose <= 2.0) return null;
    const maxDose = predictionData?.metadata?.prescriptionDose || 70;
    const t = Math.min(1.0, dose / (maxDose * 1.07));
    let r = 0, g = 0, b = 0;

    if (t < 0.25) {
      const ratio = t / 0.25;
      g = Math.floor(ratio * 160);
      b = 255;
    } else if (t < 0.5) {
      const ratio = (t - 0.25) / 0.25;
      g = 160 + Math.floor(ratio * 95);
      b = 255 - Math.floor(ratio * 255);
    } else if (t < 0.75) {
      const ratio = (t - 0.5) / 0.25;
      r = Math.floor(ratio * 255);
      g = 255;
    } else if (t < 0.9) {
      const ratio = (t - 0.75) / 0.15;
      r = 255;
      g = 255 - Math.floor(ratio * 130);
    } else {
      const ratio = (t - 0.9) / 0.1;
      r = 255;
      g = 125 - Math.floor(ratio * 125);
    }
    return { r, g, b };
  };

  const renderSlice = (canvas, view, sliceIdx) => {
    if (!canvas || !predictionData || !predictionData.ctVolume) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    if (view === 'axial') {
      W = dimW;
      H = dimH;
    } else if (view === 'coronal') {
      W = dimW;
      H = dimD;
    } else { // sagittal
      W = dimH;
      H = dimD;
    }

    // Create a temporary offscreen buffer for raw pixel manipulation
    const offCanvas = document.createElement('canvas');
    offCanvas.width = W;
    offCanvas.height = H;
    const offCtx = offCanvas.getContext('2d');
    const imgData = offCtx.createImageData(W, H);

    const minHU = windowLevel - windowWidth / 2;
    const maxHU = windowLevel + windowWidth / 2;

    const ctVol = predictionData.ctVolume;
    const doseVol = predictionData.doseVolume;
    const organVols = predictionData.organVolumes;

    // Fast boundary check in 2D sliced space
    const isBoundary = (organVolume, c, r, x, y, z) => {
      const getIdx = (colIdx, rowIdx) => {
        if (view === 'axial') return z * dimH * dimW + rowIdx * dimW + colIdx;
        if (view === 'coronal') return (dimD - 1 - rowIdx) * dimH * dimW + y * dimW + colIdx;
        return (dimD - 1 - rowIdx) * dimH * dimW + colIdx * dimW + x;
      };

      const currIdx = getIdx(c, r);
      if (organVolume[currIdx] === 0) return false;

      if (c === 0 || c === W - 1 || r === 0 || r === H - 1) return true;

      if (organVolume[getIdx(c + 1, r)] === 0) return true;
      if (organVolume[getIdx(c - 1, r)] === 0) return true;
      if (organVolume[getIdx(c, r + 1)] === 0) return true;
      if (organVolume[getIdx(c, r - 1)] === 0) return true;

      return false;
    };

    const activeDoseOpacity = activeTab === 'dose' ? Math.max(doseOpacity, 0.7) : doseOpacity;

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        // Map 2D pixel coordinates to 3D voxel space
        let x = 0, y = 0, z = 0;
        if (view === 'axial') {
          x = c;
          y = r;
          z = sliceIdx;
        } else if (view === 'coronal') {
          x = c;
          y = sliceIdx;
          z = dimD - 1 - r; // Flip Z axis so superior is top
        } else { // sagittal
          x = sliceIdx;
          y = c;
          z = dimD - 1 - r;
        }

        const idx3D = z * dimH * dimW + y * dimW + x;

        // 1. CT Grayscale
        let gray = 0;
        if (activeTab === 'contour') {
          gray = 0;
        } else {
          const hu = ctVol[idx3D];
          const clamped = Math.max(minHU, Math.min(maxHU, hu));
          gray = Math.floor(((clamped - minHU) / (maxHU - minHU)) * 255);
        }

        let R = gray, G = gray, B = gray;

        // 2. Dose Overlay
        if (activeTab === 'ct' || activeTab === 'dose') {
          const dose = doseVol[idx3D];
          const doseColor = getDoseRGB(dose);
          if (doseColor && activeDoseOpacity > 0.01) {
            R = Math.floor((1 - activeDoseOpacity) * R + activeDoseOpacity * doseColor.r);
            G = Math.floor((1 - activeDoseOpacity) * G + activeDoseOpacity * doseColor.g);
            B = Math.floor((1 - activeDoseOpacity) * B + activeDoseOpacity * doseColor.b);
          }
        }

        // 3. Organ Outlines / Translucent Fills
        if (contourOpacity > 0.01) {
          Object.keys(organConfigs).forEach(organName => {
            const config = organConfigs[organName];
            if (!config || !config.visible) return;

            const organVol = organVols[organName];
            if (!organVol || organVol[idx3D] === 0) return;

            const organRGB = hexToRgb(config.color);

            if (isBoundary(organVol, c, r, x, y, z)) {
              const opacity = contourOpacity;
              R = Math.floor((1 - opacity) * R + opacity * organRGB.r);
              G = Math.floor((1 - opacity) * G + opacity * organRGB.g);
              B = Math.floor((1 - opacity) * B + opacity * organRGB.b);
            } else if (activeTab === 'contour') {
              const opacity = config.opacity * 0.4 * contourOpacity;
              R = Math.floor((1 - opacity) * R + opacity * organRGB.r);
              G = Math.floor((1 - opacity) * G + opacity * organRGB.g);
              B = Math.floor((1 - opacity) * B + opacity * organRGB.b);
            }
          });
        }

        const pixelIdx = (r * W + c) * 4;
        imgData.data[pixelIdx] = R;
        imgData.data[pixelIdx + 1] = G;
        imgData.data[pixelIdx + 2] = B;
        imgData.data[pixelIdx + 3] = 255;
      }
    }

    offCtx.putImageData(imgData, 0, 0);

    // Render scaled offscreen buffer onto visible canvas with bilinear interpolation
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Translation matrix for panning and zoom scaling
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(offCanvas, 0, 0, width, height);
    ctx.restore();

    // 4. Reference lines (linked slice planes)
    if (crosshairEnabled) {
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.45)'; // Sleek teal
      ctx.lineWidth = 1;

      if (view === 'axial') {
        const lineX = (sagittalIndex / dimW) * width;
        const lineY = (coronalIndex / dimH) * height;

        ctx.beginPath(); ctx.moveTo(lineX, 0); ctx.lineTo(lineX, height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(width, lineY); ctx.stroke();
      } else if (view === 'coronal') {
        const lineX = (sagittalIndex / dimW) * width;
        const lineY = ((dimD - 1 - axialIndex) / dimD) * height;

        ctx.beginPath(); ctx.moveTo(lineX, 0); ctx.lineTo(lineX, height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(width, lineY); ctx.stroke();
      } else if (view === 'sagittal') {
        const lineX = (coronalIndex / dimH) * width;
        const lineY = ((dimD - 1 - axialIndex) / dimD) * height;

        ctx.beginPath(); ctx.moveTo(lineX, 0); ctx.lineTo(lineX, height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(width, lineY); ctx.stroke();
      }
    }

    // 5. Drawing Clinical Orientation Labels
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.font = 'bold 11px sans-serif';

    const drawTextLabel = (txt, px, py) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      const metrics = ctx.measureText(txt);
      ctx.fillRect(px - metrics.width / 2 - 3, py - 9, metrics.width + 6, 13);
      ctx.fillStyle = '#2dd4bf'; // Clinical teal marker
      ctx.fillText(txt, px - metrics.width / 2, py);
    };

    if (view === 'axial') {
      drawTextLabel('A', width / 2, 16);
      drawTextLabel('P', width / 2, height - 8);
      drawTextLabel('R', 16, height / 2 + 4);
      drawTextLabel('L', width - 20, height / 2 + 4);
    } else if (view === 'coronal') {
      drawTextLabel('S', width / 2, 16);
      drawTextLabel('I', width / 2, height - 8);
      drawTextLabel('R', 16, height / 2 + 4);
      drawTextLabel('L', width - 20, height / 2 + 4);
    } else {
      drawTextLabel('S', width / 2, 16);
      drawTextLabel('I', width / 2, height - 8);
      drawTextLabel('A', 16, height / 2 + 4);
      drawTextLabel('P', width - 20, height / 2 + 4);
    }
  };

  // Canvas interaction mouse hooks
  const handleCanvasMouseDown = (e, view) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });

      // Update active coordinates on initial click
      updateCrosshairPosition(e, view);
    }
  };

  const updateCrosshairPosition = (e, view) => {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let W = 0, H = 0;
    if (view === 'axial') {
      W = dimW;
      H = dimH;
    } else if (view === 'coronal') {
      W = dimW;
      H = dimD;
    } else { // sagittal
      W = dimH;
      H = dimD;
    }

    const col = Math.max(0, Math.min(W - 1, Math.floor((x / rect.width) * W)));
    const row = Math.max(0, Math.min(H - 1, Math.floor((y / rect.height) * H)));

    if (view === 'axial') {
      setSagittalIndex(col);
      setCoronalIndex(row);
    } else if (view === 'coronal') {
      setSagittalIndex(col);
      setAxialIndex(dimD - 1 - row);
    } else if (view === 'sagittal') {
      setCoronalIndex(col);
      setAxialIndex(dimD - 1 - row);
    }
  };

  const handleCanvasMouseMove = (e, view) => {
    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setHoverPos({ x, y });
    setHoveredView(view);

    let W = 0, H = 0;
    if (view === 'axial') {
      W = dimW;
      H = dimH;
    } else if (view === 'coronal') {
      W = dimW;
      H = dimD;
    } else { // sagittal
      W = dimH;
      H = dimD;
    }

    const col = Math.max(0, Math.min(W - 1, Math.floor((x / rect.width) * W)));
    const row = Math.max(0, Math.min(H - 1, Math.floor((y / rect.height) * H)));

    let volumeX = 0, volumeY = 0, volumeZ = 0;
    if (view === 'axial') {
      volumeX = col;
      volumeY = row;
      volumeZ = axialIndex;
    } else if (view === 'coronal') {
      volumeX = col;
      volumeY = coronalIndex;
      volumeZ = dimD - 1 - row;
    } else { // sagittal
      volumeX = sagittalIndex;
      volumeY = col;
      volumeZ = dimD - 1 - row;
    }

    if (predictionData && predictionData.ctVolume) {
      const idx3D = volumeZ * dimH * dimW + volumeY * dimW + volumeX;
      const hu = predictionData.ctVolume[idx3D];
      const dose = predictionData.doseVolume[idx3D];
      setHoverValue({
        hu: Math.round(hu),
        dose: dose,
        xCoord: volumeX,
        yCoord: volumeY,
        zCoord: volumeZ
      });
    }

    if (!isDragging) return;

    if (e.shiftKey) {
      // Contrast adjust mode
      const deltaX = e.clientX - (dragStart.x + pan.x);
      const deltaY = e.clientY - (dragStart.y + pan.y);
      setWindowWidth(Math.max(10, windowWidth + deltaX * 1.5));
      setWindowLevel(Math.max(-1000, Math.min(1000, windowLevel - deltaY * 1.5)));
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else {
      // Standard drag moves reference planes
      updateCrosshairPosition(e, view);
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasWheel = (e, view) => {
    e.preventDefault();
    if (e.ctrlKey || e.altKey) {
      const zoomFactor = 1.1;
      const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
      setZoom(Math.max(0.5, Math.min(8.0, nextZoom)));
    } else {
      const step = e.deltaY > 0 ? -1 : 1;
      if (view === 'axial') {
        setAxialIndex(Math.max(0, Math.min(dimD - 1, axialIndex + step)));
      } else if (view === 'coronal') {
        setCoronalIndex(Math.max(0, Math.min(dimH - 1, coronalIndex + step)));
      } else {
        setSagittalIndex(Math.max(0, Math.min(dimW - 1, sagittalIndex + step)));
      }
    }
  };

  const zoomIn = () => setZoom(z => Math.min(8.0, z * 1.2));
  const zoomOut = () => setZoom(z => Math.max(0.5, z / 1.2));
  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setWindowWidth(400);
    setWindowLevel(40);
    setAxialIndex(Math.floor(dimD / 2));
    setCoronalIndex(Math.floor(dimH / 2));
    setSagittalIndex(Math.floor(dimW / 2));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 rounded-2xl border border-slate-900 overflow-hidden light:bg-slate-100 light:border-slate-200">
      {/* Slice Metadata Ribbon */}
      <div className="px-4 py-2 border-b border-slate-900 flex justify-between items-center text-xs text-slate-400 font-semibold bg-slate-900/20 light:border-slate-200 light:bg-slate-100/50 select-none">
        <span className="flex items-center gap-1.5 text-teal-400">
          Multi-Planar Reconstruction (MPR) Viewport
        </span>
        <span className="bg-slate-900 border border-slate-800 text-white font-mono px-2 py-0.5 rounded light:bg-white light:border-slate-200 light:text-slate-800">
          Coords: ({sagittalIndex}, {coronalIndex}, {axialIndex})
        </span>
      </div>

      {/* Side-by-Side 3-View Panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2.5 p-2.5 bg-black min-h-0">
        
        {/* 1. AXIAL PLANAR VIEW */}
        <div className="flex flex-col border border-slate-900 bg-slate-950/80 rounded-xl overflow-hidden relative">
          <div className="px-3 py-1 bg-slate-900/40 border-b border-slate-900 text-[10px] text-slate-400 font-semibold flex justify-between">
            <span className="text-teal-400 font-bold uppercase tracking-wider">Axial (XY Plane)</span>
            <span>Slice Z: {axialIndex} / {dimD - 1}</span>
          </div>
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black min-h-[220px]">
            <canvas
              ref={axialCanvasRef}
              width={384}
              height={384}
              onMouseDown={(e) => handleCanvasMouseDown(e, 'axial')}
              onMouseMove={(e) => handleCanvasMouseMove(e, 'axial')}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={(e) => handleCanvasWheel(e, 'axial')}
              className="max-h-full max-w-full cursor-crosshair"
              style={{ aspectRatio: `${dimW}/${dimH}` }}
            />
          </div>
        </div>

        {/* 2. CORONAL PLANAR VIEW */}
        <div className="flex flex-col border border-slate-900 bg-slate-950/80 rounded-xl overflow-hidden relative">
          <div className="px-3 py-1 bg-slate-900/40 border-b border-slate-900 text-[10px] text-slate-400 font-semibold flex justify-between">
            <span className="text-teal-400 font-bold uppercase tracking-wider">Coronal (XZ Plane)</span>
            <span>Slice Y: {coronalIndex} / {dimH - 1}</span>
          </div>
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black min-h-[220px]">
            <canvas
              ref={coronalCanvasRef}
              width={384}
              height={360}
              onMouseDown={(e) => handleCanvasMouseDown(e, 'coronal')}
              onMouseMove={(e) => handleCanvasMouseMove(e, 'coronal')}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={(e) => handleCanvasWheel(e, 'coronal')}
              className="max-h-full max-w-full cursor-crosshair"
              style={{ aspectRatio: `${dimW}/${dimD}` }}
            />
          </div>
        </div>

        {/* 3. SAGITTAL PLANAR VIEW */}
        <div className="flex flex-col border border-slate-900 bg-slate-950/80 rounded-xl overflow-hidden relative">
          <div className="px-3 py-1 bg-slate-900/40 border-b border-slate-900 text-[10px] text-slate-400 font-semibold flex justify-between">
            <span className="text-teal-400 font-bold uppercase tracking-wider">Sagittal (YZ Plane)</span>
            <span>Slice X: {sagittalIndex} / {dimW - 1}</span>
          </div>
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-black min-h-[220px]">
            <canvas
              ref={sagittalCanvasRef}
              width={384}
              height={360}
              onMouseDown={(e) => handleCanvasMouseDown(e, 'sagittal')}
              onMouseMove={(e) => handleCanvasMouseMove(e, 'sagittal')}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={(e) => handleCanvasWheel(e, 'sagittal')}
              className="max-h-full max-w-full cursor-crosshair"
              style={{ aspectRatio: `${dimH}/${dimD}` }}
            />
          </div>
        </div>

        {/* FLOATING HOVER DIAGNOSTICS overlay */}
        {hoveredView && (
          <div className="absolute left-6 top-16 text-[9.5px] font-mono text-slate-300 bg-slate-950/90 backdrop-blur border border-teal-500/20 p-2.5 rounded-lg pointer-events-none max-w-xs shadow-2xl z-20 flex flex-col gap-0.5">
            <div className="text-teal-400 font-bold border-b border-teal-500/10 pb-1 mb-1 uppercase tracking-wider">Probe Stats ({hoveredView})</div>
            <div>Plane: ({hoverValue.xCoord}, {hoverValue.yCoord}, {hoverValue.zCoord})</div>
            <div>HU Value: <span className="text-white font-bold">{hoverValue.hu}</span></div>
            <div>Dose: <span className="text-emerald-400 font-bold">{hoverValue.dose.toFixed(1)} Gy</span></div>
          </div>
        )}

        {/* Floating View Controls (Zoom/Pan/Crosshair) */}
        <div className="absolute right-6 top-16 flex flex-col gap-2 bg-slate-900/80 backdrop-blur border border-slate-800 p-2 rounded-xl text-slate-300 shadow-xl select-none z-20">
          <button
            onClick={zoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            title="Reset Pan/Zoom/Contrast/Slices"
            className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <Maximize className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-800 my-1" />
          <button
            onClick={toggleCrosshair}
            title="Toggle Plane References"
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              crosshairEnabled
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* PACS Keyboard / Mouse tips info bubble */}
        <div className="absolute left-6 bottom-32 text-[9px] text-slate-400 bg-slate-900/80 backdrop-blur border border-slate-800/80 p-2 rounded-lg pointer-events-none max-w-xs flex items-start gap-1.5 shadow-lg select-none z-20">
          <HelpCircle className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-300">PACS Interactions</p>
            <p className="mt-0.5">Scroll: Slices | Drag reference lines: Navigate slices | Shift+Drag: Contrast WW/WL</p>
          </div>
        </div>
      </div>

      {/* Slice Navigation Sliders & Opacity Controls */}
      <div className="p-4 border-t border-slate-900 bg-slate-900/15 flex flex-col gap-4 select-none light:border-slate-200 light:bg-slate-100/30">
        
        {/* Grid of Three Coordinate Sliders */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Axial Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider w-24">
              Axial (Z)
            </span>
            <input
              type="range"
              min="0"
              max={dimD - 1}
              value={axialIndex}
              onChange={(e) => setAxialIndex(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-teal-400 light:bg-slate-200"
            />
            <span className="text-[11px] font-mono text-slate-300 font-bold light:text-slate-700 w-10 text-right">
              #{axialIndex}
            </span>
          </div>

          {/* Coronal Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider w-24">
              Coronal (Y)
            </span>
            <input
              type="range"
              min="0"
              max={dimH - 1}
              value={coronalIndex}
              onChange={(e) => setCoronalIndex(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-teal-400 light:bg-slate-200"
            />
            <span className="text-[11px] font-mono text-slate-300 font-bold light:text-slate-700 w-10 text-right">
              #{coronalIndex}
            </span>
          </div>

          {/* Sagittal Slider */}
          <div className="flex items-center gap-3">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider w-24">
              Sagittal (X)
            </span>
            <input
              type="range"
              min="0"
              max={dimW - 1}
              value={sagittalIndex}
              onChange={(e) => setSagittalIndex(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-teal-400 light:bg-slate-200"
            />
            <span className="text-[11px] font-mono text-slate-300 font-bold light:text-slate-700 w-10 text-right">
              #{sagittalIndex}
            </span>
          </div>
        </div>

        {/* Opacity and Windowing Control Tray */}
        {activeTab !== 'contour' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-900/30 light:border-slate-200/50">
            {/* Opacities */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3 h-3 text-teal-500" />
                Overlay Opacities
              </span>
              
              <div className="space-y-2.5 pl-1.5">
                {(activeTab === 'ct' || activeTab === 'dose') && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Dose Heatmap</span>
                    <div className="flex items-center gap-2.5 w-2/3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={doseOpacity}
                        onChange={(e) => setDoseOpacity(parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 light:bg-slate-200"
                      />
                      <span className="text-[10px] text-slate-300 light:text-slate-700 font-mono w-7 text-right">
                        {Math.round(doseOpacity * 100)}%
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Organ Outlines</span>
                  <div className="flex items-center gap-2.5 w-2/3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={contourOpacity}
                      onChange={(e) => setContourOpacity(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 light:bg-slate-200"
                    />
                    <span className="text-[10px] text-slate-300 light:text-slate-700 font-mono w-7 text-right">
                      {Math.round(contourOpacity * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contrast adjustment (WW/WL) */}
            {activeTab === 'ct' && (
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  CT Window / Level (Contrast)
                </span>
                
                <div className="space-y-2.5 pl-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Window Width (WW)</span>
                    <div className="flex items-center gap-2.5 w-2/3">
                      <input
                        type="range"
                        min="50"
                        max="1500"
                        value={windowWidth}
                        onChange={(e) => setWindowWidth(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 light:bg-slate-200"
                      />
                      <span className="text-[10px] text-slate-300 light:text-slate-700 font-mono w-10 text-right">
                        {windowWidth}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Window Level (WL)</span>
                    <div className="flex items-center gap-2.5 w-2/3">
                      <input
                        type="range"
                        min="-200"
                        max="400"
                        value={windowLevel}
                        onChange={(e) => setWindowLevel(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 light:bg-slate-200"
                      />
                      <span className="text-[10px] text-slate-300 light:text-slate-700 font-mono w-10 text-right">
                        {windowLevel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SliceViewer;
