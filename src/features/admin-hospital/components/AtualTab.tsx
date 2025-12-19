// Gerenciar Quadro de Funcionários - Atual Tab
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Unidade,
  Cargo,
  SitioFuncional,
  getCargosByHospitalId,
  getSitiosFuncionaisByUnidadeId,
  updateUnidadeInternacao,
  updateUnidadeNaoInternacao,
  updateSitioFuncional,
  deleteCargoDeSitio,
  createCargo,
  CreateCargoDTO,
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
import { MinusCircle, PlusCircle, Save, Building2, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CurrencyInput from "@/components/shared/CurrencyInput";

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
  cargoUnidadeId?: string; // ID do CargoUnidade para enviar ao backend
  quantidade_funcionarios: number;
  // Turnos Segunda a Sexta
  seg_sex_manha?: number;
  seg_sex_tarde?: number;
  seg_sex_noite1?: number; // 19h às 01h
  seg_sex_noite2?: number; // 01h às 07h
  // Turnos Sábado e Domingo
  sab_dom_manha?: number;
  sab_dom_tarde?: number;
  sab_dom_noite1?: number; // 19h às 01h
  sab_dom_noite2?: number; // 01h às 07h
}

// Componente para input de turno (menor)
const TurnoInput = ({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (newValue: number) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-center gap-1">
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={() => onChange(Math.max(0, value - 1))}
      disabled={disabled || value <= 0}
    >
      <MinusCircle className="h-4 w-4 text-red-500" />
    </Button>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      disabled={disabled}
      className="w-12 text-center font-semibold border rounded px-1 py-0.5 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
      min="0"
    />
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={() => onChange(value + 1)}
      disabled={disabled}
    >
      <PlusCircle className="h-4 w-4 text-green-500" />
    </Button>
  </div>
);

// Componente para o input de ajuste
const AjusteInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (newValue: number) => void;
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempValue, setTempValue] = React.useState(value.toString());
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const newValue = Math.max(0, parseInt(tempValue) || 0);
    onChange(newValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setTempValue(value.toString());
      setIsEditing(false);
    }
  };

  return (
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
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          min="0"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="font-bold text-lg w-16 text-center border rounded px-1 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <span
          className="font-bold text-lg w-10 text-center cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
          onClick={() => {
            setTempValue(value.toString());
            setIsEditing(true);
          }}
          title="Clique para editar"
        >
          {value}
        </span>
      )}
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
};

