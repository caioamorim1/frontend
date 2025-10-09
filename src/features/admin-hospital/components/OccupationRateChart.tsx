import React, { useState } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { LayoutGrid, Globe } from 'lucide-react';
import GraficoOcupacao from './graphicsComponents/GraficoOcupacao';

// --- ESTRUTURA DE DADOS ---
export interface OccupationData {
  name: string;
  'Taxa de Ocupação': number;
  'Ociosidade': number;
  'Superlotação': number;
  'Capacidade Produtiva': number;
}

interface OccupationRateChartProps {
  data: OccupationData[];
  summary: OccupationData;
  title?: string;
}

const axisTick = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' } as const;

// --- COMPONENTES AUXILIARES ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm space-y-1">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {payload.filter(p => ['Taxa de Ocupação', 'Capacidade Produtiva', 'Ociosidade', 'Superlotação'].includes(p.dataKey)).map((entry: any) => (
          <p key={entry.dataKey} style={{ color: entry.color }} className="flex items-center">
            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
            {entry.dataKey}: <span className="font-semibold ml-auto pl-2">{entry.value}%</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Paleta Monocromática de Azul
const barConfig = [
  { key: 'Taxa de Ocupação', color: 'hsl(206, 100%, 16%)' },      // --primary
  { key: 'Cobertura da Equipe', color: 'hsl(193, 85%, 29%)' }, // --secondary
  { key: '⁠Excedente remanejável', color: 'hsl(206, 100%, 36%)' },        // Tom mais claro de azul
  { key: 'Déficit de Equipe', color: 'hsl(206, 100%, 66%)' }         // Tom mais claro ainda
];

// --- COMPONENTE PRINCIPAL ---
export const OccupationRateChart: React.FC<OccupationRateChartProps> = ({
  data,
  summary,
  title = 'Análise da Taxa de Ocupação'
}) => {
  const [view, setView] = useState<'setorial' | 'global'>('setorial');
  const chartData = view === 'setorial' ? data : [summary];

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Análise comparativa de ocupação, excedente remanejável e déficit de equipe.</CardDescription>
        </div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          <Button size="sm" variant={view === 'setorial' ? 'secondary' : 'ghost'} onClick={() => setView('setorial')}>
            <LayoutGrid className="mr-2 h-4 w-4" /> Setorial
          </Button>
          <Button size="sm" variant={view === 'global' ? 'secondary' : 'ghost'} onClick={() => setView('global')}>
            <Globe className="mr-2 h-4 w-4" /> Global
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={axisTick} />
              <YAxis domain={[0, 'dataMax + 10']} allowDataOverflow tickFormatter={(v) => `${v}%`} tick={axisTick} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: '20px' }} />

              <Bar dataKey="Capacidade Produtiva" fill={barConfig[1].color} barSize={view === 'global' ? 60 : 35} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Taxa de Ocupação" fill={barConfig[0].color} barSize={view === 'global' ? 60 : 35} stackId="ocupacao" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Superlotação" fill={barConfig[3].color} barSize={view === 'global' ? 60 : 35} stackId="ocupacao" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Ociosidade" fill={barConfig[2].color} barSize={view === 'global' ? 60 : 35} stackId="ociosidade" radius={[4, 4, 0, 0]} />

            </ComposedChart>
          </ResponsiveContainer>
          {/* <GraficoOcupacao /> */}
        </div>

        <div className="pt-4">
          <h3 className="text-sm font-semibold text-center mb-2">Resumo Geral (Média)</h3>
          <Table>
            <TableHeader>
              <TableRow>
                {barConfig.map(bar => <TableHead key={bar.key} className="text-center">{bar.key}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-center font-bold text-2xl" style={{ color: barConfig[0].color }}>
                  {summary['Taxa de Ocupação']}%
                </TableCell>
                <TableCell className="text-center font-bold text-2xl" style={{ color: barConfig[1].color }}>
                  {summary['Capacidade Produtiva']}%
                </TableCell>
                <TableCell className="text-center font-bold text-2xl" style={{ color: barConfig[2].color }}>
                  {summary['Ociosidade']}%
                </TableCell>
                <TableCell className="text-center font-bold text-2xl" style={{ color: barConfig[3].color }}>
                  {summary['Superlotação']}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
