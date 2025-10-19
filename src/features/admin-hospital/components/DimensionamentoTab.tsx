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
}

export default function DimensionamentoTab({
  unidade,
  sessoes,
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
        const data = await getAnaliseInternacao(unidade.id);
        setAnaliseData(data);

        // Tentar carregar projetado final salvo e sobrepor na coluna "Projetado"
        try {
          const saved = await getProjetadoFinalInternacao(unidade.id);
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
            setTabelaData(ajustada);
          } else {
            setTabelaData(data?.tabela ?? []);
          }
        } catch (e) {
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
  }, [unidade.id]);

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

  return (
    <div className="space-y-6 animate-fade-in-down">
      <Card>
        <CardHeader>
          <CardTitle>Dados Agregados e Atuais</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-500 mt-2">
            <div>
              <p>
                <strong>Período de Análise:</strong>{" "}
                {analiseData?.agregados?.periodo?.inicio
                  ? new Date(
                      analiseData.agregados.periodo.inicio
                    ).toLocaleDateString()
                  : "N/A"}{" "}
                a{" "}
                {analiseData?.agregados?.periodo?.fim
                  ? new Date(
                      analiseData.agregados.periodo.fim
                    ).toLocaleDateString()
                  : "N/A"}
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
              <h4 className="font-semibold text-gray-700 mb-1">
                Informações Adicionais:
              </h4>
              <p>
                <strong>Taxa de Ocupação Média (Mês):</strong>{" "}
                {(
                  (analiseData?.agregados?.taxaOcupacaoMensal ?? 0) * 100
                ).toFixed(2)}
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
