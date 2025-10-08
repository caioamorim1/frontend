import { useState, useEffect } from "react";
import {
  UnidadeNaoInternacao,
  getAnaliseNaoInternacao,
  AnaliseNaoInternacaoResponse,
} from "@/lib/api";
import AnaliseFinanceira, {
  GrupoDeCargos,
} from "@/components/shared/AnaliseFinanceira";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

// Props que este componente espera receber
interface AnaliseNaoInternacaoTabProps {
  unidade: UnidadeNaoInternacao;
}

export default function AnaliseNaoInternacaoTab({
  unidade,
}: AnaliseNaoInternacaoTabProps) {
  const [analiseData, setAnaliseData] =
    useState<AnaliseNaoInternacaoResponse | null>(null);
  const [tabelaData, setTabelaData] = useState<GrupoDeCargos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const buscarDadosAnalise = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAnaliseNaoInternacao(unidade.id);
        setAnaliseData(data);
        setTabelaData(data.tabela); // Inicia a tabela com os dados do backend
      } catch (err) {
        console.error("Erro ao buscar análise de não internação:", err);
        setError("Não foi possível carregar os dados da análise financeira.");
        toast({
          title: "Erro",
          description:
            "Não foi possível carregar os dados da análise financeira.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (unidade.id) {
      buscarDadosAnalise();
    }
  }, [unidade.id]);

  const handleQuantidadeChange = (
    cargoId: string,
    novaQuantidade: number,
    grupoId?: string
  ) => {
    setTabelaData((prevData) =>
      prevData.map((grupo) => {
        if (grupo.id === grupoId) {
          return {
            ...grupo,
            cargos: grupo.cargos.map((cargo) =>
              cargo.cargoId === cargoId
                ? { ...cargo, quantidadeProjetada: Math.max(0, novaQuantidade) }
                : cargo
            ),
          };
        }
        return grupo;
      })
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Erro</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in-down">
      <AnaliseFinanceira
        tipo="nao-internacao"
        dados={tabelaData}
        horasExtrasProjetadas={analiseData?.horasExtrasProjetadas || 0}
        onQuantidadeChange={handleQuantidadeChange}
      />
    </div>
  );
}
