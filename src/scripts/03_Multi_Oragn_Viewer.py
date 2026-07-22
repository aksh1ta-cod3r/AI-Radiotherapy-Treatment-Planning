
"""
HMM-RT Multi-Organ 3D Viewer
============================

Requirements:
    pip install pyvista pyqt5 scikit-image

Usage:
1. Change FILE_PATH.
2. Edit ORGANS_TO_SHOW.
3. Run:
       python multi_organ_viewer.py
"""

import numpy as np
import pyvista as pv
from skimage import measure

# ------------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------------

FILE_PATH = r"Reserach Papers\HNC_001%2B9Ag%2BMOS_25934 (1).npz"

# ------------------------------------------------------------------
# ALL ORGANS TO DISPLAY
# ------------------------------------------------------------------

# ==========================================================
# ORGAN GROUPS
# ==========================================================

ORGAN_GROUPS = {

    # ------------------------------------------------------
    # 1. TARGETS
    # ------------------------------------------------------
    "targets": [
        "PTV_Total",
        "PTV70",
        "PTVHighOPT",
        "RingPTVHigh",
    ],

    # ------------------------------------------------------
    # 2. BRAIN
    # ------------------------------------------------------
    "brain": [
        "Brain",
        "BrainStem",
        "BrainStem_03",
        "SpinalCord",
        "SpinalCord_05",
    ],

    # ------------------------------------------------------
    # 3. EYES
    # ------------------------------------------------------
    "eyes": [
        "Eyes",
        "Lens_L",
        "Lens_R",
        "OpticNerve_L",
        "OpticNerve_R",
        "Chiasm",
        "LacrimalGlands",
    ],

    # ------------------------------------------------------
    # 4. EAR
    # ------------------------------------------------------
    "ears": [
        "Cochlea_L",
        "Cochlea_R",
    ],

    # ------------------------------------------------------
    # 5. SALIVARY GLANDS
    # ------------------------------------------------------
    "salivary": [
        "Parotids",
        "ParotidCon-PTV",
        "ParotidIps-PTV",
        "Parotids-PTV",

        "Submandibular",
        "SubmandL-PTV",
        "SubmandR-PTV",
        "Submand-PTV",
    ],

    # ------------------------------------------------------
    # 6. ORAL REGION
    # ------------------------------------------------------
    "oral": [
        "Mandible",
        "Mandible-PTV",

        "OralCavity",
        "OCavity-PTV",

        "Lips",
    ],

    # ------------------------------------------------------
    # 7. AIRWAY
    # ------------------------------------------------------
    "airway": [
        "Larynx",
        "Larynx-PTV",
        "PharynxConst",
        "PharConst-PTV",
    ],

    # ------------------------------------------------------
    # 8. LOWER NECK
    # ------------------------------------------------------
    "neck": [
        "Thyroid",
        "Thyroid-PTV",
        "BrachialPlexus",
        "Posterior_Neck",
        "Shoulders",
    ],

    # ------------------------------------------------------
    # 9. THORAX
    # ------------------------------------------------------
    "thorax": [
        "Lungs",
    ],

    # ------------------------------------------------------
    # 10. BODY
    # ------------------------------------------------------
    "body": [
        "Body",
    ],

    # ------------------------------------------------------
    # 10. Top
    # ------------------------------------------------------
    "top": [
        "Body",
        "Brain",
        "BrainStem",
        "SpinalCord",
        "Mandible",
        "Parotids",
        "PTV_Total",
    ],

    # ------------------------------------------------------
    # 12. EVERYTHING
    # ------------------------------------------------------
    "all": [
        "Body",

        "PTV_Total",
        "PTV70",
        "PTVHighOPT",
        "RingPTVHigh",

        "Brain",
        "BrainStem",
        "BrainStem_03",

        "SpinalCord",
        "SpinalCord_05",

        "Eyes",
        "Lens_L",
        "Lens_R",
        "OpticNerve_L",
        "OpticNerve_R",
        "Chiasm",
        "LacrimalGlands",

        "Cochlea_L",
        "Cochlea_R",

        "Parotids",
        "ParotidCon-PTV",
        "ParotidIps-PTV",
        "Parotids-PTV",

        "Submandibular",
        "SubmandL-PTV",
        "SubmandR-PTV",
        "Submand-PTV",

        "Mandible",
        "Mandible-PTV",

        "OralCavity",
        "OCavity-PTV",

        "Lips",

        "Larynx",
        "Larynx-PTV",

        "PharynxConst",
        "PharConst-PTV",

        "Pituitary",

        "Thyroid",
        "Thyroid-PTV",

        "BrachialPlexus",

        "Posterior_Neck",

        "Shoulders",

        "Lungs",
    ],
}

