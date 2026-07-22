
/**
 * volumeData.js
 * 
 * Generates and manages 3D volume data in the browser for CT, Dose, and Organs.
 * Supports slicing the 3D grids along Axial, Coronal, and Sagittal planes.
 */

export const VOLUME_DIM = {
  width: 128,  // X (Sagittal / Right-Left)
  height: 128, // Y (Coronal / Anterior-Posterior)
  depth: 120   // Z (Axial / Inferior-Superior)
};

/**
 * Procedurally generates 3D volume grids for CT HU, Dose Gy, and Organ binary masks.
 * This runs once when simulation is loaded.
 */
export function generate3DVolumes() {
  const { width, height, depth } = VOLUME_DIM;
  const size = width * height * depth;

  const ctVolume = new Float32Array(size);
  const doseVolume = new Float32Array(size);
  const organVolumes = {};

  const organNames = [
    'Body', 'Brainstem', 'Spinal Cord', 'Parotid L', 'Parotid R',
    'Mandible', 'Esophagus', 'Heart', 'PTV 70', 'PTV 63', 'PTV 56'
  ];

  organNames.forEach(name => {
    organVolumes[name] = new Uint8Array(size);
  });

  const cx = width / 2;
  const cy = height / 2;

  for (let z = 0; z < depth; z++) {
    const t = z / depth;

    // Body geometry: changing ellipse
    const bodyRadiusX = width * 0.38 * (1 - 0.1 * Math.sin(t * Math.PI));
    const bodyRadiusY = height * 0.28 * (1 - 0.08 * Math.cos(t * Math.PI));

    // Spine bone: circle
    const spineY = cy + height * 0.12;
    const spineSize = (25 - 5 * Math.abs(t - 0.5)) / 4;

    // Mandible (jaw): visible in upper slices (t > 0.5)
    const jawT = (t - 0.5) * 2;
    const jawRad = (45 + 15 * jawT) / 4;

    // Lungs: visible in lower chest slices (t < 0.4)
    const lungLeftX = cx - width * 0.16;
    const lungLeftY = cy - height * 0.05;
    const lungRightX = cx + width * 0.16;
    const lungRightY = cy - height * 0.05;
    const lungRadiusX = width * 0.12;
    const lungRadiusY = lungRadiusX * 1.5;

    // Brainstem (z 65 to 110)
    let bsY = 0, bsRad = 0;
    if (z >= 65 && z <= 110) {
      const bst = (z - 65) / 45;
      bsY = cy - height * 0.05 - 10 * bst;
      bsRad = (14 + 4 * Math.sin(bst * Math.PI)) / 4;
    }

    // Spinal cord (z 10 to 105)
    const scX = cx;
    const scY = spineY;
    const scRad = 7 / 4;

    // Parotids (z 50 to 90)
    let pL_X = 0, pL_Y = 0, pL_rx = 0, pL_ry = 0;
    let pR_X = 0, pR_Y = 0, pR_rx = 0, pR_ry = 0;
    if (z >= 50 && z <= 90) {
      const pt = (z - 50) / 40;
      pL_rx = (12 + 6 * Math.sin(pt * Math.PI)) / 4;
      pL_ry = (18 + 4 * Math.sin(pt * Math.PI)) / 4;
      pL_X = cx - width * 0.18 + 5 * pt;
      pL_Y = cy - height * 0.02;

      pR_rx = pL_rx;
      pR_ry = pL_ry;
      pR_X = cx + width * 0.18 - 5 * pt;
      pR_Y = cy - height * 0.02;
    }

    // Esophagus (z 5 to 60)
    const esX = cx;
    const esY = cy + height * 0.05 + z * 0.15;
    const esRad = 8 / 4;

    // Heart (z 5 to 30)
    let hX = 0, hY = 0, hRad = 0;
    if (z >= 5 && z <= 30) {
      hX = cx - 5;
      hY = cy - 2.5;
      hRad = (25 + 5 * Math.sin((z - 5) / 25 * Math.PI)) / 4;
    }

    // PTVs (z 30 to 95)
    let ptv70_X = 0, ptv70_Y = 0, ptv70_rad = 0;
    let ptv63_X = 0, ptv63_Y = 0, ptv63_rad = 0;
    let ptv56_X = 0, ptv56_Y = 0, ptv56_rad = 0;

    if (z >= 45 && z <= 80) {
      const ptvt = (z - 45) / 35;
      ptv70_rad = (15 * Math.sin(ptvt * Math.PI)) / 4;
      ptv70_X = cx + 2 * Math.sin(ptvt * Math.PI);
      ptv70_Y = cy - height * 0.06;
    }
    if (z >= 40 && z <= 85) {
      const ptvt = (z - 40) / 45;
      ptv63_rad = (22 * Math.sin(ptvt * Math.PI)) / 4;
      ptv63_X = cx + 1.5 * Math.sin(ptvt * Math.PI);
      ptv63_Y = cy - height * 0.06;
    }
    if (z >= 30 && z <= 95) {
      const ptvt = (z - 30) / 65;
      ptv56_rad = (30 * Math.sin(ptvt * Math.PI)) / 4;
      ptv56_X = cx + Math.sin(ptvt * Math.PI);
      ptv56_Y = cy - height * 0.06;
    }

    // Dose peak source (clusters near PTV 70)
    const doseSourceX = cx + 2 * Math.sin(z * 0.2);
    const doseSourceY = cy - height * 0.06;
    const doseMax = (z >= 30 && z <= 95) ? 74.5 * Math.sin((z - 30) / 65 * Math.PI) : 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (z * height * width) + (y * width) + x;

        // ------------------
        // 1. CT GRayscale (HU)
        // ------------------
        let hu = -1000; // default air

        const bodyDist = Math.pow((x - cx) / bodyRadiusX, 2) + Math.pow((y - cy) / bodyRadiusY, 2);
        if (bodyDist <= 1) {
          hu = 40; // Soft tissue

          // Lungs check
          if (z < 0.4 * depth) {
            const leftLung = Math.pow((x - lungLeftX) / lungRadiusX, 2) + Math.pow((y - lungLeftY) / lungRadiusY, 2);
            const rightLung = Math.pow((x - lungRightX) / lungRadiusX, 2) + Math.pow((y - lungRightY) / lungRadiusY, 2);
            if (leftLung <= 1 || rightLung <= 1) {
              hu = -800; // Lungs
            }
          }

          // Mandible jawbone
          if (z > 0.5 * depth) {
            const mandDist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - (cy - height * 0.15), 2));
            if (Math.abs(mandDist - jawRad) <= 1.0) {
              hu = 600; // Bone
            }
          }

          // Spine
          const spineDist = Math.pow(x - cx, 2) + Math.pow(y - spineY, 2);
          if (spineDist <= spineSize * spineSize) {
            hu = 700; // Spine bone
            if (spineDist <= Math.pow(spineSize * 0.35, 2)) {
              hu = 0; // Spinal canal hole
            }
          }
        }
        ctVolume[idx] = hu;

        // ------------------
        // 2. Organs Masks
        // ------------------
        if (bodyDist <= 1) {
          organVolumes['Body'][idx] = 1;
        }
        if (z >= 65 && z <= 110 && Math.pow(x - cx, 2) + Math.pow(y - bsY, 2) <= bsRad * bsRad) {
          organVolumes['Brainstem'][idx] = 1;
        }
        if (z >= 10 && z <= 105 && Math.pow(x - scX, 2) + Math.pow(y - scY, 2) <= scRad * scRad) {
          organVolumes['Spinal Cord'][idx] = 1;
        }
        if (z >= 50 && z <= 90) {
          if (Math.pow((x - pL_X) / pL_rx, 2) + Math.pow((y - pL_Y) / pL_ry, 2) <= 1) {
            organVolumes['Parotid L'][idx] = 1;
          }
          if (Math.pow((x - pR_X) / pR_rx, 2) + Math.pow((y - pR_Y) / pR_ry, 2) <= 1) {
            organVolumes['Parotid R'][idx] = 1;
          }
        }
        if (z >= 55 && z <= 110) {
          const mandDist = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - (cy - height * 0.15), 2));
          if (mandDist <= jawRad + 1.0 && mandDist >= jawRad - 1.5) {
            const angle = Math.atan2(y - (cy - height * 0.15), x - cx);
            if (angle > -Math.PI * 0.15 && angle < Math.PI * 1.15) {
              organVolumes['Mandible'][idx] = 1;
            }
          }
        }
        if (z >= 5 && z <= 60 && Math.pow(x - esX, 2) + Math.pow(y - esY, 2) <= esRad * esRad) {
          organVolumes['Esophagus'][idx] = 1;
        }
        if (z >= 5 && z <= 30 && Math.pow(x - hX, 2) + Math.pow(y - hY, 2) <= hRad * hRad) {
          organVolumes['Heart'][idx] = 1;
        }
        if (z >= 45 && z <= 80 && Math.pow(x - ptv70_X, 2) + Math.pow(y - ptv70_Y, 2) <= ptv70_rad * ptv70_rad) {
          organVolumes['PTV 70'][idx] = 1;
        }
        if (z >= 40 && z <= 85 && Math.pow(x - ptv63_X, 2) + Math.pow(y - ptv63_Y, 2) <= ptv63_rad * ptv63_rad) {
          organVolumes['PTV 63'][idx] = 1;
        }
        if (z >= 30 && z <= 95 && Math.pow(x - ptv56_X, 2) + Math.pow(y - ptv56_Y, 2) <= ptv56_rad * ptv56_rad) {
          organVolumes['PTV 56'][idx] = 1;
        }

        // ------------------
        // 3. Dose Volume
        // ------------------
        let dose = 0;
        if (doseMax > 0) {
          const dx = x - doseSourceX;
          const dy = y - doseSourceY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ptvFactor = Math.sin((z - 30) / 65 * Math.PI);
          dose = doseMax * Math.exp(-(dist * dist) / (2 * (18 * ptvFactor + 8) * (18 * ptvFactor + 8)));

          // Spinal cord shielding
          const scDx = x - cx;
          const scDy = y - spineY;
          const scDist = Math.sqrt(scDx * scDx + scDy * scDy);
          if (scDist < 3) {
            dose *= (0.35 + 0.65 * (scDist / 3));
          }

          // Mandible shielding
          if (t > 0.5) {
            const jawDist = Math.abs(Math.sqrt(dx * dx + Math.pow(y - (cy - height * 0.15), 2)) - jawRad);
            if (jawDist < 2.5) {
              dose *= (0.6 + 0.4 * (jawDist / 2.5));
            }
          }

          if (dose > 2) {
            dose += (Math.sin(x * 0.2) * Math.cos(y * 0.2)) * 0.4;
          }
        }
        doseVolume[idx] = Math.max(0, dose);
      }
    }
  }

  return { ctVolume, doseVolume, organVolumes };
}

