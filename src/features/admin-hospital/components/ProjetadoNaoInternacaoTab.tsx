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
import { BarChart3, Brain, MinusCircle, PlusCircle, Settings, Target, TrendingUp } from "lucide-react";
import { GrupoDeCargos } from "@/components/shared/AnaliseFinanceira";
import { EvaluationsTab } from "@/features/qualitativo/components/EvaluationsTab";
import React from "react";
import { useAlert } from "@/contexts/AlertContext";
import brainIcon from '@/assets/artificial-intelligence.png';
import target from '@/assets/target.png';
import invite from '@/assets/setting.png';
import barchart from '@/assets/report.png';

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
  const { showAlert } = useAlert()
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analiseBase, setAnaliseBase] = useState<GrupoDeCargos[]>([]);
  const [ajustes, setAjustes] = useState<AjustesPayload>({});
  const [showAvaliarPage, setShowAvaliarPage] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const analiseData = await getAnaliseNaoInternacao(unidade.id);
        console.log("Dados da análise financeira:", analiseData);
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
      showAlert("success", "Sucesso", "Ajustes salvos com sucesso.");
    } catch (error) {
      showAlert("destructive", "Erro", "Não foi possível salvar os ajustes.");

    } finally {
      setSaving(false);
    }
  };

  const handleOpenAvaliar = () => {
    setShowAvaliarPage(true);
  };


  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  // Agrupar todos os cargos e remover duplicatas por cargoId
  const cargosMap = new Map<
    string,
    {
      cargoId: string;
      cargoNome: string;
      quantidadeProjetada: number;
    }
  >();

  analiseBase.forEach((grupo) => {
    grupo.cargos.forEach((cargo) => {
      if (!cargosMap.has(cargo.cargoId)) {
        cargosMap.set(cargo.cargoId, {
          cargoId: cargo.cargoId,
          cargoNome: cargo.cargoNome,
          quantidadeProjetada: cargo.quantidadeProjetada,
        });
      }
    });
  });

  const todasAsLinhas = Array.from(cargosMap.values());

  // Separar cargos que têm projetado (Enfermeiro/Técnico) dos outros
  const cargosComProjetado = todasAsLinhas.filter(
    (cargo) =>
      cargo.cargoNome.toLowerCase().includes("enfermeiro") ||
      cargo.cargoNome.toLowerCase().includes("técnico") ||
      cargo.cargoNome.toLowerCase().includes("tecnico")
  );

  const cargosAtuais = todasAsLinhas.filter(
    (cargo) =>
      !cargo.cargoNome.toLowerCase().includes("enfermeiro") &&
      !cargo.cargoNome.toLowerCase().includes("técnico") &&
      !cargo.cargoNome.toLowerCase().includes("tecnico")
  );

  // Buscar quantidade atual dos sítios para os cargos sem projetado
  const getQuantidadeAtual = (cargoId: string): number => {
    let total = 0;
    unidade.sitiosFuncionais?.forEach((sitio) => {
      sitio.cargosSitio?.forEach((cs) => {
        if (cs.cargoUnidade.cargo.id === cargoId) {
          total += cs.quantidade_funcionarios;
        }
      });
    });
    return total;
  };

  return (
    <>{showAvaliarPage ? (
      <EvaluationsTab
        onClose={() => setShowAvaliarPage(false)}
        unidadeNaoInternacao={unidade}
      />
    ) : (
      <Card className="animate-fade-in-down">
        <CardHeader>
          <CardTitle className="mb-3">Ajuste Qualitativo do Quadro Projetado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="h-20"> {/* aumenta a altura da linha do cabeçalho */}
                  <TableHead className="w-[30%]">Cargo</TableHead>

                  <TableHead className="text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src={barchart}
                        alt="Projetado (Sistema)"
                        className="h-12 w-12 object-contain mb-1"
                      />
                      <span className="text-sm font-medium">Atual</span>
                    </div>
                  </TableHead>

                  <TableHead className="text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src={brainIcon}
                        alt="Projetado (Sistema)"
                        className="h-12 w-12 object-contain mb-1"
                      />
                      <span className="text-sm font-medium">Projetado (Sistema)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src={invite}
                        alt="Projetado (Sistema)"
                        className="h-12 w-12 object-contain mb-1"
                      />
                      <span className="text-sm font-medium">Ajuste Qualitativo</span>
                    </div>
                  </TableHead>

                  <TableHead className="text-center">
                    <div className="flex flex-col items-center justify-center">
                      <img
                        src={target}
                        alt="Projetado (Sistema)"
                        className="h-12 w-12 object-contain mb-1"
                      />
                      <span className="text-sm font-medium">Projetado Final</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Renderizar cargos */}
                {analiseBase.map((sitio) => {
                  const cargosDoSitio = sitio.cargos || [];

                  return (
                    <React.Fragment key={`sitio-fragment-${sitio.id}`}>
                      {/* Linha de Subtítulo do Sítio */}
                      <TableRow
                        key={`sitio-${sitio.id}`}
                        className="bg-muted/50 hover:bg-muted/50"
                      >
                        <TableCell
                          colSpan={2}
                          className="font-semibold text-primary"
                        >
                          {sitio.nome}
                          <span className="ml-2 text-sm text-muted-foreground font-normal">
                            ({cargosDoSitio.length} cargo
                            {cargosDoSitio.length !== 1 ? "s" : ""})
                          </span>
                        </TableCell>
                      </TableRow>

                      {/* Linhas de Cargos do Sítio */}
                      {cargosDoSitio.map((cargoSitio) => {
                        const idAjusteKey = cargoSitio.cargoId + sitio.id;
                        //const quantidadeAtual = getQuantidadeAtual(cargoSitio.cargoId);
                        const ajusteAtual = ajustes[idAjusteKey] || 0;
                        const projetadoFinal = cargoSitio.isScpCargo ? cargoSitio.quantidadeProjetada + ajusteAtual : 0 + ajusteAtual;
                        // const cargo = cargosHospital.find(
                        //   (c) => c.id === cargoSitio.cargoUnidade.cargo.id
                        // );
                        // if (!cargo) return null;

                        // // Busca a quantidade no estado específico do sítio
                        // const cargoNoEstado = cargosSitioState.find(
                        //   (c) => c.sitioId === sitio.id && c.cargoId === cargo.id
                        // );
                        // const quantidade = cargoNoEstado
                        //   ? cargoNoEstado.quantidade_funcionarios
                        //   : cargoSitio.quantidade_funcionarios;

                        return (
                          <TableRow key={`cargo-${cargoSitio.cargoId}-${sitio.id}`}>
                            <TableCell className="font-medium pl-8">
                              {cargoSitio.cargoNome}
                            </TableCell>
                            <TableCell className="text-center font-semibold">
                              {cargoSitio.quantidadeAtual}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {cargoSitio.isScpCargo ? cargoSitio.quantidadeProjetada : '-'}
                            </TableCell>
                            <TableCell>
                              <AjusteInput
                                value={ajusteAtual}
                                onChange={(novoValor) =>
                                  handleAjusteChange(idAjusteKey, novoValor)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center font-bold text-xl text-primary">
                              {projetadoFinal}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Mensagem se não houver cargos no sítio */}
                      {cargosDoSitio.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="text-center text-muted-foreground h-12 pl-8 italic"
                          >
                            Nenhum cargo associado a este sítio.
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}

                {analiseBase.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground h-24"
                    >
                      Nenhum sítio funcional cadastrado nesta unidade.
                    </TableCell>
                  </TableRow>
                )}



              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-6 gap-3">
            <Button onClick={handleOpenAvaliar} disabled={saving}>
              {"Avaliação"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Ajustes"}
            </Button>
          </div>
        </CardContent>
      </Card>)}
    </>
  );
}
