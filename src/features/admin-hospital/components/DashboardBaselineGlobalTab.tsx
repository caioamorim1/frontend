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
      {/* Cards principais (modo rede = 5 cards) */}
      <div
        className={`grid grid-cols-1 gap-4 ${
          isGlobalView ? "md:grid-cols-5" : "md:grid-cols-3"
        }`}
      >
        <InfoCard
          title={
            isGlobalView
              ? "Custo Total ATUAL R$ (Mensal)"
              : "Situação Atual Real"
          }
          value={`R$ ${custoAtualReal.toLocaleString("pt-BR")}`}
          subtitle={isGlobalView ? "" : `${profissionaisAtuais} colaboradores`}
          icon={icons.atual}
          variant="primary"
        />

        <InfoCard
          title={isGlobalView ? "Variação (R$)" : "Variação"}
          value={`R$ ${Math.abs(variacaoCustoReais).toLocaleString("pt-BR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`}
          subtitle={
            isGlobalView
              ? variacaoCustoReais > 0
                ? "Aumento"
                : variacaoCustoReais < 0
                ? "Redução"
                : "Estável"
              : `${
                  profissionaisProjetados - profissionaisAtuais >= 0 ? "+" : ""
                }${profissionaisProjetados - profissionaisAtuais} colaboradores`
          }
          icon={icons.variacao}
          variant="warning"
        />

        <InfoCard
          title={
            isGlobalView
              ? "Custo Total PROJETADO R$ (Mensal)"
              : "Custo Projetado"
          }
          value={`R$ ${custoProjetado.toLocaleString("pt-BR")}`}
          subtitle={
            isGlobalView ? "" : `${profissionaisProjetados} colaboradores`
          }
          icon={icons.projetado}
          variant="success"
        />

        {isGlobalView ? (
          <>
            <InfoCard
              title="Total de Funcionários"
              value={String(profissionaisAtuais)}
              subtitle=""
              icon={icons.funcionarios}
              variant="primary"
            />
            <InfoCard
              title="Total de Funcionários Projetado"
              value={String(profissionaisProjetados)}
              subtitle=""
              icon={icons.funcionariosProjetado}
              variant="success"
            />
          </>
        ) : null}
      </div>

      {/* Texto de atualização (modo rede) */}
      {isGlobalView ? (
        <div className="text-sm text-muted-foreground font-medium">
          Atualização do nº de colaboradores em: {staffLastUpdateLabel}
        </div>
      ) : null}

      {/* Filtros (modo rede) */}
      {isGlobalView ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Filtrar por Grupo
            </label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Visão Geral" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visão Geral</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Filtrar por Região
            </label>
            <Select
              value={selectedRegionId}
              onValueChange={setSelectedRegionId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Visão Geral" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visão Geral</SelectItem>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Filtrar por Hospital
            </label>
            <Select
              value={selectedHospitalId}
              onValueChange={setSelectedHospitalId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Visão Geral" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visão Geral</SelectItem>
                {hospitals.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                Use o modo hospital para este ranking.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
