import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import {
  exportSnapshotVariacaoPdf,
  type RelatorioTipo,
  type RelatorioEscopo,
} from "@/lib/api";
import { useAlert } from "@/contexts/AlertContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import axios from "axios";

interface ExportRelatorioDropdownProps {
  hospitalId: string;
  unidadeId: string;
}

interface RelatorioOption {
  tipo: RelatorioTipo;
  escopo: RelatorioEscopo;
  label: string;
}

const MAPA_OPTIONS: RelatorioOption[] = [
  { tipo: "MAPA", escopo: "QUANTIDADE", label: "Mapa de Quantidades" },
  { tipo: "MAPA", escopo: "FINANCEIRO", label: "Mapa Financeiro" },
  { tipo: "MAPA", escopo: "GERAL", label: "Mapa Geral" },
];

const DETALHAMENTO_OPTIONS: RelatorioOption[] = [
  { tipo: "DETALHAMENTO", escopo: "QUANTIDADE", label: "Det. Quantidades" },
  { tipo: "DETALHAMENTO", escopo: "FINANCEIRO", label: "Det. Financeiro" },
  { tipo: "DETALHAMENTO", escopo: "GERAL", label: "Det. Geral" },
];

export default function ExportRelatorioDropdown({
  hospitalId,
  unidadeId,
}: ExportRelatorioDropdownProps) {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (tipo: RelatorioTipo, escopo: RelatorioEscopo) => {
    const key = `${tipo}-${escopo}`;
    try {
      setLoading(key);
      await exportSnapshotVariacaoPdf(hospitalId, tipo, escopo, unidadeId);
      showAlert(
        "success",
        "Relatório gerado",
        "O download do PDF foi iniciado com sucesso."
      );
    } catch (error: unknown) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      if (status === 404) {
        showAlert(
          "destructive",
          "Baseline não encontrado",
          "Esta unidade não possui um baseline selecionado. Selecione um baseline antes de gerar o relatório."
        );
      } else {
        showAlert(
          "destructive",
          "Erro ao gerar relatório",
          "Ocorreu um erro inesperado ao gerar o relatório. Tente novamente."
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  const renderItem = (option: RelatorioOption) => {
    const key = `${option.tipo}-${option.escopo}`;
    const itemLoading = loading === key;
    return (
      <DropdownMenuItem
        key={key}
        disabled={isLoading}
        onClick={() => handleExport(option.tipo, option.escopo)}
      >
        {itemLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {option.label}
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          Exportar Relatório
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {MAPA_OPTIONS.map(renderItem)}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Outros
        </DropdownMenuLabel>
        {DETALHAMENTO_OPTIONS.map(renderItem)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
