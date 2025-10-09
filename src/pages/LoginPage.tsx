import { useState, FormEvent } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Componentes da UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DimensionaLogo } from "@/components/DimensionaLogo";

// Ícones
import {
  Eye,
  EyeOff,
  Stethoscope,
  Heart,
  Activity,
  Mail,
  Lock,
} from "lucide-react";

// Imagem
import medicalTeamImage from "@/assets/medical-team-topview.jpg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);

    } catch (err) {
      const errorMsg = "Credenciais inválidas. Verifique seu e-mail e senha.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Painel Esquerdo - Fundo agora sólido e mais escuro */}
      <div className="flex-1 lg:flex-[0_0_40%] flex items-center justify-center p-8 bg-[#003151] relative overflow-hidden">
        {/* Elementos Decorativos */}
        <div className="absolute top-10 left-10 opacity-20">
          <Stethoscope className="h-16 w-16 text-white" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-20">
          <Heart className="h-12 w-12 text-white" />
        </div>
        <div className="absolute top-1/3 right-16 opacity-15">
          <Activity className="h-20 w-20 text-white" />
        </div>

        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="space-y-6 text-center">
            <div className="mx-auto">
              <DimensionaLogo size="lg" className="mx-auto" />
            </div>
            <div>
              <CardDescription className="text-gray-600">
                Acesse sua conta para continuar
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-10 pr-4"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-11 bg-[#003151] hover:bg-[#0b6f88]" // Tom claro mantido para o hover
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-[#0b6f88] hover:text-[#003151] transition-colors" // Tom claro mantido para legibilidade
                onClick={() => navigate("/forgot-password")}
              >
                Esqueci minha senha
              </button>
            </div>

            <div className="text-center text-xs text-gray-500">
              © DIMENSIONA+ · 2025
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel Direito - Elementos decorativos agora usam o tom escuro */}
      <div className="hidden lg:flex flex-[0_0_60%] relative bg-gray-50 overflow-hidden">
        <div className="absolute inset-0 bg-[#003151]/5" />

        {/* Círculos Decorativos */}
        <div className="absolute top-20 right-20 w-32 h-32 border border-[#003151]/20 rounded-full" />
        <div className="absolute top-40 right-40 w-16 h-16 border border-[#003151]/30 rounded-full" />
        <div className="absolute bottom-32 right-16 w-24 h-24 border border-[#003151]/15 rounded-full" />
        <div className="absolute bottom-20 right-32 w-8 h-8 bg-[#003151]/20 rounded-full" />

        <img
          src={medicalTeamImage}
          alt="Equipe médica profissional"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-gray-50/20 to-transparent" />

        <div className="absolute bottom-8 left-8 right-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#003151]/10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Plataforma de Gestão Inteligente
            </h2>
            <p className="text-gray-600 text-sm">
              Otimize a gestão de equipes, monitore indicadores e melhore a
              qualidade do atendimento com nossa plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}