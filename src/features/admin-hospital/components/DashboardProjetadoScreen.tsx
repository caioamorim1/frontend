// src/features/admin-hospital/components/DashboardProjetadoScreen.tsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
import { DollarSign, Users, Building, CircleDollarSign } from "lucide-react";
import RadarChartComponent from "./graphicsComponents/RadarChart";
import { calcularPerformanceParaGrafico } from "@/mocks/filterMocksRadar";
import { PieChartComp } from "./graphicsComponents/PieChartComp";
import BargraphicChart from "./graphicsComponents/BarChartComp";
import { COLORS, generateMultiColorScale } from "@/lib/generateMultiColorScale";
import { formatAmountBRL } from "@/lib/utils";
import {
  parseCost as parseCostUtil,
  isProjectedBySitio,
  flattenProjectedBySitio,
  computeProjectedCostFromSitios,
} from "@/lib/dataUtils";
import { getHospitalProjectedSectors } from "@/lib/api";
import { InfoCard } from "./DashboardAtualScreen";

// --- ESTRUTURA DE DADOS ---
interface ChartDataItem {
  subject: string;
  atual: number;
  projetado: number;
}

interface DashboardProjetadoScreenProps {
  title: string;
  externalData?: any; // ✅ Dados externos (do GlobalDashboard)
  isGlobalView?: boolean; // ✅ Flag para visão global
}

interface ChartData {
  [key: string]: string | number | undefined;
  name: string;
  value: number;
  color?: string;
}

// ✅ Helper para pegar valores projetados (compatível com dados antigos e novos)
const getProjectedCost = (sector: any): number => {
  // Prefer explicit projectedCostAmount from backend when available
  if (
    sector &&
    sector.projectedCostAmount !== undefined &&
    sector.projectedCostAmount !== null
  ) {
    const value = parseCostUtil(sector.projectedCostAmount);
    console.log(
      `💰 getProjectedCost (projectedCostAmount) for ${sector.name}:`,
      value
    );
    return value;
  }

  // If projectedCostAmount not provided, but projectedStaff comes per-sitio with custoPorFuncionario, compute cost from sitios
  if (
    sector &&
    sector.projectedStaff &&
    isProjectedBySitio(sector.projectedStaff)
  ) {
    const fromSitios = computeProjectedCostFromSitios(sector);
    if (fromSitios > 0) {
      console.log(
        `💰 getProjectedCost (from sitios) for ${sector.name}:`,
        fromSitios
      );
      return fromSitios;
    }
    // otherwise fallthrough to costAmount
  }

  const value = parseCostUtil(sector.costAmount);

  console.log(`💰 getProjectedCost for ${sector.name}:`, {
    projectedCostAmount: sector.projectedCostAmount,
    costAmount: sector.costAmount,
    returned: value,
  });

  return value;
};

const getProjectedStaff = (
  sector: any
): Array<{ role: string; quantity: number }> => {
  if (sector && sector.projectedStaff) {
    if (isProjectedBySitio(sector.projectedStaff)) {
      const flattened = flattenProjectedBySitio(sector.projectedStaff);
      console.log(
        `👥 getProjectedStaff (flattened sitios) for ${sector.name}:`,
        flattened
      );
      return flattened.map((f) => ({ role: f.role, quantity: f.quantity }));
    }
    if (Array.isArray(sector.projectedStaff)) {
      console.log(
        `👥 getProjectedStaff (simple array) for ${sector.name}:`,
        sector.projectedStaff
      );
      return sector.projectedStaff;
    }
  }

  const staff = sector.staff || [];
  console.log(
    `👥 getProjectedStaff fallback to staff for ${sector.name}:`,
    staff
  );
  return staff;
};

interface ProjectedSector {
  id: string;
  name: string;
  entityName?: string;
  hospitalName?: string;
  costAmount: string | number;
  projectedCostAmount?: string | number;
  staff: Array<{ role: string; quantity: number }>;
  projectedStaff?: Array<{ role: string; quantity: number }>;
  bedCount?: number;
  CareLevel?: {
    minimumCare: number;
    intermediateCare: number;
    highDependency: number;
    semiIntensive: number;
    intensive: number;
  };
  bedStatus?: {
    evaluated: number;
    vacant: number;
    inactive: number;
  };
}

