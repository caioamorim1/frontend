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
import {
  getAllHospitalSectors,
  HospitalSector,
} from "@/mocks/functionSectores";
import {
  parseCost as parseCostUtil,
  getStaffArray,
  sumStaff as sumStaffUtil,
} from "@/lib/dataUtils";
import { SectorAssistance } from "@/mocks/noInternationDatabase";
import { SectorInternation } from "@/mocks/internationDatabase";

type SectorType = "global" | "internacao" | "nao-internacao";
export const DashboardComparativoScreen: React.FC<{
  title: string;
  externalAtualData?: any;
  externalProjectedData?: any;
  isGlobalView?: boolean;
}> = ({ title, externalAtualData, externalProjectedData, isGlobalView }) => {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [hospitalData, setHospitalData] = useState<HospitalSector | null>(null);
  const [activeTab, setActiveTab] = useState<SectorType>("global");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // quando em visão global iremos usar estes estados para conter os dados atual e projetado
  const [globalAtualData, setGlobalAtualData] = useState<any | null>(
    externalAtualData || null
  );
  const [globalProjectedData, setGlobalProjectedData] = useState<any | null>(
    externalProjectedData || null
  );

  useEffect(() => {
    setSelectedSector("all");
  }, [activeTab]);

  // Ensure we exit loading state when we have data to render.
  useEffect(() => {
    if (isGlobalView) {
      // For global view, we rely on external data being passed in.
      if (externalAtualData || externalProjectedData) setLoading(false);
      else setLoading(false); // still clear loading so debug logs can surface
    } else {
      if (hospitalData) setLoading(false);
    }
  }, [isGlobalView, externalAtualData, externalProjectedData, hospitalData]);

  // Single processedData useMemo that handles both hospital view and global view
  const processedData = useMemo(() => {
    console.log("🔁 processedData - inputs:", {
      hospitalDataExists: !!hospitalData,
      externalAtualDataExists: !!externalAtualData,
      externalProjectedDataExists: !!externalProjectedData,
      isGlobalView,
      activeTab,
      selectedSector,
    });

    // choose sources depending on view
    const atualSource = isGlobalView
      ? externalAtualData ?? globalAtualData
      : hospitalData;
    const projectedSource = isGlobalView
      ? externalProjectedData ?? globalProjectedData
      : null;

    if (!atualSource && !projectedSource) {
      console.log(
        "⚠️ processedData: no data source available (atual/projected)"
      );
      return null;
    }

    const extract = (src: any) => {
      if (!src) return { internation: [], assistance: [] };
      if (Array.isArray(src)) {
        const allIntern: any[] = [];
        const allAssist: any[] = [];
        src.forEach((entity) => {
          if (Array.isArray(entity.internation))
            allIntern.push(...entity.internation);
          if (Array.isArray(entity.assistance))
            allAssist.push(...entity.assistance);
        });
        return { internation: allIntern, assistance: allAssist };
      }
      return {
        internation: src.internation || [],
        assistance: src.assistance || [],
      };
    };

    const atual = extract(atualSource);
    const projetado = extract(projectedSource);

    let baseSectors: any[] = [];
    if (activeTab === "global")
      baseSectors = [...(atual.internation || []), ...(atual.assistance || [])];
    else if (activeTab === "internacao") baseSectors = atual.internation || [];
    else baseSectors = atual.assistance || [];

    const projectedBase =
      activeTab === "global"
        ? [...(projetado.internation || []), ...(projetado.assistance || [])]
        : activeTab === "internacao"
        ? projetado.internation || []
        : projetado.assistance || [];

    const setorMap: Map<string, { id: string; name: string }> = new Map();
    baseSectors.forEach((s: any) =>
      setorMap.set(s.id, { id: s.id, name: s.name })
    );
    projectedBase.forEach((s: any) =>
      setorMap.set(s.id, { id: s.id, name: s.name })
    );
    const setorList = Array.from(setorMap.values());

    const filterBySelected = (arr: any[]) =>
      selectedSector === "all"
        ? arr
        : arr.filter((s) => s.id === selectedSector);

    const filteredAtual = filterBySelected(baseSectors);
    const filteredProjected = filterBySelected(projectedBase);

    console.log("🔎 setores:", {
      baseSectors: baseSectors.length,
      projectedBase: projectedBase.length,
      filteredAtual: filteredAtual.length,
      filteredProjected: filteredProjected.length,
    });

    const sumCost = (arr: any[], useProjected = false) =>
      arr.reduce((sum, sector) => {
        const raw = useProjected
          ? sector.projectedCostAmount ?? sector.costAmount ?? 0
          : sector.costAmount ?? 0;
        return sum + parseCostUtil(raw);
      }, 0);

    const sumStaff = (arr: any[], useProjected = false) =>
      arr.reduce((sum, sector) => {
        if (useProjected) {
          const staffArr =
            sector.projectedStaff && Array.isArray(sector.projectedStaff)
              ? sector.projectedStaff
              : getStaffArray(sector);
          return (
            sum +
            staffArr.reduce((s: number, it: any) => s + (it.quantity || 0), 0)
          );
        }
        return sum + sumStaffUtil(sector);
      }, 0);

    const custoAtual = sumCost(filteredAtual, false);
    const custoProjetado = sumCost(filteredProjected, true);
    const variacaoCusto = custoProjetado - custoAtual;

    const pessoalAtual = sumStaff(filteredAtual, false);
    const pessoalProjetado = sumStaff(filteredProjected, true);
    const variacaoPessoal = pessoalProjetado - pessoalAtual;

    const financialWaterfall = [
      { name: "Custo Atual", value: custoAtual },
      { name: "Variação", value: variacaoCusto },
      { name: "Custo Projetado", value: custoProjetado },
    ];

    const personnelWaterfall = [
      { name: "Pessoal Atual", value: pessoalAtual },
      { name: "Variação", value: variacaoPessoal },
      { name: "Pessoal Projetado", value: pessoalProjetado },
    ];

    const variacaoPercentual =
      custoAtual > 0 ? (variacaoCusto / custoAtual) * 100 : 0;

    console.log("✅ processedData result:", {
      custoAtual,
      custoProjetado,
      variacaoCusto,
      pessoalAtual,
      pessoalProjetado,
      variacaoPessoal,
      setorListLength: setorList.length,
    });

    return {
      financialWaterfall,
      personnelWaterfall,
      variacaoCusto,
      variacaoPercentual,
      setorList,
    };
  }, [
    hospitalData,
    externalAtualData,
    externalProjectedData,
    globalAtualData,
    globalProjectedData,
    activeTab,
    selectedSector,
    isGlobalView,
  ]);

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
          value={`R$ ${(Math.abs(variacaoCusto) / 1000).toFixed(1)}k`}
          isReduction={variacaoCusto < 0}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <VariationCard
          title="VARIAÇÃO MENSAL (%)"
          value={`${Math.abs(variacaoPercentual).toFixed(1)}%`}
          isReduction={variacaoPercentual < 0}
          icon={<Percent className="h-6 w-6" />}
        />
        <VariationCard
          title="VARIAÇÃO A 12 MESES"
          value={`R$ ${(Math.abs(variacaoCusto * 12) / 1000).toFixed(1)}k`}
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
              Unidades de Não Internação
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
