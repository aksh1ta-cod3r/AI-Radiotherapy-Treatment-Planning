"""
=========================================================
HMM-RT Three-View Medical Image Viewer
=========================================================

Features
--------
✓ Axial View
✓ Coronal View
✓ Sagittal View
✓ Interactive Slider
✓ Optional Mask Overlay
✓ CT or Dose visualization

Author: Parav Sharma
=========================================================
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider

# =========================================================
# CHANGE THESE
# =========================================================

FILE_PATH = r"DataSet\train_HaN\train\0522c0001+15Ag+MOS_23629.npz"

# Main image
# Options:
# "img"
# "dose"

IMAGE_KEY = "dose"

# Overlay mask
# None -> No overlay

MASK_KEY = "PTV_Total"

# Examples
# MASK_KEY = "PTV_Total"
# MASK_KEY = "SpinalCord"
# MASK_KEY = "Mandible"
# MASK_KEY = None

# Overlay transparency
ALPHA = 0.35

# =========================================================
# LOAD DATA
# =========================================================

data = np.load(FILE_PATH, allow_pickle=True)

patient = data["arr_0"].item()

image = patient[IMAGE_KEY]

mask = None
if MASK_KEY is not None:
    mask = patient[MASK_KEY]

print("=" * 60)
print("Loaded image :", IMAGE_KEY)
print("Shape :", image.shape)

if mask is not None:
    print("Overlay :", MASK_KEY)

print("=" * 60)

# =========================================================
# INITIAL SLICE
# =========================================================

axial_idx = image.shape[2] // 2
coronal_idx = image.shape[1] // 2
sagittal_idx = image.shape[0] // 2

# =========================================================
# FIGURE
# =========================================================

fig, axes = plt.subplots(1, 3, figsize=(16, 6))

plt.subplots_adjust(bottom=0.20)

# =========================================================
# DRAW FUNCTION
# =========================================================


def draw():

    for ax in axes:
        ax.clear()

    # --------------------------
    # AXIAL
    # --------------------------

    axes[0].imshow(
        image[:, :, axial_idx],
        cmap="gray",
        origin="lower"
    )

    if mask is not None:

        axes[0].imshow(
            np.ma.masked_where(mask[:, :, axial_idx] == 0,
                               mask[:, :, axial_idx]),
            cmap="autumn",
            alpha=ALPHA,
            origin="lower"
        )

    axes[0].set_title(f"Axial\nSlice {axial_idx}")

    # --------------------------
    # CORONAL
    # --------------------------

    axes[1].imshow(
        image[:, coronal_idx, :],
        cmap="gray",
        origin="lower"
    )

    if mask is not None:

        axes[1].imshow(
            np.ma.masked_where(mask[:, coronal_idx, :] == 0,
                               mask[:, coronal_idx, :]),
            cmap="autumn",
            alpha=ALPHA,
            origin="lower"
        )

    axes[1].set_title(f"Coronal\nSlice {coronal_idx}")

    # --------------------------
    # SAGITTAL
    # --------------------------

    axes[2].imshow(
        image[sagittal_idx, :, :],
        cmap="gray",
        origin="lower"
    )

    if mask is not None:

        axes[2].imshow(
            np.ma.masked_where(mask[sagittal_idx, :, :] == 0,
                               mask[sagittal_idx, :, :]),
            cmap="autumn",
            alpha=ALPHA,
            origin="lower"
        )

    axes[2].set_title(f"Sagittal\nSlice {sagittal_idx}")

    for ax in axes:
        ax.axis("off")

    fig.canvas.draw_idle()


# =========================================================
# SLIDER
# =========================================================

slider_ax = plt.axes([0.15, 0.05, 0.70, 0.03])

max_slice = max(image.shape)

slider = Slider(
    slider_ax,
    "Slice",
    0,
    max_slice - 1,
    valinit=axial_idx,
    valstep=1
)

# =========================================================
# UPDATE
# =========================================================


def update(val):

    global axial_idx
    global coronal_idx
    global sagittal_idx

    value = int(slider.val)

    axial_idx = min(value, image.shape[2] - 1)

    coronal_idx = min(value, image.shape[1] - 1)

    sagittal_idx = min(value, image.shape[0] - 1)

    draw()


slider.on_changed(update)

# =========================================================
# SHOW
# =========================================================

draw()

plt.show()