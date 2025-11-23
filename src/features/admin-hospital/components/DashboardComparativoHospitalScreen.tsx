// Hospital-specific comparative screen - Nova estrutura de dados da API
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
import { DollarSign, Calendar } from "lucide-react";
import { ReusableWaterfall } from "./graphicsComponents/ReusableWaterfall";
import { VariationCard } from "./VariationCard";
import { GroupedBarByRole } from "./graphicsComponents/GroupedBarByRole";
import {
  getHospitalComparative,
  HospitalComparativeResponse,
  NewSectorData,
} from "@/lib/api";
import { formatAmountBRL } from "@/lib/utils";

type SectorType = "global" | "internacao" | "nao-internacao";

export const DashboardComparativoHospitalScreen: React.FC<{
  title: string;
}> = ({ title }) => {
  const { hospitalId } = useParams<{ hospitalId: string }>();

  const [comparativeData, setComparativeData] =
    useState<HospitalComparativeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<SectorType>("global");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedSector("all");
  }, [activeTab]);

  useEffect(() => {
    if (comparativeData) setLoading(false);
  }, [comparativeData]);

  // Buscar dados comparativos da nova API
  useEffect(() => {
    let mounted = true;
    if (!hospitalId) return;

    const fetchComparativeData = async () => {
      try {
        setLoading(true);

        

        const resp = await getHospitalComparative(hospitalId, {
          includeProjected: true,
        });


        if (!mounted) return;

        setComparativeData(resp);
      } catch (err) {
        console.error("[Comparativo Hospital - NOVA API] Error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchComparativeData();

    return () => {
      mounted = false;
    };
  }, [hospitalId]);

  // Processar dados comparativos da nova estrutura
  const processedData = useMemo(() => {
    if (!comparativeData) {
      return null;
    }

    const { sectors } = comparativeData;

    // Determinar quais setores usar baseado na aba ativa
    let baseSectors: NewSectorData[] = [];
    if (activeTab === "global") {
      baseSectors = [...sectors.internation, ...sectors.assistance];
    } else if (activeTab === "internacao") {
      baseSectors = sectors.internation;
    } else {
      baseSectors = sectors.assistance;
    }

    // Criar lista de setores para o dropdown
    const setorList = baseSectors.map((s) => ({ id: s.id, name: s.name }));

    // Filtrar setores baseado na seleção
    const filteredSectors =
      selectedSector === "all"
        ? baseSectors
        : baseSectors.filter((s) => s.id === selectedSector);

    // Funções auxiliares para somar valores de objetos Record<string, number>
    const somarValores = (obj: Record<string, number>) => {
      return Object.values(obj).reduce((sum, val) => sum + val, 0);
    };

    // Calcular custo total do setor: custo unitário × quantidade de cada cargo
    const calcularCustoSetor = (
      custos: Record<string, number>,
      quantidades: Record<string, number>
    ) => {
      let total = 0;
      Object.keys(custos).forEach((cargo) => {
        const custoUnitario = custos[cargo] || 0;
        const quantidade = quantidades[cargo] || 0;
        total += custoUnitario * quantidade;
      });
      return total;
    };

    // BARRA 0: Atual Real (quadroAtualReal - dados tempo real do banco)
    const pessoalAtualReal = filteredSectors.reduce(
      (sum, sector) => sum + somarValores(sector.quadroAtualReal),
      0
    );

    // Custo Atual Real: custoUnitário REAL × quantidade real para cada cargo
    const custoAtualReal = filteredSectors.reduce(
      (sum, sector) =>
        sum +
        calcularCustoSetor(
          sector.custosAtualReal || sector.custosAtualSnapshot,
          sector.quadroAtualReal
        ),
      0
    );

    // BARRA 1: Baseline (quadroAtualSnapshot - primeira barra do waterfall)
    const pessoalAtualSnapshot = filteredSectors.reduce(
      (sum, sector) => sum + somarValores(sector.quadroAtualSnapshot),
      0
    );

    // Custo Baseline: custoUnitário × quantidade para cada cargo, somado por setor
    const custoAtualSnapshot = filteredSectors.reduce(
      (sum, sector) =>
        sum +
        calcularCustoSetor(
          sector.custosAtualSnapshot,
          sector.quadroAtualSnapshot
        ),
      0
    );

    // BARRA 2: Projetado (quadroProjetadoSnapshot - barra final do waterfall)
    const pessoalProjetadoSnapshot = filteredSectors.reduce(
      (sum, sector) => sum + somarValores(sector.quadroProjetadoSnapshot),
      0
    );

    // Custo Projetado: custoUnitário × quantidade projetada para cada cargo
    const custoProjetadoSnapshot = filteredSectors.reduce(
      (sum, sector) =>
        sum +
        calcularCustoSetor(
          sector.custosAtualSnapshot,
          sector.quadroProjetadoSnapshot
        ),
      0
    );

    // Variação (diferencas - já vem calculado da API!)
    const variacaoPessoal = filteredSectors.reduce(
      (sum, sector) => sum + somarValores(sector.diferencas),
      0
    );

    const variacaoCusto = custoProjetadoSnapshot - custoAtualSnapshot;

    const variacaoPercentual =
      custoAtualSnapshot > 0 ? (variacaoCusto / custoAtualSnapshot) * 100 : 0;

    // Montar dados do gráfico waterfall com 4 barras
    const financialWaterfall = [
      { name: "Atual", value: custoAtualReal },
      { name: "Baseline", value: custoAtualSnapshot },
      { name: "Variação", value: variacaoCusto },
      { name: "Projetado", value: custoProjetadoSnapshot },
    ];

    const personnelWaterfall = [
      { name: "Atual", value: pessoalAtualReal },
      { name: "Baseline", value: pessoalAtualSnapshot },
      { name: "Variação", value: variacaoPessoal },
      { name: "Projetado", value: pessoalProjetadoSnapshot },
    ];

   

    // Processar dados por função (cargo) para os gráficos GroupedBarByRole
    const dadosPorFuncao = (() => {
      // Mapear todos os cargos e suas quantidades/custos
      const mapaFuncaoAtualReal = new Map<
        string,
        { quantidade: number; custo: number }
      >();
      const mapaFuncaoBaseline = new Map<
        string,
        { quantidade: number; custo: number }
      >();
      const mapaFuncaoProjetado = new Map<
        string,
        { quantidade: number; custo: number }
      >();

      filteredSectors.forEach((sector) => {
        // Processar atual real (tempo real do banco)
        Object.keys(sector.quadroAtualReal).forEach((cargo) => {
          const qtdReal = sector.quadroAtualReal[cargo] || 0;
          const custoUnitario =
            (sector.custosAtualReal || sector.custosAtualSnapshot)[cargo] || 0;
          const custoTotal = qtdReal * custoUnitario;

          const atual = mapaFuncaoAtualReal.get(cargo) || {
            quantidade: 0,
            custo: 0,
          };
          mapaFuncaoAtualReal.set(cargo, {
            quantidade: atual.quantidade + qtdReal,
            custo: atual.custo + custoTotal,
          });
        });

        // Processar baseline
        Object.keys(sector.quadroAtualSnapshot).forEach((cargo) => {
          const qtdAtual = sector.quadroAtualSnapshot[cargo] || 0;
          const custoUnitario = sector.custosAtualSnapshot[cargo] || 0;
          const custoTotal = qtdAtual * custoUnitario;

          const atual = mapaFuncaoBaseline.get(cargo) || {
            quantidade: 0,
            custo: 0,
          };
          mapaFuncaoBaseline.set(cargo, {
            quantidade: atual.quantidade + qtdAtual,
            custo: atual.custo + custoTotal,
          });
        });

        // Processar projetado
        Object.keys(sector.quadroProjetadoSnapshot).forEach((cargo) => {
          const qtdProj = sector.quadroProjetadoSnapshot[cargo] || 0;
          const custoUnitario = sector.custosAtualSnapshot[cargo] || 0;
          const custoTotal = qtdProj * custoUnitario;

          const atual = mapaFuncaoProjetado.get(cargo) || {
            quantidade: 0,
            custo: 0,
          };
          mapaFuncaoProjetado.set(cargo, {
            quantidade: atual.quantidade + qtdProj,
            custo: atual.custo + custoTotal,
          });
        });
      });

      // Construir arrays para os gráficos (formato waterfall)
      const custoPorFuncao: {
        role: string;
        start: number;
        end: number;
        color: string;
      }[] = [];
      const quantidadePorFuncao: {
        role: string;
        start: number;
        end: number;
        color: string;
      }[] = [];

      let cumulativoCusto = 0;
      let cumulativoQtd = 0;

      // Atual (tempo real)
      custoPorFuncao.push({
        role: "Atual",
        start: 0,
        end: custoAtualReal,
        color: "#60a5fa", // azul claro
      });

      quantidadePorFuncao.push({
        role: "Atual",
        start: 0,
        end: pessoalAtualReal,
        color: "#60a5fa", // azul claro
      });

      // Baseline
      custoPorFuncao.push({
        role: "Baseline",
        start: 0,
        end: custoAtualSnapshot,
        color: "#89A7D6",
      });

      quantidadePorFuncao.push({
        role: "Baseline",
        start: 0,
        end: pessoalAtualSnapshot,
        color: "#89A7D6",
      });

      cumulativoCusto = custoAtualSnapshot;
      cumulativoQtd = pessoalAtualSnapshot;

      // Variações por função (apenas funções que mudaram)
      const todasFuncoes = new Set([
        ...Array.from(mapaFuncaoAtualReal.keys()),
        ...Array.from(mapaFuncaoBaseline.keys()),
        ...Array.from(mapaFuncaoProjetado.keys()),
      ]);

      todasFuncoes.forEach((funcao) => {
        const baseline = mapaFuncaoBaseline.get(funcao) || {
          quantidade: 0,
          custo: 0,
        };
        const projetado = mapaFuncaoProjetado.get(funcao) || {
          quantidade: 0,
          custo: 0,
        };

        const variacaoCustoFunc = projetado.custo - baseline.custo;
        const variacaoQtdFunc = projetado.quantidade - baseline.quantidade;

        // Só adiciona se houver variação significativa
        if (Math.abs(variacaoCustoFunc) > 0.01) {
          custoPorFuncao.push({
            role: funcao,
            start: cumulativoCusto,
            end: cumulativoCusto + variacaoCustoFunc,
            color: variacaoCustoFunc < 0 ? "#16a34a" : "#dc2626", // verde = redução, vermelho = aumento
          });
          cumulativoCusto += variacaoCustoFunc;
        }

        if (Math.abs(variacaoQtdFunc) > 0.01) {
          quantidadePorFuncao.push({
            role: funcao,
            start: cumulativoQtd,
            end: cumulativoQtd + variacaoQtdFunc,
            color: variacaoQtdFunc < 0 ? "#16a34a" : "#dc2626",
          });
          cumulativoQtd += variacaoQtdFunc;
        }
      });

      // Projetado
      custoPorFuncao.push({
        role: "Projetado",
        start: 0,
        end: custoProjetadoSnapshot,
        color: "#003151",
      });

      quantidadePorFuncao.push({
        role: "Projetado",
        start: 0,
        end: pessoalProjetadoSnapshot,
        color: "#003151",
      });

      return {
        custoPorFuncao,
        quantidadePorFuncao,
      };
    })();

    return {
      financialWaterfall,
      personnelWaterfall,
      variacaoCusto,
      variacaoPercentual,
      setorList,
      dadosPorFuncao, // Adicionar dados por função
    };
  }, [comparativeData, activeTab, selectedSector]);

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
    dadosPorFuncao,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VariationCard
          title="VARIAÇÃO NO PERÍODO"
          value={formatAmountBRL(Math.abs(variacaoCusto))}
          isReduction={variacaoCusto < 0}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <VariationCard
          title="VARIAÇÃO NO PERÍODO (%)"
          value={`${Math.abs(variacaoPercentual).toFixed(1)}%`}
          isReduction={variacaoPercentual < 0}
          icon={<DollarSign className="h-6 w-6" />}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        <ReusableWaterfall
          data={financialWaterfall}
          unit="currency"
          title="Comparativo Financeiro (R$)"
          description="Análise comparativa de custos total"
        />
        <ReusableWaterfall
          data={personnelWaterfall}
          unit="people"
          title="Comparativo de Pessoal (Qtd.)"
          description="Análise comparativa de pessoal total"
        />
      </div>

      {dadosPorFuncao && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <GroupedBarByRole
            title={`Custo por Função${
              selectedSector !== "all" ? ` – ${selectedSector}` : ""
            }`}
            data={dadosPorFuncao.custoPorFuncao}
            unit="currency"
            description="Análise por cargo/função"
          />
          <GroupedBarByRole
            title={`Quantidade por Função${
              selectedSector !== "all" ? ` – ${selectedSector}` : ""
            }`}
            data={dadosPorFuncao.quantidadePorFuncao}
            unit="people"
            description="Analise por cargo/função"
          />
        </div>
      )}
    </div>
  );

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

  if (!comparativeData || !processedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Ainda não há comparativo disponível.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Análise comparativa de custos e pessoal entre os cenários baseline
          (snapshot) e projetado.
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
