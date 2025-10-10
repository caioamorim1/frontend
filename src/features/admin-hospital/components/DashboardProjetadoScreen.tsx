// src/features/admin-hospital/components/DashboardProjetadoScreen.tsx
import React, { useState, useMemo, useEffect } from "react";
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
  getAllHospitalSectors,
  HospitalSector,
} from "@/mocks/functionSectores";
import { SectorInternation } from "@/mocks/internationDatabase";
import { SectorAssistance } from "@/mocks/noInternationDatabase";
import { InfoCard } from "./DashboardAtualScreen";

// --- ESTRUTURA DE DADOS ---
interface ChartDataItem {
  subject: string;
  atual: number;
  projetado: number;
}

interface DashboardProjetadoScreenProps {
  title: string;
}

interface ChartData {
  [key: string]: string | number | undefined;
  name: string;
  value: number;
  color?: string;
}

// --- COMPONENTES DAS ABAS (ADAPTADOS PARA DADOS PROJETADOS) ---

const GlobalTabContent: React.FC<{
  sourceData: HospitalSector;
  radarData: ChartDataItem[];
}> = ({ sourceData, radarData }) => {
  // A lógica de dados para a visão global pode ser ajustada para refletir custos e pessoal projetados
  const { internation, assistance } = sourceData;

  // SIMULAÇÃO: Redução de 15% nos custos e 10% no pessoal para o cenário projetado
  const costReductionFactor = 0.85;
  const staffReductionFactor = 0.9;

  const totalStaffInternation = internation.reduce(
    (acc, sector) =>
      acc + sector.staff.reduce((sum, staff) => sum + staff.quantity, 0),
    0
  );
  const amountTotalInternation = internation.reduce(
    (acc, sector) => acc + sector.costAmount,
    0
  );

  const totalStaffAssistance = assistance.reduce(
    (acc, sector) =>
      acc + sector.staff.reduce((sum, staff) => sum + staff.quantity, 0),
    0
  );
  const amountTotalAssistance = assistance.reduce(
    (acc, sector) => acc + sector.costAmount,
    0
  );

  const totalStaff = Math.round(
    (totalStaffInternation + totalStaffAssistance) * staffReductionFactor
  );
  const amountTotal =
    (amountTotalInternation + amountTotalAssistance) * costReductionFactor;

  const chartDataInternation: ChartData[] = internation.map((item) => ({
    key: item.id,
    name: item.name,
    value: item.costAmount * costReductionFactor,
    color: generateMultiColorScale(
      item.costAmount * costReductionFactor,
      0,
      Math.max(...internation.map((i) => i.costAmount * costReductionFactor))
    ),
  }));

  const chartDataAssistance: ChartData[] = assistance.map((item) => ({
    key: item.id,
    name: item.name,
    value: item.costAmount * costReductionFactor,
    color: generateMultiColorScale(
      item.costAmount * costReductionFactor,
      0,
      Math.max(...assistance.map((i) => i.costAmount * costReductionFactor))
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
      <RadarChartComponent
        data={radarData}
        title="Análise de Desempenho"
        description="Comparativo entre o desempenho atual e projetado"
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

  // SIMULAÇÃO: Redução de 15% nos custos e 10% no pessoal para o cenário projetado
  const costReductionFactor = 0.85;
  const staffReductionFactor = 0.9;

  const totalStaff = Math.round(
    detailedData.reduce(
      (acc, sector) =>
        acc + sector.staff.reduce((sum, staff) => sum + staff.quantity, 0),
      0
    ) * staffReductionFactor
  );
  const amountTotal =
    detailedData.reduce((acc, sector) => acc + sector.costAmount, 0) *
    costReductionFactor;
  const totalBeds = detailedData.reduce(
    (acc, sector) => acc + sector.bedCount,
    0
  );

  const chartDataProjetado: ChartData[] = detailedData
    ? detailedData
        .map((item) => ({
          key: item.id,
          name: item.name,
          value: item.costAmount * costReductionFactor,
          color: generateMultiColorScale(
            item.costAmount * costReductionFactor,
            0,
            Math.max(
              ...detailedData.map((i) => i.costAmount * costReductionFactor)
            )
          ),
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const staffBySectorMap: Record<string, number> = {};
  detailedData.forEach((sector) => {
    let totalInSector = 0;
    sector.staff.forEach((staffMember) => {
      totalInSector += staffMember.quantity;
    });
    staffBySectorMap[sector.name] = Math.round(
      totalInSector * staffReductionFactor
    );
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
    sector.staff.forEach((staffMember) => {
      const { role, quantity } = staffMember;
      staffByRoleMap[role] =
        (staffByRoleMap[role] || 0) +
        Math.round(quantity * staffReductionFactor);
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
        <InfoCard
          title="Total de Leitos"
          value={totalBeds}
          icon={<Building size={24} />}
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
        {/* Gráficos de Níveis de Cuidado e Estados dos Leitos foram REMOVIDOS */}
        <PieChartComp
          data={chartDataColaboradoresPorSetor}
          title="Colaboradores por Unidade (Projetado)"
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
  sourceData: SectorAssistance[];
  radarData: ChartDataItem[];
}> = ({ sourceData, radarData }) => {
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const detailedData = sourceData.filter(
    (sector) => selectedSector === "all" || sector.id === selectedSector
  );

  // SIMULAÇÃO: Redução de 15% nos custos e 10% no pessoal
  const costReductionFactor = 0.85;
  const staffReductionFactor = 0.9;

  const totalStaff = Math.round(
    detailedData.reduce(
      (acc, sector) =>
        acc + sector.staff.reduce((sum, staff) => sum + staff.quantity, 0),
      0
    ) * staffReductionFactor
  );
  const amountTotal =
    detailedData.reduce((acc, sector) => acc + sector.costAmount, 0) *
    costReductionFactor;

  const chartDataProjetado: ChartData[] = detailedData
    ? detailedData
        .map((item) => ({
          key: item.id,
          name: item.name,
          value: item.costAmount * costReductionFactor,
          color: generateMultiColorScale(
            item.costAmount * costReductionFactor,
            0,
            Math.max(
              ...detailedData.map((i) => i.costAmount * costReductionFactor)
            )
          ),
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  const staffBySectorMap: Record<string, number> = {};
  detailedData.forEach((sector) => {
    let totalInSector = 0;
    sector.staff.forEach((staffMember) => {
      totalInSector += staffMember.quantity;
    });
    staffBySectorMap[sector.name] = Math.round(
      totalInSector * staffReductionFactor
    );
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
    sector.staff.forEach((staffMember) => {
      const { role, quantity } = staffMember;
      staffByRoleMap[role] =
        (staffByRoleMap[role] || 0) +
        Math.round(quantity * staffReductionFactor);
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
  const [chartData, setChartData] = useState<HospitalSector | null>(null);
  const [radarData, setRadarData] = useState<ChartDataItem[]>([]);
  const [activeTab, setActiveTab] = useState("global");

  const loadData = async () => {
    const dashboardData = getAllHospitalSectors();
    const tipo = activeTab === "internacao" ? "Internacao" : "NaoInternacao";
    const performanceData =
      activeTab === "global"
        ? calcularPerformanceParaGrafico()
        : calcularPerformanceParaGrafico({ tipo: tipo });

    setChartData(dashboardData);
    setRadarData(performanceData);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  return (
    <>
      {chartData && (
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle>{props.title}</CardTitle>
            <CardDescription>Análise de desempenho projetado</CardDescription>
          </CardHeader>
          <CardContent>
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
      )}
    </>
  );
};
