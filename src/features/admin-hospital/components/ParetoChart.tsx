import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ParetoData {
  nome: string;
  custo: number;
  acumulado: number;
  acumuladoPercent: number;
}

interface ParetoChartProps {
  data: ParetoData[];
  total: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    return (
      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-foreground mb-2">{label}</p>
        <p className="text-muted-foreground">
          Custo: <span className="font-semibold">{formatCurrency(payload[0].value)}</span>
        </p>
        <p className="text-muted-foreground">
          Acumulado (%): <span className="font-semibold">{`${payload[1].value.toFixed(1)}%`}</span>
        </p>
      </div>
    );
  }
  return null;
};


const ParetoChart: React.FC<ParetoChartProps> = ({ data, total }) => {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return `R$ ${value}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Pareto de Custos por Setor</CardTitle>
        <CardDescription>Distribuição de custos e seu impacto acumulado no total de R$ {total.toLocaleString('pt-BR')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <XAxis dataKey="nome" angle={-45} textAnchor="end" interval={0} height={100} style={{ fontSize: '12px' }}/>
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tickFormatter={formatCurrency} style={{ fontSize: '12px' }}/>
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} style={{ fontSize: '12px' }}/>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}}/>
            <Bar yAxisId="left" dataKey="custo" fill="#8884d8" name="Custo por Setor" />
            <Line yAxisId="right" type="monotone" dataKey="acumuladoPercent" stroke="#ff7300" strokeWidth={2} name="% Acumulada" dot={{ r: 4 }}/>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ParetoChart;