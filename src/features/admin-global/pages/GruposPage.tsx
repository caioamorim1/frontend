import { useState, useEffect, FormEvent } from "react";
import {
  getGrupos,
  createGrupo,
  updateGrupo,
  deleteGrupo,
  getRedes,
  Grupo,
  Rede,
} from "@/lib/api";
import { Trash2, Edit } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";

export default function GruposPage() {
  const { showModal } = useModal();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [redes, setRedes] = useState<Rede[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<{
    id?: string;
    nome?: string;
    redeId?: string;
  }>({});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gruposData, redesData] = await Promise.all([
        getGrupos(),
        getRedes(),
      ]);
      setGrupos(gruposData);
      setRedes(redesData);
    } catch (err) {
      setError("Falha ao carregar dados de grupos e redes.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (grupo: Grupo) => {
    setFormData({ id: grupo.id, nome: grupo.nome, redeId: grupo.rede?.id });
    setIsFormVisible(true);
  };

  const handleAddNew = () => {
    setFormData({ redeId: redes[0]?.id });
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setFormData({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nome?.trim() || !formData.redeId) {
      setError("Nome e Rede são obrigatórios.");
      return;
    }

    try {
      if (formData.id) {
        await updateGrupo(formData.id, {
          nome: formData.nome,
          redeId: formData.redeId,
        });
      } else {
        await createGrupo({ nome: formData.nome, redeId: formData.redeId });
      }
      handleCancel();
      fetchData();
    } catch (err) {
      setError(
        formData.id ? "Falha ao atualizar o grupo." : "Falha ao criar o grupo."
      );
      console.error(err);
    }
  };

  const handleDelete = async (grupoId: string) => {
    showModal({
      type: "confirm",
      title: "Excluir grupo",
      message:
        "Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await deleteGrupo(grupoId);
          fetchData();
        } catch (err) {
          setError("Falha ao excluir o grupo.");
          console.error(err);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          Gerenciamento de Grupos
        </h1>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity disabled:bg-gray-400"
          disabled={redes.length === 0 && !loading}
        >
          {isFormVisible ? "Cancelar" : "+ Novo Grupo"}
        </button>
      </div>

      {redes.length === 0 && !loading && (
        <p className="text-center text-yellow-600 bg-yellow-50 p-4 rounded-md border border-yellow-200">
          É necessário cadastrar pelo menos uma Rede antes de criar um Grupo.
        </p>
      )}

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold mb-4 text-primary">
              {formData.id ? "Editar Grupo" : "Adicionar Novo Grupo"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nome do Grupo
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
                  htmlFor="redeId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Rede
                </label>
                <select
                  id="redeId"
                  value={formData.redeId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, redeId: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
                  required
                >
                  <option value="" disabled>
                    Selecione uma rede
                  </option>
                  {redes.map((rede) => (
                    <option key={rede.id} value={rede.id}>
                      {rede.nome}
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
                    Nome do Grupo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rede Pertencente
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {grupos.length > 0 ? (
                  grupos.map((grupo) => (
                    <tr key={grupo.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {grupo.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {grupo.rede?.nome || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button
                          onClick={() => handleEdit(grupo)}
                          className="text-secondary hover:opacity-70"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(grupo.id)}
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
                      Nenhum grupo cadastrado.
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
