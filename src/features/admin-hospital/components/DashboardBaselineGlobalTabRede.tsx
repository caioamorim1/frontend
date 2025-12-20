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

  const axisTick = {
    fontSize: 12,
    fill: "hsl(var(--muted-foreground))",
  } as const;

  const renderRanking = (
    _title: string,
    data: BaselineRankingItemRede[],
    tooltipFormatter: (value: any, name: string, props: any) => any
  ) => {
    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[350px] text-muted-foreground">
          Dados insuficientes para análise.
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tick={axisTick} />
          <YAxis type="category" dataKey="nome" width={110} tick={axisTick} />
          <Tooltip formatter={tooltipFormatter} />
          <Bar dataKey="variacaoPercentual">
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Cards (modo rede) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <InfoCard
          title="Custo Total ATUAL R$ (Mensal)"
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
              ? "Aumento"
              : toNumber(variacaoCustoReaisResolved, 0) < 0
              ? "Redução"
              : "Estável"
          }
          icon={icons.variacao}
          variant="warning"
        />

        <InfoCard
          title="Custo Total PROJETADO R$ (Mensal)"
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
          <CardContent>
            <ReusableWaterfall data={waterfallCustoDisplay} unit="currency" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Variação Quantidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ReusableWaterfall
              data={waterfallQuantidadeDisplay}
              unit="people"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Ranking da Variação dos Hospitais (R$) (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderRanking(
              "Ranking da Variação dos Hospitais (R$) (%)",
              rankingCustoResolved,
              (value: any, _name: string, props: any) => {
                const variacaoReais = props?.payload?.variacaoReais;
                if (typeof variacaoReais === "number") {
                  return `R$ ${variacaoReais.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`;
                }
                return `${Number(value).toFixed(1)}%`;
              }
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Ranking da Variação dos Hospitais (Qtd) (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderRanking(
              "Ranking da Variação dos Hospitais (Qtd) (%)",
              rankingQuantidadeResolved,
              (value: any) => `${Number(value).toFixed(1)}%`
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
