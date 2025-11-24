import { useState, useEffect, FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  getHospitais,
  createHospital,
  updateHospital,
  deleteHospital,
  getRedes,
  getGrupos,
  getRegioes,
  Hospital,
  CreateHospitalDTO,
  Rede,
  Grupo,
  Regiao,
  TipoHospital,
  GestaoHospital,
  PerfilHospital,
  ComplexidadeHospital,
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
  tipo: undefined,
  gestao: undefined,
  perfil: undefined,
  complexidade: undefined,
  numeroTotalLeitos: undefined,
  numeroLeitosUTI: undefined,
  numeroSalasCirurgicas: undefined,
};

export default function HospitaisPage() {
  const [hospitais, setHospitais] = useState<Hospital[]>([]);
  const [redes, setRedes] = useState<Rede[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [regioes, setRegioes] = useState<Regiao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showModal } = useModal();
  const { showAlert } = useAlert();

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] =
    useState<
      Partial<
        Hospital & { redeId?: string; grupoId?: string; regiaoId?: string }
      >
    >(initialFormState);

  // Estados para controlar seleções em cascata
  const [selectedRedeId, setSelectedRedeId] = useState<string>("");
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>("");
  const [filteredGrupos, setFilteredGrupos] = useState<Grupo[]>([]);
  const [filteredRegioes, setFilteredRegioes] = useState<Regiao[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [hospitaisData, redesData, gruposData, regioesData] =
        await Promise.all([
          getHospitais(),
          getRedes(),
          getGrupos(),
          getRegioes(),
        ]);
      setHospitais(hospitaisData);
      setRedes(redesData);
      setGrupos(gruposData);
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
   

    const regiaoId = hospital.regiao?.id;
    const grupoId = hospital.grupo?.id;
    const redeId = hospital.rede?.id;

 

    setFormData({ ...hospital, regiaoId, grupoId, redeId });
    setSelectedRedeId(redeId || "");
    setSelectedGrupoId(grupoId || "");

    // Filtrar grupos e regiões baseado na hierarquia
    if (redeId) {
      const gruposDaRede = grupos.filter((g) => g.rede.id === redeId);

      setFilteredGrupos(gruposDaRede);
    }
    if (grupoId) {
      const regioesDoGrupo = regioes.filter((r) => r.grupo.id === grupoId);
  
      setFilteredRegioes(regioesDoGrupo);
    }

    setIsFormVisible(true);
  };

  const handleAddNew = () => {
    setFormData(initialFormState);
    setSelectedRedeId("");
    setSelectedGrupoId("");
    setFilteredGrupos([]);
    setFilteredRegioes([]);
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setFormData(initialFormState);
    setSelectedRedeId("");
    setSelectedGrupoId("");
    setFilteredGrupos([]);
    setFilteredRegioes([]);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Lógica em cascata para seleção de Rede -> Grupo -> Região
    if (name === "redeId") {
      setSelectedRedeId(value);
      setSelectedGrupoId("");
      setFormData((prev) => ({
        ...prev,
        redeId: value,
        grupoId: "",
        regiaoId: "",
      }));

      // Filtrar grupos da rede selecionada
      const gruposDaRede = grupos.filter((g) => g.rede.id === value);
      setFilteredGrupos(gruposDaRede);
      setFilteredRegioes([]);
    } else if (name === "grupoId") {
      setSelectedGrupoId(value);
      setFormData((prev) => ({ ...prev, grupoId: value, regiaoId: "" }));

      // Filtrar regiões do grupo selecionado
      const regioesDoGrupo = regioes.filter((r) => r.grupo.id === value);
      setFilteredRegioes(regioesDoGrupo);
    } else {
      // Apply masks for specific fields
      const applyMask = (n: string, v: string) => {
        if (n === "cnpj") return formatCNPJ(v);
        if (n === "telefone") return formatPhone(v);
        return v;
      };

      setFormData((prev) => ({ ...prev, [name]: applyMask(name, value) }));
    }
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

    if (!formData.redeId) {
      showAlert(
        "destructive",
        "Erro",
        "A Rede é obrigatória. Por favor, selecione uma Rede."
      );
      return;
    }

    const dataToSubmit = {
      nome: formData.nome || "",
      cnpj: formData.cnpj || "",
      endereco: formData.endereco || "",
      telefone: formData.telefone || "",
      regiaoId: formData.regiaoId || null,
      grupoId: formData.grupoId || null,
      redeId: formData.redeId || null,
      tipo: formData.tipo || undefined,
      gestao: formData.gestao || undefined,
      perfil: formData.perfil || undefined,
      complexidade: formData.complexidade || undefined,
      numeroTotalLeitos: formData.numeroTotalLeitos
        ? Number(formData.numeroTotalLeitos)
        : undefined,
      numeroLeitosUTI: formData.numeroLeitosUTI
        ? Number(formData.numeroLeitosUTI)
        : undefined,
      numeroSalasCirurgicas: formData.numeroSalasCirurgicas
        ? Number(formData.numeroSalasCirurgicas)
        : undefined,
    };

 

    try {
      if (formData.id) {
        const resultado = await updateHospital(formData.id, dataToSubmit);
        
        showAlert("success", "Sucesso", "Hospital atualizado com sucesso.");
      } else {
        const resultado = await createHospital(
          dataToSubmit as CreateHospitalDTO
        );
      
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
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Hospital *
                </label>
                <input
                  id="nome"
                  name="nome"
                  value={formData.nome || ""}
                  onChange={handleChange}
                  placeholder="Nome do Hospital"
                  required
                  className="p-2 border rounded-md w-full"
                />
              </div>
              <div>
                <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ *
                </label>
                <input
                  id="cnpj"
                  name="cnpj"
                  value={formData.cnpj || ""}
                  onChange={handleChange}
                  placeholder="CNPJ"
                  required
                  className="p-2 border rounded-md w-full"
                />
              </div>
              <div>
                <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco || ""}
                  onChange={handleChange}
                  placeholder="Endereço"
                  className="p-2 border rounded-md w-full"
                />
              </div>
              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone || ""}
                  onChange={handleChange}
                  placeholder="Telefone"
                  className="p-2 border rounded-md w-full"
                />
              </div>
              <div>
                <label htmlFor="redeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Rede *
                </label>
                <select
                  id="redeId"
                  name="redeId"
                  value={selectedRedeId}
                  onChange={handleChange}
                  required
                  className="p-2 border rounded-md w-full"
                >
                  <option value="">Selecione uma Rede</option>
                  {redes.map((rede) => (
                    <option key={rede.id} value={rede.id}>
                      {rede.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="grupoId" className="block text-sm font-medium text-gray-700 mb-1">
                  Grupo {selectedRedeId ? "(Opcional)" : "(Selecione uma Rede primeiro)"}
                </label>
                <select
                  id="grupoId"
                  name="grupoId"
                  value={selectedGrupoId}
                  onChange={handleChange}
                  disabled={!selectedRedeId}
                  className="p-2 border rounded-md w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedRedeId
                      ? "Selecione um Grupo (Opcional)"
                      : "Selecione uma Rede primeiro"}
                  </option>
                  {filteredGrupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="regiaoId" className="block text-sm font-medium text-gray-700 mb-1">
                  Região {selectedGrupoId ? "(Opcional)" : "(Selecione um Grupo primeiro)"}
                </label>
                <select
                  id="regiaoId"
                  name="regiaoId"
                  value={formData.regiaoId || ""}
                  onChange={handleChange}
                  disabled={!selectedGrupoId}
                  className="p-2 border rounded-md w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedGrupoId
                      ? "Selecione uma Região (Opcional)"
                      : "Selecione um Grupo primeiro"}
                  </option>
                  {filteredRegioes.map((regiao) => (
                    <option key={regiao.id} value={regiao.id}>
                      {regiao.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Novos campos */}
              <div>
                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo || ""}
                  onChange={handleChange}
                  className="p-2 border rounded-md w-full"
                >
                  <option value="">Selecione o Tipo</option>
                  <option value={TipoHospital.PUBLICO}>Público</option>
                  <option value={TipoHospital.PRIVADO}>Privado</option>
                  <option value={TipoHospital.FILANTROPICO}>Filantrópico</option>
                  <option value={TipoHospital.OUTROS}>Outros</option>
                </select>
              </div>

              <div>
                <label htmlFor="gestao" className="block text-sm font-medium text-gray-700 mb-1">
                  Gestão
                </label>
                <select
                  id="gestao"
                  name="gestao"
                  value={formData.gestao || ""}
                  onChange={handleChange}
                  className="p-2 border rounded-md w-full"
                >
                  <option value="">Selecione a Gestão</option>
                  <option value={GestaoHospital.GESTAO_DIRETA}>
                    Gestão Direta
                  </option>
                  <option value={GestaoHospital.ORGANIZACAO_SOCIAL}>
                    Organização Social
                  </option>
                  <option value={GestaoHospital.GESTAO_TERCEIRIZADA}>
                    Gestão Terceirizada
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="perfil" className="block text-sm font-medium text-gray-700 mb-1">
                  Perfil
                </label>
                <select
                  id="perfil"
                  name="perfil"
                  value={formData.perfil || ""}
                  onChange={handleChange}
                  className="p-2 border rounded-md w-full"
                >
                  <option value="">Selecione o Perfil</option>
                  <option value={PerfilHospital.GERAL}>Geral</option>
                  <option value={PerfilHospital.ESPECIALIZADO}>
                    Especializado
                  </option>
                  <option value={PerfilHospital.ENSINO_UNIVERSITARIO}>
                    Ensino Universitário
                  </option>
                  <option value={PerfilHospital.REFERENCIA_ALTA_COMPLEXIDADE}>
                    Referência Alta Complexidade
                  </option>
                  <option value={PerfilHospital.REFERENCIA_CURTA_PERMANENCIA}>
                    Referência Curta Permanência
                  </option>
                  <option value={PerfilHospital.REFERENCIA_LONGA_PERMANENCIA}>
                    Referência Longa Permanência
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="complexidade" className="block text-sm font-medium text-gray-700 mb-1">
                  Complexidade
                </label>
                <select
                  id="complexidade"
                  name="complexidade"
                  value={formData.complexidade || ""}
                  onChange={handleChange}
                  className="p-2 border rounded-md w-full"
                >
                  <option value="">Selecione a Complexidade</option>
                  <option value={ComplexidadeHospital.BAIXA}>Baixa</option>
                  <option value={ComplexidadeHospital.MEDIA}>Média</option>
                  <option value={ComplexidadeHospital.ALTA}>Alta</option>
                  <option value={ComplexidadeHospital.MEDIA_ALTA}>
                    Média-Alta
                  </option>
                  <option value={ComplexidadeHospital.BAIXA_MEDIA}>
                    Baixa-Média
                  </option>
                </select>
              </div>

              <div>
                <label htmlFor="numeroTotalLeitos" className="block text-sm font-medium text-gray-700 mb-1">
                  Número Total de Leitos
                </label>
                <input
                  id="numeroTotalLeitos"
                  name="numeroTotalLeitos"
                  type="number"
                  min="0"
                  value={formData.numeroTotalLeitos || ""}
                  onChange={handleChange}
                  placeholder="Número Total de Leitos"
                  className="p-2 border rounded-md w-full"
                />
              </div>

              <div>
                <label htmlFor="numeroLeitosUTI" className="block text-sm font-medium text-gray-700 mb-1">
                  Número Total de Leitos de UTI
                </label>
                <input
                  id="numeroLeitosUTI"
                  name="numeroLeitosUTI"
                  type="number"
                  min="0"
                  value={formData.numeroLeitosUTI || ""}
                  onChange={handleChange}
                  placeholder="Número Total de Leitos de UTI"
                  className="p-2 border rounded-md w-full"
                />
              </div>

              <div>
                <label htmlFor="numeroSalasCirurgicas" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Salas Cirúrgicas
                </label>
                <input
                  id="numeroSalasCirurgicas"
                  name="numeroSalasCirurgicas"
                  type="number"
                  min="0"
                  value={formData.numeroSalasCirurgicas || ""}
                  onChange={handleChange}
                  placeholder="Número de Salas Cirúrgicas"
                  className="p-2 border rounded-md w-full"
                />
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
