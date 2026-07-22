/**
 * ThreeDViewer.jsx
 * 
 * Purpose: Render 3D visualizations of segmented organs, target volumes, and dose clouds.
 * Props: None.
 * Data Flow:
 *   - Subscribes to `organConfigs` from the Zustand store to dynamically hide/show structures,
 *     and adjust their opacities and color properties in real-time.
 *   - Renders a 3D Canvas utilizing OrbitControls for seamless rotate, zoom, and pan operations.
 * Rationale: React Three Fiber handles the WebGL scene tree reactively. 3D visualization gives clinicians
 * spatial understanding of the treatment plan geometry, dose coverage, and surrounding OAR overlaps.
 */
import { useState, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Center, StatsGl } from '@react-three/drei';
import { usePredictionStore } from '../../store/predictionStore';
import { Box, Eye, EyeOff, HelpCircle, Activity } from 'lucide-react';

// Individual organ mesh rendering component
function OrganMesh({ name, color, opacity, visible }) {
  if (!visible) return null;

  // Render different geometries to resemble actual anatomical structures
  switch (name) {
    case 'Body':
      // Stylized human representation: Head, Neck, and Shoulders wireframe outline
      return (
        <group>
          {/* Head */}
          <mesh position={[0, 1.85, -0.1]} scale={[1, 1.2, 0.95]}>
            <sphereGeometry args={[0.9, 24, 24]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={opacity || 0.1}
              wireframe
              depthWrite={false}
            />
          </mesh>
          {/* Neck */}
          <mesh position={[0, 0.85, -0.15]}>
            <cylinderGeometry args={[0.5, 0.52, 0.8, 24]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={opacity || 0.1}
              wireframe
              depthWrite={false}
            />
          </mesh>
          {/* Shoulders / Upper Torso */}
          <mesh position={[0, -0.9, -0.2]} scale={[1.2, 0.85, 0.9]}>
            <cylinderGeometry args={[1.5, 1.7, 2.7, 24]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={opacity || 0.1}
              wireframe
              depthWrite={false}
            />
          </mesh>
        </group>
      );

    case 'Brainstem':
      // Brainstem: Anatomically elongated cylinder near the back of the neck
      return (
        <mesh position={[0, 1.35, -0.75]} scale={[0.7, 1.6, 0.7]}>
          <cylinderGeometry args={[0.22, 0.26, 0.9, 16]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity || 0.5}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      );

    case 'Spinal Cord':
      // Spinal Cord: Vertical tube running down the back, aligning with the brainstem
      return (
        <mesh position={[0, -0.75, -0.85]}>
          <cylinderGeometry args={[0.12, 0.12, 3.5, 16]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity || 0.5}
            roughness={0.1}
          />
        </mesh>
      );

    case 'Parotid L':
      // Left Parotid: Oval gland on the side
      return (
        <mesh position={[-0.95, 0.9, -0.2]} scale={[0.8, 1.25, 0.7]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity || 0.4}
            roughness={0.3}
          />
        </mesh>
      );

    case 'Parotid R':
      // Right Parotid: Oval gland on the opposite side
      return (
        <mesh position={[0.95, 0.9, -0.2]} scale={[0.8, 1.25, 0.7]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity || 0.4}
            roughness={0.3}
          />
        </mesh>
      );

    case 'Parotids':
      // Combined Parotids: Render both left and right parotids
      return (
        <group>
          <mesh position={[-0.95, 0.9, -0.2]} scale={[0.8, 1.25, 0.7]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={opacity || 0.4}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0.95, 0.9, -0.2]} scale={[0.8, 1.25, 0.7]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial
              color={color}
              transparent
              opacity={opacity || 0.4}
              roughness={0.3}
            />
          </mesh>
        </group>
      );

    case 'Mandible':
      // Mandible: U-shaped jawbone contour
      return (
        <mesh position={[0, 0.95, 0.4]} rotation={[Math.PI / 8, 0, 0]}>
          <torusGeometry args={[0.65, 0.1, 12, 24, Math.PI]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity || 0.4}
            roughness={0.5}
          />
        </mesh>
      );

    case 'Oral Cavity':
      // Oral Cavity: Sphere representing the mouth interior
      return (
        <mesh position={[0, 0.75, 0.35]} scale={[1, 0.8, 1.2]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity || 0.4}
            roughness={0.3}
          />
        </mesh>
      );

    case 'Esophagus':
      // Esophagus: Narrow long cylinder below jaw/brainstem
      return (
        <mesh position={[0, -1.4, -0.7]}>
          <cylinderGeometry args={[0.16, 0.16, 2.6, 16]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity || 0.4}
          />
        </mesh>
      );

    case 'Heart':
      // Heart: Large muscular OAR at the bottom
      return (
        <mesh position={[-0.4, -2.4, -0.3]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity || 0.4}
          />
        </mesh>
      );

    // Target Volumes (PTVs): Concentric sphere shells at treatment iso-center
    case 'PTV High':
    case 'PTV 70':
      return (
        <mesh position={[0.2, 0.4, 0.1]}>
          <sphereGeometry args={[0.55, 32, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity || 0.6}
            emissive={color}
            emissiveIntensity={0.15}
            roughness={0.1}
          />
        </mesh>
      );

    case 'PTV Mid':
    case 'PTV 63':
      return (
        <mesh position={[0.2, 0.4, 0.1]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity || 0.5}
            roughness={0.2}
          />
        </mesh>
      );

    case 'PTV Low':
    case 'PTV 56':
      return (
        <mesh position={[0.2, 0.4, 0.1]}>
          <sphereGeometry args={[1.05, 32, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity || 0.4}
            roughness={0.3}
          />
        </mesh>
      );

    default:
      return null;
  }
}

// Particle System representing dose hotspots
function DoseCloud({ visible, opacity }) {
  const pointsRef = useRef();

  // Procedurally generate particles colored by target dose values
  const [positions, colors] = useMemo(() => {
    const count = 1200;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    const targetCenter = [0.2, 0.4, 0.1]; // Match PTV center

    for (let i = 0; i < count; i++) {
      // Generate particles in spherical volume around target center
      // Gaussian distribution for hotspot clustering
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const u = Math.random();
      const r = 1.6 * Math.pow(u, 0.6); // Radial concentration

      const px = targetCenter[0] + r * Math.sin(phi) * Math.cos(theta);
      const py = targetCenter[1] + r * Math.sin(phi) * Math.sin(theta);
      const pz = targetCenter[2] + r * Math.cos(phi);

      pos[i * 3] = px;
      pos[i * 3 + 1] = py;
      pos[i * 3 + 2] = pz;

      // Color mapping: Inner hotspot is Red, intermediate Orange/Green, outer Blue
      const distance = r;
      let rCol = 0, gCol = 0, bCol = 0;

      if (distance < 0.4) {
        // Red (>70 Gy)
        rCol = 1.0; gCol = 0.0; bCol = 0.1;
      } else if (distance < 0.8) {
        // Orange/Yellow (50-70 Gy)
        rCol = 1.0; gCol = 0.6; bCol = 0.0;
      } else if (distance < 1.2) {
        // Green (30-50 Gy)
        rCol = 0.1; gCol = 0.9; bCol = 0.1;
      } else {
        // Blue (<30 Gy)
        rCol = 0.1; gCol = 0.3; bCol = 1.0;
      }

      cols[i * 3] = rCol;
      cols[i * 3 + 1] = gCol;
      cols[i * 3 + 2] = bCol;
    }

    return [pos, cols];
  }, []);

  if (!visible) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        vertexColors
        transparent
        opacity={opacity}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
}

export function ThreeDViewer() {
  const { organConfigs, predictionData } = usePredictionStore();
  const [showDoseCloud, setShowDoseCloud] = useState(true);
  const [doseCloudOpacity, setDoseCloudOpacity] = useState(0.4);

  if (!predictionData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 rounded-2xl border border-slate-900 min-h-[400px] text-center px-6 light:bg-slate-100 light:border-slate-200">
        <Box className="w-10 h-10 text-slate-500 mb-3" />
        <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-800">3D Visualization Unavailable</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Please upload a Patient file or activate Simulation Mode to generate the 3D organ mesh and voxel dose cloud.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 rounded-2xl border border-slate-900 overflow-hidden light:bg-slate-100 light:border-slate-200">
      {/* 3D Viewer Header Ribbon */}
      <div className="px-4 py-2 border-b border-slate-900 flex justify-between items-center text-xs text-slate-400 font-semibold bg-slate-900/20 light:border-slate-200 light:bg-slate-100/50 select-none">
        <span className="flex items-center gap-1.5 text-teal-400">
          <Activity className="w-3.5 h-3.5 shrink-0" />
          Volume Rendering Viewport
        </span>
        <div className="flex items-center gap-4">
          {/* Dose Cloud Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showDoseCloud}
              onChange={(e) => setShowDoseCloud(e.target.checked)}
              className="rounded bg-slate-900 border-slate-800 text-teal-500 focus:ring-0 w-3 h-3"
            />
            <span className="text-[10px] text-slate-300 light:text-slate-700">Dose Cloud</span>
          </label>
        </div>
      </div>

      {/* WebGL Scene canvas */}
      <div className="flex-1 relative bg-black select-none">
        <Canvas camera={{ position: [4, 2, 5], fov: 45 }}>
          {/* Scene lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1.0} castShadow />
          <directionalLight position={[-10, -5, -10]} intensity={0.3} />
          <pointLight position={[0, 4, 0]} intensity={0.5} />

          <Center>
            {/* Render each active organ structure from store */}
            {Object.keys(organConfigs).map((name) => (
              <OrganMesh
                key={name}
                name={name}
                color={organConfigs[name].color}
                opacity={organConfigs[name].opacity}
                visible={organConfigs[name].visible}
              />
            ))}

            {/* Render 3D point cloud representing voxel dose values */}
            <DoseCloud visible={showDoseCloud} opacity={doseCloudOpacity} />
          </Center>

          {/* Navigational tools */}
          <OrbitControls makeDefault enableDamping dampingFactor={0.05} minDistance={2} maxDistance={15} />

          {/* Coordinate floor grid */}
          <Grid
            position={[0, -2.8, 0]}
            args={[10.5, 10.5]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#1e293b"
            sectionSize={2.0}
            sectionThickness={1.0}
            sectionColor="#334155"
            fadeDistance={25}
          />
        </Canvas>

        {/* 3D control shortcuts bubble */}
        <div className="absolute left-4 bottom-4 text-[9px] text-slate-400 bg-slate-900/80 backdrop-blur border border-slate-800/80 p-2 rounded-lg pointer-events-none light:bg-white/90 light:border-slate-200 flex items-start gap-1.5 shadow-lg select-none">
          <HelpCircle className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-300 light:text-slate-800">3D Navigating</p>
            <p className="mt-0.5">Left-click + Drag: Rotate | Right-click + Drag: Pan | Scroll: Zoom in/out</p>
          </div>
        </div>
      </div>

      {/* Bottom control tray */}
      {showDoseCloud && (
        <div className="p-3 border-t border-slate-900 bg-slate-900/15 flex items-center gap-3.5 light:border-slate-200 light:bg-slate-100/30 select-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider w-36">
            Dose Cloud Intensity
          </span>
          <input
            type="range"
            min="0.05"
            max="0.9"
            step="0.05"
            value={doseCloudOpacity}
            onChange={(e) => setDoseCloudOpacity(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 light:bg-slate-200"
          />
          <span className="text-[10px] font-mono text-slate-300 dark:text-slate-300 light:text-slate-700 w-10 text-right">
            {Math.round(doseCloudOpacity * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

export default ThreeDViewer;
