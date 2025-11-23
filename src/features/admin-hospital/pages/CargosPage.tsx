import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  getCargosByHospitalId,
  createCargo,
  updateCargo,
  deleteCargo,
  Cargo,
  CreateCargoDTO,
  UpdateCargoDTO,
} from "@/lib/api";
import { Trash2, Edit } from "lucide-react";
import CurrencyInput from "@/components/shared/CurrencyInput";
import { useModal } from "@/contexts/ModalContext";
import { useAlert } from "@/contexts/AlertContext";

const initialFormState: Omit<Cargo, "id"> = {
  nome: "",
  salario: "",
  carga_horaria: "",
  descricao: "",
  adicionais_tributos: "",
};

export default function CargosPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const { showModal } = useModal();
  const { showAlert } = useAlert();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<Cargo>>(initialFormState);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCargos = async () => {
    if (!hospitalId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getCargosByHospitalId(hospitalId);
      setCargos(data);
    } catch (err) {
      setError("Falha ao carregar os cargos.");
      showAlert("destructive", "Erro", "Falha ao carregar os cargos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargos();
  }, [hospitalId]);

  const handleEdit = (cargo: Cargo) => {
    setFormData(cargo);
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
    // Força número na carga horária
    if (name === "carga_horaria") {
      const onlyDigits = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: onlyDigits }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hospitalId || !formData.nome?.trim()) return;

    try {
      if (formData.id) {
        const updateData: UpdateCargoDTO = { ...formData };
        // Normaliza campos monetários (strings numéricas com ponto) e numéricos
        if (updateData.salario !== undefined)
          updateData.salario = String(updateData.salario);
        if (updateData.adicionais_tributos !== undefined)
          updateData.adicionais_tributos = String(
            updateData.adicionais_tributos
          );
        if (updateData.carga_horaria !== undefined)
          updateData.carga_horaria = String(updateData.carga_horaria);
        delete updateData.id;
        await updateCargo(hospitalId, formData.id, updateData);
      } else {
        const createData: CreateCargoDTO = {
          hospitalId,
          ...initialFormState,
          ...formData,
        };
        // Normaliza campos
        if (createData.salario !== undefined)
          createData.salario = String(createData.salario);
        if (createData.adicionais_tributos !== undefined)
          createData.adicionais_tributos = String(
            createData.adicionais_tributos
          );
        if (createData.carga_horaria !== undefined)
          createData.carga_horaria = String(createData.carga_horaria);
        await createCargo(createData);
      }
      handleCancel();
      fetchCargos();
      showAlert(
        "success",
        "Sucesso",
        formData.id
          ? "Cargo atualizado com sucesso."
          : "Cargo criado com sucesso."
      );
    } catch (err) {
      setError(
        formData.id ? "Falha ao atualizar o cargo." : "Falha ao criar o cargo."
      );
      showAlert(
        "destructive",
        "Erro",
        formData.id ? "Falha ao atualizar o cargo." : "Falha ao criar o cargo."
      );
      console.error(err);
    }
  };

  const handleDelete = async (cargoId: string) => {
    if (!hospitalId) return;
    showModal({
      type: "confirm",
      title: "Excluir cargo",
      message:
        "Esta ação não pode ser desfeita. Tem certeza de que deseja excluir este cargo?",
      confirmText: "Excluir",
      cancelText: "Cancelar",
      onConfirm: async () => {
        try {
          await deleteCargo(hospitalId, cargoId);
          fetchCargos();
          showAlert("success", "Sucesso", "Cargo excluído com sucesso.");
        } catch (err) {
          setError("Falha ao excluir o cargo.");
          showAlert("destructive", "Erro", "Falha ao excluir o cargo.");
          console.error(err);
        }
      },
    });
  };

  // Filtrar cargos baseado na busca
  const filteredCargos = cargos.filter((cargo) => {
    const search = searchTerm.toLowerCase();
    return (
      cargo.nome.toLowerCase().includes(search) ||
      (cargo.descricao && cargo.descricao.toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">
          Gerenciamento de Cargos
        </h1>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          {isFormVisible ? "Cancelar" : "+ Novo Cargo"}
        </button>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white p-4 rounded-lg border">
        <input
          type="text"
          placeholder="Buscar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-secondary focus:border-secondary"
        />
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-primary">
              {formData.id ? "Editar Cargo" : "Adicionar Novo Cargo"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome do cargo */}
              <div>
                <label
                  htmlFor="nome"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nome do Cargo
                </label>
                <input
                  type="text"
                  name="nome"
                  id="nome"
                  value={formData.nome || ""}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
                />
              </div>

              {/* Salário (R$) - monetário */}
              <div>
                <label
                  htmlFor="salario"
                  className="block text-sm font-medium text-gray-700"
                >
                  Salário (R$)
                </label>
                <CurrencyInput
                  value={formData.salario || "0"}
                  onChange={(val) =>
                    setFormData((prev) => ({ ...prev, salario: val }))
                  }
                  placeholder="R$ 0,00"
                  className="mt-1 block w-full"
                />
              </div>

              {/* Carga horária - número */}
              <div>
                <label
                  htmlFor="carga_horaria"
                  className="block text-sm font-medium text-gray-700"
                >
                  Carga Horária (horas/mês)
                </label>
                <input
                  type="number"
                  name="carga_horaria"
                  id="carga_horaria"
                  value={formData.carga_horaria || ""}
                  onChange={handleChange}
                  min={0}
                  step={1}
                  className="mt-1 block w-full p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
                />
              </div>

              {/* Adicionais e Tributos (R$) - monetário */}
              <div>
                <label
                  htmlFor="adicionais_tributos"
                  className="block text-sm font-medium text-gray-700"
                >
                  Adicionais e Tributos (R$)
                </label>
                <CurrencyInput
                  value={formData.adicionais_tributos || "0"}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      adicionais_tributos: val,
                    }))
                  }
                  placeholder="R$ 0,00"
                  className="mt-1 block w-full"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="descricao"
                className="block text-sm font-medium text-gray-700"
              >
                Descrição
              </label>
              <textarea
                name="descricao"
                id="descricao"
                value={formData.descricao || ""}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full p-2 border rounded-md focus:ring-1 focus:ring-secondary focus:border-secondary"
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
        {loading && <p>A carregar...</p>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Carga Horária
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Salário
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCargos.length > 0 ? (
                  filteredCargos.map((cargo) => (
                    <tr key={cargo.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {cargo.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cargo.carga_horaria || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {cargo.salario ? `R$ ${cargo.salario}` : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button
                          onClick={() => handleEdit(cargo)}
                          className="text-secondary hover:opacity-70"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(cargo.id)}
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
                        ? "Nenhum cargo encontrado com esse filtro."
                        : "Nenhum cargo registado."}
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
