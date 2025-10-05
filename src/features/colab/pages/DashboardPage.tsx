import { Sheet } from "lucide-react";

// Importando todos os componentes de gráfico necessários
import { OccupationRateChart } from "@/features/admin-hospital/components/OccupationRateChart";
import { PizzaChart } from "@/features/admin-hospital/components/PizzaChart";
import { WaterfallChart } from "@/features/admin-hospital/components/WaterfallChart";
// --- ALTERAÇÃO AQUI: Importando o novo componente ---
import ParetoChart from "@/features/admin-hospital/components/ParetoChart"; // Verifique se o caminho está correto
import { HeatScaleChart } from "@/features/admin-hospital/components/HeatScaleChart";

import { ChartData } from "@/features/admin-hospital/types/hospital";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- DADOS MOCKADOS COMPLETOS E CORRIGIDOS (BASEADOS NA PLANILHA) ---

// 1. Gráfico de Pareto
const paretoMockData = [
    { nome: 'UTI Pediátrica', custo: 375000 }, { nome: 'UTI Adulta', custo: 350000 },
    { nome: 'Enfermaria', custo: 280000 }, { nome: 'Pronto Atendimento', custo: 245000 },
    { nome: 'Centro Cirúrgico', custo: 160000 }, { nome: 'Recepção', custo: 120000 },
    { nome: 'Farmacia', custo: 85000 }, { nome: 'Manutenção', custo: 70000 }, { nome: 'CME', custo: 45000 },
].sort((a, b) => b.custo - a.custo);
const totalCustoPareto = paretoMockData.reduce((sum, item) => sum + item.custo, 0);
let acc = 0;
const paretoChartData = paretoMockData.map(e => ({ ...e, acumulado: acc += e.custo, acumuladoPercent: totalCustoPareto ? (acc / totalCustoPareto) * 100 : 0 }));

// ... (Restante dos mocks para Ocupação, Pizza, Waterfall e HeatScale permanecem os mesmos)
const taxaOcupacaoMockData = [ { name: 'Enfermaria', 'Taxa de Ocupação': 75, 'Ociosidade': 0, 'Superlotação': 10, 'Capacidade Produtiva': 65 }, { name: 'UTI Adulta', 'Taxa de Ocupação': 70, 'Ociosidade': 5, 'Superlotação': 0, 'Capacidade Produtiva': 75 }, { name: 'UTI Pediátrica', 'Taxa de Ocupação': 62, 'Ociosidade': 28, 'Superlotação': 0, 'Capacidade Produtiva': 90 }, ];
const taxaOcupacaoSummary = { name: 'MÉDIA', 'Taxa de Ocupação': 69, 'Ociosidade': 11, 'Superlotação': 3, 'Capacidade Produtiva': 77 };
const pizzaScpMockData: ChartData[] = [ { name: 'Cuidados mínimos', value: 20 }, { name: 'Intermediários', value: 35 }, { name: 'Alta Dependência', value: 10 }, { name: 'Semi-intensivo', value: 30 }, { name: 'Intensivo', value: 5 }, ];
const sitioFuncionalMockData: ChartData[] = [ { name: 'Sala Vermelha', value: 6 }, { name: 'Classif. de Riscos', value: 2 }, { name: 'Observação Masc', value: 9 }, { name: 'Observação Fem', value: 8 }, { name: 'Sala de Proc.', value: 2 }, ];
const pessoalGeralData = { atual: [ { name: 'Enfermeiro', value: 21 }, { name: 'Tec. Enfermagem', value: 35 }, { name: 'Auxiliar Nivel II', value: 4 }, { name: 'Maqueiro', value: 4 }, { name: 'Instrumentista', value: 2 }, { name: 'Recepcionista', value: 2 }, ], projetado: [ { name: 'Enfermeiro', value: 16 }, { name: 'Tec. Enfermagem', value: 24 }, { name: 'Auxiliar Nivel II', value: 1 }, { name: 'Maqueiro', value: 2 }, { name: 'Instrumentista', value: 2 }, { name: 'Recepcionista', value: 1 }, ] };
const setoresTecData = { atual: [ { name: 'UTI Pediátrica', value: 5 }, { name: 'UTI Adulto', value: 1 }, { name: 'Enfermaria', value: 8 }, { name: 'Pronto Atendimento', value: 6 }, ], projetado: [ { name: 'UTI Pediátrica', value: 5 }, { name: 'UTI Adulto', value: 0 }, { name: 'Enfermaria', value: 8 }, { name: 'Pronto Atendimento', value: 2 }, ] };
const waterfallGlobalData = [ { name: 'Atual', value: 723105 }, { name: 'Unid. de Internação', value: -84580 }, { name: 'Setores Assist.', value: -68865 }, { name: 'Total Projetado', value: 569660 }, ];
const waterfallInternacaoData = { 'UTI Pediátrica': { custo: [ { name: 'Atual', value: 121800 }, { name: 'Enfermeiro', value: -17120 }, { name: 'Tec. Enfermagem', value: -26420 }, { name: 'Projetado', value: 78260 } ], quantitativo: [ { name: 'Atual', value: 21 }, { name: 'Enfermeiro', value: -2 }, { name: 'Tec. Enfermagem', value: -5 }, { name: 'Projetado', value: 14 } ] }, 'UTI Adulta': { custo: [ { name: 'Atual', value: 58940 }, { name: 'Tec. Enfermagem', value: -4960 }, { name: 'Auxiliar Nivel II', value: -2160 }, { name: 'Projetado', value: 51820 } ], quantitativo: [ { name: 'Atual', value: 8 }, { name: 'Tec. Enfermagem', value: -1 }, { name: 'Projetado', value: 7 } ] }, 'Enfermaria': { custo: [ { name: 'Atual', value: 187880 }, { name: 'Enfermeiro', value: -8560 }, { name: 'Tec. Enfermagem', value: -25360 }, { name: 'Projetado', value: 153960 } ], quantitativo: [ { name: 'Atual', value: 29 }, { name: 'Enfermeiro', value: -1 }, { name: 'Tec. Enfermagem', value: -5 }, { name: 'Projetado', value: 23 } ] }, };
const waterfallNaoInternacaoData = { 'Pronto Atendimento': { custo: [ { name: 'Atual', value: 152060 }, { name: 'Enfermeiro', value: -8560 }, { name: 'Tec. Enfermagem', value: -9810 }, { name: 'Projetado', value: 133690 } ], quantitativo: [ { name: 'Atual', value: 27 }, { name: 'Enfermeiro', value: -2 }, { name: 'Tec. Enfermagem', value: -4 }, { name: 'Projetado', value: 21 } ] }, 'Centro Cirúrgico': { custo: [ { name: 'Atual', value: 98700 }, { name: 'Instrumentista', value: -25000 }, { name: 'Projetado', value: 73700 } ], quantitativo: [ { name: 'Atual', value: 15 }, { name: 'Instrumentista', value: -5 }, { name: 'Projetado', value: 10 } ] } };
const waterfallGlobalVsInternacaoData = [ { name: 'Atual', value: 723105 }, { name: 'UTI Pediátrica', value: -43540 }, { name: 'UTI Adulta', value: -7120 }, { name: 'Enfermaria', value: -33920 }, { name: 'Setores Assist.', value: -68865 }, { name: 'Total Projetado', value: 569660 }, ];
const waterfallGlobalVsNaoInternacaoData = [ { name: 'Atual', value: 723105 }, { name: 'Unid. de Internação', value: -84580 }, { name: 'Pronto Atendimento', value: -18370 }, { name: 'Centro Cirúrgico', value: -25000 }, { name: 'Recepção', value: -12000 }, { name: 'Outros', value: -13495 }, { name: 'Total Projetado', value: 569660 }, ];
const divergingHeatScaleData = { title: "Quantitativo de Pessoal (UTI Pediátrica)", atual: 21, projetado: 14 };