/**
 * Extract a 2D slice from a 3D volume.
 * Returns a typed array of size (sliceWidth * sliceHeight).
 * 
 * @param {Float32Array|Uint8Array} volume The flat 3D volume array.
 * @param {string} plane 'axial' | 'coronal' | 'sagittal'
 * @param {number} index Slice index along the perpendicular axis.
 * @param {Object} dimensions Optional dynamic dimensions. Defaults to VOLUME_DIM.
 * @returns {Object} { data: Float32Array|Uint8Array, width, height }
 */
export function get2DSlice(volume, plane, index, dimensions = VOLUME_DIM) {
  const { width: W, height: H, depth: D } = dimensions;

  if (plane === 'axial') {
    // Slicing perpendicular to Z. Slice size: W x H.
    const clampedIndex = Math.max(0, Math.min(D - 1, Math.round(index)));
    const sliceData = new Float32Array(W * H);
    const zOffset = clampedIndex * H * W;
    
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        sliceData[y * W + x] = volume[zOffset + y * W + x];
      }
    }
    return { data: sliceData, width: W, height: H };
  } 
  
  if (plane === 'coronal') {
    // Slicing perpendicular to Y. Slice size: W x D.
    const clampedIndex = Math.max(0, Math.min(H - 1, Math.round(index)));
    const sliceData = new Float32Array(W * D);
    
    for (let row = 0; row < D; row++) {
      const z = D - 1 - row; // head at top, chest at bottom
      const zOffset = z * H * W;
      for (let x = 0; x < W; x++) {
        sliceData[row * W + x] = volume[zOffset + clampedIndex * W + x];
      }
    }
    return { data: sliceData, width: W, height: D };
  } 
  
  if (plane === 'sagittal') {
    // Slicing perpendicular to X. Slice size: H x D.
    const clampedIndex = Math.max(0, Math.min(W - 1, Math.round(index)));
    const sliceData = new Float32Array(H * D);
    
    for (let row = 0; row < D; row++) {
      const z = D - 1 - row; // head at top, chest at bottom
      const zOffset = z * H * W;
      for (let y = 0; y < H; y++) {
        sliceData[row * H + y] = volume[zOffset + y * W + clampedIndex];
      }
    }
    return { data: sliceData, width: H, height: D };
  }

  throw new Error(`Invalid slicing plane: ${plane}`);
}

