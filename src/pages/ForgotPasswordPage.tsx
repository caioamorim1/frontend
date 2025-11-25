import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "@/lib/api";

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
  Mail,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

// Imagem
import medicalTeamImage from "@/assets/medical-team-topview.jpg";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await requestPasswordReset(email);

      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || "Erro ao enviar e-mail de recuperação.");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Erro ao enviar e-mail de recuperação. Tente novamente.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
                Esqueceu sua senha?
              </h1>
              <CardDescription className="text-gray-600">
                {success
                  ? "E-mail enviado com sucesso!"
                  : "Não se preocupe, enviaremos instruções para redefinir"}
              </CardDescription>
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
                    Enviamos um link de recuperação para:
                  </p>
                  <p className="text-center font-semibold text-gray-900">
                    {email}
                  </p>
                </div>

                <Alert>
                  <AlertDescription className="text-sm">
                    Verifique sua caixa de entrada e spam. O link expira em 24
                    horas.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => navigate("/login")}
                  className="w-full h-11 bg-[#003151] hover:bg-[#0b6f88]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Login
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

                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full h-11 bg-[#003151] hover:bg-[#0b6f88]"
                  >
                    {loading ? "Enviando..." : "Enviar Link de Recuperação"}
                  </Button>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-[#0b6f88] hover:text-[#003151] transition-colors inline-flex items-center"
                    onClick={() => navigate("/login")}
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
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
              Recuperação Segura
            </h2>
            <p className="text-gray-600 text-sm">
              Mantenha sua conta protegida com nosso sistema seguro de
              recuperação de senha.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
