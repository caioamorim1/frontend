import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSnapshotHospitalSectors } from "@/lib/api";
import { Building2, TrendingUp, Target } from "lucide-react";
import { DashboardBaselineDetalhamento } from "./DashboardBaselineDetalhamento";
import { DashboardBaselineDetalhamentoRede } from "./DashboardBaselineDetalhamentoRede";
import { DashboardBaselineDetalhamentoRedeApi } from "./DashboardBaselineDetalhamentoRedeApi";
import {
  DashboardBaselineGlobalTab,
  type BaselineRankingItem,
} from "./DashboardBaselineGlobalTab";
import { DashboardBaselineGlobalTabRede } from "./DashboardBaselineGlobalTabRede";

// Estrutura de dados para waterfall
export interface WaterfallDataItem {
  name: string;
  value: number;
  // Campos opcionais usados em alguns gráficos/tooltips
  range?: [number, number];
  color?: string;
  qtd?: number;
  custoReais?: number;
}

const axisTick = {
  fontSize: 12,
  fill: "hsl(var(--muted-foreground))",
} as const;

// Processamento de dados waterfall
const processWaterfallData = (data: WaterfallDataItem[]) => {
  let cumulative = 0;
  return data.map((item, index) => {
    const isStart = index === 0;
    const isEnd = index === data.length - 1;
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
      color = item.value < 0 ? "hsl(var(--destructive))" : "#0b6f88";
    } else {
      range = [0, item.value];
      color = "#003151";
    }
    return { name: item.name, value: item.value, range: range, color: color };
  });
};

// Tooltip customizado
const CustomTooltip = ({ active, payload, label, isCurrency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isTotal =
      data.name === payload[0].payload.name[0] ||
      data.name === payload[0].payload.name[payload[0].payload.name.length - 1];
    const displayValue = isCurrency
      ? data.value.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 0,
        })
      : data.value;
    return (
      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-foreground mb-1">{label}</p>
        <p className="text-muted-foreground">
          {isTotal ? "Valor: " : "Variação: "}
          <span className="font-semibold">{displayValue}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Componente Waterfall reutilizável
const ReusableWaterfall: React.FC<{
  data: WaterfallDataItem[];
  unit: "currency" | "people";
}> = ({ data, unit }) => {
  const chartData = processWaterfallData(data);
  if (!data || data.length <= 1)
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        Dados insuficientes para análise.
      </div>
    );
  const yDomain = [
    (dataMin: number) => (dataMin < 0 ? dataMin * 1.4 : 0),
    (dataMax: number) => (dataMax > 0 ? dataMax * 1.4 : 0),
  ] as [(dataMin: number) => number, (dataMax: number) => number];

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 20, left: 20, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={axisTick}
          interval={0}
          angle={-45}
          textAnchor="end"
          height={90}
        />
        <YAxis
          domain={yDomain}
          tick={axisTick}
          tickFormatter={(v) =>
            unit === "currency" ? `R$ ${(v / 1000).toFixed(0)}k` : v.toString()
          }
        />
        <Tooltip content={<CustomTooltip isCurrency={unit === "currency"} />} />
        <Bar dataKey="range">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
        {chartData.map((entry, index) => {
          if (index > 0 && index < chartData.length - 1) {
            const prevEntry = chartData[index - 1];
            return (
              <ReferenceLine
                key={`line-${index}`}
                y={prevEntry.range[1]}
                segment={[
                  { x: prevEntry.name, y: prevEntry.range[1] },
                  { x: entry.name, y: entry.range[0] },
                ]}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="2 2"
              />
            );
          }
          return null;
        })}
      </BarChart>
    </ResponsiveContainer>
  );
};

interface DashboardBaselineScreenProps {
  title: string;
  externalData?: any;
  isGlobalView?: boolean;
}

interface CargoProjetado {
  cargoId: string;
  projetadoFinal: number;
  status: string;
  observacao: string;
}

interface UnidadeProjetadaInternacao {
  unidadeId: string;
  unidadeNome: string;
  hospitalId: string;
  cargos: CargoProjetado[];
  custoTotalUnidade?: number;
}

interface SitioProjetado {
  sitioId: string;
  cargos: CargoProjetado[];
}

interface UnidadeProjetadaNaoInternacao {
  unidadeId: string;
  unidadeNome: string;
  hospitalId: string;
  sitios: SitioProjetado[];
  custoTotalUnidade?: number;
}

interface SnapshotResponse {
  snapshot: {
    id: string;
    observacao?: string;
    dataHora?: string;
    dados: {
      internation?: any[];
      assistance?: any[];
      neutral?: any[];
      projetadoFinal?: {
        internacao?: UnidadeProjetadaInternacao[];
        naoInternacao?: UnidadeProjetadaNaoInternacao[];
      };
    };
    resumo: {
      custoTotal: number;
      totalProfissionais: number;
      custoTotalProjetado?: number;
      totalProfissionaisProjetado?: number;
      totalUnidadesInternacao?: number;
      totalUnidadesAssistencia?: number;
    };
  };
  situacaoAtual?: {
    unidades: Array<{
      unidadeId: string;
      unidadeNome: string;
      tipo: "INTERNACAO" | "NAO_INTERNACAO";
      totalFuncionarios: number;
      custoTotal: number;
      cargos: Array<{
        cargoId: string;
        cargoNome: string;
        quantidadeFuncionarios: number;
        quantidadeAtualizadaEm: string;
        custoUnitario: number;
        custoTotal: number;
      }>;
    }>;
    unidadesNeutras: Array<{
      unidadeId: string;
      unidadeNome: string;
      custoTotal: number;
    }>;
    totais: {
      totalFuncionarios: number;
      custoUnidades: number;
      custoUnidadesNeutras: number;
      custoTotal: number;
    };
  };
}

