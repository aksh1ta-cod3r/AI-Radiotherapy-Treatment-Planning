
"""
HMM-RT CT + Dose + PTV Viewer
Requires: matplotlib, numpy

Shows:
- Axial, Coronal, Sagittal views
- CT grayscale
- Dose heatmap overlay
- PTV contour overlay
- Slider to scroll through slices
"""
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.widgets import Slider

FILE_PATH=r"DataSet\train_HaN\train\0522c0012+15Ag+MOS_36260.npz"
PTV_KEY="PTV_Total"
DOSE_ALPHA=0.45

patient=np.load(FILE_PATH,allow_pickle=True)["arr_0"].item()
ct=patient["img"]
dose=patient["dose"].astype(float)
ptv=patient[PTV_KEY]

# normalize dose for display
if dose.max()>0:
    dose=(dose-dose.min())/(dose.max()-dose.min())

a=ct.shape[2]//2
c=ct.shape[1]//2
s=ct.shape[0]//2

fig,axs=plt.subplots(1,3,figsize=(16,6))
plt.subplots_adjust(bottom=0.2)

def draw():
    views=[
        (ct[:,:,a],dose[:,:,a],ptv[:,:,a],"Axial"),
        (ct[:,c,:],dose[:,c,:],ptv[:,c,:],"Coronal"),
        (ct[s,:,:],dose[s,:,:],ptv[s,:,:],"Sagittal")
    ]
    for ax,(im,d,m,title) in zip(axs,views):
        ax.clear()
        ax.imshow(im,cmap="gray",origin="lower")
        ax.imshow(np.ma.masked_where(d<=0,d),cmap="jet",alpha=DOSE_ALPHA,origin="lower")
        ax.contour(m,levels=[0.5],colors="lime",linewidths=1.5)
        ax.set_title(title)
        ax.axis("off")
    fig.canvas.draw_idle()

sax=plt.axes([0.15,0.06,0.7,0.03])
slider=Slider(sax,"Slice",0,max(ct.shape)-1,valinit=a,valstep=1)

def update(val):
    global a,c,s
    v=int(slider.val)
    a=min(v,ct.shape[2]-1)
    c=min(v,ct.shape[1]-1)
    s=min(v,ct.shape[0]-1)
    draw()

slider.on_changed(update)
draw()
plt.show()
