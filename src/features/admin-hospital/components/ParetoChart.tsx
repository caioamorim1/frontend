import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
    
    // Procura os dados corretos no payload
    const custo = payload.find(p => p.dataKey === 'custo')?.value ?? 0;
    const acumuladoPercent = payload.find(p => p.dataKey === 'acumuladoPercent')?.value ?? 0;

    return (
      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-foreground mb-2">{label}</p>
        <p className="text-muted-foreground">
          Custo: <span className="font-semibold">{formatCurrency(custo)}</span>
        </p>
        <p className="text-muted-foreground">
          Acumulado (%): <span className="font-semibold">{`${acumuladoPercent.toFixed(1)}%`}</span>
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
        <CardTitle>Análise de Pareto - Custos por Setor</CardTitle>
        <CardDescription>Distribuição de custos e seu impacto acumulado no total de {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <XAxis dataKey="nome" angle={-45} textAnchor="end" interval={0} height={100} style={{ fontSize: '12px' }} />
            
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tickFormatter={formatCurrency} style={{ fontSize: '12px' }} />
            
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#ff7300" 
              domain={[0, 100]} 
              ticks={[0, 20, 40, 60, 80, 100]}
              tickFormatter={(tick) => `${tick}%`} 
              style={{ fontSize: '12px' }} 
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
            <Bar yAxisId="left" dataKey="custo" fill="#8884d8" name="Custo por Setor" />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="acumuladoPercent" 
              stroke="#ff7300" 
              strokeWidth={2} 
              name="% Acumulada" 
              dot={{ r: 4 }} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default ParetoChart;