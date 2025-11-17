// src/features/admin-hospital/components/graphicsComponents/ReusableWaterfall.tsx

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
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export interface WaterfallDataItem {
  name: string;
  value: number;
}

const axisTick = {
  fontSize: 12,
  fill: "hsl(var(--muted-foreground))",
} as const;

const processWaterfallData = (data: WaterfallDataItem[]) => {
  let cumulative = 0;
  return data.map((item, index) => {
    const isBaseline = item.name.toUpperCase().includes("BASELINE");
    const isProjetado = item.name.includes("Projetado");
    const isAtual = item.name.includes("Atual");
    const isStart = index === 0;
    const isEnd = index === data.length - 1;
    const isTotal =
      item.name.includes("Atual") ||
      item.name.includes("Projetado") ||
      isBaseline;
    const isTransition = !isTotal;
    let color = "hsl(var(--primary))"; // Cor padrão (azul escuro)
    let range: [number, number];

    if (isTotal) {
      // BASELINE, Atual, ou Projetado - barras completas do zero
      range = [0, item.value];
      if (!isBaseline) {
        cumulative = item.value;
      }
    } else {
      // Variação - barra flutuante
      const startValue = cumulative;
      cumulative += item.value;
      range = [startValue, cumulative];
      // Verde para redução (negativo), Vermelho para aumento (positivo)
      color = item.value < 0 ? "#16a34a" : "#dc2626";
    }

    // Cores especiais para baseline, atual e projetado
    if (isBaseline) {
      color = "#89A7D6"; // Azul claro para baseline
      cumulative = item.value;
    } else if (isAtual) {
      color = "#60a5fa"; // Azul claro para atual (tempo real)
    } else if (isProjetado) {
      color = "#003151"; // Azul escuro para projetado
    }

    return { name: item.name, value: item.value, range: range, color: color };
  });
};

const CustomTooltip = ({ active, payload, label, isCurrency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isTotal =
      data.name.includes("Atual") ||
      data.name.includes("Projetado") ||
      data.name.toUpperCase().includes("BASELINE");
    const displayValue = isCurrency
      ? data.value.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 0,
        })
      : data.value.toLocaleString("pt-BR");

    return (
      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-foreground mb-1">{label}</p>
        <p className="text-muted-foreground">
          {isTotal ? "Valor: " : "Variação: "}
          <span className="font-semibold">{displayValue}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface ReusableWaterfallProps {
  data: WaterfallDataItem[];
  unit: "currency" | "people";
  title: string;
  description: string;
}

export const ReusableWaterfall: React.FC<ReusableWaterfallProps> = ({
  data,
  unit,
  title,
  description,
}) => {
  const chartData = processWaterfallData(data);

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            Nenhum dado disponível para análise.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate yDomain with better handling of edge cases
  const maxValue = Math.max(...chartData.map((d) => Math.max(...d.range, 0)));
  const minValue = Math.min(...chartData.map((d) => Math.min(...d.range, 0)));

  // If all values are zero or very close to zero, set a minimum domain
  const effectiveMax = maxValue < 1 ? 10 : maxValue * 1.1;
  const effectiveMin = minValue < 0 ? minValue * 1.1 : 0;

  const yDomain = [effectiveMin, effectiveMax];

  const formatYAxisTick = (value: number) => {
    if (unit === "currency") {
      return value >= 1000 ? `R$ ${(value / 1000).toFixed(0)}k` : `R$ ${value}`;
    }
    return value.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={axisTick} interval={0} />
            <YAxis
              domain={yDomain}
              tick={axisTick}
              tickFormatter={formatYAxisTick}
            />
            <Tooltip
              content={<CustomTooltip isCurrency={unit === "currency"} />}
            />
            <Bar dataKey="range">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
            {chartData.map((entry, index) => {
              if (index > 0 && index < chartData.length - 1) {
                const prevEntry = chartData[index - 1];
                return (
                  <ReferenceLine
                    key={`line-${index}`}
                    y={prevEntry.range[1]}
                    segment={[
                      { x: prevEntry.name, y: prevEntry.range[1] },
                      { x: entry.name, y: entry.range[0] },
                    ]}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="2 2"
                  />
                );
              }
              return null;
            })}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
