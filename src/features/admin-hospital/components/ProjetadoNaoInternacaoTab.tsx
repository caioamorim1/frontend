import { useState, useEffect } from "react";
import {
  UnidadeNaoInternacao,
  getAnaliseNaoInternacao,
  AjustesPayload,
} from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MinusCircle, PlusCircle } from "lucide-react";
import { GrupoDeCargos } from "@/components/shared/AnaliseFinanceira";

// Componente para o input de ajuste
const AjusteInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (newValue: number) => void;
}) => (
  <div className="flex items-center justify-center gap-2">
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={() => onChange(value - 1)}
    >
      <MinusCircle className="h-5 w-5 text-red-500" />
    </Button>
    <span className="font-bold text-lg w-8 text-center">{value}</span>
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={() => onChange(value + 1)}
    >
      <PlusCircle className="h-5 w-5 text-green-500" />
    </Button>
  </div>
);

interface ProjetadoNaoInternacaoTabProps {
  unidade: UnidadeNaoInternacao;
}

export default function ProjetadoNaoInternacaoTab({
  unidade,
}: ProjetadoNaoInternacaoTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analiseBase, setAnaliseBase] = useState<GrupoDeCargos[]>([]);
  const [ajustes, setAjustes] = useState<AjustesPayload>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const analiseData = await getAnaliseNaoInternacao(unidade.id);

        if (analiseData && analiseData.tabela) {
          setAnaliseBase(analiseData.tabela);
        }

        // Buscar ajustes salvos do localStorage
        const mockAjustes = localStorage.getItem(
          `ajustes_nao_internacao_${unidade.id}`
        );
        if (mockAjustes) {
          setAjustes(JSON.parse(mockAjustes));
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro",
          description:
            "Não foi possível carregar os dados para o ajuste projetado.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [unidade.id, toast]);

  const handleAjusteChange = (cargoId: string, novoValor: number) => {
    setAjustes((prev) => ({ ...prev, [cargoId]: novoValor }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Salvar no localStorage (simulação)
      localStorage.setItem(
        `ajustes_nao_internacao_${unidade.id}`,
        JSON.stringify(ajustes)
      );
      toast({
        title: "Sucesso!",
        description: "Ajustes qualitativos salvos com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar os ajustes.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  // Agrupar todos os cargos de todos os grupos em uma lista única
  const todasAsLinhas = analiseBase.flatMap((grupo) =>
    grupo.cargos.map((cargo) => ({
      cargoId: cargo.cargoId,
      cargoNome: cargo.cargoNome,
      quantidadeProjetada: cargo.quantidadeProjetada,
    }))
  );

  return (
    <Card className="animate-fade-in-down">
      <CardHeader>
        <CardTitle>Ajuste Qualitativo do Quadro Projetado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Função</TableHead>
                <TableHead className="text-center">
                  Projetado (Sistema)
                </TableHead>
                <TableHead className="text-center w-[200px]">
                  Ajuste Qualitativo
                </TableHead>
                <TableHead className="text-center">Projetado Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todasAsLinhas.map((linha) => {
                const ajusteAtual = ajustes[linha.cargoId] || 0;
                const projetadoFinal = linha.quantidadeProjetada + ajusteAtual;
                return (
                  <TableRow key={linha.cargoId}>
                    <TableCell className="font-medium">
                      {linha.cargoNome}
                    </TableCell>
                    <TableCell className="text-center font-medium text-gray-600">
                      {linha.quantidadeProjetada}
                    </TableCell>
                    <TableCell>
                      <AjusteInput
                        value={ajusteAtual}
                        onChange={(novoValor) =>
                          handleAjusteChange(linha.cargoId, novoValor)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-center font-bold text-xl text-primary">
                      {projetadoFinal}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Ajustes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
