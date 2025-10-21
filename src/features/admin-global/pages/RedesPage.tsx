import { useState, useEffect, FormEvent } from "react";
import { getRedes, createRede, updateRede, deleteRede, Rede } from "@/lib/api";
import { Trash2, Edit } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import { useAlert } from "@/contexts/AlertContext";

export default function RedesPage() {
  const { showModal } = useModal();
  const { showAlert } = useAlert();
  const [redes, setRedes] = useState<Rede[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<Rede>>({});

  const fetchRedes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRedes();
      setRedes(data);
    } catch (err) {
      setError("Falha ao carregar as redes.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedes();
  }, []);

  const handleEdit = (rede: Rede) => {
    setFormData(rede);
    setIsFormVisible(true);
  };

  const handleAddNew = () => {
    setFormData({});
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setFormData({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nome?.trim()) return;

    try {
      if (formData.id) {
        await updateRede(formData.id, formData.nome);
        showAlert("success", "Sucesso", "Rede atualizada com sucesso.");
      } else {
        await createRede(formData.nome);
        showAlert("success", "Sucesso", "Rede criada com sucesso.");
      }
      handleCancel();
      fetchRedes();
    } catch (err) {
      setError(
        formData.id ? "Falha ao atualizar a rede." : "Falha ao criar a rede."
      );
      showAlert(
        "destructive",
        "Erro",
        formData.id ? "Falha ao atualizar a rede." : "Falha ao criar a rede."
      );
      console.error(err);
    }
  };

  const handleDelete = async (redeId: string) => {
    showModal({
      type: "confirm",
      title: "Excluir rede",
      message:
        "Tem certeza que deseja excluir esta rede? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await deleteRede(redeId);
          showAlert("success", "Sucesso", "Rede excluída com sucesso.");
          fetchRedes();
        } catch (err) {
          setError("Falha ao excluir a rede.");
          showAlert("destructive", "Erro", "Falha ao excluir a rede.");
          console.error(err);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          Gerenciamento de Redes
        </h1>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          {isFormVisible ? "Cancelar" : "+ Nova Rede"}
        </button>
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold mb-4 text-primary">
              {formData.id ? "Editar Rede" : "Adicionar Nova Rede"}
            </h2>
            <div className="mb-4">
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-gray-700"
              >
                Nome da Rede
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
            <div className="flex justify-end">
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
        {loading && <p>Carregando redes...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {redes.length > 0 ? (
                  redes.map((rede) => (
                    <tr key={rede.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {rede.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button
                          onClick={() => handleEdit(rede)}
                          className="text-secondary hover:opacity-70"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(rede.id)}
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
                      colSpan={2}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      Nenhuma rede cadastrada.
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
