import { useState, useMemo, useEffect } from "react";
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
  getHospitais,
  getRedesAggregated,
  getGruposAggregated,
  getRegioesAggregated,
  getHospitaisAggregated,
  // ✅ NOVAS APIs PROJETADAS
  getRedesProjectedAggregated,
  getGruposProjectedAggregated,
  getRegioesProjectedAggregated,
  getHospitaisProjectedAggregated,
  // snapshot aggregated
  getSnapshotAggregated,
  getSnapshotAggregatedAll,
  Rede,
  Grupo,
  Regiao,
  Hospital,
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

type GroupByKey = "rede" | "grupo" | "regiao" | "hospital";

export default function GlobalDashboardPage() {
  const [groupBy, setGroupBy] = useState<GroupByKey>("hospital");
  const [loading, setLoading] = useState(false);

  // Estados para armazenar as listas
  const [redes, setRedes] = useState<Rede[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [hospitais, setHospitais] = useState<Hospital[]>([]);

  // Estados para armazenar os dados agregados (ATUAL)
  const [aggregatedData, setAggregatedData] = useState<any>(null);

  // ✅ NOVO: Estado para dados PROJETADOS
  const [projectedData, setProjectedData] = useState<any>(null);
  // Estado para a entidade selecionada na visão comparativa
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  // snapshot aggregated (baseline) carregado automaticamente
  const [snapshotAggregated, setSnapshotAggregated] = useState<any | null>(
    null
  );

  // Carregar as listas de Redes, Grupos, Regiões e Hospitais ao montar o componente
  useEffect(() => {
    const fetchListas = async () => {
      try {
      

        const [redesData, gruposData, regioesData, hospitaisData] =
          await Promise.all([
            getRedes(),
            getGrupos(),
            getRegioes(),
            getHospitais(),
          ]);

   

        setRedes(redesData);
        setGrupos(gruposData);
        setRegioes(regioesData);
        setHospitais(hospitaisData);
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
      setLoading(true);
      try {
      

        let data: any = null;

        switch (groupBy) {
          case "rede":
            if (redes.length > 0) {
              const redePromises = redes.map((rede) =>
                getRedesAggregated(rede.id)
              );
              const redesAgregadas = await Promise.all(redePromises);
              // Construir array de entidades (uma por rede) com seus setores concatenados
              const redesItems = redesAgregadas.map(
                (redeData: any, redeIndex: number) => {
                  const redeInfo = redes[redeIndex];
                  const redeId = redeInfo?.id || `rede-${redeIndex}`;
                  const redeName = redeInfo?.nome || `Rede ${redeIndex + 1}`;

                  const allIntern: any[] = [];
                  const allAssist: any[] = [];

                  if (redeData?.hospitals) {
                    redeData.hospitals.forEach((hospital: any) => {
                      if (hospital.internation) {
                        const sectorsWithHospital = hospital.internation.map(
                          (sector: any) => ({
                            ...sector,
                            hospitalName:
                              hospital.hospitalName ||
                              hospital.hospital ||
                              hospital.nome ||
                              hospital.name,
                          })
                        );
                        allIntern.push(...sectorsWithHospital);
                      }
                      if (hospital.assistance) {
                        const sectorsWithHospital = hospital.assistance.map(
                          (sector: any) => ({
                            ...sector,
                            hospitalName:
                              hospital.hospitalName ||
                              hospital.hospital ||
                              hospital.nome ||
                              hospital.name,
                          })
                        );
                        allAssist.push(...sectorsWithHospital);
                      }
                    });
                  }

                  return {
                    id: redeId,
                    name: redeName,
                    internation: allIntern,
                    assistance: allAssist,
                  };
                }
              );

              data = { type: "rede", items: redesItems };
            }
            break;

          case "grupo":
            if (grupos.length > 0) {
              const grupoPromises = grupos.map((grupo) =>
                getGruposAggregated(grupo.id)
              );
              const gruposAgregados = await Promise.all(grupoPromises);

              const gruposItems = gruposAgregados.map(
                (grupoData: any, grupoIndex: number) => {
                  const grupoInfo = grupos[grupoIndex];
                  const grupoId = grupoInfo?.id || `grupo-${grupoIndex}`;
                  const grupoName =
                    grupoInfo?.nome || `Grupo ${grupoIndex + 1}`;

                  const allIntern: any[] = [];
                  const allAssist: any[] = [];

                  if (grupoData?.hospitals) {
                    grupoData.hospitals.forEach((hospital: any) => {
                      if (hospital.internation) {
                        const sectorsWithHospital = hospital.internation.map(
                          (sector: any) => ({
                            ...sector,
                            hospitalName:
                              hospital.hospitalName ||
                              hospital.hospital ||
                              hospital.nome ||
                              hospital.name,
                          })
                        );
                        allIntern.push(...sectorsWithHospital);
                      }
                      if (hospital.assistance) {
                        const sectorsWithHospital = hospital.assistance.map(
                          (sector: any) => ({
                            ...sector,
                            hospitalName:
                              hospital.hospitalName ||
                              hospital.hospital ||
                              hospital.nome ||
                              hospital.name,
                          })
                        );
                        allAssist.push(...sectorsWithHospital);
                      }
                    });
                  }

                  return {
                    id: grupoId,
                    name: grupoName,
                    internation: allIntern,
                    assistance: allAssist,
                  };
                }
              );

              data = { type: "grupo", items: gruposItems };
            }
            break;

          case "regiao":
            if (regioes.length > 0) {
              const regiaoPromises = regioes.map((regiao) =>
                getRegioesAggregated(regiao.id)
              );
              const regioesAgregadas = await Promise.all(regiaoPromises);

              const regioesItems = regioesAgregadas.map(
                (regiaoData: any, regiaoIndex: number) => {
                  const regiaoInfo = regioes[regiaoIndex];
                  const regiaoId = regiaoInfo?.id || `regiao-${regiaoIndex}`;
                  const regiaoName =
                    regiaoInfo?.nome || `Região ${regiaoIndex + 1}`;

                  const allIntern: any[] = [];
                  const allAssist: any[] = [];

                  if (regiaoData?.hospitals) {
                    regiaoData.hospitals.forEach((hospital: any) => {
                      if (hospital.internation) {
                        const sectorsWithHospital = hospital.internation.map(
                          (sector: any) => ({
                            ...sector,
                            hospitalName:
                              hospital.hospitalName ||
                              hospital.hospital ||
                              hospital.nome ||
                              hospital.name,
                          })
                        );
                        allIntern.push(...sectorsWithHospital);
                      }
                      if (hospital.assistance) {
                        const sectorsWithHospital = hospital.assistance.map(
                          (sector: any) => ({
                            ...sector,
                            hospitalName:
                              hospital.hospitalName ||
                              hospital.hospital ||
                              hospital.nome ||
                              hospital.name,
                          })
                        );
                        allAssist.push(...sectorsWithHospital);
                      }
                    });
                  }

                  return {
                    id: regiaoId,
                    name: regiaoName,
                    internation: allIntern,
                    assistance: allAssist,
                  };
                }
              );

              data = { type: "regiao", items: regioesItems };
            }
            break;

          case "hospital":
            const hospitaisAgregados = await getHospitaisAggregated();

            // Se a API retornar um array de hospitais, usar esse array diretamente como items
            if (hospitaisAgregados?.hospitals) {
              const hospitaisItems = hospitaisAgregados.hospitals.map(
                (hospital: any) => ({
                  id:
                    hospital.id ||
                    hospital.hospitalId ||
                    hospital.hospitalName ||
                    hospital.nome,
                  name:
                    hospital.hospitalName ||
                    hospital.nome ||
                    hospital.name ||
                    hospital.id,
                  internation: hospital.internation || [],
                  assistance: hospital.assistance || [],
                })
              );

              data = { type: "hospital", items: hospitaisItems };
            } else {
              data = { type: "hospital", items: [] };
            }
            break;
        }

        setAggregatedData(data);
      } catch (error) {
        console.error("❌ Erro ao buscar dados agregados:", error);
      } finally {
        setLoading(false);
      }
    };

    if (
      redes.length > 0 ||
      grupos.length > 0 ||
      regioes.length > 0 ||
      hospitais.length > 0
    ) {
      fetchAggregatedData();
    }
  }, [groupBy, redes, grupos, regioes, hospitais]);

  // ✅ NOVO: Buscar dados PROJETADOS agregados
  useEffect(() => {
    const fetchProjectedData = async () => {
      try {
  

        let data: any = null;

        switch (groupBy) {
          case "rede":
            // ✅ Usar nova API de redes projetadas
            const redesProjetadas = await getRedesProjectedAggregated();
   
            data = { type: "rede", items: redesProjetadas };
            break;

          case "grupo":
            // ✅ Usar nova API de grupos projetados
            const gruposProjetados = await getGruposProjectedAggregated();

            data = { type: "grupo", items: gruposProjetados };
            break;

          case "regiao":
            // ✅ Usar nova API de regiões projetadas
            const regioesProjetadas = await getRegioesProjectedAggregated();
   
            data = { type: "regiao", items: regioesProjetadas };
            break;

          case "hospital":
            // ✅ Usar nova API de hospitais projetados
            const hospitaisProjetados = await getHospitaisProjectedAggregated();

            data = { type: "hospital", items: hospitaisProjetados };
            break;
        }

        setProjectedData(data);

      } catch (error) {
        console.error("❌ Erro ao buscar dados projetados:", error);
      }
    };

    // Só buscar se já tiver carregado as listas
    if (
      redes.length > 0 ||
      grupos.length > 0 ||
      regioes.length > 0 ||
      hospitais.length > 0
    ) {
      fetchProjectedData();
    }
  }, [groupBy, redes, grupos, regioes, hospitais]);

  useEffect(() => {
   
    clearSectorsCache();
  }, []);

  // (removed manual snapshotId input) snapshot aggregated is fetched automatically below

  // Buscar /snapshot/aggregated/all para preencher baseline automaticamente
  useEffect(() => {
    const fetchSnapshotAggregatedAll = async () => {
      try {
       
        const data = await getSnapshotAggregatedAll();

        setSnapshotAggregated(data);
      } catch (err) {
        console.warn(
          "⚠️ Não foi possível buscar snapshot aggregated all:",
          err
        );
      }
    };

    if (
      redes.length > 0 ||
      grupos.length > 0 ||
      regioes.length > 0 ||
      hospitais.length > 0
    ) {
      fetchSnapshotAggregatedAll();
    }
  }, [redes, grupos, regioes, hospitais]);



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

      {/* Filtro de Agrupamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers /> Agrupador Principal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <label className="text-sm font-medium text-muted-foreground">
              Agrupar gráficos por:
            </label>
            <Select
              value={groupBy}
              onValueChange={(v) => setGroupBy(v as GroupByKey)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="rede">Rede</SelectItem>
                <SelectItem value="grupo">Grupo</SelectItem>
                <SelectItem value="regiao">Região</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Baseline (Snapshot agregado) é carregado automaticamente via backend */}

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
        ) : (
          <>
            <TabsContent value="baseline">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardBaselineScreen
                  title={`Análise Econômico-Financeira Baseline - ${
                    groupBy === "rede"
                      ? "Por Rede"
                      : groupBy === "grupo"
                      ? "Por Grupo"
                      : groupBy === "regiao"
                      ? "Por Região"
                      : "Por Hospital"
                  }`}
                  externalData={
                    (snapshotAggregated && snapshotAggregated[groupBy]) ||
                    snapshotAggregated ||
                    aggregatedData?.items ||
                    aggregatedData
                  }
                  isGlobalView={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="atual">
              <div className="grid grid-cols-1 gap-6 mt-6">
                <DashboardAtualScreen
                  title={`Análise Econômico-Financeira Atual - ${
                    groupBy === "rede"
                      ? "Por Rede"
                      : groupBy === "grupo"
                      ? "Por Grupo"
                      : groupBy === "regiao"
                      ? "Por Região"
                      : "Por Hospital"
                  }`}
                  externalData={aggregatedData?.items}
                  isGlobalView={true}
                  aggregationType={groupBy}
                />
              </div>
            </TabsContent>

            <TabsContent value="projetado">
              <div className="grid grid-cols-1 gap-6 mt-6">
                {/* ✅ Passar dados PROJETADOS para o componente */}
                <DashboardProjetadoScreen
                  title={`Análise Econômico-Financeira Projetada - ${
                    groupBy === "rede"
                      ? "Por Rede"
                      : groupBy === "grupo"
                      ? "Por Grupo"
                      : groupBy === "regiao"
                      ? "Por Região"
                      : "Por Hospital"
                  }`}
                  externalData={projectedData?.items}
                  isGlobalView={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="comparativo">
              <div className="grid grid-cols-1 gap-6 mt-6">
                {/* Select para escolher uma entidade específica quando em visão global */}
                <div className="max-w-sm">
                  <label className="text-sm font-medium text-muted-foreground">
                    Selecionar entidade para comparar
                  </label>
                  <Select
                    value={selectedEntityId || "all"}
                    onValueChange={(v) =>
                      setSelectedEntityId(v === "all" ? null : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="all">
                        Todas as entidades (consolidado)
                      </SelectItem>
                      {groupBy === "rede" &&
                        redes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.nome || r.id}
                          </SelectItem>
                        ))}
                      {groupBy === "grupo" &&
                        grupos.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.nome || g.id}
                          </SelectItem>
                        ))}
                      {groupBy === "regiao" &&
                        regioes.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.nome || r.id}
                          </SelectItem>
                        ))}
                      {groupBy === "hospital" &&
                        hospitais.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.nome || h.id}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preparar os dados atuais e projetados a serem passados ao componente comparativo */}
                {/* Se selectedEntityId for nulo, passamos o consolidated (aggregatedData?.items)
                     Caso contrário, tentamos localizar a entidade correspondente dentro de aggregatedData?.items
                  */}
                {(() => {
                  const getEntityItems = (data: any) => {
                    if (!data) return null;
                    // data can be array (items) or single object
                    if (Array.isArray(data)) {
                      if (!selectedEntityId) return data;
                      return (
                        data.find((it) => it.id === selectedEntityId) || null
                      );
                    }
                    // if object with items array (previous shape)
                    if (data.items) {
                      if (!selectedEntityId) return data.items;
                      return (
                        (Array.isArray(data.items)
                          ? data.items.find(
                              (it: any) => it.id === selectedEntityId
                            )
                          : data.items) || null
                      );
                    }
                    return data;
                  };

                  const atualForComparativo = getEntityItems(
                    aggregatedData?.items ?? aggregatedData
                  );
                  const projetadoForComparativo = getEntityItems(
                    projectedData?.items ?? projectedData
                  );

                  return (
                    <DashboardComparativoGlobalScreen
                      title={`Análise Comparativa - ${
                        groupBy === "rede"
                          ? "Por Rede"
                          : groupBy === "grupo"
                          ? "Por Grupo"
                          : groupBy === "regiao"
                          ? "Por Região"
                          : "Por Hospital"
                      }`}
                      externalAtualData={atualForComparativo}
                      externalProjectedData={projetadoForComparativo}
                    />
                  );
                })()}
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
