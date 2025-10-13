import React, { useState } from "react";
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
import GraficoOcupacao from "./graphicsComponents/GraficoOcupacao";

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
}

const axisTick = {
  fontSize: 12,
  fill: "hsl(var(--muted-foreground))",
} as const;

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
              "Capacidade Produtiva",
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
                {entry.dataKey}:
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

// Paleta Monocromática de Azul
const barConfig = [
  {
    key: "Taxa de Ocupação",
    color: "hsl(206, 100%, 16%)",
    label: "Taxa Atual",
  }, // Azul escuro
  {
    key: "Ocupação Máxima Atendível",
    color: "hsl(206, 100%, 36%)",
    label: "Capacidade Máxima",
  }, // Azul médio 🆕
  {
    key: "Capacidade Produtiva",
    color: "hsl(206, 100%, 56%)",
    label: "Capacidade Produtiva",
  }, // Azul claro
  { key: "Ociosidade", color: "hsl(206, 100%, 76%)", label: "Ociosidade" }, // Azul muito claro
  { key: "Superlotação", color: "hsl(206, 100%, 86%)", label: "Superlotação" }, // Azul clarinho
];

// --- COMPONENTE PRINCIPAL ---
export const OccupationRateChart: React.FC<OccupationRateChartProps> = ({
  data,
  summary,
  title = "Análise da Taxa de Ocupação",
}) => {
  const [view, setView] = useState<"setorial" | "global">("setorial");
  const chartData = view === "setorial" ? data : [summary];

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
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Card de Taxa de Ocupação Diária - Aparece apenas na visão Global */}
        {view === "global" &&
          summary["Taxa de Ocupação Diária"] !== undefined && (
            <div className="bg-muted/50 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Taxa de Ocupação Diária (Média das últimas 24h)
                  </h3>
                  <p className="text-4xl font-bold text-primary">
                    {summary["Taxa de Ocupação Diária"].toFixed(1)}%
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold">Taxa Atual:</span>{" "}
                    {summary["Taxa de Ocupação"].toFixed(1)}%
                  </div>
                </div>
              </div>
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

              {/* Taxa de Ocupação Atual - Azul */}
              <Bar
                dataKey="Taxa de Ocupação"
                fill={barConfig[0].color}
                barSize={view === "global" ? 80 : 40}
                radius={[4, 4, 0, 0]}
                name="Taxa Atual"
              />

              {/* Ocupação Máxima Atendível - Roxo (NOVO) */}
              <Bar
                dataKey="Ocupação Máxima Atendível"
                fill={barConfig[1].color}
                barSize={view === "global" ? 80 : 40}
                radius={[4, 4, 0, 0]}
                name="Capacidade Máxima"
              />

              {/* Capacidade Produtiva (100%) - Verde */}
              <Bar
                dataKey="Capacidade Produtiva"
                fill={barConfig[2].color}
                barSize={view === "global" ? 80 : 40}
                radius={[4, 4, 0, 0]}
                name="Capacidade Produtiva"
                opacity={0.3}
              />

              {/* Superlotação - Vermelho */}
              <Bar
                dataKey="Superlotação"
                fill={barConfig[4].color}
                barSize={view === "global" ? 80 : 40}
                stackId="alert"
                radius={[4, 4, 0, 0]}
                name="Superlotação"
              />

              {/* Ociosidade - Amarelo */}
              <Bar
                dataKey="Ociosidade"
                fill={barConfig[3].color}
                barSize={view === "global" ? 80 : 40}
                stackId="alert"
                radius={[4, 4, 0, 0]}
                name="Ociosidade"
              />
            </ComposedChart>
          </ResponsiveContainer>
          {/* <GraficoOcupacao /> */}
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
                  {summary["Taxa de Ocupação"].toFixed(1)}%
                </TableCell>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Capacidade máxima que pode ser atendida com o quadro atual de pessoal"
                >
                  {summary["Ocupação Máxima Atendível"]
                    ? summary["Ocupação Máxima Atendível"].toFixed(1)
                    : "N/A"}
                  %
                </TableCell>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Capacidade produtiva padrão (100%)"
                >
                  {summary["Capacidade Produtiva"].toFixed(0)}%
                </TableCell>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Percentual de capacidade não utilizada"
                >
                  {summary["Ociosidade"].toFixed(1)}%
                </TableCell>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Percentual de sobrecarga acima da capacidade máxima atendível"
                >
                  {summary["Superlotação"].toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
