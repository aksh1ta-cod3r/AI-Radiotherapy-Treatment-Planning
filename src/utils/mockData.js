/**
 * mockData.js
 * 
 * Procedural simulator for a Head & Neck radiotherapy dose prediction case.
 * Generates realistic CT anatomical slices, organ contours (OARs & PTVs), 
 * dose heatmaps using radial basis functions, and mathematically consistent DVH curves.
 */

// Define standard organs with custom clinical colors and default visibilities
export const ORGANS_METADATA = [
  { name: 'Body', type: 'OAR', color: '#64748b', defaultOpacity: 0.15, visible: true },
  { name: 'Brainstem', type: 'OAR', color: '#e11d48', defaultOpacity: 0.5, visible: true },
  { name: 'Spinal Cord', type: 'OAR', color: '#ea580c', defaultOpacity: 0.5, visible: true },
  { name: 'Parotid L', type: 'OAR', color: '#059669', defaultOpacity: 0.4, visible: true },
  { name: 'Parotid R', type: 'OAR', color: '#0284c7', defaultOpacity: 0.4, visible: true },
  { name: 'Mandible', type: 'OAR', color: '#d97706', defaultOpacity: 0.4, visible: true },
  { name: 'Esophagus', type: 'OAR', color: '#7c3aed', defaultOpacity: 0.4, visible: true },
  { name: 'Heart', type: 'OAR', color: '#be185d', defaultOpacity: 0.4, visible: false },
  { name: 'PTV 70', type: 'PTV', color: '#b91c1c', defaultOpacity: 0.6, visible: true },
  { name: 'PTV 63', type: 'PTV', color: '#c2410c', defaultOpacity: 0.5, visible: true },
  { name: 'PTV 56', type: 'PTV', color: '#eab308', defaultOpacity: 0.4, visible: true },
];

export const MOCK_METADATA = {
  patientId: 'RT-HN-2026-089',
  imageSize: '512 x 512 x 120',
  voxelSize: '0.98 x 0.98 x 2.00 mm',
  sliceCount: 120,
  numOrgans: ORGANS_METADATA.length,
  predictionTime: '1.24 seconds',
  modelVersion: 'RadDose-AI Net v4.2.1-TF',
  rxDose: 70.0, // Prescription Dose in Gy
};

