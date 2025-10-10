import { useState, useMemo, useEffect } from "react";
import { Globe, Layers } from "lucide-react";

// Importando os componentes de dashboard
import { DashboardAtualScreen } from "@/features/admin-hospital/components/DashboardAtualScreen";
import { DashboardProjetadoScreen } from "@/features/admin-hospital/components/DashboardProjetadoScreen";
import { clearSectorsCache } from "@/mocks/functionSectores";

// Importando componentes de gráficos específicos
import { PizzaChart } from "@/features/admin-hospital/components/PizzaChart";
import ParetoChart from "@/features/admin-hospital/components/ParetoChart";

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

// Função para transformar dados agregados em formato para gráficos
const transformAggregatedData = (data: any, groupBy: GroupByKey) => {
  console.log("🔧 Transformando dados para gráficos...", { groupBy, data });

  if (!data || !data.hospitals) {
    console.warn("⚠️ Dados inválidos ou vazios");
    return null;
  }

  // PARETO: Custos por setor
  const paretoData: Array<{ nome: string; custo: number }> = [];

  // PESSOAL: Quantidade de funcionários por hospital
  const pessoalData: Array<{ name: string; atual: number; projetado: number }> =
    [];

  // SCP: Distribuição por nível de cuidado (internação)
  const scpData: Array<{ name: string; value: number }> = [];

  // Processar cada hospital
  data.hospitals.forEach((hospital: any) => {
    console.log(`📋 Processando hospital: ${hospital.hospitalName}`);

    let totalStaff = 0;

    // Processar setores de INTERNAÇÃO
    if (hospital.internation && Array.isArray(hospital.internation)) {
      hospital.internation.forEach((setor: any) => {
        // Adicionar ao Pareto
        const custo = parseFloat(setor.costAmount || 0);
        paretoData.push({
          nome: `${hospital.hospitalName} - ${setor.name}`,
          custo: custo,
        });

        // Contar staff
        if (setor.staff && Array.isArray(setor.staff)) {
          const staffCount = setor.staff.reduce(
            (sum: number, s: any) => sum + (s.quantity || 0),
            0
          );
          totalStaff += staffCount;
        }

        // Processar SCP (níveis de cuidado)
        if (setor.careLevel) {
          if (setor.careLevel.minimumCare) {
            scpData.push({
              name: "Cuidados Mínimos",
              value: setor.careLevel.minimumCare,
            });
          }
          if (setor.careLevel.intermediateCare) {
            scpData.push({
              name: "Intermediários",
              value: setor.careLevel.intermediateCare,
            });
          }
          if (setor.careLevel.highDependency) {
            scpData.push({
              name: "Alta Dependência",
              value: setor.careLevel.highDependency,
            });
          }
          if (setor.careLevel.semiIntensive) {
            scpData.push({
              name: "Semi-intensivo",
              value: setor.careLevel.semiIntensive,
            });
          }
          if (setor.careLevel.intensive) {
            scpData.push({
              name: "Intensivo",
              value: setor.careLevel.intensive,
            });
          }
        }
      });
    }

    // Processar setores de NÃO-INTERNAÇÃO (assistance)
    if (hospital.assistance && Array.isArray(hospital.assistance)) {
      hospital.assistance.forEach((setor: any) => {
        // Adicionar ao Pareto
        const custo = parseFloat(setor.costAmount || 0);
        paretoData.push({
          nome: `${hospital.hospitalName} - ${setor.name}`,
          custo: custo,
        });

        // Contar staff
        if (setor.staff && Array.isArray(setor.staff)) {
          const staffCount = setor.staff.reduce(
            (sum: number, s: any) => sum + (s.quantity || 0),
            0
          );
          totalStaff += staffCount;
        }
      });
    }

    // Adicionar total de pessoal do hospital
    pessoalData.push({
      name: hospital.hospitalName,
      atual: totalStaff,
      projetado: Math.round(totalStaff * 0.7), // Mock: 30% de redução projetada
    });
  });

  // Ordenar Pareto por custo (decrescente)
  paretoData.sort((a, b) => b.custo - a.custo);

  // Calcular acumulado para Pareto
  const totalCusto = paretoData.reduce((sum, item) => sum + item.custo, 0);
  let acumulado = 0;
  const paretoChartData = paretoData.map((item) => {
    acumulado += item.custo;
    return {
      ...item,
      acumulado,
      acumuladoPercent: totalCusto ? (acumulado / totalCusto) * 100 : 0,
    };
  });

  // Agregar SCP (somar valores iguais)
  const scpAggregated: Array<{ name: string; value: number }> = [];
  scpData.forEach((item) => {
    const existing = scpAggregated.find((s) => s.name === item.name);
    if (existing) {
      existing.value += item.value;
    } else {
      scpAggregated.push({ ...item });
    }
  });

  console.log("✅ Dados transformados:", {
    paretoChartData: paretoChartData.slice(0, 5), // Primeiros 5
    totalCusto,
    pessoalData,
    scpAggregated,
  });

  return {
    paretoChartData,
    totalCusto,
    pessoalData,
    scpAggregated,
  };
};

