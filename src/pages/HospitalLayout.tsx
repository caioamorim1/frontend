import { Outlet } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";

export default function HospitalLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
