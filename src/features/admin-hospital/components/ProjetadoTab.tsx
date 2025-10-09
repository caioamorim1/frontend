import { useState, useEffect } from "react";
import {
  UnidadeInternacao,
  LinhaAnaliseFinanceira,
  getAnaliseInternacao,
  getAjustesQualitativos,
  saveAjustesQualitativos,
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

interface ProjetadoTabProps {
  unidade: UnidadeInternacao;
}

export default function ProjetadoTab({ unidade }: ProjetadoTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analiseBase, setAnaliseBase] = useState<LinhaAnaliseFinanceira[]>([]);
  const [ajustes, setAjustes] = useState<AjustesPayload>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [analiseData, ajustesSalvos] = await Promise.all([
          getAnaliseInternacao(unidade.id),
          getAjustesQualitativos(unidade.id),
        ]);

        if (analiseData && analiseData.tabela) {
          setAnaliseBase(analiseData.tabela);
        }
        if (ajustesSalvos) {
          setAjustes(ajustesSalvos);
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
      await saveAjustesQualitativos(unidade.id, ajustes);
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
              {analiseBase.map((linha) => {
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
