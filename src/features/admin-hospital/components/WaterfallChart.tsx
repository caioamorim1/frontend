import React, { useState, useMemo } from "react";
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
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, Users, Building, ChevronsRight } from "lucide-react";

// --- ESTRUTURA DE DADOS APROFUNDADA ---
export interface WaterfallDataItem {
  name: string;
  value: number;
}

export interface SectorAnalysis {
  custo: WaterfallDataItem[];
  quantitativo: WaterfallDataItem[];
}

export interface DetailedWaterfallData {
  [sectorName: string]: SectorAnalysis;
}

interface WaterfallChartProps {
  title: string;
  // Dados da Aba Global
  globalData: WaterfallDataItem[];
  globalVsInternacaoData: WaterfallDataItem[];
  globalVsNaoInternacaoData: WaterfallDataItem[];
  // Dados das Abas de Detalhe
  internacaoData: DetailedWaterfallData;
  naoInternacaoData: DetailedWaterfallData;
}

const axisTick = {
  fontSize: 12,
  fill: "hsl(var(--muted-foreground))",
} as const;

// --- LÓGICA DE PROCESSAMENTO (COM NOVAS CORES) ---
const processWaterfallData = (data: WaterfallDataItem[]) => {
  let cumulative = 0;
  return data.map((item, index) => {
    const isStart = index === 0;
    const isEnd = index === data.length - 1;
    const isTransition = !isStart && !isEnd;
    let color = "#003151";
    let range: [number, number];
    if (isStart) {
      range = [0, item.value];
      cumulative = item.value;
    } else if (isTransition) {
      const startValue = cumulative;
      cumulative += item.value;
      range = [startValue, cumulative];
      color = item.value < 0 ? "hsl(var(--destructive))" : "#0b6f88";
    } else {
      range = [0, item.value];
      color = "#003151";
    }
    return { name: item.name, value: item.value, range: range, color: color };
  });
};

// --- COMPONENTES AUXILIARES ---
const CustomTooltip = ({ active, payload, label, isCurrency }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isTotal =
      data.name === payload[0].payload.name[0] ||
      data.name === payload[0].payload.name[payload[0].payload.name.length - 1];
    const displayValue = isCurrency
      ? data.value.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 0,
        })
      : data.value;
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

// Componente para renderizar o valor customizado acima de cada barra
const CustomizedLabel: React.FC<any> = (props) => {
  const { x, y, width, value, unit } = props;

  // Formata o valor para exibição
  const formattedValue =
    unit === "currency" ? `R$ ${(value / 1000).toFixed(1)}k` : value.toString();

  // Renderiza o texto um pouco acima da barra
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill="hsl(var(--foreground))"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={12}
    >
      {formattedValue}
    </text>
  );
};

const ReusableWaterfall: React.FC<{
  data: WaterfallDataItem[];
  unit: "currency" | "people";
  title: string;
}> = ({ data, unit, title }) => {
  const chartData = processWaterfallData(data);
  if (!data || data.length <= 1)
    return (
      <div className="flex items-center justify-center h-[350px] text-muted-foreground">
        Selecione um setor para ver a análise.
      </div>
    );
  const yDomain = [
    0,
    Math.max(...chartData.map((d) => Math.max(...d.range, 0))) * 1.1,
  ];

  return (
    <div className="w-full h-full">
      <h3 className="text-lg font-semibold text-center mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={450}>
        {/* Aumentei a margem do topo para o label não ser cortado */}
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={axisTick}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={90}
          />
          <YAxis
            domain={yDomain}
            tick={axisTick}
            tickFormatter={(v) =>
              unit === "currency"
                ? `R$ ${(v / 1000).toFixed(0)}k`
                : v.toString()
            }
          />
          <Tooltip
            content={<CustomTooltip isCurrency={unit === "currency"} />}
          />
          <Bar dataKey="range">
            {/* 2. Adicionar o LabelList aqui dentro */}
            <LabelList
              dataKey="value" // Usar a chave do dado original que deve ser exibida
              content={<CustomizedLabel unit={unit} />}
            />
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
    </div>
  );
};

const GlobalTabContent: React.FC<{
  global: WaterfallDataItem[];
  vsInternacao: WaterfallDataItem[];
  vsNaoInternacao: WaterfallDataItem[];
}> = ({ global, vsInternacao, vsNaoInternacao }) => {
  const [view, setView] = useState<
    "global" | "vs-internacao" | "vs-nao-internacao"
  >("global");

  const dataMap = {
    global: global,
    "vs-internacao": vsInternacao,
    "vs-nao-internacao": vsNaoInternacao,
  };

  return (
    <div className="space-y-4">
      <div className="max-w-sm">
        <label className="text-sm font-medium text-muted-foreground">
          Tipo de Visualização Global
        </label>
        <Select value={view} onValueChange={(v) => setView(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="global">Global Consolidado</SelectItem>
            <SelectItem value="vs-internacao">
              Global vs Unidades de Internação
            </SelectItem>
            <SelectItem value="vs-nao-internacao">
              Global vs Unidades de Não Internação
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ReusableWaterfall
        data={dataMap[view]}
        unit="currency"
        title="Análise de Custos"
      />
    </div>
  );
};

const DetailTabContent: React.FC<{ detailedData: DetailedWaterfallData }> = ({
  detailedData,
}) => {
  const sectors = useMemo(() => Object.keys(detailedData), [detailedData]);
  const [selectedSector, setSelectedSector] = useState<string>(
    sectors[0] || ""
  );
  const [viewType, setViewType] = useState<"custo" | "quantitativo">("custo");

  const chartDataCusto = detailedData[selectedSector]?.["custo"] || [];
  const chartDataQuantitativo =
    detailedData[selectedSector]?.["quantitativo"] || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Selecione o Setor
          </label>
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um setor..." />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "row", gap: "1.5rem" }}>
        <ReusableWaterfall
          data={chartDataCusto}
          unit={"currency"}
          title="Análise de Custos"
        />
        <ReusableWaterfall
          data={chartDataQuantitativo}
          unit={"people"}
          title="Análise de Pessoal"
        />
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const WaterfallChart: React.FC<WaterfallChartProps> = (props) => {
  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>
          Análise de variação de custos e pessoal entre o cenário atual e o
          projetado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="internacao">Unid. de Internação</TabsTrigger>
            <TabsTrigger value="nao-internacao">
              Unidades de Não Internação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-4">
            <GlobalTabContent
              global={props.globalData}
              vsInternacao={props.globalVsInternacaoData}
              vsNaoInternacao={props.globalVsNaoInternacaoData}
            />
          </TabsContent>
          <TabsContent value="internacao" className="mt-4">
            <DetailTabContent detailedData={props.internacaoData} />
          </TabsContent>
          <TabsContent value="nao-internacao" className="mt-4">
            <DetailTabContent detailedData={props.naoInternacaoData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