// Generates a mock CT slice slice as a 2D canvas drawing function to save memory and scale fast.
// This matches standard medical window width/level logic.
export function drawCTSlice(ctx, sliceIndex, width, height, windowWidth, windowLevel) {
  // Clear canvas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Constants
  const cx = width / 2;
  const cy = height / 2;
  const t = sliceIndex / MOCK_METADATA.sliceCount;

  // We will map Hounsfield Units (HU) to grayscale colors using Window Width (WW) and Window Level (WL)
  // Water: 0 HU, Bone: +1000 HU, Air: -1000 HU, Soft Tissue: +40 HU
  const huToGray = (hu) => {
    const minHU = windowLevel - windowWidth / 2;
    const maxHU = windowLevel + windowWidth / 2;
    const clamped = Math.max(minHU, Math.min(maxHU, hu));
    const val = ((clamped - minHU) / (maxHU - minHU)) * 255;
    return Math.floor(val);
  };

  // Draw Body outline contour
  const bodyRadiusX = width * 0.38 * (1 - 0.1 * Math.sin(t * Math.PI));
  const bodyRadiusY = height * 0.28 * (1 - 0.08 * Math.cos(t * Math.PI));
  
  ctx.beginPath();
  ctx.ellipse(cx, cy, bodyRadiusX, bodyRadiusY, 0, 0, 2 * Math.PI);
  ctx.fillStyle = `rgb(${huToGray(20)}, ${huToGray(20)}, ${huToGray(20)})`; // Soft tissue HU ~ 20-40
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = `rgb(${huToGray(100)}, ${huToGray(100)}, ${huToGray(100)})`;
  ctx.stroke();

  // Draw Bones (Spinal column / vertebrae - bone HU ~ 800)
  const spineY = cy + height * 0.12;
  const spineSize = 25 - 5 * Math.abs(t - 0.5);
  ctx.beginPath();
  ctx.arc(cx, spineY, spineSize, 0, 2 * Math.PI);
  ctx.fillStyle = `rgb(${huToGray(700)}, ${huToGray(700)}, ${huToGray(700)})`;
  ctx.fill();

  // Draw spinal canal hole (air/cerebrospinal fluid HU ~ 0)
  ctx.beginPath();
  ctx.arc(cx, spineY, spineSize * 0.35, 0, 2 * Math.PI);
  ctx.fillStyle = `rgb(${huToGray(0)}, ${huToGray(0)}, ${huToGray(0)})`;
  ctx.fill();

  // Draw Mandible jawbone (visible in upper slices, say t > 0.6)
  if (t > 0.5) {
    const jawT = (t - 0.5) * 2;
    ctx.beginPath();
    ctx.arc(cx, cy - height * 0.15, 45 + 15 * jawT, Math.PI * 0.15, Math.PI * 0.85);
    ctx.lineWidth = 8;
    ctx.strokeStyle = `rgb(${huToGray(600)}, ${huToGray(600)}, ${huToGray(600)})`;
    ctx.stroke();
  }

  // Draw lungs or air cavities (Air HU ~ -1000)
  // Let's draw two lung-like or cavity structures in the body
  if (t < 0.4) {
    const cavitySize = width * 0.12;
    ctx.fillStyle = `rgb(${huToGray(-800)}, ${huToGray(-800)}, ${huToGray(-800)})`;
    // Left lung
    ctx.beginPath();
    ctx.ellipse(cx - width * 0.16, cy - height * 0.05, cavitySize, cavitySize * 1.5, 0.1, 0, 2 * Math.PI);
    ctx.fill();
    // Right lung
    ctx.beginPath();
    ctx.ellipse(cx + width * 0.16, cy - height * 0.05, cavitySize, cavitySize * 1.5, -0.1, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// Generate organ contour coordinates as a list of points {x, y} for vector overlay
export function getOrganContour(organName, sliceIndex, canvasWidth = 512, canvasHeight = 512) {
  const points = [];
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const t = sliceIndex / MOCK_METADATA.sliceCount;
  const numPoints = 60;

  // Helper to construct deforming circles/ellipses
  const buildEllipse = (xCenter, yCenter, rx, ry, deformAmp = 0, deformFreq = 3, phase = 0) => {
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const rRatio = 1 + deformAmp * Math.sin(angle * deformFreq + phase);
      points.push({
        x: xCenter + rx * rRatio * Math.cos(angle),
        y: yCenter + ry * rRatio * Math.sin(angle),
      });
    }
  };

  switch (organName) {
    case 'Body':
      // Entire body outline
      const brx = canvasWidth * 0.38 * (1 - 0.1 * Math.sin(t * Math.PI));
      const bry = canvasHeight * 0.28 * (1 - 0.08 * Math.cos(t * Math.PI));
      buildEllipse(cx, cy, brx, bry, 0.02, 5, t * 2);
      break;

    case 'Brainstem':
      // Brainstem exists in superior slices: slices 65 to 110
      if (sliceIndex >= 65 && sliceIndex <= 110) {
        const brainstemT = (sliceIndex - 65) / 45; // 0 to 1
        const rad = 14 + 4 * Math.sin(brainstemT * Math.PI);
        const yOffset = cy - canvasHeight * 0.05 - 10 * brainstemT;
        buildEllipse(cx, yOffset, rad, rad * 1.1, 0.05, 4, sliceIndex * 0.1);
      }
      break;

    case 'Spinal Cord':
      // Spinal Cord runs almost throughout: slices 10 to 105
      if (sliceIndex >= 10 && sliceIndex <= 105) {
        const rad = 7;
        const yOffset = cy + canvasHeight * 0.12;
        buildEllipse(cx, yOffset, rad, rad, 0.02, 3, 0);
      }
      break;

    case 'Parotid L':
      // Left Parotid gland: slices 50 to 90
      if (sliceIndex >= 50 && sliceIndex <= 90) {
        const parotidT = (sliceIndex - 50) / 40;
        const rx = 12 + 6 * Math.sin(parotidT * Math.PI);
        const ry = 18 + 4 * Math.sin(parotidT * Math.PI);
        const xOffset = cx - canvasWidth * 0.18 + 5 * parotidT;
        const yOffset = cy - canvasHeight * 0.02;
        buildEllipse(xOffset, yOffset, rx, ry, 0.08, 3, sliceIndex * 0.2);
      }
      break;

    case 'Parotid R':
      // Right Parotid gland: slices 50 to 90
      if (sliceIndex >= 50 && sliceIndex <= 90) {
        const parotidT = (sliceIndex - 50) / 40;
        const rx = 12 + 6 * Math.sin(parotidT * Math.PI);
        const ry = 18 + 4 * Math.sin(parotidT * Math.PI);
        const xOffset = cx + canvasWidth * 0.18 - 5 * parotidT;
        const yOffset = cy - canvasHeight * 0.02;
        buildEllipse(xOffset, yOffset, rx, ry, 0.08, 3, -sliceIndex * 0.2);
      }
      break;

    case 'Mandible':
      // Mandible jawbone: slices 55 to 110
      if (sliceIndex >= 55 && sliceIndex <= 110) {
        // We draw the jaw contour as a slightly thick hollow C shape, or custom points
        const mandT = (sliceIndex - 55) / 55;
        const jawRad = 45 + 15 * Math.sin(mandT * Math.PI);
        // We will make a C-shape contour
        for (let i = 0; i <= numPoints; i++) {
          const angle = Math.PI * 0.15 + (i / numPoints) * Math.PI * 0.7; // Arc
          const r = jawRad + 4 * Math.cos(angle * 4);
          points.push({
            x: cx + r * Math.cos(angle),
            y: cy - canvasHeight * 0.15 + r * Math.sin(angle),
          });
        }
        // Then loop back inner border to make closed loop
        for (let i = numPoints; i >= 0; i--) {
          const angle = Math.PI * 0.15 + (i / numPoints) * Math.PI * 0.7;
          const r = jawRad - 6 + 4 * Math.cos(angle * 4);
          points.push({
            x: cx + r * Math.cos(angle),
            y: cy - canvasHeight * 0.15 + r * Math.sin(angle),
          });
        }
      }
      break;

    case 'Esophagus':
      // Esophagus: inferior slices 5 to 60
      if (sliceIndex >= 5 && sliceIndex <= 60) {
        const rad = 8;
        const yOffset = cy + canvasHeight * 0.05 + sliceIndex * 0.15;
        buildEllipse(cx, yOffset, rad, rad * 0.9, 0.03, 3, 0);
      }
      break;

    case 'Heart':
      // Heart: only visible in lower chest slices: slices 5 to 30
      if (sliceIndex >= 5 && sliceIndex <= 30) {
        const rad = 25 + 5 * Math.sin((sliceIndex - 5) / 25 * Math.PI);
        buildEllipse(cx - 20, cy - 10, rad, rad * 1.1, 0.1, 4, sliceIndex * 0.05);
      }
      break;

    case 'PTV 70':
      // PTV 70: central target volume: slices 45 to 80
      if (sliceIndex >= 45 && sliceIndex <= 80) {
        const ptvT = (sliceIndex - 45) / 35;
        const rad = 15 * Math.sin(ptvT * Math.PI);
        const yOffset = cy - canvasHeight * 0.06;
        buildEllipse(cx + 8 * Math.sin(ptvT * Math.PI), yOffset, rad, rad * 1.1, 0.12, 5, sliceIndex * 0.3);
      }
      break;

    case 'PTV 63':
      // PTV 63: surrounding intermediate risk: slices 40 to 85
      if (sliceIndex >= 40 && sliceIndex <= 85) {
        const ptvT = (sliceIndex - 40) / 45;
        const rad = 22 * Math.sin(ptvT * Math.PI);
        const yOffset = cy - canvasHeight * 0.06;
        buildEllipse(cx + 6 * Math.sin(ptvT * Math.PI), yOffset, rad, rad * 1.12, 0.1, 5, sliceIndex * 0.2);
      }
      break;

    case 'PTV 56':
      // PTV 56: low risk elective volume: slices 30 to 95
      if (sliceIndex >= 30 && sliceIndex <= 95) {
        const ptvT = (sliceIndex - 30) / 65;
        const rad = 30 * Math.sin(ptvT * Math.PI);
        const yOffset = cy - canvasHeight * 0.06;
        buildEllipse(cx + 4 * Math.sin(ptvT * Math.PI), yOffset, rad, rad * 1.15, 0.08, 4, sliceIndex * 0.1);
      }
      break;

    default:
      break;
  }

  return points;
}

// Generate the 2D Dose Heatmap on a lower-res grid (128x128) for high rendering performance.
// The CT Slice viewer will draw it onto the Canvas with bilinear filtering.
// Dose is highest inside PTVs and falls off in a realistic radiotherapy planning pattern.
export function generateDoseHeatmap(sliceIndex, width = 128, height = 128) {
  const doseGrid = new Float32Array(width * height);
  const cx = width / 2;
  const cy = height / 2;
  const t = sliceIndex / MOCK_METADATA.sliceCount;

  // Dose distribution is centered around PTVs
  // PTV 70 center in 128x128 coordinates: (cx + offset, cy - offset)
  // Max dose: ~75 Gy at center.
  // We model 3 dose peaks for PTVs and a falloff.
  const hasPTV = sliceIndex >= 30 && sliceIndex <= 95;
  if (!hasPTV) return doseGrid;

  const ptvT = (sliceIndex - 30) / 65;
  const ptvFactor = Math.sin(ptvT * Math.PI); // Peak at slice 62
  
  const sourceX = cx + 2 * Math.sin(sliceIndex * 0.2);
  const sourceY = cy - height * 0.06;
  const maxDose = 74.5 * ptvFactor;

  // Spinal cord shielding simulation (Spinal cord is at (cx, cy + 0.12 * height))
  const shieldX = cx;
  const shieldY = cy + height * 0.12;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const dx = x - sourceX;
      const dy = y - sourceY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Primary dose drop off
      let dose = maxDose * Math.exp(-(dist * dist) / (2 * (18 * ptvFactor + 8) * (18 * ptvFactor + 8)));

      // Add Spinal Cord sparing effect (shielding in posterior area)
      const scDx = x - shieldX;
      const scDy = y - shieldY;
      const scDist = Math.sqrt(scDx * scDx + scDy * scDy);
      if (scDist < 12) {
        // Decrease dose inside spinal cord (simulate IMRT/VMAT optimization)
        const shieldFactor = 0.35 + 0.65 * (scDist / 12);
        dose *= shieldFactor;
      }

      // Add Mandible jawbone sparing (t > 0.5)
      if (t > 0.5) {
        const jawDist = Math.abs(Math.sqrt(dx * dx + (y - (cy - height * 0.15)) * (y - (cy - height * 0.15))) - (35 + 15 * (t - 0.5)));
        if (jawDist < 10) {
          dose *= (0.6 + 0.4 * (jawDist / 10));
        }
      }

      // Add a bit of realistic scatter noise
      if (dose > 2) {
        dose += (Math.sin(x * 0.2) * Math.cos(y * 0.2)) * 0.4;
      }

      doseGrid[idx] = Math.max(0, dose);
    }
  }

  return doseGrid;
}

