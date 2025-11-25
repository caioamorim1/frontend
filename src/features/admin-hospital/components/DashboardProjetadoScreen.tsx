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
import { getCompletedEvaluationsWithCategories } from "@/lib/api";
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
      return fromSitios;
    }
    // otherwise fallthrough to costAmount
  }

  const value = parseCostUtil(sector.costAmount);

  return value;
};

const getProjectedStaff = (
  sector: any
): Array<{ role: string; quantity: number }> => {
  if (sector && sector.projectedStaff) {
    if (isProjectedBySitio(sector.projectedStaff)) {
      const flattened = flattenProjectedBySitio(sector.projectedStaff);

      return flattened.map((f) => ({ role: f.role, quantity: f.quantity }));
    }
    if (Array.isArray(sector.projectedStaff)) {
      return sector.projectedStaff;
    }
  }

  const staff = sector.staff || [];

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
  isGlobalView?: boolean;
}> = ({ sourceData, radarData, isGlobalView }) => {
  const { internation, assistance } = sourceData;

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

  const chartDataInternation: ChartData[] = internation.map((item) => ({
    key: item.id,
    name: item.name,
    value: getProjectedCost(item),
    color: generateBlueMonochromaticScale(
      getProjectedCost(item),
      0,
      Math.max(...internation.map((i) => getProjectedCost(i)))
    ),
  }));

  const chartDataAssistance: ChartData[] = assistance.map((item) => ({
    key: item.id,
    name: item.name,
    value: getProjectedCost(item),
    color: generateBlueMonochromaticScale(
      getProjectedCost(item),
      0,
      Math.max(...assistance.map((i) => getProjectedCost(i)))
    ),
  }));

  const chartDataProjetado: ChartData[] = [
    ...chartDataInternation,
    ...chartDataAssistance,
  ].sort((a, b) => b.value - a.value);

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
      {!isGlobalView && (
        <RadarChartComponent
          data={radarData}
          title="Análise de Desempenho"
          description="Comparativo entre o desempenho atual e projetado"
        />
      )}
    </div>
  );
};

