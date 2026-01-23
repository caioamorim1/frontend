import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import api from "@/lib/api";

export function AjustesPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleProcessPendingSessions = async () => {
    try {
      setIsProcessing(true);
      setMessage(null);

      const response = await api.post("/jobs/session-expiry/process-pending");

      setMessage({
        type: "success",
        text: response.data.message || "Processamento concluído com sucesso!",
      });
    } catch (error: any) {
      console.error("Erro ao processar sessões pendentes:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Erro ao processar sessões pendentes.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ajustes do Sistema</h1>
        <p className="text-gray-600 mt-2">
          Configurações e manutenções administrativas do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Processamento de Sessões Pendentes
          </CardTitle>
          <CardDescription>
            Processa manualmente as sessões de leitos que estão pendentes de
            expiração. Use esta função caso o servidor tenha sido reiniciado e
            os jobs automáticos não tenham executado corretamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert
              variant={message.type === "error" ? "destructive" : "default"}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {message.type === "error" ? "Erro" : "Sucesso"}
              </AlertTitle>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-2">
                O que esta função faz:
              </h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Verifica todos os leitos com sessões ativas</li>
                <li>Identifica sessões que deveriam ter expirado</li>
                <li>Reseta o status dos leitos para disponível</li>
                <li>Limpa as sessões expiradas do sistema</li>
              </ul>
            </div>

            <Button
              onClick={handleProcessPendingSessions}
              disabled={isProcessing}
              className="w-full sm:w-auto"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Processar Sessões Pendentes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AjustesPage;
