import { useState, useEffect, FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  getHospitais,
  createHospital,
  updateHospital,
  deleteHospital,
  getRegioes,
  Hospital,
  CreateHospitalDTO,
  Regiao,
} from "@/lib/api";
import { Trash2, Edit } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import { useAlert } from "@/contexts/AlertContext";

const initialFormState: Partial<CreateHospitalDTO> = {
  nome: "",
  cnpj: "",
  endereco: "",
  telefone: "",
  regiaoId: "",
};

export default function HospitaisPage() {
  const [hospitais, setHospitais] = useState<Hospital[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showModal } = useModal();
  const { showAlert } = useAlert();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] =
    useState<Partial<Hospital & { regiaoId?: string }>>(initialFormState);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hospitaisData, regioesData] = await Promise.all([
        getHospitais(),
        getRegioes(),
      ]);
      setHospitais(hospitaisData);
      setRegioes(regioesData);
    } catch (err) {
      setError("Falha ao carregar os dados.");
      showAlert("destructive", "Erro", "Falha ao carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (hospital: any) => {
    setFormData({ ...hospital, regiaoId: hospital.regiao?.id });
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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    // Apply masks for specific fields
    const applyMask = (n: string, v: string) => {
      if (n === "cnpj") return formatCNPJ(v);
      if (n === "telefone") return formatPhone(v);
      return v;
    };

    setFormData((prev) => ({ ...prev, [name]: applyMask(name, value) }));
  };

  // Helpers: mask CNPJ (##.###.###/####-##) and Brazilian celular (optional)
  const onlyDigits = (s: string) => (s || "").replace(/\D+/g, "");

  const formatCNPJ = (raw: string) => {
    const d = onlyDigits(raw).slice(0, 14);
    return d
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, "$1/$2")
      .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, "$1-$2");
  };

  const formatPhone = (raw: string) => {
    const d = onlyDigits(raw);
    // Accept up to 11 digits (2 for area + 9 for celular) or 10 for landline
    const p = d.slice(0, 11);
    if (p.length <= 2) return `(${p}`;
    if (p.length <= 6) return `(${p.slice(0, 2)}) ${p.slice(2)}`;
    if (p.length <= 10)
      return `(${p.slice(0, 2)}) ${p.slice(2, 6)}-${p.slice(6)}`;
    // 11 digits (celular): (AA) 9XXXX-XXXX
    return `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const isCnpjComplete = onlyDigits(formData.cnpj || "").length === 14;
    if (!isCnpjComplete) {
      showAlert(
        "destructive",
        "Erro",
        "CNPJ incompleto. Preencha os 14 dígitos antes de salvar."
      );
      return;
    }
    const dataToSubmit = {
      nome: formData.nome || "",
      cnpj: formData.cnpj || "",
      endereco: formData.endereco || "",
      telefone: formData.telefone || "",
      regiaoId: formData.regiaoId || undefined,
    };

    try {
      if (formData.id) {
        await updateHospital(formData.id, dataToSubmit);
        showAlert("success", "Sucesso", "Hospital atualizado com sucesso.");
      } else {
        await createHospital(dataToSubmit as CreateHospitalDTO);
        showAlert("success", "Sucesso", "Hospital criado com sucesso.");
      }
      handleCancel();
      fetchData();
    } catch (err) {
      setError(
        formData.id
          ? "Falha ao atualizar o hospital."
          : "Falha ao criar o hospital."
      );
      showAlert(
        "destructive",
        "Erro",
        formData.id
          ? "Falha ao atualizar o hospital."
          : "Falha ao criar o hospital."
      );
    }
  };

  const handleDelete = async (hospitalId: string) => {
    showModal({
      type: "confirm",
      title: "Excluir hospital",
      message:
        "Tem certeza que deseja excluir este hospital? Esta ação não pode ser desfeita.",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await deleteHospital(hospitalId);
          showAlert("success", "Sucesso", "Hospital excluído com sucesso.");
          fetchData();
        } catch (err) {
          setError("Falha ao excluir o hospital.");
          showAlert("destructive", "Erro", "Falha ao excluir o hospital.");
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          Gerenciamento de Hospitais
        </h1>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          {isFormVisible ? "Cancelar" : "+ Novo Hospital"}
        </button>
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold mb-4 text-primary">
              {formData.id ? "Editar Hospital" : "Adicionar Novo Hospital"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="nome"
                value={formData.nome || ""}
                onChange={handleChange}
                placeholder="Nome do Hospital"
                required
                className="p-2 border rounded-md"
              />
              <input
                name="cnpj"
                value={formData.cnpj || ""}
                onChange={handleChange}
                placeholder="CNPJ"
                required
                className="p-2 border rounded-md"
              />
              <input
                name="endereco"
                value={formData.endereco || ""}
                onChange={handleChange}
                placeholder="Endereço"
                className="p-2 border rounded-md"
              />
              <input
                name="telefone"
                value={formData.telefone || ""}
                onChange={handleChange}
                placeholder="Telefone"
                className="p-2 border rounded-md"
              />
              <select
                name="regiaoId"
                value={formData.regiaoId || ""}
                onChange={handleChange}
                className="p-2 border rounded-md"
              >
                <option value="">Selecione uma Região (Opcional)</option>
                {regioes.map((regiao) => (
                  <option key={regiao.id} value={regiao.id}>
                    {regiao.nome}
                  </option>
                ))}
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
        {loading && <p>A carregar hospitais...</p>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    CNPJ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hospitais.length > 0 ? (
                  hospitais.map((hospital) => (
                    <tr key={hospital.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        <Link
                          to={`/hospital/${hospital.id}/dashboard`}
                          className="text-primary font-semibold hover:underline"
                        >
                          {hospital.nome}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {hospital.cnpj}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {hospital.telefone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button
                          onClick={() => handleEdit(hospital)}
                          className="text-secondary hover:opacity-70"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(hospital.id)}
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
                      Nenhum hospital registado.
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
