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
  getSnapshotDashboard,
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
        }
      } catch (error) {
        console.error("Erro ao buscar rede:", error);
      }
    };

    fetchRede();
    clearSectorsCache();
  }, [redeId]);

  // ✅ Baseline (rede) via rota consolidada do backend
  useEffect(() => {
    const fetchBaselineData = async () => {
      if (!redeId) {
        setBaselineData(null);
        return;
      }

      try {
        const dashboard = await getSnapshotDashboard("rede", redeId);

        setBaselineData(dashboard);
      } catch (error) {
        console.error("Erro ao buscar dados da rede:", error);
        setBaselineData(null);
      }
    };

    fetchBaselineData();
  }, [redeId]);

  //  Buscar dados atuais agregados da rede
  useEffect(() => {
    const fetchAtualData = async () => {
      if (!redeId) {
        setAtualData(null);
        return;
      }

      try {
        const data = await getNetworkSectors(redeId);

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

        setAtualData(normalizedData);
      } catch (error) {
        console.error("Erro ao buscar dados atuais da rede:", error);
        setAtualData(null);
      }
    };

    fetchAtualData();
  }, [redeId]);

  //  Buscar dados projetados agregados da rede
  useEffect(() => {
    const fetchProjetadoData = async () => {
      if (!redeId) {
        setProjetadoData(null);
        return;
      }

      try {
        const data = await getNetworkProjectedSectors(redeId);

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

        setProjetadoData(normalizedData);
      } catch (error) {
        console.error("Erro ao buscar dados projetados da rede:", error);
        setProjetadoData(null);
      }
    };

    fetchProjetadoData();
  }, [redeId]);

  //  Buscar dados comparativos agregados da rede
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

        setComparativoData(data);
      } catch (error) {
        console.error("Erro ao buscar dados comparativos da rede:", error);
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
      <Tabs defaultValue="baseline">
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
                  atualData={atualData}
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
