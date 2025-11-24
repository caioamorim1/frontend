import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Globe } from "lucide-react";

// Importando os componentes de dashboard
import { DashboardAtualScreen } from "@/features/admin-hospital/components/DashboardAtualScreen";
import { DashboardProjetadoScreen } from "@/features/admin-hospital/components/DashboardProjetadoScreen";
import { DashboardBaselineScreen } from "@/features/admin-hospital/components/DashboardBaselineScreen";
import { DashboardComparativoGlobalScreen } from "@/features/admin-hospital/components/DashboardComparativoGlobalScreen";
import { clearSectorsCache } from "@/mocks/functionSectores";

// Importando as APIs
import {
  getRedes,
  getSnapshotSelectedByGroup,
  Rede,
} from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GlobalDashboardPage() {
  const { redeId } = useParams<{ redeId: string }>();
  const [loading, setLoading] = useState(false);
  const [rede, setRede] = useState<Rede | null>(null);

  // ✅ Estado para dados da baseline (snapshots agregados da rede)
  const [baselineData, setBaselineData] = useState<any>(null);

  // Carregar informações da rede
  useEffect(() => {
    const fetchRede = async () => {
      if (!redeId) return;
      
      try {
        const redesData = await getRedes();
        const redeEncontrada = redesData.find(r => r.id === redeId);
        
        if (redeEncontrada) {
          setRede(redeEncontrada);
          console.log("🌐 Rede carregada:", { id: redeEncontrada.id, nome: redeEncontrada.nome });
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

      setLoading(true);
      try {
        // Buscar snapshots de todos os hospitais da rede
        const snapshots = await getSnapshotSelectedByGroup("rede", redeId);
        console.log("📊 Snapshots recebidos da rede:", {
          totalSnapshots: snapshots.length,
          hospitais: snapshots.map(s => s.hospital.nome)
        });

        // Agregar dados de internação e não-internação de todos os hospitais
        const allInternation: any[] = [];
        const allAssistance: any[] = [];

        snapshots.forEach(snapshot => {
          if (snapshot.dados?.internation) {
            // Normalizar valores de costAmount (centavos -> reais)
            const normalizedInternation = snapshot.dados.internation.map((unit: any) => ({
              ...unit,
              costAmount: unit.costAmount ? unit.costAmount / 100 : 0,
              staff: unit.staff?.map((s: any) => ({
                ...s,
                unitCost: s.unitCost ? s.unitCost / 100 : 0,
                totalCost: s.totalCost ? s.totalCost / 100 : 0,
              })) || []
            }));
            allInternation.push(...normalizedInternation);
          }
          if (snapshot.dados?.assistance) {
            // Normalizar valores de costAmount (centavos -> reais)
            const normalizedAssistance = snapshot.dados.assistance.map((unit: any) => ({
              ...unit,
              costAmount: unit.costAmount ? unit.costAmount / 100 : 0,
              staff: unit.staff?.map((s: any) => ({
                ...s,
                unitCost: s.unitCost ? s.unitCost / 100 : 0,
                totalCost: s.totalCost ? s.totalCost / 100 : 0,
              })) || []
            }));
            allAssistance.push(...normalizedAssistance);
          }
        });

        // Dados no formato que o DashboardBaselineScreen espera
        const aggregatedData = {
          internation: allInternation,
          assistance: allAssistance
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
      } finally {
        setLoading(false);
      }
    };

    fetchBaselineData();
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

        {loading ? (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                  Carregando dados da rede...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : !redeId ? (
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
                  title={`Análise Econômico-Financeira Baseline - Rede ${rede?.nome || ''}`}
                  externalData={baselineData}
                  isGlobalView={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="atual">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardAtualScreen
                  title={`Análise Econômico-Financeira Atual - Rede ${rede?.nome || ''}`}
                  externalData={baselineData}
                  isGlobalView={true}
                  aggregationType="rede"
                />
              </div>
            </TabsContent>

            <TabsContent value="projetado">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardProjetadoScreen
                  title={`Análise Econômico-Financeira Projetada - Rede ${rede?.nome || ''}`}
                  externalData={baselineData}
                  isGlobalView={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="comparativo">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardComparativoGlobalScreen
                  title={`Análise Comparativa - Rede ${rede?.nome || ''}`}
                  externalAtualData={baselineData}
                  externalProjectedData={baselineData}
                />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
