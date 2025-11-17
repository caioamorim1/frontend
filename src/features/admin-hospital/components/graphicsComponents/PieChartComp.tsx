import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface ChartData {
  [key: string]: string | number | undefined;
  name: string;
  value: number;
  color?: string;
}

// --- PALETA DE CORES CUSTOMIZADA ---
const COLORS = [
  "#003151", // Azul escuro
  "#0b6f88", // Azul médio
  "#6497b1", // Azul claro
  "#a8dadc", // Azul muito claro
  "#457b9d", // Azul acinzentado
  "#1d3557", // Azul petróleo
];

// --- PALETA PARA NÍVEIS DE CUIDADO (cores mais distintas) ---
const CARE_LEVEL_COLORS = [
  "#004d73", // Azul escuro forte
  "#0088cc", // Azul médio vibrante
  "#33adff", // Azul claro
  "#66c2ff", // Azul muito claro
  "#005f8f", // Azul petróleo
  "#0073a8", // Azul intermediário
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-foreground mb-1">{data.name}</p>
        <p className="text-muted-foreground">
          Valor: <span className="font-semibold">{data.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export const PieChartComp: React.FC<{
  data: ChartData[];
  title?: string;
  description?: string;
  labelType?: "percent" | "value";
  totalForPercent?: number;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
  color?: string; // Monochromatic color for all slices
}> = ({
  data,
  title,
  description,
  labelType = "percent",
  totalForPercent,
  height = 260,
  innerRadius = 50,
  outerRadius = 80,
  className,
  color, // Removido valor padrão para permitir usar paleta
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
        <h4 className="font-bold text-lg mb-2">{title}</h4>
        <p>Sem dados para exibir.</p>
      </div>
    );
  }
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-primary mb-4 text-center">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: "12px", paddingTop: "40px" }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              dataKey="value"
              nameKey="name"
              labelLine={false}
              // 3. A lógica do rótulo agora depende do estado 'labelType'
              label={(payload) => {
                const radius =
                  payload.innerRadius +
                  (payload.outerRadius - payload.innerRadius) * 1.4;
                const x =
                  payload.cx +
                  radius * Math.cos((-payload.midAngle * Math.PI) / 180);
                const y =
                  payload.cy +
                  radius * Math.sin((-payload.midAngle * Math.PI) / 180);

                // Escolhe o texto a ser exibido com base no estado
                let textToShow: any;
                if (labelType === "percent") {
                  if (
                    typeof totalForPercent === "number" &&
                    totalForPercent > 0
                  ) {
                    // Calcular percentual em relação ao total fornecido (ex: total de leitos)
                    const percent = (payload.value / totalForPercent) * 100;
                    textToShow = `${percent.toFixed(0)}%`;
                  } else {
                    // Fallback para o percent calculado pelo recharts
                    textToShow = `${(payload.percent * 100).toFixed(0)}%`;
                  }
                } else {
                  textToShow = payload.value;
                }

                return (
                  <text
                    x={x}
                    y={y}
                    fill="hsl(var(--foreground))"
                    textAnchor={x > payload.cx ? "start" : "end"}
                    dominantBaseline="central"
                    fontSize={12}
                  >
                    {textToShow}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={
                    color
                      ? color
                      : CARE_LEVEL_COLORS[index % CARE_LEVEL_COLORS.length]
                  }
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
