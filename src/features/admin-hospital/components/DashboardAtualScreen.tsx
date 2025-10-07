


import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Users, Building, ChevronsRight, Radar, CircleDollarSign } from 'lucide-react';
import RadarChartComponent from './graphicsComponents/RadarChart';
import { calcularPerformanceParaGrafico } from '@/mocks/filterMocksRadar';
import { fetchDashboardAtualData } from '@/mocks/filterMocksDashAtual';
import { DashboardAnalytics } from '@/mocks/mocksDashAtualDatabase';
import { PieChartComp } from './graphicsComponents/PieChartComp';
import BargraphicChart from './graphicsComponents/BarChartComp';
import { COLORS, generateMultiColorScale } from '@/lib/generateMultiColorScale';
import { formatAmountBRL } from '@/lib/utils';
import { getAllHospitalSectors, HospitalSector } from '@/mocks/functionSectores';
import { SectorInternation } from '@/mocks/internationDatabase';
import { SectorAssistance } from '@/mocks/noInternationDatabase';

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

interface DashboardAtualScreenProps {
    title: string;
}


interface ChartDataItem {
    subject: string;
    atual: number;
    projetado: number;
}


const axisTick = { fontSize: 12, fill: 'hsl(var(--muted-foreground))' } as const;

interface InfoCardProps {
    title: string;
    value: string | number; // Pode ser um número ou uma string
    icon?: React.ReactNode; // Opcional: para passar um ícone como um componente React
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, value, icon }) => {
    return (
        <div className="flex items-center space-x-4 p-4 border rounded-lg shadow-sm bg-white min-w-[200px]">
            {/* Container do Ícone (se existir) */}
            {icon && (
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-600">
                    {icon}
                </div>
            )}

            {/* Título e Valor */}
            <div>
                <h4 className="text-sm font-medium text-gray-500">{title}</h4>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
};


// --- LÓGICA DE PROCESSAMENTO (COM NOVAS CORES) ---
const processWaterfallData = (data: WaterfallDataItem[]) => {
    let cumulative = 0;
    return data.map((item, index) => {
        const isStart = index === 0; const isEnd = index === data.length - 1; const isTransition = !isStart && !isEnd;
        let color = '#003151'; let range: [number, number];
        if (isStart) {
            range = [0, item.value]; cumulative = item.value;
        } else if (isTransition) {
            const startValue = cumulative; cumulative += item.value; range = [startValue, cumulative]; color = item.value < 0 ? 'hsl(var(--destructive))' : '#0b6f88';
        } else { range = [0, item.value]; color = '#003151'; }
        return { name: item.name, value: item.value, range: range, color: color };
    });
};

// --- COMPONENTES AUXILIARES ---
const CustomTooltip = ({ active, payload, label, isCurrency }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isTotal = (data.name === payload[0].payload.name[0] || data.name === payload[0].payload.name[payload[0].payload.name.length - 1]);
        const displayValue = isCurrency ? data.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }) : data.value;
        return (
            <div className="bg-background border p-3 rounded-lg shadow-lg text-sm">
                <p className="font-bold text-foreground mb-1">{label}</p>
                <p className="text-muted-foreground">{isTotal ? 'Valor: ' : 'Variação: '}
                    <span className="font-semibold">{displayValue}</span>
                </p>
            </div>
        );
    }
    return null;
};

