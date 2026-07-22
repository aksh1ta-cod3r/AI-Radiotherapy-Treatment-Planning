/**
 * App.jsx
 * 
 * Purpose: Main application shell coordinating page routing, global styling, and toast notifications.
 * Routes:
 *   - /           : Home (Landing Portal & Guidelines)
 *   - /dashboard  : Dashboard (Active planning, 2D slice canvas, 3D volume viewports)
 *   - /prediction : Prediction (AI model diagnostic parameters & training plots)
 * Props: None.
 * Design: Flexbox-column screen container, unified dark header, glass toast alerts.
 */
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Prediction } from './pages/Prediction';
import Navbar from './components/dashboard/Navbar';
import { BookOpen } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans select-none bg-slate-950 dark:bg-slate-950 light:bg-slate-50 transition-colors duration-300">
        
        {/* Global Navigation Header Bar */}
        <Navbar />

        {/* Dynamic Routing Sub-viewport */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/prediction" element={<Prediction />} />
          </Routes>
        </div>

        {/* Global Nav Footer Tabs (Compact bottom actions) */}
        <footer className="h-8 border-t border-slate-900 bg-slate-950 px-6 flex justify-between items-center text-[10px] text-slate-500 font-semibold select-none light:border-slate-200 light:bg-slate-100">
          <span>AI Radiotherapy Dose Planner &copy; 2026. Research Mode.</span>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-teal-400 transition-colors">Home Portal</Link>
            <Link to="/dashboard" className="hover:text-teal-400 transition-colors">Planner Workspace</Link>
            <Link to="/prediction" className="hover:text-teal-400 transition-colors flex items-center gap-1 text-slate-400">
              <BookOpen className="w-3.5 h-3.5" />
              Model Diagnostics
            </Link>
          </div>
        </footer>

        {/* Premium Toast Alerts configurations */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0f172a',
              border: '1px solid #1e293b',
              color: '#f8fafc',
              fontSize: '12px',
              borderRadius: '10px',
              padding: '10px 14px',
            },
            success: {
              iconTheme: {
                primary: '#14b8a6',
                secondary: '#0f172a',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#0f172a',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
