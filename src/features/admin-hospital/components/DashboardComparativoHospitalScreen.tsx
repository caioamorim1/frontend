// Hospital-specific comparative screen (uses hospitalId and backend comparative endpoint)
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
import { HospitalSector } from "@/mocks/functionSectores";
import { getHospitalComparative } from "@/lib/api";
import {
  parseCost as parseCostUtil,
  getStaffArray,
  sumStaff as sumStaffUtil,
} from "@/lib/dataUtils";

type SectorType = "global" | "internacao" | "nao-internacao";

export const DashboardComparativoHospitalScreen: React.FC<{
  title: string;
}> = ({ title }) => {
  console.log(
    "🟢 [USANDO: DashboardComparativoHospitalScreen - COMPONENTE HOSPITAL ESPECÍFICO]",
    { title }
  );
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [hospitalData, setHospitalData] = useState<HospitalSector | null>(null);
  const [hospitalProjectedData, setHospitalProjectedData] = useState<
    any | null
  >(null);
  const [activeTab, setActiveTab] = useState<SectorType>("global");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedSector("all");
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;
    if (!hospitalId) return;

    const fetchHospital = async () => {
      try {
        setLoading(true);
        const resp = await getHospitalComparative(hospitalId as string, {
          includeProjected: true,
        });
        console.log("🟢 [HospitalScreen] API Response:", resp);
        if (!mounted) return;

        let atual = resp?.atual ?? {
          id: hospitalId,
          internation: [],
          assistance: [],
        };
        let projetado = resp?.projetado ?? {
          id: hospitalId,
          internation: [],
          assistance: [],
        };

        // 🔥 FIX: Flatten per-sitio projectedStaff (aggregate by role)
        if (Array.isArray(projetado.assistance)) {
          projetado.assistance = projetado.assistance.map((sector: any) => {
            if (
              Array.isArray(sector.projectedStaff) &&
              sector.projectedStaff.length > 0 &&
              sector.projectedStaff[0]?.sitioId
            ) {
              // Per-sitio format detected - flatten and aggregate
              const roleMap = new Map<string, number>();
              sector.projectedStaff.forEach((sitio: any) => {
                if (Array.isArray(sitio.cargos)) {
                  sitio.cargos.forEach((cargo: any) => {
                    const currentQty = roleMap.get(cargo.role) || 0;
                    roleMap.set(cargo.role, currentQty + (cargo.quantity || 0));
                  });
                }
              });
              const flattened = Array.from(roleMap.entries()).map(
                ([role, quantity]) => ({
                  role,
                  quantity,
                })
              );
              console.log(`🟢 [HospitalScreen] Flattened ${sector.name}:`, {
                original: sector.projectedStaff,
                flattened,
              });
              return { ...sector, projectedStaff: flattened };
            }
            return sector;
          });
        }

        // Also flatten internation sectors if needed
        if (Array.isArray(projetado.internation)) {
          projetado.internation = projetado.internation.map((sector: any) => {
            if (
              Array.isArray(sector.projectedStaff) &&
              sector.projectedStaff.length > 0 &&
              sector.projectedStaff[0]?.sitioId
            ) {
              const roleMap = new Map<string, number>();
              sector.projectedStaff.forEach((sitio: any) => {
                if (Array.isArray(sitio.cargos)) {
                  sitio.cargos.forEach((cargo: any) => {
                    const currentQty = roleMap.get(cargo.role) || 0;
                    roleMap.set(cargo.role, currentQty + (cargo.quantity || 0));
                  });
                }
              });
              const flattened = Array.from(roleMap.entries()).map(
                ([role, quantity]) => ({
                  role,
                  quantity,
                })
              );
              console.log(`🟢 [HospitalScreen] Flattened ${sector.name}:`, {
                original: sector.projectedStaff,
                flattened,
              });
              return { ...sector, projectedStaff: flattened };
            }
            return sector;
          });
        }

        setHospitalData(atual as HospitalSector);
        setHospitalProjectedData(projetado);
      } catch (err) {
        console.error("[DashboardComparativoHospitalScreen] fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHospital();
    return () => {
      mounted = false;
    };
  }, [hospitalId]);

  useEffect(() => {
    console.log("[DashboardComparativoHospitalScreen] loading", loading);
  }, [loading]);

  const processedData = useMemo(() => {
    const atualSource = hospitalData;
    const projectedSource = hospitalProjectedData;
    if (!atualSource && !projectedSource) return null;

    const extract = (src: any) => {
      if (!src) return { internation: [], assistance: [] };
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

    const filterBySelected = (arr: any[]) =>
      selectedSector === "all"
        ? arr
        : arr.filter((s) => s.id === selectedSector);

    const filteredAtual = filterBySelected(baseSectors);
    const filteredProjected = filterBySelected(projectedBase);

    console.log(`🟢 [HospitalScreen] processedData - activeTab: ${activeTab}`, {
      baseSectorsCount: baseSectors.length,
      projectedBaseCount: projectedBase.length,
      filteredAtualCount: filteredAtual.length,
      filteredProjectedCount: filteredProjected.length,
      filteredAtualNames: filteredAtual.map((s) => s.name),
      filteredProjectedNames: filteredProjected.map((s) => s.name),
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

    // 🟢 Log variation for non-internation units
    if (activeTab === "nao-internacao") {
      console.log(`🟢 [HospitalScreen] VARIAÇÃO NÃO INTERNAÇÃO:`, {
        pessoalAtual,
        pessoalProjetado,
        variacaoPessoal,
        filteredAtualCount: filteredAtual.length,
        filteredProjectedCount: filteredProjected.length,
      });
    }

    console.log(`🟢 [HospitalScreen] Final calculations (${activeTab}):`, {
      custoAtual,
      custoProjetado,
      variacaoCusto,
      pessoalAtual,
      pessoalProjetado,
      variacaoPessoal,
    });

    return {
      financialWaterfall: [
        { name: "Custo Atual", value: custoAtual },
        { name: "Variação", value: variacaoCusto },
        { name: "Custo Projetado", value: custoProjetado },
      ],
      personnelWaterfall: [
        { name: "Pessoal Atual", value: pessoalAtual },
        { name: "Variação", value: variacaoPessoal },
        { name: "Pessoal Projetado", value: pessoalProjetado },
      ],
      variacaoCusto,
      variacaoPercentual:
        custoAtual > 0 ? (variacaoCusto / custoAtual) * 100 : 0,
      setorList: Array.from(
        new Map(
          baseSectors.map((s: any) => [s.id, { id: s.id, name: s.name }])
        ).values()
      ),
    };
  }, [hospitalData, hospitalProjectedData, activeTab, selectedSector]);

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
