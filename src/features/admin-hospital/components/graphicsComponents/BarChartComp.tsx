import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Line, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface BargraphicData {
    [key: string]: string | number | undefined;
    name: string;
    value: number;
    color?: string;
}

interface BargraphicChartProps {
    data: BargraphicData[];
    title: string;
    description?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        const custo = payload[0]?.value ?? 0;
        return (
            <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                <p className="font-bold text-foreground mb-2">{label}</p>
                <p className="text-muted-foreground">
                    Valor: <span className="font-semibold">{formatCurrency(custo)}</span>
                </p>
            </div>
        );
    }
    return null;
};


const BargraphicChart: React.FC<BargraphicChartProps> = ({ data, title, description }) => {
    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
        return `R$ ${value}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={100} style={{ fontSize: '12px' }} />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" tickFormatter={formatCurrency} style={{ fontSize: '12px' }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar yAxisId="left" dataKey="value">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                            ))}
                        </Bar>

                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default BargraphicChart;