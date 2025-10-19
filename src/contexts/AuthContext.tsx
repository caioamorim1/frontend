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

// Interface expandida para incluir o papel do usuário
interface UserPayload {
  id: string;
  nome: string;
  mustChangePassword?: boolean;
  // O token pode ter 'tipo' (admin global) ou 'role' (outros)
  tipo?: "ADMIN";
  role?: "ADMIN" | "GESTOR" | "COMUM";
  // Propriedade unificada para facilitar o uso no frontend
  appRole?: "ADMIN" | "GESTOR" | "COMUM";
  hospital?: {
    id: string;
    nome: string;
  };
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

  useEffect(() => {
    setLoading(true);
    if (token) {
      try {
        localStorage.setItem("authToken", token);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const decoded = jwtDecode<UserPayload>(token);

        // Unifica o papel do usuário em uma única propriedade 'appRole'
        let finalRole: UserPayload["appRole"] = "COMUM";
        if (decoded.role === "ADMIN") {
          finalRole = "ADMIN";
        } else if (decoded.role === "GESTOR") {
          finalRole = "GESTOR"; // Tratando admin de hospital como gestor
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
      const response = await api.post("/login", { email: email, senha: pass });

      const { token: newToken } = response.data;

      if (newToken) {
        setToken(newToken);
        const decoded = jwtDecode<UserPayload>(newToken);

        if (decoded.mustChangePassword) {
          navigate("/change-password");
        } else if (decoded.role === "ADMIN") {
          navigate("/admin/hospitais");
        } else {
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
    setToken(null);
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
