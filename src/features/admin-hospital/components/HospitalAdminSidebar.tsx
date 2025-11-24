import { NavLink, useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Building,
  Users,
  Briefcase,
  ClipboardList,
  LayoutDashboard,
  Bed,
  ArrowLeft,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
}) => {
  const location = useLocation();
  
  const isActive = (() => {
    const currentPath = location.pathname;
    
    // Se a rota atual é exatamente a rota do item
    if (currentPath === to) return true;
    
    // Para "Setores" (/hospital/:id/setores)
    // Marca como ativo se estamos em /setores/:setorId
    if (to.endsWith('/setores')) {
      // Regex para /setores/ seguido de UUID, mas NÃO /gerir-setores
      return /\/setores\/[a-f0-9\-]+/.test(currentPath) && !currentPath.includes('/gerir-setores');
    }
    
    // Para "Gerir Setores" (/hospital/:id/gerir-setores)
    // Marca como ativo se estamos em /gerir-setores ou /gerir-setores/:id
    if (to.endsWith('/gerir-setores')) {
      return currentPath.includes('/gerir-setores');
    }
    
    // Para "Unidades e Leitos" e rotas de unidade
    if (to.includes('/unidades-leitos')) {
      return currentPath.includes('/unidades-leitos') || currentPath.includes('/unidade/');
    }
    
    // Para outras rotas, verifica se a rota atual começa com o caminho do item
    return currentPath.startsWith(to + '/');
  })();
  
  return (
    <li>
      <NavLink
        to={to}
        className={() =>
          `flex items-center px-3 py-2 my-1 rounded-md text-sm transition-colors ${
            isActive
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
};

const ExpandableSubItem = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 my-1 rounded-md text-sm text-gray-200 hover:bg-white/10 text-left"
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-3 tracking-wider">
            {label}
          </span>
        </div>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && <ul className="pl-3">{children}</ul>}
    </li>
  );
};

export default function HospitalAdminSidebar() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    {
      to: `/hospital/${hospitalId}/dashboard`,
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
    },
    {
      to: `/hospital/${hospitalId}/pareto`,
      icon: <ClipboardList size={18} />,
      label: "Pareto",
    },
    {
      to: `/hospital/${hospitalId}/setores`,
      icon: <Building size={18} />,
      label: "Gerir Setores",
    },
    {
      to: `/hospital/${hospitalId}/unidades-leitos`,
      icon: <Bed size={18} />,
      label: "Unidades e Leitos",
    },
    {
      to: `/hospital/${hospitalId}/baseline`,
      icon: <BarChart3 size={18} />,
      label: "Baseline",
    },
  ];

  const cadastrosItems = [
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
      to: `/hospital/${hospitalId}/gerir-setores`,
      icon: <Building size={18} />,
      label: "Setores",
    },
  ];

  useEffect(() => {
    if (hospitalId) {
      getHospitalById(hospitalId).then(setHospital).catch(console.error);
    }
  }, [hospitalId]);

  return (
    <aside className="w-72 bg-primary text-primary-foreground flex flex-col flex-shrink-0">
      <div
        className={`h-16 flex items-center border-b border-white/20 px-4 gap-x-3 ${
          user?.appRole === "ADMIN" ? "" : "justify-center"
        }`}
      >
        {user?.appRole === "ADMIN" && (
          <button
            onClick={() => navigate("/admin/hospitais")}
            className="p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
        )}
        <h1
          className="text-xl font-bold text-white truncate"
          title={hospital?.nome}
        >
          {hospital?.nome || "A carregar..."}
        </h1>
      </div>

      {/* navegação principal */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul>
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          <ExpandableSubItem label="Cadastros" icon={<FileText size={18} />}>
            {cadastrosItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </ExpandableSubItem>
        </ul>
      </nav>

      {/* botão de sair */}
      <div className="px-4 py-3 border-t border-white/20">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-3 py-2 rounded-md text-sm text-gray-200 hover:bg-white/10 transition-colors"
        >
          <LogOut size={18} />
          <span className="ml-3">Sair</span>
        </button>
      </div>

      {/* logomarca no rodapé */}
      <div className="h-20 flex items-center justify-center border-t border-white/20 px-6 py-3">
        <img
          src="/logo.png"
          alt="Dimensiona+"
          className="h-14 w-auto object-contain opacity-90"
        />
      </div>
    </aside>
  );
}
