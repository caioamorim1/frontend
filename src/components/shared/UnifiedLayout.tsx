// ...existing code...
import { useContext } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../../contexts/AuthContext";

export default function UnifiedLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout?.();
    } finally {
      navigate("/login");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-end px-6 py-3 border-b bg-white">
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-1.5 rounded bg-rose-600 text-white text-sm hover:bg-rose-700"
            title="Sair"
          >
            Sair
          </button>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
// ...existing code...
