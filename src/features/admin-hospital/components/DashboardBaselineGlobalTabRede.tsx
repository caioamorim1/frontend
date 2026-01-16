import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InfoCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  variant: "primary" | "warning" | "success";
};

type WaterfallItem = { name: string; value: number };

export type BaselineRankingItemRede = {
  nome: string;
  variacaoPercentual: number;
  variacaoReais?: number;
};

type RankingTooltipKind = "currency" | "people";

const toNumber = (value: unknown, fallback = 0) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const firstFiniteNumber = (
  ...candidates: Array<unknown>
): number | undefined => {
  for (const candidate of candidates) {
    const n = typeof candidate === "number" ? candidate : Number(candidate);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

const normalizeWaterfall = (items: any): WaterfallItem[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => ({
      name: String(it?.name ?? it?.nome ?? it?.label ?? "-"),
      value: toNumber(it?.value ?? it?.valor ?? it?.delta ?? 0, 0),
    }))
    .filter((it) => it.name);
};

const buildSimpleWaterfall = (params: {
  atual: number;
  projetado: number;
  variacao?: number;
}): WaterfallItem[] => {
  const atual = toNumber(params.atual, 0);
  const projetado = toNumber(params.projetado, 0);
  const variacao =
    params.variacao !== undefined
      ? toNumber(params.variacao, projetado - atual)
      : projetado - atual;

  return [
    { name: "Atual", value: atual },
    { name: "Variação", value: variacao },
    { name: "Projetado", value: projetado },
  ];
};

const normalizeRanking = (items: any): BaselineRankingItemRede[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => ({
      nome: String(
        it?.nome ?? it?.hospitalNome ?? it?.hospital ?? it?.name ?? "-"
      ),
      variacaoPercentual: toNumber(
        it?.variacaoPercentual ?? it?.variacaoPct ?? it?.percentual ?? 0,
        0
      ),
      variacaoReais:
        it?.variacaoReais !== undefined
          ? toNumber(it.variacaoReais, 0)
          : it?.variacaoEmReais !== undefined
          ? toNumber(it.variacaoEmReais, 0)
          : it?.reais !== undefined
          ? toNumber(it.reais, 0)
          : undefined,
    }))
    .filter((it) => it.nome);
};

const computeRankingsFromHospitais = (
  hospitais: any[]
): {
  rankingCusto: BaselineRankingItemRede[];
  rankingQuantidade: BaselineRankingItemRede[];
} => {
  const list = Array.isArray(hospitais) ? hospitais : [];

  const rankingCusto: BaselineRankingItemRede[] = list.map((h) => {
    const nome = String(h?.hospitalNome ?? h?.nome ?? h?.name ?? "-");
    const cardsTopo = h?.global?.cardsTopo || h?.global?.cards || {};
    const atual = toNumber(
      cardsTopo?.custoAtualMensal ?? cardsTopo?.custoAtual,
      0
    );
    const projetado = toNumber(
      cardsTopo?.custoProjetadoMensal ?? cardsTopo?.custoProjetado,
      0
    );
    const variacaoReais = projetado - atual;
    const variacaoPercentual = atual !== 0 ? (variacaoReais / atual) * 100 : 0;
    return { nome, variacaoPercentual, variacaoReais };
  });

  const rankingQuantidade: BaselineRankingItemRede[] = list.map((h) => {
    const nome = String(h?.hospitalNome ?? h?.nome ?? h?.name ?? "-");
    const cardsTopo = h?.global?.cardsTopo || h?.global?.cards || {};
    const atual = toNumber(
      cardsTopo?.totalFuncionariosAtual ?? cardsTopo?.profissionaisAtuais,
      0
    );
    const projetado = toNumber(
      cardsTopo?.totalFuncionariosProjetado ??
        cardsTopo?.profissionaisProjetados,
      0
    );
    const variacaoReais = projetado - atual;
    const variacaoPercentual = atual !== 0 ? (variacaoReais / atual) * 100 : 0;
    return { nome, variacaoPercentual, variacaoReais };
  });

  rankingCusto.sort((a, b) => a.variacaoPercentual - b.variacaoPercentual);
  rankingQuantidade.sort((a, b) => a.variacaoPercentual - b.variacaoPercentual);

  return { rankingCusto, rankingQuantidade };
};

