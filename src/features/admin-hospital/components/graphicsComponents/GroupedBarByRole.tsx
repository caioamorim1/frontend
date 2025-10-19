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
              tickFormatter={(v) =>
                isCurrency ? `R$ ${Math.round(v / 1000)}k` : v.toString()
              }
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />

            {/* Linhas de ligação entre barras */}
            {processed.map((entry, i) => {
              if (i > 0) {
                const prev = processed[i - 1];
                return (
                  <ReferenceLine
                    key={`line-${i}`}
                    y={prev.range[1]}
                    segment={[
                      { x: prev.role, y: prev.range[1] },
                      { x: entry.role, y: entry.range[0] },
                    ]}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="2 2"
                  />
                );
              }
              return null;
            })}

            {/* Rótulo superior da variação total */}
            <ReferenceLine
              y={Math.max(finalValue, atualValue) + Math.abs(diffTotal) * 0.1}
              stroke="transparent"
              label={{
                value: `${diffTotal > 0 ? "+" : ""}${formatValue(
                  diffTotal
                )} / ${diffPercent.toFixed(1)}%`,
                position: "top",
                fontSize: 14,
                fill: "#333",
              }}
            />

            {/* Gráfico principal */}
            <Bar dataKey="range">
              {processed.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
              <LabelList
                dataKey="diff"
                content={({ x, y, width, value, index }) => {
                  const role = processed[index].role;
                  const isFixedBar =
                    role === "Atual" ||
                    role === "Projetado" ||
                    role === "Baseline";

                  const diff = Number(value);
                  const end = Number(processed[index].end);

                  const formatSigned = (n: number) => {
                    const sign = n > 0 ? "+" : n < 0 ? "" : "";
                    const abs = Math.abs(n);
                    return `${sign}${formatValue(abs)}`;
                  };

                  const display = isFixedBar
                    ? formatValue(end)
                    : formatSigned(diff);

                  return (
                    <text
                      x={Number(x ?? 0) + Number(width ?? 0) / 2}
                      y={Number(y ?? 0) - 5}
                      textAnchor="middle"
                      fill="#333"
                      fontSize={12}
                      fontWeight="bold"
                    >
                      {display}
                    </text>
                  );
                }}
              />
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
