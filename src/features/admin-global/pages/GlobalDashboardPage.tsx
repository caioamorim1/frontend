import { useState, useEffect } from "react";
import { Globe, Layers } from "lucide-react";

// Importando os componentes de dashboard
import { DashboardAtualScreen } from "@/features/admin-hospital/components/DashboardAtualScreen";
import { DashboardProjetadoScreen } from "@/features/admin-hospital/components/DashboardProjetadoScreen";
import { DashboardBaselineScreen } from "@/features/admin-hospital/components/DashboardBaselineScreen";
import { DashboardComparativoGlobalScreen } from "@/features/admin-hospital/components/DashboardComparativoGlobalScreen";
import { clearSectorsCache } from "@/mocks/functionSectores";

// Importando as APIs de agregação
import {
  getRedes,
  getGrupos,
  getRegioes,
  getRedesAggregated,
  getGruposAggregated,
  getRegioesAggregated,
  // ✅ NOVAS APIs PROJETADAS
  getRedesProjectedAggregated,
  getGruposProjectedAggregated,
  getRegioesProjectedAggregated,
  // snapshot aggregated
  getSnapshotAggregated,
  Rede,
  Grupo,
  Regiao,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ViewType = "rede" | "grupo" | "regiao";

export default function GlobalDashboardPage() {
  const [viewType, setViewType] = useState<ViewType>("rede");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Estados para armazenar as listas
  const [redes, setRedes] = useState<Rede[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);

  // Estados para armazenar os dados agregados (ATUAL)
  const [aggregatedData, setAggregatedData] = useState<any>(null);

  // ✅ NOVO: Estado para dados PROJETADOS
  const [projectedData, setProjectedData] = useState<any>(null);
  
  // snapshot aggregated (baseline) carregado automaticamente
  const [snapshotAggregated, setSnapshotAggregated] = useState<any | null>(
    null
  );

  // Carregar as listas de Redes, Grupos e Regiões ao montar o componente
  useEffect(() => {
    const fetchListas = async () => {
      try {
        const [redesData, gruposData, regioesData] = await Promise.all([
          getRedes(),
          getGrupos(),
          getRegioes(),
        ]);

        setRedes(redesData);
        setGrupos(gruposData);
        setRegioes(regioesData);
      } catch (error) {
        console.error("❌ Erro ao buscar listas:", error);
      }
    };

    fetchListas();
    clearSectorsCache();
  }, []);

  // ✅ Buscar dados ATUAIS agregados
  useEffect(() => {
    const fetchAggregatedData = async () => {
      if (!selectedEntityId) {
        setAggregatedData(null);
        return;
      }

      setLoading(true);
      try {
        let data: any = null;

        switch (viewType) {
          case "rede":
            data = await getRedesAggregated(selectedEntityId);
            break;

          case "grupo":
            data = await getGruposAggregated(selectedEntityId);
            break;

          case "regiao":
            data = await getRegioesAggregated(selectedEntityId);
            break;
        }

        setAggregatedData(data);
      } catch (error) {
        console.error("❌ Erro ao buscar dados agregados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAggregatedData();
  }, [viewType, selectedEntityId]);

  // ✅ NOVO: Buscar dados PROJETADOS agregados
  useEffect(() => {
    const fetchProjectedData = async () => {
      if (!selectedEntityId) {
        setProjectedData(null);
        return;
      }

      try {
        let data: any = null;

        // As APIs projetadas retornam todos os dados, então precisamos filtrar pelo ID
        switch (viewType) {
          case "rede":
            const redesProjetadas = await getRedesProjectedAggregated();
            data = Array.isArray(redesProjetadas) 
              ? redesProjetadas.find((r: any) => r.id === selectedEntityId)
              : redesProjetadas;
            break;

          case "grupo":
            const gruposProjetados = await getGruposProjectedAggregated();
            data = Array.isArray(gruposProjetados)
              ? gruposProjetados.find((g: any) => g.id === selectedEntityId)
              : gruposProjetados;
            break;

          case "regiao":
            const regioesProjetadas = await getRegioesProjectedAggregated();
            data = Array.isArray(regioesProjetadas)
              ? regioesProjetadas.find((r: any) => r.id === selectedEntityId)
              : regioesProjetadas;
            break;
        }

        setProjectedData(data);
      } catch (error) {
        console.error("❌ Erro ao buscar dados projetados:", error);
      }
    };

    if (selectedEntityId) {
      fetchProjectedData();
    }
  }, [viewType, selectedEntityId]);

  useEffect(() => {
   
    clearSectorsCache();
  }, []);

  // (removed manual snapshotId input) snapshot aggregated is fetched automatically below

  // Buscar snapshot aggregated para baseline
  useEffect(() => {
    const fetchSnapshotAggregated = async () => {
      if (!selectedEntityId) {
        setSnapshotAggregated(null);
        return;
      }

      try {
        const data = await getSnapshotAggregated(selectedEntityId);
        setSnapshotAggregated(data);
      } catch (err) {
        console.warn("⚠️ Não foi possível buscar snapshot aggregated:", err);
      }
    };

    if (selectedEntityId) {
      fetchSnapshotAggregated();
    }
  }, [selectedEntityId]);

  // Auto-selecionar a primeira entidade quando o tipo de visualização mudar
  useEffect(() => {
    let firstEntityId: string | null = null;

    switch (viewType) {
      case "rede":
        firstEntityId = redes.length > 0 ? redes[0].id : null;
        break;
      case "grupo":
        firstEntityId = grupos.length > 0 ? grupos[0].id : null;
        break;
      case "regiao":
        firstEntityId = regioes.length > 0 ? regioes[0].id : null;
        break;
    }

    setSelectedEntityId(firstEntityId);
  }, [viewType, redes, grupos, regioes]);



  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Globe /> Dashboard Global
        </h1>
        <p className="text-muted-foreground">
          Visão consolidada dos indicadores por nível hierárquico.
        </p>
      </div>

      {/* Seletores de Tipo e Entidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers /> Filtros de Visualização
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primeiro Seletor: Tipo de Visualização */}
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Tipo de Visualização:
              </label>
              <Select
                value={viewType}
                onValueChange={(v) => setViewType(v as ViewType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="rede">Rede</SelectItem>
                  <SelectItem value="grupo">Grupo</SelectItem>
                  <SelectItem value="regiao">Região</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Segundo Seletor: Entidade Específica */}
            <div>
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                Selecionar {viewType === "rede" ? "Rede" : viewType === "grupo" ? "Grupo" : "Região"}:
              </label>
              <Select
                value={selectedEntityId || ""}
                onValueChange={(v) => setSelectedEntityId(v)}
                disabled={
                  (viewType === "rede" && redes.length === 0) ||
                  (viewType === "grupo" && grupos.length === 0) ||
                  (viewType === "regiao" && regioes.length === 0)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione uma ${viewType}`} />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {viewType === "rede" &&
                    redes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nome || r.id}
                      </SelectItem>
                    ))}
                  {viewType === "grupo" &&
                    grupos.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.nome || g.id}
                      </SelectItem>
                    ))}
                  {viewType === "regiao" &&
                    regioes.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nome || r.id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  Carregando dados agregados...
                </p>
              </div>
            </CardContent>
          </Card>
        ) : !selectedEntityId ? (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                  Selecione uma {viewType === "rede" ? "rede" : viewType === "grupo" ? "grupo" : "região"} para visualizar os dados.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="baseline">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardBaselineScreen
                  title={`Análise Econômico-Financeira Baseline - ${
                    viewType === "rede"
                      ? "Rede"
                      : viewType === "grupo"
                      ? "Grupo"
                      : "Região"
                  }`}
                  externalData={snapshotAggregated}
                  isGlobalView={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="atual">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardAtualScreen
                  title={`Análise Econômico-Financeira Atual - ${
                    viewType === "rede"
                      ? "Rede"
                      : viewType === "grupo"
                      ? "Grupo"
                      : "Região"
                  }`}
                  externalData={aggregatedData}
                  isGlobalView={true}
                  aggregationType={viewType}
                />
              </div>
            </TabsContent>

            <TabsContent value="projetado">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardProjetadoScreen
                  title={`Análise Econômico-Financeira Projetada - ${
                    viewType === "rede"
                      ? "Rede"
                      : viewType === "grupo"
                      ? "Grupo"
                      : "Região"
                  }`}
                  externalData={projectedData}
                  isGlobalView={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="comparativo">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardComparativoGlobalScreen
                  title={`Análise Comparativa - ${
                    viewType === "rede"
                      ? "Rede"
                      : viewType === "grupo"
                      ? "Grupo"
                      : "Região"
                  }`}
                  externalAtualData={aggregatedData}
                  externalProjectedData={projectedData}
                />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
