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
  "#003151",
  "#0b6f88",
  "#6497b1",
  "#a8dadc",
  "#457b9d",
  "#1d3557",
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
}> = ({ data, title, description, labelType = "percent", totalForPercent }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
        <h4 className="font-bold text-lg mb-2">{title}</h4>
        <p>Sem dados para exibir.</p>
      </div>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
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
              cy="45%"
              outerRadius={100}
              innerRadius={60}
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
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
