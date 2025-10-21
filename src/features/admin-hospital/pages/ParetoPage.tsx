// src/features/admin-hospital/pages/ParetoPage.tsx

import { useState, useEffect, FormEvent, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  getBaselinesByHospitalId,
  createBaseline,
  updateBaseline,
  deleteBaseline,
  Baseline,
  CreateBaselineDTO,
  UpdateBaselineDTO,
  SetorBaseline,
  getHospitalById,
  Hospital,
} from "@/lib/api";
import { Trash2, Edit, PlusCircle, TrendingUp, BarChart3 } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import { useAlert } from "@/contexts/AlertContext";
import CurrencyInput from "@/components/shared/CurrencyInput";
import BaselinePareto from "../components/BaselinePareto";

// ✅ REMOVIDO: 'quantidade_funcionarios' do estado inicial
const initialFormState: Omit<Baseline, "id" | "quantidade_funcionarios"> = {
  nome: "",
  custo_total: "0",
  setores: [] as SetorBaseline[],
};

export default function ParetoPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const { showModal } = useModal();
  const { showAlert } = useAlert();
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<Baseline>>(initialFormState);

  const [paretoCollapsed, setParetoCollapsed] = useState(false);

  const fetchBaseline = async () => {
    if (!hospitalId) return;
    setLoading(true);
    setError(null);
    try {
      const hospitalData = await getHospitalById(hospitalId);
      const baselineData = await getBaselinesByHospitalId(hospitalId);

      const baselineObj = Array.isArray(baselineData)
        ? baselineData[0]
        : baselineData;

      const parsedBaseline = baselineObj
        ? {
            ...baselineObj,
            setores: Array.isArray(baselineObj.setores)
              ? baselineObj.setores.map((s: any) => {
                  if (typeof s === "string") {
                    try {
                      return JSON.parse(s);
                    } catch {
                      return s;
                    }
                  }
                  return s;
                })
              : baselineObj.setores ?? [],
          }
        : null;

      setHospital(
        parsedBaseline
          ? { ...hospitalData, baseline: parsedBaseline }
          : hospitalData
      );

      if (parsedBaseline) {
        setBaseline(parsedBaseline);
        setFormData(parsedBaseline);
      } else {
        setBaseline(null);
        setFormData(initialFormState);
        setIsFormVisible(true);
      }
    } catch (err) {
      setError("Falha ao carregar o pareto do hospital.");
      showAlert(
        "destructive",
        "Erro",
        "Falha ao carregar o pareto do hospital."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaseline();
  }, [hospitalId]);

  useEffect(() => {
    const total =
      formData.setores?.reduce(
        (sum, setor) => sum + parseFloat(String(setor.custo) || "0"),
        0
      ) || 0;
    setFormData((prev) => ({ ...prev, custo_total: String(total) }));
  }, [formData.setores]);

  const handleEdit = () => {
    setFormData(baseline || initialFormState);
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    if (baseline) setFormData(baseline);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSetorChange = (
    index: number,
    field: keyof SetorBaseline,
    value: string | boolean
  ) => {
    const novosSetores = [...(formData.setores || [])];
    const setorAtual = novosSetores[index];
    novosSetores[index] = {
      nome: setorAtual?.nome ?? "",
      custo: setorAtual?.custo ?? "0",
      ativo: setorAtual?.ativo ?? true,
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, setores: novosSetores }));
  };

  const addSetor = () => {
    const novosSetores = [
      ...(formData.setores || []),
      { nome: "", custo: "0", ativo: true },
    ];
    setFormData((prev) => ({ ...prev, setores: novosSetores }));
  };

  const removeSetor = (index: number) => {
    const novosSetores = formData.setores?.filter((_, i) => i !== index) || [];
    setFormData((prev) => ({ ...prev, setores: novosSetores }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !formData.nome?.trim()) return;

    try {
      if (baseline) {
        const updateData: UpdateBaselineDTO = {
          ...formData,
          setores: formData.setores ?? [],
        };
        await updateBaseline(baseline.id, updateData);
        showAlert("success", "Sucesso", "Pareto atualizado com sucesso.");
      } else {
        const createData: CreateBaselineDTO = {
          hospitalId,
          nome: formData.nome || "",
          custo_total: formData.custo_total || "0",
          setores: formData.setores ?? [],
          quantidade_funcionarios: 0, // Envia 0 ou omite, dependendo da API
        };
        await createBaseline(createData);
        showAlert("success", "Sucesso", "Pareto criado com sucesso.");
      }
      setIsFormVisible(false);
      fetchBaseline();
    } catch (err) {
      setError(
        baseline ? "Falha ao atualizar o Pareto." : "Falha ao criar o Pareto."
      );
      showAlert(
        "destructive",
        "Erro",
        baseline ? "Falha ao atualizar o Pareto." : "Falha ao criar o Pareto."
      );
    }
  };

  const handleDelete = async () => {
    if (!baseline) return;
    showModal({
      type: "confirm",
      title: "Excluir pareto",
      message:
        "Tem certeza que deseja excluir este pareto? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await deleteBaseline(baseline.id);
          setBaseline(null);
          setFormData(initialFormState);
          setIsFormVisible(true);
          showAlert("success", "Sucesso", "Pareto excluído com sucesso.");
        } catch (err) {
          setError("Falha ao excluir o pareto.");
          showAlert("destructive", "Erro", "Falha ao excluir o Pareto.");
        }
      },
    });
  };

  const custoTotalFormatado = useMemo(() => {
    const total = parseFloat(formData.custo_total || "0") || 0;
    return total.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }, [formData.custo_total]);

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          Gerenciamento de Pareto
        </h1>
        {baseline && !isFormVisible && (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-white bg-destructive rounded-md hover:opacity-90"
            >
              <Trash2 className="inline-block mr-2 h-4 w-4" /> Excluir
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90"
            >
              <Edit className="inline-block mr-2 h-4 w-4" /> Editar Pareto
            </button>
          </div>
        )}
      </div>

      {hospital && baseline && !isFormVisible && (
        <BaselinePareto
          hospital={hospital}
          collapsed={paretoCollapsed}
          onToggle={() => setParetoCollapsed(!paretoCollapsed)}
        />
      )}

      {isFormVisible ? (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold text-primary">
              {baseline ? "Editar Pareto" : "Criar Novo Pareto"}
            </h2>

            {/* ✅ MODIFICADO: Grid agora com 2 colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nome do Pareto
                </label>
                <input
                  name="nome"
                  value={formData.nome || ""}
                  onChange={handleChange}
                  placeholder="Ex: Baseline 2024"
                  required
                  className="p-2 border rounded-md w-full mt-1"
                />
              </div>

              {/* ✅ REMOVIDO: Bloco do input "Qtd. Total de Funcionários" */}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Custo Total (Calculado)
                </label>
                <input
                  title="Custo Total"
                  value={custoTotalFormatado}
                  readOnly
                  className="p-2 border rounded-md w-full mt-1 bg-slate-100 text-gray-600 font-semibold"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                Setores de Custo
              </h3>
              <div className="space-y-3">
                {formData.setores?.map((setor, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr,1fr,auto,auto] gap-3 items-center p-2 rounded-md hover:bg-slate-50"
                  >
                    <input
                      value={setor.nome}
                      onChange={(e) =>
                        handleSetorChange(index, "nome", e.target.value)
                      }
                      placeholder="Nome do Setor"
                      className="p-2 border rounded-md"
                    />
                    <CurrencyInput
                      value={setor.custo || "0"}
                      onChange={(value) =>
                        handleSetorChange(index, "custo", value)
                      }
                    />
                    <button
                      title="Remover Setor"
                      type="button"
                      onClick={() => removeSetor(index)}
                      className="text-red-500 hover:text-red-700 justify-self-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSetor}
                className="mt-4 flex items-center gap-2 text-sm text-secondary hover:underline font-medium"
              >
                <PlusCircle size={18} /> Adicionar Setor
              </button>
            </div>

            <div className="flex justify-end pt-4 border-t gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Salvar Pareto
              </button>
            </div>
          </form>
        </div>
      ) : !baseline && !loading ? (
        <div className="text-center p-10 border-2 border-dashed rounded-lg">
          <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-md font-semibold text-slate-700">
            Nenhum pareto cadastrado para este hospital.
          </h3>
          <p className="text-sm text-slate-500">
            Clique em "Novo Pareto" para começar.
          </p>
          <button
            onClick={() => setIsFormVisible(true)}
            className="mt-4 px-4 py-2 text-white bg-primary rounded-md hover:opacity-90"
          >
            <PlusCircle className="inline-block mr-2 h-4 w-4" /> Criar Novo
            Pareto
          </button>
        </div>
      ) : null}
    </div>
  );
}
