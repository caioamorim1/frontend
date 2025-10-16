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
import { GroupedBarByRole } from "./graphicsComponents/GroupedBarByRole";

type SectorType = "global" | "internacao" | "nao-internacao";

type RoleStats = {
  role: string;
  atual: number;
  projetado: number;
  variacao: number;
};

type SectorRoleData = {
  sectorName: string;
  custoPorFuncao: RoleStats[];
  quantidadePorFuncao: RoleStats[];
};


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

    const custoBaseline = custoAtual * 0.89;
    const pessoalBaseline = Math.round(pessoalAtual * 0.85);

    const variacaoBaselineAtual = custoAtual - custoBaseline;
    const variacaoPessoalBaselineAtual = pessoalAtual - pessoalBaseline;

    // 🔽 Novo cálculo por função e setor
    const setorRoleData = baseSectors.map((sectorAtual) => {
      const sectorProjetado = projectedBase.find((p) => p.name === sectorAtual.name);

      const atualStaffMap = new Map<string, { quantidade: number; custo: number }>();
      const projetadoStaffMap = new Map<string, { quantidade: number; custo: number }>();

      // Atual
      (getStaffArray(sectorAtual) || []).forEach((item: any) => {
        const prev = atualStaffMap.get(item.role) || { quantidade: 0, custo: 0 };
        atualStaffMap.set(item.role, {
          quantidade: prev.quantidade + (item.quantity || 0),
          custo: prev.custo + (item.costAmount || 0),
        });
      });

      // Projetado
      (sectorProjetado?.projectedStaff || []).forEach((item: any) => {
        const prev = projetadoStaffMap.get(item.role) || { quantidade: 0, custo: 0 };
        projetadoStaffMap.set(item.role, {
          quantidade: prev.quantidade + (item.quantity || 0),
          custo: prev.custo + (item.costAmount || 0),
        });
      });

      const allRoles = new Set([
        ...Array.from(atualStaffMap.keys()),
        ...Array.from(projetadoStaffMap.keys()),
      ]);

      const custoPorFuncao: RoleStats[] = [];
      const quantidadePorFuncao: RoleStats[] = [];

      allRoles.forEach((role) => {
        const atual = atualStaffMap.get(role) || { quantidade: 0, custo: 0 };
        const proj = projetadoStaffMap.get(role) || { quantidade: 0, custo: 0 };

        custoPorFuncao.push({
          role,
          atual: atual.custo,
          projetado: proj.custo,
          variacao: proj.custo - atual.custo,
        });

        quantidadePorFuncao.push({
          role,
          atual: atual.quantidade,
          projetado: proj.quantidade,
          variacao: proj.quantidade - atual.quantidade,
        });
      });

      return {
        sectorName: sectorAtual.name,
        custoPorFuncao,
        quantidadePorFuncao,
      };
    });

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
      setorRoleData, // 🔥 dado adicional para gráficos por função e setor
    };
  }, [hospitalData, hospitalProjectedData, activeTab, selectedSector]);


  const aggregatedRoleData = useMemo(() => {
    if (!processedData?.setorRoleData) return null;

    const setoresParaAgrupar =
      selectedSector === "all"
        ? processedData.setorRoleData
        : processedData.setorRoleData.filter(
          (s) => s.sectorName === selectedSector
        );

    // ==== CUSTO ====
    let totalAtual = 0;
    let totalProjetado = 0;
    const variacoesMap = new Map<string, number>();

    setoresParaAgrupar.forEach((sector) => {
      sector.custoPorFuncao.forEach((func) => {
        const delta = (func.projetado ?? 0) - (func.atual ?? 0);
        const prev = variacoesMap.get(func.role) ?? 0;
        variacoesMap.set(func.role, prev + delta);
      });

      totalAtual += sector.custoPorFuncao.reduce(
        (sum, f) => sum + (f.atual ?? 0),
        0
      );
      totalProjetado += sector.custoPorFuncao.reduce(
        (sum, f) => sum + (f.projetado ?? 0),
        0
      );
    });

    const baseline = totalAtual * 0.89;
    const variacoesArray = Array.from(variacoesMap.entries()).map(
      ([role, delta]) => ({
        role,
        value: delta,
      })
    );

    // Construir o array cumulativo (Baseline, Atual, variações..., Projetado)
    const custoPorFuncao: { role: string; start: number; end: number; color: string }[] = [];
    let cumulative = 0;

    // Baseline (opcional visual)
    custoPorFuncao.push({
      role: "Baseline",
      start: 0,
      end: baseline,
      color: "#89A7D6",
    });

    // Atual
    cumulative = totalAtual;
    custoPorFuncao.push({
      role: "Atual",
      start: 0,
      end: totalAtual,
      color: "#0070B9",
    });

    // Funções
    variacoesArray.forEach(({ role, value }) => {
      const start = cumulative;
      const end = cumulative + value;
      cumulative = end;

      custoPorFuncao.push({
        role,
        start,
        end,
        color: value < 0 ? "#16a34a" : "#dc2626", // verde = redução, vermelho = aumento
      });
    });

    // Projetado
    custoPorFuncao.push({
      role: "Projetado",
      start: 0,
      end: cumulative,
      color: "#003151",
    });

    // ==== QUANTIDADE ====
    let totalAtualQtd = 0;
    let totalProjetadoQtd = 0;
    const variacoesQtdMap = new Map<string, number>();

    setoresParaAgrupar.forEach((sector) => {
      sector.quantidadePorFuncao.forEach((func) => {
        const delta = (func.projetado ?? 0) - (func.atual ?? 0);
        const prev = variacoesQtdMap.get(func.role) ?? 0;
        variacoesQtdMap.set(func.role, prev + delta);
      });
      totalAtualQtd += sector.quantidadePorFuncao.reduce(
        (sum, f) => sum + (f.atual ?? 0),
        0
      );
      totalProjetadoQtd += sector.quantidadePorFuncao.reduce(
        (sum, f) => sum + (f.projetado ?? 0),
        0
      );
    });

    const baselineQtd = Math.round(totalAtualQtd * 0.85);
    const variacoesQtdArray = Array.from(variacoesQtdMap.entries()).map(
      ([role, delta]) => ({
        role,
        value: delta,
      })
    );

    const quantidadePorFuncao: { role: string; start: number; end: number; color: string }[] = [];
    cumulative = totalAtualQtd;

    // Baseline
    quantidadePorFuncao.push({
      role: "Baseline",
      start: 0,
      end: baselineQtd,
      color: "#89A7D6",
    });

    // Atual
    quantidadePorFuncao.push({
      role: "Atual",
      start: 0,
      end: totalAtualQtd,
      color: "#0070B9",
    });

    // Funções
    variacoesQtdArray.forEach(({ role, value }) => {
      const start = cumulative;
      const end = cumulative + value;
      cumulative = end;

      quantidadePorFuncao.push({
        role,
        start,
        end,
        color: value < 0 ? "#16a34a" : "#dc2626",
      });
    });

    // Projetado
    quantidadePorFuncao.push({
      role: "Projetado",
      start: 0,
      end: cumulative,
      color: "#003151",
    });

    return {
      custoPorFuncao,
      quantidadePorFuncao,
    };
  }, [processedData?.setorRoleData, selectedSector]);





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
          value={`R$ ${(Math.abs(variacaoCusto) / 1000).toFixed(1)}k`}
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


      {aggregatedRoleData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <GroupedBarByRole
            title={`Custo por Função${selectedSector !== "all" ? ` – ${selectedSector}` : ""}`}
            data={aggregatedRoleData.custoPorFuncao}
            unit="currency"
            description="Comparativo de custo por função (com totais e baseline)"
          />

          <GroupedBarByRole
            title={`Quantidade por Função${selectedSector !== "all" ? ` – ${selectedSector}` : ""}`}
            data={aggregatedRoleData.quantidadePorFuncao}
            unit="people"
            description="Comparativo de quantidade por função (com totais e baseline)"
          />
        </div>
      )}


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
