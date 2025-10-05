import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartData } from '../types/hospital';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';

// --- ESTRUTURA DE DADOS APROFUNDADA ---
interface ComparativeData {
    atual: ChartData[];
    projetado: ChartData[];
}

interface MultiViewPieChartProps {
  title: string;
  description: string;
  scpData: ChartData[];
  sitioData: ChartData[];
  pessoalGeralData: ComparativeData;
  setoresTecData: ComparativeData; // O nome correto da prop está aqui
}


// --- PALETA DE CORES CUSTOMIZADA ---
const COLORS = ['#003151', '#0b6f88', '#6497b1', '#a8dadc', '#457b9d', '#1d3557'];

// --- COMPONENTES AUXILIARES ---

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-bold text-foreground mb-1">{data.name}</p>
        <p className="text-muted-foreground">
          Valor: <span className="font-semibold">{data.value}</span>
        </p>
         <p className="text-muted-foreground">
          Percentual: <span className="font-semibold">{`${(data.percent * 100).toFixed(0)}%`}</span>
        </p>
      </div>
    );
  }
  return null;
};

const ReusablePieChart: React.FC<{ data: ChartData[], title?: string }> = ({ data, title }) => {
    if (!data || data.length === 0) {
        return <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground"><h4 className='font-bold text-lg mb-2'>{title}</h4><p>Sem dados para exibir.</p></div>;
    }
    return (
        <ResponsiveContainer width="100%" height={350}>
            <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', paddingTop: '40px' }} />
                <Pie 
                    data={data} cx="50%" cy="45%" outerRadius={100} innerRadius={60} 
                    dataKey="value" nameKey="name" labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
                        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                        return (
                            <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                {`${(percent * 100).toFixed(0)}%`}
                            </text>
                        );
                    }}
                >
                    {data.map((entry, index) => <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                 {/* Título Central Dinâmico */}
                 {title && <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" fontSize="16" fontWeight="bold" fill="hsl(var(--foreground))">{title}</text>}
            </PieChart>
        </ResponsiveContainer>
    );
};

const ComparativePieView: React.FC<{ data: ComparativeData }> = ({ data }) => {
    // --- CORREÇÃO ADICIONADA AQUI ---
    // Esta verificação impede o erro se 'data' ou suas propriedades 'atual'/'projetado' não existirem
    if (!data || !data.atual || !data.projetado) {
        return (
            <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                <p>Dados comparativos indisponíveis.</p>
            </div>
        );
    }

    const [view, setView] = useState<'atual' | 'projetado'>('atual');
    const chartData = view === 'atual' ? data.atual : data.projetado;
    
    return (
         <div className="flex flex-col items-center">
            <div className="flex justify-center gap-2 mb-4">
                <Button size="sm" variant={view === 'atual' ? 'default' : 'outline'} onClick={() => setView('atual')}>Atual</Button>
                <Button size="sm" variant={view === 'projetado' ? 'default' : 'outline'} onClick={() => setView('projetado')}>Projetado</Button>
            </div>
            <ReusablePieChart data={chartData} title={view === 'atual' ? 'Atual' : 'Projetado'}/>
         </div>
    );
};


// --- COMPONENTE PRINCIPAL ---
export const PizzaChart: React.FC<MultiViewPieChartProps> = ({ title, description, scpData, sitioData, pessoalGeralData, setoresTecData }) => {

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scp" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="scp">Avaliações SCP</TabsTrigger>
                <TabsTrigger value="sitio">Sítios (P.A.)</TabsTrigger>
                <TabsTrigger value="pessoal">Cargos (Global)</TabsTrigger>
                <TabsTrigger value="setores">Setores (Téc. Enf.)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scp" className="mt-4">
                <ReusablePieChart data={scpData} />
            </TabsContent>
            
            <TabsContent value="sitio" className="mt-4">
                <ReusablePieChart data={sitioData} />
            </TabsContent>

            <TabsContent value="pessoal" className="mt-4">
                 <ComparativePieView data={pessoalGeralData} />
            </TabsContent>

             <TabsContent value="setores" className="mt-4">
                 <ComparativePieView data={setoresTecData} />
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};