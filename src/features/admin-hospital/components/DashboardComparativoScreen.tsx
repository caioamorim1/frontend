// src/features/admin-hospital/components/DashboardComparativoScreen.tsx

import React, { useState, useMemo, useEffect } from "react";
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
import { DollarSign, Percent, Calendar } from "lucide-react";
import { ReusableWaterfall } from "./graphicsComponents/ReusableWaterfall";
import { VariationCard } from "./VariationCard";
import { formatAmountBRL } from "@/lib/utils";
import { HospitalSector } from "@/mocks/functionSectores";
import { getHospitalComparative } from "@/lib/api";
import {
  parseCost as parseCostUtil,
  getStaffArray,
  sumStaff as sumStaffUtil,
} from "@/lib/dataUtils";
import {
  isProjectedBySitio,
  flattenProjectedBySitio,
  computeProjectedCostFromSitios,
} from "@/lib/dataUtils";
import { SectorAssistance } from "@/mocks/noInternationDatabase";
import { SectorInternation } from "@/mocks/internationDatabase";

type SectorType = "global" | "internacao" | "nao-internacao";

// Nova estrutura de dados da API
interface NewComparativeData {
  hospitalId: string;
  snapshotId: string;
  snapshotData: string;
  sectors: {
    internation: NewSectorData[];
    assistance: NewSectorData[];
  };
}