interface ProjectedData {
  internation: ProjectedSector[];
  assistance: ProjectedSector[];
}

// --- COMPONENTES DAS ABAS (ADAPTADOS PARA DADOS PROJETADOS REAIS) ---

const GlobalTabContent: React.FC<{
  sourceData: ProjectedData;
  radarData: ChartDataItem[];
}> = ({ sourceData, radarData }) => {
  console.log("🌍 GlobalTabContent - Recebendo dados:", sourceData);

  const { internation, assistance } = sourceData;

  console.log("📊 Internation sectors:", internation.length);
  console.log("🏥 Assistance sectors:", assistance.length);

  // ✅ Usar helper functions para compatibilidade
  const totalStaffInternation = internation.reduce(
    (acc, sector) =>
      acc +
      getProjectedStaff(sector).reduce((sum, staff) => sum + staff.quantity, 0),
    0
  );

  const amountTotalInternation = internation.reduce(
    (acc, sector) => acc + getProjectedCost(sector),
    0
  );

  const totalStaffAssistance = assistance.reduce(
    (acc, sector) =>
      acc +
      getProjectedStaff(sector).reduce((sum, staff) => sum + staff.quantity, 0),
    0
  );

  const amountTotalAssistance = assistance.reduce(
    (acc, sector) => acc + getProjectedCost(sector),
    0
  );

  const totalStaff = totalStaffInternation + totalStaffAssistance;
  const amountTotal = amountTotalInternation + amountTotalAssistance;

  console.log("📈 Totais calculados:", {
    totalStaff,
    amountTotal,
    totalStaffInternation,
    totalStaffAssistance,
    amountTotalInternation,
    amountTotalAssistance,
  });

  const chartDataInternation: ChartData[] = internation.map((item) => ({
    key: item.id,
    name: item.name,
    value: getProjectedCost(item),
    color: generateMultiColorScale(
      getProjectedCost(item),
      0,
      Math.max(...internation.map((i) => getProjectedCost(i)))
    ),
  }));

  const chartDataAssistance: ChartData[] = assistance.map((item) => ({
    key: item.id,
    name: item.name,
    value: getProjectedCost(item),
    color: generateMultiColorScale(
      getProjectedCost(item),
      0,
      Math.max(...assistance.map((i) => getProjectedCost(i)))
    ),
  }));

  const chartDataProjetado: ChartData[] = [
    ...chartDataInternation,
    ...chartDataAssistance,
  ].sort((a, b) => b.value - a.value);

  console.log("📊 Chart data preparado:", {
    internationCharts: chartDataInternation.length,
    assistanceCharts: chartDataAssistance.length,
    totalCharts: chartDataProjetado.length,
    firstItem: chartDataProjetado[0],
  });

  return (
    <div className="space-y-12">
      <div className="flex gap-4">
        <InfoCard
          title="Total de Funcionários (Projetado)"
          value={totalStaff}
          icon={<Users size={24} />}
        />
        <InfoCard
          title="Custo Total (Projetado)"
          value={formatAmountBRL(amountTotal)}
          icon={<CircleDollarSign size={24} />}
        />
      </div>
      <BargraphicChart
        data={chartDataProjetado}
        title="Análise de Custo Projetado por Setor"
      />
      <RadarChartComponent
        data={radarData}
        title="Análise de Desempenho"
        description="Comparativo entre o desempenho atual e projetado"
      />
    </div>
  );
};

