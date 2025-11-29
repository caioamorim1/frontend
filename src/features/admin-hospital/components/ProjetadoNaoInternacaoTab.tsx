import { useState, useEffect } from "react";
import {
  UnidadeNaoInternacao,
  getAnaliseNaoInternacao,
  AjustesPayload,
  saveProjetadoFinalNaoInternacao,
  getProjetadoFinalNaoInternacao,
  SitioFuncional,
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
import {
  BarChart3,
  Brain,
  MinusCircle,
  PlusCircle,
  Settings,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { GrupoDeCargos } from "@/components/shared/AnaliseFinanceira";
import { EvaluationsTab } from "@/features/qualitativo/components/EvaluationsTab";
import React from "react";
import { useAlert } from "@/contexts/AlertContext";
import brainIcon from "@/assets/brain_ia.jpg";
import CargoSitioManager from "./CargoSitioManager";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ObservacaoModal, ObservacaoButton } from "./ObservacaoModal";

// Tipos de status disponíveis
const STATUS_OPTIONS = [
  { value: "nao_iniciado", label: "Não iniciado" },
  { value: "andamento_parcial", label: "Em andamento - Entrega Parcial" },
  { value: "concluido_parcial", label: "Concluído - Entrega Parcial" },
  { value: "andamento_final", label: "Em andamento - Entrega Final" },
  { value: "concluido_final", label: "Concluído - Entrega Final" },
];

// Interface para dados adicionais de cada cargo
interface CargoMetadata {
  observacao?: string;
  status?: string;
}
// Componente para o input de ajuste
const AjusteInput = ({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (newValue: number) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-center gap-2">
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={() => onChange(value - 1)}
      disabled={disabled}
    >
      <MinusCircle
        className={`h-5 w-5 ${disabled ? "text-gray-300" : "text-red-500"}`}
      />
    </Button>
    <span
      className={`font-bold text-lg w-8 text-center ${
        disabled ? "text-gray-400" : ""
      }`}
    >
      {value}
    </span>
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={() => onChange(value + 1)}
      disabled={disabled}
    >
      <PlusCircle
        className={`h-5 w-5 ${disabled ? "text-gray-300" : "text-green-500"}`}
      />
    </Button>
  </div>
);

interface ProjetadoNaoInternacaoTabProps {
  unidade: UnidadeNaoInternacao;
}

export default function ProjetadoNaoInternacaoTab({
  unidade,
}: ProjetadoNaoInternacaoTabProps) {
  const { showAlert } = useAlert();
  const params = useParams<{
    hospitalId?: string;
    hospital_id?: string;
    id?: string;
  }>();
  const resolvedHospitalId =
    unidade.hospitalId ||
    params.hospitalId ||
    params.hospital_id ||
    params.id ||
    "";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analiseBase, setAnaliseBase] = useState<GrupoDeCargos[]>([]);
  const [ajustes, setAjustes] = useState<AjustesPayload>({});
  const [metadata, setMetadata] = useState<Record<string, CargoMetadata>>({});
  const [showAvaliarPage, setShowAvaliarPage] = useState(false);
  const [managingSitio, setManagingSitio] = useState<SitioFuncional | null>(
    null
  );
  const [modalObservacao, setModalObservacao] = useState<{
    isOpen: boolean;
    cargoId: string;
    cargoNome: string;
  }>({ isOpen: false, cargoId: "", cargoNome: "" });

  // Função para abrir o modal com dados atualizados do backend
  const handleOpenSitioManager = async (sitio: SitioFuncional) => {
    console.log(
      "🔵 [handleOpenSitioManager] Abrindo modal para sítio:",
      sitio.nome
    );
    console.log(
      "🔵 [handleOpenSitioManager] Distribuições atuais do sítio:",
      sitio.distribuicoes
    );
    try {
      // Recarrega os dados do backend para garantir que temos a versão mais recente
      const analiseData = await getAnaliseNaoInternacao(unidade.id);
      console.log(
        "📥 [handleOpenSitioManager] RESPOSTA COMPLETA DA API:",
        JSON.stringify(analiseData, null, 2)
      );
      console.log(
        "🔵 [handleOpenSitioManager] Dados recebidos do backend:",
        analiseData
      );
      console.log(
        "📋 [handleOpenSitioManager] Tabela de sítios:",
        analiseData?.tabela
      );
      if (analiseData && analiseData.tabela) {
        // Encontra o sítio atualizado
        const sitioAtualizado = analiseData.tabela.find(
          (s: any) => s.id === sitio.id
        );
        console.log(
          "🎯 [handleOpenSitioManager] Sítio encontrado na resposta:",
          sitioAtualizado
        );
        if (sitioAtualizado) {
          setManagingSitio(sitioAtualizado as SitioFuncional);
        } else {
          console.warn(
            "⚠️ [handleOpenSitioManager] Sítio não encontrado nos dados atualizados, usando dados locais"
          );
          setManagingSitio(sitio);
        }
      } else {
        console.warn(
          "⚠️ [handleOpenSitioManager] Dados do backend vazios, usando dados locais"
        );
        setManagingSitio(sitio);
      }
    } catch (error) {
      console.error(
        "❌ [handleOpenSitioManager] Erro ao carregar dados atualizados do sítio:",
        error
      );
      // Em caso de erro, abre com os dados que temos
      setManagingSitio(sitio);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const analiseData = await getAnaliseNaoInternacao(unidade.id);

        if (analiseData && analiseData.tabela) {
          setAnaliseBase(analiseData.tabela);
        }

        // Tentar carregar projetado final salvo do backend
        try {
          const saved = await getProjetadoFinalNaoInternacao(unidade.id);
          if (saved && saved.sitios) {
            // Converte estrutura salva para mapa de ajustes (delta relativo ao sistema)
            const novoMapa: AjustesPayload = {};
            const novoMetadata: Record<string, CargoMetadata> = {};

            analiseData?.tabela?.forEach((sitio) => {
              const savedSitio = saved.sitios.find(
                (s: any) => s.sitioId === sitio.id
              );
              if (!savedSitio) return;
              (sitio.cargos || []).forEach((cargo) => {
                const savedCargo = savedSitio.cargos.find(
                  (c: any) => c.cargoId === cargo.cargoId
                );
                if (!savedCargo) return;

                const key = cargo.cargoId + sitio.id;

                // Usa quantidadeAtual como base para todos os cargos
                const base = cargo.quantidadeAtual;
                const delta =
                  Math.max(0, savedCargo.projetadoFinal ?? 0) - base;
                if (delta !== 0) {
                  novoMapa[key] = delta;
                }

                // Carregar metadata (observação e status)
                novoMetadata[key] = {
                  observacao: (savedCargo as any).observacao || "",
                  status: (savedCargo as any).status || "nao_iniciado",
                };
              });
            });
            setAjustes(novoMapa);
            setMetadata(novoMetadata);
          } else {
            setAjustes({});
            setMetadata({});
          }
        } catch {
          // Sem fallback local: mantém ajustes vazios
          setAjustes({});
          setMetadata({});
        }
      } catch (error) {
        showAlert(
          "destructive",
          "Erro",
          "Não foi possível carregar os dados para o ajuste projetado."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [unidade.id]);

  const handleAjusteChange = (cargoId: string, novoValor: number) => {
    setAjustes((prev) => ({ ...prev, [cargoId]: novoValor }));
  };

  const handleObservacaoChange = (cargoId: string, observacao: string) => {
    setMetadata((prev) => ({
      ...prev,
      [cargoId]: { ...prev[cargoId], observacao },
    }));
  };

  const handleStatusChange = (cargoId: string, status: string) => {
    setMetadata((prev) => ({
      ...prev,
      [cargoId]: { ...prev[cargoId], status },
    }));
  };

  const handleOpenObservacaoModal = (cargoId: string, cargoNome: string) => {
    setModalObservacao({ isOpen: true, cargoId, cargoNome });
  };

  const handleSaveObservacao = (observacao: string) => {
    handleObservacaoChange(modalObservacao.cargoId, observacao);
    setModalObservacao({ isOpen: false, cargoId: "", cargoNome: "" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Montar payload padronizado para backend
      const payload: any = {
        hospitalId: resolvedHospitalId,
        unidadeId: unidade.id,
        hospital_id: resolvedHospitalId,
        unidade_id: unidade.id,
        sitios: (analiseBase || []).map((sitio) => ({
          sitioId: sitio.id,
          sitio_id: sitio.id,
          cargos: (sitio.cargos || []).map((cargo) => {
            const key = cargo.cargoId + sitio.id;
            const ajusteAtual = ajustes[key] || 0;
            // Usa quantidadeAtual como base para todos os cargos
            const base = cargo.quantidadeAtual;
            const projetadoFinal = Math.max(0, Math.floor(base + ajusteAtual));
            return {
              cargoId: cargo.cargoId,
              cargo_id: cargo.cargoId,
              projetadoFinal,
              observacao: metadata[key]?.observacao || "",
              status: metadata[key]?.status || "nao_iniciado",
            };
          }),
        })),
      };

      await saveProjetadoFinalNaoInternacao(unidade.id, payload);
      showAlert("success", "Sucesso", "Projetado final salvo com sucesso.");
    } catch (error) {
      showAlert(
        "destructive",
        "Erro",
        "Não foi possível salvar o projetado final."
      );
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
    <>
      {managingSitio && (
        <CargoSitioManager
          sitioId={managingSitio.id}
          sitio={managingSitio}
          onClose={() => {
            setManagingSitio(null);
            // Recarrega os dados após fechar o modal
            const fetchData = async () => {
              setLoading(true);
              try {
                const analiseData = await getAnaliseNaoInternacao(unidade.id);
                if (analiseData && analiseData.tabela) {
                  setAnaliseBase(analiseData.tabela);
                }
              } catch (error) {
                console.error("Erro ao recarregar dados:", error);
              } finally {
                setLoading(false);
              }
            };
            fetchData();
          }}
          onUpdate={() => {
            // Recarrega os dados quando houver atualização
            const fetchData = async () => {
              try {
                const analiseData = await getAnaliseNaoInternacao(unidade.id);
                if (analiseData && analiseData.tabela) {
                  setAnaliseBase(analiseData.tabela);
                }
              } catch (error) {
                console.error("Erro ao recarregar dados:", error);
              }
            };
            fetchData();
          }}
        />
      )}

      {showAvaliarPage ? (
        <EvaluationsTab
          onClose={() => setShowAvaliarPage(false)}
          unidadeNaoInternacao={unidade}
        />
      ) : (
        <Card className="animate-fade-in-down">
          <CardHeader>
            <CardTitle className="mb-3">
              Ajuste Qualitativo do Quadro Projetado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="h-20">
                    <TableHead className="w-[30%]">Função</TableHead>

                    <TableHead className="text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center justify-center">
                          <BarChart3 className="h-7 w-7 text-gray-700" />
                          <span className="ml-2 text-sm font-medium">
                            Atual
                          </span>
                        </div>
                      </div>
                    </TableHead>

                    <TableHead className="text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center justify-center">
                          <img
                            src={brainIcon}
                            alt="Projetado (Sistema)"
                            className="h-10 w-10 object-contain mb-1"
                          />
                          <span className="text-sm font-medium">
                            Projetado (Sistema)
                          </span>
                        </div>
                      </div>
                    </TableHead>

                    <TableHead className="text-center w-[200px]">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center justify-center">
                          <Settings className="h-7 w-7 text-gray-700" />
                          <span className="ml-2 text-sm font-medium">
                            Ajuste Qualitativo
                          </span>
                        </div>
                      </div>
                    </TableHead>

                    <TableHead className="text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center justify-center">
                          <Target className="h-7 w-7 text-gray-700" />
                          <span className="ml-2 text-sm font-medium">
                            Projetado Final
                          </span>
                        </div>
                      </div>
                    </TableHead>

                    <TableHead className="text-center w-[120px]">
                      <span className="text-sm font-medium">Observação</span>
                    </TableHead>

                    <TableHead className="text-center w-[200px]">
                      <span className="text-sm font-medium">Status</span>
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
                            colSpan={1}
                            className="font-semibold text-primary"
                          >
                            {sitio.nome}
                            <span className="ml-2 text-sm text-muted-foreground font-normal">
                              ({cargosDoSitio.length} cargo
                              {cargosDoSitio.length !== 1 ? "s" : ""})
                            </span>
                          </TableCell>
                          <TableCell className="text-center"></TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() =>
                                handleOpenSitioManager(sitio as SitioFuncional)
                              }
                              className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 text-sm"
                              title="Gerar Cálculo"
                            >
                              <Users size={18} />
                              <span>Gerar Cálculo</span>
                            </button>
                          </TableCell>
                          <TableCell colSpan={4}></TableCell>
                        </TableRow>

                        {/* Linhas de Cargos do Sítio */}
                        {cargosDoSitio.map((cargoSitio) => {
                          const idAjusteKey = cargoSitio.cargoId + sitio.id;
                          //const quantidadeAtual = getQuantidadeAtual(cargoSitio.cargoId);
                          const ajusteAtual = ajustes[idAjusteKey] || 0;
                          // Usa quantidadeAtual como base para o ajuste qualitativo (tanto SCP quanto outros)
                          const projetadoFinal =
                            cargoSitio.quantidadeAtual + ajusteAtual;
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
                            <TableRow
                              key={`cargo-${cargoSitio.cargoId}-${sitio.id}`}
                            >
                              <TableCell className="font-medium pl-8">
                                {cargoSitio.cargoNome}
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {cargoSitio.quantidadeAtual}
                              </TableCell>
                              <TableCell className="text-center font-bold">
                                {cargoSitio.isScpCargo
                                  ? cargoSitio.quantidadeProjetada
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <AjusteInput
                                  value={ajusteAtual}
                                  onChange={(novoValor) =>
                                    handleAjusteChange(idAjusteKey, novoValor)
                                  }
                                  disabled={
                                    metadata[idAjusteKey]?.status ===
                                      "concluido_parcial" ||
                                    metadata[idAjusteKey]?.status ===
                                      "concluido_final"
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-center font-bold text-xl text-primary">
                                {projetadoFinal}
                              </TableCell>

                              <TableCell className="text-center">
                                <ObservacaoButton
                                  hasObservacao={
                                    !!metadata[idAjusteKey]?.observacao
                                  }
                                  onClick={() =>
                                    handleOpenObservacaoModal(
                                      idAjusteKey,
                                      cargoSitio.cargoNome
                                    )
                                  }
                                />
                              </TableCell>

                              <TableCell>
                                <Select
                                  value={metadata[idAjusteKey]?.status || ""}
                                  onValueChange={(value) =>
                                    handleStatusChange(idAjusteKey, value)
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione o status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((option) => (
                                      <SelectItem
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {/* Mensagem se não houver cargos no sítio */}
                        {cargosDoSitio.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={7}
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
                        colSpan={7}
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
        </Card>
      )}

      <ObservacaoModal
        isOpen={modalObservacao.isOpen}
        onClose={() =>
          setModalObservacao({ isOpen: false, cargoId: "", cargoNome: "" })
        }
        onSave={handleSaveObservacao}
        initialValue={metadata[modalObservacao.cargoId]?.observacao || ""}
        cargoNome={modalObservacao.cargoNome}
      />
    </>
  );
}
