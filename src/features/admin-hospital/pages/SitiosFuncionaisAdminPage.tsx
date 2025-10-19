import { useState, useEffect, FormEvent, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  getUnidadeById,
  createSitioFuncional,
  updateSitioFuncional,
  deleteSitioFuncional,
  UnidadeNaoInternacao,
  SitioFuncional,
  CreateSitioFuncionalDTO,
  getSitiosFuncionaisByUnidadeId,
  getCargosByHospitalId, // ✅ NOVO: Buscar todos os cargos do hospital
  Cargo,
} from "@/lib/api";
import {
  Trash2,
  Edit,
  Building2,
  Users,
  PlusCircle,
  AlertTriangle,
} from "lucide-react";
import CargoSitioManager from "../components/CargoSitioManager";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Interface para controlar o formulário de alocação de cargos
interface CargoParaAlocar {
  cargoId: string;
  nome?: string;
}

export default function SitiosFuncionaisAdminPage() {
  const { setorId: unidadeId, hospitalId } = useParams<{
    setorId: string;
    hospitalId: string;
  }>();
  const [unidade, setUnidade] = useState<UnidadeNaoInternacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ NOVO: Estado para todos os cargos do hospital
  const [todosCargosDosHospital, setTodosCargosDosHospital] = useState<Cargo[]>(
    []
  );

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<SitioFuncional>>({});
  const [editingSitio, setEditingSitio] = useState<SitioFuncional | null>(null);

  const [managingSitio, setManagingSitio] = useState<SitioFuncional | null>(
    null
  );

  // Estados para o formulário de alocação de cargos
  const [cargosParaAlocar, setCargosParaAlocar] = useState<CargoParaAlocar[]>(
    []
  );
  const [selectedCargoId, setSelectedCargoId] = useState("");

  const fetchData = async () => {
    if (!unidadeId || !hospitalId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Busca os dados da unidade
      const unidadeData = (await getUnidadeById(
        unidadeId
      )) as UnidadeNaoInternacao;

      // 2. Busca os sítios com os detalhes de alocação
      const sitiosDetalhados = await getSitiosFuncionaisByUnidadeId(unidadeId);

      // 3. ✅ NOVO: Busca TODOS os cargos do hospital (não apenas os da unidade)

      const cargosDosHospital = await getCargosByHospitalId(hospitalId);

      // 4. Combina os dados
      const unidadeCompleta = {
        ...unidadeData,
        sitiosFuncionais: sitiosDetalhados,
      };

      setUnidade(unidadeCompleta);
      setTodosCargosDosHospital(cargosDosHospital);
    } catch (err) {
      console.error("❌ [fetchData] Erro:", err);
      setError("Falha ao carregar os dados dos sítios funcionais.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [unidadeId, hospitalId]);

  // ✅ NOVO: Agora usa TODOS os cargos do hospital, não apenas os da unidade
  const cargosDisponiveisParaAdicionar = useMemo(() => {
    if (!todosCargosDosHospital || todosCargosDosHospital.length === 0) {
      return [];
    }

    const idsCargosJaNoFormulario = new Set(
      cargosParaAlocar.map((c) => c.cargoId)
    );

    const disponiveisFiltrados = todosCargosDosHospital.filter(
      (cargo) => !idsCargosJaNoFormulario.has(cargo.id)
    );

    return disponiveisFiltrados;
  }, [todosCargosDosHospital, cargosParaAlocar]);

  const resetForm = () => {
    setFormData({});
    setCargosParaAlocar([]);
    setSelectedCargoId("");
    setIsFormVisible(false);
    setEditingSitio(null);
  };

  const handleOpenForm = (sitio: SitioFuncional | null) => {
    setEditingSitio(sitio);
    setFormData(
      sitio
        ? { nome: sitio.nome, descricao: sitio.descricao }
        : { nome: "", descricao: "" }
    );

    if (sitio && sitio.cargosSitio) {
      // Remove duplicatas ao carregar cargos do sítio
      const cargosAlocados = sitio.cargosSitio
        .filter(
          (cs, index, self) =>
            index ===
            self.findIndex(
              (c) => c.cargoUnidade.cargo.id === cs.cargoUnidade.cargo.id
            )
        )
        .map((cs) => ({
          cargoId: cs.cargoUnidade.cargo.id,
          nome: cs.cargoUnidade.cargo.nome,
        }));
      setCargosParaAlocar(cargosAlocados);
    } else {
      setCargosParaAlocar([]);
    }

    setIsFormVisible(true);
  };

  const handleCancel = () => {
    resetForm();
  };

  const adicionarCargo = () => {
    setError(null);

    if (!selectedCargoId) {
      setError("Selecione um cargo.");
      return;
    }

    // Verifica se o cargo já foi adicionado
    if (cargosParaAlocar.some((c) => c.cargoId === selectedCargoId)) {
      setError("Este cargo já foi adicionado.");
      return;
    }

    // ✅ NOVO: Busca no array de todos os cargos do hospital
    const cargoInfo = todosCargosDosHospital.find(
      (cargo) => cargo.id === selectedCargoId
    );

    if (cargoInfo) {
      setCargosParaAlocar((prev) => [
        ...prev,
        {
          cargoId: selectedCargoId,
          nome: cargoInfo.nome,
        },
      ]);
      setSelectedCargoId("");
    } else {
      setError("Cargo não encontrado.");
    }
  };

  const removerCargo = (cargoId: string) => {
    setCargosParaAlocar((prev) => prev.filter((c) => c.cargoId !== cargoId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!unidadeId || !formData.nome?.trim()) return;

    try {
      let savedSitio: SitioFuncional | null = null as any;

      if (editingSitio) {
        // Atualiza apenas nome/descrição. Alocações serão geridas na tela de Gerenciar Cargos
        await updateSitioFuncional(editingSitio.id, {
          nome: formData.nome,
          descricao: formData.descricao,
          cargos: [],
        });
      } else {
        const data: CreateSitioFuncionalDTO = {
          unidadeId,
          nome: formData.nome,
          descricao: formData.descricao,
          cargos: [],
        };
        // Tenta obter o sítio criado retornado pela API
        try {
          // Alguns backends retornam o objeto criado
          // @ts-ignore
          const created = await createSitioFuncional(unidadeId, data);
          if (created && created.id) {
            savedSitio = created as SitioFuncional;
          }
        } catch (errCreate) {
          // Se a chamada falhar ou não retornar o objeto, continuamos para o fallback
          console.warn(
            "createSitioFuncional não retornou objeto criado:",
            errCreate
          );
        }
      }

      // Recarrega os dados e abre o gerenciador de cargos para o sítio salvo/atualizado
      await fetchData();

      // Se ainda não temos o sítio (por exemplo no caso de update ou create sem retorno), procura pelo nome
      if (!savedSitio) {
        const match = (unidade as any)?.sitiosFuncionais?.find(
          (s: any) => s.nome === formData.nome
        );
        if (match) savedSitio = match;
      }

      // Se encontramos, abre o CargoSitioManager para permitir alocar cargos
      if (savedSitio) {
        setManagingSitio(savedSitio as SitioFuncional);
      }

      // Finalmente fecha o formulário local
      resetForm();
    } catch (err) {
      setError(
        editingSitio ? "Falha ao atualizar o sítio." : "Falha ao criar o sítio."
      );
    }
  };

  const handleDelete = async (sitioId: string) => {
    if (
      window.confirm(
        "Tem certeza que deseja excluir este sítio funcional? Todas as alocações de cargos serão perdidas."
      )
    ) {
      try {
        await deleteSitioFuncional(sitioId);
        fetchData();
      } catch (err) {
        setError("Falha ao excluir o sítio funcional.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {managingSitio && (
        <CargoSitioManager
          sitioId={managingSitio.id}
          sitio={managingSitio}
          onClose={() => {
            setManagingSitio(null);
            fetchData();
          }}
          onUpdate={() => {
            fetchData();
          }}
        />
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Building2 /> Gestão de Sítios Funcionais
        </h2>
        <button
          onClick={() => handleOpenForm(null)}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          + Novo Sítio
        </button>
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              {editingSitio ? "Editar" : "Adicionar Novo"} Sítio Funcional
            </h3>
            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-2 rounded flex items-center gap-2">
                <AlertTriangle size={16} />
                {error}
              </p>
            )}
            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-gray-700"
              >
                Nome do Sítio
              </label>
              <Input
                id="nome"
                value={formData.nome || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label
                htmlFor="descricao"
                className="block text-sm font-medium text-gray-700"
              >
                Descrição
              </label>
              <Textarea
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                rows={2}
              />
            </div>

            {/* Observação: a alocação de cargos foi movida para a tela de "Gerenciar Cargos".
                Após salvar o sítio, o gerenciador de cargos será aberto automaticamente. */}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg border">
        {loading && <p>Carregando...</p>}
        {!loading && !error && (
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Descrição
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {unidade?.sitiosFuncionais?.map((sitio) => (
                <tr key={sitio.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                    {sitio.nome}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {sitio.descricao || "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm space-x-2">
                    <button
                      onClick={() => setManagingSitio(sitio)}
                      className="text-green-600 hover:text-green-800"
                      title="Gerenciar Cargos"
                    >
                      <Users size={18} />
                    </button>
                    <button
                      onClick={() => handleOpenForm(sitio)}
                      className="text-secondary hover:opacity-70"
                      title="Editar Sítio"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(sitio.id)}
                      className="text-red-600 hover:opacity-70"
                      title="Excluir Sítio"
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
