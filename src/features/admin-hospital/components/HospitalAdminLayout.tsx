import { Outlet } from 'react-router-dom';
import HospitalAdminSidebar from './HospitalAdminSidebar';

export default function HospitalAdminLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <HospitalAdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}