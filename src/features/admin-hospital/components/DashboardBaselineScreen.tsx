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
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CircleDollarSign,
} from "lucide-react";
import RadarChartComponent from "./graphicsComponents/RadarChart";
import { calcularPerformanceParaGrafico } from "@/mocks/filterMocksRadar";

import { PieChartComp } from "./graphicsComponents/PieChartComp";
import { HorizontalBarChartComp } from "./graphicsComponents/HorizontalBarChartComp";
import BargraphicChart from "./graphicsComponents/BarChartComp";
import {
  COLORS,
  generateMultiColorScale,
  generateBlueMonochromaticScale,
} from "@/lib/generateMultiColorScale";
import { formatAmountBRL } from "@/lib/utils";
import {
  parseCost as parseCostUtil,
  getStaffArray,
  sumStaff,
} from "@/lib/dataUtils";
import { HospitalSector } from "@/mocks/functionSectores";
import { SectorInternation } from "@/mocks/internationDatabase";
import { SectorAssistance } from "@/mocks/noInternationDatabase";

import { getAllSnapshotHospitalSectors } from "@/mocks/snapshotSectores";
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

interface DashboardBaselineScreenProps {
  title: string;
  externalData?: any;
  isGlobalView?: boolean;
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
}> = ({ sourceData, radarData }) => {
  const internation = sourceData?.internation || [];
  const assistance = sourceData?.assistance || [];

  const totalStaffInternation = internation.reduce(
    (acc, sector) => acc + sumStaff(sector),
    0
  );
  const amountTotalInternation = internation.reduce(
    (acc, sector) => acc + parseCostUtil(sector.costAmount),
    0
  );

  const totalStaffAssistance = assistance.reduce(
    (acc, sector) => acc + sumStaff(sector),
    0
  );
  const amountTotalAssistance = assistance.reduce(
    (acc, sector) => acc + parseCostUtil(sector.costAmount),
    0
  );

  const totalStaff = totalStaffInternation + totalStaffAssistance;
  const amountTotal = amountTotalInternation + amountTotalAssistance;

  const chartDataInternation: ChartData[] = internation
    ? internation.map((item) => ({
        key: item.id,
        name: item.name,
        value: parseCostUtil(item.costAmount),
        color: generateBlueMonochromaticScale(
          parseCostUtil(item.costAmount),
          0,
          Math.max(...internation.map((i) => parseCostUtil(i.costAmount)))
        ),
      }))
    : [];

  const chartDataAssistance: ChartData[] = assistance
    ? assistance.map((item) => ({
        key: item.id,
        name: item.name,
        value: parseCostUtil(item.costAmount),
        color: generateBlueMonochromaticScale(
          parseCostUtil(item.costAmount),
          0,
          Math.max(...assistance.map((i) => parseCostUtil(i.costAmount)))
        ),
      }))
    : [];

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
}> = ({ sourceData, radarData }) => {
  const [selectedSector, setSelectedSector] = useState<string>("all");

  const detailedData = sourceData.filter(
    (sector) => selectedSector === "all" || sector.id === selectedSector
  );

  const totalMinimumCare = detailedData.reduce((acc, sector) => {
    const careLevel = sector.CareLevel || (sector as any).careLevel || {};
    return acc + (careLevel?.minimumCare || 0);
  }, 0);
  const totalIntermediateCare = detailedData.reduce((acc, sector) => {
    const careLevel = sector.CareLevel || (sector as any).careLevel || {};
    return acc + (careLevel?.intermediateCare || 0);
  }, 0);
  const totalHighDependency = detailedData.reduce((acc, sector) => {
    const careLevel = sector.CareLevel || (sector as any).careLevel || {};
    return acc + (careLevel?.highDependency || 0);
  }, 0);
  const totalSemiIntensive = detailedData.reduce((acc, sector) => {
    const careLevel = sector.CareLevel || (sector as any).careLevel || {};
    return acc + (careLevel?.semiIntensive || 0);
  }, 0);
  const totalIntensive = detailedData.reduce((acc, sector) => {
    const careLevel = sector.CareLevel || (sector as any).careLevel || {};
    return acc + (careLevel?.intensive || 0);
  }, 0);

  // Calcular totais usando dados do dimensionamento quando disponível
  const totalBedsDia = detailedData.reduce((acc, sector) => {
    const dimensionamento = (sector as any).projetadoFinal?.dimensionamento;
    return acc + (dimensionamento?.totalLeitosDia || 0);
  }, 0);

  const totalOccupiedBeds = detailedData.reduce((acc, sector) => {
    const dimensionamento = (sector as any).projetadoFinal?.dimensionamento;
    return (
      acc +
      (dimensionamento?.leitosOcupados || sector.bedStatus?.evaluated || 0)
    );
  }, 0);

  const totalVacantBeds = detailedData.reduce((acc, sector) => {
    const dimensionamento = (sector as any).projetadoFinal?.dimensionamento;
    return (
      acc + (dimensionamento?.leitosVagos || sector.bedStatus?.vacant || 0)
    );
  }, 0);

  const totalInactiveBeds = detailedData.reduce((acc, sector) => {
    const dimensionamento = (sector as any).projetadoFinal?.dimensionamento;
    return (
      acc + (dimensionamento?.leitosInativos || sector.bedStatus?.inactive || 0)
    );
  }, 0);

  // Não avaliados = totalLeitosDia - (ocupados + vagos + inativos)
  const totalUnevaluatedBeds = Math.max(
    0,
    totalBedsDia - (totalOccupiedBeds + totalVacantBeds + totalInactiveBeds)
  );

  const totalBeds = detailedData.reduce((acc, sector) => {
    const dimensionamento = (sector as any).projetadoFinal?.dimensionamento;
    return acc + (dimensionamento?.totalLeitos || sector.bedCount || 0);
  }, 0);

  const averageOccupancyPercentage =
    totalBeds > 0 ? Math.round((totalOccupiedBeds / totalBeds) * 100) : 0;
  const assessmentsCompletedPercentage =
    totalBeds > 0 ? Math.round((totalOccupiedBeds / totalBeds) * 100) : 0;

  const totalStaff = detailedData.reduce(
    (acc, sector) => acc + sumStaff(sector),
    0
  );
  const amountTotal = detailedData.reduce(
    (acc, sector) => acc + parseCostUtil(sector.costAmount),
    0
  );

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
    { name: "Leitos Ocupados", value: totalOccupiedBeds, color: COLORS[0] },
    { name: "Leitos Vagos", value: totalVacantBeds, color: COLORS[1] },
    { name: "Leitos Inativos", value: totalInactiveBeds, color: COLORS[2] },
    { name: "Não Avaliados", value: totalUnevaluatedBeds, color: COLORS[3] },
  ];

  console.log("📊 [Gráfico Rosca - Estados dos Leitos]", {
    totalBedsDia,
    totalOccupiedBeds,
    totalVacantBeds,
    totalInactiveBeds,
    totalUnevaluatedBeds,
    chartData: chartDataBedStates,
  });

  const chartDataAtual: ChartData[] = detailedData
    ? detailedData
        .map((item) => ({
          key: item.id,
          name: item.name,
          value: parseCostUtil(item.costAmount),
          color: generateBlueMonochromaticScale(
            parseCostUtil(item.costAmount),
            0,
            Math.max(...detailedData.map((i) => parseCostUtil(i.costAmount)))
          ),
        }))
        .sort((a, b) => b.value - a.value) // <--- Adicionado aqui para ordenar
    : [];

  const staffBySectorMap: Record<string, number> = {};

  // Soma os colaboradores por setor (seguro para staff nulo)
  detailedData.forEach((sector) => {
    let totalInSector = 0;
    const staffArr = getStaffArray(sector);
    staffArr.forEach((staffMember) => {
      totalInSector += staffMember.quantity || 0;
    });
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
    const staffArr = getStaffArray(sector);
    staffArr.forEach((staffMember) => {
      const { role, quantity } = staffMember;
      staffByRoleMap[role] = (staffByRoleMap[role] || 0) + (quantity || 0);
    });
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PieChartComp data={chartDataCareLevels} title="Níveis de Cuidado" />
        <PieChartComp
          data={chartDataBedStates}
          title="Estados dos Leitos"
          totalForPercent={totalBedsDia}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <HorizontalBarChartComp
          data={chartDataColaboradoresPorSetor}
          title="Nº de colaboradores"
        />
        <HorizontalBarChartComp
          data={chartDataColaboradoresPorFuncao}
          title="Nº de colaboradores por função"
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
const TabContentNoInternacao: React.FC<{
  sourceData: SectorAssistance[];
  radarData: ChartDataItem[];
}> = ({ sourceData, radarData }) => {
  const [selectedSector, setSelectedSector] = useState<string>("all");

  const detailedData = sourceData.filter(
    (sector) => selectedSector === "all" || sector.id === selectedSector
  );

  const totalStaff = detailedData.reduce(
    (acc, sector) => acc + sumStaff(sector),
    0
  );
  const amountTotal = detailedData.reduce(
    (acc, sector) => acc + parseCostUtil(sector.costAmount),
    0
  );

  const chartDataAtual: ChartData[] = detailedData
    ? detailedData
        .map((item) => ({
          key: item.id,
          name: item.name,
          value: parseCostUtil(item.costAmount),
          color: generateBlueMonochromaticScale(
            parseCostUtil(item.costAmount),
            0,
            Math.max(...detailedData.map((i) => parseCostUtil(i.costAmount)))
          ),
        }))
        .sort((a, b) => b.value - a.value) // <--- Adicionado aqui para ordenar
    : [];

  // Passo 1: Calcular o total de funcionários por função em todos os setores filtrados.
  const staffBySectorMap: Record<string, number> = {};

  // Soma os colaboradores por setor
  detailedData.forEach((sector) => {
    let totalInSector = 0;
    const staffArr = getStaffArray(sector);
    staffArr.forEach((staffMember) => {
      totalInSector += staffMember.quantity || 0;
    });
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
    const staffArr = getStaffArray(sector);
    staffArr.forEach((staffMember) => {
      const { role, quantity } = staffMember;
      staffByRoleMap[role] = (staffByRoleMap[role] || 0) + (quantity || 0);
    });
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <HorizontalBarChartComp
          data={chartDataColaboradoresPorSetor}
          title="Nº de colaboradores por Setor"
        />
        <HorizontalBarChartComp
          data={chartDataColaboradoresPorFuncao}
          title="Nº de colaboradores por função"
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

export const DashboardBaselineScreen: React.FC<DashboardBaselineScreenProps> = (
  props
) => {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [chartDataAtual, setChartDataAtual] = useState<HospitalSector | null>(
    null
  );
  const [radarData, setRadarData] = useState<ChartDataItem[]>([]);
  const [activeTab, setActiveTab] = useState("global"); // Valor inicial 'global'
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!hospitalId && !(props.isGlobalView && props.externalData)) {
      console.warn(
        "⚠️ Hospital ID não encontrado na URL e não é visão global com externalData, abortando loadData"
      );
      setLoading(false);
      return;
    }
    if (!hospitalId && props.isGlobalView && props.externalData) {
    }

    try {
      setLoading(true);
      let dashboardData: any;
      if (props.isGlobalView && props.externalData) {
        // Normalize: externalData may be aggregated (items array) or single object with internation/assistance
        if (Array.isArray(props.externalData)) {
          const allIntern: any[] = [];
          const allAssist: any[] = [];
          props.externalData.forEach((it: any) => {
            if (Array.isArray(it.internation))
              allIntern.push(...it.internation);
            if (Array.isArray(it.assistance)) allAssist.push(...it.assistance);
          });

          dashboardData = { internation: allIntern, assistance: allAssist };
        } else if (
          props.externalData.items &&
          Array.isArray(props.externalData.items)
        ) {
          const allIntern: any[] = [];
          const allAssist: any[] = [];
          props.externalData.items.forEach((it: any) => {
            if (Array.isArray(it.internation))
              allIntern.push(...it.internation);
            if (Array.isArray(it.assistance)) allAssist.push(...it.assistance);
          });

          dashboardData = { internation: allIntern, assistance: allAssist };
        } else if (
          props.externalData.internation ||
          props.externalData.assistance
        ) {
          dashboardData = {
            internation: props.externalData.internation || [],
            assistance: props.externalData.assistance || [],
          };
        } else {
          dashboardData = { internation: [], assistance: [] };
        }
      } else {
        console.log(
          "📊 [Dashboard Baseline - loadData] Buscando snapshot para hospitalId: " +
            hospitalId
        );
        const snapshotData = await getAllSnapshotHospitalSectors(hospitalId); // Usa hospitalId da URL
        console.log("📊 [Dashboard Baseline - Dados carregados]", snapshotData);
        dashboardData = snapshotData;
      }
      const tipo = activeTab === "internacao" ? "Internacao" : "NaoInternacao";
      const chartData =
        activeTab === "global"
          ? calcularPerformanceParaGrafico()
          : calcularPerformanceParaGrafico({ tipo: tipo });

      setChartDataAtual(dashboardData);
      setRadarData(chartData);
    } catch (error) {
      console.error("❌ Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hospitalId]);

  useEffect(() => {
    if (hospitalId) {
      loadData();
    }
  }, [activeTab]);
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartDataAtual) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{props.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Ainda não há baseline disponível.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {chartDataAtual && (
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
                />
              </TabsContent>
              <TabsContent value="internacao" className="mt-4">
                <TabContentInternacao
                  sourceData={chartDataAtual?.internation}
                  radarData={radarData}
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
