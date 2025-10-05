import { useState, useMemo } from 'react';
import { Globe, Layers } from "lucide-react";

// Importando todos os componentes de gráfico
import { OccupationRateChart } from "@/features/admin-hospital/components/OccupationRateChart";
import { PizzaChart } from "@/features/admin-hospital/components/PizzaChart";
import { WaterfallChart } from "@/features/admin-hospital/components/WaterfallChart";
// --- ALTERAÇÃO AQUI: Importando o novo componente Pareto ---
import ParetoChart from "@/features/admin-hospital/components/ParetoChart"; // Verifique se o caminho está correto
import { HeatScaleChart } from "@/features/admin-hospital/components/HeatScaleChart";

import { ChartData, OccupationData } from "@/features/admin-hospital/types/hospital";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// --- MOCKS HIERÁRQUICOS E DETALHADOS ---
const mockHospitaisData = [
    { rede: 'Rede A', grupo: 'Grupo Sudeste', regiao: 'São Paulo', hospital: 'Hospital Sírio-Libanês', pareto: [{ nome: 'UTI Adulta', custo: 350000 }, { nome: 'Enfermaria', custo: 280000 }, { nome: 'P.A.', custo: 245000 }], ocupacao: [ { name: 'UTI Adulta', 'Taxa de Ocupação': 70, 'Ociosidade': 5, 'Superlotação': 0, 'Capacidade Produtiva': 75 }, { name: 'Enfermaria', 'Taxa de Ocupação': 75, 'Ociosidade': 0, 'Superlotação': 10, 'Capacidade Produtiva': 65 } ], scp: [{ name: 'Intermediários', value: 35 }, { name: 'Semi-intensivo', value: 30 }], pessoal: { atual: 68, projetado: 46 }, waterfall: { global: [{ name: 'Atual', value: 723105 }, { name: 'Redução', value: -153445 }, { name: 'Projetado', value: 569660 }] } },
    { rede: 'Rede A', grupo: 'Grupo Sudeste', regiao: 'Rio de Janeiro', hospital: 'Hospital Copa D\'Or', pareto: [{ nome: 'UTI Pediátrica', custo: 375000 }, { nome: 'Centro Cirúrgico', custo: 160000 }, { nome: 'Farmacia', custo: 85000 }], ocupacao: [{ name: 'UTI Pediátrica', 'Taxa de Ocupação': 62, 'Ociosidade': 28, 'Superlotação': 0, 'Capacidade Produtiva': 90 }], scp: [{ name: 'Cuidados mínimos', value: 20 }, { name: 'Alta Dependência', value: 10 }], pessoal: { atual: 42, projetado: 28 }, waterfall: { global: [{ name: 'Atual', value: 620000 }, { name: 'Redução', value: -180000 }, { name: 'Projetado', value: 440000 }] } },
    { rede: 'Rede B', grupo: 'Grupo Nordeste', regiao: 'Bahia', hospital: 'Hospital Aliança', pareto: [{ nome: 'UTI Adulta', custo: 450000 }, { nome: 'Recepção', custo: 120000 }, { nome: 'Manutenção', custo: 70000 }], ocupacao: [{ name: 'UTI Adulta', 'Taxa de Ocupação': 90, 'Ociosidade': 0, 'Superlotação': 5, 'Capacidade Produtiva': 85 }], scp: [{ name: 'Intensivo', value: 40 }, { name: 'Cuidados mínimos', value: 15 }], pessoal: { atual: 55, projetado: 39 }, waterfall: { global: [{ name: 'Atual', value: 800000 }, { name: 'Redução', value: -250000 }, { name: 'Projetado', value: 550000 }] } },
    { rede: 'Rede B', grupo: 'Grupo Nordeste', regiao: 'Pernambuco', hospital: 'Hospital Português', pareto: [{ nome: 'Enfermaria', custo: 310000 }, { nome: 'CME', custo: 45000 }, { nome: 'P.A.', custo: 210000 }], ocupacao: [ { name: 'Enfermaria', 'Taxa de Ocupação': 82, 'Ociosidade': 0, 'Superlotação': 12, 'Capacidade Produtiva': 70 } ], scp: [{ name: 'Intermediários', value: 50 }, { name: 'Semi-intensivo', value: 25 }], pessoal: { atual: 73, projetado: 51 }, waterfall: { global: [{ name: 'Atual', value: 650000 }, { name: 'Redução', value: -120000 }, { name: 'Projetado', value: 530000 }] } }
];
const pizzaDetailedMock = {
    sitio: [ { name: 'Sala Vermelha', value: 6 }, { name: 'Classif. de Riscos', value: 2 }, { name: 'Observação Masc', value: 9 }, { name: 'Observação Fem', value: 8 }, { name: 'Sala de Proc.', value: 2 }, ],
    pessoal: { atual: [ { name: 'Enfermeiro', value: 21 }, { name: 'Tec. Enfermagem', value: 35 }, { name: 'Auxiliar Nivel II', value: 4 }, { name: 'Maqueiro', value: 4 }, { name: 'Instrumentista', value: 2 }, { name: 'Recepcionista', value: 2 }, ], projetado: [ { name: 'Enfermeiro', value: 16 }, { name: 'Tec. Enfermagem', value: 24 }, { name: 'Auxiliar Nivel II', value: 1 }, { name: 'Maqueiro', value: 2 }, { name: 'Instrumentista', value: 2 }, { name: 'Recepcionista', value: 1 }, ] },
    setores: { atual: [ { name: 'UTI Pediátrica', value: 5 }, { name: 'UTI Adulto', value: 1 }, { name: 'Enfermaria', value: 8 }, { name: 'Pronto Atendimento', value: 6 }, ], projetado: [ { name: 'UTI Pediátrica', value: 5 }, { name: 'UTI Adulto', value: 0 }, { name: 'Enfermaria', value: 8 }, { name: 'Pronto Atendimento', value: 2 }, ] }
};
const getUnique = (key: 'rede' | 'grupo' | 'regiao' | 'hospital') => [...new Set(mockHospitaisData.map(h => h[key]))];

