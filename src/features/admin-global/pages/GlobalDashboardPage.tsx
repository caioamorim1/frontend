import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Globe } from "lucide-react";

// Importando os componentes de dashboard
import { DashboardAtualScreen } from "@/features/admin-hospital/components/DashboardAtualScreen";
import { DashboardProjetadoScreen } from "@/features/admin-hospital/components/DashboardProjetadoScreen";
import { DashboardBaselineScreen } from "@/features/admin-hospital/components/DashboardBaselineScreen";
import { DashboardComparativoHospitalScreen } from "@/features/admin-hospital/components/DashboardComparativoHospitalScreen";
import { clearSectorsCache } from "@/mocks/functionSectores";

// Importando as APIs
import {
  getRedes,
  getSnapshotSelectedByGroup,
  getNetworkSectors,
  getNetworkProjectedSectors,
  getNetworkComparative,
  Rede,
} from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GlobalDashboardPage() {
  const { redeId } = useParams<{ redeId: string }>();
  const [rede, setRede] = useState<Rede | null>(null);

  // ✅ Estado para dados da baseline (snapshots agregados da rede)
  const [baselineData, setBaselineData] = useState<any>(null);

  // ✅ Estado para dados atuais (agregados da rede)
  const [atualData, setAtualData] = useState<any>(null);

  // ✅ Estado para dados projetados (agregados da rede)
  const [projetadoData, setProjetadoData] = useState<any>(null);

  // ✅ Estado para dados comparativos (agregados da rede)
  const [comparativoData, setComparativoData] = useState<any>(null);

  // Carregar informações da rede
  useEffect(() => {
    const fetchRede = async () => {
      if (!redeId) return;

      try {
        const redesData = await getRedes();
        const redeEncontrada = redesData.find((r) => r.id === redeId);

        if (redeEncontrada) {
          setRede(redeEncontrada);
          console.log("🌐 Rede carregada:", {
            id: redeEncontrada.id,
            nome: redeEncontrada.nome,
          });
        }
      } catch (error) {
        console.error("❌ Erro ao buscar rede:", error);
      }
    };

    fetchRede();
    clearSectorsCache();
  }, [redeId]);

  // ✅ Buscar snapshots selecionados da rede (já vêm agregados do backend)
  useEffect(() => {
    const fetchBaselineData = async () => {
      if (!redeId) {
        setBaselineData(null);
        return;
      }

      try {
        // Buscar snapshots de todos os hospitais da rede
        const snapshots = await getSnapshotSelectedByGroup("rede", redeId);
        console.log("📊 Snapshots recebidos da rede:", {
          totalSnapshots: snapshots.length,
          hospitais: snapshots.map((s) => s.hospital.nome),
        });

        // Agregar dados de internação e não-internação de todos os hospitais
        const allInternation: any[] = [];
        const allAssistance: any[] = [];

        snapshots.forEach((snapshot) => {
          if (snapshot.dados?.internation) {
            // Normalizar valores de costAmount (centavos -> reais)
            const normalizedInternation = snapshot.dados.internation.map(
              (unit: any) => ({
                ...unit,
                costAmount: unit.costAmount ? unit.costAmount / 100 : 0,
                staff:
                  unit.staff?.map((s: any) => ({
                    ...s,
                    unitCost: s.unitCost ? s.unitCost / 100 : 0,
                    totalCost: s.totalCost ? s.totalCost / 100 : 0,
                  })) || [],
              })
            );
            allInternation.push(...normalizedInternation);
          }
          if (snapshot.dados?.assistance) {
            // Normalizar valores de costAmount (centavos -> reais)
            const normalizedAssistance = snapshot.dados.assistance.map(
              (unit: any) => ({
                ...unit,
                costAmount: unit.costAmount ? unit.costAmount / 100 : 0,
                staff:
                  unit.staff?.map((s: any) => ({
                    ...s,
                    unitCost: s.unitCost ? s.unitCost / 100 : 0,
                    totalCost: s.totalCost ? s.totalCost / 100 : 0,
                  })) || [],
              })
            );
            allAssistance.push(...normalizedAssistance);
          }
        });

        // Dados no formato que o DashboardBaselineScreen espera
        const aggregatedData = {
          internation: allInternation,
          assistance: allAssistance,
        };

        console.log("✅ Dados agregados e normalizados:", {
          totalUnidadesInternacao: allInternation.length,
          totalUnidadesNaoInternacao: allAssistance.length,
          exemploInternacao: allInternation[0],
        });

        setBaselineData(aggregatedData);
      } catch (error) {
        console.error("❌ Erro ao buscar dados da rede:", error);
        setBaselineData(null);
      }
    };

    fetchBaselineData();
  }, [redeId]);

  // ✅ Buscar dados atuais agregados da rede
  useEffect(() => {
    const fetchAtualData = async () => {
      if (!redeId) {
        setAtualData(null);
        return;
      }

      try {
        const data = await getNetworkSectors(redeId);
        console.log("📊 Dados atuais brutos recebidos da rede:", data);

        // Normalizar dados: converter valores de centavos para reais e strings para números
        const normalizedInternation =
          data.internation?.map((unit: any) => ({
            ...unit,
            id: unit.id || `sector-${unit.name}`,
            costAmount: parseFloat(unit.costAmount || "0"),
            bedCount: parseInt(unit.bedCount || "0", 10),
            CareLevel: unit.careLevel,
            bedStatus: unit.bedStatus,
            staff:
              unit.staff?.map((s: any) => ({
                id: s.id,
                role: s.role,
                quantity: s.quantity,
              })) || [],
          })) || [];

        const normalizedAssistance =
          data.assistance?.map((unit: any) => ({
            ...unit,
            id: unit.id || `sector-${unit.name}`,
            costAmount: parseFloat(unit.costAmount || "0"),
            staff:
              unit.staff?.map((s: any) => ({
                id: s.id,
                role: s.role,
                quantity: s.quantity,
              })) || [],
          })) || [];

        const normalizedData = {
          id: data.id,
          internation: normalizedInternation,
          assistance: normalizedAssistance,
        };

        console.log("✅ Dados atuais normalizados:", {
          totalUnidadesInternacao: normalizedInternation.length,
          totalUnidadesNaoInternacao: normalizedAssistance.length,
          exemploInternacao: normalizedInternation[0],
        });

        setAtualData(normalizedData);
      } catch (error) {
        console.error("❌ Erro ao buscar dados atuais da rede:", error);
        setAtualData(null);
      }
    };

    fetchAtualData();
  }, [redeId]);

  // ✅ Buscar dados projetados agregados da rede
  useEffect(() => {
    const fetchProjetadoData = async () => {
      if (!redeId) {
        setProjetadoData(null);
        return;
      }

      try {
        const data = await getNetworkProjectedSectors(redeId);
        console.log("📊 Dados projetados brutos recebidos da rede:", data);

        // Normalizar dados projetados
        const normalizedInternation =
          data.internation?.map((unit: any) => ({
            id: unit.id || `sector-${unit.name}`,
            name: unit.name,
            descr: unit.descr,
            bedCount: unit.bedCount,
            costAmount: unit.costAmount,
            projectedCostAmount: unit.projectedCostAmount,
            CareLevel: {
              minimumCare: unit.minimumCare || 0,
              intermediateCare: unit.intermediateCare || 0,
              highDependency: unit.highDependency || 0,
              semiIntensive: unit.semiIntensive || 0,
              intensive: unit.intensive || 0,
            },
            bedStatus: {
              evaluated: unit.bedStatusEvaluated || 0,
              vacant: unit.bedStatusVacant || 0,
              inactive: unit.bedStatusInactive || 0,
            },
            staff: unit.staff || [],
            projectedStaff: unit.projectedStaff || [],
          })) || [];

        const normalizedAssistance =
          data.assistance?.map((unit: any) => ({
            id: unit.id || `sector-${unit.name}`,
            name: unit.name,
            descr: unit.descr,
            costAmount: unit.costAmount,
            projectedCostAmount: unit.projectedCostAmount,
            staff: unit.staff || [],
            projectedStaff: unit.projectedStaff || [],
          })) || [];

        const normalizedData = {
          internation: normalizedInternation,
          assistance: normalizedAssistance,
        };

        console.log("✅ Dados projetados normalizados:", {
          totalUnidadesInternacao: normalizedInternation.length,
          totalUnidadesNaoInternacao: normalizedAssistance.length,
          exemploInternacao: normalizedInternation[0],
        });

        setProjetadoData(normalizedData);
      } catch (error) {
        console.error("❌ Erro ao buscar dados projetados da rede:", error);
        setProjetadoData(null);
      }
    };

    fetchProjetadoData();
  }, [redeId]);

  // ✅ Buscar dados comparativos agregados da rede
  useEffect(() => {
    const fetchComparativoData = async () => {
      if (!redeId) {
        setComparativoData(null);
        return;
      }

      try {
        const data = await getNetworkComparative(redeId, {
          includeProjected: true,
        });
        console.log("📊 Dados comparativos brutos recebidos da rede:", data);

        setComparativoData(data);
      } catch (error) {
        console.error("❌ Erro ao buscar dados comparativos da rede:", error);
        setComparativoData(null);
      }
    };

    fetchComparativoData();
  }, [redeId]);

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Globe /> Dashboard da Rede {rede?.nome}
        </h1>
        <p className="text-muted-foreground">
          Visão consolidada dos indicadores da rede.
        </p>
      </div>

      {/* Abas de Dashboard */}
      <Tabs defaultValue="atual">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="baseline">Baseline</TabsTrigger>
          <TabsTrigger value="atual">Atual</TabsTrigger>
          <TabsTrigger value="projetado">Projetado</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
        </TabsList>

        {!redeId ? (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                  Nenhuma rede selecionada.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="baseline">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardBaselineScreen
                  title={`Análise Econômico-Financeira Baseline - Rede ${
                    rede?.nome || ""
                  }`}
                  externalData={baselineData}
                  isGlobalView={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="atual">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardAtualScreen
                  title={`Análise Econômico-Financeira Atual - Rede ${
                    rede?.nome || ""
                  }`}
                  externalData={atualData}
                  isGlobalView={true}
                  aggregationType="rede"
                  entityId={redeId}
                  redeId={redeId}
                />
              </div>
            </TabsContent>

            <TabsContent value="projetado">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardProjetadoScreen
                  title={`Análise Econômico-Financeira Projetada - Rede ${
                    rede?.nome || ""
                  }`}
                  externalData={projetadoData}
                  isGlobalView={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="comparativo">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardComparativoHospitalScreen
                  title={`Análise Comparativa - Rede ${rede?.nome || ""}`}
                  externalData={comparativoData}
                  isGlobalView={true}
                />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
