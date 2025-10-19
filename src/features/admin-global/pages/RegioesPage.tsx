import { useState, useEffect, FormEvent } from "react";
import {
  getRegioes,
  createRegiao,
  updateRegiao,
  deleteRegiao,
  getGrupos,
  Regiao,
  Grupo,
  UpdateRegiaoDTO,
} from "@/lib/api";
import { Trash2, Edit } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";

export default function RegioesPage() {
  const { showModal } = useModal();
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<{
    id?: string;
    nome?: string;
    grupoId?: string;
  }>({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [regioesData, gruposData] = await Promise.all([
        getRegioes(),
        getGrupos(),
      ]);
      setRegioes(regioesData);
      setGrupos(gruposData);
    } catch (err) {
      setError("Falha ao carregar dados de regiões e grupos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (regiao: Regiao) => {
    setFormData({
      id: regiao.id,
      nome: regiao.nome,
      grupoId: regiao.grupo?.id,
    });
    setIsFormVisible(true);
  };

  const handleAddNew = () => {
    setFormData({ grupoId: grupos[0]?.id });
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setFormData({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nome?.trim() || !formData.grupoId) {
      setError("Nome e Grupo são obrigatórios.");
      return;
    }

    try {
      if (formData.id) {
        const updateData: UpdateRegiaoDTO = {
          nome: formData.nome,
          grupoId: formData.grupoId,
        };
        await updateRegiao(formData.id, updateData);
      } else {
        await createRegiao({ nome: formData.nome, grupoId: formData.grupoId });
      }
      handleCancel();
      fetchData();
    } catch (err) {
      setError(
        formData.id
          ? "Falha ao atualizar a região."
          : "Falha ao criar a região."
      );
      console.error(err);
    }
  };

  const handleDelete = async (regiaoId: string) => {
    showModal({
      type: "confirm",
      title: "Excluir região",
      message:
        "Tem certeza que deseja excluir esta região? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await deleteRegiao(regiaoId);
          fetchData();
        } catch (err) {
          setError("Falha ao excluir a região.");
          console.error(err);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          Gerenciamento de Regiões
        </h1>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity disabled:bg-gray-400"
          disabled={grupos.length === 0 && !loading}
        >
          {isFormVisible ? "Cancelar" : "+ Nova Região"}
        </button>
      </div>

      {grupos.length === 0 && !loading && (
        <p className="text-center text-yellow-600 bg-yellow-50 p-4 rounded-md border border-yellow-200">
          É necessário cadastrar pelo menos um Grupo antes de criar uma Região.
        </p>
      )}

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold mb-4 text-primary">
              {formData.id ? "Editar Região" : "Adicionar Nova Região"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nome da Região
                </label>
                <input
                  type="text"
                  id="nome"
                  value={formData.nome || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="grupoId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Grupo
                </label>
                <select
                  id="grupoId"
                  value={formData.grupoId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, grupoId: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
                  required
                >
                  <option value="" disabled>
                    Selecione um grupo
                  </option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </option>
                  ))}
                </select>
              </div>
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
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome da Região
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Grupo Pertencente
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {regioes.length > 0 ? (
                  regioes.map((regiao) => (
                    <tr key={regiao.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {regiao.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {regiao.grupo?.nome || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button
                          onClick={() => handleEdit(regiao)}
                          className="text-secondary hover:opacity-70"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(regiao.id)}
                          className="text-red-600 hover:opacity-70"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Nenhuma região cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
