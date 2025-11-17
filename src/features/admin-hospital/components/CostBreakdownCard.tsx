/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  Target,
  AlertCircle,
  ChevronRight,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CostItem {
  nome: string;
  custo: number;
  acumulado: number;
  acumuladoPercent: number;
  ativo: boolean;
}

interface CostBreakdownCardProps {
  selectedData: CostItem[];
  totalSelected: number;
  totalAll: number;
}

const CostBreakdownCard: React.FC<CostBreakdownCardProps> = ({
  selectedData,
  totalSelected,
  totalAll,
}) => {
  const [expandedSection, setExpandedSection] = useState<string>("overview");

  // Cálculos para métricas
  const averageCost =
    selectedData.length > 0 ? totalSelected / selectedData.length : 0;
  const highestCost = selectedData[0]?.custo || 0;
  const lowestCost = selectedData[selectedData.length - 1]?.custo || 0;
  const costVariation =
    highestCost > 0 ? ((highestCost - lowestCost) / highestCost) * 100 : 0;
  const percentOfTotal = totalAll > 0 ? (totalSelected / totalAll) * 100 : 0;

  // Categorização por custo
  const highCostSectors = selectedData.filter(
    (item) => item.custo > averageCost * 1.5
  );
  const mediumCostSectors = selectedData.filter(
    (item) => item.custo >= averageCost * 0.5 && item.custo <= averageCost * 1.5
  );
  const lowCostSectors = selectedData.filter(
    (item) => item.custo < averageCost * 0.5
  );

  // Regra 80/20 - incluir setores (ordenados por custo desc) até atingir no máximo 80% do total selecionado
  const sortedByCostDesc = [...selectedData].sort((a, b) => b.custo - a.custo);
  const threshold = (totalSelected || 0) * 0.8;
  let accumulated = 0;
  const pareto80Sectors: CostItem[] = [];
  for (const item of sortedByCostDesc) {
    const next = accumulated + item.custo;
    if (next <= threshold) {
      pareto80Sectors.push(item);
      accumulated = next;
    } else {
      break; // se ultrapassar 80%, não considera os próximos
    }
  }
  const paretoPercent =
    totalSelected > 0 ? (accumulated / totalSelected) * 100 : 0;

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    colorClass = "bg-primary",
    textColorClass = "text-primary-foreground",
  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    trend?: "up" | "down" | "neutral";
    colorClass?: string;
    textColorClass?: string;
  }) => (
    <Card className="relative overflow-hidden shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground flex items-center">
              {trend === "up" && (
                <TrendingUp className="h-3 w-3 mr-1 text-success" />
              )}
              {trend === "down" && (
                <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
              )}
              {subtitle}
            </p>
          </div>
          <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className={`h-6 w-6 ${textColorClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SectionHeader = ({
    title,
    description,
    sectionKey,
    icon: Icon,
  }: {
    title: string;
    description: string;
    sectionKey: string;
    icon: any;
  }) => (
    <Button
      variant="ghost"
      className="w-full justify-between p-4 h-auto"
      onClick={() =>
        setExpandedSection(expandedSection === sectionKey ? "" : sectionKey)
      }
    >
      <div className="flex items-center space-x-3 text-left">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronRight
        className={`h-4 w-4 transition-transform ${
          expandedSection === sectionKey ? "rotate-90" : ""
        }`}
      />
    </Button>
  );

  if (selectedData.length === 0) {
    return (
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-warning" />
            Detalhamento de Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <PieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum setor selecionado
            </h3>
            <p className="text-muted-foreground">
              Selecione setores na tabela para ver o detalhamento de custos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-primary" />
            Métricas dos Setores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total "
              value={totalSelected.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              subtitle={`Valor total geral`}
              icon={DollarSign}
              trend="up"
              colorClass="bg-gradient-primary"
              textColorClass="text-primary-foreground"
            />
            <MetricCard
              title="Custo Médio"
              value={averageCost.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              subtitle={`Entre ${selectedData.length} setores`}
              icon={BarChart3}
              trend="neutral"
              colorClass="bg-success"
              textColorClass="text-success-foreground"
            />
            <MetricCard
              title="Maior Custo"
              value={highestCost.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
              subtitle={selectedData[0]?.nome || "N/A"}
              icon={TrendingUp}
              trend="up"
              colorClass="bg-warning"
              textColorClass="text-warning-foreground"
            />
            <MetricCard
              title="Variação"
              value={`${costVariation.toFixed(1)}%`}
              subtitle="Diferença maior/menor"
              icon={Activity}
              trend={costVariation > 50 ? "up" : "neutral"}
              colorClass="bg-info"
              textColorClass="text-info-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Análises Detalhadas */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2 text-primary" />
            Análises Detalhadas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Análise por Categoria de Custo */}
          <div>
            <SectionHeader
              title="Categorização por Custo"
              description={`${highCostSectors.length} alto • ${mediumCostSectors.length} médio • ${lowCostSectors.length} baixo`}
              sectionKey="categories"
              icon={BarChart3}
            />
            {expandedSection === "categories" && (
              <div className="mt-4 space-y-4 pl-8">
                <CostCategorySection
                  title="Alto Custo"
                  subtitle={`Acima de ${(averageCost * 1.5).toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    }
                  )}`}
                  items={highCostSectors}
                  badgeVariant="destructive"
                />
                <CostCategorySection
                  title="Custo Médio"
                  subtitle={`Entre ${(averageCost * 0.5).toLocaleString(
                    "pt-BR",
                    { style: "currency", currency: "BRL" }
                  )} - ${(averageCost * 1.5).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}`}
                  items={mediumCostSectors}
                  badgeVariant="secondary"
                />
                <CostCategorySection
                  title="Baixo Custo"
                  subtitle={`Abaixo de ${(averageCost * 0.5).toLocaleString(
                    "pt-BR",
                    { style: "currency", currency: "BRL" }
                  )}`}
                  items={lowCostSectors}
                  badgeVariant="outline"
                />
              </div>
            )}
          </div>

          {/* Análise de Pareto */}
          <div>
            <SectionHeader
              title="Análise Pareto (80/20)"
              description={`${
                pareto80Sectors.length
              } setores somam ${paretoPercent.toFixed(
                1
              )}% dos custos (até 80%)`}
              sectionKey="pareto"
              icon={TrendingUp}
            />
            {expandedSection === "pareto" && (
              <div className="mt-4 pl-8">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h5 className="font-semibold text-primary mb-3">
                    Setores Críticos (80% dos Custos)
                  </h5>
                  <div className="space-y-2">
                    {pareto80Sectors.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 border-b border-primary/10 last:border-0"
                      >
                        <span className="font-medium">{item.nome}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {item.custo.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {((item.custo / totalSelected) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-primary/20">
                    <p className="text-sm text-primary font-medium">
                      Total dos setores críticos:{" "}
                      {pareto80Sectors
                        .reduce((sum, item) => sum + item.custo, 0)
                        .toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comparação com Total Geral - Removido */}
        </CardContent>
      </Card>
    </div>
  );
};

const CostCategorySection = ({
  title,
  subtitle,
  items,
  badgeVariant,
}: {
  title: string;
  subtitle: string;
  items: CostItem[];
  badgeVariant: "destructive" | "secondary" | "outline";
}) => (
  <div className="border border-border rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <div>
        <h5 className="font-semibold">{title}</h5>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Badge variant={badgeVariant}>{items.length} setores</Badge>
    </div>
    {items.length > 0 ? (
      <div className="space-y-2">
        {items.slice(0, 3).map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center text-sm"
          >
            <span>{item.nome}</span>
            <span className="font-medium">
              {item.custo.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </div>
        ))}
        {items.length > 3 && (
          <p className="text-xs text-muted-foreground">
            +{items.length - 3} outros setores
          </p>
        )}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">
        Nenhum setor nesta categoria
      </p>
    )}
  </div>
);

export default CostBreakdownCard;
