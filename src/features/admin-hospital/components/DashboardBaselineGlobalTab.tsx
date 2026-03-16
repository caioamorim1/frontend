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
    custoAtualReal !== 0 ? (variacaoCustoReais / custoProjetado) * 100 : 0;
  const isPositiveCost = variacaoCustoReais >= 0;
  // Lógica invertida: redução (negativo) = vermelho e seta para cima, aumento (positivo) = verde e seta para baixo
  const TrendIcon = isPositiveCost ? ArrowDown : ArrowUp;
  const trendColorClass = isPositiveCost ? "text-green-600" : "text-red-600";
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

  const [hospitalRankingOrder, setHospitalRankingOrder] =
    useState<SectorRankingOrder>("asc");

  const orderedRankingCusto = useMemo(() => {
    const items = [...(rankingCusto || [])];
    if (items.length <= 1) return items;
    items.sort((a, b) => {
      const av = a.variacaoReais ?? a.variacaoPercentual;
      const bv = b.variacaoReais ?? b.variacaoPercentual;
      return hospitalRankingOrder === "asc" ? av - bv : bv - av;
    });
    return items;
  }, [rankingCusto, hospitalRankingOrder]);

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

  // Tooltip customizado para ranking de setores
  const RankingSetoresTooltip = ({ active, payload }: any) => {
    if (!active || !Array.isArray(payload) || payload.length === 0) return null;
    const entry = payload?.[0]?.payload as BaselineRankingItem | undefined;
    if (!entry) return null;
    const nome = String(entry.nome ?? "-");
    const pct = entry.variacaoPercentual ?? 0;
    const variacaoReais = entry.variacaoReais ?? 0;
    const pctLabel = `${Math.abs(pct).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })}%`;
    const reaisLabel = `R$ ${variacaoReais.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    return (
      <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
        <div className="text-sm font-medium text-foreground">{nome}</div>
        <div className="mt-1 text-sm text-muted-foreground">
          Percentual: <span className="text-foreground">{pctLabel}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Monetário: <span className="text-foreground">{reaisLabel}</span>
        </div>
      </div>
    );
  };

  const renderRanking = (
    title: string,
    data: BaselineRankingItem[],
    useCustomTooltip?: boolean
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
            <Tooltip
              content={useCustomTooltip ? <RankingSetoresTooltip /> : undefined}
            />
            <Bar dataKey="variacaoPercentual" barSize={18}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.variacaoPercentual < 0 ? "#dc2626" : "#16a34a"}
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variação R$ (Mensal)</CardTitle>
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

          {/* Ranking Hospitais R$ — mesmo estilo do dashboard de hospital */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">
                  Ranking de Variação dos Hospitais (R$)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Ordenação
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        hospitalRankingOrder === "asc"
                          ? "text-xs font-medium text-foreground whitespace-nowrap"
                          : "text-xs text-muted-foreground whitespace-nowrap"
                      }
                    >
                      Maior
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hospitalRankingOrder === "desc"}
                      onClick={() =>
                        setHospitalRankingOrder((prev) =>
                          prev === "asc" ? "desc" : "asc"
                        )
                      }
                      className={
                        "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors " +
                        (hospitalRankingOrder === "desc"
                          ? "bg-primary/10 border-primary/40"
                          : "bg-muted border-border")
                      }
                      title={
                        hospitalRankingOrder === "desc"
                          ? "Maior → Menor"
                          : "Menor → Maior"
                      }
                    >
                      <span
                        className={
                          "inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform " +
                          (hospitalRankingOrder === "desc"
                            ? "translate-x-5"
                            : "translate-x-0")
                        }
                      />
                    </button>
                    <span
                      className={
                        hospitalRankingOrder === "desc"
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
            <CardContent className="space-y-3">
              <p className="text-xs font-semibold text-center text-muted-foreground">
                Variação por Hospital (R$)
              </p>
              {!orderedRankingCusto || orderedRankingCusto.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  Dados insuficientes para análise.
                </div>
              ) : (
                <div
                  style={{
                    height: Math.max(280, orderedRankingCusto.length * 38),
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={orderedRankingCusto}
                      layout="vertical"
                      margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        tick={axisTick}
                        tickFormatter={(v: number) => {
                          const abs = Math.abs(v);
                          if (abs >= 1_000_000)
                            return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
                          if (abs >= 1_000)
                            return `R$ ${(v / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k`;
                          return `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="nome"
                        width={110}
                        tick={axisTick}
                      />
                      <Tooltip content={<RankingSetoresTooltip />} />
                      <Bar dataKey="variacaoReais" barSize={16}>
                        {orderedRankingCusto.map((entry, i) => (
                          <Cell
                            key={`hosp-reais-${i}`}
                            fill={
                              (entry.variacaoReais ?? 0) < 0
                                ? "#dc2626"
                                : "#16a34a"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="rounded border p-3 text-xs space-y-1 bg-muted/30">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo Atual:</span>
                  <span className="font-semibold">
                    R${" "}
                    {custoAtualReal.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Custo Projetado:
                  </span>
                  <span className="font-semibold">
                    R${" "}
                    {custoProjetado.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Variação:</span>
                  <span
                    className={`font-semibold ${
                      variacaoCustoReais >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    R${" "}
                    {variacaoCustoReais.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // modo hospital mantém o layout atual (3 gráficos)
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Variação em R$ 
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
                true
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
