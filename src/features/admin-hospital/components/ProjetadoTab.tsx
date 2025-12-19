import { useState, useEffect } from "react";
import React from "react";
import {
  UnidadeInternacao,
  LinhaAnaliseFinanceira,
  getAnaliseInternacao,
  AjustesPayload,
  saveProjetadoFinalInternacao,
  getProjetadoFinalInternacao,
  type AnaliseInternacaoResponse,
  saveControlePeriodo,
} from "@/lib/api";
import { PieChartComp } from "./graphicsComponents/PieChartComp";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Brain,
  MinusCircle,
  PlusCircle,
  Settings,
  Target,
} from "lucide-react";
import { LinhaAnalise } from "@/components/shared/AnaliseFinanceira";
import { EvaluationsTab } from "@/features/qualitativo/components/EvaluationsTab";
import { useAlert } from "@/contexts/AlertContext";
import brainIcon from "@/assets/brain_ia.jpg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ObservacaoModal, ObservacaoButton } from "./ObservacaoModal";

// Tipos de status disponíveis
const STATUS_OPTIONS = [
  { value: "nao_iniciado", label: "Não iniciado" },
  { value: "andamento_parcial", label: "Em andamento - Entrega Parcial" },
  { value: "concluido_parcial", label: "Concluído - Entrega Parcial" },
  { value: "andamento_final", label: "Em andamento - Entrega Final" },
  { value: "concluido_final", label: "Concluído - Entrega Final" },
];

// Interface para dados adicionais de cada cargo
interface CargoMetadata {
  observacao?: string;
  status?: string;
}

// Componente para o input de ajuste
const AjusteInput = ({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (newValue: number) => void;
  disabled?: boolean;
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempValue, setTempValue] = React.useState(value.toString());
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const newValue = parseInt(tempValue) || 0;
    onChange(newValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setTempValue(value.toString());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onChange(value - 1)}
        disabled={disabled}
      >
        <MinusCircle
          className={`h-5 w-5 ${disabled ? "text-gray-300" : "text-red-500"}`}
        />
      </Button>
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="font-bold text-lg w-16 text-center border rounded px-1 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      ) : (
        <span
          className={`font-bold text-lg w-8 text-center ${
            disabled
              ? "text-gray-400"
              : "cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
          }`}
          onClick={() => {
            if (!disabled) {
              setTempValue(value.toString());
              setIsEditing(true);
            }
          }}
          title={disabled ? "" : "Clique para editar"}
        >
          {value}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
      >
        <PlusCircle
          className={`h-5 w-5 ${disabled ? "text-gray-300" : "text-green-500"}`}
        />
      </Button>
    </div>
  );
};

interface ProjetadoTabProps {
  unidade: UnidadeInternacao;
  dateRange?: { inicio?: string; fim?: string };
  onDateRangeChange?: (range: { inicio: string; fim: string }) => void;
}

