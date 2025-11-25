import { useState, FormEvent, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyResetToken, resetPassword } from "@/lib/api";

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
  Stethoscope,
  Heart,
  Activity,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";

// Imagem
import medicalTeamImage from "@/assets/medical-team-topview.jpg";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setError("Link inválido ou expirado.");
        setVerifying(false);
        return;
      }

      try {
        const response = await verifyResetToken(token);

        if (response.valid && response.email) {
          setTokenValid(true);
          setEmail(response.email);
        } else {
          setTokenValid(false);
          setError("Link inválido ou expirado.");
        }
      } catch (err: any) {
        setTokenValid(false);
        setError("Erro ao verificar token.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "A senha deve ter no mínimo 8 caracteres.";
    }
    if (!/[A-Z]/.test(password)) {
      return "A senha deve conter pelo menos uma letra maiúscula.";
    }
    if (!/[a-z]/.test(password)) {
      return "A senha deve conter pelo menos uma letra minúscula.";
    }
    if (!/[0-9]/.test(password)) {
      return "A senha deve conter pelo menos um número.";
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log("🔄 [ResetPassword] Iniciando redefinição...", {
      newPassword: newPassword.length,
      confirmPassword: confirmPassword.length,
      token: token?.substring(0, 10) + "...",
    });

    // Validações
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      console.log("❌ [ResetPassword] Erro de validação:", passwordError);
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      console.log("❌ [ResetPassword] Senhas não coincidem");
      setError("As senhas não coincidem.");
      return;
    }

    if (!token) {
      console.log("❌ [ResetPassword] Token inválido");
      setError("Token de recuperação inválido.");
      return;
    }

    setLoading(true);
    console.log("📡 [ResetPassword] Enviando requisição...");

    try {
      const response = await resetPassword(token, newPassword);
      console.log("✅ [ResetPassword] Resposta recebida:", response);

      if (response.success) {
        console.log("✅ [ResetPassword] Senha redefinida com sucesso!");
        setSuccess(true);

        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(response.message || "Erro ao redefinir senha.");
      }
    } catch (err: any) {
      console.error("❌ [ResetPassword] Erro:", err);
      console.error("❌ [ResetPassword] Response:", err.response?.data);
      const errorMessage =
        err.response?.data?.message ||
        "Erro ao redefinir senha. O link pode estar expirado.";
      setError(errorMessage);
    } finally {
      console.log("🔄 [ResetPassword] Finalizando...");
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <div className="h-screen flex overflow-hidden">
        <div className="flex-1 lg:flex-[0_0_40%] flex items-center justify-center p-8 bg-[#003151] relative overflow-hidden">
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
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Verificando link...</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:flex flex-[0_0_60%] relative bg-gray-50 overflow-hidden">
          <div className="absolute inset-0 bg-[#003151]/5" />
          <img
            src={medicalTeamImage}
            alt="Equipe médica profissional"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="h-screen flex overflow-hidden">
        <div className="flex-1 lg:flex-[0_0_40%] flex items-center justify-center p-8 bg-[#003151] relative overflow-hidden">
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
            </CardHeader>

            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertDescription>
                  Link inválido ou expirado. Solicite uma nova recuperação de
                  senha.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => navigate("/forgot-password")}
                className="w-full h-11 bg-[#003151] hover:bg-[#0b6f88]"
              >
                Solicitar Novo Link
              </Button>

              <div className="text-center text-xs text-gray-500">
                © DIMENSIONA+ · 2025
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:flex flex-[0_0_60%] relative bg-gray-50 overflow-hidden">
          <div className="absolute inset-0 bg-[#003151]/5" />
          <img
            src={medicalTeamImage}
            alt="Equipe médica profissional"
            className="w-full h-full object-cover object-center"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Painel Esquerdo */}
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {success ? "Senha Redefinida!" : "Redefinir Senha"}
              </h1>
              <CardDescription className="text-gray-600">
                {success
                  ? "Sua senha foi alterada com sucesso"
                  : "Crie uma nova senha segura para sua conta"}
              </CardDescription>
              {!success && email && (
                <p className="text-sm text-gray-500 mt-2">
                  Email: <strong>{email}</strong>
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {success ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-center text-gray-600 mb-2">
                    Sua senha foi alterada com sucesso!
                  </p>
                  <p className="text-center text-sm text-gray-500">
                    Você será redirecionado para o login...
                  </p>
                </div>

                <Button
                  onClick={() => navigate("/login")}
                  className="w-full h-11 bg-[#003151] hover:bg-[#0b6f88]"
                >
                  Ir para Login
                </Button>
              </div>
            ) : (
              <>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                    <p className="text-xs text-gray-500">
                      Mínimo 8 caracteres, com maiúsculas, minúsculas e números
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-11 pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !newPassword || !confirmPassword}
                    className="w-full h-11 bg-[#003151] hover:bg-[#0b6f88]"
                  >
                    {loading ? "Redefinindo..." : "Redefinir Senha"}
                  </Button>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-[#0b6f88] hover:text-[#003151] transition-colors"
                    onClick={() => navigate("/login")}
                  >
                    Voltar ao Login
                  </button>
                </div>
              </>
            )}

            <div className="text-center text-xs text-gray-500">
              © DIMENSIONA+ · 2025
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel Direito */}
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
          className="w-full h-full object-cover object-center"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-gray-50/20 to-transparent" />

        <div className="absolute bottom-8 left-8 right-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#003151]/10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Segurança em Primeiro Lugar
            </h2>
            <p className="text-gray-600 text-sm">
              Crie uma senha forte para manter sua conta e dados protegidos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
