import React, { useState, useMemo, useEffect } from "react";
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
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Users,
  Building,
  ChevronsRight,
  Radar,
  CircleDollarSign,
} from "lucide-react";
import RadarChartComponent from "./graphicsComponents/RadarChart";
import { calcularPerformanceParaGrafico } from "@/mocks/filterMocksRadar";
import { fetchDashboardAtualData } from "@/mocks/filterMocksDashAtual";
import { DashboardAnalytics } from "@/mocks/mocksDashAtualDatabase";
import { PieChartComp } from "./graphicsComponents/PieChartComp";
import BargraphicChart from "./graphicsComponents/BarChartComp";
import {
  COLORS,
  generateMultiColorScale,
  generateBlueMonochromaticScale,
} from "@/lib/generateMultiColorScale";
import { formatAmountBRL } from "@/lib/utils";
import { parseCost as parseCostUtil, sumStaff } from "@/lib/dataUtils";
import {
  getAllHospitalSectors,
  HospitalSector,
} from "@/mocks/functionSectores";
import { SectorInternation } from "@/mocks/internationDatabase";
import { SectorAssistance } from "@/mocks/noInternationDatabase";
import { OccupationRateChart } from "./OccupationRateChart";

// Função para gerar cor consistente por hospital (hash simples)
const getHospitalColor = (hospitalName: string): string => {
  const colors = [
    "#EF4444", // red-500
    "#F97316", // orange-500
    "#F59E0B", // amber-500
    "#EAB308", // yellow-500
    "#84CC16", // lime-500
    "#22C55E", // green-500
    "#10B981", // emerald-500
    "#14B8A6", // teal-500
    "#06B6D4", // cyan-500
    "#0EA5E9", // sky-500
    "#3B82F6", // blue-500
    "#6366F1", // indigo-500
    "#8B5CF6", // violet-500
    "#A855F7", // purple-500
    "#D946EF", // fuchsia-500
    "#EC4899", // pink-500
  ];

  // Hash simples do nome do hospital
  let hash = 0;
  for (let i = 0; i < hospitalName.length; i++) {
    hash = (hash << 5) - hash + hospitalName.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

import { useParams } from "react-router-dom";

// --- ESTRUTURA DE DADOS APROFUNDADA ---
export interface WaterfallDataItem {
  name: string;
  value: number;
}

export interface SectorAnalysis {
  custo: WaterfallDataItem[];
  quantitativo: WaterfallDataItem[];
}

export interface DetailedWaterfallData {
  [sectorName: string]: SectorAnalysis;
}

interface DashboardAtualScreenProps {
  title: string;
  externalData?: any; // Dados externos agregados (opcional)
  isGlobalView?: boolean; // Flag para indicar se é visão global
  aggregationType?: "hospital" | "grupo" | "regiao" | "rede"; // 🆕 Tipo de agregação
  entityId?: string; // 🆕 ID da entidade (opcional)
}

interface ChartDataItem {
  subject: string;
  atual: number;
  projetado: number;
}

const axisTick = {
  fontSize: 12,
  fill: "hsl(var(--muted-foreground))",
} as const;

interface InfoCardProps {
  title: string;
  value: string | number; // Pode ser um número ou uma string
  icon?: React.ReactNode; // Opcional: para passar um ícone como um componente React
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, value, icon }) => {
  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg shadow-sm bg-white min-w-[200px]">
      {/* Container do Ícone (se existir) */}
      {icon && (
        <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-600">
          {icon}
        </div>
      )}

      {/* Título e Valor */}
      <div>
        <h4 className="text-sm font-medium text-gray-500">{title}</h4>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};

// --- LÓGICA DE PROCESSAMENTO (COM NOVAS CORES) ---
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

// --- COMPONENTES AUXILIARES ---
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

const ReusableWaterfall: React.FC<{
  data: WaterfallDataItem[];
  unit: "currency" | "people";
}> = ({ data, unit }) => {
  const chartData = processWaterfallData(data);
  if (!data || data.length <= 1)
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        Selecione um setor para ver a análise.
      </div>
    );
  const yDomain = [
    0,
    Math.max(...chartData.map((d) => Math.max(...d.range, 0))) * 1.1,
  ];

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

const GlobalTabContent: React.FC<{
  sourceData: HospitalSector;
  radarData: ChartDataItem[];
  hospitalId?: string;
  aggregationType?: "hospital" | "grupo" | "regiao" | "rede"; // 🆕
  entityId?: string; // 🆕
}> = ({ sourceData, radarData, hospitalId, aggregationType, entityId }) => {
  const { internation, assistance } = sourceData;

  const occupationData = useMemo(() => {
    if (!internation || internation.length === 0) {
      return {
        data: [],
        summary: {
          name: "Global",
          "Taxa de Ocupação": 0,
          "Taxa de Ocupação Diária": 0, // 🆕 Taxa média do dia
          "Ocupação Máxima Atendível": 0, // 🆕
          Ociosidade: 0,
          Superlotação: 0,
          "Capacidade Produtiva": 100,
        },
      };
    }

    const data = internation.map((sector) => {
      const totalBeds = sector.bedCount || 0;
      const evaluatedBeds = sector.bedStatus?.evaluated || 0;
      const occupancyRate =
        totalBeds > 0 ? (evaluatedBeds / totalBeds) * 100 : 0;

      // TODO: Integrar com API de ocupação para obter dados reais
      // Por ora, usa a taxa de ocupação atual como taxa diária
      const ocupacaoMaximaAtendivel = 85;
      const taxaOcupacaoDia = occupancyRate; // Taxa de ocupação atual (sem variação)

      const ociosidade = Math.max(0, ocupacaoMaximaAtendivel - occupancyRate);
      const superlotacao = Math.max(0, occupancyRate - ocupacaoMaximaAtendivel);

      // Para o gráfico empilhado, a Taxa de Ocupação deve ser limitada à máxima
      const taxaOcupacaoParaGrafico = Math.min(
        occupancyRate,
        ocupacaoMaximaAtendivel
      );

      return {
        name: sector.name,
        "Taxa de Ocupação": taxaOcupacaoParaGrafico, // Limitada à máxima para empilhar corretamente
        "Taxa de Ocupação Real": occupancyRate, // Valor real completo
        "Taxa de Ocupação Diária": taxaOcupacaoDia, // 🆕
        "Ocupação Máxima Atendível": ocupacaoMaximaAtendivel, // 🆕
        Ociosidade: ociosidade,
        Superlotação: superlotacao,
        "Capacidade Produtiva": 100,
      };
    });

    const totalBeds = internation.reduce(
      (sum, s) => sum + (s.bedCount || 0),
      0
    );
    const totalEvaluated = internation.reduce(
      (sum, s) => sum + (s.bedStatus?.evaluated || 0),
      0
    );
    const globalOccupancy =
      totalBeds > 0 ? (totalEvaluated / totalBeds) * 100 : 0;

    // TODO: Integrar com API de ocupação para obter dados reais
    const globalOcupacaoMaximaAtendivel = 85;
    const globalTaxaOcupacaoDia = globalOccupancy; // Taxa de ocupação atual (sem variação)

    const globalOciosidade = Math.max(
      0,
      globalOcupacaoMaximaAtendivel - globalOccupancy
    );
    const globalSuperlotacao = Math.max(
      0,
      globalOccupancy - globalOcupacaoMaximaAtendivel
    );
    const globalTaxaOcupacaoParaGrafico = Math.min(
      globalOccupancy,
      globalOcupacaoMaximaAtendivel
    );

    const summary = {
      name: "Global",
      "Taxa de Ocupação": globalTaxaOcupacaoParaGrafico, // Limitada à máxima
      "Taxa de Ocupação Real": globalOccupancy, // Valor real completo
      "Taxa de Ocupação Diária": globalTaxaOcupacaoDia, // 🆕
      "Ocupação Máxima Atendível": globalOcupacaoMaximaAtendivel, // 🆕
      Ociosidade: globalOciosidade,
      Superlotação: globalSuperlotacao,
      "Capacidade Produtiva": 100,
    };

    return { data, summary };
  }, [internation]);

  console.log("🔍 GlobalTabContent - sourceData:", {
    hasInternation: !!internation,
    hasAssistance: !!assistance,
    internationLength: internation?.length,
    assistanceLength: assistance?.length,
  });

  // Verificações de segurança para evitar erros com null/undefined
  const safeInternation = internation || [];
  const safeAssistance = assistance || [];

  console.log("🔢 Dados dos setores:", {
    safeInternationLength: safeInternation.length,
    safeAssistanceLength: safeAssistance.length,
    sampleInternation: safeInternation[0],
    sampleAssistance: safeAssistance[0],
  });

  const totalStaffInternation = safeInternation.reduce(
    (acc, sector) => acc + sumStaff(sector),
    0
  );
  const amountTotalInternation = safeInternation.reduce(
    (acc, sector) => acc + parseCostUtil(sector.costAmount),
    0
  );

  const totalStaffAssistance = safeAssistance.reduce(
    (acc, sector) => acc + sumStaff(sector),
    0
  );
  const amountTotalAssistance = safeAssistance.reduce(
    (acc, sector) => acc + parseCostUtil(sector.costAmount),
    0
  );

  const totalStaff = totalStaffInternation + totalStaffAssistance;
  const amountTotal = amountTotalInternation + amountTotalAssistance;

  console.log("💰 Cálculo de Custo Total:", {
    amountTotalInternation,
    amountTotalAssistance,
    amountTotal,
    amountTotalFormatted: formatAmountBRL(amountTotal),
    typeOfAmountTotal: typeof amountTotal,
  });

  // Usar escala azul monocromática para todos (remover cores por hospital)
  const chartDataInternation: ChartData[] = safeInternation.map((item: any) => {
    const costValue = parseCostUtil(item.costAmount);

    return {
      key: item.id,
      name: item.hospitalName
        ? `${item.hospitalName} - ${item.name}`
        : item.name,
      value: costValue,
      color: generateBlueMonochromaticScale(
        costValue,
        0,
        Math.max(
          ...safeInternation.map((i) => {
            const val =
              typeof i.costAmount === "string"
                ? parseFloat(i.costAmount) || 0
                : i.costAmount || 0;
            return val;
          }),
          1
        )
      ),
    };
  });

  const chartDataAssistance: ChartData[] = safeAssistance.map((item: any) => {
    const costValue = parseCostUtil(item.costAmount);

    return {
      key: item.id,
      name: item.hospitalName
        ? `${item.hospitalName} - ${item.name}`
        : item.name,
      value: costValue,
      color: generateBlueMonochromaticScale(
        costValue,
        0,
        Math.max(
          ...safeAssistance.map((i) => {
            const val =
              typeof i.costAmount === "string"
                ? parseFloat(i.costAmount) || 0
                : i.costAmount || 0;
            return val;
          }),
          1
        )
      ),
    };
  });

  const chartDataAtual: ChartData[] = [
    ...chartDataInternation,
    ...chartDataAssistance,
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-12">
      <div className="flex gap-4">
        <InfoCard
          title="Total de Funcionários"
          value={totalStaff}
          icon={<Building size={24} />}
        />
        <InfoCard
          title="Custo Total"
          value={formatAmountBRL(amountTotal)}
          icon={<CircleDollarSign size={24} />}
        />
      </div>
      <BargraphicChart
        data={chartDataAtual}
        title="Análise de Custo por Setor"
      />
      <OccupationRateChart
        data={occupationData.data}
        summary={occupationData.summary}
        hospitalId={aggregationType ? undefined : hospitalId}
        aggregationType={aggregationType}
        entityId={entityId}
      />
      <RadarChartComponent
        data={radarData}
        title="Análise Qualitativa"
        description=""
      />
    </div>
  );
};

const TabContentInternacao: React.FC<{
  sourceData: SectorInternation[];
  radarData: ChartDataItem[];
  aggregationType?: "hospital" | "grupo" | "regiao" | "rede"; // 🆕
  entityId?: string; // 🆕
}> = ({ sourceData, radarData, aggregationType, entityId }) => {
  const [selectedSector, setSelectedSector] = useState<string>("all");

  const occupationData = useMemo(() => {
    if (!sourceData || sourceData.length === 0) {
      return {
        data: [],
        summary: {
          name: "Global",
          "Taxa de Ocupação": 0,
          "Taxa de Ocupação Diária": 0, // 🆕 Taxa média do dia
          "Ocupação Máxima Atendível": 0, // 🆕
          Ociosidade: 0,
          Superlotação: 0,
          "Capacidade Produtiva": 100,
        },
      };
    }

    // 🔥 TODO: Migrar para usar a nova API /occupation-analysis
    // Por enquanto mantém o cálculo local até a API estar pronta
    const data = sourceData.map((sector) => {
      const totalBeds = sector.bedCount || 0;
      const evaluatedBeds = sector.bedStatus?.evaluated || 0;
      const occupancyRate =
        totalBeds > 0 ? (evaluatedBeds / totalBeds) * 100 : 0;

      // TODO: Integrar com API de ocupação para obter dados reais
      // Por ora, usa a taxa de ocupação atual como taxa diária
      const ocupacaoMaximaAtendivel = 85;
      const taxaOcupacaoDia = occupancyRate; // Taxa de ocupação atual (sem variação)

      const ociosidade = Math.max(0, ocupacaoMaximaAtendivel - occupancyRate);
      const superlotacao = Math.max(0, occupancyRate - ocupacaoMaximaAtendivel);

      // Para o gráfico empilhado, a Taxa de Ocupação deve ser limitada à máxima
      const taxaOcupacaoParaGrafico = Math.min(
        occupancyRate,
        ocupacaoMaximaAtendivel
      );

      console.log(`📊 [OccupationData] ${sector.name}:`, {
        totalBeds,
        evaluatedBeds,
        occupancyRate: occupancyRate.toFixed(2) + "%",
        taxaOcupacaoDia: taxaOcupacaoDia.toFixed(2) + "%", // 🆕
        ocupacaoMaximaAtendivel: ocupacaoMaximaAtendivel.toFixed(2) + "%",
        ociosidade: ociosidade.toFixed(2) + "%",
        superlotacao: superlotacao.toFixed(2) + "%",
      });

      return {
        name: sector.name,
        "Taxa de Ocupação": taxaOcupacaoParaGrafico, // Limitada à máxima para empilhar corretamente
        "Taxa de Ocupação Real": occupancyRate, // Valor real completo
        "Taxa de Ocupação Diária": taxaOcupacaoDia, // 🆕
        "Ocupação Máxima Atendível": ocupacaoMaximaAtendivel, // 🆕
        Ociosidade: ociosidade,
        Superlotação: superlotacao,
        "Capacidade Produtiva": 100,
      };
    });

    const totalBeds = sourceData.reduce((sum, s) => sum + (s.bedCount || 0), 0);
    const totalEvaluated = sourceData.reduce(
      (sum, s) => sum + (s.bedStatus?.evaluated || 0),
      0
    );
    const globalOccupancy =
      totalBeds > 0 ? (totalEvaluated / totalBeds) * 100 : 0;

    // TODO: Integrar com API de ocupação para obter dados reais
    const globalOcupacaoMaximaAtendivel = 85;
    const globalTaxaOcupacaoDia = globalOccupancy; // Taxa de ocupação atual (sem variação)

    console.log("📊 [OccupationData] SUMMARY (Global):", {
      totalBeds,
      totalEvaluated,
      globalOccupancy: globalOccupancy.toFixed(2) + "%",
      globalTaxaOcupacaoDia: globalTaxaOcupacaoDia.toFixed(2) + "%", // 🆕
      globalOcupacaoMaximaAtendivel:
        globalOcupacaoMaximaAtendivel.toFixed(2) + "%",
      ociosidade:
        Math.max(0, globalOcupacaoMaximaAtendivel - globalOccupancy).toFixed(
          2
        ) + "%",
      superlotacao:
        Math.max(0, globalOccupancy - globalOcupacaoMaximaAtendivel).toFixed(
          2
        ) + "%",
    });

    const globalOciosidade = Math.max(
      0,
      globalOcupacaoMaximaAtendivel - globalOccupancy
    );
    const globalSuperlotacao = Math.max(
      0,
      globalOccupancy - globalOcupacaoMaximaAtendivel
    );
    const globalTaxaOcupacaoParaGrafico = Math.min(
      globalOccupancy,
      globalOcupacaoMaximaAtendivel
    );

    const summary = {
      name: "Global",
      "Taxa de Ocupação": globalTaxaOcupacaoParaGrafico, // Limitada à máxima
      "Taxa de Ocupação Real": globalOccupancy, // Valor real completo
      "Taxa de Ocupação Diária": globalTaxaOcupacaoDia, // 🆕
      "Ocupação Máxima Atendível": globalOcupacaoMaximaAtendivel, // 🆕
      Ociosidade: globalOciosidade,
      Superlotação: globalSuperlotacao,
      "Capacidade Produtiva": 100,
    };

    return { data, summary };
  }, [sourceData]);

  // Verificações de segurança para evitar erros com null/undefined
  const safeSourceData = sourceData || [];

  const detailedData = safeSourceData.filter(
    (sector) => selectedSector === "all" || sector.id === selectedSector
  );

  // Debug: verificar estrutura dos dados
  console.log("🔍 Debug Níveis de Cuidado:", {
    sourceDataLength: sourceData?.length,
    detailedDataLength: detailedData.length,
    firstSector: detailedData[0],
    careLevelStructure:
      detailedData[0]?.CareLevel || (detailedData[0] as any)?.careLevel,
  });

  const totalMinimumCare = detailedData.reduce((acc, sector) => {
    // Suportar tanto CareLevel quanto careLevel
    const careLevel = sector.CareLevel || (sector as any).careLevel;
    return acc + (careLevel?.minimumCare || 0);
  }, 0);
  const totalIntermediateCare = detailedData.reduce((acc, sector) => {
    const careLevel = sector.CareLevel || (sector as any).careLevel;
    return acc + (careLevel?.intermediateCare || 0);
  }, 0);
  const totalHighDependency = detailedData.reduce((acc, sector) => {
    const careLevel = sector.CareLevel || (sector as any).careLevel;
    return acc + (careLevel?.highDependency || 0);
  }, 0);
  const totalSemiIntensive = detailedData.reduce((acc, sector) => {
    const careLevel = sector.CareLevel || (sector as any).careLevel;
    return acc + (careLevel?.semiIntensive || 0);
  }, 0);
  const totalIntensive = detailedData.reduce((acc, sector) => {
    const careLevel = sector.CareLevel || (sector as any).careLevel;
    return acc + (careLevel?.intensive || 0);
  }, 0);

  console.log("📊 Totais de Níveis de Cuidado:", {
    totalMinimumCare,
    totalIntermediateCare,
    totalHighDependency,
    totalSemiIntensive,
    totalIntensive,
  });

  const totalBeds = detailedData.reduce(
    (acc, sector) => acc + (sector.bedCount || 0),
    0
  );
  const totalEvaluatedBeds = detailedData.reduce(
    (acc, sector) => acc + (sector.bedStatus?.evaluated || 0),
    0
  );
  const totalVacantBeds = detailedData.reduce(
    (acc, sector) => acc + (sector.bedStatus?.vacant || 0),
    0
  );
  const totalInactiveBeds = detailedData.reduce(
    (acc, sector) => acc + (sector.bedStatus?.inactive || 0),
    0
  );
  const averageOccupancyPercentage =
    totalBeds > 0 ? Math.round((totalEvaluatedBeds / totalBeds) * 100) : 0;
  const assessmentsCompletedPercentage =
    totalBeds > 0 ? Math.round((totalEvaluatedBeds / totalBeds) * 100) : 0;

  const totalStaff = detailedData.reduce(
    (acc, sector) =>
      acc +
      (sector.staff || []).reduce(
        (sum, staff) => sum + (staff.quantity || 0),
        0
      ),
    0
  );

  const amountTotal = detailedData.reduce((acc, sector) => {
    // Converter string para número - API pode retornar como string
    const amount =
      typeof sector.costAmount === "string"
        ? parseFloat(sector.costAmount) || 0
        : sector.costAmount || 0;
    return acc + amount;
  }, 0);

  const chartDataCareLevels = [
    { name: "Cuidado Mínimo", value: totalMinimumCare, color: COLORS[0] },
    {
      name: "Cuidado Intermediário",
      value: totalIntermediateCare,
      color: COLORS[1],
    },
    { name: "Alta Dependência", value: totalHighDependency, color: COLORS[2] },
    { name: "Semi-Intensivo", value: totalSemiIntensive, color: COLORS[3] },
    { name: "Intensivo", value: totalIntensive, color: COLORS[4] },
  ];

  const chartDataBedStates = [
    { name: "Leito Ocupado", value: totalEvaluatedBeds, color: COLORS[1] },
    { name: "Leito Livre", value: totalVacantBeds, color: COLORS[2] },
    { name: "Leito em Manutenção", value: totalInactiveBeds, color: COLORS[3] },
  ];

  const chartDataAtual: ChartData[] = detailedData
    ? detailedData
        .map((item: any) => {
          const costValue =
            typeof item.costAmount === "string"
              ? parseFloat(item.costAmount) || 0
              : item.costAmount || 0;

          return {
            key: item.id,
            name: item.hospitalName
              ? `${item.hospitalName} - ${item.name}`
              : item.name,
            value: costValue,
            color: generateBlueMonochromaticScale(
              costValue,
              0,
              Math.max(
                ...detailedData.map((i: any) => {
                  const val =
                    typeof i.costAmount === "string"
                      ? parseFloat(i.costAmount) || 0
                      : i.costAmount || 0;
                  return val;
                }),
                1
              )
            ),
          };
        })
        .sort((a, b) => b.value - a.value) // <--- Adicionado aqui para ordenar
    : [];

  // Passo 1: Calcular o total de funcionários por função em todos os setores filtrados.
  const staffBySectorMap: Record<string, number> = {};

  // Soma os colaboradores por setor
  detailedData.forEach((sector) => {
    let totalInSector = 0;

    // Verificação de segurança para staff
    if (sector.staff && Array.isArray(sector.staff)) {
      sector.staff.forEach((staffMember) => {
        totalInSector += staffMember.quantity || 0;
      });
    }

    staffBySectorMap[sector.name] = totalInSector;
  });

  // Transforma em dados para gráfico
  const chartDataColaboradoresPorSetor: ChartData[] = Object.entries(
    staffBySectorMap
  ).map(([sectorName, totalQuantity], index) => ({
    key: sectorName,
    name: sectorName,
    value: totalQuantity,
    color: COLORS[index % COLORS.length],
  }));

  const staffByRoleMap: Record<string, number> = {};

  detailedData.forEach((sector) => {
    // Verificação de segurança para staff
    if (sector.staff && Array.isArray(sector.staff)) {
      sector.staff.forEach((staffMember) => {
        const { role, quantity } = staffMember;
        staffByRoleMap[role] = (staffByRoleMap[role] || 0) + (quantity || 0);
      });
    }
  });

  const chartDataColaboradoresPorFuncao: ChartData[] = Object.entries(
    staffByRoleMap
  ).map(([role, totalQuantity], index) => ({
    key: role,
    name: role,
    value: totalQuantity,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-12">
      <div className="flex gap-4">
        <InfoCard
          title="Custo Total"
          value={formatAmountBRL(amountTotal)}
          icon={<DollarSign size={24} />}
        />
        <InfoCard
          title="Total de Funcionários"
          value={totalStaff}
          icon={<Users size={24} />}
        />
        <InfoCard
          title="Total de Leitos"
          value={totalBeds}
          icon={<Building size={24} />}
        />
        <InfoCard
          title="Taxa de Ocupação"
          value={`${averageOccupancyPercentage}%`}
          icon={<Building size={24} />}
        />
        {/* <InfoCard title="Avaliações Completas" value={`${assessmentsCompletedPercentage}%`} icon={<Users size={24} />} /> */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Selecione o Setor
          </label>
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um setor..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Setores</SelectItem>
              {sourceData.map((sector) => (
                <SelectItem key={sector.id} value={sector.id}>
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PieChartComp data={chartDataCareLevels} title="Níveis de Cuidado" />
        <PieChartComp data={chartDataBedStates} title="Estados dos Leitos" />
        <PieChartComp
          data={chartDataColaboradoresPorSetor}
          title="Nº de colaboradores por unidade"
          labelType="value"
        />
        <PieChartComp
          data={chartDataColaboradoresPorFuncao}
          title="Nº de colaboradores por função"
          labelType="value"
        />
      </div>
      <OccupationRateChart
        data={occupationData.data}
        summary={occupationData.summary}
        showViewSelector={false}
        aggregationType={aggregationType}
        entityId={entityId}
      />
      {selectedSector === "all" && (
        <BargraphicChart
          data={chartDataAtual}
          title="Análise de Custo por Setor"
        />
      )}

      <RadarChartComponent
        data={radarData}
        title="Análise Qualitativa"
        description=""
      />
    </div>
  );
};
const TabContentNoInternacao: React.FC<{
  sourceData: SectorAssistance[];
  radarData: ChartDataItem[];
}> = ({ sourceData, radarData }) => {
  const [selectedSector, setSelectedSector] = useState<string>("all");

  // Verificações de segurança para evitar erros com null/undefined
  const safeSourceData = sourceData || [];

  const detailedData = safeSourceData.filter(
    (sector) => selectedSector === "all" || sector.id === selectedSector
  );

  const totalStaff = detailedData.reduce(
    (acc, sector) =>
      acc +
      (sector.staff || []).reduce(
        (sum, staff) => sum + (staff.quantity || 0),
        0
      ),
    0
  );

  const amountTotal = detailedData.reduce((acc, sector) => {
    // Converter string para número - API pode retornar como string
    const amount =
      typeof sector.costAmount === "string"
        ? parseFloat(sector.costAmount) || 0
        : sector.costAmount || 0;
    return acc + amount;
  }, 0);

  const chartDataAtual: ChartData[] = detailedData
    ? detailedData
        .map((item: any) => {
          const costValue =
            typeof item.costAmount === "string"
              ? parseFloat(item.costAmount) || 0
              : item.costAmount || 0;

          return {
            key: item.id,
            name: item.hospitalName
              ? `${item.hospitalName} - ${item.name}`
              : item.name,
            value: costValue,
            color: generateBlueMonochromaticScale(
              costValue,
              0,
              Math.max(
                ...detailedData.map((i: any) => {
                  const val =
                    typeof i.costAmount === "string"
                      ? parseFloat(i.costAmount) || 0
                      : i.costAmount || 0;
                  return val;
                }),
                1
              )
            ),
          };
        })
        .sort((a, b) => b.value - a.value) // <--- Adicionado aqui para ordenar
    : [];

  // Passo 1: Calcular o total de funcionários por função em todos os setores filtrados.
  const staffBySectorMap: Record<string, number> = {};

  // Soma os colaboradores por setor
  detailedData.forEach((sector) => {
    let totalInSector = 0;

    // Verificação de segurança para staff
    if (sector.staff && Array.isArray(sector.staff)) {
      sector.staff.forEach((staffMember) => {
        totalInSector += staffMember.quantity || 0;
      });
    }

    staffBySectorMap[sector.name] = totalInSector;
  });

  // Transforma em dados para gráfico
  const chartDataColaboradoresPorSetor: ChartData[] = Object.entries(
    staffBySectorMap
  ).map(([sectorName, totalQuantity], index) => ({
    key: sectorName,
    name: sectorName,
    value: totalQuantity,
    color: COLORS[index % COLORS.length],
  }));

  const staffByRoleMap: Record<string, number> = {};

  detailedData.forEach((sector) => {
    // Verificação de segurança para staff
    if (sector.staff && Array.isArray(sector.staff)) {
      sector.staff.forEach((staffMember) => {
        const { role, quantity } = staffMember;
        staffByRoleMap[role] = (staffByRoleMap[role] || 0) + (quantity || 0);
      });
    }
  });

  const chartDataColaboradoresPorFuncao: ChartData[] = Object.entries(
    staffByRoleMap
  ).map(([role, totalQuantity], index) => ({
    key: role,
    name: role,
    value: totalQuantity,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-12">
      <div className="flex gap-4">
        <InfoCard
          title="Total de Funcionários"
          value={totalStaff}
          icon={<Building size={24} />}
        />
        <InfoCard
          title="Custo Total"
          value={formatAmountBRL(amountTotal)}
          icon={<CircleDollarSign size={24} />}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Selecione o Setor
          </label>
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um setor..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Setores</SelectItem>
              {sourceData.map((sector) => (
                <SelectItem key={sector.id} value={sector.id}>
                  {sector.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PieChartComp
          data={chartDataColaboradoresPorSetor}
          title="Nº de colaboradores"
          labelType="value"
        />
        <PieChartComp
          data={chartDataColaboradoresPorFuncao}
          title="Nº de colaboradores por função"
          labelType="value"
        />
      </div>
      {selectedSector === "all" && (
        <BargraphicChart
          data={chartDataAtual}
          title="Análise de Custo por Setor"
        />
      )}
      <RadarChartComponent
        data={radarData}
        title="Análise Qualitativa"
        description=""
      />
    </div>
  );
};

export const DashboardAtualScreen: React.FC<DashboardAtualScreenProps> = (
  props
) => {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [chartDataAtual, setChartDataAtual] = useState<HospitalSector | null>(
    null
  );
  const [radarData, setRadarData] = useState<ChartDataItem[]>([]);
  const [activeTab, setActiveTab] = useState("global"); // Valor inicial 'global'

  console.log("🔵 DashboardAtualScreen montado", {
    hospitalId,
    title: props.title,
    hasExternalData: !!props.externalData,
    isGlobalView: props.isGlobalView,
    aggregationType: props.aggregationType, // 🆕 Log agregação
    entityId: props.entityId, // 🆕 Log entity ID
  });

  const loadData = async () => {
    console.log("🔄 loadData iniciado", {
      activeTab,
      hospitalId,
      isGlobalView: props.isGlobalView,
      hasExternalData: !!props.externalData,
    });

    let dashboardData: HospitalSector | null = null;

    // Se tem dados externos (visão global), usa eles
    if (props.isGlobalView && props.externalData) {
      console.log("🌍 Usando dados externos (Global View)", props.externalData);
      // Normalize several possible shapes:
      // - Array of entities (items) => we expect a single HospitalSector-like object
      // - Object with .items (array of entities) => concatenate sectors
      // - Object with internation/assistance directly => use as-is
      const ext = props.externalData;
      if (Array.isArray(ext)) {
        // It's an array of entities: concat their sectors
        const allIntern: any[] = [];
        const allAssist: any[] = [];
        ext.forEach((entity) => {
          if (Array.isArray(entity.internation))
            allIntern.push(...entity.internation);
          if (Array.isArray(entity.assistance))
            allAssist.push(...entity.assistance);
        });
        dashboardData = {
          internation: allIntern,
          assistance: allAssist,
        } as HospitalSector;
      } else if (ext.items && Array.isArray(ext.items)) {
        const allIntern: any[] = [];
        const allAssist: any[] = [];
        ext.items.forEach((item: any) => {
          if (Array.isArray(item.internation))
            allIntern.push(...item.internation);
          if (Array.isArray(item.assistance))
            allAssist.push(...item.assistance);
        });
        dashboardData = {
          internation: allIntern,
          assistance: allAssist,
        } as HospitalSector;
      } else if (ext.internation || ext.assistance) {
        dashboardData = {
          internation: ext.internation || [],
          assistance: ext.assistance || [],
        } as HospitalSector;
      } else {
        // fallback: try to use as-is, but ensure keys exist
        dashboardData = { internation: [], assistance: [] } as HospitalSector;
      }
    } else {
      // Senão, busca dados normalmente por hospitalId
      console.log("🏥 Buscando dados por hospitalId", hospitalId);

      dashboardData = await getAllHospitalSectors(hospitalId);
      console.log("✅ Dados buscados da API:", dashboardData);
    }

    const tipo = activeTab === "internacao" ? "Internacao" : "NaoInternacao";
    const chartData =
      activeTab === "global"
        ? calcularPerformanceParaGrafico()
        : calcularPerformanceParaGrafico({ tipo: tipo });

    console.log("✅ Dados iniciais carregados:", {
      dashboardData,
      chartData,
      hasInternation: dashboardData?.internation?.length,
      hasAssistance: dashboardData?.assistance?.length,
    });

    setChartDataAtual(dashboardData);
    setRadarData(chartData);
  };

  useEffect(() => {
    console.log("🟢 useEffect inicial disparado");
    loadData();
  }, []);

  useEffect(() => {
    console.log("🟡 useEffect activeTab disparado", { activeTab });
    loadData();
  }, [activeTab]);

  console.log("🔵 Renderizando DashboardAtualScreen", {
    chartDataAtual: !!chartDataAtual,
    radarDataLength: radarData.length,
  });

  return (
    <>
      {chartDataAtual ? (
        <>
          {/* Card Principal do Dashboard */}
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle>{props.title}</CardTitle>
              <CardDescription>Análise de desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              {/* 3. Adicione `onValueChange` para atualizar o estado da aba */}
              <Tabs
                defaultValue="global"
                className="w-full"
                onValueChange={(value) => setActiveTab(value)}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="global">Global</TabsTrigger>
                  <TabsTrigger value="internacao">
                    Unid. de Internação
                  </TabsTrigger>
                  <TabsTrigger value="nao-internacao">
                    Unidades de Não Internação
                  </TabsTrigger>
                </TabsList>

                {/* O conteúdo das abas permanece o mesmo */}
                <TabsContent value="global" className="mt-4">
                  <GlobalTabContent
                    sourceData={chartDataAtual}
                    radarData={radarData}
                    hospitalId={hospitalId}
                    aggregationType={props.aggregationType}
                    entityId={props.entityId}
                  />
                </TabsContent>
                <TabsContent value="internacao" className="mt-4">
                  <TabContentInternacao
                    sourceData={chartDataAtual?.internation}
                    radarData={radarData}
                    aggregationType={props.aggregationType}
                    entityId={props.entityId}
                  />
                </TabsContent>
                <TabsContent value="nao-internacao" className="mt-4">
                  <TabContentNoInternacao
                    sourceData={chartDataAtual?.assistance}
                    radarData={radarData}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Carregando dados do dashboard...
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
};

interface ChartData {
  [key: string]: string | number | undefined;
  name: string;
  value: number;
  color?: string;
}
