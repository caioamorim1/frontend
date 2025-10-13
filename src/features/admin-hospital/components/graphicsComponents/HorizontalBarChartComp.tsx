import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChartData {
    [key: string]: string | number | undefined;
    name: string;
    value: number;
    color?: string;
}

const COLORS = ['#003151', '#0b6f88', '#6497b1', '#a8dadc', '#457b9d', '#1d3557'];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                <p className="font-bold text-foreground mb-1">{data.name}</p>
                <p className="text-muted-foreground">
                    Colaboradores: <span className="font-semibold">{data.value}</span>
                </p>
            </div>
        );
    }
    return null;
};

export const HorizontalBarChartComp: React.FC<{ 
    data: ChartData[], 
    title?: string, 
    description?: string 
}> = ({ data, title, description }) => {
    if (!data || data.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                        <p className="text-sm">Sem dados para exibir.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Calcula altura dinâmica baseada no número de itens, com mínimo e máximo
    const chartHeight = Math.min(Math.max(250, data.length * 45), 400);

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={chartHeight}>
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="hsl(var(--border))" 
                            horizontal={true}
                            vertical={false}
                        />
                        <XAxis 
                            type="number" 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                            tickLine={false}
                        />
                        <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={120}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Bar 
                            dataKey="value" 
                            radius={[0, 6, 6, 0]}
                            maxBarSize={32}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};
