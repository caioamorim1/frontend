/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Calculator,
  Target,
  Eye,
  EyeOff,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CostBreakdownCard from "./CostBreakdownCard";

interface CostItem {
  nome: string;
  custo: number;
  acumulado: number;
  acumuladoPercent: number;
  ativo: boolean;
}

interface CostAnalyticsPanelProps {
  allData: CostItem[];
  selectedData: CostItem[];
  totalAll: number;
  totalSelected: number;
  onToggleAnalytics?: () => void;
  visible?: boolean;
}

const CostAnalyticsPanel: React.FC<CostAnalyticsPanelProps> = ({
  allData,
  selectedData,
  totalAll,
  totalSelected,
  onToggleAnalytics,
  visible = true,
}) => {
  const [activeView, setActiveView] = useState<
    "breakdown" | "trends" | "insights"
  >("breakdown");

  // Cálculos para insights
  const selectionRate =
    allData.length > 0 ? (selectedData.length / allData.length) * 100 : 0;
  const costConcentration =
    selectedData.length > 0
      ? (selectedData
          .slice(0, Math.ceil(selectedData.length * 0.2))
          .reduce((sum, item) => sum + item.custo, 0) /
          totalSelected) *
        100
      : 0;

  // Recomendações baseadas nos dados
  const generateInsights = () => {
    const insights = [];

    if (selectionRate < 30) {
      insights.push({
        type: "warning",
        title: "Baixa Seleção de Setores",
        description: `Apenas ${selectionRate.toFixed(
          1
        )}% dos setores estão selecionados. Considere incluir mais setores críticos.`,
        action: "Revisar seleção",
      });
    }

    if (costConcentration > 70) {
      insights.push({
        type: "info",
        title: "Alta Concentração de Custos",
        description: `${costConcentration.toFixed(
          1
        )}% dos custos estão concentrados em poucos setores.`,
        action: "Focar otimização",
      });
    }

    if (
      selectedData.length > 0 &&
      selectedData[0] &&
      selectedData[0].custo > totalSelected * 0.4
    ) {
      insights.push({
        type: "alert",
        title: "Setor Dominante",
        description: `${selectedData[0].nome} representa mais de 40% dos custos selecionados.`,
        action: "Analisar detalhadamente",
      });
    }

    if (totalSelected > totalAll * 0.8) {
      insights.push({
        type: "success",
        title: "Cobertura Abrangente",
        description: "A seleção representa mais de 80% dos custos totais.",
        action: "Análise completa",
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const ViewButton = ({
    view,
    label,
    icon: Icon,
  }: {
    view: string;
    label: string;
    icon: any;
  }) => (
    <Button
      variant={activeView === view ? "default" : "outline"}
      size="sm"
      onClick={() => setActiveView(view as any)}
      className="flex items-center space-x-2"
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Button>
  );

  if (!visible) return null;

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle>Analytics dos Custos Selecionados</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Análise detalhada de {selectedData.length} setores
                  selecionados
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onToggleAnalytics && (
                <Button variant="outline" size="sm" onClick={onToggleAnalytics}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Ocultar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-2xl font-bold text-primary">
                {selectedData.length}
              </p>
              <p className="text-xs text-muted-foreground">Setores Ativos</p>
            </div>{" "}
            <div className="text-center p-3 bg-success/5 rounded-lg border border-success/20">
              <p className="text-2xl font-bold text-success">
                {totalSelected.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
              <p className="text-xs text-muted-foreground">Total Selecionado</p>
            </div>
            <div className="text-center p-3 bg-warning/5 rounded-lg border border-warning/20">
              <p className="text-2xl font-bold text-warning">
                {((totalSelected / totalAll) * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Do Total Geral</p>
            </div>
            <div className="text-center p-3 bg-info/5 rounded-lg border border-info/20">
              <p className="text-2xl font-bold text-info">
                {selectedData.length > 0
                  ? (totalSelected / selectedData.length).toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL",
                      }
                    )
                  : "R$ 0,00"}
              </p>
              <p className="text-xs text-muted-foreground">Custo Médio</p>
            </div>
          </div>

          {/* Navegação de Views */}
          <div className="flex items-center space-x-2 mb-4">
            <ViewButton
              view="breakdown"
              label="Detalhamento"
              icon={Calculator}
            />
            <ViewButton view="trends" label="Tendências" icon={TrendingUp} />
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo baseado na view ativa */}
      {activeView === "breakdown" && (
        <CostBreakdownCard
          selectedData={allData}
          totalSelected={totalAll}
          totalAll={totalAll}
        />
      )}

      {activeView === "trends" && (
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Análise de Tendências
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Distribuição de Custos */}
              <div>
                <h4 className="font-semibold mb-4">
                  Distribuição de Custos por Quartil
                </h4>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[1, 2, 3, 4].map((quartil) => {
                    const start = Math.floor(
                      ((quartil - 1) * allData.length) / 4
                    );
                    const end = Math.floor((quartil * allData.length) / 4);
                    const quartilData = allData.slice(start, end);
                    const quartilTotal = quartilData.reduce(
                      (sum, item) => sum + item.custo,
                      0
                    );
                    const quartilPercent =
                      totalAll > 0 ? (quartilTotal / totalAll) * 100 : 0;

                    return (
                      <div
                        key={quartil}
                        className="text-center p-3 bg-muted/50 rounded-lg"
                      >
                        <p className="text-sm font-medium">Q{quartil}</p>
                        <p className="text-lg font-bold">
                          {quartilPercent.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {quartilTotal.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Concentração vs Dispersão */}
              <div>
                <h4 className="font-semibold mb-4">Análise de Concentração</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span>Top 20% dos setores representam:</span>
                    <Badge variant="secondary">
                      {costConcentration.toFixed(1)}% dos custos
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === "insights" && (
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-primary" />
              Insights e Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      insight.type === "warning"
                        ? "bg-warning/5 border-warning/20"
                        : insight.type === "info"
                        ? "bg-info/5 border-info/20"
                        : insight.type === "alert"
                        ? "bg-destructive/5 border-destructive/20"
                        : "bg-success/5 border-success/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold mb-1">{insight.title}</h5>
                        <p className="text-sm text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {insight.action}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Selecione mais setores para gerar insights personalizados.
                  </p>
                </div>
              )}

              <Separator className="my-6" />

              {/* Ações Recomendadas */}
              <div>
                <h4 className="font-semibold mb-4">Ações Recomendadas</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar seleção de setores
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Aplicar filtros por custo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar relatório detalhado
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CostAnalyticsPanel;