const TabContentInternacao: React.FC<{
  sourceData: ProjectedSector[];
  radarData: ChartDataItem[];
}> = ({ sourceData, radarData }) => {
  console.log("🏥 TabContentInternacao - Recebendo dados:", {
    sectorsCount: sourceData.length,
    sectors: sourceData.map((s) => ({ id: s.id, name: s.name })),
  });

  const [selectedSector, setSelectedSector] = useState<string>("all");
  const detailedData = sourceData.filter(
    (sector) => selectedSector === "all" || sector.id === selectedSector
  );

  console.log("🔍 Filtro aplicado:", {
    selectedSector,
    filteredCount: detailedData.length,
  });

  const totalStaff = detailedData.reduce(
    (acc, sector) =>
      acc +
      getProjectedStaff(sector).reduce((sum, staff) => sum + staff.quantity, 0),
    0
  );

  const amountTotal = detailedData.reduce(
    (acc, sector) => acc + getProjectedCost(sector),
    0
  );

  const totalBeds = detailedData.reduce(
    (acc, sector) => acc + (sector.bedCount || 0),
    0
  );

  console.log("📊 TabContentInternacao - Totais:", {
    totalStaff,
    amountTotal,
    totalBeds,
  });

  const chartDataProjetado: ChartData[] = detailedData
    .map((item) => ({
      key: item.id,
      name: item.name,
      value: getProjectedCost(item),
      color: generateMultiColorScale(
        getProjectedCost(item),
        0,
        Math.max(...detailedData.map((i) => getProjectedCost(i)))
      ),
    }))
    .sort((a, b) => b.value - a.value);

  const staffBySectorMap: Record<string, number> = {};
  detailedData.forEach((sector) => {
    const totalInSector = getProjectedStaff(sector).reduce(
      (sum, staff) => sum + staff.quantity,
      0
    );
    staffBySectorMap[sector.name] = totalInSector;
  });

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
    getProjectedStaff(sector).forEach((staffMember) => {
      const { role, quantity } = staffMember;
      staffByRoleMap[role] = (staffByRoleMap[role] || 0) + quantity;
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

  console.log("📊 Charts preparados:", {
    chartDataProjetado: chartDataProjetado.length,
    chartDataColaboradoresPorSetor: chartDataColaboradoresPorSetor.length,
    chartDataColaboradoresPorFuncao: chartDataColaboradoresPorFuncao.length,
  });

  return (
    <div className="space-y-12">
      <div className="flex gap-4">
        <InfoCard
          title="Custo Total (Projetado)"
          value={formatAmountBRL(amountTotal)}
          icon={<DollarSign size={24} />}
        />
        <InfoCard
          title="Total de Funcionários (Projetado)"
          value={totalStaff}
          icon={<Users size={24} />}
        />
        <InfoCard
          title="Total de Leitos"
          value={totalBeds}
          icon={<Building size={24} />}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PieChartComp
          data={chartDataColaboradoresPorSetor}
          title="Colaboradores por Setor (Projetado)"
          labelType="value"
        />
        <PieChartComp
          data={chartDataColaboradoresPorFuncao}
          title="Colaboradores por Função (Projetado)"
          labelType="value"
        />
      </div>
      <BargraphicChart
        data={chartDataProjetado}
        title="Análise de Custo Projetado por Setor"
      />
      <RadarChartComponent
        data={radarData}
        title="Análise de Desempenho"
        description="Comparativo entre o desempenho atual e projetado"
      />
    </div>
  );
};

const TabContentNoInternacao: React.FC<{
  sourceData: ProjectedSector[];
  radarData: ChartDataItem[];
}> = ({ sourceData, radarData }) => {
  console.log("🏢 TabContentNoInternacao - Recebendo dados:", {
    sectorsCount: sourceData.length,
    sectors: sourceData.map((s) => ({ id: s.id, name: s.name })),
  });

  const [selectedSector, setSelectedSector] = useState<string>("all");
  const detailedData = sourceData.filter(
    (sector) => selectedSector === "all" || sector.id === selectedSector
  );

  const totalStaff = detailedData.reduce(
    (acc, sector) =>
      acc +
      getProjectedStaff(sector).reduce((sum, staff) => sum + staff.quantity, 0),
    0
  );

  const amountTotal = detailedData.reduce(
    (acc, sector) => acc + getProjectedCost(sector),
    0
  );

  console.log("📊 TabContentNoInternacao - Totais:", {
    totalStaff,
    amountTotal,
  });

  const chartDataProjetado: ChartData[] = detailedData
    .map((item) => ({
      key: item.id,
      name: item.name,
      value: getProjectedCost(item),
      color: generateMultiColorScale(
        getProjectedCost(item),
        0,
        Math.max(...detailedData.map((i) => getProjectedCost(i)))
      ),
    }))
    .sort((a, b) => b.value - a.value);

  const staffBySectorMap: Record<string, number> = {};
  detailedData.forEach((sector) => {
    const totalInSector = getProjectedStaff(sector).reduce(
      (sum, staff) => sum + staff.quantity,
      0
    );
    staffBySectorMap[sector.name] = totalInSector;
  });

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
    getProjectedStaff(sector).forEach((staffMember) => {
      const { role, quantity } = staffMember;
      staffByRoleMap[role] = (staffByRoleMap[role] || 0) + quantity;
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
          title="Total de Funcionários (Projetado)"
          value={totalStaff}
          icon={<Users size={24} />}
        />
        <InfoCard
          title="Custo Total (Projetado)"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PieChartComp
          data={chartDataColaboradoresPorSetor}
          title="Colaboradores por Setor (Projetado)"
          labelType="value"
        />
        <PieChartComp
          data={chartDataColaboradoresPorFuncao}
          title="Colaboradores por Função (Projetado)"
          labelType="value"
        />
      </div>
      <BargraphicChart
        data={chartDataProjetado}
        title="Análise de Custo Projetado por Setor"
      />
      <RadarChartComponent
        data={radarData}
        title="Análise de Desempenho"
        description="Comparativo entre o desempenho atual e projetado"
      />
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const DashboardProjetadoScreen: React.FC<
  DashboardProjetadoScreenProps
> = (props) => {
  console.log("🎯 DashboardProjetadoScreen - Props recebidas:", {
    title: props.title,
    hasExternalData: !!props.externalData,
    isGlobalView: props.isGlobalView,
    externalDataPreview: props.externalData
      ? {
          keys: Object.keys(props.externalData),
          hasItems: !!props.externalData.items,
          itemsKeys: props.externalData.items
            ? Object.keys(props.externalData.items)
            : [],
        }
      : null,
  });

  const [chartData, setChartData] = useState<ProjectedData | null>(null);
  const [radarData, setRadarData] = useState<ChartDataItem[]>([]);
  const [activeTab, setActiveTab] = useState("global");

  const { hospitalId } = useParams<{ hospitalId: string }>();

  console.log("🏥 HospitalId da URL:", hospitalId);

  const loadData = async () => {
    try {
      console.log("⏳ Iniciando loadData...");
      console.log("📋 Condições:", {
        isGlobalView: props.isGlobalView,
        hasExternalData: !!props.externalData,
      });

      // ✅ Se for visão global, usar externalData
      if (props.isGlobalView && props.externalData) {
        console.log("🔮 Usando dados externos (Global View)");
        console.log("📦 External Data completo:", props.externalData);

        let transformedData: ProjectedData;

        if (
          props.externalData.items &&
          Array.isArray(props.externalData.items)
        ) {
          console.log("📂 Dados têm estrutura .items (Array)");
          console.log(
            "📦 Items é um array com",
            props.externalData.items.length,
            "elementos"
          );

          // ✅ CORREÇÃO: items é um ARRAY de regiões/redes/grupos/hospitais
          // Cada elemento tem internation e assistance
          // Precisamos CONCATENAR todos os setores

          const allInternation: ProjectedSector[] = [];
          const allAssistance: ProjectedSector[] = [];

          props.externalData.items.forEach((item: any, index: number) => {
            console.log(`📦 Processando item ${index}:`, {
              id: item.id,
              name: item.name,
              internationCount: item.internation?.length || 0,
              assistanceCount: item.assistance?.length || 0,
            });

            if (item.internation && Array.isArray(item.internation)) {
              console.log(
                `  ➕ Adicionando ${item.internation.length} setores de internação`
              );
              allInternation.push(...item.internation);
            }

            if (item.assistance && Array.isArray(item.assistance)) {
              console.log(
                `  ➕ Adicionando ${item.assistance.length} setores de assistência`
              );
              allAssistance.push(...item.assistance);
            }
          });

          transformedData = {
            internation: allInternation,
            assistance: allAssistance,
          };

          console.log("✅ Dados transformados (CONCATENADOS):", {
            internationCount: transformedData.internation.length,
            assistanceCount: transformedData.assistance.length,
            internationSample: transformedData.internation[0],
            assistanceSample: transformedData.assistance[0],
          });
        } else if (
          props.externalData.internation &&
          props.externalData.assistance
        ) {
          console.log(
            "📂 Dados já no formato correto (com internation/assistance direto)"
          );
          transformedData = {
            internation: props.externalData.internation,
            assistance: props.externalData.assistance,
          };
        } else {
          console.log(
            "📂 Dados em formato desconhecido, tentando usar diretamente"
          );
          transformedData = props.externalData;
        }

        console.log("💾 Setando chartData com:", transformedData);
        setChartData(transformedData);
      } else {
        console.log("🏥 Carregando dados projetados do hospital:", hospitalId);
        const resp = await getHospitalProjectedSectors(hospitalId);
        console.log("� Resposta /projected:", resp);

        let transformed: ProjectedData = { internation: [], assistance: [] };

        if (resp.items && Array.isArray(resp.items)) {
          // items is an array of regions/hospitals/groups that contain internation/assistance
          const allInternation: ProjectedSector[] = [];
          const allAssistance: ProjectedSector[] = [];

          resp.items.forEach((item: any, idx: number) => {
            if (item.internation && Array.isArray(item.internation)) {
              allInternation.push(...item.internation);
            }
            if (item.assistance && Array.isArray(item.assistance)) {
              allAssistance.push(...item.assistance);
            }
          });

          transformed = {
            internation: allInternation,
            assistance: allAssistance,
          };
        } else if (resp.internation || resp.assistance) {
          transformed = {
            internation: resp.internation || [],
            assistance: resp.assistance || [],
          };
        }

        console.log("💾 Setando chartData do hospital (transformado):", {
          internationCount: transformed.internation.length,
          assistanceCount: transformed.assistance.length,
          sampleInternation: transformed.internation[0],
        });

        setChartData(transformed);
      }

      // ✅ Carregar dados do radar
      const tipo = activeTab === "internacao" ? "Internacao" : "NaoInternacao";
      const performanceData =
        activeTab === "global"
          ? calcularPerformanceParaGrafico()
          : calcularPerformanceParaGrafico({ tipo: tipo });

      console.log("📊 Radar data:", performanceData);
      setRadarData(performanceData);

      console.log("✅ LoadData concluído com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      console.error("Stack trace:", error);
    }
  };

  useEffect(() => {
    console.log("🔄 useEffect disparado - Dependências:", {
      activeTab,
      hospitalId,
      hasExternalData: !!props.externalData,
      isGlobalView: props.isGlobalView,
    });
    loadData();
  }, [activeTab, hospitalId, props.externalData, props.isGlobalView]);

  console.log("🎨 Estado atual do componente:", {
    hasChartData: !!chartData,
    chartDataPreview: chartData
      ? {
          internationCount: chartData.internation.length,
          assistanceCount: chartData.assistance.length,
        }
      : null,
    hasRadarData: radarData.length > 0,
    activeTab,
  });

  return (
    <>
      {chartData ? (
        <>
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle>{props.title}</CardTitle>
              <CardDescription>
                Análise de desempenho projetado
                {props.isGlobalView && " - Visão Global"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="global"
                className="w-full"
                onValueChange={(value) => {
                  console.log("🔄 Mudando tab para:", value);
                  setActiveTab(value);
                }}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="global">Global</TabsTrigger>
                  <TabsTrigger value="internacao">
                    Unid. de Internação
                  </TabsTrigger>
                  <TabsTrigger value="nao-internacao">
                    Setores Assistenciais
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="global" className="mt-4">
                  <GlobalTabContent
                    sourceData={chartData}
                    radarData={radarData}
                  />
                </TabsContent>
                <TabsContent value="internacao" className="mt-4">
                  <TabContentInternacao
                    sourceData={chartData.internation}
                    radarData={radarData}
                  />
                </TabsContent>
                <TabsContent value="nao-internacao" className="mt-4">
                  <TabContentNoInternacao
                    sourceData={chartData.assistance}
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
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">
                Carregando dados projetados...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
