/**
 * predictionStore.js
 * 
 * Purpose: Centralized global state management using Zustand.
 * Data Flow:
 *   - Sidebar uploads file -> Triggers prediction service -> Stores results in predictionData
 *   - Slice sliders -> Mutate sliceIndex -> Re-renders CT viewer
 *   - Organ checkbox -> Updates visible status & selectedOrgans -> Recharts + 2D + 3D update
 * Rationale: Zustand is preferred over Context API to prevent unnecessary re-renders in high-frequency 
 * canvas rendering (such as mouse moving for windowing/leveling or slice scrolling).
 */
import { create } from 'zustand';
import { ORGANS_METADATA, MOCK_METADATA, MOCK_SUMMARY, getOrganStats } from '../utils/mockData';
import { generate3DVolumes, loadNumpyDataset } from '../utils/volumeData';

// Initial state values
const initialOrganConfigs = ORGANS_METADATA.reduce((acc, organ) => {
  acc[organ.name] = {
    color: organ.color,
    opacity: organ.defaultOpacity,
    visible: organ.visible,
  };
  return acc;
}, {});

export const usePredictionStore = create((set, get) => ({
  // Core system status
  isBackendConnected: false,
  simulationMode: true, // Defaults to true for offline demo showcases
  isDarkMode: true,

  // File loading states
  uploadedFile: null,
  uploadProgress: 0,
  isLoading: false,
  error: null,

  // Prediction model outputs
  predictionData: null, 
  // Structure: { metadata, doseSummary, organsList, dvhData }

  // Viewer state
  activeTab: 'ct', // 'ct' | 'dose' | 'contour' | 'threed'
  sliceIndex: 60, // Default to mid-slice
  axialIndex: 60,
  coronalIndex: 64,
  sagittalIndex: 64,
  windowWidth: 400, // CT Bone/Soft Tissue window width
  windowLevel: 40,  // CT Soft tissue window level
  ctOpacity: 1.0,
  doseOpacity: 0.6,
  contourOpacity: 0.8,
  crosshairEnabled: true,

  // Organ rendering configs
  organConfigs: initialOrganConfigs,
  selectedOrgans: ORGANS_METADATA.filter(o => o.visible).map(o => o.name),
  selectedOrganForStats: 'PTV High',

  // Actions
  setBackendConnected: (connected) => set({ isBackendConnected: connected }),
  setSimulationMode: (mode) => set({ simulationMode: mode }),
  toggleDarkMode: () => {
    const nextMode = !get().isDarkMode;
    document.body.classList.toggle('light', !nextMode);
    set({ isDarkMode: nextMode });
  },

  setUploadedFile: (file) => set({ uploadedFile: file }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setActiveTab: (activeTab) => set({ activeTab }),
  
  setSliceIndex: (index) => {
    const maxSlices = get().predictionData?.metadata?.sliceCount || MOCK_METADATA.sliceCount;
    const clampedIndex = Math.max(0, Math.min(maxSlices - 1, index));
    set({ sliceIndex: clampedIndex, axialIndex: clampedIndex });
  },

  setAxialIndex: (index) => {
    const maxSlices = get().predictionData?.metadata?.depth || MOCK_METADATA.sliceCount;
    const clampedIndex = Math.max(0, Math.min(maxSlices - 1, index));
    set({ axialIndex: clampedIndex, sliceIndex: clampedIndex });
  },

  setCoronalIndex: (index) => {
    const maxHeight = get().predictionData?.metadata?.height || 128;
    const clampedIndex = Math.max(0, Math.min(maxHeight - 1, index));
    set({ coronalIndex: clampedIndex });
  },

  setSagittalIndex: (index) => {
    const maxWidth = get().predictionData?.metadata?.width || 128;
    const clampedIndex = Math.max(0, Math.min(maxWidth - 1, index));
    set({ sagittalIndex: clampedIndex });
  },

  setWindowWidth: (windowWidth) => set({ windowWidth: Math.max(10, windowWidth) }),
  setWindowLevel: (windowLevel) => set({ windowLevel: Math.max(-1000, Math.min(1000, windowLevel)) }),
  setCtOpacity: (ctOpacity) => set({ ctOpacity: Math.max(0, Math.min(1, ctOpacity)) }),
  setDoseOpacity: (doseOpacity) => set({ doseOpacity: Math.max(0, Math.min(1, doseOpacity)) }),
  setContourOpacity: (contourOpacity) => set({ contourOpacity: Math.max(0, Math.min(1, contourOpacity)) }),
  toggleCrosshair: () => set({ crosshairEnabled: !get().crosshairEnabled }),

  setSelectedOrganForStats: (organName) => set({ selectedOrganForStats: organName }),

  // Toggle single organ visibility
  toggleOrganSelection: (organName) => {
    const { organConfigs, selectedOrgans } = get();
    const isCurrentlyVisible = organConfigs[organName]?.visible ?? false;
    
    // Toggle visible attribute
    const updatedConfigs = {
      ...organConfigs,
      [organName]: {
        ...organConfigs[organName],
        visible: !isCurrentlyVisible,
      }
    };

    // Recompute list of active organs for Recharts & 3D filters
    const updatedSelected = !isCurrentlyVisible
      ? [...selectedOrgans, organName]
      : selectedOrgans.filter(name => name !== organName);

    set({
      organConfigs: updatedConfigs,
      selectedOrgans: updatedSelected,
    });
  },

  // Modify color or opacity of a single organ
  updateOrganConfig: (organName, updates) => {
    const { organConfigs } = get();
    set({
      organConfigs: {
        ...organConfigs,
        [organName]: {
          ...organConfigs[organName],
          ...updates,
        }
      }
    });
  },

  // Clear data
  resetStore: () => set({
    uploadedFile: null,
    uploadProgress: 0,
    predictionData: null,
    error: null,
    isLoading: false,
    sliceIndex: 60,
    axialIndex: 60,
    coronalIndex: 64,
    sagittalIndex: 64,
  }),

  // Inject pre-processed clinical dataset (arr_0.npy)
  triggerSimulation: async () => {
    set({
      isLoading: true,
      error: null,
      uploadProgress: 0,
    });

    try {
      const data = await loadNumpyDataset((progress) => {
        set({ uploadProgress: progress });
      });

      // Construct predictionData structure using the metadata loaded from arr_0.npy
      const simData = {
        metadata: data.metadata,
        doseSummary: data.metadata.doseSummary,
        organsList: data.metadata.organsList,
        ctVolume: data.ctVolume,
        doseVolume: data.doseVolume,
        organVolumes: data.organVolumes
      };

      // Construct active organ configurations dynamically from loaded metadata
      const initialOrganConfigs = data.metadata.organsList.reduce((acc, organ) => {
        acc[organ.name] = {
          color: organ.color,
          opacity: organ.defaultOpacity,
          visible: organ.visible,
        };
        return acc;
      }, {});

      set({
        predictionData: simData,
        organConfigs: initialOrganConfigs,
        selectedOrgans: data.metadata.organsList.filter(o => o.visible).map(o => o.name),
        selectedOrganForStats: data.metadata.organsList.find(o => o.type === 'PTV')?.name || data.metadata.organsList[0]?.name || 'PTV High',
        uploadedFile: { name: 'Patient Data', size: 37194600 }, // ~35.4 MB
        uploadProgress: 100,
        isLoading: false,
        axialIndex: Math.floor(data.metadata.depth / 2),
        coronalIndex: Math.floor(data.metadata.height / 2),
        sagittalIndex: Math.floor(data.metadata.width / 2),
        sliceIndex: Math.floor(data.metadata.depth / 2),
      });
    } catch (err) {
      console.error("Failed to load numpy dataset:", err);
      set({
        error: "Failed to load pre-processed arr_0.npy visualization data.",
        isLoading: false
      });
    }
  }
}));

export default usePredictionStore;