const TabContentInternacao: React.FC<{
  sourceData: ProjectedSector[];
  radarData: ChartDataItem[];
}> = ({ sourceData, radarData }) => {
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

  const totalBeds = detailedData.reduce(
    (acc, sector) => acc + (sector.bedCount || 0),
    0
  );

  const chartDataProjetado: ChartData[] = detailedData
    .map((item) => ({
      key: item.id,
      name: item.name,
      value: getProjectedCost(item),
      color: generateBlueMonochromaticScale(
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
          title="Custo Total (Projetado)"
          value={formatAmountBRL(amountTotal)}
          icon={<DollarSign size={24} />}
        />
        <InfoCard
          title="Total de Funcionários (Projetado)"
          value={totalStaff}
          icon={<Users size={24} />}
        />
        {/* 'Total de Leitos' removido para a aba 'Unid. de Internação' conforme solicitado */}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <HorizontalBarChartComp
          data={chartDataColaboradoresPorSetor}
          title="Colaboradores por Setor (Projetado)"
        />
        <HorizontalBarChartComp
          data={chartDataColaboradoresPorFuncao}
          title="Colaboradores por Função (Projetado)"
        />
      </div>
      <BargraphicChart
        data={chartDataProjetado}
        title="Análise de Custo Projetado por Setor"
      />
      {radarData && radarData.length > 0 && (
        <RadarChartComponent
          data={radarData}
          title="Análise de Desempenho"
          description="Comparativo entre o desempenho atual e projetado"
        />
      )}
    </div>
  );
};

const TabContentNoInternacao: React.FC<{
  sourceData: ProjectedSector[];
  radarData: ChartDataItem[];
}> = ({ sourceData, radarData }) => {
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const detailedData = sourceData.filter(
    (sector) => selectedSector === "all" || sector.id === selectedSector
  );

  console.log("💰 [TabContentNoInternacao] Calculando custos:", {
    sourceDataLength: sourceData.length,
    detailedDataLength: detailedData.length,
    selectedSector,
    exemploSetor: detailedData[0],
  });

  const totalStaff = detailedData.reduce(
    (acc, sector) =>
      acc +
      getProjectedStaff(sector).reduce((sum, staff) => sum + staff.quantity, 0),
    0
  );

  const amountTotal = detailedData.reduce((acc, sector) => {
    const cost = getProjectedCost(sector);
    console.log("💰 [TabContentNoInternacao] Custo do setor:", {
      sectorId: sector.id,
      sectorName: sector.name,
      projectedCostAmount: sector.projectedCostAmount,
      costAmount: sector.costAmount,
      calculatedCost: cost,
      hasProjectedStaff: !!sector.projectedStaff,
      projectedStaff: sector.projectedStaff,
    });
    return acc + cost;
  }, 0);

  console.log("💰 [TabContentNoInternacao] Totais calculados:", {
    totalStaff,
    amountTotal,
    formatado: formatAmountBRL(amountTotal),
  });

  const chartDataProjetado: ChartData[] = detailedData
    .map((item) => ({
      key: item.id,
      name: item.name,
      value: getProjectedCost(item),
      color: generateBlueMonochromaticScale(
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <HorizontalBarChartComp
          data={chartDataColaboradoresPorSetor}
          title="Colaboradores por Setor (Projetado)"
        />
        <HorizontalBarChartComp
          data={chartDataColaboradoresPorFuncao}
          title="Colaboradores por Função (Projetado)"
        />
      </div>
      <BargraphicChart
        data={chartDataProjetado}
        title="Análise de Custo Projetado por Setor"
      />
      {radarData && radarData.length > 0 && (
        <RadarChartComponent
          data={radarData}
          title="Análise de Desempenho"
          description="Comparativo entre o desempenho atual e projetado"
        />
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const DashboardProjetadoScreen: React.FC<
  DashboardProjetadoScreenProps
> = (props) => {
  const [chartData, setChartData] = useState<ProjectedData | null>(null);
  const [radarData, setRadarData] = useState<ChartDataItem[]>([]);
  const [activeTab, setActiveTab] = useState("global");

  const { hospitalId } = useParams<{ hospitalId: string }>();

  const loadData = async () => {
    try {
      // ✅ Se for visão global, usar externalData
      if (props.isGlobalView && props.externalData) {
        let transformedData: ProjectedData;

        if (
          props.externalData.items &&
          Array.isArray(props.externalData.items)
        ) {
          // ✅ CORREÇÃO: items é um ARRAY de regiões/redes/grupos/hospitais
          // Cada elemento tem internation e assistance
          // Precisamos CONCATENAR todos os setores

          const allInternation: ProjectedSector[] = [];
          const allAssistance: ProjectedSector[] = [];

          props.externalData.items.forEach((item: any, index: number) => {
            if (item.internation && Array.isArray(item.internation)) {
              allInternation.push(...item.internation);
            }

            if (item.assistance && Array.isArray(item.assistance)) {
              allAssistance.push(...item.assistance);
            }
          });

          transformedData = {
            internation: allInternation,
            assistance: allAssistance,
          };
        } else if (
          props.externalData.internation &&
          props.externalData.assistance
        ) {
          transformedData = {
            internation: props.externalData.internation,
            assistance: props.externalData.assistance,
          };
        } else {
          transformedData = props.externalData;
        }

        console.log("📊 [DashboardProjetado] Dados externos (Global View):", {
          externalData: props.externalData,
          transformedData,
        });
        setChartData(transformedData);
      } else {
        const resp = await getHospitalProjectedSectors(hospitalId);
        console.log("📊 [DashboardProjetado] Resposta da API:", {
          hospitalId,
          response: resp,
          hasItems: !!resp.items,
          itemsLength: resp.items?.length,
          hasInternation: !!resp.internation,
          hasAssistance: !!resp.assistance,
        });

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

        console.log("📊 [DashboardProjetado] Dados transformados:", {
          internationCount: transformed.internation.length,
          assistanceCount: transformed.assistance.length,
          exemploInternacao: transformed.internation[0],
          exemploAssistencia: transformed.assistance[0],
        });
        setChartData(transformed);
      }

      // Buscar avaliações do hospital com categorias
      if (hospitalId) {
        try {
          const avaliacoesData = await getCompletedEvaluationsWithCategories(
            hospitalId
          );

          // Transformar dados para o radar chart
          const radarChartData: ChartDataItem[] = [];

          avaliacoesData?.forEach((evaluation) => {
            const totalScore = parseFloat(evaluation.total_score);

            evaluation.categories?.forEach((cat: any) => {
              radarChartData.push({
                subject: cat.category_name,
                atual: totalScore,
                projetado: cat.category_meta,
              });
            });
          });

          setRadarData(radarChartData);
        } catch (error) {
          console.error("Erro ao buscar avaliações:", error);
          setRadarData([]);
        }
      }
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      console.error("Stack trace:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, hospitalId, props.externalData, props.isGlobalView]);

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
                    isGlobalView={props.isGlobalView}
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
