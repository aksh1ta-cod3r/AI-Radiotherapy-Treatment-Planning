# AI Radiotherapy Dose and DVH Dashboard

## Overview

The AI Radiotherapy Dose and DVH Dashboard is a full-stack healthcare application developed to support radiotherapy treatment planning through interactive visualization and machine learning integration.

The platform combines a React-based frontend with a Python backend to generate and visualize radiation dose predictions. It enables users to upload patient data, interactively analyze Dose Volume Histograms (DVH), view CT slices, and examine organ-wise dose statistics through a responsive dashboard.

This project demonstrates frontend-backend integration, REST API communication, healthcare data visualization, and deployment of machine learning models in a web application.

---

## Features

- Interactive Dose Volume Histogram (DVH) visualization
- CT slice viewer for medical image navigation
- Organ-wise dose statistics
- AI-based dose prediction
- REST API integration with Python backend
- Patient data upload interface
- Dose summary dashboard
- Responsive and modular user interface

---

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS
- Axios

### Backend

- Python
- Flask
- REST APIs
- NumPy

### Machine Learning

- Dose prediction model
- Feature preprocessing
- Model inference

### Visualization

- Dose Volume Histogram (DVH)
- CT Slice Viewer
- Organ Statistics
- Interactive Charts

---

## System Architecture

```
Patient Data
      │
      ▼
React Frontend
      │
      ▼
REST API
      │
      ▼
Python Backend
      │
      ▼
Machine Learning Model
      │
      ▼
Dose Prediction
      │
      ▼
Interactive Dashboard
```

---

## Project Structure

```
AI-Radiotherapy-Dose-and-DVH-Dashboard
│
├── src/
│   ├── components/
│   ├── assets/
│   ├── services/
│   ├── App.jsx
│   └── main.jsx
│
├── public/
│
├── package.json
├── package-lock.json
├── vite.config.js
├── README.md
└── backend/
```

---

## Installation

Clone the repository

```bash
git clone https://github.com/aksh1ta-cod3r/AI-Radiotherapy-Dose-and-DVH-Dashboard.git
```

Navigate to the project directory

```bash
cd AI-Radiotherapy-Dose-and-DVH-Dashboard
```

Install dependencies

```bash
npm install
```

Start the frontend

```bash
npm run dev
```

---

## Backend Setup

1. Create a Python virtual environment.
2. Install the required Python dependencies.
3. Start the backend server.
4. Configure the frontend API endpoint if required.
5. Launch the React application.

---

## Application Workflow

1. Upload patient data.
2. Send the data to the backend through REST APIs.
3. Generate dose predictions using the machine learning model.
4. Process the prediction results.
5. Visualize the output using:
   - Dose Volume Histogram (DVH)
   - CT Slice Viewer
   - Organ Statistics
   - Dose Summary

---

## Applications

- Radiotherapy treatment planning
- Radiation dose visualization
- Medical imaging analysis
- Healthcare AI research
- Clinical decision support

---

## Future Enhancements

- DICOM file support
- Docker deployment
- User authentication
- Cloud deployment
- Multi-patient management
- PACS integration
- Model versioning
- Performance optimization

---

## Screenshots

Screenshots of the application can be found in the `screenshots` directory.

- Dashboard
- Patient Upload
- DVH Visualization
- CT Slice Viewer
- Organ Statistics
- Dose Summary

---

## Author

**Akshita Sharma**

Computer Science Engineering Student

Areas of Interest

- Artificial Intelligence
- Machine Learning
- Healthcare AI
- Full Stack Development
- Data Analytics

GitHub: https://github.com/aksh1ta-cod3r
