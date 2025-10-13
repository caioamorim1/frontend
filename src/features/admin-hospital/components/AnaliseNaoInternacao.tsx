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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Users, TrendingUp, Info } from "lucide-react";

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
        console.log("=== DADOS DA ANÁLISE ===");
        console.log("Tabela recebida:", data.tabela);
        data.tabela.forEach((grupo, idx) => {
          console.log(
            `Grupo ${idx} (${grupo.nome}):`,
            grupo.cargos.map((c) => ({
              nome: c.cargoNome,
              id: c.cargoId,
              qtdAtual: c.quantidadeAtual,
              qtdProjetada: c.quantidadeProjetada,
            }))
          );
        });
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
    <div className="animate-fade-in-down space-y-6">
      {/* Breakdown por Sítio */}
      {analiseData?.distribuicao && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Sítio Funcional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analiseData.distribuicao.porSitio.map((dist, idx) => (
                <div
                  key={`${dist.sitioId}-${dist.categoria}-${idx}`}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <span className="font-semibold">{dist.sitioNome}</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        dist.categoria === "ENF"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {dist.categoria === "ENF" ? "Enfermeiros" : "Técnicos"}
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <div>Seg-Sex: {dist.totalSemana}</div>
                    <div>Sab-Dom: {dist.totalFimSemana}</div>
                    <div className="font-bold">Total: {dist.total}</div>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Enfermeiros</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {analiseData.distribuicao.totais.enfermeiro}
                  </div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total Técnicos</div>
                  <div className="text-2xl font-bold text-green-600">
                    {analiseData.distribuicao.totais.tecnico}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análise Financeira */}
      <AnaliseFinanceira
        tipo="nao-internacao"
        dados={tabelaData}
        horasExtrasProjetadas={analiseData?.horasExtrasProjetadas || 0}
        onQuantidadeChange={handleQuantidadeChange}
      />
    </div>
  );
}
