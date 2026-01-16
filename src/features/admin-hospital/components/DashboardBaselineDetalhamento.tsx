import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  Legend,
  ComposedChart,
  Line,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, TrendingUp, TrendingDown } from "lucide-react";
import { WaterfallDataItem } from "./DashboardBaselineScreen";
import {
  getHospitalOccupationDashboard,
  type OccupationDashboardResponse,
} from "@/lib/api";
type RankingTooltipKind = "currency" | "people";
interface DashboardBaselineDetalhamentoProps {
  snapshotData: any;
  hospitalId?: string;
  selectedSector: string;
  setSelectedSector: (value: string) => void;
  setoresDisponiveis: Array<{ id: string; name: string }>;
  hideSectorSelector?: boolean;
  // Dados do Baseline (snapshot)
  profissionaisBaseline: number;
  custoBaseline: number;
  // Dados Projetados
  profissionaisProjetados: number;
  custoProjetado: number;
  // Dados Situação Atual Real (agora)
  profissionaisAtuaisReal: number;
  custoAtualReal: number;
  // Variações Baseline -> Projetado
  variacaoCustoPercentual: number;
  variacaoProfissionaisPercentual: number;
  variacaoCusto: number;
  variacaoProfissionais: number;
  waterfallQuantidadeData: WaterfallDataItem[];
  waterfallQuantidadeDataCompleto: WaterfallDataItem[];
  axisTick: any;
  ReusableWaterfall: React.FC<{
    data: WaterfallDataItem[];
    unit: "currency" | "people";
  }>;
}
export const DashboardBaselineDetalhamento: React.FC<
  DashboardBaselineDetalhamentoProps