// Card de informação reutilizável
const InfoCard: React.FC<{
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  variant: "primary" | "warning" | "success";
}> = ({ title, value, subtitle, icon, variant }) => {
  const variantStyles = {
    primary:
      "shadow-[0_4px_12px_rgba(0,93,151,0.3)] border-l-4 border-[#005D97]",
    warning:
      "shadow-[0_4px_12px_rgba(0,112,185,0.3)] border-l-4 border-[#0070B9]",
    success:
      "shadow-[0_4px_12px_rgba(38,140,204,0.3)] border-l-4 border-[#268CCC]",
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className="ml-4 text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

// Card de variação com formatação condicional
const VariationCard: React.FC<{
  title: string;
  value: number;
  unit: "currency" | "quantity" | "percentage";
  lastUpdate?: string;
}> = ({ title, value, unit, lastUpdate }) => {
  // Formatação condicional: verde se = 0, vermelho se ≠ 0
  const getTextColorClass = () => {
    if (value === 0) return "text-green-600";
    return "text-red-600";
  };

  const formatValue = () => {
    const prefix = value >= 0 ? "+" : "";
    if (unit === "currency") {
      return `${prefix}R$ ${Math.abs(value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    if (unit === "percentage") {
      return `${prefix}${value.toFixed(1)}%`;
    }
    return `${prefix}${value}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Não disponível";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Não disponível";
    }
  };

  return (
    <>
      {/* Card com a informação principal */}
      <Card className="border bg-white">
        <CardContent className="pt-4 pb-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-600">{title}</p>
            <div className={`text-2xl font-bold ${getTextColorClass()}`}>
              {formatValue()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card com a data da última atualização */}
      <Card className="border bg-gray-50">
        <CardContent className="pt-4 pb-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-600">
              Última Atualização:
            </p>
            <div className="text-sm text-gray-500">
              {formatDate(lastUpdate)}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export const DashboardBaselineScreen: React.FC<DashboardBaselineScreenProps> = (
  props
) => {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [loading, setLoading] = useState(true);
  const [snapshotData, setSnapshotData] = useState<SnapshotResponse | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"global" | "detalhamento">(
    "global"
  );
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("all");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedRegionId, setSelectedRegionId] = useState<string>("all");

  const redeDashboardData =
    props.isGlobalView && (props.externalData as any)?.rede
      ? (props.externalData as any)
      : null;

  // No modo global (rede), não existe seletor de setor
  useEffect(() => {
    if (props.isGlobalView && selectedSector !== "all") {
      setSelectedSector("all");
    }
  }, [props.isGlobalView, selectedSector]);

  useEffect(() => {
    const normalizeToSnapshotResponse = (data: any): SnapshotResponse => {
      return (data as any)?.snapshot
        ? (data as SnapshotResponse)
        : ({
            snapshot: {
              id: "external",
              dados: data || {},
              resumo: {
                custoTotal: 0,
                totalProfissionais: 0,
              },
            },
          } as SnapshotResponse);
    };

    const fetchData = async () => {
      // 1) Se veio payload consolidado do dashboard da REDE, não normaliza para SnapshotResponse.
      if (redeDashboardData) {
        setSnapshotData(null);
        setLoading(false);
        return;
      }

      // 2) Se veio externalData no formato antigo (snapshot.dados), usar direto
      if (props.externalData) {
        setLoading(true);
        setSnapshotData(normalizeToSnapshotResponse(props.externalData));
        setLoading(false);
        return;
      }

      // 3) Caso contrário, buscar por hospitalId (dashboard hospitalar)
      if (!hospitalId) {
        setSnapshotData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getSnapshotHospitalSectors(hospitalId);
        console.log(
          "📊 [DashboardBaselineScreen] Dados brutos do snapshot:",
          data
        );

        setSnapshotData(normalizeToSnapshotResponse(data));
      } catch (error) {
        console.error("❌ Erro ao carregar snapshot:", error);
        setSnapshotData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hospitalId, props.externalData, redeDashboardData]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!redeDashboardData && !snapshotData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">
              Nenhum baseline encontrado. Crie um snapshot primeiro.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // =========================
  // REDE (payload /snapshot/dashboard)
  // =========================
  if (redeDashboardData) {
    const redeNode = redeDashboardData.rede;
    const grupos = Array.isArray(redeNode?.grupos) ? redeNode.grupos : [];

    const gruposDisponiveis = grupos.map((g: any) => ({
      id: String(g.grupoId ?? g.id),
      name: String(g.grupoNome ?? g.nome ?? g.name ?? "Grupo"),
    }));

    const grupoSelecionado =
      selectedGroupId !== "all"
        ? grupos.find((g: any) => String(g.grupoId ?? g.id) === selectedGroupId)
        : null;

    const regioes = Array.isArray(grupoSelecionado?.regioes)
      ? grupoSelecionado.regioes
      : [];
    const regioesDisponiveis = regioes.map((r: any) => ({
      id: String(r.regiaoId ?? r.id),
      name: String(r.regiaoNome ?? r.nome ?? r.name ?? "Região"),
    }));

    const regiaoSelecionada =
      selectedRegionId !== "all"
        ? regioes.find(
            (r: any) => String(r.regiaoId ?? r.id) === selectedRegionId
          )
        : null;

    const hospitais = (() => {
      if (regiaoSelecionada?.hospitais) return regiaoSelecionada.hospitais;
      if (grupoSelecionado?.regioes) {
        return (grupoSelecionado.regioes as any[]).flatMap(
          (r) => r?.hospitais || []
        );
      }
      return grupos.flatMap((g: any) =>
        (g?.regioes || []).flatMap((r: any) => r?.hospitais || [])
      );
    })();

    const hospitaisDisponiveis = (hospitais as any[]).map((h: any) => ({
      id: String(h.hospitalId ?? h.id),
      name: String(h.hospitalNome ?? h.nome ?? h.name ?? "Hospital"),
    }));

    const hospitalSelecionado =
      selectedHospitalId !== "all"
        ? (hospitais as any[]).find(
            (h) => String(h.hospitalId ?? h.id) === selectedHospitalId
          )
        : null;

    const globalNode =
      hospitalSelecionado?.global ||
      regiaoSelecionada?.global ||
      grupoSelecionado?.global ||
      redeNode?.global ||
      {};

    const globalNodeWithHospitals = {
      ...(globalNode as any),
      hospitais: regiaoSelecionada?.hospitais || hospitais,
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as any);
              if (v === "global") setSelectedSector("all");
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="global">Global</TabsTrigger>
              <TabsTrigger value="detalhamento">Detalhamento</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Atualização do nº de colaboradores em:
              </p>

              {activeTab === "global" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Filtrar por Grupo
                    </label>
                    <Select
                      value={selectedGroupId}
                      onValueChange={(val) => {
                        setSelectedGroupId(val);
                        setSelectedRegionId("all");
                        setSelectedHospitalId("all");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visão Geral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Visão Geral</SelectItem>
                        {gruposDisponiveis.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Filtrar por Região
                    </label>
                    <Select
                      value={selectedRegionId}
                      onValueChange={(val) => {
                        setSelectedRegionId(val);
                        setSelectedHospitalId("all");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visão Geral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Visão Geral</SelectItem>
                        {regioesDisponiveis.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Filtrar por Hospital
                    </label>
                    <Select
                      value={selectedHospitalId}
                      onValueChange={setSelectedHospitalId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visão Geral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Visão Geral</SelectItem>
                        {hospitaisDisponiveis.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Filtrar por Hospital
                    </label>
                    <Select
                      value={selectedHospitalId}
                      onValueChange={setSelectedHospitalId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visão Geral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Visão Geral</SelectItem>
                        {hospitaisDisponiveis.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <TabsContent value="global" className="space-y-6 mt-4">
              <DashboardBaselineGlobalTabRede
                globalData={globalNodeWithHospitals}
                InfoCard={InfoCard}
                icons={{
                  atual: <Building2 className="h-8 w-8" />,
                  variacao: <TrendingUp className="h-8 w-8" />,
                  projetado: <Target className="h-8 w-8" />,
                  funcionarios: <Building2 className="h-8 w-8" />,
                  funcionariosProjetado: <Target className="h-8 w-8" />,
                }}
                ReusableWaterfall={ReusableWaterfall}
              />
            </TabsContent>

            <TabsContent value="detalhamento" className="space-y-6 mt-4">
              <DashboardBaselineDetalhamentoRedeApi
                selectedHospitalId={selectedHospitalId}
                redeId={
                  String(redeNode?.redeId ?? redeNode?.id ?? "") || undefined
                }
                hospital={hospitalSelecionado}
                hospitais={hospitais as any[]}
                scopeTitle={
                  selectedHospitalId !== "all"
                    ? undefined
                    : selectedRegionId !== "all"
                    ? `Região: ${String(
                        regiaoSelecionada?.regiaoNome ??
                          regiaoSelecionada?.nome ??
                          ""
                      )}`
                    : selectedGroupId !== "all"
                    ? `Grupo: ${String(
                        grupoSelecionado?.grupoNome ??
                          grupoSelecionado?.nome ??
                          ""
                      )}`
                    : `Rede: ${String(
                        redeNode?.redeNome ??
                          redeNode?.nome ??
                          redeNode?.name ??
                          ""
                      )}`
                }
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // Placeholder lists (rotas definitivas virão depois)
  const gruposDisponiveis: Array<{ id: string; name: string }> = [];
  const regioesDisponiveis: Array<{ id: string; name: string }> = [];

  // Calcula totais do baseline (snapshot capturado no passado)
  let custoBaseline = 0;
  let profissionaisBaseline = 0;

  // Lista de hospitais (apenas no modo global) e filtro por hospital
  const hospitaisDisponiveis: Array<{ id: string; name: string }> = [];
  if (props.isGlobalView) {
    const map = new Map<string, string>();
    const collectFromUnits = (units?: any[]) => {
      units?.forEach((u: any) => {
        const id = u?.hospitalId ?? u?.hospital?.id;
        const name = u?.hospitalNome ?? u?.hospital?.nome;
        if (id && name) map.set(id, name);
      });
    };
    collectFromUnits(snapshotData.snapshot.dados.internation);
    collectFromUnits(snapshotData.snapshot.dados.assistance);
    collectFromUnits(snapshotData.snapshot.dados.neutral);

    Array.from(map.entries()).forEach(([id, name]) => {
      hospitaisDisponiveis.push({ id, name });
    });
    hospitaisDisponiveis.sort((a, b) => a.name.localeCompare(b.name));
  }

  const filtrarPorHospital = <T,>(units?: T[]): T[] => {
    if (!props.isGlobalView) return units || [];
    if (selectedHospitalId === "all") return units || [];

    return (units || []).filter((u: any) => {
      const id = u?.hospitalId ?? u?.hospital?.id;
      return id === selectedHospitalId;
    });
  };

  const baselineInternationUnits = filtrarPorHospital<any>(
    snapshotData.snapshot.dados.internation
  );
  const baselineAssistanceUnits = filtrarPorHospital<any>(
    snapshotData.snapshot.dados.assistance
  );
  const baselineNeutralUnits = filtrarPorHospital<any>(
    snapshotData.snapshot.dados.neutral
  );

  const staffLastUpdateLabel = (() => {
    const dates: number[] = [];
    snapshotData.situacaoAtual?.unidades?.forEach((u) => {
      u.cargos?.forEach((c) => {
        const t = c?.quantidadeAtualizadaEm
          ? new Date(c.quantidadeAtualizadaEm).getTime()
          : NaN;
        if (Number.isFinite(t)) dates.push(t);
      });
    });
    if (dates.length === 0) return "--";
    const max = Math.max(...dates);
    return new Date(max).toLocaleDateString("pt-BR");
  })();

  // Calcular baseline do snapshot
  baselineInternationUnits.forEach((unit: any) => {
    unit.staff?.forEach((s: any) => {
      custoBaseline += (s.quantity || 0) * (s.unitCost || 0);
      profissionaisBaseline += s.quantity || 0;
    });
  });

  baselineAssistanceUnits.forEach((unit: any) => {
    unit.staff?.forEach((s: any) => {
      custoBaseline += (s.quantity || 0) * (s.unitCost || 0);
      profissionaisBaseline += s.quantity || 0;
    });
  });

  // Adicionar neutras ao baseline (costAmount vem em centavos)
  baselineNeutralUnits.forEach((unit: any) => {
    custoBaseline += (unit.costAmount || 0) / 100;
  });

  // Calcula totais atuais REAIS (situacaoAtual = estado atual do hospital)
  const custoAtualReal = snapshotData.situacaoAtual
    ? snapshotData.situacaoAtual.totais.custoTotal
    : custoBaseline; // fallback para baseline se não houver situacaoAtual
  const profissionaisAtuaisReal = snapshotData.situacaoAtual
    ? snapshotData.situacaoAtual.totais.totalFuncionarios
    : profissionaisBaseline; // fallback para baseline

  console.log("📊 [DashboardBaselineScreen] Dados do Baseline:", {
    custoBaseline,
    profissionaisBaseline,
  });

  console.log("🕐 [DashboardBaselineScreen] Situação Atual Real:", {
    custoAtualReal,
    profissionaisAtuaisReal,
  });

  // Construir lista de setores para o seletor
  const setoresDisponiveis: Array<{ id: string; name: string }> = [];

  // No modo global, não teremos seletor de setor
  if (props.isGlobalView) {
    // Mantém vazio
  } else if (snapshotData.situacaoAtual) {
    // Usar situacaoAtual se disponível
    snapshotData.situacaoAtual.unidades.forEach((unit) => {
      setoresDisponiveis.push({ id: unit.unidadeId, name: unit.unidadeNome });
    });
  } else {
    // Fallback para dados antigos
    snapshotData.snapshot.dados.internation?.forEach((unit: any) => {
      setoresDisponiveis.push({ id: unit.id, name: unit.name });
    });

    snapshotData.snapshot.dados.assistance?.forEach((unit: any) => {
      setoresDisponiveis.push({ id: unit.id, name: unit.name });
    });
  }
  // Função para calcular custo de um setor (mesma lógica do comparativo)
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

  // Calcula totais projetados
  let profissionaisProjetados = 0;
  let custoProjetado = 0;
  let profissionaisBaselineSetor = 0;
  let custoBaselineSetor = 0;
  let profissionaisAtualRealSetor = 0;
  let custoAtualRealSetor = 0;

  console.log("💰 [DashboardBaselineScreen] Calculando projetado...");

  // Se temos situacaoAtual, usar para calcular situação atual real filtrada
  if (snapshotData.situacaoAtual && selectedSector !== "all") {
    const unidadeSelecionada = snapshotData.situacaoAtual.unidades.find(
      (u) => u.unidadeId === selectedSector
    );

    if (unidadeSelecionada) {
      custoAtualRealSetor = unidadeSelecionada.custoTotal;
      profissionaisAtualRealSetor = unidadeSelecionada.totalFuncionarios;
    }
  }

  // Se temos snapshot.dados, usar para calcular baseline do setor selecionado
  if (snapshotData.snapshot.dados && selectedSector !== "all") {
    // Processar baseline da unidade selecionada
    const unidadeBaselineInt = snapshotData.snapshot.dados.internation?.find(
      (u: any) => u.id === selectedSector
    );
    const unidadeBaselineAss = snapshotData.snapshot.dados.assistance?.find(
      (u: any) => u.id === selectedSector
    );

    if (unidadeBaselineInt) {
      unidadeBaselineInt.staff?.forEach((s: any) => {
        custoBaselineSetor += (s.quantity || 0) * (s.unitCost || 0);
        profissionaisBaselineSetor += s.quantity || 0;
      });
    }

    if (unidadeBaselineAss) {
      unidadeBaselineAss.staff?.forEach((s: any) => {
        custoBaselineSetor += (s.quantity || 0) * (s.unitCost || 0);
        profissionaisBaselineSetor += s.quantity || 0;
      });
    }
  }

  // Construir mapa de custos unitários
  const custoPorCargo = new Map<string, number>();

  if (snapshotData.situacaoAtual) {
    // Usar situacaoAtual para obter custos unitários
    snapshotData.situacaoAtual.unidades.forEach((unidade) => {
      unidade.cargos.forEach((cargo) => {
        custoPorCargo.set(cargo.cargoId, cargo.custoUnitario);
      });
    });
  } else {
    // Fallback para estrutura antiga
    baselineInternationUnits.forEach((unit: any) => {
      unit.staff?.forEach((s: any) => {
        custoPorCargo.set(s.id, s.unitCost || 0);
      });
    });

    baselineAssistanceUnits.forEach((unit: any) => {
      unit.staff?.forEach((s: any) => {
        custoPorCargo.set(s.id, s.unitCost || 0);
      });
    });
  }

  console.log(`📋 Total de cargos no mapa: ${custoPorCargo.size}`);

  // Calcular custoBaselineSetor e profissionaisBaselineSetor se não foram calculados via situacaoAtual
  if (!snapshotData.situacaoAtual || selectedSector === "all") {
    // Processar unidades de internação do baseline
    baselineInternationUnits.forEach((unit: any) => {
      // Filtrar por setor selecionado
      if (selectedSector !== "all" && unit.id !== selectedSector) return;

      const quantidadesBaseline: Record<string, number> = {};
      unit.staff?.forEach((s: any) => {
        quantidadesBaseline[s.id] = s.quantity || 0;
      });

      const custosUnit: Record<string, number> = {};
      unit.staff?.forEach((s: any) => {
        custosUnit[s.id] = s.unitCost || 0;
      });

      custoBaselineSetor += calcularCustoSetor(custosUnit, quantidadesBaseline);
      profissionaisBaselineSetor += Object.values(quantidadesBaseline).reduce(
        (a, b) => a + b,
        0
      );
    });

    // Processar unidades de assistência do baseline
    baselineAssistanceUnits.forEach((unit: any) => {
      // Filtrar por setor selecionado
      if (selectedSector !== "all" && unit.id !== selectedSector) return;

      const quantidadesBaseline: Record<string, number> = {};
      unit.staff?.forEach((s: any) => {
        quantidadesBaseline[s.id] = s.quantity || 0;
      });

      const custosUnit: Record<string, number> = {};
      unit.staff?.forEach((s: any) => {
        custosUnit[s.id] = s.unitCost || 0;
      });

      custoBaselineSetor += calcularCustoSetor(custosUnit, quantidadesBaseline);
      profissionaisBaselineSetor += Object.values(quantidadesBaseline).reduce(
        (a, b) => a + b,
        0
      );
    });
  }

  // Calcular projetado para internação
  snapshotData.snapshot.dados.projetadoFinal?.internacao?.forEach((unidade) => {
    // No modo global, filtrar por hospital
    if (
      props.isGlobalView &&
      selectedHospitalId !== "all" &&
      (unidade as any).hospitalId &&
      (unidade as any).hospitalId !== selectedHospitalId
    ) {
      return;
    }
    // Filtrar por setor selecionado
    if (selectedSector !== "all" && unidade.unidadeId !== selectedSector)
      return;

    console.log(`  🏥 Unidade Internação: ${unidade.unidadeNome}`);

    // Usar custoTotalUnidade se disponível, senão calcular manualmente
    if (unidade.custoTotalUnidade !== undefined) {
      custoProjetado += unidade.custoTotalUnidade;
      console.log(
        `    Custo total da unidade: R$ ${unidade.custoTotalUnidade}`
      );
    } else {
      // Fallback: calcular manualmente
      unidade.cargos.forEach((cargo) => {
        const custoUnit = custoPorCargo.get(cargo.cargoId) || 0;
        const custoProj = cargo.projetadoFinal * custoUnit;
        custoProjetado += custoProj;
      });
    }

    // Somar quantidade de profissionais
    unidade.cargos.forEach((cargo) => {
      profissionaisProjetados += cargo.projetadoFinal;
    });
  });

  // Calcular projetado para não-internação
  snapshotData.snapshot.dados.projetadoFinal?.naoInternacao?.forEach(
    (unidade) => {
      // No modo global, filtrar por hospital
      if (
        props.isGlobalView &&
        selectedHospitalId !== "all" &&
        (unidade as any).hospitalId &&
        (unidade as any).hospitalId !== selectedHospitalId
      ) {
        return;
      }
      // Filtrar por setor selecionado
      if (selectedSector !== "all" && unidade.unidadeId !== selectedSector)
        return;

      console.log(`  🏥 Unidade Não-Internação: ${unidade.unidadeNome}`);

      // Usar custoTotalUnidade se disponível, senão calcular manualmente
      if (unidade.custoTotalUnidade !== undefined) {
        custoProjetado += unidade.custoTotalUnidade;
        console.log(
          `    Custo total da unidade: R$ ${unidade.custoTotalUnidade}`
        );
      } else {
        // Fallback: calcular manualmente
        unidade.sitios.forEach((sitio) => {
          sitio.cargos.forEach((cargo) => {
            const custoUnit = custoPorCargo.get(cargo.cargoId) || 0;
            const custoProj = cargo.projetadoFinal * custoUnit;
            custoProjetado += custoProj;
          });
        });
      }

      // Somar quantidade de profissionais
      unidade.sitios.forEach((sitio) => {
        sitio.cargos.forEach((cargo) => {
          profissionaisProjetados += cargo.projetadoFinal;
        });
      });
    }
  );

  console.log(
    "💚 [DashboardBaselineScreen] Adicionando custo das unidades neutras..."
  );
  // Adiciona custo das unidades neutras da situação atual (não têm projetado, mantém valor atual)
  // Neutras são adicionadas apenas quando "all" está selecionado
  if (selectedSector === "all") {
    // Adicionar neutras ao projetado (mantém o valor)
    snapshotData.situacaoAtual?.unidadesNeutras?.forEach((unit: any) => {
      const custoNeutro = unit.custoTotal || 0;
      console.log(
        `  🏥 Unidade Neutra: ${unit.unidadeNome} - R$ ${custoNeutro}`
      );
      custoProjetado += custoNeutro;
      // Neutras também estavam no baseline do snapshot
      const unidadeNeutraBaseline = snapshotData.snapshot.dados.neutral?.find(
        (n: any) => n.id === unit.unidadeId
      );
      if (unidadeNeutraBaseline) {
        custoBaselineSetor += (unidadeNeutraBaseline.costAmount || 0) / 100;
      }
    });

    // Adicionar neutras à situação atual real
    snapshotData.situacaoAtual?.unidadesNeutras?.forEach((unit: any) => {
      const custoNeutro = unit.custoTotal || 0;
      custoAtualRealSetor += custoNeutro;
    });
  }

  // Se não houver projetadoFinal (ex: dados externos ainda sem projeção), manter baseline
  if (!snapshotData.snapshot.dados.projetadoFinal) {
    const custoBaselineSelecionado =
      selectedSector === "all" ? custoBaseline : custoBaselineSetor;
    const profissionaisBaselineSelecionado =
      selectedSector === "all"
        ? profissionaisBaseline
        : profissionaisBaselineSetor;

    custoProjetado = custoBaselineSelecionado;
    profissionaisProjetados = profissionaisBaselineSelecionado;
  }

  // Usar valores filtrados ou totais dependendo da seleção
  const custoBaselineExibicao =
    selectedSector === "all" ? custoBaseline : custoBaselineSetor;
  const profissionaisBaselineExibicao =
    selectedSector === "all"
      ? profissionaisBaseline
      : profissionaisBaselineSetor;

  const custoAtualRealExibicao =
    selectedSector === "all" ? custoAtualReal : custoAtualRealSetor;
  const profissionaisAtualRealExibicao =
    selectedSector === "all"
      ? profissionaisAtuaisReal
      : profissionaisAtualRealSetor;

  // Calcula variações (Baseline -> Projetado)
  // Variações calculadas com base no Atual Real vs Projetado (para os cards)
  const variacaoCusto = custoProjetado - custoAtualRealExibicao;
  const variacaoProfissionais =
    profissionaisProjetados - profissionaisAtualRealExibicao;
  const variacaoCustoPercentual =
    custoAtualRealExibicao > 0
      ? (variacaoCusto / custoAtualRealExibicao) * 100
      : 0;
  const variacaoProfissionaisPercentual =
    profissionaisAtualRealExibicao > 0
      ? (variacaoProfissionais / profissionaisAtualRealExibicao) * 100
      : 0;

  // Variações entre Baseline e Projetado (para o gráfico waterfall)
  const variacaoProfissionaisBaselineParaProjetado =
    profissionaisProjetados - profissionaisBaselineExibicao;

  console.log("🔢 [DashboardBaselineScreen] Dados processados:", {
    baseline: {
      custo: custoBaselineExibicao,
      profissionais: profissionaisBaselineExibicao,
    },
    projected: {
      custo: custoProjetado,
      profissionais: profissionaisProjetados,
    },
    atualReal: {
      custo: custoAtualRealExibicao,
      profissionais: profissionaisAtualRealExibicao,
    },
    variation: {
      custo: variacaoCusto,
      custoPercentual: variacaoCustoPercentual,
      profissionais: variacaoProfissionais,
      profissionaisPercentual: variacaoProfissionaisPercentual,
    },
  });

  // Dados waterfall de custo (R$) - para aba Global (Atual Real -> Projetado)
  const waterfallCustoDataGlobal: WaterfallDataItem[] = [
    { name: "Atual", value: custoAtualRealExibicao },
    { name: "Variação", value: custoProjetado - custoAtualRealExibicao },
    { name: "Projetado\nFinal", value: custoProjetado },
  ];

  // Dados waterfall de quantidade - para aba Global (Atual Real -> Projetado)
  const waterfallQuantidadeDataGlobal: WaterfallDataItem[] = [
    { name: "Atual", value: profissionaisAtualRealExibicao },
    {
      name: "Variação",
      value: profissionaisProjetados - profissionaisAtualRealExibicao,
    },
    { name: "Projetado", value: profissionaisProjetados },
  ];

  const rankingHospitaisCusto: BaselineRankingItem[] = [];
  const rankingHospitaisQtd: BaselineRankingItem[] = [];

  // Dados waterfall de custo (R$) - para aba Detalhamento (Baseline -> Projetado)
  const waterfallCustoData: WaterfallDataItem[] = [
    { name: "Baseline\nSnapshot", value: custoBaselineExibicao },
    { name: "Variação", value: variacaoCusto },
    { name: "Projetado\nFinal", value: custoProjetado },
  ];

  // Dados waterfall de quantidade - para aba Detalhamento (Atual -> Projetado)
  const waterfallQuantidadeData: WaterfallDataItem[] = [
    { name: "Atual", value: profissionaisAtualRealExibicao },
    { name: "Variação", value: variacaoProfissionais },
    { name: "Projetado", value: profissionaisProjetados },
  ];

  // Dados waterfall completo (Atual -> Baseline -> Projetado) para Detalhamento
  // Formatar data do snapshot para o label
  const baselineDate = snapshotData.snapshot.dataHora
    ? new Date(snapshotData.snapshot.dataHora)
        .toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })
        .replace(/\//g, ".")
    : "";

  // Criar dados processados manualmente para ter barras completas em Atual, Baseline e Projetado
  const waterfallQuantidadeDataCompleto: WaterfallDataItem[] = [
    {
      name: "Atual",
      value: profissionaisAtualRealExibicao,
      range: [0, profissionaisAtualRealExibicao] as [number, number],
      color: "#5CA6DD",
    },
    {
      name: "Variação",
      value: profissionaisBaselineExibicao - profissionaisAtualRealExibicao,
      range: [
        profissionaisAtualRealExibicao,
        profissionaisBaselineExibicao,
      ] as [number, number],
      color:
        profissionaisBaselineExibicao - profissionaisAtualRealExibicao >= 0
          ? "#4ADE80"
          : "#EF4444",
    },
    {
      name: `Baseline\n(${baselineDate})`,
      value: profissionaisBaselineExibicao,
      range: [0, profissionaisBaselineExibicao] as [number, number],
      color: "#93C5FD",
    },
    {
      name: "Variação",
      value: variacaoProfissionaisBaselineParaProjetado,
      range: [profissionaisBaselineExibicao, profissionaisProjetados] as [
        number,
        number
      ],
      color:
        variacaoProfissionaisBaselineParaProjetado >= 0 ? "#4ADE80" : "#EF4444",
    },
    {
      name: "Projetado",
      value: profissionaisProjetados,
      range: [0, profissionaisProjetados] as [number, number],
      color: "#003151",
    },
  ];

  // Ranking por setores (%) - para o 3º gráfico
  const setoresVariacao: Array<{
    nome: string;
    variacaoPercentual: number;
    variacaoReais: number;
  }> = [];

  // Processa internação para ranking de setores (comparando Atual vs Projetado)
  snapshotData.snapshot.dados.projetadoFinal?.internacao?.forEach((unidade) => {
    // Buscar situação atual da unidade
    const unidadeAtual = snapshotData.situacaoAtual?.unidades.find(
      (u) => u.unidadeId === unidade.unidadeId
    );

    if (unidadeAtual) {
      const custoAtualUnidade = unidadeAtual.custoTotal;

      // Construir mapa de custos unitários desta unidade
      const custosUnit: Record<string, number> = {};
      unidadeAtual.cargos.forEach((cargo) => {
        custosUnit[cargo.cargoId] = cargo.custoUnitario;
      });

      // Construir mapa de quantidades projetadas
      const quantidadesProjetadas: Record<string, number> = {};
      unidade.cargos.forEach((cargo) => {
        quantidadesProjetadas[cargo.cargoId] = cargo.projetadoFinal;
      });

      const custoProjetadoUnidade = calcularCustoSetor(
        custosUnit,
        quantidadesProjetadas
      );

      const variacaoPerc =
        custoAtualUnidade > 0
          ? ((custoProjetadoUnidade - custoAtualUnidade) / custoAtualUnidade) *
            100
          : 0;

      const variacaoReais = custoProjetadoUnidade - custoAtualUnidade;

      console.log(`📊 [Ranking Setores] ${unidade.unidadeNome}:`, {
        custoAtual: custoAtualUnidade,
        custoProjetado: custoProjetadoUnidade,
        variacaoReais: variacaoReais,
        variacaoPerc: variacaoPerc,
      });

      setoresVariacao.push({
        nome: unidade.unidadeNome,
        variacaoPercentual: variacaoPerc,
        variacaoReais: variacaoReais,
      });
    }
  });

  // Processa não-internação para ranking de setores (comparando Atual vs Projetado)
  snapshotData.snapshot.dados.projetadoFinal?.naoInternacao?.forEach(
    (unidade) => {
      // Buscar situação atual da unidade
      const unidadeAtual = snapshotData.situacaoAtual?.unidades.find(
        (u) => u.unidadeId === unidade.unidadeId
      );

      if (unidadeAtual) {
        const custoAtualUnidade = unidadeAtual.custoTotal;

        // Construir mapa de custos unitários desta unidade
        const custosUnit: Record<string, number> = {};
        unidadeAtual.cargos.forEach((cargo) => {
          custosUnit[cargo.cargoId] = cargo.custoUnitario;
        });

        // Construir mapa de quantidades projetadas (somando todos os sítios)
        const quantidadesProjetadas: Record<string, number> = {};
        unidade.sitios.forEach((sitio) => {
          sitio.cargos.forEach((cargo) => {
            quantidadesProjetadas[cargo.cargoId] =
              (quantidadesProjetadas[cargo.cargoId] || 0) +
              cargo.projetadoFinal;
          });
        });

        const custoProjetadoUnidade = calcularCustoSetor(
          custosUnit,
          quantidadesProjetadas
        );

        const variacaoPerc =
          custoAtualUnidade > 0
            ? ((custoProjetadoUnidade - custoAtualUnidade) /
                custoAtualUnidade) *
              100
            : 0;

        const variacaoReais = custoProjetadoUnidade - custoAtualUnidade;

        console.log(
          `📊 [Ranking Setores - Não Internação] ${unidade.unidadeNome}:`,
          {
            custoAtual: custoAtualUnidade,
            custoProjetado: custoProjetadoUnidade,
            variacaoReais: variacaoReais,
            variacaoPerc: variacaoPerc,
          }
        );

        setoresVariacao.push({
          nome: unidade.unidadeNome,
          variacaoPercentual: variacaoPerc,
          variacaoReais: variacaoReais,
        });
      }
    }
  );

  const rankingSetores = setoresVariacao.sort(
    (a, b) => b.variacaoPercentual - a.variacaoPercentual
  );

  // Paleta de cores do projeto
  const projectColors = [
    "#005D97",
    "#0070B9",
    "#89A7D6",
    "#003151",
    "#004A75",
    "#268CCC",
    "#5CA6DD",
    "#D7E5F5",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Layout modo rede: os 5 cards ficam dentro da Aba Global (componente rede) */}

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            const nextTab = value as "global" | "detalhamento";
            setActiveTab(nextTab);

            // Quando entrar na tab Global, sempre limpar filtro de setor.
            // Isso evita a Global herdar um setor previamente selecionado no Detalhamento.
            if (nextTab === "global" && selectedSector !== "all") {
              setSelectedSector("all");
            }
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="detalhamento">Detalhamento</TabsTrigger>
          </TabsList>

          {/* Modo rede: abaixo do seletor Global/Detalhamento */}
          {props.isGlobalView ? (
            <div className="space-y-4 mb-6">
              <div className="text-sm text-muted-foreground font-medium">
                Atualização do nº de colaboradores em: {staffLastUpdateLabel}
              </div>

              {activeTab === "global" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Filtrar por Grupo
                    </label>
                    <Select
                      value={selectedGroupId}
                      onValueChange={setSelectedGroupId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visão Geral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Visão Geral</SelectItem>
                        {gruposDisponiveis.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Filtrar por Região
                    </label>
                    <Select
                      value={selectedRegionId}
                      onValueChange={setSelectedRegionId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visão Geral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Visão Geral</SelectItem>
                        {regioesDisponiveis.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Filtrar por Hospital
                    </label>
                    <Select
                      value={selectedHospitalId}
                      onValueChange={setSelectedHospitalId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visão Geral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Visão Geral</SelectItem>
                        {hospitaisDisponiveis.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Filtrar por Hospital
                    </label>
                    <Select
                      value={selectedHospitalId}
                      onValueChange={setSelectedHospitalId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Visão Geral" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Visão Geral</SelectItem>
                        {hospitaisDisponiveis.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Aba Global */}
          <TabsContent value="global" className="space-y-6">
            {props.isGlobalView ? (
              <DashboardBaselineGlobalTabRede
                custoAtualReal={custoAtualRealExibicao}
                custoProjetado={custoProjetado}
                variacaoCustoReais={custoProjetado - custoAtualRealExibicao}
                profissionaisAtuais={profissionaisAtualRealExibicao}
                profissionaisProjetados={profissionaisProjetados}
                InfoCard={InfoCard}
                icons={{
                  atual: <Building2 className="h-8 w-8" />,
                  variacao: <TrendingUp className="h-8 w-8" />,
                  projetado: <Target className="h-8 w-8" />,
                  funcionarios: <Building2 className="h-8 w-8" />,
                  funcionariosProjetado: <Target className="h-8 w-8" />,
                }}
                ReusableWaterfall={ReusableWaterfall}
                waterfallCusto={waterfallCustoDataGlobal}
                waterfallQuantidade={waterfallQuantidadeDataGlobal}
                rankingCusto={rankingHospitaisCusto as any}
                rankingQuantidade={rankingHospitaisQtd as any}
              />
            ) : (
              <DashboardBaselineGlobalTab
                isGlobalView={!!props.isGlobalView}
                custoAtualReal={custoAtualRealExibicao}
                custoProjetado={custoProjetado}
                variacaoCustoReais={custoProjetado - custoAtualRealExibicao}
                profissionaisAtuais={profissionaisAtualRealExibicao}
                profissionaisProjetados={profissionaisProjetados}
                InfoCard={InfoCard}
                icons={{
                  atual: <Building2 className="h-8 w-8" />,
                  variacao: <TrendingUp className="h-8 w-8" />,
                  projetado: <Target className="h-8 w-8" />,
                  funcionarios: <Building2 className="h-8 w-8" />,
                  funcionariosProjetado: <Target className="h-8 w-8" />,
                }}
                selectedGroupId={selectedGroupId}
                setSelectedGroupId={setSelectedGroupId}
                groups={gruposDisponiveis}
                selectedRegionId={selectedRegionId}
                setSelectedRegionId={setSelectedRegionId}
                regions={regioesDisponiveis}
                selectedHospitalId={selectedHospitalId}
                setSelectedHospitalId={setSelectedHospitalId}
                hospitals={hospitaisDisponiveis}
                staffLastUpdateLabel={staffLastUpdateLabel}
                ReusableWaterfall={ReusableWaterfall}
                waterfallCusto={waterfallCustoDataGlobal}
                waterfallQuantidade={waterfallQuantidadeDataGlobal}
                rankingCusto={rankingHospitaisCusto}
                rankingQuantidade={rankingHospitaisQtd}
                rankingSetores={rankingSetores as any}
              />
            )}
          </TabsContent>

          {/* Aba Detalhamento */}
          {props.isGlobalView ? (
            <DashboardBaselineDetalhamentoRede
              snapshotData={snapshotData}
              hospitalId={hospitalId}
              selectedSector={selectedSector}
              setSelectedSector={setSelectedSector}
              setoresDisponiveis={setoresDisponiveis}
              profissionaisBaseline={profissionaisBaselineExibicao}
              custoBaseline={custoBaselineExibicao}
              profissionaisProjetados={profissionaisProjetados}
              custoProjetado={custoProjetado}
              profissionaisAtuaisReal={profissionaisAtualRealExibicao}
              custoAtualReal={custoAtualRealExibicao}
              variacaoCustoPercentual={variacaoCustoPercentual}
              variacaoProfissionaisPercentual={variacaoProfissionaisPercentual}
              variacaoCusto={variacaoCusto}
              variacaoProfissionais={variacaoProfissionais}
              waterfallQuantidadeData={waterfallQuantidadeData}
              waterfallQuantidadeDataCompleto={waterfallQuantidadeDataCompleto}
              axisTick={axisTick}
              ReusableWaterfall={ReusableWaterfall}
            />
          ) : (
            <DashboardBaselineDetalhamento
              snapshotData={snapshotData}
              hospitalId={hospitalId}
              selectedSector={selectedSector}
              setSelectedSector={setSelectedSector}
              setoresDisponiveis={setoresDisponiveis}
              hideSectorSelector={false}
              profissionaisBaseline={profissionaisBaselineExibicao}
              custoBaseline={custoBaselineExibicao}
              profissionaisProjetados={profissionaisProjetados}
              custoProjetado={custoProjetado}
              profissionaisAtuaisReal={profissionaisAtualRealExibicao}
              custoAtualReal={custoAtualRealExibicao}
              variacaoCustoPercentual={variacaoCustoPercentual}
              variacaoProfissionaisPercentual={variacaoProfissionaisPercentual}
              variacaoCusto={variacaoCusto}
              variacaoProfissionais={variacaoProfissionais}
              waterfallQuantidadeData={waterfallQuantidadeData}
              waterfallQuantidadeDataCompleto={waterfallQuantidadeDataCompleto}
              axisTick={axisTick}
              ReusableWaterfall={ReusableWaterfall}
            />
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};