const ReusableWaterfall: React.FC<{ data: WaterfallDataItem[], unit: 'currency' | 'people' }> = ({ data, unit }) => {
    const chartData = processWaterfallData(data);
    if (!data || data.length <= 1) return <div className="flex items-center justify-center h-[350px] text-muted-foreground">Selecione um setor para ver a análise.</div>;
    const yDomain = [0, Math.max(...chartData.map(d => Math.max(...d.range, 0))) * 1.1];

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 8, right: 20, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={axisTick} interval={0} angle={-45} textAnchor="end" height={90} />
                <YAxis domain={yDomain} tick={axisTick} tickFormatter={(v) => unit === 'currency' ? `R$ ${(v / 1000).toFixed(0)}k` : v.toString()} />
                <Tooltip content={<CustomTooltip isCurrency={unit === 'currency'} />} />
                <Bar dataKey="range">{chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Bar>
                {chartData.map((entry, index) => {
                    if (index > 0 && index < chartData.length - 1) {
                        const prevEntry = chartData[index - 1];
                        return <ReferenceLine key={`line-${index}`} y={prevEntry.range[1]} segment={[{ x: prevEntry.name, y: prevEntry.range[1] }, { x: entry.name, y: entry.range[0] }]} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
                    }
                    return null;
                })}
            </BarChart>
        </ResponsiveContainer>
    );
};

const GlobalTabContent: React.FC<{ sourceData: HospitalSector, radarData: ChartDataItem[] }> = ({ sourceData, radarData }) => {

    const { internation, assistance } = sourceData;

    const totalStaffInternation = internation.reduce((acc, sector) => acc + sector.staff.reduce((sum, staff) => sum + staff.quantity, 0), 0);
    const amountTotalInternation = internation.reduce((acc, sector) => acc + sector.costAmount, 0);

    const totalStaffAssistance = assistance.reduce((acc, sector) => acc + sector.staff.reduce((sum, staff) => sum + staff.quantity, 0), 0);
    const amountTotalAssistance = assistance.reduce((acc, sector) => acc + sector.costAmount, 0);

    const totalStaff = totalStaffInternation + totalStaffAssistance;
    const amountTotal = amountTotalInternation + amountTotalAssistance;


    const chartDataInternation: ChartData[] = internation
        ? internation
            .map(item => ({
                key: item.id,
                name: item.name,
                value: item.costAmount,
                color: generateMultiColorScale(item.costAmount, 0, Math.max(...internation.map(i => i.costAmount)))
            }))
        : [];

    const chartDataAssistance: ChartData[] = assistance
        ? assistance
            .map(item => ({
                key: item.id,
                name: item.name,
                value: item.costAmount,
                color: generateMultiColorScale(item.costAmount, 0, Math.max(...assistance.map(i => i.costAmount)))
            }))
        : [];

    const chartDataAtual: ChartData[] = [...chartDataInternation, ...chartDataAssistance].sort((a, b) => b.value - a.value);

    return (
        <div className="space-y-12">
            <div className="flex gap-4">
                <InfoCard title="Total de Funcionários" value={totalStaff} icon={<Building size={24} />} />
                <InfoCard title="Custo Total" value={formatAmountBRL(amountTotal)} icon={<CircleDollarSign size={24} />} />
            </div>
            <BargraphicChart data={chartDataAtual} title='Análise de Custo por Setor' />
            <RadarChartComponent data={radarData} title='Análise de Desempenho' description='Comparativo entre o desempenho atual e projetado' />
        </div>
    );
};


