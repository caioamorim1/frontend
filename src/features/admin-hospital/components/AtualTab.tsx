import React, { useState, useEffect, useMemo } from "react";
import {
  Unidade,
  Cargo,
  SitioFuncional,
  getCargosByHospitalId,
  getSitiosFuncionaisByUnidadeId,
  updateUnidadeInternacao,
  updateUnidadeNaoInternacao,
  updateSitioFuncional,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MinusCircle, PlusCircle, Save, Building2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import _ from "lodash"; // Import lodash for deep comparison
import { useAlert } from "@/contexts/AlertContext";

interface AtualTabProps {
  unidade: Unidade;
  hospitalId: string;
  onUpdate: () => void; // Função para recarregar os dados da unidade
}

interface CargoUnidadeState {
  cargoId: string;
  quantidade_funcionarios: number;
}

// Interface para gerenciar quantidades por sítio
interface CargoSitioState {
  sitioId: string;
  cargoSitioId: string;
  cargoId: string;
  quantidade_funcionarios: number;
}

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
      disabled={value <= 0}
    >
      <MinusCircle className="h-5 w-5 text-red-500" />
    </Button>
    <span className="font-bold text-lg w-10 text-center">{value}</span>
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

export default function AtualTab({
  unidade,
  hospitalId,
  onUpdate,
}: AtualTabProps) {
  const { showAlert } = useAlert();

  const [cargosHospital, setCargosHospital] = useState<Cargo[]>([]);
  const [cargosNaUnidade, setCargosNaUnidade] = useState<CargoUnidadeState[]>(
    []
  );
  const [initialState, setInitialState] = useState<CargoUnidadeState[]>([]);
  const [sitiosFuncionais, setSitiosFuncionais] = useState<SitioFuncional[]>(
    []
  );

  // Estado para gerenciar quantidades por sítio
  const [cargosSitioState, setCargosSitioState] = useState<CargoSitioState[]>(
    []
  );
  const [initialSitioState, setInitialSitioState] = useState<CargoSitioState[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isNaoInternacao = unidade.tipo === "nao-internacao";

  const hasChanges = useMemo(() => {
    // Para não-internação, compara o estado dos sítios
    if (isNaoInternacao) {
      return !_.isEqual(
        _.sortBy(cargosSitioState, ["sitioId", "cargoId"]),
        _.sortBy(initialSitioState, ["sitioId", "cargoId"])
      );
    }
    // Para internação, compara o estado da unidade
    return !_.isEqual(
      _.sortBy(cargosNaUnidade, "cargoId"),
      _.sortBy(initialState, "cargoId")
    );
  }, [
    cargosNaUnidade,
    initialState,
    cargosSitioState,
    initialSitioState,
    isNaoInternacao,
  ]);

  useEffect(() => {
    const carregarCargos = async () => {
      setLoading(true);
      try {
        const cargosDoHospital = await getCargosByHospitalId(hospitalId);
        setCargosHospital(cargosDoHospital);

        // Se for não-internação, carregar sítios funcionais
        if (isNaoInternacao) {
          const sitios = await getSitiosFuncionaisByUnidadeId(unidade.id);

          setSitiosFuncionais(sitios);

          // Carrega o estado inicial de cargos por sítio
          const estadoInicialSitios: CargoSitioState[] = [];
          sitios.forEach((sitio) => {
            sitio.cargosSitio?.forEach((cargoSitio) => {
              estadoInicialSitios.push({
                sitioId: sitio.id,
                cargoSitioId: cargoSitio.id,
                cargoId: cargoSitio.cargoUnidade.cargo.id,
                quantidade_funcionarios: cargoSitio.quantidade_funcionarios,
              });
            });
          });

          setCargosSitioState(estadoInicialSitios);
          setInitialSitioState(_.cloneDeep(estadoInicialSitios));
        } else {
          // Para internação, carrega normalmente
          const cargosAtuaisFormatados = (unidade.cargos_unidade || []).map(
            (cu) => ({
              cargoId: cu.cargo.id,
              quantidade_funcionarios: cu.quantidade_funcionarios,
            })
          );

          setCargosNaUnidade(cargosAtuaisFormatados);
          setInitialState(_.cloneDeep(cargosAtuaisFormatados));
        }
      } catch (error) {
        console.error("❌ Erro ao carregar cargos:", error);
        showAlert(
          "destructive",
          "Erro",
          "Falha ao carregar cargos do hospital."
        );
      } finally {
        setLoading(false);
      }
    };
    carregarCargos();
  }, [hospitalId, unidade.cargos_unidade, unidade.id, isNaoInternacao]);

  const handleQuantidadeChange = (cargoId: string, novaQuantidade: number) => {
    const novaQtd = Math.max(0, novaQuantidade); // Garante que não seja negativo

    setCargosNaUnidade((prev) => {
      const cargoExistente = prev.find((c) => c.cargoId === cargoId);
      if (cargoExistente) {
        // Se a nova quantidade for 0, remove o cargo da lista
        if (novaQtd === 0) {
          return prev.filter((c) => c.cargoId !== cargoId);
        }
        // Se já existe, atualiza a quantidade
        return prev.map((c) =>
          c.cargoId === cargoId ? { ...c, quantidade_funcionarios: novaQtd } : c
        );
      } else if (novaQtd > 0) {
        // Se não existe e a quantidade é maior que 0, adiciona
        return [...prev, { cargoId, quantidade_funcionarios: novaQtd }];
      }
      return prev; // Se não mudou, retorna o estado anterior
    });
  };

  const handleSaveChanges = async () => {
    setSaving(true);

    try {
      if (isNaoInternacao) {
        // Para não-internação, salva por sítio
        // Agrupa mudanças por sítio
        const mudancasPorSitio = _.groupBy(cargosSitioState, "sitioId");

        // Atualiza cada sítio
        for (const [sitioId, cargos] of Object.entries(mudancasPorSitio)) {
          const payloadCargos = (cargos as CargoSitioState[]).map((c) => ({
            cargoId: c.cargoId,
            quantidade_funcionarios: c.quantidade_funcionarios,
          }));

          const resultado = await updateSitioFuncional(sitioId, {
            cargos: payloadCargos,
          });
        }
      } else {
        // Para internação, salva normalmente na unidade
        const payloadCargos = cargosNaUnidade.map(({ ...resto }) => resto);

        const resultado = await updateUnidadeInternacao(unidade.id, {
          cargos_unidade: payloadCargos,
        });
      }

      showAlert("success", "Sucesso", "Alterações salvas com sucesso.");
      //onUpdate(); // Recarrega os dados na página pai
    } catch (error: any) {
      console.error("❌ ERRO AO SALVAR:", error);
      console.error("Detalhes do erro:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });

      showAlert(
        "destructive",
        "Erro",
        error.response?.data?.message ||
          "Não foi possível salvar as alterações."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSitioCargoChange = (
    sitioId: string,
    cargoId: string,
    novaQuantidade: number
  ) => {
    const novaQtd = Math.max(0, novaQuantidade);

    setCargosSitioState((prev) => {
      const cargoExistente = prev.find(
        (c) => c.sitioId === sitioId && c.cargoId === cargoId
      );

      if (cargoExistente) {
        // Atualiza a quantidade existente
        const novoEstado = prev.map((c) =>
          c.sitioId === sitioId && c.cargoId === cargoId
            ? { ...c, quantidade_funcionarios: novaQtd }
            : c
        );

        return novoEstado;
      } else if (novaQtd > 0) {
        // Adiciona novo registro (não deveria acontecer normalmente)
        return [
          ...prev,
          {
            sitioId,
            cargoSitioId: "", // Será criado no backend
            cargoId,
            quantidade_funcionarios: novaQtd,
          },
        ];
      }

      return prev;
    });
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  // Render para Unidades de Não-Internação
  if (isNaoInternacao) {
    // Caso: não há sítios funcionais cadastrados -> mostrar mensagem instrutiva
    if (sitiosFuncionais.length === 0) {
      return (
        <div className="space-y-6 animate-fade-in-down">
          <h3 className="font-semibold text-lg text-primary">
            Gerenciar Quadro de Funcionários por Sítio Funcional
          </h3>

          <Card className="border-l-4 border-primary">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-base text-foreground">
                    Ainda não há sítios funcionais
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-muted-foreground">
                    Adicione um sítio funcional antes: crie o primeiro sítio
                    funcional para associar colaboradores a esta unidade.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      );
    }

    // Caso: existem sítios, renderiza a tabela normal
    return (
      <div className="space-y-6 animate-fade-in-down">
        <Card className="animate-fade-in-down">
          <CardHeader>
            <CardTitle className="mb-3">
              Gerenciar Quadro de Funcionários por Sítio Funcional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">Cargo</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sitiosFuncionais.map((sitio) => {
                    const cargosDoSitio = sitio.cargosSitio || [];

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
                          const cargo = cargosHospital.find(
                            (c) => c.id === cargoSitio.cargoUnidade.cargo.id
                          );
                          if (!cargo) return null;

                          // Busca a quantidade no estado específico do sítio
                          const cargoNoEstado = cargosSitioState.find(
                            (c) =>
                              c.sitioId === sitio.id && c.cargoId === cargo.id
                          );
                          const quantidade = cargoNoEstado
                            ? cargoNoEstado.quantidade_funcionarios
                            : cargoSitio.quantidade_funcionarios;

                          return (
                            <TableRow key={`cargo-${cargo.id}-${sitio.id}`}>
                              <TableCell className="font-medium pl-8">
                                {cargo.nome}
                              </TableCell>
                              <TableCell>
                                <AjusteInput
                                  value={quantidade}
                                  onChange={(novaQtd) =>
                                    handleSitioCargoChange(
                                      sitio.id,
                                      cargo.id,
                                      novaQtd
                                    )
                                  }
                                />
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
                </TableBody>
              </Table>
            </div>

            {hasChanges && (
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="shadow-lg animate-in fade-in-0 zoom-in-95"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render padrão para Unidades de Internação (lista simples de cargos)
  return (
    <div className="space-y-6 animate-fade-in-down">
      <Card className="animate-fade-in-down">
        <CardHeader>
          <CardTitle className="mb-3">
            Gerenciar Quadro de Funcionários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Cargo</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargosHospital.map((cargo) => {
                  const naUnidade = cargosNaUnidade.find(
                    (c) => c.cargoId === cargo.id
                  );
                  const quantidade = naUnidade
                    ? naUnidade.quantidade_funcionarios
                    : 0;
                  return (
                    <TableRow key={cargo.id}>
                      <TableCell className="font-medium">
                        {cargo.nome}
                      </TableCell>
                      <TableCell>
                        <AjusteInput
                          value={quantidade}
                          onChange={(novaQtd) =>
                            handleQuantidadeChange(cargo.id, novaQtd)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {cargosHospital.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground h-24"
                    >
                      Nenhum cargo cadastrado neste hospital.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {hasChanges && (
            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSaveChanges}
                disabled={saving}
                className="shadow-lg animate-in fade-in-0 zoom-in-95"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