import { parseNpy, parseNpyStringArray, parseNpyScalar } from './npyParser';
import { processPatientData } from './patientProcessor';

/**
 * Loads the pre-exported actual numpy array dataset (from arr_0.npy) over HTTP.
 */
export async function loadNumpyDataset(progressCallback) {
  if (progressCallback) progressCallback(5);
  
  // 1. Fetch metadata descriptors
  const patientIdRes = await fetch('/Patient/patient_id.npy');
  const patientId = parseNpyScalar(await patientIdRes.arrayBuffer());
  
  const planIdRes = await fetch('/Patient/plan_id.npy');
  const planId = parseNpyScalar(await planIdRes.arrayBuffer());
  
  const spacingRes = await fetch('/Patient/spacing.npy');
  const spacing = parseNpy(await spacingRes.arrayBuffer()).data;
  
  const doseScaleRes = await fetch('/Patient/dose_scale.npy');
  const doseScale = parseNpyScalar(await doseScaleRes.arrayBuffer());
  
  const structureNamesRes = await fetch('/Patient/structure_names.npy');
  const structureNames = parseNpyStringArray(await structureNamesRes.arrayBuffer());
  
  if (progressCallback) progressCallback(20);
  
  // 2. Fetch main volumes
  const imgRes = await fetch('/Patient/img.npy');
  const imgArray = parseNpy(await imgRes.arrayBuffer()).data;
  
  if (progressCallback) progressCallback(50);
  
  const doseRes = await fetch('/Patient/dose.npy');
  const doseArray = parseNpy(await doseRes.arrayBuffer()).data;
  
  if (progressCallback) progressCallback(75);
  
  const structuresRes = await fetch('/Patient/structures.npy');
  const structuresArray = parseNpy(await structuresRes.arrayBuffer()).data;
  
  if (progressCallback) progressCallback(90);
  
  // 3. Process data client-side (rescale HU, scale dose, pack masks, compute DVH/stats)
  const processed = processPatientData({
    imgArray,
    doseArray,
    structuresArray,
    structureNames,
    patientId,
    planId,
    spacing,
    doseScale
  });
  
  if (progressCallback) progressCallback(100);
  
  return processed;
}
