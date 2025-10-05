import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartData {
  name: string;
  [key: string]: string | number;
}

interface GroupedBarChartProps {
  data: ChartData[];
  title?: string;
  bars: { key: string; color: string }[];
  xAxisKey: string;
}

const axisTick = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' } as const;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const GroupedBarChart: React.FC<GroupedBarChartProps> = ({ data, title, bars, xAxisKey }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 8, right: 20, left: 8, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={xAxisKey} tick={axisTick} />
            <YAxis yAxisId="left" orientation="left" tick={axisTick} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" wrapperStyle={{ fontSize: 12 }} />
            {bars.map(bar => (
                 <Bar key={bar.key} yAxisId="left" dataKey={bar.key} fill={bar.color} radius={[4,4,0,0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};