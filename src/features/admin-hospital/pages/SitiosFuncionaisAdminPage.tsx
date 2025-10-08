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
  getSitiosFuncionaisByUnidadeId, // Importe a nova função
} from "@/lib/api";
import { Trash2, Edit, Building2, Users, PlusCircle, AlertTriangle } from "lucide-react";
import CargoSitioManager from "../components/CargoSitioManager";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Interface para controlar o formulário de alocação de cargos
interface CargoParaAlocar {
  cargoId: string;
  quantidade_funcionarios: number;
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

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<SitioFuncional>>({});
  const [editingSitio, setEditingSitio] = useState<SitioFuncional | null>(null);
  
  const [managingSitio, setManagingSitio] = useState<SitioFuncional | null>(null);

  // Estados para o formulário de alocação de cargos
  const [cargosParaAlocar, setCargosParaAlocar] = useState<CargoParaAlocar[]>([]);
  const [selectedCargoId, setSelectedCargoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  const fetchData = async () => {
    if (!unidadeId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Busca os dados da unidade (que contém o total de cargos)
      const unidadeData = (await getUnidadeById(unidadeId)) as UnidadeNaoInternacao;
      // 2. Busca os sítios com os detalhes de alocação (a correção principal)
      const sitiosDetalhados = await getSitiosFuncionaisByUnidadeId(unidadeId);

      // 3. Combina os dados para ter o objeto 'unidade' completo
      const unidadeCompleta = {
          ...unidadeData,
          sitiosFuncionais: sitiosDetalhados,
      };

      setUnidade(unidadeCompleta);
    } catch (err) {
      setError("Falha ao carregar os dados dos sítios funcionais.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [unidadeId]);
  
  const saldosPorCargo = useMemo(() => {
    const saldos: { [key: string]: number } = {};
    if (!unidade || !unidade.cargos_unidade) return saldos;

    unidade.cargos_unidade.forEach(cu => {
        saldos[cu.cargo.id] = cu.quantidade_funcionarios;
    });

    unidade.sitiosFuncionais?.forEach(sitio => {
        if (editingSitio && sitio.id === editingSitio.id) {
            return;
        }

        sitio.cargosSitio?.forEach(cs => {
            const cargoId = cs.cargoUnidade.cargo.id;
            if (saldos[cargoId] !== undefined) {
                saldos[cargoId] -= cs.quantidade_funcionarios;
            }
        });
    });

    return saldos;
  }, [unidade, editingSitio]);
  
  const cargosDisponiveisParaAdicionar = useMemo(() => {
    if (!unidade?.cargos_unidade) return [];
    const idsCargosJaNoFormulario = new Set(cargosParaAlocar.map(c => c.cargoId));
    return unidade.cargos_unidade.filter(cu => !idsCargosJaNoFormulario.has(cu.cargo.id));
  }, [unidade?.cargos_unidade, cargosParaAlocar]);

  const resetForm = () => {
    setFormData({});
    setCargosParaAlocar([]);
    setSelectedCargoId("");
    setQuantidade(1);
    setIsFormVisible(false);
    setEditingSitio(null);
  };

  const handleOpenForm = (sitio: SitioFuncional | null) => {
    setEditingSitio(sitio);
    setFormData(sitio ? { nome: sitio.nome, descricao: sitio.descricao } : { nome: "", descricao: "" });
    
    if (sitio && sitio.cargosSitio) {
        const cargosAlocados = sitio.cargosSitio.map(cs => ({
            cargoId: cs.cargoUnidade.cargo.id,
            nome: cs.cargoUnidade.cargo.nome,
            quantidade_funcionarios: cs.quantidade_funcionarios,
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
    if (!selectedCargoId || quantidade < 1) {
        setError("Selecione um cargo e uma quantidade válida.");
        return;
    }

    const saldoDisponivel = saldosPorCargo[selectedCargoId] ?? 0;
    if (quantidade > saldoDisponivel) {
        setError(`Quantidade excede o saldo disponível de ${saldoDisponivel} para este cargo.`);
        return;
    }

    const cargoInfo = unidade?.cargos_unidade?.find(cu => cu.cargo.id === selectedCargoId);
    if (cargoInfo) {
        setCargosParaAlocar(prev => [...prev, {
            cargoId: selectedCargoId,
            quantidade_funcionarios: quantidade,
            nome: cargoInfo.cargo.nome,
        }]);
        setSelectedCargoId("");
        setQuantidade(1);
    }
  };

  const removerCargo = (cargoId: string) => {
    setCargosParaAlocar(prev => prev.filter(c => c.cargoId !== cargoId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!unidadeId || !formData.nome?.trim()) return;

    const payloadCargos = cargosParaAlocar.map(({ cargoId, quantidade_funcionarios }) => ({
      cargoId,
      quantidade_funcionarios,
    }));

    try {
      if (editingSitio) {
        await updateSitioFuncional(editingSitio.id, {
          nome: formData.nome,
          descricao: formData.descricao,
          cargos: payloadCargos,
        });
      } else {
        const data: CreateSitioFuncionalDTO = {
          unidadeId,
          nome: formData.nome,
          descricao: formData.descricao,
          cargos: payloadCargos,
        };
        await createSitioFuncional(unidadeId, data);
      }
      resetForm();
      fetchData();
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
      {managingSitio && hospitalId && unidade && (
        <CargoSitioManager
          sitioId={managingSitio.id}
          hospitalId={hospitalId}
          unidade={unidade}
          onClose={() => {
              setManagingSitio(null);
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
            {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded flex items-center gap-2"><AlertTriangle size={16} />{error}</p>}
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome do Sítio</label>
              <Input
                id="nome"
                value={formData.nome || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label>
              <Textarea
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-primary">Alocar Cargos</h3>
                <div className="flex items-end gap-2">
                    <div className="flex-grow">
                        <label className="text-sm font-medium">Cargo</label>
                        <Select onValueChange={setSelectedCargoId} value={selectedCargoId} disabled={cargosDisponiveisParaAdicionar.length === 0}>
                            <SelectTrigger><SelectValue placeholder="Selecione um cargo..." /></SelectTrigger>
                            <SelectContent>
                                {cargosDisponiveisParaAdicionar.map(cu => (
                                    <SelectItem key={cu.cargo.id} value={cu.cargo.id}>
                                        {cu.cargo.nome} (Saldo: {saldosPorCargo[cu.cargo.id] ?? 0})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Qtd.</label>
                        <Input type="number" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} min="1" className="w-24"/>
                    </div>
                    <Button type="button" onClick={adicionarCargo} disabled={!selectedCargoId || cargosDisponiveisParaAdicionar.length === 0}>
                        <PlusCircle size={16} className="mr-2"/> Adicionar
                    </Button>
                </div>
                {cargosParaAlocar.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-600 mt-2">Cargos a serem alocados neste sítio:</h4>
                        {cargosParaAlocar.map(cargo => (
                            <div key={cargo.cargoId} className="flex justify-between items-center p-2 bg-slate-50 rounded-md text-sm">
                                <span>{cargo.nome} (Qtd: {cargo.quantidade_funcionarios})</span>
                                <button type="button" onClick={() => removerCargo(cargo.cargoId)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleCancel}>Cancelar</Button>
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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {unidade?.sitiosFuncionais?.map((sitio) => (
                <tr key={sitio.id}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{sitio.nome}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{sitio.descricao || "-"}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm space-x-2">
                    <button onClick={() => setManagingSitio(sitio)} className="text-green-600 hover:text-green-800" title="Gerenciar Cargos"><Users size={18} /></button>
                    <button onClick={() => handleOpenForm(sitio)} className="text-secondary hover:opacity-70" title="Editar Sítio"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(sitio.id)} className="text-red-600 hover:opacity-70" title="Excluir Sítio"><Trash2 size={18} /></button>
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