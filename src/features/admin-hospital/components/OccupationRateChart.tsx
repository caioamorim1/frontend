import React, { useState, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Globe } from "lucide-react";
import GraficoOcupacao from "./graphicsComponents/GraficoOcupacao";
import {
  getTaxaOcupacaoHospital,
  getTaxaOcupacaoAgregada,
  TaxaOcupacaoHospital,
} from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// --- ESTRUTURA DE DADOS ---
export interface OccupationData {
  name: string;
  "Taxa de Ocupação": number;
  "Taxa de Ocupação Diária"?: number; // 🆕 Taxa média do dia
  "Ocupação Máxima Atendível": number; // 🆕 Nova métrica
  Ociosidade: number;
  Superlotação: number;
  "Capacidade Produtiva": number;
}

interface OccupationRateChartProps {
  data: OccupationData[];
  summary: OccupationData;
  title?: string;
  hospitalId?: string; // 🆕 ID do hospital para buscar taxa de ocupação real
  showViewSelector?: boolean; // 🆕 Se true, mostra botões Setorial/Global; se false, só mostra setorial
  aggregationType?: "hospital" | "grupo" | "regiao" | "rede"; // 🆕 Tipo de agregação para GlobalDashboard
  entityId?: string; // 🆕 ID da entidade específica (opcional)
}

const axisTick = {
  fontSize: 12,
  fill: "hsl(var(--muted-foreground))",
} as const;

// Paleta Monocromática de Azul
const barConfig = [
  {
    key: "Taxa de Ocupação",
    color: "hsl(210, 100%, 45%)",
    label: "Taxa Atual",
  }, // Azul médio-escuro (base)
  {
    key: "Ocupação Máxima Atendível",
    color: "hsl(210, 80%, 55%)",
    label: "Cobertura de Equipe",
  }, // Azul médio (referência)
  {
    key: "Capacidade Produtiva",
    color: "hsl(210, 70%, 65%)",
    label: "Capacidade Produtiva",
  }, // Azul claro (não usado como barra)
  {
    key: "Ociosidade",
    color: "hsl(0, 55%, 65%)",
    label: "Deficit de Equipe",
  }, // Vermelho mais leve e suave (deficit)
  {
    key: "Superlotação",
    color: "hsl(210, 50%, 35%)",
    label: "Excedente",
  }, // Azul mais escuro (alerta)
];

// Mapeamento de chaves técnicas para labels amigáveis
const labelMap: Record<string, string> = {
  "Taxa de Ocupação": "Taxa Atual",
  "Ocupação Máxima Atendível": "Cobertura de Equipe",
  "Capacidade Produtiva": "Capacidade Produtiva",
  "Ociosidade": "Deficit de Equipe",
  "Superlotação": "Excedente",
};

// --- COMPONENTES AUXILIARES ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-3 rounded-lg shadow-lg text-sm space-y-1">
        <p className="font-bold text-foreground mb-2">{label}</p>
        {payload
          .filter((p) =>
            [
              "Taxa de Ocupação",
              "Ocupação Máxima Atendível",
              "Capacidade Produtiva",
              "Ociosidade",
              "Superlotação",
            ].includes(p.dataKey)
          )
          .map((entry: any) => (
            <p
              key={entry.dataKey}
              style={{ color: entry.color }}
              className="flex items-center justify-between"
            >
              <span className="flex items-center">
                <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                ></span>
                {labelMap[entry.dataKey] || entry.dataKey}:
              </span>
              <span className="font-semibold ml-4">
                {typeof entry.value === "number"
                  ? entry.value.toFixed(1)
                  : entry.value}
                %
              </span>
            </p>
          ))}
      </div>
    );
  }
  return null;
};

