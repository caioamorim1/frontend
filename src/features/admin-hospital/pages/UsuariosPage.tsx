import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  getUsuariosByHospitalId,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  Usuario,
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
} from "@/lib/api";
import { Trash2, Edit } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import { useAlert } from "@/contexts/AlertContext";
import { CpfInput, EmailInput } from "@/components/shared/MaskedInputs";

// O DTO para criação inclui a senha inicial
const initialFormState: Omit<CreateUsuarioDTO, "hospitalId" | "senha"> = {
  nome: "",
  email: "",
  cpf: "",
  permissao: "COMUM",
};

// Tipo de usuário adicional para o frontend (todos enviados como GESTOR ao backend)
type TipoUsuario =
  | "COMUM"
  | "CONSULTOR"
  | "AVALIADOR"
  | "GESTOR_TATICO"
  | "GESTOR_ESTRATEGICO";

export default function UsuariosPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const { showModal } = useModal();
  const { showAlert } = useAlert();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<Usuario>>(initialFormState);
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>("COMUM");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsuarios = async () => {
    if (!hospitalId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUsuariosByHospitalId(hospitalId);
      setUsuarios(data);
    } catch (err) {
      setError("Falha ao carregar os usuários.");
      showAlert("destructive", "Erro", "Falha ao carregar os usuários.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [hospitalId]);

  const handleEdit = (usuario: Usuario) => {
    setFormData(usuario);
    // Mapeia a permissão do backend para o tipo de usuário do frontend
    // Como todos os tipos específicos são enviados como GESTOR, ao editar mostramos GESTOR_ESTRATEGICO
    setTipoUsuario(
      usuario.permissao === "GESTOR" ? "GESTOR_ESTRATEGICO" : "COMUM"
    );
    setIsFormVisible(true);
  };

  const handleAddNew = () => {
    setFormData(initialFormState);
    setTipoUsuario("COMUM");
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setFormData(initialFormState);
    setTipoUsuario("COMUM");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hospitalId) return;

    const cpfDigits = (formData.cpf || "").replace(/\D/g, "");
    // Validar CPF apenas se foi preenchido
    if (cpfDigits.length > 0 && cpfDigits.length !== 11) {
      showAlert(
        "destructive",
        "Erro",
        "CPF incompleto. Preencha os 11 dígitos ou deixe em branco."
      );
      return;
    }

    try {
      if (formData.id) {
        // A lógica de atualização não muda, pois não alteramos a palavra-passe aqui
        const permissaoBackend = tipoUsuario === "COMUM" ? "COMUM" : "GESTOR";
        const updateData: UpdateUsuarioDTO = {
          nome: formData.nome,
          email: formData.email,
          cpf: cpfDigits || undefined,
          permissao: permissaoBackend,
        };
        await updateUsuario(formData.id, updateData);
      } else {
        // Se CPF foi informado, usa como senha inicial; caso contrário, usa uma senha padrão
        const senhaInicial = cpfDigits || "123456";
        // Mapeia tipos de usuário específicos para GESTOR no backend
        const permissaoBackend = tipoUsuario === "COMUM" ? "COMUM" : "GESTOR";
        const createData: CreateUsuarioDTO = {
          hospitalId,
          nome: formData.nome || "",
          email: formData.email || "",
          cpf: cpfDigits || undefined,
          permissao: permissaoBackend,
          senha: senhaInicial,
        };
        await createUsuario(createData);
      }
      handleCancel();
      fetchUsuarios();
      showAlert(
        "success",
        "Sucesso",
        formData.id
          ? "Usuário atualizado com sucesso."
          : "Usuário criado com sucesso."
      );
    } catch (err) {
      setError(
        formData.id
          ? "Falha ao atualizar o utilizador."
          : "Falha ao criar o utilizador."
      );
      showAlert(
        "destructive",
        "Erro",
        formData.id
          ? "Falha ao atualizar o usuário."
          : "Falha ao criar o usuário."
      );
      console.error(err);
    }
  };

  const handleDelete = async (usuarioId: string) => {
    showModal({
      type: "confirm",
      title: "Excluir usuário",
      message:
        "Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await deleteUsuario(usuarioId);
          fetchUsuarios();
          showAlert("success", "Sucesso", "Usuário excluído com sucesso.");
        } catch (err) {
          setError("Falha ao excluir o usuário.");
          showAlert("destructive", "Erro", "Falha ao excluir o usuário.");
          console.error(err);
        }
      },
    });
  };

  // Filtrar usuários baseado na busca
  const filteredUsuarios = usuarios.filter((usuario) => {
    const search = searchTerm.toLowerCase();
    return (
      usuario.nome.toLowerCase().includes(search) ||
      usuario.email.toLowerCase().includes(search) ||
      (usuario.cpf || "").includes(searchTerm)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          Gerenciamento de Usuários
        </h1>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          {isFormVisible ? "Cancelar" : "+ Novo Usuário"}
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white p-4 rounded-lg border">
        <input
          type="text"
          placeholder="Buscar por nome, email ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary"
        />
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold mb-4 text-primary">
              {formData.id ? "Editar Usuário" : "Adicionar Novo Usuário"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="nome"
                value={formData.nome || ""}
                onChange={handleChange}
                placeholder="Nome Completo"
                required
                className="p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
              />
              <EmailInput
                name="email"
                value={formData.email || ""}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, email: val }))
                }
                placeholder="Email"
                required
                className="focus:ring-1 focus:ring-secondary focus:border-secondary"
              />
              <CpfInput
                name="cpf"
                value={formData.cpf || ""}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, cpf: val }))
                }
                placeholder="CPF (opcional)"
                className="focus:ring-1 focus:ring-secondary focus:border-secondary"
              />
              <select
                name="tipoUsuario"
                value={tipoUsuario}
                onChange={(e) => setTipoUsuario(e.target.value as TipoUsuario)}
                className="p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
              >
                <option value="COMUM">Comum</option>
                <option value="CONSULTOR">Consultor</option>
                <option value="AVALIADOR">Avaliador</option>
                <option value="GESTOR_TATICO">Gestor Tático</option>
                <option value="GESTOR_ESTRATEGICO">Gestor Estratégico</option>
              </select>
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
        {loading && <p>A carregar utilizadores...</p>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Permissão
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsuarios.length > 0 ? (
                  filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {usuario.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {usuario.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {usuario.permissao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button
                          onClick={() => handleEdit(usuario)}
                          className="text-secondary hover:opacity-70"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.id)}
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
                      colSpan={4}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      {searchTerm
                        ? "Nenhum usuário encontrado com esse filtro."
                        : "Nenhum utilizador registado."}
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
