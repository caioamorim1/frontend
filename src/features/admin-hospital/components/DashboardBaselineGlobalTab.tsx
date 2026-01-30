import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
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

export type BaselineRankingItem = {
  nome: string;
  variacaoPercentual: number;
  variacaoReais?: number;
};

export const DashboardBaselineGlobalTab: React.FC<{
  isGlobalView: boolean;

  // cards
  custoAtualReal: number;
  custoProjetado: number;
  variacaoCustoReais: number;
  profissionaisAtuais: number;
  profissionaisProjetados: number;

  InfoCard: React.FC<InfoCardProps>;
  icons: {
    atual: React.ReactNode;
    variacao: React.ReactNode;
    projetado: React.ReactNode;
    funcionarios: React.ReactNode;
    funcionariosProjetado: React.ReactNode;
  };

  // filters (modo rede)
  selectedGroupId: string;
  setSelectedGroupId: (value: string) => void;
  groups: Array<{ id: string; name: string }>;

  selectedRegionId: string;
  setSelectedRegionId: (value: string) => void;
  regions: Array<{ id: string; name: string }>;

  selectedHospitalId: string;
  setSelectedHospitalId: (value: string) => void;
  hospitals: Array<{ id: string; name: string }>;

  staffLastUpdateLabel: string;

  // charts
  ReusableWaterfall: React.FC<{
    data: WaterfallItem[];
    unit: "currency" | "people";
  }>;
  waterfallCusto: WaterfallItem[];
  waterfallQuantidade: WaterfallItem[];

  rankingCusto: BaselineRankingItem[];
  rankingQuantidade: BaselineRankingItem[];
  rankingSetores?: BaselineRankingItem[];
}> = ({
  isGlobalView,
  custoAtualReal,
  custoProjetado,
  variacaoCustoReais,
  profissionaisAtuais,
  profissionaisProjetados,
  InfoCard,
  icons,
  selectedGroupId,
  setSelectedGroupId,
  groups,
  selectedRegionId,
  setSelectedRegionId,
  regions,
  selectedHospitalId,
  setSelectedHospitalId,
  hospitals,
  staffLastUpdateLabel,
  ReusableWaterfall,
  waterfallCusto,
  waterfallQuantidade,
  rankingCusto,
  rankingQuantidade,
  rankingSetores,
}) => {
  const axisTick = {
    fontSize: 12,
    fill: "hsl(var(--muted-foreground))",
  } as const;

  const deltaPeople = profissionaisProjetados - profissionaisAtuais;
  const deltaCostPercent =
    custoAtualReal !== 0 ? (variacaoCustoReais / custoAtualReal) * 100 : 0;
  const isPositiveCost = variacaoCustoReais >= 0;
  // Lógica invertida: redução (negativo) = verde e seta para cima, aumento (positivo) = vermelho e seta para baixo
  const TrendIcon = isPositiveCost ? ArrowDown : ArrowUp;
  const trendColorClass = isPositiveCost ? "text-red-600" : "text-green-600";
  const costPercentLabel = `${Math.abs(deltaCostPercent).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }
  )}%`;

  type SectorRankingOrder = "asc" | "desc";
  // Padrão: menor -> maior (mais negativo primeiro), como pedido
  const [sectorRankingOrder, setSectorRankingOrder] =
    useState<SectorRankingOrder>("asc");

  const orderedRankingSetores = useMemo(() => {
    const items = [...(rankingSetores || [])];
    if (items.length <= 1) return items;

    items.sort((a, b) => {
      const av = a.variacaoPercentual;
      const bv = b.variacaoPercentual;
      return sectorRankingOrder === "asc" ? av - bv : bv - av;
    });
    return items;
  }, [rankingSetores, sectorRankingOrder]);

  const renderRanking = (
    title: string,
    data: BaselineRankingItem[],
    tooltipFormatter: (value: any, name: string, props: any) => any
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
            <Tooltip formatter={tooltipFormatter} />
            <Bar dataKey="variacaoPercentual" barSize={18}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.variacaoPercentual < 0 ? "#16a34a" : "#dc2626"}
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
      {/* Cards e filtros do modo rede ficam no BaselineScreen (compartilhados entre abas) */}
      {!isGlobalView ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoCard
            title="Custo Total Atual "
            value={`R$ ${custoAtualReal.toLocaleString("pt-BR")}`}
            subtitle={`${profissionaisAtuais} colaboradores • Última atualização: ${staffLastUpdateLabel}`}
            icon={icons.atual}
            variant="primary"
          />

          <InfoCard
            title="Variação"
            value={`R$ ${Math.abs(variacaoCustoReais).toLocaleString("pt-BR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`}
            subtitle={`${Math.abs(deltaPeople)} colaboradores`}
            icon={
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold leading-none">
                  {costPercentLabel}
                </span>
                <TrendIcon className={`h-6 w-6 ${trendColorClass}`} />
              </div>
            }
            variant="warning"
          />

          <InfoCard
            title="Custo Total Projetado"
            value={`R$ ${custoProjetado.toLocaleString("pt-BR")}`}
            subtitle={`${profissionaisProjetados} colaboradores`}
            icon={icons.projetado}
            variant="success"
          />
        </div>
      ) : null}

      {/* Gráficos */}
      {isGlobalView ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Variação R$ (Mensal)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <div className="h-[380px] md:h-[440px]">
                  <ReusableWaterfall data={waterfallCusto} unit="currency" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Variação Quantidade</CardTitle>
              </CardHeader>
              <CardContent className="px-2 pb-4">
                <div className="h-[380px] md:h-[440px]">
                  <ReusableWaterfall data={waterfallQuantidade} unit="people" />
                </div>
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
                  rankingCusto,
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
                  rankingQuantidade,
                  (value: any) => `${Number(value).toFixed(1)}%`
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        // modo hospital mantém o layout atual (3 gráficos)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Variação em R$ (Período)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="h-[380px] md:h-[440px]">
                <ReusableWaterfall data={waterfallCusto} unit="currency" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Variação em Quantidade
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <div className="h-[380px] md:h-[440px]">
                <ReusableWaterfall data={waterfallQuantidade} unit="people" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">
                  Ranking por SETORES (%)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Ordenação
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        sectorRankingOrder === "asc"
                          ? "text-xs font-medium text-foreground whitespace-nowrap"
                          : "text-xs text-muted-foreground whitespace-nowrap"
                      }
                    >
                      Maior
                    </span>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={sectorRankingOrder === "desc"}
                      onClick={() =>
                        setSectorRankingOrder((prev) =>
                          prev === "asc" ? "desc" : "asc"
                        )
                      }
                      className={
                        "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors " +
                        (sectorRankingOrder === "desc"
                          ? "bg-primary/10 border-primary/40"
                          : "bg-muted border-border")
                      }
                      title={
                        sectorRankingOrder === "desc"
                          ? "Maior → Menor"
                          : "Menor → Maior"
                      }
                    >
                      <span
                        className={
                          "inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform " +
                          (sectorRankingOrder === "desc"
                            ? "translate-x-5"
                            : "translate-x-0")
                        }
                      />
                    </button>

                    <span
                      className={
                        sectorRankingOrder === "desc"
                          ? "text-xs font-medium text-foreground whitespace-nowrap"
                          : "text-xs text-muted-foreground whitespace-nowrap"
                      }
                    >
                      Menor
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {renderRanking(
                "Ranking por SETORES (%)",
                orderedRankingSetores,
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
        </div>
      )}
    </div>
  );
};
