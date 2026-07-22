"""
=========================================================
HMM-RT 3D Organ Viewer
=========================================================

Features
--------
✓ Interactive 3D rotation
✓ Smooth surface using Marching Cubes
✓ Shows any organ
✓ Prints organ statistics

Requirements:
pip install pyvista pyqt5 scikit-image
=========================================================
"""

import numpy as np
import pyvista as pv
from skimage import measure

# =========================================================
# CHANGE THESE
# =========================================================

FILE_PATH = r"DataSet\train_HaN\train\0522c0001+15Ag+MOS_23629.npz"

# Choose the organ to visualize
ORGAN = "PTV_Total"

# Examples:
# ORGAN = "PTV_Total"
# ORGAN = "SpinalCord"
# ORGAN = "Mandible"
# ORGAN = "Parotids"
# ORGAN = "Eyes"

# =========================================================
# LOAD DATA
# =========================================================

data = np.load(FILE_PATH, allow_pickle=True)

patient = data["arr_0"].item()

mask = patient[ORGAN]

print("=" * 60)
print("Organ :", ORGAN)
print("Shape :", mask.shape)
print("Datatype :", mask.dtype)
print("Number of voxels :", np.count_nonzero(mask))
print("=" * 60)

# =========================================================
# CHECK EMPTY MASK
# =========================================================

if np.count_nonzero(mask) == 0:
    raise ValueError(f"{ORGAN} mask is empty!")

# =========================================================
# CREATE SURFACE
# =========================================================

verts, faces, normals, values = measure.marching_cubes(
    mask.astype(np.float32),
    level=0.5
)

# Convert faces to PyVista format
faces = np.hstack(
    [np.full((faces.shape[0], 1), 3), faces]
).astype(np.int64)

mesh = pv.PolyData(verts, faces)

# =========================================================
# VISUALIZATION
# =========================================================

plotter = pv.Plotter(window_size=(1000, 800))

plotter.set_background("white")

plotter.add_mesh(
    mesh,
    color="red",
    opacity=1.0,
    smooth_shading=True,
    show_edges=False
)

plotter.add_axes()

plotter.add_text(
    f"3D View : {ORGAN}",
    font_size=14
)

plotter.show_grid()

plotter.show()