export default function ProjetadoTab({
  unidade,
  dateRange,
  onDateRangeChange,
}: ProjetadoTabProps) {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analiseBase, setAnaliseBase] = useState<LinhaAnaliseFinanceira[]>([]);
  const [ajustes, setAjustes] = useState<AjustesPayload>({});
  const [metadata, setMetadata] = useState<Record<string, CargoMetadata>>({});
  const [showAvaliarPage, setShowAvaliarPage] = useState(false);
  const [modalObservacao, setModalObservacao] = useState<{
    isOpen: boolean;
    cargoId: string;
    cargoNome: string;
  }>({ isOpen: false, cargoId: "", cargoNome: "" });

  const [dataInicial, setDataInicial] = useState<string>(
    dateRange?.inicio ?? ""
  );
  const [dataFinal, setDataFinal] = useState<string>(dateRange?.fim ?? "");
  const [travado, setTravado] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hideCalculoFields, setHideCalculoFields] = useState(false);
  const [analise, setAnalise] = useState<AnaliseInternacaoResponse | null>(
    null
  );

  // Verificar se algum cargo tem status de conclusão
  const temStatusConclusao = Object.values(metadata).some(
    (meta) =>
      meta.status === "concluido_parcial" || meta.status === "concluido_final"
  );

  useEffect(() => {
    setDataInicial(dateRange?.inicio ?? "");
    setDataFinal(dateRange?.fim ?? "");
  }, [dateRange?.inicio, dateRange?.fim]);

  const handleCalcular = async () => {
    const hasInicio = Boolean(dataInicial);
    const hasFim = Boolean(dataFinal);

    if (!hasInicio && !hasFim) {
      showAlert(
        "destructive",
        "Período obrigatório",
        "Preencha a data inicial e a data final para calcular."
      );
      return;
    }

    if (!dataInicial || !dataFinal) {
      showAlert(
        "destructive",
        "Período incompleto",
        "Preencha a data inicial e a data final."
      );
      return;
    }

    if (new Date(dataFinal) < new Date(dataInicial)) {
      showAlert(
        "destructive",
        "Período inválido",
        "A data final deve ser maior ou igual à data inicial."
      );
      return;
    }

    try {
      setIsCalculating(true);
      const resp = await getAnaliseInternacao(unidade.id, {
        inicio: dataInicial,
        fim: dataFinal,
      });
      setAnalise(resp);

      // Atualizar a tabela com os novos dados
      if (resp && resp.tabela) {
        setAnaliseBase(resp.tabela);
      }

      // Notificar o componente pai sobre a mudança de dateRange
      if (onDateRangeChange) {
        onDateRangeChange({ inicio: dataInicial, fim: dataFinal });
      }

      // Salvar controle de período (não travado ainda)
      try {
        await saveControlePeriodo({
          unidadeId: unidade.id,
          travado: false,
          dataInicial,
          dataFinal,
        });
      } catch (saveError: any) {
        console.error("Erro ao salvar período:", saveError);
      }

      showAlert("success", "Pronto", "Indicadores calculados para o período.");
    } catch (e: any) {
      showAlert(
        "destructive",
        "Erro",
        e?.response?.data?.error || "Falha ao calcular indicadores."
      );
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const analiseData = await getAnaliseInternacao(
          unidade.id,
          dateRange && dateRange.inicio && dateRange.fim ? dateRange : undefined
        );

        if (analiseData) {
          setAnalise(analiseData);
        }

        if (analiseData && analiseData.tabela) {
          setAnaliseBase(analiseData.tabela);
        }

        // Tenta obter projetado final já salvo no backend
        try {
          const saved = await getProjetadoFinalInternacao(unidade.id);

          if (saved && saved.cargos) {
            const novoMapa: AjustesPayload = {};
            const novoMetadata: Record<string, CargoMetadata> = {};

            saved.cargos.forEach((c: any) => {
              const quantidadeAtual =
                unidade.cargos_unidade?.find((cu) => cu.cargo.id === c.cargoId)
                  ?.quantidade_funcionarios || 0;

              const projetadoFinalSalvo = Math.max(0, c.projetadoFinal ?? 0);

              // Calcula o ajuste como: ProjetadoFinal - Atual
              const delta = projetadoFinalSalvo - quantidadeAtual;
              novoMapa[c.cargoId] = delta;

              // Carregar metadata (observação e status)
              novoMetadata[c.cargoId] = {
                observacao: c.observacao || "",
                status: c.status || "nao_iniciado",
              };
            });

            setAjustes(novoMapa);
            setMetadata(novoMetadata);
          } else {
            setAjustes({});
            setMetadata({});
          }
        } catch {
          setAjustes({});
          setMetadata({});
        }
      } catch (error) {
        showAlert("destructive", "Erro", "Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [unidade.id, dateRange?.inicio, dateRange?.fim]);

  const handleAjusteChange = (cargoId: string, novoValor: number) => {
    setAjustes((prev) => ({ ...prev, [cargoId]: novoValor }));
  };

  const handleObservacaoChange = (cargoId: string, observacao: string) => {
    setMetadata((prev) => ({
      ...prev,
      [cargoId]: { ...prev[cargoId], observacao },
    }));
  };

  const handleOpenObservacaoModal = (cargoId: string, cargoNome: string) => {
    setModalObservacao({ isOpen: true, cargoId, cargoNome });
  };

  const handleSaveObservacao = (observacao: string) => {
    handleObservacaoChange(modalObservacao.cargoId, observacao);
  };

  const handleStatusChange = (cargoId: string, status: string) => {
    setMetadata((prev) => ({
      ...prev,
      [cargoId]: { ...prev[cargoId], status },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Criar payload com os valores exatos da coluna "Projetado Final"
      const cargosMap = new Map<string, LinhaAnaliseFinanceira>();
      analiseBase.forEach((l) => {
        if (!cargosMap.has(l.cargoId)) cargosMap.set(l.cargoId, l);
      });

      const cargos = Array.from(cargosMap.values()).map((l) => {
        const quantidadeAtual =
          unidade.cargos_unidade?.find((cu) => cu.cargo.id === l.cargoId)
            ?.quantidade_funcionarios || 0;
        const ajuste = ajustes[l.cargoId] || 0;
        // Projetado Final = Atual + Ajuste (exatamente o que está na tela)
        const projetadoFinal = Math.max(0, quantidadeAtual + ajuste);
        return { cargoId: l.cargoId, projetadoFinal };
      });

      const payload: any = {
        hospitalId: unidade.hospitalId,
        unidadeId: unidade.id,
        hospital_id: unidade.hospitalId,
        unidade_id: unidade.id,
        cargos: cargos.map((c) => ({
          ...c,
          cargo_id: c.cargoId,
          observacao: metadata[c.cargoId]?.observacao || "",
          status: metadata[c.cargoId]?.status || "nao_iniciado",
        })),
      };

      await saveProjetadoFinalInternacao(unidade.id, payload);

      // Verificar se algum cargo tem status de conclusão e travar o período
      const statusQueTravar = ["concluido_parcial", "concluido_final"];
      const temStatusConclusao = Object.values(metadata).some((meta) =>
        statusQueTravar.includes(meta.status || "")
      );

      if (temStatusConclusao && dataInicial && dataFinal) {
        setTravado(true);
        setHideCalculoFields(true);
        try {
          await saveControlePeriodo({
            unidadeId: unidade.id,
            travado: true,
            dataInicial,
            dataFinal,
          });
          showAlert(
            "success",
            "Sucesso",
            "Projetado final salvo e período travado automaticamente."
          );
        } catch (error) {
          console.error("Erro ao travar período:", error);
          showAlert(
            "success",
            "Sucesso",
            "Projetado final salvo, mas houve um erro ao travar o período."
          );
        }
      } else {
        // Se não há mais status de conclusão, destravar
        setTravado(false);
        setHideCalculoFields(false);
        if (dataInicial && dataFinal) {
          try {
            await saveControlePeriodo({
              unidadeId: unidade.id,
              travado: false,
              dataInicial,
              dataFinal,
            });
          } catch (error) {
            console.error("Erro ao destravar período:", error);
          }
        }
        showAlert("success", "Sucesso", "Projetado final salvo com sucesso.");
      }
    } catch (error) {
      showAlert(
        "destructive",
        "Erro",
        "Não foi possível salvar o projetado final."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAvaliar = () => {
    setShowAvaliarPage(true);
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  // Remover duplicatas por cargoId
  const cargosMap = new Map<string, LinhaAnaliseFinanceira>();
  analiseBase.forEach((linha) => {
    if (!cargosMap.has(linha.cargoId)) {
      cargosMap.set(linha.cargoId, linha);
    }
  });
  const linhasUnicas = Array.from(cargosMap.values());

  const isCargoSCPView = (nome: string): boolean => {
    const s = (nome || "").toLowerCase();
    const tecnicoPatterns = [
      "técnico em enfermagem",
      "tecnico em enfermagem",
      "técnico enfermagem",
      "tec enfermagem",
      "tec. enfermagem",
      "tec. em enfermagem",
      "técnico de enfermagem",
    ];
    const isTecnico = tecnicoPatterns.some((pat) => s.includes(pat));
    const isEnfermeiro = s.includes("enfermeiro");
    return isEnfermeiro || isTecnico;
  };

  // Separar cargos que têm projetado (Enfermeiro/Técnico) dos outros
  const cargosComProjetado = linhasUnicas.filter((linha) =>
    isCargoSCPView(linha.cargoNome)
  );

  const cargosAtuais = linhasUnicas.filter(
    (linha) => !isCargoSCPView(linha.cargoNome)
  );

  // DEBUG: Logs detalhados para analisar classificação e valores projetados
  try {
    const isBrowser = typeof window !== "undefined";
    if (isBrowser) {
      console.groupCollapsed(
        "[ProjetadoTab] Classificação de cargos e valores projetados"
      );
      linhasUnicas.forEach((l) => {
        const lower = (l.cargoNome || "").toLowerCase();
        const isScp = isCargoSCPView(l.cargoNome);
      });

      console.groupEnd();
    }
  } catch {}

  // Buscar quantidade atual da unidade para os cargos sem projetado
  const getQuantidadeAtual = (cargoId: string): number => {
    const cargoUnidade = unidade.cargos_unidade?.find(
      (cu) => cu.cargo.id === cargoId
    );
    return cargoUnidade?.quantidade_funcionarios || 0;
  };

  return (
    <>
      {showAvaliarPage ? (
        <EvaluationsTab
          onClose={() => setShowAvaliarPage(false)}
          unidadeInternacao={unidade}
        />
      ) : (
        <div className="space-y-6">
          <Card className="animate-fade-in-down">
            <CardHeader>
              <CardTitle>Cálculo por Data Específica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Data inicial
                    </label>
                    <input
                      type="date"
                      value={dataInicial}
                      onChange={(e) => setDataInicial(e.target.value)}
                      disabled={temStatusConclusao}
                      className="w-full p-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      Data final
                    </label>
                    <input
                      type="date"
                      value={dataFinal}
                      onChange={(e) => setDataFinal(e.target.value)}
                      disabled={temStatusConclusao}
                      className="w-full p-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
                {!temStatusConclusao && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleCalcular}
                      disabled={isCalculating}
                      className="w-full sm:w-auto px-5 py-2.5 h-11 bg-secondary text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {isCalculating ? "Calculando..." : "Calcular"}
                    </button>
                  </div>
                )}
              </div>

              {analise && (
                <div
                  className={`${
                    !temStatusConclusao ? "mt-6" : ""
                  } border rounded-lg p-4 bg-white flex flex-col`}
                >
                  <div className="flex flex-row border rounded-lg justify-around min-w-[200px]">
                    <TooltipProvider>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <div className="p-3 bg-white flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors">
                            <p className="text-lg font-bold">
                              Leitos Avaliados :
                            </p>
                            <p className="text-2xl font-bold tracking-tight text-primary">
                              {(() => {
                                const ag = analise?.agregados as any;
                                const v = ag?.percentualLeitosAvaliados;
                                if (v === undefined || v === null) return "-";
                                return `${Number(v).toFixed(1)}%`;
                              })()}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="p-0 border-0 shadow-lg"
                        >
                          <div className="w-[400px] bg-white rounded-lg shadow-xl">
                            <PieChartComp
                              title="Níveis de Cuidado"
                              data={(() => {
                                const dist =
                                  analise?.agregados
                                    ?.distribuicaoTotalClassificacao || {};
                                const entries = Object.entries(
                                  dist as Record<string, number>
                                );
                                const normalize = (k: string) =>
                                  k
                                    .toLowerCase()
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (c) => c.toUpperCase());
                                return entries.map(([name, value]) => ({
                                  name: normalize(name),
                                  value: Number(value || 0),
                                }));
                              })()}
                              labelType="percent"
                              height={300}
                              innerRadius={45}
                              outerRadius={70}
                              className="border-0 shadow-none p-0"
                              totalForPercent={(() => {
                                const dist =
                                  analise?.agregados
                                    ?.distribuicaoTotalClassificacao || {};
                                return Object.values(
                                  dist as Record<string, number>
                                ).reduce((sum, val) => sum + (val || 0), 0);
                              })()}
                            />
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="p-3 bg-white flex items-center gap-2">
                      <p className="text-lg font-bold">
                        Taxa Média de Ocupação :
                      </p>
                      <p className="text-2xl font-bold tracking-tight text-primary">
                        {(() => {
                          const ag = analise?.agregados as any;
                          const v = ag?.taxaOcupacaoPeriodoPercent;
                          if (v === undefined || v === null) return "-";
                          return `${Number(v).toFixed(1)}%`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="animate-fade-in-down">
            <CardHeader>
              <CardTitle>Ajuste Qualitativo do Quadro Projetado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="h-20">
                      <TableHead className="w-[30%]">Função</TableHead>

                      <TableHead className="text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center">
                            <BarChart3 className="h-7 w-7 text-gray-700" />
                            <span className="ml-2 text-sm font-medium">
                              Atual
                            </span>
                          </div>
                        </div>
                      </TableHead>

                      <TableHead className="text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center">
                            <img
                              src={brainIcon}
                              alt="Projetado (Sistema)"
                              className="h-10 w-10 object-contain mb-1"
                            />
                            <span className="text-sm font-medium">
                              Projetado (Sistema)
                            </span>
                          </div>
                        </div>
                      </TableHead>

                      <TableHead className="text-center w-[200px]">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center">
                            <Settings className="h-7 w-7 text-gray-700" />
                            <span className="ml-2 text-sm font-medium">
                              Ajuste Qualitativo
                            </span>
                          </div>
                        </div>
                      </TableHead>

                      <TableHead className="text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center">
                            <Target className="h-7 w-7 text-gray-700" />
                            <span className="ml-2 text-sm font-medium">
                              Projetado Final
                            </span>
                          </div>
                        </div>
                      </TableHead>

                      <TableHead className="text-center w-[120px]">
                        Observação
                      </TableHead>

                      <TableHead className="text-center w-[200px]">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {/* Cargos com Projetado (Enfermeiro/Técnico) */}
                    {cargosComProjetado.map((linha) => {
                      const quantidadeAtual = getQuantidadeAtual(linha.cargoId);
                      const ajusteAtual = ajustes[linha.cargoId] || 0;
                      // Usa quantidadeAtual como base para o ajuste qualitativo
                      const projetadoFinal = quantidadeAtual + ajusteAtual;
                      return (
                        <TableRow key={linha.cargoId}>
                          <TableCell className="font-medium">
                            {linha.cargoNome}
                          </TableCell>
                          <TableCell className="text-center font-medium text-gray-500">
                            {quantidadeAtual}
                          </TableCell>
                          <TableCell className="text-center font-medium text-gray-600">
                            {linha.quantidadeProjetada}
                          </TableCell>
                          <TableCell>
                            <AjusteInput
                              value={ajusteAtual}
                              onChange={(novoValor) =>
                                handleAjusteChange(linha.cargoId, novoValor)
                              }
                              disabled={
                                metadata[linha.cargoId]?.status ===
                                  "concluido_parcial" ||
                                metadata[linha.cargoId]?.status ===
                                  "concluido_final"
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center font-bold text-xl text-primary">
                            {projetadoFinal}
                          </TableCell>
                          <TableCell className="text-center">
                            <ObservacaoButton
                              hasObservacao={
                                !!metadata[linha.cargoId]?.observacao
                              }
                              onClick={() =>
                                handleOpenObservacaoModal(
                                  linha.cargoId,
                                  linha.cargoNome
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={
                                metadata[linha.cargoId]?.status ||
                                "nao_iniciado"
                              }
                              onValueChange={(value) =>
                                handleStatusChange(linha.cargoId, value)
                              }
                            >
                              <SelectTrigger className="text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-xs"
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Outros Cargos (sem projetado - usa Atual) */}
                    {cargosAtuais.map((linha) => {
                      const quantidadeAtual = getQuantidadeAtual(linha.cargoId);
                      const ajusteAtual = ajustes[linha.cargoId] || 0;
                      const projetadoFinal = quantidadeAtual + ajusteAtual;
                      return (
                        <TableRow key={linha.cargoId}>
                          <TableCell className="font-medium">
                            {linha.cargoNome}
                          </TableCell>
                          <TableCell className="text-center font-medium text-gray-600">
                            {quantidadeAtual}
                          </TableCell>
                          <TableCell className="text-center font-medium text-gray-400">
                            -
                          </TableCell>
                          <TableCell>
                            <AjusteInput
                              value={ajusteAtual}
                              onChange={(novoValor) =>
                                handleAjusteChange(linha.cargoId, novoValor)
                              }
                              disabled={
                                metadata[linha.cargoId]?.status ===
                                  "concluido_parcial" ||
                                metadata[linha.cargoId]?.status ===
                                  "concluido_final"
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center font-bold text-xl text-primary">
                            {projetadoFinal}
                          </TableCell>
                          <TableCell className="text-center">
                            <ObservacaoButton
                              hasObservacao={
                                !!metadata[linha.cargoId]?.observacao
                              }
                              onClick={() =>
                                handleOpenObservacaoModal(
                                  linha.cargoId,
                                  linha.cargoNome
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={
                                metadata[linha.cargoId]?.status ||
                                "nao_iniciado"
                              }
                              onValueChange={(value) =>
                                handleStatusChange(linha.cargoId, value)
                              }
                            >
                              <SelectTrigger className="text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-xs"
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {linhasUnicas.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground h-24"
                        >
                          Nenhum cargo encontrado para dimensionamento.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end mt-6 gap-3">
                <Button onClick={handleOpenAvaliar} disabled={saving}>
                  {"Avaliação"}
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Ajustes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <ObservacaoModal
        isOpen={modalObservacao.isOpen}
        onClose={() =>
          setModalObservacao({ isOpen: false, cargoId: "", cargoNome: "" })
        }
        onSave={handleSaveObservacao}
        initialValue={metadata[modalObservacao.cargoId]?.observacao || ""}
        cargoNome={modalObservacao.cargoNome}
      />
    </>
  );
}