const formatPctPtBr = (value: number) =>
  `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

const formatCurrencyPtBr = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const RankingTooltipContent: React.FC<
  {
    kind: RankingTooltipKind;
  } & {
    active?: boolean;
    payload?: any[];
  }
> = ({ kind, active, payload }) => {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null;

  const entry = payload?.[0]?.payload as BaselineRankingItemRede | undefined;
  if (!entry) return null;

  const pct = toNumber(entry.variacaoPercentual, 0);
  const rawDelta =
    entry.variacaoReais !== undefined
      ? toNumber(entry.variacaoReais, 0)
      : undefined;

  const deltaLabel =
    rawDelta === undefined
      ? "--"
      : kind === "currency"
      ? formatCurrencyPtBr(rawDelta)
      : `${rawDelta.toLocaleString("pt-BR", {
          maximumFractionDigits: 0,
        })}`;

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

export const DashboardBaselineGlobalTabRede: React.FC<{
  // backend payload (preferred)
  globalData?: any;

  // cards
  custoAtualReal?: number;
  custoProjetado?: number;
  variacaoCustoReais?: number;
  profissionaisAtuais?: number;
  profissionaisProjetados?: number;

  InfoCard: React.FC<InfoCardProps>;
  icons: {
    atual: React.ReactNode;
    variacao: React.ReactNode;
    projetado: React.ReactNode;
    funcionarios: React.ReactNode;
    funcionariosProjetado: React.ReactNode;
  };

  // charts
  ReusableWaterfall: React.FC<{
    data: WaterfallItem[];
    unit: "currency" | "people";
  }>;
  waterfallCusto?: WaterfallItem[];
  waterfallQuantidade?: WaterfallItem[];

  rankingCusto?: BaselineRankingItemRede[];
  rankingQuantidade?: BaselineRankingItemRede[];
}> = ({
  globalData,
  custoAtualReal,
  custoProjetado,
  variacaoCustoReais,
  profissionaisAtuais,
  profissionaisProjetados,
  InfoCard,
  icons,
  ReusableWaterfall,
  waterfallCusto,
  waterfallQuantidade,
  rankingCusto,
  rankingQuantidade,
}) => {
  const cards =
    globalData?.cardsTopo ||
    globalData?.cards ||
    globalData?.indicadores ||
    globalData?.kpis ||
    {};

  const custos = globalData?.custos || globalData?.custo || {};
  const totais = globalData?.totais || globalData?.resumo || {};
  const staff = globalData?.staff || globalData?.colaboradores || {};

  const custoAtualRealResolved =
    firstFiniteNumber(
      custoAtualReal,
      cards?.custoAtualReal,
      cards?.custoAtual,
      cards?.custoAtualMensal,
      cards?.custoAtualMensal,
      cards?.custoTotalAtual,
      totais?.custoAtualReal,
      totais?.custoAtual,
      totais?.custoTotalAtual,
      custos?.atual,
      custos?.atualReal,
      custos?.atual?.total,
      custos?.atual?.mensal,
      globalData?.custoAtualReal,
      globalData?.custoAtual
    ) ?? 0;

  const custoProjetadoResolved =
    firstFiniteNumber(
      custoProjetado,
      cards?.custoProjetado,
      cards?.custoProjetadoMensal,
      cards?.custoTotalProjetado,
      cards?.custoProjetadoMensal,
      totais?.custoProjetado,
      totais?.custoTotalProjetado,
      custos?.projetado,
      custos?.projetadoFinal,
      custos?.projetado?.total,
      custos?.projetado?.mensal,
      globalData?.custoProjetado
    ) ?? 0;

  const variacaoCustoReaisResolved =
    firstFiniteNumber(
      variacaoCustoReais,
      cards?.variacaoCustoReais,
      cards?.variacaoCustoMensal,
      cards?.variacaoReais,
      totais?.variacaoCustoReais,
      totais?.variacaoReais,
      custos?.variacao,
      custos?.variacaoReais,
      globalData?.variacaoCustoReais,
      globalData?.variacaoReais
    ) ??
    toNumber(custoProjetadoResolved, 0) - toNumber(custoAtualRealResolved, 0);

  const variacaoCustoPercentualResolved =
    toNumber(custoAtualRealResolved, 0) !== 0
      ? (toNumber(variacaoCustoReaisResolved, 0) /
          toNumber(custoAtualRealResolved, 0)) *
        100
      : 0;

  const profissionaisAtuaisResolved =
    firstFiniteNumber(
      profissionaisAtuais,
      cards?.profissionaisAtuais,
      cards?.totalFuncionarios,
      cards?.totalFuncionariosAtual,
      cards?.funcionariosAtuais,
      cards?.totalColaboradores,
      cards?.totalColaboradoresAtuais,
      totais?.totalFuncionarios,
      totais?.totalFuncionariosAtual,
      totais?.totalColaboradores,
      staff?.total,
      staff?.atual,
      staff?.atual?.total,
      staff?.atual?.totalFuncionarios,
      staff?.atual?.totalColaboradores,
      globalData?.profissionaisAtuais
    ) ?? 0;

  const profissionaisProjetadosResolved =
    firstFiniteNumber(
      profissionaisProjetados,
      cards?.profissionaisProjetados,
      cards?.totalFuncionariosProjetado,
      cards?.funcionariosProjetados,
      cards?.totalColaboradoresProjetado,
      totais?.totalFuncionariosProjetado,
      totais?.totalColaboradoresProjetado,
      staff?.projetado,
      staff?.projetado?.total,
      staff?.projetado?.totalFuncionarios,
      staff?.projetado?.totalColaboradores,
      globalData?.profissionaisProjetados
    ) ?? 0;

  const variacaoQuantidadeResolved =
    toNumber(profissionaisProjetadosResolved, 0) -
    toNumber(profissionaisAtuaisResolved, 0);
  const variacaoQuantidadePercentual =
    toNumber(profissionaisAtuaisResolved, 0) !== 0
      ? (variacaoQuantidadeResolved /
          toNumber(profissionaisAtuaisResolved, 0)) *
        100
      : 0;

  const formatArrowPct = (delta: number, pct: number) => {
    if (!Number.isFinite(delta) || delta === 0) return "Estável";
    const arrow = delta > 0 ? "↑" : "↓";
    const pctLabel = Number.isFinite(pct)
      ? `${Math.abs(pct).toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}%`
      : "--";
    return `${arrow} ${pctLabel}`;
  };

  const formatVariationPctLabel = (delta: number, pct: number) => {
    if (delta === 0) return "Estável";
    const direction = delta > 0 ? "Aumento" : "Redução";
    const pctLabel = Number.isFinite(pct)
      ? `${Math.abs(pct).toLocaleString("pt-BR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })}%`
      : "--";
    return `${direction}: ${pctLabel}`;
  };

  const waterfallCustoResolved =
    (waterfallCusto && waterfallCusto.length > 0
      ? waterfallCusto
      : normalizeWaterfall(
          globalData?.waterfallCusto ||
            globalData?.waterfalls?.custoMensal ||
            globalData?.waterfalls?.custo ||
            globalData?.waterfall?.custo
        )) || [];

  const waterfallQuantidadeResolved =
    (waterfallQuantidade && waterfallQuantidade.length > 0
      ? waterfallQuantidade
      : normalizeWaterfall(
          globalData?.waterfallQuantidade ||
            globalData?.waterfalls?.quantidade ||
            globalData?.waterfall?.quantidade
        )) || [];

  // UX: no waterfall global deve existir apenas 1 barra de variação entre Atual e Projetado
  const waterfallCustoDisplay = buildSimpleWaterfall({
    atual: custoAtualRealResolved,
    projetado: custoProjetadoResolved,
    variacao: variacaoCustoReaisResolved,
  });
  const waterfallQuantidadeDisplay = buildSimpleWaterfall({
    atual: profissionaisAtuaisResolved,
    projetado: profissionaisProjetadosResolved,
  });

  const computedFromHospitais = computeRankingsFromHospitais(
    (globalData?.hospitais as any[]) || []
  );

  const rankingCustoFromPayload =
    rankingCusto && rankingCusto.length > 0
      ? rankingCusto
      : normalizeRanking(
          globalData?.rankingHospitaisCusto ||
            globalData?.rankings?.hospitaisVariacaoCustoPercentual ||
            globalData?.rankings?.hospitaisCusto ||
            globalData?.ranking?.custo
        );

  const rankingCustoResolved =
    rankingCustoFromPayload.length > 0
      ? rankingCustoFromPayload
      : computedFromHospitais.rankingCusto;

  const rankingQuantidadeFromPayload =
    rankingQuantidade && rankingQuantidade.length > 0
      ? rankingQuantidade
      : normalizeRanking(
          globalData?.rankingHospitaisQtd ||
            globalData?.rankings?.hospitaisVariacaoQuantidadePercentual ||
            globalData?.rankingHospitaisQuantidade ||
            globalData?.rankings?.hospitaisQtd ||
            globalData?.rankings?.hospitaisQuantidade ||
            globalData?.ranking?.quantidade
        );

  const rankingQuantidadeResolved =
    rankingQuantidadeFromPayload.length > 0
      ? rankingQuantidadeFromPayload
      : computedFromHospitais.rankingQuantidade;

  const formatAbsCurrency = (value: number) => {
    if (!Number.isFinite(value)) return "--";
    return `R$ ${Math.abs(value).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatAbsInt = (value: number) => {
    if (!Number.isFinite(value)) return "--";
    return `${Math.abs(Math.round(value)).toLocaleString("pt-BR")}`;
  };

  const formatSignedInt = (value: number) => {
    if (!Number.isFinite(value)) return "--";
    const sign = value > 0 ? "+" : value < 0 ? "-" : "";
    return `${sign}${Math.abs(Math.round(value)).toLocaleString("pt-BR")}`;
  };

  const desvioFinanceiroReais = toNumber(variacaoCustoReaisResolved, 0);
  const desvioFinanceiroPct = toNumber(variacaoCustoPercentualResolved, 0);
  const desvioFuncionarios = toNumber(variacaoQuantidadeResolved, 0);
  const desvioFuncionariosPct = toNumber(variacaoQuantidadePercentual, 0);

  const hospitalMaiorDesvio =
    rankingCustoResolved && rankingCustoResolved.length > 0
      ? rankingCustoResolved.reduce((best, cur) => {
          const bestHasReais = typeof best?.variacaoReais === "number";
          const curHasReais = typeof cur?.variacaoReais === "number";

          const bestScore = bestHasReais
            ? Math.abs(toNumber(best.variacaoReais, 0))
            : Math.abs(toNumber(best?.variacaoPercentual, 0));
          const curScore = curHasReais
            ? Math.abs(toNumber(cur.variacaoReais, 0))
            : Math.abs(toNumber(cur?.variacaoPercentual, 0));

          return curScore > bestScore ? cur : best;
        })
      : undefined;

  type CargoVariacaoItem = {
    cargoNome?: string;
    cargo?: string;
    nome?: string;
    variacaoReais?: number;
    variacaoCustoReais?: number;
    variacaoQtd?: number;
    variacaoQuantidade?: number;
    qtdVariacao?: number;
    variacao?: number;
  };

  const cargoMaiorDesvio = (() => {
    const hospitaisList = Array.isArray(globalData?.hospitais)
      ? (globalData?.hospitais as any[])
      : [];

    const cargoMap = new Map<
      string,
      { nome: string; variacaoCustoReais: number; variacaoQtd: number }
    >();

    for (const h of hospitaisList) {
      const itens: CargoVariacaoItem[] =
        (h?.detalhamento?.variacoesPorCargo?.itens as CargoVariacaoItem[]) ||
        (h?.variacoesPorCargo?.itens as CargoVariacaoItem[]) ||
        (h?.detalhamento?.variacoesCargo?.itens as CargoVariacaoItem[]) ||
        [];

      if (!Array.isArray(itens) || itens.length === 0) continue;

      for (const it of itens) {
        const nome = String(it?.cargoNome ?? it?.cargo ?? it?.nome ?? "-");
        if (!nome || nome === "-") continue;

        const variacaoCustoReais =
          toNumber(
            it?.variacaoCustoReais ??
              it?.variacaoReais ??
              (it as any)?.custoVariacao,
            0
          ) || 0;

        const variacaoQtd =
          toNumber(
            it?.variacaoQtd ??
              it?.variacaoQuantidade ??
              it?.qtdVariacao ??
              (it as any)?.quantidadeVariacao ??
              it?.variacao,
            0
          ) || 0;

        const prev = cargoMap.get(nome) || {
          nome,
          variacaoCustoReais: 0,
          variacaoQtd: 0,
        };

        prev.variacaoCustoReais += variacaoCustoReais;
        prev.variacaoQtd += variacaoQtd;
        cargoMap.set(nome, prev);
      }
    }

    const aggregated = Array.from(cargoMap.values());
    if (aggregated.length === 0) return undefined;

    return aggregated.reduce((best, cur) => {
      const bestAbsCusto = Math.abs(toNumber(best?.variacaoCustoReais, 0));
      const curAbsCusto = Math.abs(toNumber(cur?.variacaoCustoReais, 0));
      if (curAbsCusto !== bestAbsCusto) {
        return curAbsCusto > bestAbsCusto ? cur : best;
      }

      const bestAbsQtd = Math.abs(toNumber(best?.variacaoQtd, 0));
      const curAbsQtd = Math.abs(toNumber(cur?.variacaoQtd, 0));
      return curAbsQtd > bestAbsQtd ? cur : best;
    });
  })();

  const axisTick = {
    fontSize: 12,
    fill: "hsl(var(--muted-foreground))",
  } as const;

  const renderRanking = (
    _title: string,
    data: BaselineRankingItemRede[],
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

  return (
    <div className="space-y-6">
      {/* Cards (modo rede) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <InfoCard
          title="Custo Total Atual"
          value={`R$ ${toNumber(custoAtualRealResolved, 0).toLocaleString(
            "pt-BR"
          )}`}
          subtitle=""
          icon={icons.atual}
          variant="primary"
        />

        <InfoCard
          title="Variação (R$)"
          value={`R$ ${Math.abs(
            toNumber(variacaoCustoReaisResolved, 0)
          ).toLocaleString("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`}
          subtitle={
            toNumber(variacaoCustoReaisResolved, 0) > 0
              ? formatArrowPct(
                  toNumber(variacaoCustoReaisResolved, 0),
                  toNumber(variacaoCustoPercentualResolved, 0)
                )
              : toNumber(variacaoCustoReaisResolved, 0) < 0
              ? formatArrowPct(
                  toNumber(variacaoCustoReaisResolved, 0),
                  toNumber(variacaoCustoPercentualResolved, 0)
                )
              : "Estável"
          }
          icon={icons.variacao}
          variant="warning"
        />

        <InfoCard
          title="Custo Total Projetado"
          value={`R$ ${toNumber(custoProjetadoResolved, 0).toLocaleString(
            "pt-BR"
          )}`}
          subtitle=""
          icon={icons.projetado}
          variant="success"
        />

        <InfoCard
          title="Total de Funcionários"
          value={String(toNumber(profissionaisAtuaisResolved, 0))}
          subtitle=""
          icon={icons.funcionarios}
          variant="primary"
        />

        <InfoCard
          title="Variação (Qtd)"
          value={String(Math.abs(toNumber(variacaoQuantidadeResolved, 0)))}
          subtitle={
            toNumber(variacaoQuantidadeResolved, 0) > 0
              ? formatArrowPct(
                  toNumber(variacaoQuantidadeResolved, 0),
                  toNumber(variacaoQuantidadePercentual, 0)
                )
              : toNumber(variacaoQuantidadeResolved, 0) < 0
              ? formatArrowPct(
                  toNumber(variacaoQuantidadeResolved, 0),
                  toNumber(variacaoQuantidadePercentual, 0)
                )
              : "Estável"
          }
          icon={icons.variacao}
          variant="warning"
        />

        <InfoCard
          title="Total de Funcionários Projetado"
          value={String(toNumber(profissionaisProjetadosResolved, 0))}
          subtitle=""
          icon={icons.funcionariosProjetado}
          variant="success"
        />
      </div>

      {/* Gráficos (modo rede) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Variação R$ (Mensal)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <ReusableWaterfall data={waterfallCustoDisplay} unit="currency" />
            <div className="mt-2 text-center text-sm text-muted-foreground">
              {formatVariationPctLabel(
                toNumber(variacaoCustoReaisResolved, 0),
                toNumber(variacaoCustoPercentualResolved, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Variação Quantidade</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 pb-4">
            <ReusableWaterfall
              data={waterfallQuantidadeDisplay}
              unit="people"
            />
            <div className="mt-2 text-center text-sm text-muted-foreground">
              {formatVariationPctLabel(
                toNumber(variacaoQuantidadeResolved, 0),
                toNumber(variacaoQuantidadePercentual, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards resumo (acima dos rankings) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          title="Desvio Financeiro"
          value={formatAbsCurrency(desvioFinanceiroReais)}
          subtitle={formatArrowPct(desvioFinanceiroReais, desvioFinanceiroPct)}
          icon={icons.variacao}
          variant="warning"
        />

        <InfoCard
          title="Desvio de Funcionários"
          value={formatAbsInt(desvioFuncionarios)}
          subtitle={formatArrowPct(desvioFuncionarios, desvioFuncionariosPct)}
          icon={icons.variacao}
          variant="warning"
        />

        <InfoCard
          title="Hospital com Maior Desvio"
          value={
            hospitalMaiorDesvio?.variacaoReais !== undefined
              ? formatAbsCurrency(
                  toNumber(hospitalMaiorDesvio.variacaoReais, 0)
                )
              : hospitalMaiorDesvio
              ? `${Math.abs(
                  toNumber(hospitalMaiorDesvio.variacaoPercentual, 0)
                ).toLocaleString("pt-BR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}%`
              : "--"
          }
          subtitle={
            hospitalMaiorDesvio
              ? `${hospitalMaiorDesvio.nome} • ${formatArrowPct(
                  toNumber(hospitalMaiorDesvio.variacaoReais, 0),
                  toNumber(hospitalMaiorDesvio.variacaoPercentual, 0)
                )}`
              : "Dados insuficientes"
          }
          icon={icons.atual}
          variant="primary"
        />

        <InfoCard
          title="Cargo com Maior Desvio"
          value={
            cargoMaiorDesvio
              ? formatAbsCurrency(
                  toNumber(cargoMaiorDesvio.variacaoCustoReais, 0)
                )
              : "--"
          }
          subtitle={
            cargoMaiorDesvio
              ? `${cargoMaiorDesvio.nome} • ${formatSignedInt(
                  toNumber(cargoMaiorDesvio.variacaoQtd, 0)
                )} funcionários`
              : "Dados insuficientes"
          }
          icon={icons.funcionarios}
          variant="primary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Ranking da Variação dos Hospitais (R$) (%)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {renderRanking(
              "Ranking da Variação dos Hospitais (R$) (%)",
              rankingCustoResolved,
              "currency"
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Ranking da Variação dos Hospitais (Qtd) (%)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {renderRanking(
              "Ranking da Variação dos Hospitais (Qtd) (%)",
              rankingQuantidadeResolved,
              "people"
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
