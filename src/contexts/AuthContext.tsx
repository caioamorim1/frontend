import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { jwtDecode } from "jwt-decode";
import { useAlert } from "./AlertContext";
import { API_BASE_URL } from "@/lib/api";
// Interface expandida para incluir o papel do usuário
interface UserPayload {
  id: string;
  nome: string;
  mustChangePassword?: boolean;
  // O token pode ter 'tipo' (novo/granular) e/ou 'role' (compat)
  tipo?:
    | "ADMIN"
    | "GESTOR_ESTRATEGICO"
    | "GESTOR_TATICO"
    | "AVALIADOR"
    | "CONSULTOR"
    | "COMUM";
  role?: "ADMIN" | "GESTOR" | "COMUM";
  // Propriedade unificada para facilitar o uso no frontend
  appRole?: "ADMIN" | "GESTOR" | "COMUM";
  hospital?: {
    id: string;
    nome: string;
  };
  // Tempo de expiração do token (timestamp Unix em segundos)
  exp?: number;
  // Tempo de emissão do token
  iat?: number;
}

interface AuthContextType {
  token: string | null;
  user: UserPayload | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("authToken")
  );
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  // Timer para verificar expiração do token
  useEffect(() => {
    let warningTimeoutId: ReturnType<typeof setTimeout>;
    let logoutTimeoutId: ReturnType<typeof setTimeout>;

    if (token && user?.exp) {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = user.exp;
      const timeUntilExpiration = expiresAt - now;

      // Se o token já está expirado
      if (timeUntilExpiration <= 0) {
        console.warn("Token já expirado. Deslogando...");
        logout();
        return;
      }

      // Agendar aviso para 2 minutos antes da expiração
      const timeUntilWarning = (timeUntilExpiration - 120) * 1000; // Converter para ms

      if (timeUntilWarning > 0) {
        warningTimeoutId = setTimeout(() => {
          console.warn("Mostrando aviso: 2 minutos para expiração");
          showAlert(
            "destructive",
            "Sessão Expirando",
            "Sua sessão expirará em 2 minutos. Você será desconectado automaticamente."
          );
        }, timeUntilWarning);
      } else {
        // Se faltam menos de 2 minutos, mostrar aviso imediatamente
        showAlert(
          "destructive",
          "Sessão Expirando",
          "Sua sessão expirará em breve. Você será desconectado automaticamente."
        );
      }

      // Agendar logout para quando o token expirar (com 5 segundos de margem)
      const timeUntilLogout = (timeUntilExpiration - 5) * 1000;

      if (timeUntilLogout > 0) {
        logoutTimeoutId = setTimeout(() => {
          console.warn("Token expirado. Deslogando...");
          showAlert(
            "destructive",
            "Sessão Expirada",
            "Sua sessão expirou. Redirecionando para login..."
          );
          setTimeout(() => logout(), 2000);
        }, timeUntilLogout);
      }
    }

    return () => {
      if (warningTimeoutId) clearTimeout(warningTimeoutId);
      if (logoutTimeoutId) clearTimeout(logoutTimeoutId);
    };
  }, [token, user]);

  useEffect(() => {
    setLoading(true);
    if (token) {
      try {
        localStorage.setItem("authToken", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const decoded = jwtDecode<UserPayload>(token);

        // Verificar se o token já está expirado
        if (decoded.exp) {
          const now = Math.floor(Date.now() / 1000);
          if (decoded.exp <= now) {
            console.warn("Token expirado ao carregar. Limpando sessão...");
            setToken(null);
            setUser(null);
            localStorage.removeItem("authToken");
            delete api.defaults.headers.common["Authorization"];
            setLoading(false);
            return;
          }
        }

        // Unifica o papel do usuário em uma única propriedade 'appRole'
        // Preferir o tipo granular quando disponível; manter role como fallback.
        let finalRole: UserPayload["appRole"] = "COMUM";

        if (decoded.tipo === "ADMIN") {
          finalRole = "ADMIN";
        } else if (
          decoded.tipo === "GESTOR_ESTRATEGICO" ||
          decoded.tipo === "GESTOR_TATICO"
        ) {
          finalRole = "GESTOR";
        } else if (decoded.role === "ADMIN") {
          finalRole = "ADMIN";
        } else if (decoded.role === "GESTOR") {
          finalRole = "GESTOR";
        }

        const finalUser = { ...decoded, appRole: finalRole };
        setUser(finalUser);
      } catch (e) {
        console.error("Token inválido:", e);
        setToken(null);
        setUser(null);
      }
    } else {
      localStorage.removeItem("authToken");
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    }
    setLoading(false);
  }, [token]);

  const login = async (email: string, pass: string) => {
    try {
      console.log("URL", API_BASE_URL);
      const response = await api.post("/login", { email: email, senha: pass });

      const { token: newToken } = response.data;

      if (newToken) {
        setToken(newToken);
        const decoded = jwtDecode<UserPayload>(newToken);

        if (decoded.mustChangePassword) {
          navigate("/change-password");
        } else if (decoded.tipo === "ADMIN" || decoded.role === "ADMIN") {
          // Admin global vai para a gestão de hospitais
          navigate("/admin/hospitais");
        } else if (
          decoded.tipo === "GESTOR_ESTRATEGICO" ||
          decoded.tipo === "GESTOR_TATICO" ||
          decoded.role === "GESTOR"
        ) {
          // Gestor deve ir para o dashboard do seu hospital
          const hospId = decoded.hospital?.id;
          if (hospId) {
            navigate(`/hospital/${hospId}/dashboard`);
          } else {
            // Fallback se não houver hospital no token
            navigate("/meu-hospital");
          }
        } else {
          // Usuário comum
          navigate("/meu-hospital");
        }
      }
    } catch (error) {
      console.error("Falha no login:", error);
      throw new Error(
        "Credenciais inválidas. Verifique o seu email e palavra-passe."
      );
    }
  };

  const logout = () => {
    // Limpar token do estado
    setToken(null);
    setUser(null);

    // Limpar localStorage
    localStorage.removeItem("authToken");

    // Limpar header de autorização do axios
    delete api.defaults.headers.common["Authorization"];

    // Redirecionar para login
    navigate("/login");
  };

  const value = {
    token,
    user,
    login,
    logout,
    isAuthenticated: !!token && !loading,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
