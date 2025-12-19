import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  getLeitosByUnidade,
  createLeito,
  updateLeito,
  deleteLeito,
  Leito,
  CreateLeitoDTO,
  UpdateLeitoDTO,
} from "@/lib/api";
import { Trash2, Edit, BedDouble } from "lucide-react";

export default function LeitosAdminPage() {
  const { setorId } = useParams<{ setorId: string }>(); // Renomeado para corresponder à rota
  const [leitos, setLeitos] = useState<Leito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<Leito>>({ numero: "" });

  const fetchLeitos = async () => {
    if (!setorId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getLeitosByUnidade(setorId);
      // Ordenar leitos em ordem crescente pelo número
      const leitosOrdenados = data.sort((a, b) =>
        a.numero.localeCompare(b.numero, undefined, { numeric: true })
      );
      setLeitos(leitosOrdenados);
    } catch (err) {
      setError("Falha ao carregar os leitos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeitos();
  }, [setorId]);

  const handleEdit = (leito: Leito) => {
    setFormData(leito);
    setIsFormVisible(true);
  };

  const handleAddNew = () => {
    setFormData({ numero: "" });
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setFormData({ numero: "" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!setorId || !formData.numero?.trim()) return;

    try {
      if (formData.id) {
        await updateLeito(formData.id, { numero: formData.numero });
      } else {
        await createLeito({ unidadeId: setorId, numero: formData.numero });
      }
      handleCancel();
      fetchLeitos();
    } catch (err) {
      setError(
        formData.id ? "Falha ao atualizar o leito." : "Falha ao criar o leito."
      );
    }
  };

  const handleDelete = async (leitoId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este leito?")) {
      try {
        await deleteLeito(leitoId);
        fetchLeitos();
      } catch (err) {
        setError("Falha ao excluir o leito.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <BedDouble /> Gestão de Leitos
        </h2>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          {isFormVisible ? "Cancelar" : "+ Novo Leito"}
        </button>
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold mb-2 text-primary">
              {formData.id ? "Editar Leito" : "Adicionar Leito"}
            </h3>
            <div className="flex items-end gap-4">
              <div className="flex-grow">
                <label
                  htmlFor="numero"
                  className="block text-sm font-medium text-gray-700"
                >
                  Número/Nome do Leito
                </label>
                <input
                  type="text"
                  id="numero"
                  value={formData.numero || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, numero: e.target.value })
                  }
                  className="mt-1 block w-full p-2 border rounded-md"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 h-10 text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg border">
        {loading && <p>Carregando...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Número
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leitos.map((leito) => (
                <tr key={leito.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                    {leito.numero}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {leito.status}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(leito)}
                      className="text-secondary"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(leito.id)}
                      className="text-red-600"
                    >
                      <Trash2 size={18} />
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
