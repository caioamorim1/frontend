import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  LabelList,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getHospitalOccupationDashboard,
  getNetworkOccupationDashboard,
  type OccupationDashboardResponse,
  type NetworkOccupationDashboardResponse,
} from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2 } from "lucide-react";

type VariacaoCargoChartItem = {
  cargoNome?: string;
  cargo?: string;
  nome?: string;
  variacaoPercentual?: number;
  variacaoReais?: number;
  variacaoQtd?: number;
  variacaoCustoReais?: number;
};

type RankingItem = {
  nome: string;
  variacaoPercentual: number;
  variacaoReais?: number;
};

type RankingTooltipKind = "currency" | "people";

const toNumber = (value: unknown, fallback = 0) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatDateTimePtBr = (value: unknown): string => {
  if (value === null || value === undefined) return "--";
  const raw = String(value);
  if (!raw || raw === "--") return "--";

  const dt = new Date(raw);
  const time = dt.getTime();
  if (!Number.isFinite(time)) return raw;

  return dt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

function getCargoLabel(item: VariacaoCargoChartItem): string {
  return item.cargoNome || item.cargo || item.nome || "-";
}

export const DashboardBaselineDetalhamentoRedeApi: React.FC<{
  selectedHospitalId: string;
  redeId?: string;
  hospital?: any;
  hospitais?: any[];
  scopeTitle?: string;
}> = ({ selectedHospitalId, redeId, hospital, hospitais, scopeTitle }) => {
  const isAllHospitals = selectedHospitalId === "all";

  const [analysisTab, setAnalysisTab] = useState<"custo" | "pessoal">("custo");

  const buildAggregatedHospital = (list: any[], title?: string) => {
    const validHospitais = Array.isArray(list) ? list : [];

    const sum = (values: number[]) => values.reduce((acc, n) => acc + n, 0);

    const parseDateMs = (v: any) => {
      const d = new Date(String(v));
      const t = d.getTime();
      return Number.isFinite(t) ? t : undefined;
    };

    const staffDates = validHospitais
      .map((h) => h?.staff?.atualizadoEm)
      .map(parseDateMs)
      .filter((t): t is number => typeof t === "number");
    const staffUpdatedAt =
      staffDates.length > 0
        ? new Date(Math.max(...staffDates)).toISOString()
        : "--";

    const baselineCusto = sum(
      validHospitais.map((h) =>
        toNumber(h?.detalhamento?.baseline?.custoMensal, 0)
      )
    );
    const atualCusto = sum(
      validHospitais.map((h) =>
        toNumber(h?.detalhamento?.atual?.custoMensal, 0)
      )
    );
    const projetadoCusto = sum(
      validHospitais.map((h) =>
        toNumber(h?.detalhamento?.projetado?.custoMensal, 0)
      )
    );

    const baselineQtd = sum(
      validHospitais.map((h) =>
        toNumber(h?.detalhamento?.baseline?.totalFuncionarios, 0)
      )
    );
    const atualQtd = sum(
      validHospitais.map((h) =>
        toNumber(h?.detalhamento?.atual?.totalFuncionarios, 0)
      )
    );
    const projetadoQtd = sum(
      validHospitais.map((h) =>
        toNumber(h?.detalhamento?.projetado?.totalFuncionarios, 0)
      )
    );

    // Aggregate analisePorSetorUnidade by (unidadeNome + tipo)
    const analiseMap = new Map<
      string,
      {
        unidadeId?: string;
        unidadeNome: string;
        tipo?: string;
        baselineCusto: number;
        atualCusto: number;
        projetadoCusto: number;
        baselineQtd: number;
        atualQtd: number;
        projetadoQtd: number;
      }
    >();

    for (const h of validHospitais) {
      const itens = Array.isArray(h?.detalhamento?.analisePorSetorUnidade)
        ? h.detalhamento.analisePorSetorUnidade
        : [];
      for (const it of itens) {
        const unidadeNome = String(
          it?.unidadeNome ?? it?.setorNome ?? it?.nome ?? "-"
        );
        const tipo = it?.tipo !== undefined ? String(it.tipo) : undefined;
        const key = `${unidadeNome}__${tipo ?? ""}`;
        const current = analiseMap.get(key) || {
          unidadeId: it?.unidadeId,
          unidadeNome,
          tipo,
          baselineCusto: 0,
          atualCusto: 0,
          projetadoCusto: 0,
          baselineQtd: 0,
          atualQtd: 0,
          projetadoQtd: 0,
        };

        current.baselineCusto += toNumber(it?.baseline?.custoMensal, 0);
        current.atualCusto += toNumber(it?.atual?.custoMensal, 0);
        current.projetadoCusto += toNumber(it?.projetado?.custoMensal, 0);
        current.baselineQtd += toNumber(it?.baseline?.qtd, 0);
        current.atualQtd += toNumber(it?.atual?.qtd, 0);
        current.projetadoQtd += toNumber(it?.projetado?.qtd, 0);

        analiseMap.set(key, current);
      }
    }

    const analisePorSetorUnidade = Array.from(analiseMap.values()).map((x) => {
      const variacaoCustoReais = x.projetadoCusto - x.baselineCusto;
      const variacaoCustoPercentual =
        x.baselineCusto !== 0
          ? (variacaoCustoReais / x.baselineCusto) * 100
          : 0;
      const variacaoQtd = x.projetadoQtd - x.baselineQtd;
      const variacaoQtdPercentual =
        x.baselineQtd !== 0 ? (variacaoQtd / x.baselineQtd) * 100 : 0;
      return {
        unidadeId: x.unidadeId,
        unidadeNome: x.unidadeNome,
        tipo: x.tipo,
        baseline: { custoMensal: x.baselineCusto, qtd: x.baselineQtd },
        atual: { custoMensal: x.atualCusto, qtd: x.atualQtd },
        projetado: { custoMensal: x.projetadoCusto, qtd: x.projetadoQtd },
        variacaoCustoReais,
        variacaoCustoPercentual,
        variacaoQtd,
        variacaoQtdPercentual,
      };
    });

    // Build waterfallsDetalhamento from per-unit deltas when possible
    const sumPosNeg = (items: any[], field: "custo" | "qtd") => {
      let pos = 0;
      let neg = 0;
      for (const it of items) {
        const delta =
          field === "custo"
            ? toNumber(it?.variacaoCustoReais, 0)
            : toNumber(it?.variacaoQtd, 0);
        if (delta >= 0) pos += delta;
        else neg += delta;
      }
      return { pos, neg };
    };

    const deltasCusto = sumPosNeg(analisePorSetorUnidade, "custo");
    const deltasQtd = sumPosNeg(analisePorSetorUnidade, "qtd");
    const increasesCusto =
      analisePorSetorUnidade.length > 0
        ? deltasCusto.pos
        : Math.max(projetadoCusto - baselineCusto, 0);
    const reductionsCusto =
      analisePorSetorUnidade.length > 0
        ? deltasCusto.neg
        : Math.min(projetadoCusto - baselineCusto, 0);
    const increasesQtd =
      analisePorSetorUnidade.length > 0
        ? deltasQtd.pos
        : Math.max(projetadoQtd - baselineQtd, 0);
    const reductionsQtd =
      analisePorSetorUnidade.length > 0
        ? deltasQtd.neg
        : Math.min(projetadoQtd - baselineQtd, 0);

    const waterfallsDetalhamento = {
      custoMensal: [
        { name: "Baseline", value: baselineCusto },
        { name: "Aumentos", value: increasesCusto },
        { name: "Reduções", value: reductionsCusto },
        { name: "Projetado", value: projetadoCusto },
      ],
      quantidade: [
        { name: "Baseline", value: baselineQtd },
        { name: "Aumentos", value: increasesQtd },
        { name: "Reduções", value: reductionsQtd },
        { name: "Projetado", value: projetadoQtd },
      ],
    };

    // Aggregate variacoesPorCargo.itens by cargoNome
    const cargoMap = new Map<
      string,
      {
        cargoId?: string;
        cargoNome: string;
        baselineQtd: number;
        atualQtd: number;
        projetadoQtd: number;
        baselineCusto: number;
        atualCusto: number;
        projetadoCusto: number;
      }
    >();

    for (const h of validHospitais) {
      const itens = Array.isArray(h?.detalhamento?.variacoesPorCargo?.itens)
        ? h.detalhamento.variacoesPorCargo.itens
        : [];
      for (const it of itens) {
        const cargoNome = String(it?.cargoNome ?? it?.cargo ?? it?.nome ?? "-");
        const key = cargoNome;
        const current = cargoMap.get(key) || {
          cargoId: it?.cargoId,
          cargoNome,
          baselineQtd: 0,
          atualQtd: 0,
          projetadoQtd: 0,
          baselineCusto: 0,
          atualCusto: 0,
          projetadoCusto: 0,
        };

        current.baselineQtd += toNumber(it?.baseline?.qtd, 0);
        current.atualQtd += toNumber(it?.atual?.qtd, 0);
        current.projetadoQtd += toNumber(it?.projetado?.qtd, 0);
        current.baselineCusto += toNumber(it?.baseline?.custoMensal, 0);
        current.atualCusto += toNumber(it?.atual?.custoMensal, 0);
        current.projetadoCusto += toNumber(it?.projetado?.custoMensal, 0);

        cargoMap.set(key, current);
      }
    }

    const variacoesPorCargoItens = Array.from(cargoMap.values()).map((x) => {
      const variacaoQtd = x.projetadoQtd - x.baselineQtd;
      const variacaoCustoReais = x.projetadoCusto - x.baselineCusto;
      // % relative to baseline qtd/custo if present
      const variacaoPercentual =
        x.baselineCusto !== 0
          ? (variacaoCustoReais / x.baselineCusto) * 100
          : 0;
      return {
        cargoId: x.cargoId,
        cargoNome: x.cargoNome,
        baseline: { qtd: x.baselineQtd, custoMensal: x.baselineCusto },
        atual: { qtd: x.atualQtd, custoMensal: x.atualCusto },
        projetado: { qtd: x.projetadoQtd, custoMensal: x.projetadoCusto },
        variacaoQtd,
        variacaoCustoReais,
        variacaoPercentual,
      };
    });

    const variacaoCustoReais = projetadoCusto - baselineCusto;
    const variacaoCustoPercentual =
      baselineCusto !== 0 ? (variacaoCustoReais / baselineCusto) * 100 : 0;
    const variacaoQtd = projetadoQtd - baselineQtd;
    const variacaoQtdPercentual =
      baselineQtd !== 0 ? (variacaoQtd / baselineQtd) * 100 : 0;

    return {
      hospitalNome: title || "Visão Geral",
      nome: title || "Visão Geral",
      staff: { atualizadoEm: staffUpdatedAt },
      detalhamento: {
        baseline: {
          custoMensal: baselineCusto,
          totalFuncionarios: baselineQtd,
        },
        atual: { custoMensal: atualCusto, totalFuncionarios: atualQtd },
        projetado: {
          custoMensal: projetadoCusto,
          totalFuncionarios: projetadoQtd,
        },
        variacoesBaselineParaProjetado: {
          variacaoCustoReais,
          variacaoCustoPercentual,
          variacaoQtd,
          variacaoQtdPercentual,
        },
        waterfallsDetalhamento,
        analisePorSetorUnidade,
        variacoesPorCargo: { itens: variacoesPorCargoItens },
      },
    };
  };

  const effectiveHospital = isAllHospitals
    ? buildAggregatedHospital(hospitais || [], scopeTitle)
    : hospital;

  if (!effectiveHospital) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">
              Dados insuficientes para análise.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hospitalName =
    effectiveHospital?.nome ||
    effectiveHospital?.name ||
    effectiveHospital?.hospitalNome ||
    "Hospital";
  const staffUpdatedAt =
    effectiveHospital?.staff?.atualizadoEm ||
    effectiveHospital?.staffLastUpdate ||
    effectiveHospital?.staff?.lastUpdate ||
    "--";

  const detalhamento = effectiveHospital?.detalhamento || {};
  const baseline = detalhamento?.baseline || {};
  const atual = detalhamento?.atual || {};
  const projetado = detalhamento?.projetado || {};
  const variacoes = detalhamento?.variacoesBaselineParaProjetado || {};

  const custoBaselineMensal = toNumber(baseline?.custoMensal, 0);
  const custoAtualMensal = toNumber(atual?.custoMensal, 0);
  const custoProjetadoMensal = toNumber(projetado?.custoMensal, 0);

  const totalFuncionariosBaseline = toNumber(baseline?.totalFuncionarios, 0);
  const totalFuncionariosAtual = toNumber(atual?.totalFuncionarios, 0);
  const totalFuncionariosProjetado = toNumber(projetado?.totalFuncionarios, 0);

  const variacaoCustoReais =
    variacoes?.variacaoCustoReais !== undefined
      ? toNumber(
          variacoes.variacaoCustoReais,
          custoProjetadoMensal - custoBaselineMensal
        )
      : custoProjetadoMensal - custoBaselineMensal;

  const variacaoCustoPercentual =
    variacoes?.variacaoCustoPercentual !== undefined
      ? toNumber(variacoes.variacaoCustoPercentual, 0)
      : custoBaselineMensal !== 0
      ? (variacaoCustoReais / custoBaselineMensal) * 100
      : 0;

  const variacaoQtd =
    variacoes?.variacaoQtd !== undefined
      ? toNumber(
          variacoes.variacaoQtd,
          totalFuncionariosProjetado - totalFuncionariosBaseline
        )
      : totalFuncionariosProjetado - totalFuncionariosBaseline;

  const variacaoQtdPercentual =
    variacoes?.variacaoQtdPercentual !== undefined
      ? toNumber(variacoes.variacaoQtdPercentual, 0)
      : totalFuncionariosBaseline !== 0
      ? (variacaoQtd / totalFuncionariosBaseline) * 100
      : 0;

  // Cards do topo (igual UX do hospital), mas com variação Atual -> Projetado
  const deltaCustoAtualParaProjetado = custoProjetadoMensal - custoAtualMensal;
  const deltaCustoPercentualAtualParaProjetado =
    custoAtualMensal !== 0
      ? (deltaCustoAtualParaProjetado / custoAtualMensal) * 100
      : 0;

  const deltaQtdAtualParaProjetado =
    totalFuncionariosProjetado - totalFuncionariosAtual;
  const deltaQtdPercentualAtualParaProjetado =
    totalFuncionariosAtual !== 0
      ? (deltaQtdAtualParaProjetado / totalFuncionariosAtual) * 100
      : 0;

  const variacoesPorCargoItens: VariacaoCargoChartItem[] =
    detalhamento?.variacoesPorCargo?.itens || [];

  const analisePorSetorUnidade: any[] = Array.isArray(
    detalhamento?.analisePorSetorUnidade
  )
    ? detalhamento.analisePorSetorUnidade
    : [];

  const rankingUnidadesCusto = useMemo<RankingItem[]>(() => {
    const list = Array.isArray(analisePorSetorUnidade)
      ? analisePorSetorUnidade
      : [];
    return list
      .map((it) => ({
        nome: String(it?.unidadeNome ?? it?.setorNome ?? it?.nome ?? "-"),
        variacaoPercentual: toNumber(
          it?.variacaoCustoPercentual ?? it?.variacaoPercentual,
          0
        ),
        variacaoReais:
          it?.variacaoCustoReais !== undefined
            ? toNumber(it.variacaoCustoReais, 0)
            : undefined,
      }))
      .filter((it) => it.nome)
      .sort((a, b) => b.variacaoPercentual - a.variacaoPercentual);
  }, [analisePorSetorUnidade]);

  const rankingUnidadesQuantidade = useMemo<RankingItem[]>(() => {
    const list = Array.isArray(analisePorSetorUnidade)
      ? analisePorSetorUnidade
      : [];
    return list
      .map((it) => ({
        nome: String(it?.unidadeNome ?? it?.setorNome ?? it?.nome ?? "-"),
        variacaoPercentual: toNumber(
          it?.variacaoQtdPercentual ?? it?.variacaoPercentual,
          0
        ),
        variacaoReais:
          it?.variacaoQtd !== undefined
            ? toNumber(it.variacaoQtd, 0)
            : undefined,
      }))
      .filter((it) => it.nome)
      .sort((a, b) => b.variacaoPercentual - a.variacaoPercentual);
  }, [analisePorSetorUnidade]);

  const [occupationData, setOccupationData] =
    useState<OccupationDashboardResponse | null>(null);
  const [loadingOccupation, setLoadingOccupation] = useState(false);
  const [occupationError, setOccupationError] = useState<string | null>(null);

  const normalizeNetworkOccupationToHospitalShape = (
    data: NetworkOccupationDashboardResponse
  ): OccupationDashboardResponse => {
    return {
      hospitalId: String(data?.redeId ?? ""),
      hospitalName: String(data?.redeName ?? "Rede"),
      sectors: [],
      summary: {
        ocupacaoMaximaAtendivel: toNumber(
          data?.global?.ocupacaoMaximaAtendivel,
          0
        ),
        historico4Meses: Array.isArray(data?.global?.historico4Meses)
          ? data.global.historico4Meses
          : [],
      },
    };
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoadingOccupation(true);
        setOccupationError(null);

        if (selectedHospitalId === "all") {
          if (!redeId) {
            if (!cancelled) {
              setOccupationData(null);
              setOccupationError(
                "Rede não selecionada para taxa de ocupação (4 meses)."
              );
            }
            return;
          }

          const data = await getNetworkOccupationDashboard(redeId);
          if (!cancelled)
            setOccupationData(normalizeNetworkOccupationToHospitalShape(data));
          return;
        }

        const data = await getHospitalOccupationDashboard(selectedHospitalId);
        if (!cancelled) setOccupationData(data);
      } catch (err: any) {
        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Erro ao carregar taxa de ocupação (4 meses)";
        if (!cancelled) setOccupationError(message);
      } finally {
        if (!cancelled) setLoadingOccupation(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedHospitalId, redeId]);

  const ocupacao4Meses = occupationData?.summary?.historico4Meses || [];
  const hasOcupacao =
    Array.isArray(ocupacao4Meses) && ocupacao4Meses.length > 0;

  const axisTick = {
    fontSize: 12,
    fill: "hsl(var(--muted-foreground))",
  } as const;

  const waterfallYAxisDomain = [
    (dataMin: number) => (dataMin < 0 ? dataMin * 1.4 : 0),
    (dataMax: number) => (dataMax > 0 ? dataMax * 1.4 : 0),
  ] as [(dataMin: number) => number, (dataMax: number) => number];

  const formatCurrency = (value: number) =>
    `R$ ${Number(value || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatPctPtBr = (value: number) =>
    `${Number(value || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;

  const RankingTooltipContent: React.FC<
    {
      kind: RankingTooltipKind;
    } & {
      active?: boolean;
      payload?: any[];
    }
  > = ({ kind, active, payload }) => {
    if (!active || !Array.isArray(payload) || payload.length === 0) return null;

    const entry = payload?.[0]?.payload as RankingItem | undefined;
    if (!entry) return null;

    const pct = toNumber(entry.variacaoPercentual, 0);
    const delta =
      entry.variacaoReais !== undefined
        ? toNumber(entry.variacaoReais, 0)
        : undefined;

    const deltaLabel =
      delta === undefined
        ? "--"
        : kind === "currency"
        ? formatCurrency(delta)
        : `${Math.round(delta).toLocaleString("pt-BR")}`;

    return (
      <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
        <div className="text-sm font-medium text-foreground">
          {String(entry.nome ?? "-")}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          Percentual:{" "}
          <span className="text-foreground">{formatPctPtBr(pct)}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {kind === "currency" ? "Monetário" : "Quantidade"}:{" "}
          <span className="text-foreground">{deltaLabel}</span>
        </div>
      </div>
    );
  };

  const renderRanking = (
    data: RankingItem[],
    tooltipKind: RankingTooltipKind
  ) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[350px] text-muted-foreground">
          Dados insuficientes para análise.
        </div>
      );
    }

    const computedHeight = Math.min(560, Math.max(380, data.length * 44));
    const maxLabelLen = Math.max(
      0,
      ...data.map((d) => (d?.nome ? String(d.nome).length : 0))
    );
    const yAxisWidth = Math.min(
      200,
      Math.max(90, Math.ceil(maxLabelLen * 7.2))
    );

    return (
      <div style={{ height: computedHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={axisTick} />
            <YAxis
              type="category"
              dataKey="nome"
              width={yAxisWidth}
              tick={axisTick}
            />
            <Tooltip content={<RankingTooltipContent kind={tooltipKind} />} />
            <Bar dataKey="variacaoPercentual" barSize={18}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.variacaoPercentual < 0
                      ? "rgb(220,38,38)"
                      : "rgb(22,163,74)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderOccupationCard = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Taxa de Ocupação (4 últimos meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingOccupation ? (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              Carregando...
            </div>
          ) : occupationError ? (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              {occupationError}
            </div>
          ) : !hasOcupacao ? (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              Dados insuficientes para análise.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={(() => {
                  const atendivel = toNumber(
                    occupationData?.summary?.ocupacaoMaximaAtendivel,
                    0
                  );
                  return (ocupacao4Meses as any[]).map((mes) => {
                    const monthLabel = String(
                      mes?.monthLabel ?? mes?.mes ?? "-"
                    );
                    const mesNome = monthLabel
                      .split("/")[0]
                      .substring(0, 3)
                      .toUpperCase();
                    return {
                      mes: mesNome,
                      taxaOcupacao: toNumber(mes?.taxaOcupacao, 0),
                      taxaAtendivel: atendivel,
                    };
                  });
                })()}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    const label =
                      name === "taxaOcupacao"
                        ? "Taxa de Ocupação"
                        : "Taxa Máxima Atendível";
                    return [`${Number(value).toFixed(1)}%`, label];
                  }}
                />
                <Legend
                  formatter={(value: string) => {
                    if (value === "taxaOcupacao") return "Taxa de Ocupação";
                    if (value === "taxaAtendivel")
                      return "Taxa Máxima Atendível";
                    return value;
                  }}
                />
                <Bar
                  dataKey="taxaOcupacao"
                  fill="#5CA6DD"
                  name="taxaOcupacao"
                />
                <Line
                  type="monotone"
                  dataKey="taxaAtendivel"
                  stroke="#FF6B6B"
                  strokeWidth={2}
                  dot={false}
                  name="taxaAtendivel"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    );
  };

  const formatCurrencyLabel = (value: number) => {
    const absValue = Math.abs(value);
    return absValue >= 1000
      ? `R$ ${(absValue / 1000).toFixed(0)}k`
      : `R$ ${absValue.toFixed(0)}`;
  };

  const renderVariacaoCustoDetalhamentoCard = () => {
    const custoVariacaoReal =
      toNumber(custoProjetadoMensal, 0) - toNumber(custoBaselineMensal, 0);
    const qtdVariacao =
      toNumber(totalFuncionariosProjetado, 0) -
      toNumber(totalFuncionariosBaseline, 0);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Variação R$ - Detalhamento
            <div className="text-xs font-normal text-gray-500">
              Análise comparativa: Atual → Baseline → Projetado
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={(() => {
                const data: any[] = [];
                data.push({
                  name: "Atual",
                  value: custoAtualMensal,
                  range: [0, custoAtualMensal],
                  color: "#5CA6DD",
                  qtdPessoas: totalFuncionariosAtual,
                });
                data.push({
                  name: "Baseline",
                  value: custoBaselineMensal,
                  range: [0, custoBaselineMensal],
                  color: "#93C5FD",
                  qtdPessoas: totalFuncionariosBaseline,
                });
                data.push({
                  name: "Variação",
                  value: custoVariacaoReal,
                  range: [
                    custoBaselineMensal,
                    custoBaselineMensal + custoVariacaoReal,
                  ],
                  color: custoVariacaoReal >= 0 ? "#10B981" : "#EF4444",
                  qtdPessoas: qtdVariacao,
                });
                data.push({
                  name: "Projetado",
                  value: custoProjetadoMensal,
                  range: [0, custoProjetadoMensal],
                  color: "#003151",
                  qtdPessoas: totalFuncionariosProjetado,
                });
                return data;
              })()}
              margin={{ top: 8, right: 20, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={axisTick}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={90}
              />
              <YAxis tick={axisTick} domain={waterfallYAxisDomain} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data: any = payload[0].payload;
                    const custoReais = toNumber(data.value, 0);
                    const qtd = toNumber(data.qtdPessoas, 0);
                    const isTotal =
                      label === "Atual" ||
                      String(label).includes("Baseline") ||
                      label === "Projetado";

                    return (
                      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                        <p className="font-bold text-foreground mb-1">
                          {label}
                        </p>
                        <p className="text-muted-foreground">
                          Custo: R${" "}
                          {Math.abs(custoReais).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-muted-foreground">
                          {isTotal
                            ? `Total: ${qtd} ${
                                Math.abs(qtd) === 1
                                  ? "funcionário"
                                  : "funcionários"
                              }`
                            : `Variação: ${qtd >= 0 ? "+" : ""}${qtd} ${
                                Math.abs(qtd) === 1
                                  ? "funcionário"
                                  : "funcionários"
                              }`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="range">
                {[
                  { color: "#5CA6DD" },
                  { color: "#93C5FD" },
                  { color: custoVariacaoReal >= 0 ? "#10B981" : "#EF4444" },
                  { color: "#003151" },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: any) => {
                    const v = toNumber(value, 0);
                    const formatted = formatCurrencyLabel(v);
                    return v >= 0 ? `+${formatted}` : `-${formatted}`;
                  }}
                  style={{ fontSize: 12, fill: "#666" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderVariacaoCustoPorCargoCard = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Variação R$ - Detalhamento
            <div className="text-xs font-normal text-gray-500">
              Análise por cargo/função
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={(() => {
                const itens = Array.isArray(variacoesPorCargoItens)
                  ? variacoesPorCargoItens
                  : [];
                const cargosOrdenados = itens
                  .map((it) => ({
                    nome: getCargoLabel(it),
                    custoVariacao: toNumber(
                      it?.variacaoCustoReais ?? it?.variacaoReais,
                      0
                    ),
                    qtdVariacao: toNumber(it?.variacaoQtd, 0),
                  }))
                  .filter((c) => c.nome && c.custoVariacao !== 0)
                  .sort(
                    (a, b) =>
                      Math.abs(b.custoVariacao) - Math.abs(a.custoVariacao)
                  );

                const waterfallData: any[] = [];
                waterfallData.push({
                  name: "Atual",
                  value: custoAtualMensal,
                  range: [0, custoAtualMensal],
                  color: "#5CA6DD",
                  qtdPessoas: totalFuncionariosAtual,
                });
                waterfallData.push({
                  name: "Baseline",
                  value: custoBaselineMensal,
                  range: [0, custoBaselineMensal],
                  color: "#93C5FD",
                  qtdPessoas: totalFuncionariosBaseline,
                });

                let cumulative = custoBaselineMensal;
                for (const cargo of cargosOrdenados) {
                  const start = cumulative;
                  cumulative += cargo.custoVariacao;
                  waterfallData.push({
                    name: cargo.nome,
                    value: cargo.custoVariacao,
                    range:
                      cargo.custoVariacao >= 0
                        ? [start, cumulative]
                        : [cumulative, start],
                    color: cargo.custoVariacao >= 0 ? "#10B981" : "#EF4444",
                    qtdPessoas: cargo.qtdVariacao,
                  });
                }

                waterfallData.push({
                  name: "Projetado",
                  value: custoProjetadoMensal,
                  range: [0, custoProjetadoMensal],
                  color: "#003151",
                  qtdPessoas: totalFuncionariosProjetado,
                });
                return waterfallData;
              })()}
              margin={{ top: 8, right: 20, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={axisTick}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={90}
              />
              <YAxis tick={axisTick} domain={waterfallYAxisDomain} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data: any = payload[0].payload;
                    const custoReais = toNumber(data.value, 0);
                    const qtd = toNumber(data.qtdPessoas, 0);
                    const isTotal =
                      label === "Atual" ||
                      String(label).includes("Baseline") ||
                      label === "Projetado";

                    return (
                      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                        <p className="font-bold text-foreground mb-1">
                          {label}
                        </p>
                        <p className="text-muted-foreground">
                          Custo: R${" "}
                          {Math.abs(custoReais).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-muted-foreground">
                          {isTotal
                            ? `Total: ${qtd} ${
                                Math.abs(qtd) === 1
                                  ? "funcionário"
                                  : "funcionários"
                              }`
                            : `Variação: ${qtd >= 0 ? "+" : ""}${qtd} ${
                                Math.abs(qtd) === 1
                                  ? "funcionário"
                                  : "funcionários"
                              }`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="range">
                {(Array.isArray(variacoesPorCargoItens)
                  ? [
                      { color: "#5CA6DD" },
                      { color: "#93C5FD" },
                      ...variacoesPorCargoItens
                        .map((it) =>
                          toNumber(
                            it?.variacaoCustoReais ?? it?.variacaoReais,
                            0
                          )
                        )
                        .filter((v) => v !== 0)
                        .sort((a, b) => Math.abs(b) - Math.abs(a))
                        .map((v) => ({
                          color: v >= 0 ? "#10B981" : "#EF4444",
                        })),
                      { color: "#003151" },
                    ]
                  : [
                      { color: "#5CA6DD" },
                      { color: "#93C5FD" },
                      { color: "#003151" },
                    ]
                ).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: any) => {
                    const v = toNumber(value, 0);
                    const formatted = formatCurrencyLabel(v);
                    return v >= 0 ? `+${formatted}` : `-${formatted}`;
                  }}
                  style={{ fontSize: 12, fill: "#666" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderComparativoCustoMensalCard = () => {
    const xAxisKey = isAllHospitals ? "hospital" : "setor";
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativo R$ (Mensal)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={(() => {
                if (isAllHospitals) {
                  const list = Array.isArray(hospitais) ? hospitais : [];
                  return list
                    .map((h) => {
                      const hospitalLabel = String(
                        h?.nome ?? h?.hospitalNome ?? h?.name ?? "-"
                      );
                      const Atual = toNumber(
                        h?.detalhamento?.atual?.custoMensal,
                        0
                      );
                      const Baseline = toNumber(
                        h?.detalhamento?.baseline?.custoMensal,
                        0
                      );
                      const Projetado = toNumber(
                        h?.detalhamento?.projetado?.custoMensal,
                        0
                      );
                      return {
                        hospital: hospitalLabel,
                        Atual,
                        Baseline,
                        Projetado,
                      };
                    })
                    .filter(
                      (item) =>
                        item.hospital &&
                        (item.Atual > 0 ||
                          item.Baseline > 0 ||
                          item.Projetado > 0)
                    )
                    .sort((a, b) => b.Projetado - a.Projetado);
                }

                const list = Array.isArray(analisePorSetorUnidade)
                  ? analisePorSetorUnidade
                  : [];
                return list
                  .map((it) => {
                    const setor = String(
                      it?.unidadeNome ?? it?.setorNome ?? it?.nome ?? "-"
                    );
                    const Atual = toNumber(
                      it?.atual?.custoMensal ?? it?.atualCustoMensal,
                      0
                    );
                    const Baseline = toNumber(
                      it?.baseline?.custoMensal ?? it?.baselineCustoMensal,
                      0
                    );
                    const Projetado = toNumber(
                      it?.projetado?.custoMensal ?? it?.projetadoCustoMensal,
                      0
                    );
                    return { setor, Atual, Baseline, Projetado };
                  })
                  .filter(
                    (item) =>
                      item.setor &&
                      (item.Atual > 0 ||
                        item.Baseline > 0 ||
                        item.Projetado > 0)
                  )
                  .sort((a, b) => b.Projetado - a.Projetado);
              })()}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={xAxisKey}
                tick={axisTick}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={90}
              />
              <YAxis tick={axisTick} />
              <Tooltip
                formatter={(value: any) => {
                  return [
                    `R$ ${Number(value).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                  ];
                }}
              />
              <Bar dataKey="Atual" fill="#003151" name="Atual">
                <LabelList
                  dataKey="Atual"
                  position="top"
                  formatter={(value: any) =>
                    formatCurrencyLabel(toNumber(value, 0))
                  }
                  style={{ fontSize: 10, fill: "#666" }}
                />
              </Bar>
              <Bar dataKey="Baseline" fill="#5CA6DD" name="Baseline">
                <LabelList
                  dataKey="Baseline"
                  position="top"
                  formatter={(value: any) =>
                    formatCurrencyLabel(toNumber(value, 0))
                  }
                  style={{ fontSize: 10, fill: "#666" }}
                />
              </Bar>
              <Bar dataKey="Projetado" fill="#89A7D6" name="Projetado">
                <LabelList
                  dataKey="Projetado"
                  position="top"
                  formatter={(value: any) =>
                    formatCurrencyLabel(toNumber(value, 0))
                  }
                  style={{ fontSize: 10, fill: "#666" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderVariacaoQtdDetalhamentoCard = () => {
    const deltaQtd =
      toNumber(totalFuncionariosProjetado, 0) -
      toNumber(totalFuncionariosBaseline, 0);
    const custoMedioPorPessoa =
      toNumber(totalFuncionariosAtual, 0) > 0
        ? toNumber(custoAtualMensal, 0) / toNumber(totalFuncionariosAtual, 0)
        : 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Variação QTD - Detalhamento
            <div className="text-xs font-normal text-gray-500">
              Análise comparativa: Atual → Baseline → Projetado
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={(() => {
                return [
                  {
                    name: "Atual",
                    value: totalFuncionariosAtual,
                    range: [0, totalFuncionariosAtual],
                    color: "#5CA6DD",
                  },
                  {
                    name: "Baseline",
                    value: totalFuncionariosBaseline,
                    range: [0, totalFuncionariosBaseline],
                    color: "#93C5FD",
                  },
                  {
                    name: "Variação",
                    value: deltaQtd,
                    range: [
                      totalFuncionariosBaseline,
                      totalFuncionariosBaseline + deltaQtd,
                    ],
                    color: deltaQtd >= 0 ? "#10B981" : "#EF4444",
                  },
                  {
                    name: "Projetado",
                    value: totalFuncionariosProjetado,
                    range: [0, totalFuncionariosProjetado],
                    color: "#003151",
                  },
                ];
              })()}
              margin={{ top: 8, right: 20, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={axisTick}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={90}
              />
              <YAxis tick={axisTick} domain={waterfallYAxisDomain} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data: any = payload[0].payload;
                    const qtd = toNumber(data.value, 0);

                    let custoReais = 0;
                    let isTotal = false;
                    if (label === "Atual") {
                      custoReais = custoAtualMensal;
                      isTotal = true;
                    } else if (String(label).includes("Baseline")) {
                      custoReais = custoBaselineMensal;
                      isTotal = true;
                    } else if (label === "Projetado") {
                      custoReais = custoProjetadoMensal;
                      isTotal = true;
                    } else if (label === "Variação") {
                      custoReais = qtd * custoMedioPorPessoa;
                    }

                    return (
                      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                        <p className="font-bold text-foreground mb-1">
                          {label}
                        </p>
                        <p className="text-muted-foreground">
                          {isTotal ? "Quantidade: " : "Variação: "}
                          <span className="font-semibold">
                            {Math.abs(qtd)} funcionários
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          {isTotal ? "Custo: " : "Custo Estimado: "}
                          <span className="font-semibold">
                            {custoReais >= 0 ? "" : "-"}R${" "}
                            {Math.abs(custoReais).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="range">
                {[
                  { color: "#5CA6DD" },
                  { color: "#93C5FD" },
                  { color: deltaQtd >= 0 ? "#10B981" : "#EF4444" },
                  { color: "#003151" },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: any) => {
                    const v = toNumber(value, 0);
                    const absValue = Math.abs(v);
                    return v >= 0 ? `+${absValue}` : `-${absValue}`;
                  }}
                  style={{ fontSize: 12, fill: "#666" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderVariacaoQtdPorCargoCard = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Variação QTD - Detalhamento
            <div className="text-xs font-normal text-gray-500">
              Análise por cargo/função
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={(() => {
                const itens = Array.isArray(variacoesPorCargoItens)
                  ? variacoesPorCargoItens
                  : [];
                const cargosOrdenados = itens
                  .map((it) => ({
                    nome: getCargoLabel(it),
                    variacao: toNumber(it?.variacaoQtd, 0),
                    custoVariacao: toNumber(
                      it?.variacaoCustoReais ?? it?.variacaoReais,
                      0
                    ),
                  }))
                  .filter((c) => c.nome && c.variacao !== 0)
                  .sort((a, b) => Math.abs(b.variacao) - Math.abs(a.variacao));

                const waterfallData: any[] = [];
                waterfallData.push({
                  name: "Atual",
                  value: totalFuncionariosAtual,
                  range: [0, totalFuncionariosAtual],
                  color: "#5CA6DD",
                  custoReais: custoAtualMensal,
                });
                waterfallData.push({
                  name: "Baseline",
                  value: totalFuncionariosBaseline,
                  range: [0, totalFuncionariosBaseline],
                  color: "#93C5FD",
                  custoReais: custoBaselineMensal,
                });

                let cumulative = totalFuncionariosBaseline;
                for (const cargo of cargosOrdenados) {
                  const start = cumulative;
                  cumulative += cargo.variacao;
                  waterfallData.push({
                    name: cargo.nome,
                    value: cargo.variacao,
                    range:
                      cargo.variacao >= 0
                        ? [start, cumulative]
                        : [cumulative, start],
                    color: cargo.variacao >= 0 ? "#10B981" : "#EF4444",
                    custoReais: cargo.custoVariacao,
                  });
                }

                waterfallData.push({
                  name: "Projetado",
                  value: totalFuncionariosProjetado,
                  range: [0, totalFuncionariosProjetado],
                  color: "#003151",
                  custoReais: custoProjetadoMensal,
                });

                return waterfallData;
              })()}
              margin={{ top: 8, right: 20, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={axisTick}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={90}
              />
              <YAxis tick={axisTick} domain={waterfallYAxisDomain} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data: any = payload[0].payload;
                    const qtd = toNumber(data.value, 0);
                    const custoReais = toNumber(data.custoReais, 0);
                    const isTotal =
                      label === "Atual" ||
                      String(label).includes("Baseline") ||
                      label === "Projetado";

                    return (
                      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                        <p className="font-bold text-foreground mb-1">
                          {label}
                        </p>
                        <p className="text-muted-foreground">
                          {isTotal ? "Quantidade: " : "Variação: "}
                          <span className="font-semibold">
                            {Math.abs(qtd)} funcionários
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          {isTotal ? "Custo: " : "Custo Estimado: "}
                          <span className="font-semibold">
                            {custoReais >= 0 ? "" : "-"}R${" "}
                            {Math.abs(custoReais).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="range">
                {(Array.isArray(variacoesPorCargoItens)
                  ? [
                      { color: "#5CA6DD" },
                      { color: "#93C5FD" },
                      ...variacoesPorCargoItens
                        .map((it) => toNumber(it?.variacaoQtd, 0))
                        .filter((v) => v !== 0)
                        .sort((a, b) => Math.abs(b) - Math.abs(a))
                        .map((v) => ({
                          color: v >= 0 ? "#10B981" : "#EF4444",
                        })),
                      { color: "#003151" },
                    ]
                  : [
                      { color: "#5CA6DD" },
                      { color: "#93C5FD" },
                      { color: "#003151" },
                    ]
                ).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  formatter={(value: any) => {
                    const v = toNumber(value, 0);
                    const absValue = Math.abs(v);
                    return v >= 0 ? `+${absValue}` : `-${absValue}`;
                  }}
                  style={{ fontSize: 12, fill: "#666" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderComparativoPorCargoCard = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativo por Cargo</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={(() => {
                const itens = Array.isArray(variacoesPorCargoItens)
                  ? variacoesPorCargoItens
                  : [];

                const comparativoArray = itens
                  .map((it) => {
                    const cargo = getCargoLabel(it);
                    const Atual = toNumber((it as any)?.atual?.qtd, 0);
                    const Baseline = toNumber((it as any)?.baseline?.qtd, 0);
                    const Projetado = toNumber((it as any)?.projetado?.qtd, 0);
                    return { cargo, Atual, Baseline, Projetado };
                  })
                  .filter(
                    (item) =>
                      item.cargo &&
                      (item.Atual > 0 ||
                        item.Baseline > 0 ||
                        item.Projetado > 0)
                  )
                  .sort((a, b) => b.Projetado - a.Projetado);

                return comparativoArray;
              })()}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="cargo"
                tick={axisTick}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={90}
              />
              <YAxis tick={axisTick} />
              <Tooltip />
              <Bar dataKey="Atual" fill="#003151" name="Atual">
                <LabelList
                  dataKey="Atual"
                  position="top"
                  style={{ fontSize: 10, fill: "#666" }}
                />
              </Bar>
              <Bar dataKey="Baseline" fill="#5CA6DD" name="Baseline">
                <LabelList
                  dataKey="Baseline"
                  position="top"
                  style={{ fontSize: 10, fill: "#666" }}
                />
              </Bar>
              <Bar dataKey="Projetado" fill="#89A7D6" name="Projetado">
                <LabelList
                  dataKey="Projetado"
                  position="top"
                  style={{ fontSize: 10, fill: "#666" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderVariacaoCustoTotalCard = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variação Custo Total</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={(() => {
                const custoAtual = toNumber(custoAtualMensal, 0);
                const custoProj = toNumber(custoProjetadoMensal, 0);
                const qtdAtual = toNumber(totalFuncionariosAtual, 0);
                const qtdProj = toNumber(totalFuncionariosProjetado, 0);
                const deltaCusto = custoProj - custoAtual;
                return [
                  {
                    name: "Atual",
                    value: custoAtual,
                    range: [0, custoAtual],
                    qtdPessoas: qtdAtual,
                    color: "#003151",
                  },
                  {
                    name: "Variação",
                    value: deltaCusto,
                    range:
                      deltaCusto >= 0
                        ? [custoAtual, custoProj]
                        : [custoProj, custoAtual],
                    qtdPessoas: qtdProj - qtdAtual,
                    color:
                      deltaCusto < 0 ? "hsl(var(--destructive))" : "#0b6f88",
                  },
                  {
                    name: "Projetado",
                    value: custoProj,
                    range: [0, custoProj],
                    qtdPessoas: qtdProj,
                    color: "#003151",
                  },
                ];
              })()}
              margin={{ top: 8, right: 20, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={axisTick}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={90}
              />
              <YAxis tick={axisTick} domain={waterfallYAxisDomain} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data: any = payload[0].payload;
                    const isTotal = label === "Atual" || label === "Projetado";
                    const custoReais = toNumber(data.value, 0);
                    const qtd = toNumber(data.qtdPessoas, 0);

                    return (
                      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                        <p className="font-bold text-foreground mb-1">
                          {label}
                        </p>
                        <p className="text-muted-foreground">
                          Custo: R${" "}
                          {Math.abs(custoReais).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-muted-foreground">
                          {isTotal
                            ? `Total: ${qtd} ${
                                qtd === 1 ? "funcionário" : "funcionários"
                              }`
                            : `Variação: ${qtd >= 0 ? "+" : ""}${qtd} ${
                                Math.abs(qtd) === 1
                                  ? "funcionário"
                                  : "funcionários"
                              }`}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="range">
                {[0, 1, 2].map((index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === 1
                        ? toNumber(custoProjetadoMensal, 0) -
                            toNumber(custoAtualMensal, 0) <
                          0
                          ? "hsl(var(--destructive))"
                          : "#0b6f88"
                        : "#003151"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  const renderVariacaoQuantidadeCard = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Variação Quantidade</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={(() => {
                const qtdAtual = toNumber(totalFuncionariosAtual, 0);
                const qtdProj = toNumber(totalFuncionariosProjetado, 0);
                const custoAtual = toNumber(custoAtualMensal, 0);
                const custoProj = toNumber(custoProjetadoMensal, 0);
                const deltaQtd = qtdProj - qtdAtual;
                return [
                  {
                    name: "Atual",
                    value: qtdAtual,
                    range: [0, qtdAtual],
                    custoReais: custoAtual,
                    color: "#003151",
                  },
                  {
                    name: "Variação",
                    value: deltaQtd,
                    range:
                      deltaQtd >= 0 ? [qtdAtual, qtdProj] : [qtdProj, qtdAtual],
                    custoReais: custoProj - custoAtual,
                    color: deltaQtd < 0 ? "hsl(var(--destructive))" : "#0b6f88",
                  },
                  {
                    name: "Projetado",
                    value: qtdProj,
                    range: [0, qtdProj],
                    custoReais: custoProj,
                    color: "#003151",
                  },
                ];
              })()}
              margin={{ top: 8, right: 20, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                tick={axisTick}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={90}
              />
              <YAxis tick={axisTick} domain={waterfallYAxisDomain} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data: any = payload[0].payload;
                    const isTotal = label === "Atual" || label === "Projetado";
                    const qtd = toNumber(data.value, 0);
                    const custoReais = toNumber(data.custoReais, 0);
                    return (
                      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                        <p className="font-bold text-foreground mb-1">
                          {label}
                        </p>
                        <p className="text-muted-foreground">
                          {isTotal ? "Quantidade: " : "Variação: "}
                          <span className="font-semibold">
                            {Math.abs(qtd)} funcionários
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          {isTotal ? "Custo: " : "Custo Variação: "}
                          <span className="font-semibold">
                            {custoReais >= 0 ? "" : "-"}R${" "}
                            {Math.abs(custoReais).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="range">
                {[0, 1, 2].map((index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === 1
                        ? toNumber(totalFuncionariosProjetado, 0) -
                            toNumber(totalFuncionariosAtual, 0) <
                          0
                          ? "hsl(var(--destructive))"
                          : "#0b6f88"
                        : "#003151"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{hospitalName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Última atualização do nº de colaboradores em:{" "}
            {formatDateTimePtBr(staffUpdatedAt)}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {analysisTab === "pessoal" ? (
          <>
            <Card className="border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    Variação (%)
                  </p>
                  <div
                    className={`text-2xl font-bold ${
                      deltaQtdPercentualAtualParaProjetado === 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {deltaQtdPercentualAtualParaProjetado >= 0 ? "+" : ""}
                    {deltaQtdPercentualAtualParaProjetado.toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    Variação (Qtd)
                  </p>
                  <div
                    className={`text-2xl font-bold ${
                      deltaQtdPercentualAtualParaProjetado === 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {deltaQtdAtualParaProjetado >= 0 ? "+" : ""}
                    {deltaQtdAtualParaProjetado}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    Total de Funcionários
                  </p>
                  <div className="text-2xl font-bold">
                    {totalFuncionariosAtual}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    Total de Funcionários Projetado
                  </p>
                  <div className="text-2xl font-bold">
                    {totalFuncionariosProjetado}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    Variação monetária (%)
                  </p>
                  <div
                    className={`text-2xl font-bold ${
                      deltaCustoPercentualAtualParaProjetado === 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {deltaCustoPercentualAtualParaProjetado >= 0 ? "+" : ""}
                    {deltaCustoPercentualAtualParaProjetado.toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    Variação monetária (R$)
                  </p>
                  <div
                    className={`text-2xl font-bold ${
                      deltaCustoPercentualAtualParaProjetado === 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {deltaCustoAtualParaProjetado >= 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(deltaCustoAtualParaProjetado))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    Total custo atual
                  </p>
                  <div className="text-2xl font-bold">
                    {formatCurrency(custoAtualMensal)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600">
                    Total custo projetado
                  </p>
                  <div className="text-2xl font-bold">
                    {formatCurrency(custoProjetadoMensal)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Tabs
        value={analysisTab}
        onValueChange={(value) => setAnalysisTab(value as "custo" | "pessoal")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="custo">Análise de Custo</TabsTrigger>
          <TabsTrigger value="pessoal">Análise de Pessoal</TabsTrigger>
        </TabsList>

        <TabsContent value="custo" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Ranking da Variação dos Setores (%)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                {renderRanking(rankingUnidadesCusto, "currency")}
              </CardContent>
            </Card>

            {renderVariacaoCustoTotalCard()}

            {renderOccupationCard()}
          </div>

          <div className="flex items-center gap-3 pt-6 pb-2">
            <div className="bg-[#005D97] p-2 rounded">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold">
              Análise de Custo - Detalhamento
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {renderVariacaoCustoDetalhamentoCard()}
            {renderVariacaoCustoPorCargoCard()}
            {renderComparativoCustoMensalCard()}
          </div>
        </TabsContent>

        <TabsContent value="pessoal" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Ranking da Variação dos Setores (QTD)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                {renderRanking(rankingUnidadesQuantidade, "people")}
              </CardContent>
            </Card>

            {renderVariacaoQuantidadeCard()}

            {renderOccupationCard()}
          </div>

          <div className="flex items-center gap-3 pt-6 pb-2">
            <div className="bg-[#005D97] p-2 rounded">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold">
              Análise de Pessoal - Detalhamento
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {renderVariacaoQtdDetalhamentoCard()}
            {renderVariacaoQtdPorCargoCard()}
            {renderComparativoPorCargoCard()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