export default function HospitalDashboardPage() {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2"><Sheet /> Dashboard Hospitalar</h1>
        <p className="text-muted-foreground">Visualização dos gráficos com base nos dados fornecidos na planilha.</p>
      </div>

      <Tabs defaultValue="baseline">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="baseline">Baseline</TabsTrigger>
            <TabsTrigger value="atual">Atual</TabsTrigger>
            <TabsTrigger value="projetado">Projetado</TabsTrigger>
            <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
        </TabsList>

        <TabsContent value="baseline">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                {/* --- COMPONENTE INCLUÍDO AQUI --- */}
                <div className="col-span-1 xl:col-span-2">
                    <ParetoChart data={paretoChartData} total={totalCustoPareto} />
                </div>
                <div className="col-span-1 xl:col-span-2">
                    <OccupationRateChart data={taxaOcupacaoMockData} summary={taxaOcupacaoSummary} />
                </div>
            </div>
        </TabsContent>

        <TabsContent value="atual">
            <div className="grid grid-cols-1 gap-6 mt-6">
                 <PizzaChart title="Análise de Distribuição" description="Filtre para visualizar a distribuição por diferentes categorias." scpData={pizzaScpMockData} sitioData={sitioFuncionalMockData} pessoalGeralData={pessoalGeralData} setoresTecData={setoresTecData} />
            </div>
        </TabsContent>

        <TabsContent value="projetado">
            <div className="grid grid-cols-1 gap-6 mt-6">
                <WaterfallChart title="Análise Econômico-Financeira Detalhada" globalData={waterfallGlobalData} internacaoData={waterfallInternacaoData} naoInternacaoData={waterfallNaoInternacaoData} globalVsInternacaoData={waterfallGlobalVsInternacaoData} globalVsNaoInternacaoData={waterfallGlobalVsNaoInternacaoData} />
            </div>
        </TabsContent>

        <TabsContent value="comparativo">
            <div className="grid grid-cols-1 gap-6 mt-6">
                <HeatScaleChart title={divergingHeatScaleData.title} subtitle="Comparativo do número de profissionais no setor" atual={divergingHeatScaleData.atual} projetado={divergingHeatScaleData.projetado}/>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}