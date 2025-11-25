import React, { useState, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Globe } from "lucide-react";
import { useOccupationAnalysis } from "@/hooks/useOccupationAnalysis";
import { Skeleton } from "@/components/ui/skeleton";

// --- ESTRUTURA DE DADOS ---
export interface OccupationData {
  name: string;
  "Taxa de Ocupação": number;
  "Taxa de Ocupação Diária"?: number; // 🆕 Taxa média do dia
  "Ocupação Máxima Atendível": number; // 🆕 Nova métrica
  Ociosidade: number;
  Superlotação: number;
  "Capacidade Produtiva": number;
}

interface OccupationRateChartProps {
  data: OccupationData[];
  summary: OccupationData;
  title?: string;
  hospitalId?: string; // Se fornecido, usa a rota oficial de análise para montar os dados
  redeId?: string; // 🆕 Para análise de rede
  showViewSelector?: boolean; // Se true, mostra botões Setorial/Global
  aggregationType?: "hospital" | "grupo" | "regiao" | "rede"; // Mantido para compat, mas ignorado quando hospitalId é usado
  entityId?: string; // Mantido para compat
}

const axisTick = {
  fontSize: 12,
  fill: "hsl(var(--muted-foreground))",
} as const;

// Paleta Monocromática de Azul
const barConfig = [
  {
    key: "Taxa de Ocupação",
    color: "hsl(210, 100%, 45%)",
    label: "Taxa Atual",
  }, // Azul médio-escuro (base)
  {
    key: "Ocupação Máxima Atendível",
    color: "hsl(210, 80%, 55%)",
    label: "Cobertura de Equipe",
  }, // Azul médio (referência)
  {
    key: "Ociosidade",
    color: "hsl(142, 71%, 45%)",
    label: "Excedente de Capacidade",
  }, // Verde (capacidade ociosa/excedente)
  {
    key: "Superlotação",
    color: "hsl(0, 55%, 65%)",
    label: "Deficit de Equipe",
  }, // Vermelho (deficit/sobrecarga)
];

// Mapeamento de chaves técnicas para labels amigáveis
const labelMap: Record<string, string> = {
  "Taxa de Ocupação": "Taxa Atual",
  "Ocupação Máxima Atendível": "Cobertura de Equipe",
  Ociosidade: "Excedente de Capacidade",
  Superlotação: "Deficit de Equipe",
};

// --- COMPONENTES AUXILIARES ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm space-y-1">
        <p className="font-bold text-foreground mb-2">{label}</p>
        {payload
          .filter((p) =>
            [
              "Taxa de Ocupação",
              "Ocupação Máxima Atendível",
              "Ociosidade",
              "Superlotação",
            ].includes(p.dataKey)
          )
          .map((entry: any) => (
            <p
              key={entry.dataKey}
              style={{ color: entry.color }}
              className="flex items-center justify-between"
            >
              <span className="flex items-center">
                <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                ></span>
                {labelMap[entry.dataKey] || entry.dataKey}:
              </span>
              <span className="font-semibold ml-4">
                {typeof entry.value === "number"
                  ? entry.value.toFixed(1)
                  : entry.value}
                %
              </span>
            </p>
          ))}
      </div>
    );
  }
  return null;
};

