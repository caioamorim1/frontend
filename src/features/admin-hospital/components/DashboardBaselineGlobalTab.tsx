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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      {/* Cards e filtros do modo rede ficam no BaselineScreen (compartilhados entre abas) */}
      {!isGlobalView ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoCard
            title="Situação Atual Real"
            value={`R$ ${custoAtualReal.toLocaleString("pt-BR")}`}
            subtitle={`${profissionaisAtuais} colaboradores`}
            icon={icons.atual}
            variant="primary"
          />

          <InfoCard
            title="Variação"
            value={`R$ ${Math.abs(variacaoCustoReais).toLocaleString("pt-BR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`}
            subtitle={`${
              profissionaisProjetados - profissionaisAtuais >= 0 ? "+" : ""
            }${profissionaisProjetados - profissionaisAtuais} colaboradores`}
            icon={icons.variacao}
            variant="warning"
          />

          <InfoCard
            title="Custo Projetado"
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
              <CardContent>
                <ReusableWaterfall data={waterfallCusto} unit="currency" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Variação Quantidade</CardTitle>
              </CardHeader>
              <CardContent>
                <ReusableWaterfall data={waterfallQuantidade} unit="people" />
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
            <CardContent>
              <ReusableWaterfall data={waterfallCusto} unit="currency" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Variação em Quantidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReusableWaterfall data={waterfallQuantidade} unit="people" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Ranking por SETORES (%)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderRanking(
                "Ranking por SETORES (%)",
                rankingSetores || [],
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
