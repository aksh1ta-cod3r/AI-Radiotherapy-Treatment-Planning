# Machine Learning Backend Integration Guide

This guide details the specifications, serialization methods, and frontend codebase modifications required to connect your custom radiotherapy dose prediction backend (e.g., Python / Flask / FastApi) to the web application.

---

## 1. Backend API Specification

The frontend communicates with the backend via two REST endpoints. The default base URL is `http://localhost:5000`.

### A. Health Check
* **Endpoint**: `GET /status`
* **Purpose**: Determines if the frontend should enable "Live Predict" mode or fall back to "Simulated Demo" mode.
* **Response**: `200 OK` (plain text or empty JSON).

### B. Dose Prediction Upload
* **Endpoint**: `POST /predict`
* **Request Content-Type**: `multipart/form-data`
* **Request Parameters**:
  - `file`: The raw patient `.npy` or `.npz` binary file.
* **Response Content-Type**: `application/json`
* **Response Payload**: The parsed patient metadata, dosimetry statistics, and Recharts-formatted DVH curves.

---

## 2. API Response JSON Payload Schema

The `POST /predict` response must return a JSON object with the following structure:

```json
{
  "patientId": "RT-HN-0522c0012",
  "imageSize": "128 x 128 x 128",
  "voxelSize": "2.50 x 2.50 x 2.00 mm",
  "sliceCount": 128,
  "numOrgans": 9,
  "predictionTime": "1.08 seconds",
  "modelVersion": "RadDose-AI Net v4.2.1-TF",
  "width": 128,
  "height": 128,
  "depth": 128,
  "prescriptionDose": 70.0,
  "doseSummary": {
    "maxDose": 79.2,
    "minDose": 0.0,
    "meanDose": 32.4,
    "medianDose": 28.1,
    "prescriptionDose": 70.0,
    "coverage": 98.4,
    "homogeneityIndex": 0.08,
    "conformityIndex": 0.88
  },
  "organBits": {
    "0": { "name": "Body", "type": "OAR", "color": "#64748b", "opacity": 0.15, "visible": true },
    "1": { "name": "Brainstem", "type": "OAR", "color": "#e11d48", "opacity": 0.5, "visible": true },
    "2": { "name": "Spinal Cord", "type": "OAR", "color": "#ea580c", "opacity": 0.5, "visible": true },
    "3": { "name": "Mandible", "type": "OAR", "color": "#d97706", "opacity": 0.4, "visible": true },
    "4": { "name": "Parotids", "type": "OAR", "color": "#059669", "opacity": 0.4, "visible": true },
    "5": { "name": "Oral Cavity", "type": "OAR", "color": "#06b6d4", "opacity": 0.4, "visible": true },
    "6": { "name": "PTV High", "type": "PTV", "color": "#b91c1c", "opacity": 0.6, "visible": true },
    "7": { "name": "PTV Mid", "type": "PTV", "color": "#991b1b", "opacity": 0.5, "visible": true },
    "8": { "name": "PTV Low", "type": "PTV", "color": "#f43f5e", "opacity": 0.4, "visible": true }
  },
  "organsList": [
    {
      "name": "PTV High",
      "type": "PTV",
      "color": "#b91c1c",
      "defaultOpacity": 0.6,
      "visible": true,
      "stats": {
        "meanDose": 71.86,
        "maxDose": 74.78,
        "minDose": 64.75,
        "d95": 67.5,
        "d98": 66.1,
        "d50": 71.9,
        "v95": 99.8,
        "v100": 94.2,
        "volume": 105.6
      }
    }
  ],
  "dvhData": [
    {
      "dose": 0.0,
      "Body": 100.0,
      "Brainstem": 100.0,
      "Spinal Cord": 100.0,
      "Mandible": 100.0,
      "Parotids": 100.0,
      "Oral Cavity": 100.0,
      "PTV High": 100.0,
      "PTV Mid": 100.0,
      "PTV Low": 100.0
    },
    {
      "dose": 0.5,
      "Body": 99.8,
      "Brainstem": 100.0,
      "Spinal Cord": 100.0,
      "Mandible": 99.5,
      "Parotids": 100.0,
      "Oral Cavity": 100.0,
      "PTV High": 100.0,
      "PTV Mid": 100.0,
      "PTV Low": 100.0
    }
  ]
}
```

---

## 3. Flat Binary Files Serialization

To maximize WebGL slice scrubbing performance in the browser, the frontend downloads the 3D grid volumes as flat binary files.

### A. Binary Files Formats

| File Name | Format | Element Type | Dimensions | Voxel Ordering | Total File Size (for 128³) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`img.bin`** | Raw Float32 | `float32` (4 bytes) | `depth * height * width` | Z-major (Z, Y, X) | `128 * 128 * 128 * 4 = 8,388,608` bytes |
| **`dose.bin`** | Raw Float32 | `float32` (4 bytes) | `depth * height * width` | Z-major (Z, Y, X) | `128 * 128 * 128 * 4 = 8,388,608` bytes |
| **`organs.bin`** | Raw Uint16 | `uint16` (2 bytes) | `depth * height * width` | Z-major (Z, Y, X) | `128 * 128 * 128 * 2 = 4,194,304` bytes |

### B. Voxel Memory Layout (Z-major)
Voxels must be ordered in Z-major (C-contiguous) style:
```python
# The flat index calculation in the JS frontend is:
idx = z * (height * width) + y * width + x
```
Where:
- `z` varies from `0` to `depth - 1` (axial slice index - slowest varying)
- `y` varies from `0` to `height - 1` (coronal row index - medium varying)
- `x` varies from `0` to `width - 1` (sagittal column index - fastest varying)