> = ({
  snapshotData,
  hospitalId,
  selectedSector,
  setSelectedSector,
  setoresDisponiveis,
  hideSectorSelector,
  profissionaisBaseline,
  custoBaseline,
  profissionaisProjetados,
  custoProjetado,
  profissionaisAtuaisReal,
  custoAtualReal,
  variacaoCustoPercentual,
  variacaoProfissionaisPercentual,
  variacaoCusto,
  variacaoProfissionais,
  waterfallQuantidadeData,
  waterfallQuantidadeDataCompleto,
  axisTick,
  ReusableWaterfall,
}) => {
  const waterfallYAxisDomain = [
    (dataMin: number) => (dataMin < 0 ? dataMin * 1.4 : 0),
    (dataMax: number) => (dataMax > 0 ? dataMax * 1.4 : 0),
  ] as [(dataMin: number) => number, (dataMax: number) => number];

  // Custom tick com quebra de linha automática
  const CustomAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const maxWidth = 100; // largura máxima em pixels
    const words = String(payload.value).split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      // Aproximação: 6 pixels por caractere
      if (testLine.length * 6 > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) lines.push(currentLine);

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={8} textAnchor="middle" fill="#666" fontSize={11}>
          {lines.map((line, index) => (
            <tspan x={0} dy={12} key={index}>
              {line}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

  // State para dados de ocupação
  const [occupationData, setOccupationData] =
    useState<OccupationDashboardResponse | null>(null);
  const [loadingOccupation, setLoadingOccupation] = useState(true);
  const [analysisTab, setAnalysisTab] = useState<"custo" | "pessoal">("custo");
  const formatCurrency = (value: number) =>
    `R$ ${Number(value || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const formatCurrencyAxisTick = (value: unknown) => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}k`;
    return `R$ ${n.toFixed(0)}`;
  };
  const formatPctPtBr = (value: number) =>
    `${Number(value || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
  const toNumber = (value: unknown, fallback = 0) => {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const RankingTooltipContent: React.FC<
    {
      kind: RankingTooltipKind;
    } & {
      active?: boolean;
      payload?: any[];
    }
  > = ({ kind, active, payload }) => {
    if (!active || !Array.isArray(payload) || payload.length === 0) return null;
    const entry = payload?.[0]?.payload as any;
    if (!entry) return null;
    const nome = String(entry.nome ?? "-");
    const delta =
      kind === "currency"
        ? toNumber(entry.variacaoReais, 0)
        : toNumber(entry.variacaoQtd, 0);
    const pct = toNumber(entry.variacaoPercentual, 0);
    const deltaLabel =
      kind === "currency"
        ? formatCurrency(delta)
        : `${Math.round(delta).toLocaleString("pt-BR")}`;
    return (
      <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
        <div className="text-sm font-medium text-foreground">{nome}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Percentual:{" "}
          <span className="text-foreground">{formatPctPtBr(pct)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {kind === "currency" ? "Monetário" : "Quantidade"}:{" "}
          <span className="text-foreground">{deltaLabel}</span>
        </div>
      </div>
    );
  };
  // Buscar dados de ocupação
  useEffect(() => {
    const fetchOccupationData = async () => {
      if (!hospitalId) {
        return;
      }
      try {
        setLoadingOccupation(true);
        const data = await getHospitalOccupationDashboard(hospitalId);
        setOccupationData(data);
      } catch (error) {
        console.error("❌ [Occupation Dashboard] Erro ao carregar:", error);
      } finally {
        setLoadingOccupation(false);
      }
    };
    fetchOccupationData();
  }, [hospitalId]);
  // Calcular rankingSetores para Gráfico 1
  const setoresVariacao: Array<{
    nome: string;
    variacaoPercentual: number;
  }> = [];
  // Função auxiliar para calcular custo
  const calcularCustoSetor = (
    custos: Record<string, number>,
    quantidades: Record<string, number>
  ) => {
    let total = 0;
    Object.keys(custos).forEach((cargoId) => {
      const custoUnitario = custos[cargoId] || 0;
      const quantidade = quantidades[cargoId] || 0;
      total += custoUnitario * quantidade;
    });
    return total;
  };
  // Processar internação
  snapshotData.snapshot.dados.projetadoFinal?.internacao?.forEach(
    (unidade: any) => {
      // Buscar situação atual da unidade
      const unidadeAtual = snapshotData.situacaoAtual?.unidades.find(
        (u: any) => u.unidadeId === unidade.unidadeId
      );
      if (unidadeAtual) {
        // Calcular quantidade atual de profissionais
        const qtdAtualUnidade = unidadeAtual.totalFuncionarios;
        // Calcular quantidade projetada
        let qtdProjetadaUnidade = 0;
        unidade.cargos.forEach((cargo: any) => {
          qtdProjetadaUnidade += cargo.projetadoFinal;
        });
        const variacaoPerc =
          qtdAtualUnidade > 0
            ? ((qtdProjetadaUnidade - qtdAtualUnidade) / qtdAtualUnidade) * 100
            : 0;
        setoresVariacao.push({
          nome: unidade.unidadeNome,
          variacaoPercentual: variacaoPerc,
        });
      }
    }
  );
  // Processar não-internação
  snapshotData.snapshot.dados.projetadoFinal?.naoInternacao?.forEach(
    (unidade: any) => {
      // Buscar situação atual da unidade
      const unidadeAtual = snapshotData.situacaoAtual?.unidades.find(
        (u: any) => u.unidadeId === unidade.unidadeId
      );
      if (unidadeAtual) {
        // Calcular quantidade atual de profissionais
        const qtdAtualUnidade = unidadeAtual.totalFuncionarios;
        // Calcular quantidade projetada (somando todos os sítios)
        let qtdProjetadaUnidade = 0;
        unidade.sitios.forEach((sitio: any) => {
          sitio.cargos.forEach((cargo: any) => {
            qtdProjetadaUnidade += cargo.projetadoFinal;
          });
        });
        const variacaoPerc =
          qtdAtualUnidade > 0
            ? ((qtdProjetadaUnidade - qtdAtualUnidade) / qtdAtualUnidade) * 100
            : 0;
        setoresVariacao.push({
          nome: unidade.unidadeNome,
          variacaoPercentual: variacaoPerc,
        });
      }
    }
  );
  const rankingSetores = setoresVariacao.sort(
    (a, b) => b.variacaoPercentual - a.variacaoPercentual
  );
  return (
    <TabsContent value="detalhamento" className="space-y-6">
      {/* Cards de informação do Detalhamento */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {analysisTab === "pessoal" ? (
          <>
            <Card className="shadow-[0_4px_12px_rgba(0,93,151,0.3)] border-l-4 border-[#005D97]">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground break-words">
                      Variação (%)
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xl font-bold text-foreground">
                        {variacaoProfissionaisPercentual >= 0 ? "↑" : "↓"}
                      </span>
                      <h3 className="font-bold leading-tight tabular-nums break-words text-[clamp(1.05rem,1.8vw,1.5rem)] text-foreground">
                        {Math.abs(variacaoProfissionaisPercentual).toFixed(1)}%
                      </h3>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-[0_4px_12px_rgba(0,112,185,0.3)] border-l-4 border-[#0070B9]">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground break-words">
                      Variação (Qtd)
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xl font-bold text-foreground">
                        {variacaoProfissionais >= 0 ? "↑" : "↓"}
                      </span>
                      <h3 className="font-bold leading-tight tabular-nums break-words text-[clamp(1.05rem,1.8vw,1.5rem)] text-foreground">
                        {Math.abs(variacaoProfissionais)}
                      </h3>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-[0_4px_12px_rgba(38,140,204,0.3)] border-l-4 border-[#268CCC]">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground break-words">
                      Total de Funcionários
                    </p>
                    <h3 className="mt-2 font-bold leading-tight tabular-nums break-words text-[clamp(1.05rem,1.8vw,1.5rem)]">
                      {profissionaisAtuaisReal}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-[0_4px_12px_rgba(0,93,151,0.3)] border-l-4 border-[#005D97]">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground break-words">
                      Total de Funcionários Projetado
                    </p>
                    <h3 className="mt-2 font-bold leading-tight tabular-nums break-words text-[clamp(1.05rem,1.8vw,1.5rem)]">
                      {profissionaisProjetados}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="shadow-[0_4px_12px_rgba(0,93,151,0.3)] border-l-4 border-[#005D97]">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground break-words">
                      Variação monetária (%)
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xl font-bold text-foreground">
                        {variacaoCustoPercentual >= 0 ? "↑" : "↓"}
                      </span>
                      <h3 className="font-bold leading-tight tabular-nums break-words text-[clamp(1.05rem,1.8vw,1.5rem)] text-foreground">
                        {Math.abs(variacaoCustoPercentual).toFixed(1)}%
                      </h3>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-[0_4px_12px_rgba(0,112,185,0.3)] border-l-4 border-[#0070B9]">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground break-words">
                      Variação monetária (R$)
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-2xl font-bold text-foreground">
                        {variacaoCusto >= 0 ? "↑" : "↓"}
                      </span>
                      <h3 className="font-bold leading-tight tabular-nums break-words text-[clamp(1.05rem,1.8vw,1.5rem)] text-foreground">
                        {formatCurrency(Math.abs(variacaoCusto))}
                      </h3>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-[0_4px_12px_rgba(38,140,204,0.3)] border-l-4 border-[#268CCC]">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground break-words">
                      Custo Total Atual
                    </p>
                    <h3 className="mt-2 font-bold leading-tight tabular-nums break-words text-[clamp(1.05rem,1.8vw,1.5rem)]">
                      {formatCurrency(custoAtualReal)}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-[0_4px_12px_rgba(0,93,151,0.3)] border-l-4 border-[#005D97]">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground break-words">
                      Custo Total Projetado
                    </p>
                    <h3 className="mt-2 font-bold leading-tight tabular-nums break-words text-[clamp(1.05rem,1.8vw,1.5rem)]">
                      {formatCurrency(custoProjetado)}
                    </h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
        <Card className="shadow-[0_4px_12px_rgba(0,112,185,0.3)] border-l-4 border-[#0070B9]">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground break-words">
                  Baseline: {snapshotData.snapshot.observacao || "Snapshot"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground leading-snug break-words">
                  Criado em:{" "}
                  {snapshotData.snapshot.dataHora
                    ? new Date(snapshotData.snapshot.dataHora).toLocaleString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Seletor de Setor (apenas no dashboard hospitalar) */}
      {!hideSectorSelector ? (
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filtrar por setor:</label>
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Selecione um setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {setoresDisponiveis.map((setor) => (
                <SelectItem key={setor.id} value={setor.id}>
                  {setor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      {/* Tabs de Análise */}
      <Tabs
        value={analysisTab}
        onValueChange={(value) => setAnalysisTab(value as "custo" | "pessoal")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="custo">Análise de Custo</TabsTrigger>
          <TabsTrigger value="pessoal">Análise de Pessoal</TabsTrigger>
        </TabsList>
        {/* Análise de Custo */}
        <TabsContent value="custo" className="space-y-4 mt-4">
          {/* Primeira linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Ranking da Variação dos Setores (%)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                {(() => {
                  if (!rankingSetores || rankingSetores.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                        Dados insuficientes para análise.
                      </div>
                    );
                  }
                  // Enriquecer com variação em reais
                  const rankingComReais = rankingSetores.map((setor) => {
                    const unidadeProjetada =
                      snapshotData.snapshot.dados.projetadoFinal?.internacao?.find(
                        (u: any) => u.unidadeNome === setor.nome
                      ) ||
                      snapshotData.snapshot.dados.projetadoFinal?.naoInternacao?.find(
                        (u: any) => u.unidadeNome === setor.nome
                      );
                    const unidadeBaseline =
                      snapshotData.snapshot.dados.internation?.find(
                        (u: any) => u.name === setor.nome
                      ) ||
                      snapshotData.snapshot.dados.assistance?.find(
                        (u: any) => u.name === setor.nome
                      );
                    let custoAtual = 0;
                    let custoProjetado = 0;
                    if (unidadeBaseline) {
                      unidadeBaseline.staff?.forEach((s: any) => {
                        custoAtual += (s.quantity || 0) * (s.unitCost || 0);
                      });
                    }
                    if (unidadeProjetada) {
                      const custoPorCargo = new Map<string, number>();
                      if (unidadeBaseline) {
                        unidadeBaseline.staff?.forEach((s: any) => {
                          custoPorCargo.set(s.id, s.unitCost || 0);
                        });
                      }
                      if ("cargos" in unidadeProjetada) {
                        unidadeProjetada.cargos.forEach((cargo: any) => {
                          const custoUnit =
                            custoPorCargo.get(cargo.cargoId) || 0;
                          custoProjetado += cargo.projetadoFinal * custoUnit;
                        });
                      } else if ("sitios" in unidadeProjetada) {
                        unidadeProjetada.sitios.forEach((sitio: any) => {
                          sitio.cargos.forEach((cargo: any) => {
                            const custoUnit =
                              custoPorCargo.get(cargo.cargoId) || 0;
                            custoProjetado += cargo.projetadoFinal * custoUnit;
                          });
                        });
                      }
                    }
                    return {
                      nome: setor.nome,
                      variacaoPercentual: setor.variacaoPercentual,
                      variacaoReais: custoProjetado - custoAtual,
                    };
                  });
                  const computedHeight = Math.min(
                    560,
                    Math.max(380, rankingComReais.length * 44)
                  );
                  const maxLabelLen = Math.max(
                    0,
                    ...rankingComReais.map((d) =>
                      d?.nome ? String(d.nome).length : 0
                    )
                  );
                  const yAxisWidth = Math.min(
                    200,
                    Math.max(90, Math.ceil(maxLabelLen * 7.2))
                  );
                  return (
                    <div style={{ height: computedHeight }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={rankingComReais}
                          layout="vertical"
                          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            tick={axisTick}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <YAxis
                            type="category"
                            dataKey="nome"
                            width={yAxisWidth}
                            tick={axisTick}
                          />
                          <Tooltip
                            content={<RankingTooltipContent kind="currency" />}
                          />
                          <Bar dataKey="variacaoPercentual" barSize={18}>
                            {rankingComReais.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.variacaoPercentual < 0
                                    ? "rgb(220,38,38)"
                                    : "rgb(22,163,74)"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            {/* Gráfico 2: Variação Custo Total */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Variação Custo Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={(() => {
                      // Processar dados do waterfall manualmente (em valores R$)
                      let cumulative = 0;
                      const processedData = waterfallQuantidadeData.map(
                        (item, index) => {
                          const isStart = index === 0;
                          const isEnd =
                            index === waterfallQuantidadeData.length - 1;
                          const isTransition = !isStart && !isEnd;
                          let color = "#003151";
                          let range: [number, number];
                          // Calcular custo correspondente baseado na quantidade
                          const custoMedioPorPessoa =
                            custoAtualReal / profissionaisAtuaisReal;
                          let custoReais = 0;
                          if (isStart) {
                            // Atual
                            custoReais = custoAtualReal;
                            range = [0, custoReais];
                            cumulative = custoReais;
                          } else if (isTransition) {
                            // Variação (pode ser positiva ou negativa)
                            custoReais = item.value * custoMedioPorPessoa;
                            const startValue = cumulative;
                            cumulative += custoReais;
                            range = [startValue, cumulative];
                            color =
                              custoReais < 0
                                ? "hsl(var(--destructive))"
                                : "#0b6f88";
                          } else {
                            // Projetado
                            custoReais = custoProjetado;
                            range = [0, custoReais];
                            color = "#003151";
                          }
                          return {
                            name: item.name,
                            value: custoReais,
                            range: range,
                            color: color,
                            qtdPessoas: item.value,
                          };
                        }
                      );
                      return processedData;
                    })()}
                    margin={{ top: 8, right: 20, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={<CustomAxisTick />}
                      interval="preserveStartEnd"
                      height={80}
                    />
                    <YAxis
                      tick={axisTick}
                      tickFormatter={formatCurrencyAxisTick}
                      domain={waterfallYAxisDomain}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const isTotal =
                            label === "Atual" || label === "Projetado";
                          const custoReais = data.value;
                          const qtd = data.qtdPessoas;
                          return (
                            <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                              <p className="font-bold text-foreground mb-1">
                                {label}
                              </p>
                              <p className="text-muted-foreground">
                                Custo: R${" "}
                                {custoReais.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                              <p className="text-muted-foreground">
                                {isTotal
                                  ? `Total: ${qtd} ${
                                      qtd === 1 ? "funcionário" : "funcionários"
                                    }`
                                  : `Variação: ${qtd >= 0 ? "+" : ""}${qtd} ${
                                      Math.abs(qtd) === 1
                                        ? "funcionário"
                                        : "funcionários"
                                    }`}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="range">
                      {waterfallQuantidadeData.map((_, index) => {
                        const isStart = index === 0;
                        const isEnd =
                          index === waterfallQuantidadeData.length - 1;
                        const isTransition = !isStart && !isEnd;
                        let color = "#003151";
                        if (isTransition) {
                          // Calcular se a variação é positiva ou negativa
                          const custoMedioPorPessoa =
                            custoAtualReal / profissionaisAtuaisReal;
                          const variacaoCusto =
                            waterfallQuantidadeData[index].value *
                            custoMedioPorPessoa;
                          color =
                            variacaoCusto < 0
                              ? "hsl(var(--destructive))"
                              : "#0b6f88";
                        }
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Gráfico 3: Taxa de Ocupação Atual Vs Dimensionada (%) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Taxa de Ocupação (4 últimos meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOccupation ? (
                  <div className="h-[350px] flex items-center justify-center">
                    <p className="text-muted-foreground">Carregando dados...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart
                      data={(() => {
                        if (!occupationData) return [];
                        // Determinar qual conjunto de dados usar baseado no filtro
                        let dataSource;
                        if (selectedSector === "all") {
                          // Usar dados consolidados (summary)
                          dataSource = {
                            historico4Meses:
                              occupationData.summary.historico4Meses,
                            ocupacaoMaximaAtendivel:
                              occupationData.summary.ocupacaoMaximaAtendivel,
                          };
                        } else {
                          // Buscar setor específico
                          const sector = occupationData.sectors.find(
                            (s) => s.sectorId === selectedSector
                          );
                          if (!sector) return [];
                          dataSource = {
                            historico4Meses: sector.historico4Meses,
                            ocupacaoMaximaAtendivel:
                              sector.ocupacaoMaximaAtendivel,
                          };
                        }
                        // Formatar dados para o gráfico
                        return dataSource.historico4Meses.map((mes) => {
                          // Extrair mês/ano do monthLabel (ex: "Setembro/2025" -> "SET")
                          const mesNome = mes.monthLabel
                            .split("/")[0]
                            .substring(0, 3)
                            .toUpperCase();
                          return {
                            mes: mesNome,
                            taxaOcupacao: mes.taxaOcupacao,
                            taxaAtendivel: dataSource.ocupacaoMaximaAtendivel,
                          };
                        });
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          const label =
                            name === "taxaOcupacao"
                              ? "Taxa de Ocupação"
                              : "Taxa Máxima Atendível";
                          return [`${Number(value).toFixed(1)}%`, label];
                        }}
                      />
                      <Legend
                        formatter={(value: string) => {
                          if (value === "taxaOcupacao")
                            return "Taxa de Ocupação";
                          if (value === "taxaAtendivel")
                            return "Taxa Máxima Atendível";
                          return value;
                        }}
                      />
                      <Bar
                        dataKey="taxaOcupacao"
                        fill="#5CA6DD"
                        name="taxaOcupacao"
                      />
                      <Line
                        type="monotone"
                        dataKey="taxaAtendivel"
                        stroke="#FF6B6B"
                        strokeWidth={2}
                        dot={false}
                        name="taxaAtendivel"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Título - Análise de Custo - Detalhamento */}
          <div className="flex items-center gap-3 pt-6 pb-2">
            <div className="bg-[#005D97] p-2 rounded">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold">
              Análise de Custo - Detalhamento
            </h3>
          </div>
          {/* Segunda linha de gráficos - Análise das Variações */}
          <div className="grid grid-cols-1 gap-4">
            {/* Gráfico 4: Variação R$ - Detalhamento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Variação R$ - Detalhamento
                  <div className="text-xs font-normal text-gray-500">
                    Análise comparativa: Atual → Baseline → Projetado
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart
                    data={(() => {
                      // Construir waterfall (Atual → Baseline → Projetado) e garantir
                      // que as variações fechem exatamente com as barras totais.
                      const baselineDate = snapshotData.snapshot.dataHora
                        ? new Date(snapshotData.snapshot.dataHora)
                            .toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })
                            .replace(/\//g, ".")
                        : "";

                      const deltaAtualParaBaseline =
                        custoBaseline - custoAtualReal;
                      const deltaBaselineParaProjetado =
                        custoProjetado - custoBaseline;

                      return [
                        {
                          name: "Atual",
                          value: custoAtualReal,
                          range: [0, custoAtualReal],
                          color: "#5CA6DD",
                          qtdPessoas: profissionaisAtuaisReal,
                        },
                        {
                          name: "Variação",
                          value: deltaAtualParaBaseline,
                          range:
                            deltaAtualParaBaseline >= 0
                              ? [custoAtualReal, custoBaseline]
                              : [custoBaseline, custoAtualReal],
                          color:
                            deltaAtualParaBaseline >= 0 ? "#10B981" : "#EF4444",
                          qtdPessoas:
                            profissionaisBaseline - profissionaisAtuaisReal,
                        },
                        {
                          name: `Baseline\n(${baselineDate})`,
                          value: custoBaseline,
                          range: [0, custoBaseline],
                          color: "#93C5FD",
                          qtdPessoas: profissionaisBaseline,
                        },
                        {
                          name: "Variação",
                          value: deltaBaselineParaProjetado,
                          range:
                            deltaBaselineParaProjetado >= 0
                              ? [custoBaseline, custoProjetado]
                              : [custoProjetado, custoBaseline],
                          color:
                            deltaBaselineParaProjetado >= 0
                              ? "#10B981"
                              : "#EF4444",
                          qtdPessoas:
                            profissionaisProjetados - profissionaisBaseline,
                        },
                        {
                          name: "Projetado",
                          value: custoProjetado,
                          range: [0, custoProjetado],
                          color: "#003151",
                          qtdPessoas: profissionaisProjetados,
                        },
                      ];
                    })()}
                    margin={{ top: 8, right: 20, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={<CustomAxisTick />}
                      interval="preserveStartEnd"
                      height={80}
                    />
                    <YAxis
                      tick={axisTick}
                      tickFormatter={formatCurrencyAxisTick}
                      domain={waterfallYAxisDomain}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const custoReais = data.value;
                          const qtd = data.qtdPessoas;
                          // Determinar se é total ou variação
                          const isTotal =
                            label === "Atual" ||
                            label.includes("Baseline") ||
                            label === "Projetado";
                          return (
                            <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                              <p className="font-bold text-foreground mb-1">
                                {label}
                              </p>
                              <p className="text-muted-foreground">
                                Custo: R${" "}
                                {custoReais.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                              <p className="text-muted-foreground">
                                {isTotal
                                  ? `Total: ${qtd} ${
                                      Math.abs(qtd) === 1
                                        ? "funcionário"
                                        : "funcionários"
                                    }`
                                  : `Variação: ${qtd >= 0 ? "+" : ""}${qtd} ${
                                      Math.abs(qtd) === 1
                                        ? "funcionário"
                                        : "funcionários"
                                    }`}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="range">
                      {(() => {
                        const deltaAtualParaBaseline =
                          custoBaseline - custoAtualReal;
                        const deltaBaselineParaProjetado =
                          custoProjetado - custoBaseline;
                        const cells = [
                          { color: "#5CA6DD" }, // Atual
                          {
                            color:
                              deltaAtualParaBaseline >= 0
                                ? "#10B981"
                                : "#EF4444",
                          }, // Variação (Atual -> Baseline)
                          { color: "#93C5FD" }, // Baseline
                          {
                            color:
                              deltaBaselineParaProjetado >= 0
                                ? "#10B981"
                                : "#EF4444",
                          }, // Variação (Baseline -> Projetado)
                          { color: "#003151" }, // Projetado
                        ];
                        return cells.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ));
                      })()}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Gráfico 5: Variação R$ - Análise por cargo/função */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Variação R$ - Detalhamento
                  <div className="text-xs font-normal text-gray-500">
                    Análise por cargo/função
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart
                    data={(() => {
                      // Construir dados de waterfall calculando custos reais em R$, não quantidade
                      const waterfallData: any[] = [];
                      // Mapa para guardar custo unitário de cada cargo (do Baseline)
                      const custoUnitarioPorCargo = new Map<string, number>();
                      // Extrair custos unitários do Baseline
                      snapshotData.snapshot.dados.internation?.forEach(
                        (unidade: any) => {
                          unidade.staff?.forEach((staff: any) => {
                            if (staff.id && staff.unitCost) {
                              custoUnitarioPorCargo.set(
                                staff.id,
                                staff.unitCost
                              );
                            }
                          });
                        }
                      );
                      snapshotData.snapshot.dados.assistance?.forEach(
                        (unidade: any) => {
                          unidade.staff?.forEach((staff: any) => {
                            if (staff.id && staff.unitCost) {
                              custoUnitarioPorCargo.set(
                                staff.id,
                                staff.unitCost
                              );
                            }
                          });
                        }
                      );
                      // Calcular variações em R$ por cargo
                      const cargoVariacoes = new Map<
                        string,
                        {
                          nome: string;
                          custoVariacao: number;
                          qtdVariacao: number;
                        }
                      >();
                      // Processar Internação
                      snapshotData.snapshot.dados.projetadoFinal?.internacao?.forEach(
                        (unidade) => {
                          if (
                            selectedSector !== "all" &&
                            unidade.unidadeId !== selectedSector
                          )
                            return;
                          unidade.cargos.forEach((cargo) => {
                            // Custo unitário do cargo
                            const custoUnit =
                              custoUnitarioPorCargo.get(cargo.cargoId) || 0;
                            // Quantidade baseline
                            let baselineQtd = 0;
                            const unidadeBaseline =
                              snapshotData.snapshot.dados.internation?.find(
                                (u: any) => u.id === unidade.unidadeId
                              );
                            if (unidadeBaseline) {
                              const staffBaseline = unidadeBaseline.staff?.find(
                                (s: any) => s.id === cargo.cargoId
                              );
                              baselineQtd = staffBaseline?.quantity || 0;
                            }
                            // Quantidade projetada
                            const projetadoQtd = cargo.projetadoFinal;
                            // Variação em quantidade
                            const qtdVariacao = projetadoQtd - baselineQtd;
                            // Variação em custo (R$)
                            const custoVariacao = qtdVariacao * custoUnit;
                            if (qtdVariacao === 0) return;
                            const existing = cargoVariacoes.get(cargo.cargoId);
                            if (existing) {
                              existing.custoVariacao += custoVariacao;
                              existing.qtdVariacao += qtdVariacao;
                            } else {
                              let cargoNome = cargo.cargoId;
                              if (snapshotData.situacaoAtual) {
                                snapshotData.situacaoAtual.unidades.forEach(
                                  (u) => {
                                    const c = u.cargos.find(
                                      (c) => c.cargoId === cargo.cargoId
                                    );
                                    if (c) cargoNome = c.cargoNome;
                                  }
                                );
                              }
                              cargoVariacoes.set(cargo.cargoId, {
                                nome: cargoNome,
                                custoVariacao,
                                qtdVariacao,
                              });
                            }
                          });
                        }
                      );
                      // Processar Não-Internação
                      snapshotData.snapshot.dados.projetadoFinal?.naoInternacao?.forEach(
                        (unidade) => {
                          if (
                            selectedSector !== "all" &&
                            unidade.unidadeId !== selectedSector
                          )
                            return;
                          // Consolidar cargos projetados por sítio
                          const cargosProjetadosConsolidados = new Map<
                            string,
                            number
                          >();
                          unidade.sitios.forEach((sitio) => {
                            sitio.cargos.forEach((cargo) => {
                              const qtdAtual =
                                cargosProjetadosConsolidados.get(
                                  cargo.cargoId
                                ) || 0;
                              cargosProjetadosConsolidados.set(
                                cargo.cargoId,
                                qtdAtual + cargo.projetadoFinal
                              );
                            });
                          });
                          // Calcular variações
                          cargosProjetadosConsolidados.forEach(
                            (projetadoTotal, cargoId) => {
                              const custoUnit =
                                custoUnitarioPorCargo.get(cargoId) || 0;
                              let baselineQtd = 0;
                              const unidadeBaseline =
                                snapshotData.snapshot.dados.assistance?.find(
                                  (u: any) => u.id === unidade.unidadeId
                                );
                              if (unidadeBaseline) {
                                const staffBaseline =
                                  unidadeBaseline.staff?.find(
                                    (s: any) => s.id === cargoId
                                  );
                                baselineQtd = staffBaseline?.quantity || 0;
                              }
                              const qtdVariacao = projetadoTotal - baselineQtd;
                              const custoVariacao = qtdVariacao * custoUnit;
                              if (qtdVariacao === 0) return;
                              const existing = cargoVariacoes.get(cargoId);
                              if (existing) {
                                existing.custoVariacao += custoVariacao;
                                existing.qtdVariacao += qtdVariacao;
                              } else {
                                let cargoNome = cargoId;
                                if (snapshotData.situacaoAtual) {
                                  snapshotData.situacaoAtual.unidades.forEach(
                                    (u) => {
                                      const c = u.cargos.find(
                                        (c) => c.cargoId === cargoId
                                      );
                                      if (c) cargoNome = c.cargoNome;
                                    }
                                  );
                                }
                                cargoVariacoes.set(cargoId, {
                                  nome: cargoNome,
                                  custoVariacao,
                                  qtdVariacao,
                                });
                              }
                            }
                          );
                        }
                      );
                      // Ordenar por maior variação absoluta em custo
                      const cargosOrdenados = Array.from(
                        cargoVariacoes.values()
                      ).sort(
                        (a, b) =>
                          Math.abs(b.custoVariacao) - Math.abs(a.custoVariacao)
                      );
                      // Formatar data do baseline
                      const baselineDate = snapshotData.snapshot.dataHora
                        ? new Date(snapshotData.snapshot.dataHora)
                            .toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })
                            .replace(/\//g, ".")
                        : "";
                      // 1. Atual (barra completa)
                      waterfallData.push({
                        name: "Atual",
                        value: custoAtualReal,
                        range: [0, custoAtualReal],
                        color: "#5CA6DD",
                        qtdPessoas: profissionaisAtuaisReal,
                      });
                      // 2. Baseline (barra completa)
                      waterfallData.push({
                        name: `Baseline\n(${baselineDate})`,
                        value: custoBaseline,
                        range: [0, custoBaseline],
                        color: "#93C5FD",
                        qtdPessoas: profissionaisBaseline,
                      });
                      // 3. Variações por cargo (barras flutuantes)
                      let acumuladoCusto = custoBaseline;
                      cargosOrdenados.forEach((cargo) => {
                        const nomeFormatado = cargo.nome;
                        const inicio = acumuladoCusto;
                        acumuladoCusto += cargo.custoVariacao;
                        waterfallData.push({
                          name: nomeFormatado,
                          value: cargo.custoVariacao,
                          range: [inicio, acumuladoCusto],
                          color:
                            cargo.custoVariacao >= 0 ? "#10B981" : "#EF4444",
                          qtdPessoas: cargo.qtdVariacao,
                        });
                      });
                      // 4. Projetado (barra completa)
                      waterfallData.push({
                        name: "Projetado",
                        value: custoProjetado,
                        range: [0, custoProjetado],
                        color: "#003151",
                        qtdPessoas: profissionaisProjetados,
                      });
                      return waterfallData;
                    })()}
                    margin={{ top: 8, right: 20, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={<CustomAxisTick />}
                      interval="preserveStartEnd"
                      height={80}
                    />
                    <YAxis
                      tick={axisTick}
                      tickFormatter={formatCurrencyAxisTick}
                      domain={waterfallYAxisDomain}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const custoReais = data.value;
                          const qtd = data.qtdPessoas;
                          const isTotal =
                            label === "Atual" ||
                            label.includes("Baseline") ||
                            label === "Projetado";
                          return (
                            <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                              <p className="font-bold text-foreground mb-1">
                                {label}
                              </p>
                              <p className="text-muted-foreground">
                                Custo: R${" "}
                                {custoReais.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                              <p className="text-muted-foreground">
                                {isTotal
                                  ? `Total: ${qtd} ${
                                      Math.abs(qtd) === 1
                                        ? "funcionário"
                                        : "funcionários"
                                    }`
                                  : `Variação: ${qtd >= 0 ? "+" : ""}${qtd} ${
                                      Math.abs(qtd) === 1
                                        ? "funcionário"
                                        : "funcionários"
                                    }`}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="range">
                      {(() => {
                        // Recalcular para garantir sincronia
                        const custoUnitarioPorCargo = new Map<string, number>();
                        snapshotData.snapshot.dados.internation?.forEach(
                          (unidade: any) => {
                            unidade.staff?.forEach((staff: any) => {
                              if (staff.id && staff.unitCost) {
                                custoUnitarioPorCargo.set(
                                  staff.id,
                                  staff.unitCost
                                );
                              }
                            });
                          }
                        );
                        snapshotData.snapshot.dados.assistance?.forEach(
                          (unidade: any) => {
                            unidade.staff?.forEach((staff: any) => {
                              if (staff.id && staff.unitCost) {
                                custoUnitarioPorCargo.set(
                                  staff.id,
                                  staff.unitCost
                                );
                              }
                            });
                          }
                        );
                        const cargoVariacoes = new Map<
                          string,
                          {
                            nome: string;
                            custoVariacao: number;
                          }
                        >();
                        snapshotData.snapshot.dados.projetadoFinal?.internacao?.forEach(
                          (unidade) => {
                            if (
                              selectedSector !== "all" &&
                              unidade.unidadeId !== selectedSector
                            )
                              return;
                            unidade.cargos.forEach((cargo) => {
                              const custoUnit =
                                custoUnitarioPorCargo.get(cargo.cargoId) || 0;
                              let baselineQtd = 0;
                              const unidadeBaseline =
                                snapshotData.snapshot.dados.internation?.find(
                                  (u: any) => u.id === unidade.unidadeId
                                );
                              if (unidadeBaseline) {
                                const staffBaseline =
                                  unidadeBaseline.staff?.find(
                                    (s: any) => s.id === cargo.cargoId
                                  );
                                baselineQtd = staffBaseline?.quantity || 0;
                              }
                              const qtdVariacao =
                                cargo.projetadoFinal - baselineQtd;
                              const custoVariacao = qtdVariacao * custoUnit;
                              if (qtdVariacao === 0) return;
                              const existing = cargoVariacoes.get(
                                cargo.cargoId
                              );
                              if (existing) {
                                existing.custoVariacao += custoVariacao;
                              } else {
                                let cargoNome = cargo.cargoId;
                                if (snapshotData.situacaoAtual) {
                                  snapshotData.situacaoAtual.unidades.forEach(
                                    (u) => {
                                      const c = u.cargos.find(
                                        (c) => c.cargoId === cargo.cargoId
                                      );
                                      if (c) cargoNome = c.cargoNome;
                                    }
                                  );
                                }
                                cargoVariacoes.set(cargo.cargoId, {
                                  nome: cargoNome,
                                  custoVariacao,
                                });
                              }
                            });
                          }
                        );
                        snapshotData.snapshot.dados.projetadoFinal?.naoInternacao?.forEach(
                          (unidade) => {
                            if (
                              selectedSector !== "all" &&
                              unidade.unidadeId !== selectedSector
                            )
                              return;
                            const cargosProjetadosConsolidados = new Map<
                              string,
                              number
                            >();
                            unidade.sitios.forEach((sitio) => {
                              sitio.cargos.forEach((cargo) => {
                                const qtdAtual =
                                  cargosProjetadosConsolidados.get(
                                    cargo.cargoId
                                  ) || 0;
                                cargosProjetadosConsolidados.set(
                                  cargo.cargoId,
                                  qtdAtual + cargo.projetadoFinal
                                );
                              });
                            });
                            cargosProjetadosConsolidados.forEach(
                              (projetadoTotal, cargoId) => {
                                const custoUnit =
                                  custoUnitarioPorCargo.get(cargoId) || 0;
                                let baselineQtd = 0;
                                const unidadeBaseline =
                                  snapshotData.snapshot.dados.assistance?.find(
                                    (u: any) => u.id === unidade.unidadeId
                                  );
                                if (unidadeBaseline) {
                                  const staffBaseline =
                                    unidadeBaseline.staff?.find(
                                      (s: any) => s.id === cargoId
                                    );
                                  baselineQtd = staffBaseline?.quantity || 0;
                                }
                                const qtdVariacao =
                                  projetadoTotal - baselineQtd;
                                const custoVariacao = qtdVariacao * custoUnit;
                                if (qtdVariacao === 0) return;
                                const existing = cargoVariacoes.get(cargoId);
                                if (existing) {
                                  existing.custoVariacao += custoVariacao;
                                } else {
                                  let cargoNome = cargoId;
                                  if (snapshotData.situacaoAtual) {
                                    snapshotData.situacaoAtual.unidades.forEach(
                                      (u) => {
                                        const c = u.cargos.find(
                                          (c) => c.cargoId === cargoId
                                        );
                                        if (c) cargoNome = c.cargoNome;
                                      }
                                    );
                                  }
                                  cargoVariacoes.set(cargoId, {
                                    nome: cargoNome,
                                    custoVariacao,
                                  });
                                }
                              }
                            );
                          }
                        );
                        const cargosOrdenados = Array.from(
                          cargoVariacoes.values()
                        ).sort(
                          (a, b) =>
                            Math.abs(b.custoVariacao) -
                            Math.abs(a.custoVariacao)
                        );
                        const cells: any[] = [];
                        cells.push({ color: "#5CA6DD" }); // Atual
                        cells.push({ color: "#93C5FD" }); // Baseline
                        cargosOrdenados.forEach((cargo) => {
                          cells.push({
                            color:
                              cargo.custoVariacao >= 0 ? "#10B981" : "#EF4444",
                          });
                        });
                        cells.push({ color: "#003151" }); // Projetado
                        return cells.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ));
                      })()}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Gráfico 6: Comparativo R$ (Mensal) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comparativo R$</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart
                    data={(() => {
                      // Construir comparativo por setor: Atual, Baseline, Projetado em R$
                      const setorComparativo = new Map<
                        string,
                        { atual: number; baseline: number; projetado: number }
                      >();
                      // Mapa de custos unitários por cargo
                      const custoUnitarioPorCargo = new Map<string, number>();
                      snapshotData.snapshot.dados.internation?.forEach(
                        (unidade: any) => {
                          unidade.staff?.forEach((staff: any) => {
                            if (staff.id && staff.unitCost) {
                              custoUnitarioPorCargo.set(
                                staff.id,
                                staff.unitCost
                              );
                            }
                          });
                        }
                      );
                      snapshotData.snapshot.dados.assistance?.forEach(
                        (unidade: any) => {
                          unidade.staff?.forEach((staff: any) => {
                            if (staff.id && staff.unitCost) {
                              custoUnitarioPorCargo.set(
                                staff.id,
                                staff.unitCost
                              );
                            }
                          });
                        }
                      );
                      // Processar Baseline (Internação)
                      snapshotData.snapshot.dados.internation?.forEach(
                        (unidade: any) => {
                          if (
                            selectedSector !== "all" &&
                            unidade.id !== selectedSector
                          )
                            return;
                          const setorNome = unidade.name;
                          if (!setorComparativo.has(setorNome)) {
                            setorComparativo.set(setorNome, {
                              atual: 0,
                              baseline: 0,
                              projetado: 0,
                            });
                          }
                          const entry = setorComparativo.get(setorNome)!;
                          unidade.staff?.forEach((staff: any) => {
                            const custoUnit = staff.unitCost || 0;
                            const qtd = staff.quantity || 0;
                            entry.baseline += qtd * custoUnit;
                          });
                        }
                      );
                      // Processar Baseline (Não-Internação)
                      snapshotData.snapshot.dados.assistance?.forEach(
                        (unidade: any) => {
                          if (
                            selectedSector !== "all" &&
                            unidade.id !== selectedSector
                          )
                            return;
                          const setorNome = unidade.name;
                          if (!setorComparativo.has(setorNome)) {
                            setorComparativo.set(setorNome, {
                              atual: 0,
                              baseline: 0,
                              projetado: 0,
                            });
                          }
                          const entry = setorComparativo.get(setorNome)!;
                          unidade.staff?.forEach((staff: any) => {
                            const custoUnit = staff.unitCost || 0;
                            const qtd = staff.quantity || 0;
                            entry.baseline += qtd * custoUnit;
                          });
                        }
                      );
                      // Processar Projetado (Internação)
                      snapshotData.snapshot.dados.projetadoFinal?.internacao?.forEach(
                        (unidade: any) => {
                          if (
                            selectedSector !== "all" &&
                            unidade.unidadeId !== selectedSector
                          )
                            return;
                          const setorNome = unidade.unidadeNome;
                          if (!setorComparativo.has(setorNome)) {
                            setorComparativo.set(setorNome, {
                              atual: 0,
                              baseline: 0,
                              projetado: 0,
                            });
                          }
                          const entry = setorComparativo.get(setorNome)!;
                          unidade.cargos?.forEach((cargo: any) => {
                            const custoUnit =
                              custoUnitarioPorCargo.get(cargo.cargoId) || 0;
                            const qtd = cargo.projetadoFinal || 0;
                            entry.projetado += qtd * custoUnit;
                          });
                        }
                      );
                      // Processar Projetado (Não-Internação)
                      snapshotData.snapshot.dados.projetadoFinal?.naoInternacao?.forEach(
                        (unidade: any) => {
                          if (
                            selectedSector !== "all" &&
                            unidade.unidadeId !== selectedSector
                          )
                            return;
                          const setorNome = unidade.unidadeNome;
                          if (!setorComparativo.has(setorNome)) {
                            setorComparativo.set(setorNome, {
                              atual: 0,
                              baseline: 0,
                              projetado: 0,
                            });
                          }
                          const entry = setorComparativo.get(setorNome)!;
                          unidade.sitios?.forEach((sitio: any) => {
                            sitio.cargos?.forEach((cargo: any) => {
                              const custoUnit =
                                custoUnitarioPorCargo.get(cargo.cargoId) || 0;
                              const qtd = cargo.projetadoFinal || 0;
                              entry.projetado += qtd * custoUnit;
                            });
                          });
                        }
                      );
                      // Processar Atual
                      snapshotData.situacaoAtual?.unidades.forEach(
                        (unidade: any) => {
                          if (
                            selectedSector !== "all" &&
                            unidade.unidadeId !== selectedSector
                          )
                            return;
                          const setorNome = unidade.unidadeNome;
                          if (!setorComparativo.has(setorNome)) {
                            setorComparativo.set(setorNome, {
                              atual: 0,
                              baseline: 0,
                              projetado: 0,
                            });
                          }
                          const entry = setorComparativo.get(setorNome)!;
                          unidade.cargos?.forEach((cargo: any) => {
                            const custoUnit = cargo.custoUnitario || 0;
                            const qtd = cargo.quantidadeFuncionarios || 0;
                            entry.atual += qtd * custoUnit;
                          });
                        }
                      );
                      // Converter para array e ordenar por maior custo projetado
                      const comparativoArray = Array.from(
                        setorComparativo.entries()
                      )
                        .map(([nome, dados]) => ({
                          setor: nome,
                          Atual: dados.atual,
                          Baseline: dados.baseline,
                          Projetado: dados.projetado,
                        }))
                        .filter(
                          (item) =>
                            item.setor &&
                            (item.Atual > 0 ||
                              item.Baseline > 0 ||
                              item.Projetado > 0)
                        )
                        .sort((a, b) => b.Projetado - a.Projetado);
                      return comparativoArray;
                    })()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="setor"
                      tick={<CustomAxisTick />}
                      interval="preserveStartEnd"
                      height={80}
                    />
                    <YAxis
                      tick={axisTick}
                      tickFormatter={formatCurrencyAxisTick}
                    />
                    <Tooltip
                      formatter={(value: any) => {
                        return [
                          `R$ ${Number(value).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`,
                        ];
                      }}
                    />
                    <Bar dataKey="Atual" fill="#003151" name="Atual" />
                    <Bar
                      dataKey="Baseline"
                      fill="#5CA6DD"
                      name="Baseline (5D MM JJ)"
                    />
                    <Bar dataKey="Projetado" fill="#89A7D6" name="Projetado" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* Análise de Pessoal */}
        <TabsContent value="pessoal" className="space-y-4 mt-4">
          {/* Primeira linha de gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gráfico 1: Ranking da Variação dos Setores (QTD) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Ranking da Variação dos Setores (QTD)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                {(() => {
                  if (!rankingSetores || rankingSetores.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                        Dados insuficientes para análise.
                      </div>
                    );
                  }
                  // Enriquecer com variação em quantidade
                  const rankingComQtd = rankingSetores.map((setor) => {
                    const unidadeProjetada =
                      snapshotData.snapshot.dados.projetadoFinal?.internacao?.find(
                        (u: any) => u.unidadeNome === setor.nome
                      ) ||
                      snapshotData.snapshot.dados.projetadoFinal?.naoInternacao?.find(
                        (u: any) => u.unidadeNome === setor.nome
                      );
                    const unidadeAtual =
                      snapshotData.situacaoAtual?.unidades.find(
                        (u: any) => u.unidadeNome === setor.nome
                      );
                    let qtdAtual = 0;
                    let qtdProjetada = 0;
                    if (unidadeAtual) {
                      qtdAtual = unidadeAtual.totalFuncionarios;
                    }
                    if (unidadeProjetada) {
                      if ("cargos" in unidadeProjetada) {
                        unidadeProjetada.cargos.forEach((cargo: any) => {
                          qtdProjetada += cargo.projetadoFinal;
                        });
                      } else if ("sitios" in unidadeProjetada) {
                        unidadeProjetada.sitios.forEach((sitio: any) => {
                          sitio.cargos.forEach((cargo: any) => {
                            qtdProjetada += cargo.projetadoFinal;
                          });
                        });
                      }
                    }
                    return {
                      nome: setor.nome,
                      variacaoPercentual: setor.variacaoPercentual,
                      variacaoQtd: qtdProjetada - qtdAtual,
                    };
                  });
                  const computedHeight = Math.min(
                    560,
                    Math.max(380, rankingComQtd.length * 44)
                  );
                  const maxLabelLen = Math.max(
                    0,
                    ...rankingComQtd.map((d) =>
                      d?.nome ? String(d.nome).length : 0
                    )
                  );
                  const yAxisWidth = Math.min(
                    200,
                    Math.max(90, Math.ceil(maxLabelLen * 7.2))
                  );
                  return (
                    <div style={{ height: computedHeight }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={rankingComQtd}
                          layout="vertical"
                          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            tick={axisTick}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <YAxis
                            type="category"
                            dataKey="nome"
                            width={yAxisWidth}
                            tick={axisTick}
                          />
                          <Tooltip
                            content={<RankingTooltipContent kind="people" />}
                          />
                          <Bar dataKey="variacaoPercentual" barSize={18}>
                            {rankingComQtd.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.variacaoPercentual < 0
                                    ? "rgb(220,38,38)"
                                    : "rgb(22,163,74)"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            {/* Gráfico 2: Variação Quantidade */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Variação Quantidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={(() => {
                      // Processar dados do waterfall manualmente
                      let cumulative = 0;
                      const processedData = waterfallQuantidadeData.map(
                        (item, index) => {
                          const isStart = index === 0;
                          const isEnd =
                            index === waterfallQuantidadeData.length - 1;
                          const isTransition = !isStart && !isEnd;
                          let color = "#003151";
                          let range: [number, number];
                          if (isStart) {
                            range = [0, item.value];
                            cumulative = item.value;
                          } else if (isTransition) {
                            const startValue = cumulative;
                            cumulative += item.value;
                            range = [startValue, cumulative];
                            color =
                              item.value < 0
                                ? "hsl(var(--destructive))"
                                : "#0b6f88";
                          } else {
                            range = [0, item.value];
                            color = "#003151";
                          }
                          // Calcular custos correspondentes
                          let custoReais = 0;
                          if (isStart) {
                            custoReais = custoAtualReal;
                          } else if (isEnd) {
                            custoReais = custoProjetado;
                          } else {
                            custoReais = custoProjetado - custoAtualReal;
                          }
                          return {
                            name: item.name,
                            value: item.value,
                            range: range,
                            color: color,
                            custoReais: custoReais,
                          };
                        }
                      );
                      return processedData;
                    })()}
                    margin={{ top: 8, right: 20, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={<CustomAxisTick />}
                      interval="preserveStartEnd"
                      height={80}
                    />
                    <YAxis tick={axisTick} domain={waterfallYAxisDomain} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const isTotal =
                            label === "Atual" || label === "Projetado";
                          const qtd = data.value;
                          const custoReais = data.custoReais;
                          return (
                            <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                              <p className="font-bold text-foreground mb-1">
                                {label}
                              </p>
                              <p className="text-muted-foreground">
                                {isTotal ? "Quantidade: " : "Variação: "}
                                <span className="font-semibold">
                                  {qtd} funcionários
                                </span>
                              </p>
                              <p className="text-muted-foreground">
                                {isTotal ? "Custo: " : "Custo Variação: "}
                                <span className="font-semibold">
                                  R${" "}
                                  {Math.abs(custoReais).toLocaleString(
                                    "pt-BR",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="range">
                      {waterfallQuantidadeData.map((_, index) => {
                        const isStart = index === 0;
                        const isEnd =
                          index === waterfallQuantidadeData.length - 1;
                        const isTransition = !isStart && !isEnd;
                        let color = "#003151";
                        if (isTransition) {
                          color =
                            waterfallQuantidadeData[index].value < 0
                              ? "hsl(var(--destructive))"
                              : "#0b6f88";
                        }
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Gráfico 3: Taxa de Ocupação (4 últimos meses) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Taxa de Ocupação (4 últimos meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  return null;
                })()}
                {loadingOccupation ? (
                  <div className="h-[350px] flex items-center justify-center">
                    <p className="text-muted-foreground">Carregando dados...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart
                      data={(() => {
                        if (!occupationData) return [];
                        // Determinar qual conjunto de dados usar baseado no filtro
                        let dataSource;
                        if (selectedSector === "all") {
                          // Usar dados consolidados (summary)
                          dataSource = {
                            historico4Meses:
                              occupationData.summary.historico4Meses,
                            ocupacaoMaximaAtendivel:
                              occupationData.summary.ocupacaoMaximaAtendivel,
                          };
                        } else {
                          // Buscar setor específico
                          const sector = occupationData.sectors.find(
                            (s) => s.sectorId === selectedSector
                          );
                          if (!sector) return [];
                          dataSource = {
                            historico4Meses: sector.historico4Meses,
                            ocupacaoMaximaAtendivel:
                              sector.ocupacaoMaximaAtendivel,
                          };
                        }
                        // Formatar dados para o gráfico
                        return dataSource.historico4Meses.map((mes) => {
                          // Extrair mês/ano do monthLabel (ex: "Setembro/2025" -> "SET")
                          const mesNome = mes.monthLabel
                            .split("/")[0]
                            .substring(0, 3)
                            .toUpperCase();
                          return {
                            mes: mesNome,
                            taxaOcupacao: mes.taxaOcupacao,
                            taxaAtendivel: dataSource.ocupacaoMaximaAtendivel,
                          };
                        });
                      })()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          const label =
                            name === "taxaOcupacao"
                              ? "Taxa de Ocupação"
                              : "Taxa Máxima Atendível";
                          return [`${Number(value).toFixed(1)}%`, label];
                        }}
                      />
                      <Legend
                        formatter={(value: string) => {
                          if (value === "taxaOcupacao")
                            return "Taxa de Ocupação";
                          if (value === "taxaAtendivel")
                            return "Taxa Máxima Atendível";
                          return value;
                        }}
                      />
                      <Bar
                        dataKey="taxaOcupacao"
                        fill="#5CA6DD"
                        name="taxaOcupacao"
                      />
                      <Line
                        type="monotone"
                        dataKey="taxaAtendivel"
                        stroke="#FF6B6B"
                        strokeWidth={2}
                        dot={false}
                        name="taxaAtendivel"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Título - Análise de Pessoal - Detalhamento */}
          <div className="flex items-center gap-3 pt-6 pb-2">
            <div className="bg-[#005D97] p-2 rounded">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold">
              Análise de Pessoal - Detalhamento
            </h3>
          </div>
          {/* Segunda linha de gráficos - Análise das Variações */}
          <div className="grid grid-cols-1 gap-4">
            {/* Gráfico 4: Waterfall de Variação QTD */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Variação QTD - Detalhamento
                  <div className="text-xs font-normal text-gray-500">
                    Análise comparativa: Atual → Baseline → Projetado
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart
                    data={waterfallQuantidadeDataCompleto}
                    margin={{ top: 8, right: 20, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={<CustomAxisTick />}
                      interval="preserveStartEnd"
                      height={80}
                    />
                    <YAxis tick={axisTick} domain={waterfallYAxisDomain} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const qtd = data.value;
                          // Determinar qual valor de custo mostrar baseado no label
                          let custoReais = 0;
                          let isTotal = false;
                          if (label === "Atual") {
                            custoReais = custoAtualReal;
                            isTotal = true;
                          } else if (label.includes("Baseline")) {
                            custoReais = custoBaseline;
                            isTotal = true;
                          } else if (label === "Projetado") {
                            custoReais = custoProjetado;
                            isTotal = true;
                          } else if (label === "Variação") {
                            // Para variações, calcular o custo proporcional
                            const custoMedioPorPessoa =
                              custoAtualReal / profissionaisAtuaisReal;
                            custoReais = qtd * custoMedioPorPessoa;
                          }
                          return (
                            <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                              <p className="font-bold text-foreground mb-1">
                                {label}
                              </p>
                              <p className="text-muted-foreground">
                                {isTotal ? "Quantidade: " : "Variação: "}
                                <span className="font-semibold">
                                  {Math.abs(qtd)} funcionários
                                </span>
                              </p>
                              <p className="text-muted-foreground">
                                {isTotal ? "Custo: " : "Custo Estimado: "}
                                <span className="font-semibold">
                                  {custoReais >= 0 ? "" : "-"}R${" "}
                                  {Math.abs(custoReais).toLocaleString(
                                    "pt-BR",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="range">
                      {waterfallQuantidadeDataCompleto.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={(entry as any).color || "#003151"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Gráfico 5: Cascata de Variação por Cargo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Variação QTD - Detalhamento
                  <div className="text-xs font-normal text-gray-500">
                    Análise por cargo/função
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart
                    data={(() => {
                      // Construir dados de waterfall mostrando Atual → Baseline → cargos → Projetado
                      const waterfallData: any[] = [];
                      // Mapa para custos unitários
                      const custoUnitarioPorCargo = new Map<string, number>();
                      snapshotData.snapshot.dados.internation?.forEach(
                        (unidade: any) => {
                          unidade.staff?.forEach((staff: any) => {
                            if (staff.id && staff.unitCost) {
                              custoUnitarioPorCargo.set(
                                staff.id,
                                staff.unitCost
                              );
                            }
                          });
                        }
                      );
                      snapshotData.snapshot.dados.assistance?.forEach(
                        (unidade: any) => {
                          unidade.staff?.forEach((staff: any) => {
                            if (staff.id && staff.unitCost) {
                              custoUnitarioPorCargo.set(
                                staff.id,
                                staff.unitCost
                              );
                            }
                          });
                        }
                      );
                      const cargoMap = new Map<
                        string,
                        {
                          nome: string;
                          variacao: number;
                          custoVariacao: number;
                        }
                      >();
                      // Calcular variações por cargo entre Baseline e Projetado
                      snapshotData.snapshot.dados.projetadoFinal?.internacao?.forEach(
                        (unidade) => {
                          if (
                            selectedSector !== "all" &&
                            unidade.unidadeId !== selectedSector
                          )
                            return;
                          unidade.cargos.forEach((cargo) => {
                            const custoUnit =
                              custoUnitarioPorCargo.get(cargo.cargoId) || 0;
                            // Encontrar baseline
                            let baselineQtd = 0;
                            const unidadeBaseline =
                              snapshotData.snapshot.dados.internation?.find(
                                (u: any) => u.id === unidade.unidadeId
                              );
                            if (unidadeBaseline) {
                              const staffBaseline = unidadeBaseline.staff?.find(
                                (s: any) => s.id === cargo.cargoId
                              );
                              baselineQtd = staffBaseline?.quantity || 0;
                            }
                            const variacao = cargo.projetadoFinal - baselineQtd;
                            const custoVariacao = variacao * custoUnit;
                            if (variacao === 0) return; // Ignora se não teve variação
                            const existing = cargoMap.get(cargo.cargoId);
                            if (existing) {
                              existing.variacao += variacao;
                              existing.custoVariacao += custoVariacao;
                            } else {
                              // Pegar nome do cargo
                              let cargoNome = cargo.cargoId;
                              if (snapshotData.situacaoAtual) {
                                snapshotData.situacaoAtual.unidades.forEach(
                                  (u) => {
                                    const c = u.cargos.find(
                                      (c) => c.cargoId === cargo.cargoId
                                    );
                                    if (c) cargoNome = c.cargoNome;
                                  }
                                );
                              }
                              cargoMap.set(cargo.cargoId, {
                                nome: cargoNome,
                                variacao,
                                custoVariacao,
                              });
                            }
                          });
                        }
                      );
                      snapshotData.snapshot.dados.projetadoFinal?.naoInternacao?.forEach(
                        (unidade) => {
                          if (
                            selectedSector !== "all" &&
                            unidade.unidadeId !== selectedSector
                          )
                            return;
                          // Primeiro, consolidar todos os cargos projetados da unidade (somando de todos os sítios)
                          const cargosProjetadosConsolidados = new Map<
                            string,
                            number
                          >();
                          unidade.sitios.forEach((sitio) => {
                            sitio.cargos.forEach((cargo) => {
                              const qtdAtual =
                                cargosProjetadosConsolidados.get(
                                  cargo.cargoId
                                ) || 0;
                              cargosProjetadosConsolidados.set(
                                cargo.cargoId,
                                qtdAtual + cargo.projetadoFinal
                              );
                            });
                          });
                          // Agora calcular variações comparando consolidado projetado vs baseline
                          cargosProjetadosConsolidados.forEach(
                            (projetadoTotal, cargoId) => {
                              const custoUnit =
                                custoUnitarioPorCargo.get(cargoId) || 0;
                              // Buscar baseline - em assistance o cargo está em staff diretamente
                              let baselineQtd = 0;
                              const unidadeBaseline =
                                snapshotData.snapshot.dados.assistance?.find(
                                  (u: any) => u.id === unidade.unidadeId
                                );
                              if (unidadeBaseline) {
                                const staffBaseline =
                                  unidadeBaseline.staff?.find(
                                    (s: any) => s.id === cargoId
                                  );
                                baselineQtd = staffBaseline?.quantity || 0;
                              }
                              const variacao = projetadoTotal - baselineQtd;
                              const custoVariacao = variacao * custoUnit;
                              if (variacao === 0) return; // Ignora se não teve variação
                              const existing = cargoMap.get(cargoId);
                              if (existing) {
                                existing.variacao += variacao;
                                existing.custoVariacao += custoVariacao;
                              } else {
                                let cargoNome = cargoId;
                                if (snapshotData.situacaoAtual) {
                                  snapshotData.situacaoAtual.unidades.forEach(
                                    (u) => {
                                      const c = u.cargos.find(
                                        (c) => c.cargoId === cargoId
                                      );
                                      if (c) cargoNome = c.cargoNome;
                                    }
                                  );
                                }
                                cargoMap.set(cargoId, {
                                  nome: cargoNome,
                                  variacao,
                                  custoVariacao,
                                });
                              }
                            }
                          );
                        }
                      );
                      // Ordenar por maior variação absoluta
                      const cargosOrdenados = Array.from(
                        cargoMap.values()
                      ).sort(
                        (a, b) => Math.abs(b.variacao) - Math.abs(a.variacao)
                      );
                      // Formatar data do baseline
                      const baselineDate = snapshotData.snapshot.dataHora
                        ? new Date(snapshotData.snapshot.dataHora)
                            .toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })
                            .replace(/\//g, ".")
                        : "";
                      // Montar waterfall: Atual → Baseline → cargos (diferenças) → Projetado
                      // 1. Atual (barra completa)
                      waterfallData.push({
                        name: "Atual",
                        value: profissionaisAtuaisReal,
                        range: [0, profissionaisAtuaisReal],
                        color: "#5CA6DD",
                        custoReais: custoAtualReal,
                      });
                      // 2. Baseline (barra completa)
                      waterfallData.push({
                        name: `Baseline\n(${baselineDate})`,
                        value: profissionaisBaseline,
                        range: [0, profissionaisBaseline],
                        color: "#93C5FD",
                        custoReais: custoBaseline,
                      });
                      // 3. Variações por cargo (barras flutuantes) - diferenças entre Baseline e Projetado
                      let acumuladoCargos = profissionaisBaseline;
                      cargosOrdenados.forEach((cargo) => {
                        const nomeFormatado = cargo.nome;
                        const inicio = acumuladoCargos;
                        acumuladoCargos += cargo.variacao;
                        waterfallData.push({
                          name: nomeFormatado,
                          value: cargo.variacao,
                          range: [inicio, acumuladoCargos],
                          color: cargo.variacao >= 0 ? "#10B981" : "#EF4444",
                          custoReais: cargo.custoVariacao,
                        });
                      });
                      // 4. Projetado (barra completa)
                      waterfallData.push({
                        name: "Projetado",
                        value: profissionaisProjetados,
                        range: [0, profissionaisProjetados],
                        color: "#003151",
                        custoReais: custoProjetado,
                      });
                      return waterfallData;
                    })()}
                    margin={{ top: 8, right: 20, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={<CustomAxisTick />}
                      interval="preserveStartEnd"
                      height={80}
                    />
                    <YAxis tick={axisTick} domain={waterfallYAxisDomain} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const qtd = data.value;
                          const custoReais = data.custoReais || 0;
                          const isTotal =
                            label === "Atual" ||
                            label.includes("Baseline") ||
                            label === "Projetado";
                          return (
                            <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                              <p className="font-bold text-foreground mb-1">
                                {label}
                              </p>
                              <p className="text-muted-foreground">
                                {isTotal ? "Quantidade: " : "Variação: "}
                                <span className="font-semibold">
                                  {Math.abs(qtd)} funcionários
                                </span>
                              </p>
                              <p className="text-muted-foreground">
                                {isTotal ? "Custo: " : "Custo: "}
                                <span className="font-semibold">
                                  {custoReais >= 0 ? "" : "-"}R${" "}
                                  {Math.abs(custoReais).toLocaleString(
                                    "pt-BR",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="range">
                      {(() => {
                        const cargoMap = new Map<
                          string,
                          { nome: string; variacao: number }
                        >();
                        snapshotData.snapshot.dados.projetadoFinal?.internacao?.forEach(
                          (unidade) => {
                            if (
                              selectedSector !== "all" &&
                              unidade.unidadeId !== selectedSector
                            )
                              return;
                            unidade.cargos.forEach((cargo) => {
                              let baselineQtd = 0;
                              const unidadeBaseline =
                                snapshotData.snapshot.dados.internation?.find(
                                  (u: any) => u.id === unidade.unidadeId
                                );
                              if (unidadeBaseline) {
                                const staffBaseline =
                                  unidadeBaseline.staff?.find(
                                    (s: any) => s.id === cargo.cargoId
                                  );
                                baselineQtd = staffBaseline?.quantity || 0;
                              }
                              const variacao =
                                cargo.projetadoFinal - baselineQtd;
                              if (variacao === 0) return;
                              const existing = cargoMap.get(cargo.cargoId);
                              if (existing) {
                                existing.variacao += variacao;
                              } else {
                                let cargoNome = cargo.cargoId;
                                if (snapshotData.situacaoAtual) {
                                  snapshotData.situacaoAtual.unidades.forEach(
                                    (u) => {
                                      const c = u.cargos.find(
                                        (c) => c.cargoId === cargo.cargoId
                                      );
                                      if (c) cargoNome = c.cargoNome;
                                    }
                                  );
                                }
                                cargoMap.set(cargo.cargoId, {
                                  nome: cargoNome,
                                  variacao,
                                });
                              }
                            });
                          }
                        );
                        snapshotData.snapshot.dados.projetadoFinal?.naoInternacao?.forEach(
                          (unidade) => {
                            if (
                              selectedSector !== "all" &&
                              unidade.unidadeId !== selectedSector
                            )
                              return;
                            // Consolidar cargos projetados de todos os sítios
                            const cargosProjetadosConsolidados = new Map<
                              string,
                              number
                            >();
                            unidade.sitios.forEach((sitio) => {
                              sitio.cargos.forEach((cargo) => {
                                const qtdAtual =
                                  cargosProjetadosConsolidados.get(
                                    cargo.cargoId
                                  ) || 0;
                                cargosProjetadosConsolidados.set(
                                  cargo.cargoId,
                                  qtdAtual + cargo.projetadoFinal
                                );
                              });
                            });
                            // Calcular variações
                            cargosProjetadosConsolidados.forEach(
                              (projetadoTotal, cargoId) => {
                                let baselineQtd = 0;
                                const unidadeBaseline =
                                  snapshotData.snapshot.dados.assistance?.find(
                                    (u: any) => u.id === unidade.unidadeId
                                  );
                                if (unidadeBaseline) {
                                  const staffBaseline =
                                    unidadeBaseline.staff?.find(
                                      (s: any) => s.id === cargoId
                                    );
                                  baselineQtd = staffBaseline?.quantity || 0;
                                }
                                const variacao = projetadoTotal - baselineQtd;
                                if (variacao === 0) return;
                                const existing = cargoMap.get(cargoId);
                                if (existing) {
                                  existing.variacao += variacao;
                                } else {
                                  let cargoNome = cargoId;
                                  if (snapshotData.situacaoAtual) {
                                    snapshotData.situacaoAtual.unidades.forEach(
                                      (u) => {
                                        const c = u.cargos.find(
                                          (c) => c.cargoId === cargoId
                                        );
                                        if (c) cargoNome = c.cargoNome;
                                      }
                                    );
                                  }
                                  cargoMap.set(cargoId, {
                                    nome: cargoNome,
                                    variacao,
                                  });
                                }
                              }
                            );
                          }
                        );
                        const cargosOrdenados = Array.from(
                          cargoMap.values()
                        ).sort(
                          (a, b) => Math.abs(b.variacao) - Math.abs(a.variacao)
                        );
                        const baselineDate = snapshotData.snapshot.dataHora
                          ? new Date(snapshotData.snapshot.dataHora)
                              .toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              })
                              .replace(/\//g, ".")
                          : "";
                        const waterfallDataForCells: any[] = [];
                        // Atual
                        waterfallDataForCells.push({ color: "#5CA6DD" });
                        // Baseline
                        waterfallDataForCells.push({ color: "#93C5FD" });
                        // Variações por cargo (Baseline→Projetado)
                        cargosOrdenados.forEach((cargo) => {
                          waterfallDataForCells.push({
                            color: cargo.variacao >= 0 ? "#10B981" : "#EF4444",
                          });
                        });
                        // Projetado
                        waterfallDataForCells.push({ color: "#003151" });
                        return waterfallDataForCells.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ));
                      })()}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Comparativo por Cargo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart
                    data={(() => {
                      // Construir comparativo por cargo: Atual, Baseline, Projetado
                      const cargoComparativo = new Map<
                        string,
                        { atual: number; baseline: number; projetado: number }
                      >();
                      // Processar dados do Baseline (Internação)
                      snapshotData.snapshot.dados.internation?.forEach(
                        (unidade: any) => {
                          // Filtrar por setor se não for "all"
                          if (
                            selectedSector !== "all" &&
                            unidade.id !== selectedSector
                          ) {
                            return;
                          }
                          // Processar staff do baseline (array com role e quantity)
                          unidade.staff?.forEach((staff: any) => {
                            const cargoNome = staff.role;
                            const qtd = staff.quantity || 0;
                            if (!cargoComparativo.has(cargoNome)) {
                              cargoComparativo.set(cargoNome, {
                                atual: 0,
                                baseline: 0,
                                projetado: 0,
                              });
                            }
                            const entry = cargoComparativo.get(cargoNome)!;
                            entry.baseline += qtd;
                          });
                        }
                      );
                      // Processar dados do Baseline (Não-Internação)
                      snapshotData.snapshot.dados.assistance?.forEach(
                        (unidade: any) => {
                          // Filtrar por setor se não for "all"
                          if (
                            selectedSector !== "all" &&
                            unidade.id !== selectedSector
                          ) {
                            return;
                          }
                          // Processar staff do baseline (array com role e quantity)
                          unidade.staff?.forEach((staff: any) => {
                            const cargoNome = staff.role;
                            const qtd = staff.quantity || 0;
                            if (!cargoComparativo.has(cargoNome)) {
                              cargoComparativo.set(cargoNome, {
                                atual: 0,
                                baseline: 0,
                                projetado: 0,
                              });
                            }
                            const entry = cargoComparativo.get(cargoNome)!;
                            entry.baseline += qtd;
                          });
                        }
                      );
                      // Criar mapa de cargoId -> cargoNome a partir do Atual
                      const cargoIdToNomeMap = new Map<string, string>();
                      snapshotData.situacaoAtual?.unidades.forEach(
                        (unidade: any) => {
                          // Filtrar por setor se não for "all"
                          if (
                            selectedSector !== "all" &&
                            unidade.unidadeId !== selectedSector
                          ) {
                            return;
                          }
                          unidade.cargos?.forEach((cargo: any) => {
                            if (cargo.cargoId && cargo.cargoNome) {
                              cargoIdToNomeMap.set(
                                cargo.cargoId,
                                cargo.cargoNome
                              );
                            }
                          });
                        }
                      );
                      // Processar dados do Projetado (Internação)
                      snapshotData.snapshot.dados.projetadoFinal?.internacao?.forEach(
                        (unidade: any) => {
                          // Filtrar por setor se não for "all"
                          if (
                            selectedSector !== "all" &&
                            unidade.unidadeId !== selectedSector
                          ) {
                            return;
                          }
                          unidade.cargos?.forEach((cargo: any) => {
                            const cargoNome =
                              cargoIdToNomeMap.get(cargo.cargoId) ||
                              cargo.cargoNome;
                            const qtd = cargo.projetadoFinal || 0;
                            if (!cargoComparativo.has(cargoNome)) {
                              cargoComparativo.set(cargoNome, {
                                atual: 0,
                                baseline: 0,
                                projetado: 0,
                              });
                            }
                            const entry = cargoComparativo.get(cargoNome)!;
                            entry.projetado += qtd;
                          });
                        }
                      );
                      // Processar dados do Projetado (Não-Internação)
                      snapshotData.snapshot.dados.projetadoFinal?.naoInternacao?.forEach(
                        (unidade: any) => {
                          // Filtrar por setor se não for "all"
                          if (
                            selectedSector !== "all" &&
                            unidade.unidadeId !== selectedSector
                          ) {
                            return;
                          }
                          unidade.sitios?.forEach((sitio: any) => {
                            sitio.cargos?.forEach((cargo: any) => {
                              const cargoNome =
                                cargoIdToNomeMap.get(cargo.cargoId) ||
                                cargo.cargoNome;
                              const qtd = cargo.projetadoFinal || 0;
                              if (!cargoComparativo.has(cargoNome)) {
                                cargoComparativo.set(cargoNome, {
                                  atual: 0,
                                  baseline: 0,
                                  projetado: 0,
                                });
                              }
                              const entry = cargoComparativo.get(cargoNome)!;
                              entry.projetado += qtd;
                            });
                          });
                        }
                      );
                      // Processar dados do Atual
                      snapshotData.situacaoAtual?.unidades.forEach(
                        (unidade: any) => {
                          // Filtrar por setor se não for "all"
                          if (
                            selectedSector !== "all" &&
                            unidade.unidadeId !== selectedSector
                          ) {
                            return;
                          }
                          // unidade.cargos é um array, não um objeto
                          unidade.cargos?.forEach((cargo: any) => {
                            const cargoNome = cargo.cargoNome;
                            const qtd = cargo.quantidadeFuncionarios || 0;
                            if (!cargoComparativo.has(cargoNome)) {
                              cargoComparativo.set(cargoNome, {
                                atual: 0,
                                baseline: 0,
                                projetado: 0,
                              });
                            }
                            const entry = cargoComparativo.get(cargoNome)!;
                            entry.atual += qtd;
                          });
                        }
                      );
                      // Converter para array e ordenar por maior quantidade projetada
                      const comparativoArray = Array.from(
                        cargoComparativo.entries()
                      )
                        .map(([nome, dados]) => ({
                          cargo: nome,
                          Atual: dados.atual,
                          Baseline: dados.baseline,
                          Projetado: dados.projetado,
                        }))
                        .filter(
                          (item) =>
                            item.cargo && // Filtrar cargos sem nome (undefined)
                            (item.Atual > 0 ||
                              item.Baseline > 0 ||
                              item.Projetado > 0)
                        )
                        .sort((a, b) => b.Projetado - a.Projetado);
                      return comparativoArray;
                    })()}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="cargo"
                      tick={<CustomAxisTick />}
                      interval="preserveStartEnd"
                      height={80}
                    />
                    <YAxis tick={axisTick} />
                    <Tooltip />
                    <Bar dataKey="Atual" fill="#003151" name="Atual" />
                    <Bar dataKey="Baseline" fill="#5CA6DD" name="Baseline" />
                    <Bar dataKey="Projetado" fill="#89A7D6" name="Projetado" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
};