// Convert a dose value in Gy to color coordinates (RGBA)
// Heatmap Range: Blue (low dose) -> Green -> Yellow -> Orange -> Red (high dose)
export function getDoseColor(dose, maxDose = 75, opacity = 0.6) {
  if (dose <= 2.0) return null; // Noise gate / threshold

  const t = Math.min(1.0, dose / maxDose);
  let r = 0, g = 0, b = 0;

  if (t < 0.25) {
    // Blue to Teal [0, 0.25]
    const ratio = t / 0.25;
    r = 0;
    g = Math.floor(ratio * 160);
    b = 255;
  } else if (t < 0.5) {
    // Teal to Green [0.25, 0.5]
    const ratio = (t - 0.25) / 0.25;
    r = 0;
    g = 160 + Math.floor(ratio * 95);
    b = 255 - Math.floor(ratio * 255);
  } else if (t < 0.75) {
    // Green to Yellow [0.5, 0.75]
    const ratio = (t - 0.5) / 0.25;
    r = Math.floor(ratio * 255);
    g = 255;
    b = 0;
  } else if (t < 0.9) {
    // Yellow to Orange [0.75, 0.9]
    const ratio = (t - 0.75) / 0.15;
    r = 255;
    g = 255 - Math.floor(ratio * 130);
    b = 0;
  } else {
    // Orange to Red [0.9, 1.0]
    const ratio = (t - 0.9) / 0.1;
    r = 255;
    g = 125 - Math.floor(ratio * 125);
    b = 0;
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Procedural DVH curve generator
// Returns an array of objects: { dose: number, [OrganName1]: percentage, [OrganName2]: percentage }
export function generateDVHData() {
  const data = [];
  const maxDose = 80; // Gy

  // Define clinical DVH curve shape generators
  // For PTV: Sigmoid curve dropping sharply at prescription dose
  const ptvCurve = (dose, rx) => {
    if (dose < rx * 0.9) return 100;
    if (dose > rx * 1.08) return 0;
    // Sharp descent
    const ratio = (dose - rx * 0.95) / (rx * 0.1);
    const val = 100 / (1 + Math.exp(ratio * 10));
    return Math.max(0, Math.min(100, val));
  };

  // For OARs: Exponential or gradual drop curves
  const oarCurve = (dose, meanLimit, maxLimit) => {
    if (dose > maxLimit) return 0;
    const factor = Math.exp(-dose / meanLimit);
    const val = 100 * factor;
    // Force to 0 at maxLimit
    if (dose > maxLimit * 0.8) {
      const scale = (maxLimit - dose) / (maxLimit * 0.2);
      return Math.max(0, val * scale);
    }
    return Math.max(0, Math.min(100, val));
  };

  for (let dose = 0; dose <= maxDose; dose += 0.5) {
    const row = { dose };
    
    row['Body'] = oarCurve(dose, 15, 60);
    row['Brainstem'] = oarCurve(dose, 12, 54); // Limit max dose to 54 Gy
    row['Spinal Cord'] = oarCurve(dose, 10, 45); // Limit max dose to 45 Gy
    row['Parotid L'] = oarCurve(dose, 22, 55);
    row['Parotid R'] = oarCurve(dose, 24, 58);
    row['Mandible'] = oarCurve(dose, 28, 65);
    row['Esophagus'] = oarCurve(dose, 18, 50);
    row['Heart'] = oarCurve(dose, 5, 20);
    
    row['PTV 70'] = ptvCurve(dose, 70);
    row['PTV 63'] = ptvCurve(dose, 63);
    row['PTV 56'] = ptvCurve(dose, 56);

    data.push(row);
  }

  return data;
}

// Generate summary metrics
export const MOCK_SUMMARY = {
  maxDose: 74.8,      // Gy
  minDose: 0.1,       // Gy
  meanDose: 28.4,     // Gy
  medianDose: 21.5,   // Gy
  prescriptionDose: 70.0, // Gy
  coverage: 98.4,     // % (PTV receiving rx dose)
  homogeneityIndex: 0.08, // Optimal is near 0
  conformityIndex: 0.86,  // Optimal is near 1
};

// Generate organ-specific statistics
export function getOrganStats(organName) {
  const dvh = generateDVHData();
  
  // Find specific metrics based on the DVH curve
  const getDoseForVolume = (volPercent) => {
    // Search dvh list for the dose where volume is closest to volPercent
    let closest = dvh[0];
    let minDiff = Infinity;
    for (const point of dvh) {
      const val = point[organName] !== undefined ? point[organName] : 0;
      const diff = Math.abs(val - volPercent);
      if (diff < minDiff) {
        minDiff = diff;
        closest = point;
      }
    }
    return closest.dose;
  };

  const getVolumeForDose = (doseValue) => {
    const idx = Math.min(dvh.length - 1, Math.floor(doseValue * 2));
    const point = dvh[idx];
    return point[organName] !== undefined ? point[organName] : 0;
  };

  // Assign statistical features depending on organs
  switch (organName) {
    case 'PTV 70':
      return {
        meanDose: 71.2,
        maxDose: 74.8,
        minDose: 62.4,
        d95: 68.5,
        d98: 67.2,
        d50: 71.4,
        v95: 98.4,
        v100: 95.1,
        volume: 48.2, // cc
      };
    case 'PTV 63':
      return {
        meanDose: 64.1,
        maxDose: 69.2,
        minDose: 55.1,
        d95: 61.2,
        d98: 59.8,
        d50: 64.3,
        v95: 97.9,
        v100: 94.6,
        volume: 72.5,
      };
    case 'PTV 56':
      return {
        meanDose: 57.2,
        maxDose: 64.5,
        minDose: 42.1,
        d95: 54.3,
        d98: 52.9,
        d50: 57.5,
        v95: 98.1,
        v100: 94.2,
        volume: 154.6,
      };
    case 'Brainstem':
      return {
        meanDose: 18.5,
        maxDose: 52.4,
        minDose: 2.1,
        d95: 3.4,
        d98: 2.8,
        d50: 16.5,
        v95: 0.0,
        v100: 0.0,
        volume: 22.4,
      };
    case 'Spinal Cord':
      return {
        meanDose: 15.2,
        maxDose: 41.8,
        minDose: 1.5,
        d95: 2.1,
        d98: 1.8,
        d50: 12.8,
        v95: 0.0,
        v100: 0.0,
        volume: 18.2,
      };
    case 'Parotid L':
      return {
        meanDose: 24.6,
        maxDose: 48.2,
        minDose: 4.2,
        d95: 8.5,
        d98: 7.2,
        d50: 22.8,
        v95: 0.0,
        v100: 0.0,
        volume: 31.5,
      };
    case 'Parotid R':
      return {
        meanDose: 22.1,
        maxDose: 46.5,
        minDose: 3.8,
        d95: 6.8,
        d98: 5.5,
        d50: 20.4,
        v95: 0.0,
        v100: 0.0,
        volume: 28.9,
      };
    case 'Mandible':
      return {
        meanDose: 32.8,
        maxDose: 68.4,
        minDose: 8.5,
        d95: 12.4,
        d98: 10.1,
        d50: 31.2,
        v95: 12.4,
        v100: 5.2,
        volume: 64.1,
      };
    case 'Esophagus':
      return {
        meanDose: 12.4,
        maxDose: 38.5,
        minDose: 1.2,
        d95: 2.0,
        d98: 1.6,
        d50: 9.8,
        v95: 0.0,
        v100: 0.0,
        volume: 15.8,
      };
    case 'Heart':
      return {
        meanDose: 2.5,
        maxDose: 12.4,
        minDose: 0.2,
        d95: 0.4,
        d98: 0.3,
        d50: 1.5,
        v95: 0.0,
        v100: 0.0,
        volume: 350.2,
      };
    default:
      // General OAR fallback
      const max = Math.round(getDoseForVolume(0.1) * 10) / 10;
      const min = Math.round(getDoseForVolume(99.9) * 10) / 10;
      const mean = Math.round(getDoseForVolume(50) * 1.1 * 10) / 10;
      return {
        meanDose: mean,
        maxDose: max,
        minDose: min,
        d95: Math.round(getDoseForVolume(95) * 10) / 10,
        d98: Math.round(getDoseForVolume(98) * 10) / 10,
        d50: Math.round(getDoseForVolume(50) * 10) / 10,
        v95: Math.round(getVolumeForDose(MOCK_METADATA.rxDose * 0.95) * 10) / 10,
        v100: Math.round(getVolumeForDose(MOCK_METADATA.rxDose) * 10) / 10,
        volume: 45.0,
      };
  }
}