### C. Python Serialization Code Snippet

Use this Python snippet inside your backend `/predict` endpoint to process your output tensors and write the `.bin` files:

```python
import numpy as np
import json
import os

# Suppose your model outputs three arrays:
# img_tensor: shape (128, 128, 128), normalized [0.0, 1.0]
# dose_tensor: shape (128, 128, 128), units of 10 Gy (max ~7.92)
# structures_tensor: shape (num_organs, 128, 128, 128), boolean/uint8 masks

# 1. Rescale CT Values to Hounsfield Units (HU)
# Air is ~ -1000 HU, Soft Tissue is ~ +40 HU, Cortical Bone is ~ +800 HU
img_hu = (img_tensor.astype(np.float32) * 2500.0) - 1000.0

# 2. Rescale Dose to Gy
dose_gy = (dose_tensor.astype(np.float32) * 10.0)

# 3. Pack organs masks bitwise into a single uint16 array
depth, height, width = img_tensor.shape
organs_bitmask = np.zeros((depth, height, width), dtype=np.uint16)

organ_bits_meta = {}
organ_stats_list = []
voxel_vol_cc = 2.0 * 2.5 * 2.5 / 1000.0  # Spacing is Z=2.0, Y=2.5, X=2.5 mm

organs_config = [
    {"name": "Body", "type": "OAR", "color": "#64748b", "opacity": 0.15, "visible": True},
    {"name": "Brainstem", "type": "OAR", "color": "#e11d48", "opacity": 0.5, "visible": True},
    {"name": "Spinal Cord", "type": "OAR", "color": "#ea580c", "opacity": 0.5, "visible": True},
    {"name": "Mandible", "type": "OAR", "color": "#d97706", "opacity": 0.4, "visible": True},
    {"name": "Parotids", "type": "OAR", "color": "#059669", "opacity": 0.4, "visible": True},
    {"name": "Oral Cavity", "type": "OAR", "color": "#06b6d4", "opacity": 0.4, "visible": True},
    {"name": "PTV High", "type": "PTV", "color": "#b91c1c", "opacity": 0.6, "visible": True},
    {"name": "PTV Mid", "type": "PTV", "color": "#991b1b", "opacity": 0.5, "visible": True},
    {"name": "PTV Low", "type": "PTV", "color": "#f43f5e", "opacity": 0.4, "visible": True}
]

for idx, cfg in enumerate(organs_config):
    # Retrieve the binary mask for this organ index
    mask = structures_tensor[idx]
    
    # Pack into bit pos
    bit_pos = idx
    organs_bitmask[mask > 0] |= (1 << bit_pos)
    
    # Compile organ metadata
    organ_bits_meta[bit_pos] = {
        "name": cfg["name"],
        "type": cfg["type"],
        "color": cfg["color"],
        "opacity": cfg["opacity"],
        "visible": cfg["visible"]
    }
    
    # Calculate statistics
    voxels = int(np.count_nonzero(mask))
    organ_dose = dose_gy[mask > 0] if voxels > 0 else np.array([0.0])
    
    organ_stats_list.append({
        "name": cfg["name"],
        "type": cfg["type"],
        "color": cfg["color"],
        "defaultOpacity": cfg["opacity"],
        "visible": cfg["visible"],
        "stats": {
            "meanDose": round(float(np.mean(organ_dose)), 2) if voxels > 0 else 0.0,
            "maxDose": round(float(np.max(organ_dose)), 2) if voxels > 0 else 0.0,
            "minDose": round(float(np.min(organ_dose)), 2) if voxels > 0 else 0.0,
            "d95": round(float(np.percentile(organ_dose, 5)), 2) if voxels > 0 else 0.0,
            "d98": round(float(np.percentile(organ_dose, 2)), 2) if voxels > 0 else 0.0,
            "d50": round(float(np.percentile(organ_dose, 50)), 2) if voxels > 0 else 0.0,
            "v95": round(float(np.sum(organ_dose >= 70.0 * 0.95) / voxels * 100), 2) if voxels > 0 else 0.0,
            "v100": round(float(np.sum(organ_dose >= 70.0) / voxels * 100), 2) if voxels > 0 else 0.0,
            "volume": round(voxels * voxel_vol_cc, 1)
        }
    })

# Write flat binaries
img_hu.tofile("img.bin")
dose_gy.tofile("dose.bin")
organs_bitmask.tofile("organs.bin")
```

---

## 4. Frontend Codebase Files to Modify

To point the web application to your new backend server, edit these files:

### A. Point to Backend URI
* **File**: `src/services/api.js` (line 10):
  ```javascript
  const API_URL = import.meta.env.VITE_API_URL || 'http://YOUR_PROD_IP_OR_DNS:5000';
  ```

### B. Disable Simulated/Demo Mode
* **File**: `src/store/predictionStore.js` (line 29):
  ```javascript
  // Change default simulationMode to false to run live uploads to API
  simulationMode: false,
  ```

### C. File Upload Format Validations
* **File**: `src/components/dashboard/UploadZone.jsx` (lines 37-40 & lines 80-83):
  If your backend model expects compressed archives (`.zip` or `.npz`) rather than flat `.npy` files, update the validations here:
  ```javascript
  if (!file.name.endsWith('.npz') && !file.name.endsWith('.npy')) { ... }
  ```
