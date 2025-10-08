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
import { SectorAssistance } from "@/mocks/noInternationDatabase";
import { SectorInternation } from "@/mocks/internationDatabase";

type SectorType = "global" | "internacao" | "nao-internacao";

export const DashboardComparativoScreen: React.FC<{ title: string }> = ({
  title,
}) => {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [hospitalData, setHospitalData] = useState<HospitalSector | null>(null);
  const [activeTab, setActiveTab] = useState<SectorType>("global");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      console.log(
        "🔄 DashboardComparativoScreen - loadData chamado, hospitalId:",
        hospitalId
      );

      if (!hospitalId) {
        console.warn("⚠️ Hospital ID não encontrado na URL");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("🚀 Iniciando carregamento para hospital:", hospitalId);

        const data = await getAllHospitalSectors(hospitalId);
        console.log("✅ Dados carregados com sucesso:", data);
        setHospitalData(data);
      } catch (error) {
        console.error("❌ Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [hospitalId]);

  useEffect(() => {
    setSelectedSector("all");
  }, [activeTab]);

  const processedData = useMemo(() => {
    if (!hospitalData) return null;

    let baseSectors: (SectorInternation | SectorAssistance)[] = [];
    let setorList: { id: string; name: string }[] = [];

    if (activeTab === "global") {
      baseSectors = [...hospitalData.internation, ...hospitalData.assistance];
    } else if (activeTab === "internacao") {
      baseSectors = hospitalData.internation;
    } else {
      baseSectors = hospitalData.assistance;
    }
    setorList = baseSectors.map((s) => ({ id: s.id, name: s.name }));

    const filteredSectors =
      selectedSector === "all"
        ? baseSectors
        : baseSectors.filter((s) => s.id === selectedSector);

    const costReductionFactor = 0.85;
    const staffReductionFactor = 0.9;

    const custoAtual = filteredSectors.reduce(
      (sum, sector) => sum + sector.costAmount,
      0
    );
    const custoProjetado = custoAtual * costReductionFactor;
    const variacaoCusto = custoProjetado - custoAtual;

    const pessoalAtual = filteredSectors.reduce(
      (sum, sector) =>
        sum + sector.staff.reduce((staffSum, s) => staffSum + s.quantity, 0),
      0
    );
    const pessoalProjetado = Math.round(pessoalAtual * staffReductionFactor);
    const variacaoPessoal = pessoalProjetado - pessoalAtual;

    const financialWaterfall = [
      { name: "Custo Atual", value: custoAtual },
      { name: "Redução", value: variacaoCusto },
      { name: "Custo Projetado", value: custoProjetado },
    ];

    const personnelWaterfall = [
      { name: "Pessoal Atual", value: pessoalAtual },
      { name: "Redução", value: variacaoPessoal },
      { name: "Pessoal Projetado", value: pessoalProjetado },
    ];

    const variacaoPercentual =
      custoAtual > 0 ? (variacaoCusto / custoAtual) * 100 : 0;

    return {
      financialWaterfall,
      personnelWaterfall,
      variacaoCusto,
      variacaoPercentual,
      setorList,
    };
  }, [hospitalData, activeTab, selectedSector]);

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
          description="Análise de variação de custos"
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
              Setores Assistenciais
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