const TabContentInternacao: React.FC<{
    sourceData: SectorInternation[],
    radarData: ChartDataItem[]
}> = ({ sourceData, radarData }) => {
    const [selectedSector, setSelectedSector] = useState<string>('all');

    const detailedData = sourceData.filter(sector => selectedSector === 'all' || sector.id === selectedSector);

    const totalMinimumCare = detailedData.reduce((acc, sector) => acc + sector.CareLevel.minimumCare, 0);
    const totalIntermediateCare = detailedData.reduce((acc, sector) => acc + sector.CareLevel.intermediateCare, 0);
    const totalHighDependency = detailedData.reduce((acc, sector) => acc + sector.CareLevel.highDependency, 0);
    const totalSemiIntensive = detailedData.reduce((acc, sector) => acc + sector.CareLevel.semiIntensive, 0);
    const totalIntensive = detailedData.reduce((acc, sector) => acc + sector.CareLevel.intensive, 0);

    const totalBeds = detailedData.reduce((acc, sector) => acc + sector.bedCount, 0);
    const totalEvaluatedBeds = detailedData.reduce((acc, sector) => acc + (sector.bedStatus?.evaluated || 0), 0);
    const totalVacantBeds = detailedData.reduce((acc, sector) => acc + (sector.bedStatus?.vacant || 0), 0);
    const totalInactiveBeds = detailedData.reduce((acc, sector) => acc + (sector.bedStatus?.inactive || 0), 0);
    const averageOccupancyPercentage = totalBeds > 0 ? Math.round((totalEvaluatedBeds / totalBeds) * 100) : 0;
    const assessmentsCompletedPercentage = totalBeds > 0 ? Math.round((totalEvaluatedBeds / totalBeds) * 100) : 0;

    const totalStaff = detailedData.reduce((acc, sector) => acc + sector.staff.reduce((sum, staff) => sum + staff.quantity, 0), 0);
    const amountTotal = detailedData.reduce((acc, sector) => acc + sector.costAmount, 0);

    const chartDataCareLevels = [
        { name: 'Cuidado Mínimo', value: totalMinimumCare, color: COLORS[0] },
        { name: 'Cuidado Intermediário', value: totalIntermediateCare, color: COLORS[1] },
        { name: 'Alta Dependência', value: totalHighDependency, color: COLORS[2] },
        { name: 'Semi-Intensivo', value: totalSemiIntensive, color: COLORS[3] },
        { name: 'Intensivo', value: totalIntensive, color: COLORS[4] },
    ]

    const chartDataBedStates = [
        { name: 'Leito Ocupado', value: totalEvaluatedBeds, color: COLORS[1] },
        { name: 'Leito Livre', value: totalVacantBeds, color: COLORS[2] },
        { name: 'Leito em Manutenção', value: totalInactiveBeds, color: COLORS[3] },
    ];

    const chartDataAtual: ChartData[] = detailedData
        ? detailedData
            .map(item => ({
                key: item.id,
                name: item.name,
                value: item.costAmount,
                color: generateMultiColorScale(item.costAmount, 0, Math.max(...detailedData.map(i => i.costAmount)))
            }))
            .sort((a, b) => b.value - a.value) // <--- Adicionado aqui para ordenar
        : [];


    // Objeto para armazenar a soma das quantidades por função.
    // Ex: { 'Enfermeiro': 50, 'Médico': 20 }
    const staffTotals = {};

    // Passo 1: Iterar por todos os setores e somar as quantidades de cada função.
    for (const sector of detailedData) {
        if (sector.staff) {
            for (const staffMember of sector.staff) {
                const { role, quantity } = staffMember;

                // Se a função (role) já foi adicionada, soma a quantidade.
                // Se não, inicializa com a quantidade atual.
                staffTotals[role] = (staffTotals[role] || 0) + quantity;
            }
        }
    }

    // Passo 2: Transformar o objeto de totais no formato que o gráfico precisa.
    const chartDataGeral: ChartData[] = Object.entries(staffTotals).map(
        ([role, totalQuantity], index) => ({
            key: role, // A própria função pode ser a chave
            name: role,
            value: totalQuantity as number,
            color: COLORS[index % COLORS.length],
        })
    );

    const chartDataGeralAgrupado: ChartData[] = Object.entries(staffTotals).map(
        ([role, totalQuantity], index) => ({
            key: role,
            name: role,          // O nome da fatia do gráfico é a própria função
            value: totalQuantity as number, // O valor da fatia é a soma total daquela função
            color: COLORS[index % COLORS.length],
        })
    );

    // Agora você pode usar a variável 'chartDataGeral' nos seus gráficos.
    // As duas variáveis que você tinha podem receber o mesmo dado.
    let chartDataNumColaboradores = chartDataGeral;
    let chartDataNumColaboradoresByFuncao = chartDataGeralAgrupado;


    return (
        <div className="space-y-12">
            <div className="flex gap-4">
                <InfoCard title="Custo Total" value={formatAmountBRL(amountTotal)} icon={<DollarSign size={24} />} />
                <InfoCard title="Total de Funcionários" value={totalStaff} icon={<Users size={24} />} />
                <InfoCard title="Total de Leitos" value={totalBeds} icon={<Building size={24} />} />
                <InfoCard title="Taxa de Ocupação" value={`${averageOccupancyPercentage}%`} icon={<Building size={24} />} />
                {/* <InfoCard title="Avaliações Completas" value={`${assessmentsCompletedPercentage}%`} icon={<Users size={24} />} /> */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">

                <div>
                    <label className="text-sm font-medium text-muted-foreground">Selecione o Setor</label>
                    <Select value={selectedSector} onValueChange={setSelectedSector}>
                        <SelectTrigger><SelectValue placeholder="Escolha um setor..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Setores</SelectItem>
                            {sourceData.map(sector => (
                                <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PieChartComp data={chartDataCareLevels} title='Níveis de Cuidado' />
                <PieChartComp data={chartDataBedStates} title='Estados dos Leitos' />
                <PieChartComp data={chartDataNumColaboradores} title='Números de Colaboradores' labelType='value' />
                <PieChartComp data={chartDataNumColaboradoresByFuncao} title='Números de Colaboradores por Função' labelType='value' />
            </div>
            <BargraphicChart data={chartDataAtual} title='Análise de Custo por Setor' />
            <RadarChartComponent data={radarData} title='Análise de Desempenho' description='Comparativo entre o desempenho atual e projetado' />
        </div>
    );
};
const TabContentNoInternacao: React.FC<{ sourceData: SectorAssistance[], radarData: ChartDataItem[] }> = ({ sourceData, radarData }) => {
    const [selectedSector, setSelectedSector] = useState<string>('all');

    const detailedData = sourceData.filter(sector => selectedSector === 'all' || sector.id === selectedSector);

    const totalStaff = detailedData.reduce((acc, sector) => acc + sector.staff.reduce((sum, staff) => sum + staff.quantity, 0), 0);
    const amountTotal = detailedData.reduce((acc, sector) => acc + sector.costAmount, 0);



    const staffTotals = {};

    // Passo 1: Iterar por todos os setores e somar as quantidades de cada função.
    for (const sector of detailedData) {
        if (sector.staff) {
            for (const staffMember of sector.staff) {
                const { role, quantity } = staffMember;

                // Se a função (role) já foi adicionada, soma a quantidade.
                // Se não, inicializa com a quantidade atual.
                staffTotals[role] = (staffTotals[role] || 0) + quantity;
            }
        }
    }

    const chartDataAtual: ChartData[] = detailedData
        ? detailedData
            .map(item => ({
                key: item.id,
                name: item.name,
                value: item.costAmount,
                color: generateMultiColorScale(item.costAmount, 0, Math.max(...detailedData.map(i => i.costAmount)))
            }))
            .sort((a, b) => b.value - a.value) // <--- Adicionado aqui para ordenar
        : [];


    // Passo 2: Transformar o objeto de totais no formato que o gráfico precisa.
    const chartDataGeral: ChartData[] = Object.entries(staffTotals).map(
        ([role, totalQuantity], index) => ({
            key: role, // A própria função pode ser a chave
            name: role,
            value: totalQuantity as number,
            color: COLORS[index % COLORS.length],
        })
    );

    const chartDataGeralAgrupado: ChartData[] = Object.entries(staffTotals).map(
        ([role, totalQuantity], index) => ({
            key: role,
            name: role,          // O nome da fatia do gráfico é a própria função
            value: totalQuantity as number, // O valor da fatia é a soma total daquela função
            color: COLORS[index % COLORS.length],
        })
    );

    // Agora você pode usar a variável 'chartDataGeral' nos seus gráficos.
    // As duas variáveis que você tinha podem receber o mesmo dado.
    let chartDataNumColaboradores = chartDataGeral;
    let chartDataNumColaboradoresByFuncao = chartDataGeralAgrupado;


    return (
        <div className="space-y-12">
            <div className="flex gap-4">
                <InfoCard title="Total de Funcionários" value={totalStaff} icon={<Building size={24} />} />
                <InfoCard title="Custo Total" value={formatAmountBRL(amountTotal)} icon={<CircleDollarSign size={24} />} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">

                <div>
                    <label className="text-sm font-medium text-muted-foreground">Selecione o Setor</label>
                    <Select value={selectedSector} onValueChange={setSelectedSector}>
                        <SelectTrigger><SelectValue placeholder="Escolha um setor..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Setores</SelectItem>
                            {sourceData.map(sector => (
                                <SelectItem key={sector.id} value={sector.id}>{sector.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PieChartComp data={chartDataNumColaboradores} title='Números de Colaboradores' labelType='value' />
                <PieChartComp data={chartDataNumColaboradoresByFuncao} title='Números de Colaboradores por Função' labelType='value' />
            </div>
            <BargraphicChart data={chartDataAtual} title='Análise de Custo por Setor' />
            <RadarChartComponent data={radarData} title='Análise de Desempenho' description='Comparativo entre o desempenho atual e projetado' />
        </div>
    );
};


export const DashboardAtualScreen: React.FC<DashboardAtualScreenProps> = (props) => {

    const [chartDataAtual, setChartDataAtual] = useState<HospitalSector | null>(null);
    const [radarData, setRadarData] = useState<ChartDataItem[]>([]);
    const [activeTab, setActiveTab] = useState('global'); // Valor inicial 'global'


    const loadData = async () => {

        const typeFilter = activeTab === 'global' ? 'all' : (activeTab === 'internacao' ? 'internation' : 'assistance');
        const dashboardData = getAllHospitalSectors(); // Busca os dados principais
        const tipo = activeTab === 'internacao' ? 'Internacao' : 'NaoInternacao';
        const chartData = activeTab === 'global' ?
            calcularPerformanceParaGrafico() :
            calcularPerformanceParaGrafico({ tipo: tipo });

        console.log('Dados iniciais carregados:', dashboardData);
        setChartDataAtual(dashboardData);
        setRadarData(chartData);
    };


    useEffect(() => {

        loadData();
    }, []);


    useEffect(() => {
        loadData();

    }, [activeTab]);

    return (
        <>
            {chartDataAtual && (
                <Card className="transition-shadow hover:shadow-lg">
                    <CardHeader>
                        <CardTitle>{props.title}</CardTitle>
                        <CardDescription>Análise de desempenho</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* 3. Adicione `onValueChange` para atualizar o estado da aba */}
                        <Tabs
                            defaultValue="global"
                            className="w-full"
                            onValueChange={(value) => setActiveTab(value)}
                        >
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="global">Global</TabsTrigger>
                                <TabsTrigger value="internacao">Unid. de Internação</TabsTrigger>
                                <TabsTrigger value="nao-internacao">Setores Assistenciais</TabsTrigger>
                            </TabsList>

                            {/* O conteúdo das abas permanece o mesmo */}
                            <TabsContent value="global" className="mt-4">
                                <GlobalTabContent
                                    sourceData={chartDataAtual}
                                    radarData={radarData}
                                />

                            </TabsContent>
                            <TabsContent value="internacao" className="mt-4">
                                <TabContentInternacao
                                    sourceData={chartDataAtual?.internation}
                                    radarData={radarData}
                                />
                            </TabsContent>
                            <TabsContent value="nao-internacao" className="mt-4">
                                <TabContentNoInternacao
                                    sourceData={chartDataAtual?.assistance}
                                    radarData={radarData} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}
        </>
    );
};


interface ChartData {
    [key: string]: string | number | undefined;
    name: string;
    value: number;
    color?: string;
}