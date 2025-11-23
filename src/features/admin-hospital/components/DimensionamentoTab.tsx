import { useState, useEffect } from "react";
import {
  UnidadeInternacao,
  SessaoAtiva,
  getAnaliseInternacao,
  AnaliseInternacaoResponse,
  getProjetadoFinalInternacao,
} from "@/lib/api";
type LinhaAnalise = AnaliseInternacaoResponse["tabela"][number];
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import AnaliseFinanceira from "@/components/shared/AnaliseFinanceira";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

interface DimensionamentoTabProps {
  unidade: UnidadeInternacao;
  sessoes: SessaoAtiva[];
  dateRange?: { inicio?: string; fim?: string };
}

export default function DimensionamentoTab({
  unidade,
  sessoes,
  dateRange,
}: DimensionamentoTabProps) {
  const [analiseData, setAnaliseData] =
    useState<AnaliseInternacaoResponse | null>(null);
  const [tabelaData, setTabelaData] = useState<LinhaAnalise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buscarDadosAnalise = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAnaliseInternacao(
          unidade.id,
          dateRange && dateRange.inicio && dateRange.fim ? dateRange : undefined
        );
        setAnaliseData(data);

        // Tentar carregar projetado final salvo e sobrepor na coluna "Projetado"
        try {
          const saved = await getProjetadoFinalInternacao(unidade.id);
          
          console.log('=== DIMENSIONAMENTO TAB - DADOS DA TABELA ===');
          console.log('Dados originais da análise:', data?.tabela);
          console.log('Projetado final retornado da API:', saved);
          console.log('=============================================');
          
          if (saved?.cargos?.length) {
            const savedMap = new Map<string, number>();
            saved.cargos.forEach((c: any) => {
              const v = Math.max(0, Math.floor(c.projetadoFinal ?? 0));
              savedMap.set(c.cargoId ?? c.cargo_id, v);
            });
            const ajustada = (data?.tabela ?? []).map((l) => ({
              ...l,
              quantidadeProjetada:
                savedMap.get(l.cargoId) ?? l.quantidadeProjetada,
            }));
            
            console.log('=== DIMENSIONAMENTO TAB - APLICANDO PROJETADO SALVO ===');
            console.log('Mapa de projetados salvos:', Object.fromEntries(savedMap));
            console.log('Dados ajustados para exibição:', ajustada);
            console.log('========================================================');
            
            setTabelaData(ajustada);
          } else {
            console.log('=== DIMENSIONAMENTO TAB - SEM PROJETADO SALVO ===');
            console.log('Usando dados originais da análise');
            console.log('==================================================');
            setTabelaData(data?.tabela ?? []);
          }
        } catch (e) {
          console.log('=== DIMENSIONAMENTO TAB - ERRO AO CARREGAR PROJETADO ===');
          console.log('Erro:', e);
          console.log('Usando dados originais da análise');
          console.log('=========================================================');
          // Se não houver salvo (ex.: 404), usa dados originais
          setTabelaData(data?.tabela ?? []);
        }
      } catch (err: any) {
        const isNotFound =
          err?.response?.status === 404 ||
          /not\s*found/i.test(err?.message ?? "");
        if (isNotFound) {
          setAnaliseData(null);
          setTabelaData([]);
        } else {
          setError("Falha ao carregar os dados da análise de dimensionamento.");
        }
      } finally {
        setLoading(false);
      }
    };
    buscarDadosAnalise();
    // Recarrega quando alterar unidade ou intervalo
  }, [unidade.id, dateRange?.inicio, dateRange?.fim]);

  // A função de handle change é necessária para o componente AnaliseFinanceira,
  // mesmo que não seja usada ativamente para edição nesta aba.
  const handleQuantidadeChange = (cargoId: string, novaQuantidade: number) => {
    setTabelaData((prev) =>
      prev.map((linha) =>
        linha.cargoId === cargoId
          ? { ...linha, quantidadeProjetada: Math.max(0, novaQuantidade) }
          : linha
      )
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  if (!analiseData || tabelaData.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Nenhum dado de análise disponível para esta unidade.</p>
      </div>
    );
  }

  const totalLeitos = unidade.leitos?.length || 0;
  const taxaOcupacaoAtual =
    totalLeitos > 0 ? (sessoes.length / totalLeitos) * 100 : 0;

  const formatDate = (value?: string) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const periodoInicio =
    analiseData?.agregados?.periodo?.inicio ?? dateRange?.inicio ?? undefined;
  const periodoFim =
    analiseData?.agregados?.periodo?.fim ?? dateRange?.fim ?? undefined;

  return (
    <div className="space-y-6 animate-fade-in-down">
      <Card>
        <CardHeader>
          <CardTitle>Dados Atuais</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-500 mt-2">
            <div>
              <p>
                <strong>Período de Análise:</strong> {formatDate(periodoInicio)}{" "}
                a {formatDate(periodoFim)}
              </p>
              <p>
                <strong>Total de Pacientes Atuais:</strong> {sessoes.length}
              </p>
              <p>
                <strong>Taxa de Ocupação Atual:</strong>{" "}
                {taxaOcupacaoAtual.toFixed(2)}%
              </p>
            </div>
            <div>
              <p>
                <strong>Taxa de Ocupação Média (Período):</strong>{" "}
                {(() => {
                  const totalLeitos =
                    analiseData?.agregados?.totalLeitosDia ?? 0;
                  const totalAvaliacoes =
                    analiseData?.agregados?.totalAvaliacoes ?? 0;
                  const taxaMedia =
                    totalLeitos > 0 ? (totalAvaliacoes / totalLeitos) * 100 : 0;
                  return taxaMedia.toFixed(2);
                })()}
                %
              </p>
              <p>
                <strong>Total Leitos-Dia:</strong>{" "}
                {analiseData?.agregados?.totalLeitosDia ?? 0}
              </p>
              <p>
                <strong>Total Avaliações:</strong>{" "}
                {analiseData?.agregados?.totalAvaliacoes ?? 0}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <AnaliseFinanceira
        tipo="internacao"
        dados={tabelaData}
        horasExtrasProjetadas={parseFloat(
          unidade.horas_extra_projetadas || "0"
        )}
        onQuantidadeChange={handleQuantidadeChange}
      />
    </div>
  );
}