# ==========================================================
# CHOOSE WHAT TO DISPLAY
# ==========================================================

ACTIVE_GROUP = "top" 

ORGANS_TO_SHOW = ORGAN_GROUPS[ACTIVE_GROUP]

ORGAN_COLORS = {

    # External
    "Body": "lightgray",

    # Targets
    "PTV_Total": "magenta",
    "PTV70": "red",
    "PTVHighOPT": "darkred",
    "RingPTVHigh": "yellow",

    # Brain
    "Brain": "gold",
    "BrainStem": "orange",
    "BrainStem_03": "coral",

    # Cord
    "SpinalCord": "blue",
    "SpinalCord_05": "deepskyblue",

    # Eyes
    "Eyes": "cyan",
    "Lens_L": "white",
    "Lens_R": "silver",
    "OpticNerve_L": "lime",
    "OpticNerve_R": "green",
    "Chiasm": "purple",
    "LacrimalGlands": "pink",

    # Ear
    "Cochlea_L": "dodgerblue",
    "Cochlea_R": "royalblue",

    # Salivary
    "Parotids": "forestgreen",
    "ParotidCon-PTV": "seagreen",
    "ParotidIps-PTV": "mediumspringgreen",
    "Parotids-PTV": "limegreen",

    "Submandibular": "olive",
    "Submand-PTV": "yellowgreen",
    "SubmandL-PTV": "lawngreen",
    "SubmandR-PTV": "darkolivegreen",

    # Oral
    "OralCavity": "salmon",
    "OCavity-PTV": "tomato",
    "Lips": "hotpink",

    # Airway
    "Larynx": "turquoise",
    "Larynx-PTV": "teal",
    "PharynxConst": "aquamarine",
    "PharConst-PTV": "mediumturquoise",

    # Bone
    "Mandible": "tan",
    "Mandible-PTV": "peru",

    # Other
    "Pituitary": "violet",
    "Thyroid": "khaki",
    "Thyroid-PTV": "goldenrod",
    "BrachialPlexus": "navy",
    "Posterior_Neck": "brown",
    "Shoulders": "sienna",
    "Lungs": "lightblue",
}

DEFAULT_COLOR = "gray"
DEFAULT_OPACITY = 0.45

# ------------------------------------------------------------------
# LOAD
# ------------------------------------------------------------------

print("=" * 70)
print("Loading:", FILE_PATH)

data = np.load(FILE_PATH, allow_pickle=True)
patient = data["arr_0"].item()

print("Loaded successfully")
print("=" * 70)

plotter = pv.Plotter(window_size=(1200, 900))
plotter.set_background("white")
plotter.add_axes()
plotter.show_grid()

added = 0

for organ in ORGANS_TO_SHOW:

    if organ not in patient:
        print(f"[WARNING] {organ} not found")
        continue

    mask = patient[organ]

    if not isinstance(mask, np.ndarray):
        print(f"[WARNING] {organ} is not an ndarray")
        continue

    voxels = int(np.count_nonzero(mask))

    if voxels == 0:
        print(f"[SKIPPED] {organ} is empty")
        continue

    print("-" * 60)
    print("Organ :", organ)
    print("Shape :", mask.shape)
    print("Voxels:", voxels)

    try:
        verts, faces, normals, values = measure.marching_cubes(
            mask.astype(np.float32),
            level=0.5
        )

        faces = np.hstack(
            [np.full((faces.shape[0], 1), 3), faces]
        ).astype(np.int64)

        mesh = pv.PolyData(verts, faces)

        plotter.add_mesh(
            mesh,
            color=ORGAN_COLORS.get(organ, DEFAULT_COLOR),
            opacity=DEFAULT_OPACITY,
            smooth_shading=True,
            name=organ,
            label=organ,
            show_edges=False,
        )

        added += 1

    except Exception as e:
        print(f"[ERROR] {organ}: {e}")

print("=" * 70)
print("Meshes added:", added)
print("=" * 70)

if added == 0:
    raise RuntimeError("No valid organs could be displayed.")

plotter.add_legend(bcolor="white")
plotter.add_text(
    "HMM-RT Multi-Organ Viewer",
    position="upper_left",
    font_size=12,
)

print("""
Mouse Controls
--------------
Left Button   : Rotate
Middle Button : Pan
Right Button  : Zoom
Mouse Wheel   : Zoom
""")

plotter.show()
