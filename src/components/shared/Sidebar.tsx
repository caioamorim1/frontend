import { NavLink, useParams } from "react-router-dom";
import {
  Hospital as HospitalIcon,
  Waypoints,
  Group,
  Globe,
  Building,
  Users,
  Briefcase,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Bed,
  FileText,
  ListChecks,
  Shield,
  BarChart3,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getHospitais, Hospital } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

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
          <span className="ml-3 text-xs font-semibold uppercase tracking-wider">
            {label}
          </span>
        </div>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {isOpen && <ul className="pl-3">{children}</ul>}
    </li>
  );
};

const HospitalSubMenu = ({ hospital }: { hospital: Hospital }) => {
  const { hospitalId: activeHospitalId } = useParams();
  const [isExpanded, setIsExpanded] = useState(
    activeHospitalId === hospital.id
  );

  useEffect(() => {
    if (activeHospitalId === hospital.id) {
      setIsExpanded(true);
    }
  }, [activeHospitalId, hospital.id]);

  const subItems = [
    {
      to: `/hospital/${hospital.id}/dashboard`,
      icon: <LayoutDashboard size={16} />,
      label: "Dashboard",
    },
    {
      to: `/hospital/${hospital.id}/pareto`,
      icon: <ClipboardList size={16} />,
      label: "Pareto",
    },
    {
      to: `/hospital/${hospital.id}/setores`,
      icon: <Building size={16} />,
      label: "Setores",
    },
    {
      to: `/hospital/${hospital.id}/unidades-leitos`,
      icon: <Bed size={16} />,
      label: "Unidades e Leitos",
    },
    {
      to: `/hospital/${hospital.id}/baseline`,
      icon: <BarChart3 size={16} />,
      label: "Baseline",
    },
  ];

  const cadastrosItems = [
    {
      to: `/hospital/${hospital.id}/usuarios`,
      icon: <Users size={16} />,
      label: "Usuários",
    },
    {
      to: `/hospital/${hospital.id}/cargos`,
      icon: <Briefcase size={16} />,
      label: "Cargos",
    },
    {
      to: `/hospital/${hospital.id}/gerir-setores`,
      icon: <Building size={16} />,
      label: "Gerir Setores",
    },
  ];

  return (
    <li>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 my-1 rounded-md text-sm text-gray-200 hover:bg-white/10 text-left"
      >
        <div className="flex items-center truncate">
          <HospitalIcon size={18} className="flex-shrink-0" />
          <span className="ml-3 font-medium truncate">{hospital.nome}</span>
        </div>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isExpanded && (
        <ul className="pl-5 border-l-2 border-white/20 ml-3">
          {subItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
          <ExpandableSubItem label="Cadastros" icon={<FileText size={16} />}>
            {cadastrosItems.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </ExpandableSubItem>
        </ul>
      )}
    </li>
  );
};

export default function Sidebar() {
  const { user } = useAuth();
  const [hospitais, setHospitais] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  const adminGlobalItems = [
    {
      to: `/admin/dashboard`,
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard Global",
    },
    {
      to: `/admin/hospitais`,
      icon: <HospitalIcon size={18} />,
      label: "Gerir Hospitais",
    },
    { to: `/admin/redes`, icon: <Waypoints size={18} />, label: "Redes" },
    { to: `/admin/grupos`, icon: <Group size={18} />, label: "Grupos" },
    { to: `/admin/regioes`, icon: <Globe size={18} />, label: "Regiões" },
    {
      to: `/admin/scp-metodos`,
      icon: <FileText size={18} />,
      label: "Métodos SCP",
    },
    {
      to: `/admin/questionarios`,
      icon: <ListChecks size={18} />,
      label: "Qualitativo",
    },
    {
      to: `/admin/admins`,
      icon: <Shield size={18} />,
      label: "Administradores",
    },
  ];

  useEffect(() => {
    if (user?.appRole === "ADMIN") {
      setLoading(true);
      getHospitais()
        .then(setHospitais)
        .catch((err) =>
          console.error("Falha ao carregar hospitais para o menu:", err)
        )
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <aside className="w-72 bg-primary text-primary-foreground flex flex-col flex-shrink-0">
      <div className="h-20 flex items-center justify-center border-b border-white/20 px-6 py-3">
        <img
          src="/logo.png"
          alt="Dimensiona+"
          className="h-14 w-auto object-contain"
        />
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        {user?.appRole === "ADMIN" && (
          <>
            <h2 className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Admin Global
            </h2>
            <ul>
              {adminGlobalItems.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </ul>
            <hr className="my-6 border-white/20" />
            <h2 className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Gerir Hospitais
            </h2>
            <ul>
              {loading && (
                <li className="px-3 text-sm text-gray-400">A carregar...</li>
              )}
              {!loading &&
                hospitais.map((hospital) => (
                  <HospitalSubMenu key={hospital.id} hospital={hospital} />
                ))}
            </ul>
          </>
        )}

        {(user?.appRole === "GESTOR" || user?.appRole === "COMUM") && (
          <>
            <h2 className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
              Gerir Hospital
            </h2>
            <ul>
              <li>
                <div className="flex items-center px-3 py-2 my-1 rounded-md text-sm text-gray-200">
                  <HospitalIcon size={18} className="flex-shrink-0" />
                  <span className="ml-3 font-medium">Meu Hospital</span>
                </div>
                <ul className="pl-5 border-l-2 border-white/20 ml-3">
                  <NavItem
                    to="/meu-hospital/dashboard"
                    icon={<LayoutDashboard size={16} />}
                    label="Dashboard"
                  />
                  <NavItem
                    to="/meu-hospital/pareto"
                    icon={<ClipboardList size={16} />}
                    label="Pareto"
                  />
                  <NavItem
                    to="/meu-hospital/setores"
                    icon={<Building size={16} />}
                    label="Setores"
                  />
                  <NavItem
                    to="/meu-hospital/unidades-leitos"
                    icon={<Bed size={16} />}
                    label="Unidades e Leitos"
                  />
                  <NavItem
                    to="/meu-hospital/baseline"
                    icon={<BarChart3 size={16} />}
                    label="Baseline"
                  />
                  <ExpandableSubItem
                    label="Cadastros"
                    icon={<FileText size={16} />}
                  >
                    <NavItem
                      to="/meu-hospital/usuarios"
                      icon={<Users size={16} />}
                      label="Usuários"
                    />
                    <NavItem
                      to="/meu-hospital/cargos"
                      icon={<Briefcase size={16} />}
                      label="Cargos"
                    />
                    <NavItem
                      to="/meu-hospital/gerir-setores"
                      icon={<Building size={16} />}
                      label="Gerir Setores"
                    />
                  </ExpandableSubItem>
                </ul>
              </li>
            </ul>
          </>
        )}
      </nav>
    </aside>
  );
}
