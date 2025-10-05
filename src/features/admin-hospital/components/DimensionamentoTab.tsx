import { useState, useEffect } from "react";
import {
  UnidadeInternacao,
  SessaoAtiva,
  getAnaliseInternacao,
  AnaliseInternacaoResponse,
} from "@/lib/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import AnaliseFinanceira, {
  LinhaAnalise,
} from "@/components/shared/AnaliseFinanceira";
import { Skeleton } from "@/components/ui/skeleton";

// Mapeamento para nomes mais amigáveis
const classificationMap: { [key: string]: string } = {
  PCM: "Cuidado Mínimo",
  PCI: "Cuidado Intermediário",
  PADC: "Alta Dependência",
  PCSI: "Semi-Intensivo",
  PCIt: "Intensivo",
};

// Props que este componente espera receber
interface DimensionamentoTabProps {
  unidade: UnidadeInternacao;
  sessoes: SessaoAtiva[];
  onDataChange: () => void;
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
    let mounted = true; // previne setState após unmount
    const buscarDadosAnalise = async () => {
      console.log(
        "[DimensionamentoTab] Iniciando busca de análise para unidade:",
        unidade.id
      );
      if (!mounted) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getAnaliseInternacao(unidade.id);
        console.log("[DimensionamentoTab] Dados recebidos da API:", data);
        console.log("[DimensionamentoTab] Tabela extraída:", data?.tabela);
        if (!mounted) return;
        setAnaliseData(data);
        setTabelaData(data?.tabela ?? []); // fallback seguro
      } catch (err: any) {
        console.error("[DimensionamentoTab] Erro ao buscar dados:", err);
        console.log(
          "[DimensionamentoTab] Status do erro:",
          err?.response?.status
        );
        console.log("[DimensionamentoTab] Mensagem do erro:", err?.message);
        if (!mounted) return;
        // trata 404 / não encontrado como "sem dados" em vez de erro
        const isNotFound =
          err?.response?.status === 404 ||
          /not\s*found/i.test(err?.message ?? "");
        if (isNotFound) {
          console.log("[DimensionamentoTab] Erro 404 - sem dados disponíveis");
          setAnaliseData(null);
          setTabelaData([]);
        } else {
          console.log(
            "[DimensionamentoTab] Erro real - exibindo mensagem de erro"
          );
          setError("Falha ao carregar os dados da análise de dimensionamento.");
        }
      } finally {
        if (mounted) setLoading(false);
        console.log("[DimensionamentoTab] Loading finalizado");
      }
    };

    buscarDadosAnalise();
    return () => {
      mounted = false;
    };
  }, [unidade.id]);

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
    console.log("[DimensionamentoTab] Renderizando skeleton (loading)");
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    console.log("[DimensionamentoTab] Renderizando erro:", error);
    return <p className="text-red-500 text-center">{error}</p>;
  }

  // se não houver dados (ex.: 404 tratado), exibe mensagem amigável
  if (!analiseData || tabelaData.length === 0) {
    console.log(
      "[DimensionamentoTab] Sem dados - analiseData:",
      analiseData,
      "tabelaData:",
      tabelaData
    );
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Nenhum dado de análise disponível para esta unidade.</p>
      </div>
    );
  }

  const totalLeitos = unidade.leitos?.length || 0;
  const taxaOcupacaoAtual =
    totalLeitos > 0 ? (sessoes.length / totalLeitos) * 100 : 0;

  console.log("[DimensionamentoTab] Renderizando componente principal");
  console.log(
    "[DimensionamentoTab] tabelaData para AnaliseFinanceira:",
    tabelaData
  );
  console.log(
    "[DimensionamentoTab] unidade.horas_extra_projetadas:",
    unidade.horas_extra_projetadas
  );
  console.log("[DimensionamentoTab] analiseData completo:", analiseData);

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
              <p>
                <strong>Taxa de Ocupação Média (Mês):</strong>{" "}
                {(
                  (analiseData?.agregados?.taxaOcupacaoMensal ?? 0) * 100
                ).toFixed(2)}
                %
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">
                Informações Adicionais:
              </h4>
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
