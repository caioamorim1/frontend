import { useState, useEffect, FormEvent } from "react";
import {
  getScpMetodos,
  createScpMetodo,
  updateScpMetodo,
  deleteScpMetodo,
  ScpMetodo,
  CreateScpMetodoDTO,
} from "@/lib/api";
import { Trash2, Edit, PlusCircle } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import { useAlert } from "@/contexts/AlertContext";

const initialFormState: CreateScpMetodoDTO = {
  key: "",
  title: "",
  description: "",
  questions: [],
  faixas: [],
};

export default function ScpMetodosPage() {
  const { showModal } = useModal();
  const { showAlert } = useAlert();
  const [metodos, setMetodos] = useState<ScpMetodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] =
    useState<Partial<ScpMetodo>>(initialFormState);

  const fetchMetodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScpMetodos();
      setMetodos(data);
    } catch (err) {
      setError("Falha ao carregar os métodos SCP.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetodos();
  }, []);

  const handleEdit = (metodo: ScpMetodo) => {
    setFormData(metodo);
    setIsFormVisible(true);
  };

  const handleAddNew = () => {
    setFormData(initialFormState);
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setFormData(initialFormState);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateFaixas = (faixas: any[]): { ok: boolean; message?: string } => {
    if (!faixas || faixas.length === 0) return { ok: true };
    // Convert to numbers and sort by min
    const normalized = faixas
      .map((f) => ({
        min: Number(f.min),
        max: Number(f.max),
        classe: String(f.classe),
      }))
      .sort((a, b) => a.min - b.min);

    for (let i = 0; i < normalized.length; i++) {
      const f = normalized[i];
      if (!Number.isFinite(f.min) || !Number.isFinite(f.max))
        return {
          ok: false,
          message: "Faixas precisam ter min e max numéricos.",
        };
      if (f.min > f.max)
        return {
          ok: false,
          message: "Em uma faixa, min não pode ser maior que max.",
        };
      if (i > 0) {
        const prev = normalized[i - 1];
        // require contiguous coverage: prev.max + 1 === f.min
        if (f.min !== prev.max + 1)
          return {
            ok: false,
            message:
              "As faixas devem ser contínuas e não se sobrepor. Verifique min/max.",
          };
      }
    }
    return { ok: true };
  };

  const validateQuestions = (
    questions: any[]
  ): { ok: boolean; message?: string } => {
    if (!questions) return { ok: true };
    const keys = new Set<string>();
    for (const q of questions) {
      const key = String(q.key || "").trim();
      if (!key)
        return {
          ok: false,
          message: "Cada questão precisa ter uma key (identificador).",
        };
      if (/\s/.test(key))
        return {
          ok: false,
          message: `Key da questão '${key}' não pode conter espaços.`,
        };
      const lower = key.toLowerCase();
      if (keys.has(lower))
        return {
          ok: false,
          message: `Keys de questões precisam ser únicas: duplicado '${key}'.`,
        };
      keys.add(lower);
      // validate options
      if (!Array.isArray(q.options) || q.options.length === 0)
        return {
          ok: false,
          message: `Questão '${key}' precisa ter pelo menos uma opção.`,
        };
      for (const opt of q.options) {
        if (opt.label === undefined || opt.label === null)
          return { ok: false, message: `Opção sem label na questão '${key}'.` };
        if (!Number.isFinite(Number(opt.value)))
          return {
            ok: false,
            message: `Opção '${opt.label}' na questão '${key}' precisa ter value numérico.`,
          };
      }
    }
    return { ok: true };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    // basic required
    if (!formData.key || !formData.title) {
      setError("Key e título são obrigatórios.");
      return;
    }

    // Validate questions
    const qValidation = validateQuestions(formData.questions as any[]);
    if (!qValidation.ok) {
      setError(qValidation.message);
      return;
    }

    // Validate faixas
    const fValidation = validateFaixas(formData.faixas as any[]);
    if (!fValidation.ok) {
      setError(fValidation.message);
      return;
    }

    // Build payload with correct types and transforms
    const payload: CreateScpMetodoDTO = {
      key: String(formData.key).toUpperCase(),
      title: String(formData.title),
      description: formData.description
        ? String(formData.description)
        : undefined,
      questions: (formData.questions || []).map((q: any) => ({
        key: String(q.key).trim(),
        text: String(q.text || ""),
        options: (q.options || []).map((opt: any) => ({
          label: String(opt.label || ""),
          value: Number(opt.value),
        })),
      })),
      faixas: (formData.faixas || []).map((f: any) => ({
        min: Number(f.min),
        max: Number(f.max),
        classe: String(f.classe),
      })),
    };

    try {
      if (formData.id) {
        await updateScpMetodo(formData.id, payload);
        showAlert("success", "Sucesso", "Método SCP atualizado com sucesso.");
      } else {
        await createScpMetodo(payload);
        showAlert("success", "Sucesso", "Método SCP criado com sucesso.");
      }
      handleCancel();
      fetchMetodos();
    } catch (err) {
      setError(
        formData.id
          ? "Falha ao atualizar o método."
          : "Falha ao criar o método."
      );
      showAlert(
        "destructive",
        "Erro",
        formData.id
          ? "Falha ao atualizar o método."
          : "Falha ao criar o método."
      );
    }
  };

  const handleDelete = async (metodoId: string) => {
    showModal({
      type: "confirm",
      title: "Excluir método SCP",
      message:
        "Tem certeza que deseja excluir este método? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await deleteScpMetodo(metodoId);
          showAlert("success", "Sucesso", "Método SCP excluído com sucesso.");
          fetchMetodos();
        } catch (err) {
          setError("Falha ao excluir o método.");
          showAlert("destructive", "Erro", "Falha ao excluir o método.");
        }
      },
    });
  };

  // Funções para manipular questões e faixas (simplificado, pode ser expandido)
  const addQuestion = () => {
    const newQuestion = {
      key: "",
      text: "",
      options: [{ label: "", value: 0 }],
    };
    setFormData((prev) => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion],
    }));
  };

  const updateQuestion = (index: number, patch: Partial<any>) => {
    setFormData((prev) => {
      const questions = (prev.questions || []).map((q: any, i: number) =>
        i === index ? { ...q, ...patch } : q
      );
      return { ...prev, questions };
    });
  };

  const removeQuestion = (index: number) => {
    setFormData((prev) => {
      const questions = (prev.questions || []).filter(
        (_: any, i: number) => i !== index
      );
      return { ...prev, questions };
    });
  };

  const addQuestionOption = (qIndex: number) => {
    setFormData((prev) => {
      const questions = (prev.questions || []).map((q: any, i: number) => {
        if (i !== qIndex) return q;
        return {
          ...q,
          options: [...(q.options || []), { label: "", value: 0 }],
        };
      });
      return { ...prev, questions };
    });
  };

  const updateQuestionOption = (
    qIndex: number,
    optIndex: number,
    patch: Partial<any>
  ) => {
    setFormData((prev) => {
      const questions = (prev.questions || []).map((q: any, i: number) => {
        if (i !== qIndex) return q;
        const options = (q.options || []).map((o: any, oi: number) =>
          oi === optIndex ? { ...o, ...patch } : o
        );
        return { ...q, options };
      });
      return { ...prev, questions };
    });
  };

  const removeQuestionOption = (qIndex: number, optIndex: number) => {
    setFormData((prev) => {
      const questions = (prev.questions || []).map((q: any, i: number) => {
        if (i !== qIndex) return q;
        const options = (q.options || []).filter(
          (_: any, oi: number) => oi !== optIndex
        );
        return { ...q, options };
      });
      return { ...prev, questions };
    });
  };

  const addFaixa = () => {
    const newFaixa = { min: 0, max: 0, classe: "MINIMOS" };
    setFormData((prev) => ({
      ...prev,
      faixas: [...(prev.faixas || []), newFaixa],
    }));
  };

  const updateFaixa = (index: number, patch: Partial<any>) => {
    setFormData((prev) => {
      const faixas = (prev.faixas || []).map((f: any, i: number) =>
        i === index ? { ...f, ...patch } : f
      );
      return { ...prev, faixas };
    });
  };

  const removeFaixa = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      faixas: (prev.faixas || []).filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          Métodos de Avaliação (SCP)
        </h1>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          {isFormVisible ? "Cancelar" : "+ Novo Método"}
        </button>
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down space-y-4">
          <h2 className="text-xl font-semibold text-primary">
            {formData.id ? "Editar Método" : "Adicionar Novo Método"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="key"
                value={formData.key || ""}
                onChange={handleChange}
                placeholder="Chave (ex: FUGULIN)"
                required
                className="p-2 border rounded-md"
              />
              <input
                name="title"
                value={formData.title || ""}
                onChange={handleChange}
                placeholder="Título (ex: Escala de Fugulin)"
                required
                className="p-2 border rounded-md"
              />
            </div>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Descrição"
              rows={2}
              className="w-full p-2 border rounded-md"
            />

            {/* UI Simplificada para questões e faixas */}
            <div className="space-y-2">
              <h3 className="font-medium">Questões</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="text-sm text-secondary flex items-center gap-1"
              >
                <PlusCircle size={16} /> Adicionar Questão
              </button>
              {formData.questions?.map((q: any, i: number) => (
                <div key={i} className="p-3 bg-gray-50 rounded space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 p-2 border rounded"
                      placeholder="Chave (ex: Q1)"
                      value={q.key || ""}
                      onChange={(e) =>
                        updateQuestion(i, { key: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeQuestion(i)}
                      className="text-red-600"
                    >
                      Remover
                    </button>
                  </div>
                  <input
                    className="w-full p-2 border rounded"
                    placeholder="Texto da questão"
                    value={q.text || ""}
                    onChange={(e) =>
                      updateQuestion(i, { text: e.target.value })
                    }
                  />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <small className="text-gray-500">Opções</small>
                      <button
                        type="button"
                        onClick={() => addQuestionOption(i)}
                        className="text-sm text-secondary"
                      >
                        Adicionar Opção
                      </button>
                    </div>
                    {(q.options || []).map((opt: any, oi: number) => (
                      <div key={oi} className="flex gap-2">
                        <input
                          className="flex-1 p-1 border rounded"
                          placeholder="Label"
                          value={opt.label || ""}
                          onChange={(e) =>
                            updateQuestionOption(i, oi, {
                              label: e.target.value,
                            })
                          }
                        />
                        <input
                          className="w-16 p-1 border rounded"
                          placeholder="Valor"
                          type="number"
                          value={opt.value ?? 0}
                          onChange={(e) =>
                            updateQuestionOption(i, oi, {
                              value: Number(e.target.value),
                            })
                          }
                        />
                        <button
                          type="button"
                          onClick={() => removeQuestionOption(i, oi)}
                          className="text-red-600"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Faixas de Classificação</h3>
              <button
                type="button"
                onClick={addFaixa}
                className="text-sm text-secondary flex items-center gap-1"
              >
                <PlusCircle size={16} /> Adicionar Faixa
              </button>
              {formData.faixas?.map((f: any, i: number) => (
                <div key={i} className="p-3 bg-gray-50 rounded space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={f.classe || "MINIMOS"}
                      onChange={(e) =>
                        updateFaixa(i, { classe: e.target.value })
                      }
                      className="p-2 border rounded"
                    >
                      <option value="MINIMOS">Mínimos</option>
                      <option value="INTERMEDIARIOS">Intermediários</option>
                      <option value="ALTA_DEPENDENCIA">Alta Dependência</option>
                      <option value="SEMI_INTENSIVOS">Semi-Intensivos</option>
                      <option value="INTENSIVOS">Intensivos</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeFaixa(i)}
                      className="text-red-600"
                    >
                      Remover
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 p-2 border rounded"
                      type="number"
                      value={f.min ?? 0}
                      onChange={(e) =>
                        updateFaixa(i, { min: Number(e.target.value) })
                      }
                    />
                    <input
                      className="flex-1 p-2 border rounded"
                      type="number"
                      value={f.max ?? 0}
                      onChange={(e) =>
                        updateFaixa(i, { max: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border">
        {loading && <p>Carregando...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Chave
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metodos.map((metodo) => (
                <tr key={metodo.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {metodo.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {metodo.key}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button
                      onClick={() => handleEdit(metodo)}
                      className="text-secondary hover:opacity-70"
                    >
                      <Edit size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(metodo.id)}
                      className="text-red-600 hover:opacity-70"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
