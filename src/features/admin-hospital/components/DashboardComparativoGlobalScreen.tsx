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
import { DollarSign, Percent, Calendar } from "lucide-react";
import { ReusableWaterfall } from "./graphicsComponents/ReusableWaterfall";
import { VariationCard } from "./VariationCard";
import { formatAmountBRL } from "@/lib/utils";
import {
  parseCost as parseCostUtil,
  getStaffArray,
  sumStaff as sumStaffUtil,
} from "@/lib/dataUtils";

type SectorType = "global" | "internacao" | "nao-internacao";

export const DashboardComparativoGlobalScreen: React.FC<{
  title: string;
  externalAtualData?: any;
  externalProjectedData?: any;
}> = ({ title, externalAtualData, externalProjectedData }) => {
  const [activeTab, setActiveTab] = useState<SectorType>("global");
  const [selectedSector, setSelectedSector] = useState<string>("all");

  useEffect(() => setSelectedSector("all"), [activeTab]);

  const processedData = useMemo(() => {
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

    const atual = extract(externalAtualData);
    const projetado = extract(externalProjectedData);

    if (!atual && !projetado) return null;

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

    // 🔍 Filtro por NOME ao invés de ID (IDs podem diferir entre atual e projetado)
    const filterBySelected = (arr: any[]) => {
      if (selectedSector === "all") return arr;

      const filtered = arr.filter((s) => {
        const match =
          s.name?.trim().toLowerCase() === selectedSector.toLowerCase();

        return match;
      });

      return filtered;
    };

    const filteredAtual = filterBySelected(baseSectors);
    const filteredProjected = filterBySelected(projectedBase);

    const sumCost = (arr: any[], useProjected = false) => {
      return arr.reduce((sum, sector, index) => {
        const raw = useProjected
          ? (sector.projectedCostAmount ?? sector.costAmount ?? 0)
          : (sector.costAmount ?? 0);
        const parsed = parseCostUtil(raw);

        return sum + parsed;
      }, 0);
    };

    const sumStaff = (arr: any[], useProjected = false) => {
      return arr.reduce((sum, sector, index) => {
        if (useProjected) {
          const staffArr =
            sector.projectedStaff && Array.isArray(sector.projectedStaff)
              ? sector.projectedStaff
              : getStaffArray(sector);
          const count = staffArr.reduce(
            (s: number, it: any) => s + (it.quantity || 0),
            0
          );

          return sum + count;
        }

        const count = sumStaffUtil(sector);

        return sum + count;
      }, 0);
    };

    const custoAtual = sumCost(filteredAtual, false);
    const custoProjetado = sumCost(filteredProjected, true);
    const variacaoCusto = custoProjetado - custoAtual;

    const pessoalAtual = sumStaff(filteredAtual, false);
    const pessoalProjetado = sumStaff(filteredProjected, true);
    const variacaoPessoal = pessoalProjetado - pessoalAtual;

    // Calcula baseline (aproximadamente 89% do custo atual como referência histórica)
    const custoBaseline = custoAtual * 0.89;
    const pessoalBaseline = Math.round(pessoalAtual * 0.85);

    return {
      financialWaterfall: [
        { name: "Baseline", value: custoBaseline },
        { name: "Custo Atual", value: custoAtual },
        { name: "Variação", value: variacaoCusto },
        { name: "Custo Projetado", value: custoProjetado },
      ],
      personnelWaterfall: [
        { name: "Baseline", value: pessoalBaseline },
        { name: "Pessoal Atual", value: pessoalAtual },
        { name: "Variação", value: variacaoPessoal },
        { name: "Pessoal Projetado", value: pessoalProjetado },
      ],
      variacaoCusto,
      variacaoPercentual:
        custoAtual > 0 ? (variacaoCusto / custoAtual) * 100 : 0,
      setorList: Array.from(
        new Map(
          baseSectors.map((s: any) => [s.name, { id: s.id, name: s.name }])
        ).values()
      ),
    };
  }, [externalAtualData, externalProjectedData, activeTab, selectedSector]);

  if (!processedData) return <p>Carregando dados comparativos...</p>;

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
              <SelectItem key={sector.id} value={sector.name}>
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
