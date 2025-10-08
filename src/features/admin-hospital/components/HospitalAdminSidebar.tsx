import { NavLink, useNavigate, useParams } from "react-router-dom";
import {
  Building,
  Users,
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  Bed,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getHospitalById, Hospital } from "@/lib/api";
import { /*...,*/ ListCollapse } from "lucide-react";

const NavItem = ({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 my-1 rounded-md text-sm transition-colors ${isActive
          ? "bg-secondary/10 text-secondary font-semibold"
          : "text-gray-200 hover:bg-white/10"
        }`
      }
    >
      {icon}
      <span className="ml-3">{label}</span>
    </NavLink>
  </li>
);

export default function HospitalAdminSidebar() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const navigate = useNavigate();

  const navItems = [
    {
      to: `/hospital/${hospitalId}/dashboard`,
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
    },
    {
      to: `/hospital/${hospitalId}/unidades-leitos`,
      icon: <Bed size={18} />,
      label: "Unidades e Leitos",
    }, // Ponto 1 da sua lista
    {
      to: `/hospital/${hospitalId}/setores`,
      icon: <Building size={18} />,
      label: "Gerir Setores",
    },
    {
      to: `/hospital/${hospitalId}/usuarios`,
      icon: <Users size={18} />,
      label: "Usuários",
    },
    {
      to: `/hospital/${hospitalId}/cargos`,
      icon: <Briefcase size={18} />,
      label: "Cargos",
    },
    {
      to: `/hospital/${hospitalId}/pareto`,
      icon: <ClipboardList size={18} />,
      label: "Pareto",
    },
    {
      to: `/hospital/${hospitalId}/coletas`,
      icon: <ListCollapse size={18} />,
      label: "Histórico de Coletas",
    },
  ];

  useEffect(() => {
    if (hospitalId) {
      getHospitalById(hospitalId).then(setHospital).catch(console.error);
    }
  }, [hospitalId]);

  return (
    <aside className="w-72 bg-primary text-primary-foreground flex flex-col flex-shrink-0">
      <div className="h-16 flex items-center border-b border-white/20 px-4 gap-x-3">
        {/* --- BOTÃO DE VOLTAR ADICIONADO --- */}
        <button
          onClick={() => navigate("/admin/hospitais")} // Ação de voltar para a página anterior
          className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <h1
          className="text-xl font-bold text-white truncate"
          title={hospital?.nome}
        >
          {hospital?.nome || "A carregar..."}
        </h1>
      </div>
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul>
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </ul>
      </nav>
    </aside>
  );
}
