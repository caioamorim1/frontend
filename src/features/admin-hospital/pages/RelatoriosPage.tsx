import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  exportSnapshotVariacaoPdf,
  type RelatorioTipo,
  type RelatorioEscopo,
} from "@/lib/api";
import { useAlert } from "@/contexts/AlertContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Map, AlignLeft } from "lucide-react";
import axios from "axios";
import React from "react";

interface RelatorioBotao {
  tipo: RelatorioTipo;
  escopo: RelatorioEscopo;
  label: string;
  description: string;
}

const RELATORIOS: { grupo: string; icon: React.ReactNode; items: RelatorioBotao[] }[] = [
  {
    grupo: "Mapa",
    icon: <Map className="h-5 w-5" />,
    items: [
      {
        tipo: "MAPA",
        escopo: "QUANTIDADE",
        label: "Quantidade",
        description: "Variação do quadro de pessoal por quantidade de colaboradores.",
      },
      {
        tipo: "MAPA",
        escopo: "FINANCEIRO",
        label: "Financeiro",
        description: "Variação do quadro de pessoal em valores financeiros.",
      },
      {
        tipo: "MAPA",
        escopo: "GERAL",
        label: "Geral",
        description: "Visão geral consolidada do mapa de variação.",
      },
    ],
  },
  {
    grupo: "Detalhamento",
    icon: <AlignLeft className="h-5 w-5" />,
    items: [
      {
        tipo: "DETALHAMENTO",
        escopo: "QUANTIDADE",
        label: "Quantidade",
        description: "Detalhamento da variação por quantidade de colaboradores.",
      },
      {
        tipo: "DETALHAMENTO",
        escopo: "FINANCEIRO",
        label: "Financeiro",
        description: "Detalhamento da variação em valores financeiros.",
      },
      {
        tipo: "DETALHAMENTO",
        escopo: "GERAL",
        label: "Geral",
        description: "Visão geral consolidada do detalhamento de variação.",
      },
    ],
  },
];

export default function RelatoriosPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const effectiveHospitalId = hospitalId || user?.hospital?.id;

  // Controla qual botão está carregando individualmente: "MAPA-QUANTIDADE", etc.
  const [loading, setLoading] = useState<string | null>(null);

  const handleDownload = async (tipo: RelatorioTipo, escopo: RelatorioEscopo) => {
    if (!effectiveHospitalId) {
      showAlert("destructive", "Erro", "Hospital não identificado.");
      return;
    }
    const key = `${tipo}-${escopo}`;
    try {
      setLoading(key);
      await exportSnapshotVariacaoPdf(effectiveHospitalId, tipo, escopo);
      showAlert(
        "success",
        "Relatório gerado",
        "O download do PDF foi iniciado com sucesso."
      );
    } catch (error: any) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      if (status === 404) {
        showAlert(
          "destructive",
          "Baseline não encontrado",
          "Este hospital não possui um baseline selecionado. Selecione um baseline antes de gerar o relatório."
        );
      } else {
        showAlert(
          "destructive",
          "Erro ao gerar relatório",
          "Erro ao gerar o relatório. Tente novamente."
        );
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileDown className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {RELATORIOS.map(({ grupo, icon, items }) => (
          <Card key={grupo} className="shadow-sm border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                {icon}
                {grupo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map(({ tipo, escopo, label, description }) => {
                const key = `${tipo}-${escopo}`;
                const isLoading = loading === key;
                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-md border bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                        {description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoading || loading !== null}
                      onClick={() => handleDownload(tipo, escopo)}
                      className="shrink-0 w-full sm:w-auto"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      {isLoading ? "Gerando..." : "Baixar PDF"}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
