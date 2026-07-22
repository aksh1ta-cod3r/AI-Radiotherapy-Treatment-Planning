/**
 * Sidebar.jsx
 * 
 * Purpose: Left control panel wrapping input/file upload and organ configuration overlays.
 * Props: None.
 * Data Flow: Aggregates `UploadZone`, `PatientInfo`, and `OrganSelector` widgets.
 */
import { UploadZone } from './UploadZone';
import { PatientInfo } from './PatientInfo';
import { OrganSelector } from './OrganSelector';

export function Sidebar() {
  return (
    <aside className="w-80 border-r border-slate-800 bg-slate-900/20 px-4 py-4 flex flex-col gap-4 overflow-y-auto shrink-0 select-none light:border-slate-200 light:bg-white">
      {/* Upload module */}
      <section>
        <UploadZone />
      </section>

      {/* Patient metadata module */}
      <section>
        <PatientInfo />
      </section>

      {/* Interactive organ layers list */}
      <section className="flex-1 min-h-0">
        <OrganSelector />
      </section>
    </aside>
  );
}

export default Sidebar;
