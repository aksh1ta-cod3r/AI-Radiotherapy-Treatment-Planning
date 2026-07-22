/**
 * api.js
 * 
 * Purpose: API client layer for interfacing with the Flask backend endpoints.
 * Accepts: Multipart form data for file uploads, standard JSON responses.
 * Design: Uses Axios for structured error handling, request timeouts, and progress tracking.
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // Default to local Flask backend if not specified

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 120000, // 120 seconds timeout for large NPZ dose predictions
});

export const apiService = {
  /**
   * Check status of Flask backend
   * @returns {Promise<boolean>} Connected status
   */
  checkStatus: async () => {
    try {
      const response = await apiClient.get('/status');
      return response.status === 200;
    } catch (error) {
      console.warn('Backend unavailable, status check failed:', error.message);
      return false;
    }
  },

  /**
   * Upload NPZ file and trigger AI dose prediction
   * @param {File} file NPZ File object
   * @param {Function} onUploadProgress Callback for progress tracking
   * @returns {Promise<Object>} Dose prediction results (metadata, dose, dvh, organs)
   */
  predictDose: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  /**
   * Get download URL for raw prediction outputs
   * @param {string} patientId Patient ID to query
   * @returns {string} Download URI
   */
  getDownloadUrl: (patientId) => {
    return `${API_URL}/download?patientId=${encodeURIComponent(patientId)}`;
  },
};

export default apiService;
