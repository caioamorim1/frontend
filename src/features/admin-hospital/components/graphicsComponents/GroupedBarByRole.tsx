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
  LabelList,
  Label,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface RoleData {
  role: string;
  start: number;
  end: number;
  color: string;
}

interface Props {
  data: RoleData[];
  title: string;
  description?: string;
  unit: "currency" | "people";
}

export const GroupedBarByRole: React.FC<Props> = ({
  data,
  title,
  description,
  unit,
}) => {
  const formatValue = (v: number) =>
    unit === "currency"
      ? v.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 0,
        })
      : v.toString();

  const processed = data.map((d) => ({
    ...d,
    range: [d.start, d.end],
    diff: d.end - d.start,
  }));

  const finalValue = processed.find((d) => d.role === "Projetado")?.end ?? 0;
  const atualValue = processed.find((d) => d.role === "Atual")?.end ?? 0;
  const diffTotal = finalValue - atualValue;
  const diffPercent = atualValue > 0 ? (diffTotal / atualValue) * 100 : 0;

  const isCurrency = unit === "currency";

  // Calculate dynamic Y domain
  const allValues = processed.flatMap((d) => d.range);
  const maxValue = Math.max(...allValues, 0);
  const minValue = Math.min(...allValues, 0);

  // Add 10% padding to the domain
  const effectiveMax = maxValue < 1 ? 10 : maxValue * 1.1;
  const effectiveMin = minValue < 0 ? minValue * 1.1 : 0;

  const yDomain: [number, number] = [effectiveMin, effectiveMax];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={processed}
            margin={{ top: 40, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="role" />
            <YAxis
              domain={yDomain}
              tickFormatter={(v) =>
                isCurrency
                  ? `R$ ${Math.round(v / 1000)}k`
                  : Math.round(v).toString()
              }
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />

            {/* Gráfico principal */}
            <Bar dataKey="range">
              {processed.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

const CustomTooltip = ({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: any[];
  unit: "currency" | "people";
}) => {
  if (!active || !payload || payload.length === 0) return null;

  const entry = payload[0]?.payload;

  const isFixed =
    entry.role === "Atual" ||
    entry.role === "Projetado" ||
    entry.role === "Baseline";

  const value = isFixed ? entry.end : entry.end - entry.start;

  const isPositive = value > 0;
  const isNegative = value < 0;

  const arrow = isPositive ? "▲" : isNegative ? "▼" : "";
  const arrowColor = isPositive
    ? "text-red-600"
    : isNegative
      ? "text-green-600"
      : "";

  const format = (v: number) =>
    unit === "currency"
      ? v.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 0,
        })
      : v.toLocaleString("pt-BR");

  return (
    <div className="bg-background border p-2 rounded shadow text-sm">
      <p className="font-bold">{entry.role}</p>
      <p className={`font-semibold  ${isFixed ? "" : arrowColor}`}>
        {isFixed
          ? format(Math.abs(value))
          : `${arrow} ${format(Math.abs(value))}`}
      </p>
    </div>
  );
};
