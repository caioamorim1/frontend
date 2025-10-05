import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  name: string;
  'Horas Extras Reais': number;
  'Horas Extras Projetadas': number;
}

interface HorasExtraChartProps {
  data: ChartData[];
  title?: string;
}

const axisTick = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' } as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const reais = payload.find((p: any) => p.dataKey === 'Horas Extras Reais')?.value ?? 0;
    const proj = payload.find((p: any) => p.dataKey === 'Horas Extras Projetadas')?.value ?? 0;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-bold mb-1">{label}</p>
        <p className="text-muted-foreground">Reais: <span className="font-semibold">{reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
        <p className="text-muted-foreground">Projetadas: <span className="font-semibold">{proj.toLocaleString('pt-BR')} h</span></p>
      </div>
    );
  }
  return null;
};

export const HorasExtraChart: React.FC<HorasExtraChartProps> = ({ data, title = 'Análise de Horas Extras por Unidade' }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 8, right: 20, left: 8, bottom: 56 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} tick={axisTick} />
            <YAxis yAxisId="left" orientation="left" tick={axisTick} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" tick={axisTick} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="left" dataKey="Horas Extras Reais" name="Reais (R$)" fill="hsl(var(--primary))" radius={[6,6,0,0]} />
            <Bar yAxisId="right" dataKey="Horas Extras Projetadas" name="Projetadas (h)" fill="hsl(var(--warning))" radius={[6,6,0,0]} opacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