// --- COMPONENTE PRINCIPAL ---
export const OccupationRateChart: React.FC<OccupationRateChartProps> = ({
  data,
  summary,
  title = "Análise da Taxa de Ocupação",
  hospitalId,
  showViewSelector = true, // Por padrão, mostra os botões
  aggregationType, // 🆕 Tipo de agregação (hospital, grupo, região, rede)
  entityId, // 🆕 ID da entidade (opcional)
}) => {
  const [view, setView] = useState<"setorial" | "global">("setorial");
  const [taxaOcupacaoReal, setTaxaOcupacaoReal] =
    useState<TaxaOcupacaoHospital | null>(null);
  const [taxasAgregadas, setTaxasAgregadas] = useState<TaxaOcupacaoHospital[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const chartData = view === "setorial" ? data : [summary];

  // � MÁSCARA: Sempre buscar taxa de rede e usar para todos os tipos
  useEffect(() => {
    // Se temos aggregationType, SEMPRE buscamos dados de REDE (máscara)
    if (aggregationType) {
      const fetchTaxaAgregada = async () => {
        setLoading(true);
        try {
          // 🎭 SEMPRE buscar de REDE, independente do aggregationType selecionado
          const taxas = await getTaxaOcupacaoAgregada("rede", undefined);
          setTaxasAgregadas(taxas);
        } catch (error) {
          console.error("Erro ao buscar taxa de ocupação agregada:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchTaxaAgregada();

      // Atualizar a cada 60 segundos
      const interval = setInterval(fetchTaxaAgregada, 60000);
      return () => clearInterval(interval);
    }
    // Se temos hospitalId (sem aggregationType), buscamos dados de um hospital específico
    else if (hospitalId) {
      const fetchTaxaOcupacao = async () => {
        setLoading(true);
        try {
          const taxa = await getTaxaOcupacaoHospital(hospitalId);
          setTaxaOcupacaoReal(taxa);
        } catch (error) {
          console.error("Erro ao buscar taxa de ocupação:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchTaxaOcupacao();

      // Atualizar a cada 60 segundos
      const interval = setInterval(fetchTaxaOcupacao, 60000);
      return () => clearInterval(interval);
    }
  }, [hospitalId, aggregationType, entityId]);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Comparação entre ocupação atual, capacidade máxima atendível e
            indicadores de eficiência.
          </CardDescription>
        </div>
        {showViewSelector && (
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              size="sm"
              variant={view === "setorial" ? "secondary" : "ghost"}
              onClick={() => setView("setorial")}
            >
              <LayoutGrid className="mr-2 h-4 w-4" /> Setorial
            </Button>
            <Button
              size="sm"
              variant={view === "global" ? "secondary" : "ghost"}
              onClick={() => setView("global")}
            >
              <Globe className="mr-2 h-4 w-4" /> Global
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Card de Taxa de Ocupação Diária - Aparece apenas na visão Global */}
        {view === "global" && (
          <div className="bg-muted/50 border rounded-lg p-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-10 w-32" />
              </div>
            ) : aggregationType && taxasAgregadas.length > 0 ? (
              // 🎯 Mostrar taxa consolidada da API (baseada em status de leitos)
              (() => {
                // Calcular taxa consolidada total da API
                const totalLeitos = taxasAgregadas.reduce(
                  (acc, taxa) => acc + taxa.consolidadoHospital.totalLeitos,
                  0
                );
                const totalAtivos = taxasAgregadas.reduce(
                  (acc, taxa) => acc + taxa.consolidadoHospital.leitosAtivos,
                  0
                );
                const taxaConsolidada =
                  totalLeitos > 0 ? (totalAtivos / totalLeitos) * 100 : 0;

                const entityTypeName =
                  aggregationType === "hospital"
                    ? "Por Hospital"
                    : aggregationType === "grupo"
                    ? "Por Grupo"
                    : aggregationType === "regiao"
                    ? "Por Região"
                    : "Por Rede";

                return (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Taxa de Ocupação Diária - {entityTypeName}
                      </h3>
                      <p className="text-4xl font-bold text-primary">
                        {taxaConsolidada.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {totalAtivos.toLocaleString()} leitos ativos de{" "}
                        {totalLeitos.toLocaleString()} totais
                        {taxasAgregadas.length > 1 && (
                          <>
                            {" "}
                            • {taxasAgregadas.length}{" "}
                            {aggregationType === "hospital"
                              ? "hospitais"
                              : "entidades"}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })()
            ) : taxaOcupacaoReal ? (
              // Mostrar dados de hospital único
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Taxa de Ocupação Diária
                  </h3>
                  <p className="text-4xl font-bold text-primary">
                    {taxaOcupacaoReal.consolidadoHospital.taxaOcupacao.toFixed(
                      2
                    )}
                    %
                  </p>
                </div>
              </div>
            ) : summary["Taxa de Ocupação Diária"] !== undefined ? (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    Taxa de Ocupação Diária
                  </h3>
                  <p className="text-4xl font-bold text-primary">
                    {summary["Taxa de Ocupação Diária"].toFixed(2)}%
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="hsl(var(--border))"
              />
              <XAxis dataKey="name" tick={axisTick} />
              <YAxis
                domain={[0, "dataMax + 10"]}
                allowDataOverflow
                tickFormatter={(v) => `${v}%`}
                tick={axisTick}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                verticalAlign="top"
                wrapperStyle={{ fontSize: 12, paddingBottom: "20px" }}
              />

              {/* Taxa de Ocupação Atual - Base da pilha */}
              <Bar
                dataKey="Taxa de Ocupação"
                fill={barConfig[0].color}
                barSize={view === "global" ? 80 : 40}
                stackId={view === "global" ? undefined : "ocupacao"}
                radius={view === "global" ? [4, 4, 0, 0] : undefined}
                name={barConfig[0].label}
              />

              {/* Ociosidade - Complemento até a máxima (empilhada em cima) */}
              <Bar
                dataKey="Ociosidade"
                fill={barConfig[3].color}
                barSize={view === "global" ? 80 : 40}
                stackId={view === "global" ? undefined : "ocupacao"}
                radius={[4, 4, 0, 0]}
                name={barConfig[3].label}
              />

              {/* Superlotação - Excedente acima da máxima (empilhada em cima) */}
              <Bar
                dataKey="Superlotação"
                fill={barConfig[4].color}
                barSize={view === "global" ? 80 : 40}
                stackId={view === "global" ? undefined : "ocupacao"}
                radius={[4, 4, 0, 0]}
                name={barConfig[4].label}
              />

              {/* Ocupação Máxima Atendível - Barra separada de referência */}
              <Bar
                dataKey="Ocupação Máxima Atendível"
                fill={barConfig[1].color}
                barSize={view === "global" ? 80 : 40}
                radius={[4, 4, 0, 0]}
                name={barConfig[1].label}
                opacity={0.6}
              />
            </ComposedChart>
          </ResponsiveContainer>
          {/* <GraficoOcupacao /> */}
        </div>

        <div className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                {barConfig.map((bar) => (
                  <TableHead key={bar.key} className="text-center text-xs">
                    {bar.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Taxa de ocupação atual baseada nos leitos ocupados"
                >
                  {summary["Taxa de Ocupação"].toFixed(1)}%
                </TableCell>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Capacidade máxima que pode ser atendida com o quadro atual de pessoal"
                >
                  {summary["Ocupação Máxima Atendível"]
                    ? summary["Ocupação Máxima Atendível"].toFixed(1)
                    : "N/A"}
                  %
                </TableCell>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Capacidade produtiva padrão (100%)"
                >
                  {summary["Capacidade Produtiva"].toFixed(0)}%
                </TableCell>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Percentual de capacidade não utilizada"
                >
                  {summary["Ociosidade"].toFixed(1)}%
                </TableCell>
                <TableCell
                  className="text-center font-bold text-2xl text-foreground"
                  title="Percentual de sobrecarga acima da capacidade máxima atendível"
                >
                  {summary["Superlotação"].toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