type GroupByKey = 'rede' | 'grupo' | 'regiao' | 'hospital';

export default function GlobalDashboardPage() {
    const [groupBy, setGroupBy] = useState<GroupByKey>('rede');

    const aggregatedData = useMemo(() => {
        // ... (toda a lógica de agregação permanece a mesma)
        const groups = getUnique(groupBy);
        let sitioDataForChart: ChartData[] = [];
        let pessoalDataForChart = { atual: [], projetado: [] };
        let setoresDataForChart = { atual: [], projetado: [] };
        if (groupBy === 'hospital' && groups.length > 0) {
            const singleHospitalName = groups[0];
            if (singleHospitalName === 'Hospital Sírio-Libanês') {
                sitioDataForChart = pizzaDetailedMock.sitio;
                pessoalDataForChart = pizzaDetailedMock.pessoal;
                setoresDataForChart = pizzaDetailedMock.setores;
            }
        }
        const pareto: { nome: string; custo: number }[] = [];
        const ocupacao: OccupationData[] = [];
        const pessoal: { name: string, atual: number, projetado: number }[] = [];
        groups.forEach(groupName => {
            const hospitalsInGroup = mockHospitaisData.filter(h => h[groupBy] === groupName);
            if (hospitalsInGroup.length === 0) return;
            const totalCustoGrupo = hospitalsInGroup.reduce((sum, h) => sum + h.pareto.reduce((s, p) => s + p.custo, 0), 0);
            pareto.push({ nome: groupName, custo: totalCustoGrupo });
            const totalPessoal = hospitalsInGroup.reduce((acc, h) => { acc.atual += h.pessoal.atual; acc.projetado += h.pessoal.projetado; return acc; }, { atual: 0, projetado: 0 });
            pessoal.push({ name: groupName, ...totalPessoal });
            let totalTaxaPonderada = 0; let totalCapacidade = 0;
            hospitalsInGroup.forEach(h => { h.ocupacao.forEach(o => { totalTaxaPonderada += o['Taxa de Ocupação']; totalCapacidade += o['Capacidade Produtiva']; }); });
            const countOcupacao = hospitalsInGroup.flatMap(h => h.ocupacao).length || 1;
            const mediaOcupacao = Math.round(totalTaxaPonderada / countOcupacao);
            const mediaCapacidade = Math.round(totalCapacidade / countOcupacao);
            ocupacao.push({ name: groupName, 'Taxa de Ocupação': mediaOcupacao, 'Capacidade Produtiva': mediaCapacidade, 'Superlotação': Math.max(0, mediaOcupacao - mediaCapacidade), 'Ociosidade': Math.max(0, mediaCapacidade - mediaOcupacao) });
        });
        pareto.sort((a, b) => b.custo - a.custo);
        const totalCustoPareto = pareto.reduce((sum, item) => sum + item.custo, 0);
        let acc = 0;
        const paretoChartData = pareto.map(e => ({ ...e, acumulado: acc += e.custo, acumuladoPercent: totalCustoPareto ? (acc / totalCustoPareto) * 100 : 0 }));
        const totalScp = mockHospitaisData.flatMap(h => h.scp).reduce((acc, curr) => { const existing = acc.find(item => item.name === curr.name); if(existing) { existing.value += curr.value; } else { acc.push({...curr}); } return acc; }, [] as ChartData[]);
        const totalWaterfall = mockHospitaisData.flatMap(h => h.waterfall.global).reduce((acc, curr) => { const existing = acc.find(item => item.name === curr.name); if(existing) { existing.value += curr.value; } else { acc.push({...curr}); } return acc; }, [] as {name: string, value: number}[]);
        const mediaGeralOcupacao = Math.round(ocupacao.reduce((sum, o) => sum + o['Taxa de Ocupação'], 0) / ocupacao.length);
        const mediaGeralCapacidade = Math.round(ocupacao.reduce((sum, o) => sum + o['Capacidade Produtiva'], 0) / ocupacao.length);
        const summaryOcupacao = { name: 'MÉDIA', 'Taxa de Ocupação': mediaGeralOcupacao, 'Capacidade Produtiva': mediaGeralCapacidade, 'Superlotação': Math.max(0, mediaGeralOcupacao - mediaGeralCapacidade), 'Ociosidade': Math.max(0, mediaGeralCapacidade - mediaGeralOcupacao), };
        return { paretoChartData, totalCustoPareto, ocupacao, summaryOcupacao, pessoal, totalScp, totalWaterfall, sitioDataForChart, pessoalDataForChart, setoresDataForChart };
    }, [groupBy]);

    return (
        <div className="space-y-8 pb-10">
            <div><h1 className="text-3xl font-bold text-primary flex items-center gap-2"><Globe /> Dashboard Global</h1><p className="text-muted-foreground">Visão consolidada dos indicadores por nível hierárquico.</p></div>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Layers /> Agrupador Principal</CardTitle></CardHeader>
                <CardContent>
                    <div className='max-w-sm'>
                        <label className="text-sm font-medium text-muted-foreground">Agrupar gráficos por:</label>
                        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByKey)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-background">
                                <SelectItem value="rede">Rede</SelectItem>
                                <SelectItem value="grupo">Grupo</SelectItem>
                                <SelectItem value="regiao">Região</SelectItem>
                                <SelectItem value="hospital">Hospital</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="baseline">
                 <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="baseline">Baseline</TabsTrigger>
                    <TabsTrigger value="atual">Atual</TabsTrigger>
                    <TabsTrigger value="projetado">Projetado</TabsTrigger>
                    <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
                </TabsList>

                <TabsContent value="baseline">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                        {/* --- COMPONENTE ATUALIZADO AQUI --- */}
                        <div className="col-span-1 xl:col-span-2">
                           <ParetoChart data={aggregatedData.paretoChartData} total={aggregatedData.totalCustoPareto} />
                        </div>
                        <div className="col-span-1 xl:col-span-2">
                            <OccupationRateChart data={aggregatedData.ocupacao} summary={aggregatedData.summaryOcupacao} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="atual">
                     <div className="grid grid-cols-1 gap-6 mt-6">
                         <PizzaChart 
                            title={`Distribuição ${groupBy === 'hospital' ? `(${aggregatedData.pessoal[0]?.name || ''})` : '(Total Agregado)'}`}
                            description={groupBy === 'hospital' ? "Visualização detalhada do hospital selecionado." : "Soma de todos os hospitais para SCP."}
                            scpData={aggregatedData.totalScp} 
                            sitioData={aggregatedData.sitioDataForChart} 
                            pessoalGeralData={aggregatedData.pessoalDataForChart}
                            setoresTecData={aggregatedData.setoresDataForChart}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="projetado">
                    <div className="grid grid-cols-1 gap-6 mt-6">
                        <WaterfallChart title="Análise Financeira (Total Agregado)" globalData={aggregatedData.totalWaterfall} internacaoData={{}} naoInternacaoData={{}} globalVsInternacaoData={[]} globalVsNaoInternacaoData={[]}/>
                    </div>
                </TabsContent>

                <TabsContent value="comparativo">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {aggregatedData.pessoal.map(p => (
                            <HeatScaleChart key={p.name} title={`Quantitativo de Pessoal (${p.name})`} atual={p.atual} projetado={p.projetado} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}