interface NewSectorData {
  id: string;
  name: string;
  tipo: "INTERNACAO" | "NAO_INTERNACAO";
  quadroAtualReal: Record<string, number>;
  quadroAtualSnapshot: Record<string, number>;
  custosAtualSnapshot: Record<string, number>;
  quadroProjetadoSnapshot: Record<string, number>;
  diferencas: Record<string, number>;
  dimensionamento?: {
    leitosOcupados: number;
    leitosVagos: number;
    leitosInativos: number;
    totalLeitos: number;
    distribuicaoClassificacao: Record<string, number>;
  };
}
export const DashboardComparativoScreen: React.FC<{
  title: string;
}> = ({ title }) => {
  const { hospitalId } = useParams<{ hospitalId: string }>();

  const [comparativeData, setComparativeData] =
    useState<NewComparativeData | null>(null);
  const [activeTab, setActiveTab] = useState<SectorType>("global");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedSector("all");
  }, [activeTab]);

  useEffect(() => {
    if (comparativeData) setLoading(false);
  }, [comparativeData]);

  // Buscar dados comparativos da nova API
  useEffect(() => {
    let mounted = true;
    if (!hospitalId) return;

    const fetchComparativeData = async () => {
      try {
        setLoading(true);

        const resp = await getHospitalComparative(hospitalId);

        if (!mounted) return;

        setComparativeData(resp);
      } catch (err) {
        console.error(
          "[Comparativo - NOVA API] Error fetching comparative data:",
          err
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchComparativeData();

    return () => {
      mounted = false;
    };
  }, [hospitalId]);

  // Processar dados comparativos da nova estrutura
  const processedData = useMemo(() => {
    if (!comparativeData) {
      return null;
    }

    const { sectors } = comparativeData;

    // Determinar quais setores usar baseado na aba ativa
    let baseSectors: NewSectorData[] = [];
    if (activeTab === "global") {
      baseSectors = [...sectors.internation, ...sectors.assistance];
    } else if (activeTab === "internacao") {
      baseSectors = sectors.internation;
    } else {
      baseSectors = sectors.assistance;
    }

    // Criar lista de setores para o dropdown
    const setorList = baseSectors.map((s) => ({ id: s.id, name: s.name }));

    // Filtrar setores baseado na seleção
    const filteredSectors =
      selectedSector === "all"
        ? baseSectors
        : baseSectors.filter((s) => s.id === selectedSector);

    // Funções auxiliares para somar valores de objetos Record<string, number>
    const somarValores = (obj: Record<string, number>) => {
      return Object.values(obj).reduce((sum, val) => sum + val, 0);
    };

    // Calcular custo total do setor: custo unitário × quantidade de cada cargo
    const calcularCustoSetor = (
      custos: Record<string, number>,
      quantidades: Record<string, number>
    ) => {
      let total = 0;
      Object.keys(custos).forEach((cargo) => {
        const custoUnitario = custos[cargo] || 0;
        const quantidade = quantidades[cargo] || 0;
        total += custoUnitario * quantidade;
      });
      return total;
    };

    // BARRA 1: Atual (quadroAtualReal - tempo real, antiga baseline)
    const pessoalAtualReal = filteredSectors.reduce(
      (sum, sector) => sum + somarValores(sector.quadroAtualReal),
      0
    );

    // BARRA 2: Baseline (quadroAtualSnapshot - primeira barra do waterfall)
    const pessoalAtualSnapshot = filteredSectors.reduce(
      (sum, sector) => sum + somarValores(sector.quadroAtualSnapshot),
      0
    );

    // Custo Baseline: custoUnitário × quantidade para cada cargo, somado por setor
    const custoAtualSnapshot = filteredSectors.reduce(
      (sum, sector) =>
        sum +
        calcularCustoSetor(
          sector.custosAtualSnapshot,
          sector.quadroAtualSnapshot
        ),
      0
    );

    // BARRA 3: Projetado (quadroProjetadoSnapshot - barra final do waterfall)
    const pessoalProjetadoSnapshot = filteredSectors.reduce(
      (sum, sector) => sum + somarValores(sector.quadroProjetadoSnapshot),
      0
    );

    // Custo Projetado: custoUnitário × quantidade projetada para cada cargo
    const custoProjetadoSnapshot = filteredSectors.reduce(
      (sum, sector) =>
        sum +
        calcularCustoSetor(
          sector.custosAtualSnapshot,
          sector.quadroProjetadoSnapshot
        ),
      0
    );

    // Variação (diferencas - já vem calculado da API!)
    const variacaoPessoal = filteredSectors.reduce(
      (sum, sector) => sum + somarValores(sector.diferencas),
      0
    );

    const variacaoCusto = custoProjetadoSnapshot - custoAtualSnapshot;

    const variacaoPercentual =
      custoAtualSnapshot > 0 ? (variacaoCusto / custoAtualSnapshot) * 100 : 0;

    // Montar dados do gráfico waterfall com 3 barras
    const financialWaterfall = [
      { name: "Baseline", value: custoAtualSnapshot },
      { name: "Variação", value: variacaoCusto },
      { name: "Projetado", value: custoProjetadoSnapshot },
    ];

    const personnelWaterfall = [
      { name: "Baseline", value: pessoalAtualSnapshot },
      { name: "Variação", value: variacaoPessoal },
      { name: "Projetado", value: pessoalProjetadoSnapshot },
    ];

    return {
      financialWaterfall,
      personnelWaterfall,
      variacaoCusto,
      variacaoPercentual,
      setorList,
    };
  }, [comparativeData, activeTab, selectedSector]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!processedData) {
    return <p>Carregando dados comparativos...</p>;
  }

  const {
    financialWaterfall,
    personnelWaterfall,
    variacaoCusto,
    variacaoPercentual,
    setorList,
  } = processedData;

  // Log data passed to charts (moved out of JSX to avoid ReactNode issues)

  const renderContent = () => (
    <div className="space-y-6">
      <div className="max-w-sm">
        <label className="text-sm font-medium text-muted-foreground">
          Filtrar por Setor
        </label>
        <Select value={selectedSector} onValueChange={setSelectedSector}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Visão Geral</SelectItem>
            {setorList.map((sector) => (
              <SelectItem key={sector.id} value={sector.id}>
                {sector.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VariationCard
          title="VARIAÇÃO MENSAL"
          value={formatAmountBRL(Math.abs(variacaoCusto))}
          isReduction={variacaoCusto < 0}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <VariationCard
          title="VARIAÇÃO MENSAL (%)"
          value={`${Math.abs(variacaoPercentual).toFixed(1)}%`}
          isReduction={variacaoPercentual < 0}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <VariationCard
          title="VARIAÇÃO A 12 MESES"
          value={formatAmountBRL(Math.abs(variacaoCusto * 12))}
          isReduction={variacaoCusto < 0}
          icon={<Calendar className="h-6 w-6" />}
          footer="Variação mensal x 12"
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <ReusableWaterfall
          data={financialWaterfall}
          unit="currency"
          title="Comparativo Financeiro (R$)"
          description="Comparação entre cenário atual e projetado"
        />
        <ReusableWaterfall
          data={personnelWaterfall}
          unit="people"
          title="Comparativo de Pessoal (Qtd.)"
          description="Análise de variação de pessoal"
        />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Análise comparativa de custos e pessoal entre os cenários atual e
          projetado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as SectorType)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="internacao">Unid. de Internação</TabsTrigger>
            <TabsTrigger value="nao-internacao">
              Unid. de Não Internação
            </TabsTrigger>
          </TabsList>
          <TabsContent value="global" className="mt-6">
            {renderContent()}
          </TabsContent>
          <TabsContent value="internacao" className="mt-6">
            {renderContent()}
          </TabsContent>
          <TabsContent value="nao-internacao" className="mt-6">
            {renderContent()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