// --- COMPONENTE PRINCIPAL ---
export const OccupationRateChart: React.FC<OccupationRateChartProps> = ({
  data,
  summary,
  title = "Análise da Taxa de Ocupação",
  hospitalId,
  redeId,
  showViewSelector = true, // Por padrão, mostra os botões
  aggregationType, // 🆕 Tipo de agregação (hospital, grupo, região, rede)
  entityId, // 🆕 ID da entidade (opcional)
}) => {
  const [view, setView] = useState<"setorial" | "global">("setorial");
  const { data: analysis, loading: analysisLoading } = useOccupationAnalysis({
    hospitalId,
    redeId,
  });

  // Mapeia a análise oficial para o shape usado pelo gráfico
  const mappedSetorial: OccupationData[] | null = analysis
    ? analysis.sectors.map((s) => ({
        name: s.sectorName,
        "Taxa de Ocupação": s.taxaOcupacaoHoje,
        "Taxa de Ocupação Diária": s.taxaOcupacaoDia,
        "Ocupação Máxima Atendível": s.ocupacaoMaximaAtendivel,
        "Capacidade Produtiva": s.capacidadeProdutiva,
        Ociosidade: s.ociosidade,
        Superlotação: s.superlotacao,
      }))
    : null;

  const mappedSummary: OccupationData | null = analysis
    ? {
        name: analysis.summary.sectorName || "Global",
        "Taxa de Ocupação": analysis.summary.taxaOcupacaoHoje,
        "Taxa de Ocupação Diária": analysis.summary.taxaOcupacaoDia,
        "Ocupação Máxima Atendível": analysis.summary.ocupacaoMaximaAtendivel,
        "Capacidade Produtiva": analysis.summary.capacidadeProdutiva,
        Ociosidade: analysis.summary.ociosidade,
        Superlotação: analysis.summary.superlotacao,
      }
    : null;

  const chartData = analysis
    ? view === "setorial"
      ? mappedSetorial || []
      : mappedSummary
      ? [mappedSummary]
      : []
    : view === "setorial"
    ? data
    : [summary];

  const tableSummary: OccupationData | null = analysis
    ? mappedSummary
    : summary;

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Comparação entre ocupação atual, capacidade máxima atendível e
            indicadores de eficiência.
          </CardDescription>
        </div>
        {showViewSelector && (
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              size="sm"
              variant={view === "setorial" ? "secondary" : "ghost"}
              onClick={() => setView("setorial")}
            >
              <LayoutGrid className="mr-2 h-4 w-4" /> Setorial
            </Button>
            <Button
              size="sm"
              variant={view === "global" ? "secondary" : "ghost"}
              onClick={() => setView("global")}
            >
              <Globe className="mr-2 h-4 w-4" /> Global
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Card de Taxa de Ocupação Diária - Aparece apenas na visão Global */}
        {view === "global" && (
          <div className="bg-muted/50 border rounded-lg p-4">
            {analysisLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-10 w-32" />
              </div>
            ) : mappedSummary ? (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Taxa de Ocupação Diária Média
                  </h3>
                  <p className="text-4xl font-bold text-primary">
                    {mappedSummary["Taxa de Ocupação Diária"]?.toFixed(2)}%
                  </p>
                </div>
              </div>
            ) : summary["Taxa de Ocupação Diária"] !== undefined ? (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Taxa de Ocupação Diária
                  </h3>
                  <p className="text-4xl font-bold text-primary">
                    {summary["Taxa de Ocupação Diária"].toFixed(2)}%
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis dataKey="name" tick={axisTick} />
              <YAxis
                domain={[0, "dataMax + 10"]}
                allowDataOverflow
                tickFormatter={(v) => `${v}%`}
                tick={axisTick}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                verticalAlign="top"
                wrapperStyle={{ fontSize: 12, paddingBottom: "20px" }}
              />

              {/* PRIMEIRA BARRA: Taxa de Ocupação (base) */}
              <Bar
                dataKey="Taxa de Ocupação"
                fill={barConfig[0].color}
                barSize={view === "global" ? 80 : 40}
                stackId="barra1"
                name={barConfig[0].label}
              />

              {/* PRIMEIRA BARRA: Excedente de capacidade (topo, verde) */}
              <Bar
                dataKey="Ociosidade"
                fill={barConfig[2].color}
                barSize={view === "global" ? 80 : 40}
                stackId="barra1"
                radius={[4, 4, 0, 0]}
                name={barConfig[2].label}
              />

              {/* SEGUNDA BARRA: Cobertura de Equipe (base) */}
              <Bar
                dataKey="Ocupação Máxima Atendível"
                fill={barConfig[1].color}
                barSize={view === "global" ? 80 : 40}
                stackId="barra2"
                name={barConfig[1].label}
              />

              {/* SEGUNDA BARRA: Deficit de equipe (topo, vermelho) */}
              <Bar
                dataKey="Superlotação"
                fill={barConfig[3].color}
                barSize={view === "global" ? 80 : 40}
                stackId="barra2"
                radius={[4, 4, 0, 0]}
                name={barConfig[3].label}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                {barConfig.map((bar) => (
                  <TableHead key={bar.key} className="text-center text-xs">
                    {bar.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Taxa de ocupação atual baseada nos leitos ocupados"
                >
                  {typeof tableSummary?.["Taxa de Ocupação"] === "number"
                    ? tableSummary["Taxa de Ocupação"].toFixed(1)
                    : "N/A"}
                  %
                </TableCell>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Capacidade máxima que pode ser atendida com o quadro atual de pessoal"
                >
                  {typeof tableSummary?.["Ocupação Máxima Atendível"] ===
                  "number"
                    ? tableSummary["Ocupação Máxima Atendível"].toFixed(1)
                    : "N/A"}
                  %
                </TableCell>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Percentual de capacidade ociosa (excedente de capacidade disponível)"
                >
                  {typeof tableSummary?.["Ociosidade"] === "number"
                    ? tableSummary["Ociosidade"].toFixed(1)
                    : "N/A"}
                  %
                </TableCell>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Percentual de sobrecarga acima da capacidade máxima atendível (deficit de equipe)"
                >
                  {typeof tableSummary?.["Superlotação"] === "number"
                    ? tableSummary["Superlotação"].toFixed(1)
                    : "N/A"}
                  %
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