export default function GlobalDashboardPage() {
  const [groupBy, setGroupBy] = useState<GroupByKey>("hospital");
  const [loading, setLoading] = useState(false);

  // Estados para armazenar as listas
  const [redes, setRedes] = useState<Rede[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [hospitais, setHospitais] = useState<Hospital[]>([]);

  // Estados para armazenar os dados agregados
  const [aggregatedData, setAggregatedData] = useState<any>(null);

  // Estado para os dados transformados (prontos para gráficos)
  const [chartData, setChartData] = useState<any>(null); // Carregar as listas de Redes, Grupos, Regiões e Hospitais ao montar o componente
  useEffect(() => {
    const fetchListas = async () => {
      try {
        console.log(
          "🔄 Buscando listas de Redes, Grupos, Regiões e Hospitais..."
        );

        const [redesData, gruposData, regioesData, hospitaisData] =
          await Promise.all([
            getRedes(),
            getGrupos(),
            getRegioes(),
            getHospitais(),
          ]);

        console.log("✅ Redes:", redesData);
        console.log("✅ Grupos:", gruposData);
        console.log("✅ Regiões:", regioesData);
        console.log("✅ Hospitais:", hospitaisData);

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

  // Buscar dados agregados com base no groupBy selecionado
  useEffect(() => {
    const fetchAggregatedData = async () => {
      setLoading(true);
      try {
        console.log(`🔄 Buscando dados agregados para: ${groupBy}`);

        let data: any = null;

        switch (groupBy) {
          case "rede":
            // Buscar dados agregados de todas as redes
            if (redes.length > 0) {
              const redePromises = redes.map((rede) =>
                getRedesAggregated(rede.id)
              );
              const redesAgregadas = await Promise.all(redePromises);
              console.log("📊 Dados agregados por REDE:", redesAgregadas);

              // Transformar para formato esperado pelo DashboardAtualScreen
              const allInternationRede: any[] = [];
              const allAssistanceRede: any[] = [];

              redesAgregadas.forEach((redeData: any) => {
                if (redeData?.hospitals) {
                  redeData.hospitals.forEach((hospital: any) => {
                    if (hospital.internation) {
                      const sectorsWithHospital = hospital.internation.map(
                        (sector: any) => ({
                          ...sector,
                          hospitalName: hospital.hospitalName,
                          redeName: redeData.name || redeData.id,
                        })
                      );
                      allInternationRede.push(...sectorsWithHospital);
                    }
                    if (hospital.assistance) {
                      const sectorsWithHospital = hospital.assistance.map(
                        (sector: any) => ({
                          ...sector,
                          hospitalName: hospital.hospitalName,
                          redeName: redeData.name || redeData.id,
                        })
                      );
                      allAssistanceRede.push(...sectorsWithHospital);
                    }
                  });
                }
              });

              const transformedDataRede = {
                id: "all-redes-sectors",
                internation: allInternationRede,
                assistance: allAssistanceRede,
              };

              console.log(
                "🔄 Dados transformados (Rede) para DashboardAtualScreen:",
                transformedDataRede
              );

              data = { type: "rede", items: transformedDataRede };
            }
            break;

          case "grupo":
            // Buscar dados agregados de todos os grupos
            if (grupos.length > 0) {
              const grupoPromises = grupos.map((grupo) =>
                getGruposAggregated(grupo.id)
              );
              const gruposAgregados = await Promise.all(grupoPromises);
              console.log("📊 Dados agregados por GRUPO:", gruposAgregados);

              // Transformar para formato esperado pelo DashboardAtualScreen
              const allInternationGrupo: any[] = [];
              const allAssistanceGrupo: any[] = [];

              gruposAgregados.forEach((grupoData: any) => {
                if (grupoData?.hospitals) {
                  grupoData.hospitals.forEach((hospital: any) => {
                    if (hospital.internation) {
                      const sectorsWithHospital = hospital.internation.map(
                        (sector: any) => ({
                          ...sector,
                          hospitalName: hospital.hospitalName,
                          grupoName: grupoData.name || grupoData.id,
                        })
                      );
                      allInternationGrupo.push(...sectorsWithHospital);
                    }
                    if (hospital.assistance) {
                      const sectorsWithHospital = hospital.assistance.map(
                        (sector: any) => ({
                          ...sector,
                          hospitalName: hospital.hospitalName,
                          grupoName: grupoData.name || grupoData.id,
                        })
                      );
                      allAssistanceGrupo.push(...sectorsWithHospital);
                    }
                  });
                }
              });

              const transformedDataGrupo = {
                id: "all-grupos-sectors",
                internation: allInternationGrupo,
                assistance: allAssistanceGrupo,
              };

              console.log(
                "🔄 Dados transformados (Grupo) para DashboardAtualScreen:",
                transformedDataGrupo
              );

              data = { type: "grupo", items: transformedDataGrupo };
            }
            break;

          case "regiao":
            // Buscar dados agregados de todas as regiões
            if (regioes.length > 0) {
              const regiaoPromises = regioes.map((regiao) =>
                getRegioesAggregated(regiao.id)
              );
              const regioesAgregadas = await Promise.all(regiaoPromises);
              console.log("📊 Dados agregados por REGIÃO:", regioesAgregadas);

              // Transformar para formato esperado pelo DashboardAtualScreen
              // Agregar todos os setores de todas as regiões em listas únicas
              const allInternationRegiao: any[] = [];
              const allAssistanceRegiao: any[] = [];

              regioesAgregadas.forEach((regiaoData: any) => {
                if (regiaoData?.hospitals) {
                  regiaoData.hospitals.forEach((hospital: any) => {
                    if (hospital.internation) {
                      const sectorsWithHospital = hospital.internation.map(
                        (sector: any) => ({
                          ...sector,
                          hospitalName: hospital.hospitalName,
                          regiaoName: regiaoData.name || regiaoData.id,
                        })
                      );
                      allInternationRegiao.push(...sectorsWithHospital);
                    }
                    if (hospital.assistance) {
                      const sectorsWithHospital = hospital.assistance.map(
                        (sector: any) => ({
                          ...sector,
                          hospitalName: hospital.hospitalName,
                          regiaoName: regiaoData.name || regiaoData.id,
                        })
                      );
                      allAssistanceRegiao.push(...sectorsWithHospital);
                    }
                  });
                }
              });

              const transformedDataRegiao = {
                id: "all-regioes-sectors",
                internation: allInternationRegiao,
                assistance: allAssistanceRegiao,
              };

              console.log(
                "🔄 Dados transformados (Região) para DashboardAtualScreen:",
                transformedDataRegiao
              );

              data = { type: "regiao", items: transformedDataRegiao };
            }
            break;

          case "hospital":
            // Buscar dados agregados de todos os hospitais
            const hospitaisAgregados = await getHospitaisAggregated();
            console.log("📊 Dados agregados por HOSPITAL:", hospitaisAgregados);

            // Transformar para formato esperado pelo DashboardAtualScreen
            // O DashboardAtualScreen espera: { id, internation: [...], assistance: [...] }
            // getHospitaisAggregated retorna: { id, hospitals: [{ hospitalName, internation: [...], assistance: [...] }] }

            // Agregar todos os setores de todos os hospitais em listas únicas
            // IMPORTANTE: Adicionar o hospitalName em cada setor para identificação visual
            const allInternation: any[] = [];
            const allAssistance: any[] = [];

            if (hospitaisAgregados?.hospitals) {
              hospitaisAgregados.hospitals.forEach((hospital: any) => {
                if (hospital.internation) {
                  const sectorsWithHospital = hospital.internation.map(
                    (sector: any) => ({
                      ...sector,
                      hospitalName: hospital.hospitalName,
                    })
                  );
                  allInternation.push(...sectorsWithHospital);
                }
                if (hospital.assistance) {
                  const sectorsWithHospital = hospital.assistance.map(
                    (sector: any) => ({
                      ...sector,
                      hospitalName: hospital.hospitalName,
                    })
                  );
                  allAssistance.push(...sectorsWithHospital);
                }
              });
            }

            const transformedData = {
              id: hospitaisAgregados.id,
              internation: allInternation,
              assistance: allAssistance,
            };

            console.log(
              "🔄 Dados transformados para DashboardAtualScreen:",
              transformedData
            );

            data = { type: "hospital", items: transformedData };

            // Transformar dados para gráficos
            const transformed = transformAggregatedData(
              hospitaisAgregados,
              groupBy
            );
            setChartData(transformed);
            break;
        }

        setAggregatedData(data);
      } catch (error) {
        console.error("❌ Erro ao buscar dados agregados:", error);
      } finally {
        setLoading(false);
      }
    };

    // Só buscar se já tiver carregado as listas
    if (
      redes.length > 0 ||
      grupos.length > 0 ||
      regioes.length > 0 ||
      hospitais.length > 0
    ) {
      fetchAggregatedData();
    }
  }, [groupBy, redes, grupos, regioes, hospitais]);

  useEffect(() => {
    console.log("Dashboard Global - Admin");
    clearSectorsCache();
  }, []);

  console.log("🔵 GlobalDashboardPage - Estado atual:", {
    groupBy,
    loading,
    hasAggregatedData: !!aggregatedData,
    hasChartData: !!chartData,
    redesCount: redes.length,
    gruposCount: grupos.length,
    regioesCount: regioes.length,
    hospitaisCount: hospitais.length,
  });

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

      {/* Debug Info - Remover depois */}
      {aggregatedData && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm font-mono">
              <strong>Debug:</strong> Dados carregados para{" "}
              {aggregatedData.type}
              {Array.isArray(aggregatedData.items) &&
                ` (${aggregatedData.items.length} itens)`}
              <br />
              <span className="text-xs text-gray-600">
                Verifique o console para detalhes completos
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Debug Info - Dados Transformados */}
      {chartData && (
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm font-mono">
              <strong>📊 Dados Transformados para Gráficos:</strong>
              <br />• Pareto: {chartData.paretoChartData?.length || 0} setores
              (Custo total: R$ {chartData.totalCusto?.toLocaleString("pt-BR")})
              <br />• Pessoal: {chartData.pessoalData?.length || 0} hospitais
              <br />• SCP: {chartData.scpAggregated?.length || 0} categorias
              <br />
              <span className="text-xs text-gray-600">
                Verifique o console para ver estrutura completa
              </span>
            </p>
          </CardContent>
        </Card>
      )}

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

      {/* Abas de Dashboard */}
      <Tabs defaultValue="baseline">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="atual">Atual</TabsTrigger>
          <TabsTrigger value="projetado">Projetado</TabsTrigger>
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
                />
              </div>
            </TabsContent>

            <TabsContent value="projetado">
              <div className="grid grid-cols-1 gap-6 mt-6">
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
                />
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