export default function AtualTab({
  unidade,
  hospitalId,
  onUpdate,
}: AtualTabProps) {
  const { showAlert } = useAlert();

  // Função auxiliar para calcular total dos turnos
  const calcularTotalTurnos = (cargo: CargoSitioState): number => {
    const turnos = [
      cargo.seg_sex_manha,
      cargo.seg_sex_tarde,
      cargo.seg_sex_noite1,
      cargo.seg_sex_noite2,
      cargo.sab_dom_manha,
      cargo.sab_dom_tarde,
      cargo.sab_dom_noite1,
      cargo.sab_dom_noite2,
    ];
    return turnos.reduce((sum, val) => sum + (val || 0), 0);
  };

  // Verifica se algum turno foi preenchido
  const temTurnosPreenchidos = (cargo: CargoSitioState): boolean => {
    return !!(
      cargo.seg_sex_manha ||
      cargo.seg_sex_tarde ||
      cargo.seg_sex_noite1 ||
      cargo.seg_sex_noite2 ||
      cargo.sab_dom_manha ||
      cargo.sab_dom_tarde ||
      cargo.sab_dom_noite1 ||
      cargo.sab_dom_noite2
    );
  };

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

  // UI controls: per-sítio selection and removed pairs (to hide until saving)
  const [selectedCargoBySitio, setSelectedCargoBySitio] = useState<
    Record<string, string>
  >({});
  const [removedPairs, setRemovedPairs] = useState<Set<string>>(new Set());
  const [removedCargoSitioIds, setRemovedCargoSitioIds] = useState<Set<string>>(
    new Set()
  );

  // Estado para seletor de cargo na unidade de internação
  const [selectedCargoUnidade, setSelectedCargoUnidade] = useState<string>("");

  // Modal de criação de cargo (apenas para Internação)
  const [showAddCargoModal, setShowAddCargoModal] = useState(false);
  const initialCargoForm = {
    nome: "",
    salario: "0",
    carga_horaria: "",
    descricao: "",
    adicionais_tributos: "0",
  } as Partial<Cargo>;
  const [novoCargo, setNovoCargo] = useState<Partial<Cargo>>(initialCargoForm);
  const [savingCargo, setSavingCargo] = useState(false);

  const openAddCargoModal = () => {
    setNovoCargo(initialCargoForm);
    setShowAddCargoModal(true);
  };

  const saveNovoCargo = async () => {
    if (!hospitalId || !novoCargo.nome?.trim()) return;
    try {
      setSavingCargo(true);
      const payload: CreateCargoDTO = {
        hospitalId,
        nome: novoCargo.nome!,
        salario: String(novoCargo.salario ?? "0"),
        carga_horaria: String(novoCargo.carga_horaria ?? ""),
        descricao: novoCargo.descricao ?? "",
        adicionais_tributos: String(novoCargo.adicionais_tributos ?? "0"),
      };
      await createCargo(payload);
      setShowAddCargoModal(false);
      const lista = await getCargosByHospitalId(hospitalId);
      setCargosHospital(lista);
      showAlert("success", "Sucesso", "Cargo criado com sucesso.");
    } catch (e) {
      console.error("Erro ao criar cargo:", e);
      showAlert(
        "destructive",
        "Erro",
        "Falha ao criar o cargo. Tente novamente."
      );
    } finally {
      setSavingCargo(false);
    }
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isNaoInternacao = unidade.tipo === "nao-internacao";

  const getLastAddedLabel = useCallback(
    (backendTimestamp?: Date | string | null) => {
      if (backendTimestamp) {
        const date = new Date(backendTimestamp);
        if (!Number.isNaN(date.getTime())) {
          return date.toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          });
        }
      }
      return "-";
    },
    []
  );

  const hasChanges = useMemo(() => {
    // Para não-internação, compara o estado dos sítios
    if (isNaoInternacao) {
      const baseChanged = !_.isEqual(
        _.sortBy(cargosSitioState, ["sitioId", "cargoId"]),
        _.sortBy(initialSitioState, ["sitioId", "cargoId"])
      );
      return baseChanged || removedPairs.size > 0;
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
    removedPairs,
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
                cargoUnidadeId: cargoSitio.cargoUnidade.id,
                quantidade_funcionarios: cargoSitio.quantidade_funcionarios,
                // Carrega os turnos se existirem
                seg_sex_manha: cargoSitio.seg_sex_manha,
                seg_sex_tarde: cargoSitio.seg_sex_tarde,
                seg_sex_noite1: cargoSitio.seg_sex_noite1,
                seg_sex_noite2: cargoSitio.seg_sex_noite2,
                sab_dom_manha: cargoSitio.sab_dom_manha,
                sab_dom_tarde: cargoSitio.sab_dom_tarde,
                sab_dom_noite1: cargoSitio.sab_dom_noite1,
                sab_dom_noite2: cargoSitio.sab_dom_noite2,
              });
            });
          });

          setCargosSitioState(estadoInicialSitios);
          setInitialSitioState(_.cloneDeep(estadoInicialSitios));
          setRemovedPairs(new Set());
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

  const handleAddCargoToUnidade = () => {
    if (!selectedCargoUnidade) return;

    // Adiciona o cargo com quantidade 0
    setCargosNaUnidade((prev) => {
      // Verifica se já existe
      const jaExiste = prev.find((c) => c.cargoId === selectedCargoUnidade);
      if (jaExiste) {
        return prev;
      }
      return [
        ...prev,
        { cargoId: selectedCargoUnidade, quantidade_funcionarios: 0 },
      ];
    });

    // Limpa a seleção
    setSelectedCargoUnidade("");
  };

  const handleRemoveCargoFromUnidade = (cargoId: string) => {
    setCargosNaUnidade((prev) => prev.filter((c) => c.cargoId !== cargoId));
  };

  const handleQuantidadeChange = (cargoId: string, novaQuantidade: number) => {
    const novaQtd = Math.max(0, novaQuantidade); // Garante que não seja negativo
    const currentEntry = cargosNaUnidade.find((c) => c.cargoId === cargoId);
    const previousQuantidade = currentEntry?.quantidade_funcionarios ?? 0;

    setCargosNaUnidade((prev) => {
      const cargoExistente = prev.find((c) => c.cargoId === cargoId);
      if (cargoExistente) {
        if (novaQtd === 0) {
          return prev.filter((c) => c.cargoId !== cargoId);
        }
        return prev.map((c) =>
          c.cargoId === cargoId ? { ...c, quantidade_funcionarios: novaQtd } : c
        );
      } else if (novaQtd > 0) {
        return [...prev, { cargoId, quantidade_funcionarios: novaQtd }];
      }
      return prev;
    });
  };

  const handleSaveChanges = async () => {
    setSaving(true);

    try {
      if (isNaoInternacao) {
        // Para não-internação, salva por sítio
        // Agrupa mudanças por sítio
        const mudancasPorSitio = _.groupBy(
          cargosSitioState.filter(
            (c) => !removedPairs.has(`${c.sitioId}:${c.cargoId}`)
          ),
          "sitioId"
        );

        // Processa remoções dedicadas primeiro
        for (const cargoSitioId of removedCargoSitioIds) {
          try {
            await deleteCargoDeSitio(cargoSitioId);
          } catch (e) {
            console.warn("Falha ao excluir cargo do sítio", cargoSitioId, e);
          }
        }

        // Atualiza cada sítio
        for (const [sitioId, cargos] of Object.entries(mudancasPorSitio)) {
          const payloadCargos = (cargos as CargoSitioState[]).map((c) => {
            // Se tem turnos preenchidos, envia os turnos (backend calcula total)
            if (temTurnosPreenchidos(c)) {
              return {
                cargoUnidadeId: c.cargoUnidadeId || c.cargoId,
                seg_sex_manha: c.seg_sex_manha || 0,
                seg_sex_tarde: c.seg_sex_tarde || 0,
                seg_sex_noite1: c.seg_sex_noite1 || 0,
                seg_sex_noite2: c.seg_sex_noite2 || 0,
                sab_dom_manha: c.sab_dom_manha || 0,
                sab_dom_tarde: c.sab_dom_tarde || 0,
                sab_dom_noite1: c.sab_dom_noite1 || 0,
                sab_dom_noite2: c.sab_dom_noite2 || 0,
              };
            } else {
              // Se não tem turnos, envia apenas o total
              return {
                cargoUnidadeId: c.cargoUnidadeId || c.cargoId,
                quantidade_funcionarios: c.quantidade_funcionarios,
              };
            }
          });

          await updateSitioFuncional(sitioId, {
            cargos: payloadCargos,
          });
        }
      } else {
        // Para internação, salva normalmente na unidade
        const payloadCargos = cargosNaUnidade.map(({ ...resto }) => resto);

        await updateUnidadeInternacao(unidade.id, {
          cargos_unidade: payloadCargos,
        });
      }

      showAlert("success", "Sucesso", "Alterações salvas com sucesso.");
      onUpdate(); // Recarrega os dados na página pai
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

    const currentEntry = cargosSitioState.find(
      (c) => c.sitioId === sitioId && c.cargoId === cargoId
    );
    const previousQuantidade = currentEntry?.quantidade_funcionarios ?? 0;

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
    // Se o item tinha sido marcado como removido e o usuário ajusta quantidade, desfaz a remoção
    setRemovedPairs((old) => {
      const key = `${sitioId}:${cargoId}`;
      if (old.has(key)) {
        const copy = new Set(old);
        copy.delete(key);
        return copy;
      }
      return old;
    });
  };

  // Função para atualizar um turno específico
  const handleTurnoChange = (
    sitioId: string,
    cargoId: string,
    turno: string,
    valor: number
  ) => {
    setCargosSitioState((prev) =>
      prev.map((c) => {
        if (c.sitioId === sitioId && c.cargoId === cargoId) {
          const updated = { ...c, [turno]: valor };
          // Recalcula o total baseado nos turnos
          updated.quantidade_funcionarios = calcularTotalTurnos(updated);
          return updated;
        }
        return c;
      })
    );
  };

  // Função para atualizar o total diretamente (limpa os turnos)
  const handleTotalChange = (
    sitioId: string,
    cargoId: string,
    total: number
  ) => {
    setCargosSitioState((prev) =>
      prev.map((c) => {
        if (c.sitioId === sitioId && c.cargoId === cargoId) {
          return {
            ...c,
            quantidade_funcionarios: total,
            // Limpa todos os turnos quando editar o total
            seg_sex_manha: undefined,
            seg_sex_tarde: undefined,
            seg_sex_noite1: undefined,
            seg_sex_noite2: undefined,
            sab_dom_manha: undefined,
            sab_dom_tarde: undefined,
            sab_dom_noite1: undefined,
            sab_dom_noite2: undefined,
          };
        }
        return c;
      })
    );
  };

  const handleSelectCargoForSitio = (sitioId: string, cargoId: string) => {
    setSelectedCargoBySitio((prev) => ({ ...prev, [sitioId]: cargoId }));
  };

  const handleAddCargoToSitio = (sitioId: string) => {
    const cargoId = selectedCargoBySitio[sitioId];
    if (!cargoId) return;
    const exists = cargosSitioState.some(
      (c) => c.sitioId === sitioId && c.cargoId === cargoId
    );
    if (!exists) {
      setCargosSitioState((prev) => [
        ...prev,
        { sitioId, cargoSitioId: "", cargoId, quantidade_funcionarios: 0 },
      ]);
    }
    setRemovedPairs((old) => {
      const key = `${sitioId}:${cargoId}`;
      if (old.has(key)) {
        const copy = new Set(old);
        copy.delete(key);
        return copy;
      }
      return old;
    });
    setSelectedCargoBySitio((prev) => ({ ...prev, [sitioId]: "" }));
  };

  const handleRemoveCargoFromSitio = (sitioId: string, cargoId: string) => {
    setRemovedPairs((old) => new Set(old).add(`${sitioId}:${cargoId}`));
    setCargosSitioState((prev) =>
      prev.filter((c) => !(c.sitioId === sitioId && c.cargoId === cargoId))
    );
    // Se existe cargoSitioId original, registra para remoção via API específica
    const existing = initialSitioState.find(
      (c) => c.sitioId === sitioId && c.cargoId === cargoId && c.cargoSitioId
    );
    if (existing && existing.cargoSitioId) {
      setRemovedCargoSitioIds((old) => new Set(old).add(existing.cargoSitioId));
    }
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

          {/* Modal Adicionar Cargo */}
          {showAddCargoModal &&
            createPortal(
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg w-[95%] max-w-3xl relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Adicionar Novo Cargo
                    </h3>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setShowAddCargoModal(false)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nome do Cargo
                      </label>
                      <input
                        type="text"
                        value={novoCargo.nome || ""}
                        onChange={(e) =>
                          setNovoCargo((p) => ({ ...p, nome: e.target.value }))
                        }
                        className="mt-1 block w-full p-2 border rounded-md"
                        placeholder="Ex: Enfermeiro"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Salário (R$)
                      </label>
                      <CurrencyInput
                        value={novoCargo.salario || "0"}
                        onChange={(val) =>
                          setNovoCargo((p) => ({ ...p, salario: val }))
                        }
                        placeholder="R$ 0,00"
                        className="mt-1 block w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Carga Horária (Semanal)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={novoCargo.carga_horaria || ""}
                        onChange={(e) =>
                          setNovoCargo((p) => ({
                            ...p,
                            carga_horaria: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full p-2 border rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Adicionais e Tributos (R$)
                      </label>
                      <CurrencyInput
                        value={novoCargo.adicionais_tributos || "0"}
                        onChange={(val) =>
                          setNovoCargo((p) => ({
                            ...p,
                            adicionais_tributos: val,
                          }))
                        }
                        placeholder="R$ 0,00"
                        className="mt-1 block w-full"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Descrição
                      </label>
                      <textarea
                        rows={3}
                        value={novoCargo.descricao || ""}
                        onChange={(e) =>
                          setNovoCargo((p) => ({
                            ...p,
                            descricao: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      variant="ghost"
                      onClick={() => setShowAddCargoModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={saveNovoCargo} disabled={savingCargo}>
                      {savingCargo ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </div>
      );
    }

    // Caso: existem sítios, renderiza a tabela normal
    return (
      <div className="space-y-6 animate-fade-in-down">
        <Card className="animate-fade-in-down">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="mb-3">
              Gerenciar Quadro de Funcionários por Sítio Funcional
            </CardTitle>
            <div className="mb-3">
              <Button variant="secondary" onClick={openAddCargoModal}>
                + Criar Cargo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      rowSpan={2}
                      className="w-[200px] align-middle border-r"
                    >
                      Cargo
                    </TableHead>
                    <TableHead colSpan={4} className="text-center border-r">
                      SEGUNDA A SEXTA
                    </TableHead>
                    <TableHead colSpan={4} className="text-center border-r">
                      SÁBADO E DOMINGO
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center w-[80px] align-middle border-r"
                    >
                      Total
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center whitespace-nowrap w-[140px] align-middle border-r"
                    >
                      Última Atualização
                    </TableHead>
                    <TableHead
                      rowSpan={2}
                      className="text-center w-[80px] align-middle"
                    >
                      Ações
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    {/* Segunda a Sexta */}
                    <TableHead className="text-center text-xs">Manhã</TableHead>
                    <TableHead className="text-center text-xs">Tarde</TableHead>
                    <TableHead className="text-center text-xs whitespace-nowrap">
                      Noite
                      <br />
                      (19h a 01h)
                    </TableHead>
                    <TableHead className="text-center text-xs border-r whitespace-nowrap">
                      Noite
                      <br />
                      (01h as 07)
                    </TableHead>
                    {/* Sábado e Domingo */}
                    <TableHead className="text-center text-xs">Manhã</TableHead>
                    <TableHead className="text-center text-xs">Tarde</TableHead>
                    <TableHead className="text-center text-xs whitespace-nowrap">
                      Noite
                      <br />
                      (19h a 01h)
                    </TableHead>
                    <TableHead className="text-center text-xs border-r whitespace-nowrap">
                      Noite
                      <br />
                      (01h as 07)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sitiosFuncionais.map((sitio) => {
                    const cargosDoSitio = sitio.cargosSitio || [];

                    // Cargos adicionados localmente (ainda não existem em sitio.cargosSitio)
                    const addedLocal = cargosSitioState.filter(
                      (c) =>
                        c.sitioId === sitio.id &&
                        !cargosDoSitio.some(
                          (cs) => cs.cargoUnidade.cargo.id === c.cargoId
                        )
                    );
                    const renderList = [
                      ...cargosDoSitio.map((cs) => ({
                        source: "existing" as const,
                        cargoId: cs.cargoUnidade.cargo.id,
                        nome:
                          cargosHospital.find(
                            (ch) => ch.id === cs.cargoUnidade.cargo.id
                          )?.nome || cs.cargoUnidade.cargo.nome,
                        quantidadePadrao: cs.quantidade_funcionarios,
                        quantidadeAtualizadaEm: cs.quantidade_atualizada_em,
                      })),
                      ...addedLocal.map((al) => ({
                        source: "local" as const,
                        cargoId: al.cargoId,
                        nome:
                          cargosHospital.find((ch) => ch.id === al.cargoId)
                            ?.nome || "(Novo Cargo)",
                        quantidadePadrao: al.quantidade_funcionarios,
                        quantidadeAtualizadaEm: undefined,
                      })),
                    ].filter(
                      (entry) =>
                        !removedPairs.has(`${sitio.id}:${entry.cargoId}`)
                    );

                    return (
                      <React.Fragment key={`sitio-fragment-${sitio.id}`}>
                        {/* Linha de Subtítulo do Sítio */}
                        <TableRow
                          key={`sitio-${sitio.id}`}
                          className="bg-muted/50 hover:bg-muted/50"
                        >
                          <TableCell
                            colSpan={3}
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
                        {renderList.map((entry) => {
                          const cargoId = entry.cargoId;
                          const cargoNoEstado = cargosSitioState.find(
                            (c) =>
                              c.sitioId === sitio.id && c.cargoId === cargoId
                          );
                          const quantidade = cargoNoEstado
                            ? cargoNoEstado.quantidade_funcionarios
                            : entry.quantidadePadrao;
                          const lastAddedLabel = getLastAddedLabel(
                            entry.quantidadeAtualizadaEm
                          );

                          // Verifica se tem turnos preenchidos
                          const temTurnos = cargoNoEstado
                            ? temTurnosPreenchidos(cargoNoEstado)
                            : false;

                          return (
                            <TableRow key={`cargo-${cargoId}-${sitio.id}`}>
                              <TableCell className="font-medium pl-8 border-r">
                                {entry.nome}
                              </TableCell>

                              {/* Segunda a Sexta - Manhã */}
                              <TableCell>
                                <TurnoInput
                                  value={cargoNoEstado?.seg_sex_manha || 0}
                                  onChange={(val) =>
                                    handleTurnoChange(
                                      sitio.id,
                                      cargoId,
                                      "seg_sex_manha",
                                      val
                                    )
                                  }
                                  disabled={!temTurnos && quantidade > 0}
                                />
                              </TableCell>

                              {/* Segunda a Sexta - Tarde */}
                              <TableCell>
                                <TurnoInput
                                  value={cargoNoEstado?.seg_sex_tarde || 0}
                                  onChange={(val) =>
                                    handleTurnoChange(
                                      sitio.id,
                                      cargoId,
                                      "seg_sex_tarde",
                                      val
                                    )
                                  }
                                  disabled={!temTurnos && quantidade > 0}
                                />
                              </TableCell>

                              {/* Segunda a Sexta - Noite 19h-01h */}
                              <TableCell>
                                <TurnoInput
                                  value={cargoNoEstado?.seg_sex_noite1 || 0}
                                  onChange={(val) =>
                                    handleTurnoChange(
                                      sitio.id,
                                      cargoId,
                                      "seg_sex_noite1",
                                      val
                                    )
                                  }
                                  disabled={!temTurnos && quantidade > 0}
                                />
                              </TableCell>

                              {/* Segunda a Sexta - Noite 01h-07h */}
                              <TableCell className="border-r">
                                <TurnoInput
                                  value={cargoNoEstado?.seg_sex_noite2 || 0}
                                  onChange={(val) =>
                                    handleTurnoChange(
                                      sitio.id,
                                      cargoId,
                                      "seg_sex_noite2",
                                      val
                                    )
                                  }
                                  disabled={!temTurnos && quantidade > 0}
                                />
                              </TableCell>

                              {/* Sábado e Domingo - Manhã */}
                              <TableCell>
                                <TurnoInput
                                  value={cargoNoEstado?.sab_dom_manha || 0}
                                  onChange={(val) =>
                                    handleTurnoChange(
                                      sitio.id,
                                      cargoId,
                                      "sab_dom_manha",
                                      val
                                    )
                                  }
                                  disabled={!temTurnos && quantidade > 0}
                                />
                              </TableCell>

                              {/* Sábado e Domingo - Tarde */}
                              <TableCell>
                                <TurnoInput
                                  value={cargoNoEstado?.sab_dom_tarde || 0}
                                  onChange={(val) =>
                                    handleTurnoChange(
                                      sitio.id,
                                      cargoId,
                                      "sab_dom_tarde",
                                      val
                                    )
                                  }
                                  disabled={!temTurnos && quantidade > 0}
                                />
                              </TableCell>

                              {/* Sábado e Domingo - Noite 19h-01h */}
                              <TableCell>
                                <TurnoInput
                                  value={cargoNoEstado?.sab_dom_noite1 || 0}
                                  onChange={(val) =>
                                    handleTurnoChange(
                                      sitio.id,
                                      cargoId,
                                      "sab_dom_noite1",
                                      val
                                    )
                                  }
                                  disabled={!temTurnos && quantidade > 0}
                                />
                              </TableCell>

                              {/* Sábado e Domingo - Noite 01h-07h */}
                              <TableCell className="border-r">
                                <TurnoInput
                                  value={cargoNoEstado?.sab_dom_noite2 || 0}
                                  onChange={(val) =>
                                    handleTurnoChange(
                                      sitio.id,
                                      cargoId,
                                      "sab_dom_noite2",
                                      val
                                    )
                                  }
                                  disabled={!temTurnos && quantidade > 0}
                                />
                              </TableCell>

                              {/* Total */}
                              <TableCell className="border-r">
                                <TurnoInput
                                  value={quantidade}
                                  onChange={(val) =>
                                    handleTotalChange(sitio.id, cargoId, val)
                                  }
                                  disabled={temTurnos}
                                />
                              </TableCell>

                              {/* Última Atualização */}
                              <TableCell className="text-center text-sm text-muted-foreground whitespace-nowrap border-r">
                                {lastAddedLabel}
                              </TableCell>

                              {/* Ações */}
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    handleRemoveCargoFromSitio(
                                      sitio.id,
                                      cargoId
                                    )
                                  }
                                  title="Remover cargo do sítio"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {/* Mensagem se não houver cargos no sítio */}
                        {renderList.length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={12}
                              className="text-center text-muted-foreground h-12 pl-8 italic"
                            >
                              Nenhum cargo associado a este sítio.
                            </TableCell>
                          </TableRow>
                        )}

                        {/* Adicionar novo cargo ao sítio */}
                        <TableRow>
                          <TableCell className="pl-8 border-r">
                            <Select
                              value={selectedCargoBySitio[sitio.id] || ""}
                              onValueChange={(val) =>
                                handleSelectCargoForSitio(sitio.id, val)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Adicionar cargo ao sítio..." />
                              </SelectTrigger>
                              <SelectContent>
                                {cargosHospital
                                  .filter(
                                    (c) =>
                                      !renderList.some(
                                        (e) => e.cargoId === c.id
                                      )
                                  )
                                  .map((cargo) => (
                                    <SelectItem key={cargo.id} value={cargo.id}>
                                      {cargo.nome}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          {/* Células vazias para os turnos */}
                          <TableCell className="bg-blue-50/30" />
                          <TableCell className="bg-blue-50/30" />
                          <TableCell className="bg-blue-50/30" />
                          <TableCell className="bg-blue-50/30 border-r" />
                          <TableCell className="bg-green-50/30" />
                          <TableCell className="bg-green-50/30" />
                          <TableCell className="bg-green-50/30" />
                          <TableCell className="bg-green-50/30 border-r" />
                          <TableCell className="text-center border-r">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={!selectedCargoBySitio[sitio.id]}
                              onClick={() => handleAddCargoToSitio(sitio.id)}
                            >
                              Adicionar
                            </Button>
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground border-r">
                            -
                          </TableCell>
                          <TableCell className="text-center">
                            {/* Célula vazia para ações */}
                          </TableCell>
                        </TableRow>
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

        {/* Modal Adicionar Cargo */}
        {showAddCargoModal &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg w-[95%] max-w-3xl relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Adicionar Novo Cargo
                  </h3>
                  <button
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setShowAddCargoModal(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nome do Cargo
                    </label>
                    <input
                      type="text"
                      value={novoCargo.nome || ""}
                      onChange={(e) =>
                        setNovoCargo((p) => ({ ...p, nome: e.target.value }))
                      }
                      className="mt-1 block w-full p-2 border rounded-md"
                      placeholder="Ex: Enfermeiro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Salário (R$)
                    </label>
                    <CurrencyInput
                      value={novoCargo.salario || "0"}
                      onChange={(val) =>
                        setNovoCargo((p) => ({ ...p, salario: val }))
                      }
                      placeholder="R$ 0,00"
                      className="mt-1 block w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Carga Horária (Semanal)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={novoCargo.carga_horaria || ""}
                      onChange={(e) =>
                        setNovoCargo((p) => ({
                          ...p,
                          carga_horaria: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full p-2 border rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Adicionais e Tributos (R$)
                    </label>
                    <CurrencyInput
                      value={novoCargo.adicionais_tributos || "0"}
                      onChange={(val) =>
                        setNovoCargo((p) => ({
                          ...p,
                          adicionais_tributos: val,
                        }))
                      }
                      placeholder="R$ 0,00"
                      className="mt-1 block w-full"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Descrição
                    </label>
                    <textarea
                      rows={3}
                      value={novoCargo.descricao || ""}
                      onChange={(e) =>
                        setNovoCargo((p) => ({
                          ...p,
                          descricao: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full p-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddCargoModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={saveNovoCargo} disabled={savingCargo}>
                    {savingCargo ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }

  // Render padrão para Unidades de Internação (lista simples de cargos)
  return (
    <div className="space-y-6 animate-fade-in-down">
      <Card className="animate-fade-in-down">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="mb-3">
            Gerenciar Quadro de Funcionários
          </CardTitle>
          <div className="mb-3">
            <Button variant="secondary" onClick={openAddCargoModal}>
              + Criar Cargo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Cargo</TableHead>
                  <TableHead className="text-center">Quantidade</TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    Última atualização
                  </TableHead>
                  <TableHead className="text-center w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Mostrar apenas cargos que já estão na unidade */}
                {cargosNaUnidade.map((cargoNaUnidade) => {
                  const cargo = cargosHospital.find(
                    (c) => c.id === cargoNaUnidade.cargoId
                  );
                  if (!cargo) return null;

                  const cargoUnidadeCompleto = unidade.cargos_unidade?.find(
                    (cu) => cu.cargo.id === cargo.id
                  );
                  const lastAddedLabel = getLastAddedLabel(
                    cargoUnidadeCompleto?.quantidade_atualizada_em
                  );

                  return (
                    <TableRow key={cargo.id}>
                      <TableCell className="font-medium">
                        {cargo.nome}
                      </TableCell>
                      <TableCell>
                        <AjusteInput
                          value={cargoNaUnidade.quantidade_funcionarios}
                          onChange={(novaQtd) =>
                            handleQuantidadeChange(cargo.id, novaQtd)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground whitespace-nowrap">
                        {lastAddedLabel}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveCargoFromUnidade(cargo.id)}
                          title="Remover cargo da unidade"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Linha para adicionar novo cargo */}
                <TableRow>
                  <TableCell>
                    <Select
                      value={selectedCargoUnidade}
                      onValueChange={setSelectedCargoUnidade}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um cargo para adicionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cargosHospital
                          .filter(
                            (c) =>
                              !cargosNaUnidade.some((cu) => cu.cargoId === c.id)
                          )
                          .map((cargo) => (
                            <SelectItem key={cargo.id} value={cargo.id}>
                              {cargo.nome}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!selectedCargoUnidade}
                      onClick={handleAddCargoToUnidade}
                    >
                      Adicionar
                    </Button>
                  </TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    -
                  </TableCell>
                  <TableCell className="text-center">
                    {/* Célula vazia para coluna de ações */}
                  </TableCell>
                </TableRow>

                {cargosNaUnidade.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground h-24"
                    >
                      Nenhum cargo adicionado a esta unidade. Use o seletor
                      acima para adicionar cargos.
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

          {/* Modal Adicionar Cargo */}
          {showAddCargoModal &&
            createPortal(
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
                <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-lg w-[95%] max-w-3xl relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Adicionar Novo Cargo
                    </h3>
                    <button
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setShowAddCargoModal(false)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nome do Cargo
                      </label>
                      <input
                        type="text"
                        value={novoCargo.nome || ""}
                        onChange={(e) =>
                          setNovoCargo((p) => ({ ...p, nome: e.target.value }))
                        }
                        className="mt-1 block w-full p-2 border rounded-md"
                        placeholder="Ex: Enfermeiro"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Salário (R$)
                      </label>
                      <CurrencyInput
                        value={novoCargo.salario || "0"}
                        onChange={(val) =>
                          setNovoCargo((p) => ({ ...p, salario: val }))
                        }
                        placeholder="R$ 0,00"
                        className="mt-1 block w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Carga Horária (Semanal)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={novoCargo.carga_horaria || ""}
                        onChange={(e) =>
                          setNovoCargo((p) => ({
                            ...p,
                            carga_horaria: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full p-2 border rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Adicionais e Tributos (R$)
                      </label>
                      <CurrencyInput
                        value={novoCargo.adicionais_tributos || "0"}
                        onChange={(val) =>
                          setNovoCargo((p) => ({
                            ...p,
                            adicionais_tributos: val,
                          }))
                        }
                        placeholder="R$ 0,00"
                        className="mt-1 block w-full"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Descrição
                      </label>
                      <textarea
                        rows={3}
                        value={novoCargo.descricao || ""}
                        onChange={(e) =>
                          setNovoCargo((p) => ({
                            ...p,
                            descricao: e.target.value,
                          }))
                        }
                        className="mt-1 block w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button
                      variant="ghost"
                      onClick={() => setShowAddCargoModal(false)}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={saveNovoCargo} disabled={savingCargo}>
                      {savingCargo ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              </div>,
              document.body
            )}
        </CardContent>
      </Card>
    </div>
  );
}
