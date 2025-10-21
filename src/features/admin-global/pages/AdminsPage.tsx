import { useState, useEffect, FormEvent } from "react";
import { getAdmins, createAdmin, deleteAdmin, Admin } from "@/lib/api";
import { Trash2, ShieldPlus } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import { useAlert } from "@/contexts/AlertContext";

export default function AdminsPage() {
  const { showModal } = useModal();
  const { showAlert } = useAlert();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({ nome: "", email: "", senha: "" });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdmins();
      setAdmins(data);
    } catch (err) {
      setError("Falha ao carregar administradores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createAdmin(formData);
      showAlert("success", "Sucesso", "Administrador criado com sucesso!");
      setFormData({ nome: "", email: "", senha: "" }); // Limpa o formulário
      fetchData(); // Recarrega a lista
    } catch (err) {
      setError(
        "Falha ao criar administrador. Verifique se o e-mail já está em uso."
      );
      showAlert(
        "destructive",
        "Erro",
        "Falha ao criar administrador. Verifique se o e-mail já está em uso."
      );
    }
  };

  const handleDelete = async (id: string) => {
    showModal({
      type: "confirm",
      title: "Excluir administrador",
      message:
        "Tem certeza que deseja excluir este administrador? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await deleteAdmin(id);
          showAlert(
            "success",
            "Sucesso",
            "Administrador excluído com sucesso."
          );
          fetchData();
        } catch (err) {
          setError("Falha ao excluir administrador.");
          showAlert("destructive", "Erro", "Falha ao excluir administrador.");
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">
        Gestão de Administradores Globais
      </h1>

      <div className="bg-white p-6 rounded-lg border">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
            <ShieldPlus size={24} /> Criar Novo Administrador
          </h2>
          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Nome Completo"
              required
              className="p-2 border rounded-md"
            />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email de Acesso"
              required
              className="p-2 border rounded-md"
            />
            <input
              name="senha"
              type="password"
              value={formData.senha}
              onChange={handleChange}
              placeholder="Senha Provisória"
              required
              className="p-2 border rounded-md"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              Criar Administrador
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold text-primary mb-4">
          Administradores Existentes
        </h2>
        {loading && <p>Carregando...</p>}

        {!loading && (
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-4 py-2">{admin.nome}</td>
                  <td className="px-4 py-2">{admin.email}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleDelete(admin.id)}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                      disabled={admins.length <= 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-4 text-sm text-gray-500"
                  >
                    Nenhum administrador encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
