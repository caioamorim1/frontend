import { useState, useEffect, FormEvent, useMemo } from "react";
import {
  getCargosPorSitio,
  addCargoASitio,
  deleteCargoDeSitio,
  getCargosByHospitalId,
  CargoSitio,
  Cargo,
  UnidadeNaoInternacao,
  SitioDistribuicao,
  updateSitioFuncional,
  SitioFuncional,
} from "@/lib/api";
import { Trash2, X, AlertTriangle, Save } from "lucide-react";
import DistribuicaoTurnosForm from "./DistribuicaoTurnosForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface CargoSitioManagerProps {
  sitioId: string;
  sitio: SitioFuncional;
  hospitalId: string;
  unidade: UnidadeNaoInternacao;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function CargoSitioManager({
  sitioId,
  sitio,
  hospitalId,
  unidade,
  onClose,
  onUpdate,
}: CargoSitioManagerProps) {
  const [cargosNoSitio, setCargosNoSitio] = useState<CargoSitio[]>([]);
  const [cargosDisponiveis, setCargosDisponiveis] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedCargoId, setSelectedCargoId] = useState("");
  const [quantidade, setQuantidade] = useState(1);

  // Estado para distribuições ENF/TEC
  const [distribuicoes, setDistribuicoes] = useState<SitioDistribuicao[]>(
    sitio.distribuicoes || []
  );

  // Calcula o total de cargos já alocados em TODOS os sítios da unidade
  const totalAlocadoNaUnidade = useMemo(() => {
    if (!unidade.sitiosFuncionais) return {};
    const alocacaoPorCargo: { [key: string]: number } = {};
    unidade.sitiosFuncionais.forEach((sitio) => {
      sitio.cargosSitio?.forEach((cs) => {
        const cargoId = cs.cargoUnidade.cargo.id;
        alocacaoPorCargo[cargoId] =
          (alocacaoPorCargo[cargoId] || 0) + cs.quantidade_funcionarios;
      });
    });
    return alocacaoPorCargo;
  }, [unidade.sitiosFuncionais]);

  // Calcula o total de vagas para cada cargo na unidade
  const totalVagasNaUnidade = useMemo(() => {
    if (!unidade.cargos_unidade) return {};
    const vagas: { [key: string]: number } = {};
    unidade.cargos_unidade.forEach((cu) => {
      vagas[cu.cargo.id] = cu.quantidade_funcionarios;
    });
    return vagas;
  }, [unidade.cargos_unidade]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sitioData, hospitalData] = await Promise.all([
        getCargosPorSitio(sitioId),
        getCargosByHospitalId(hospitalId),
      ]);
      setCargosNoSitio(sitioData);

      const idsNoSitio = new Set(
        sitioData.map((cs) => cs.cargoUnidade.cargo.id)
      );

      // Filtra cargos disponíveis baseados no que a UNIDADE tem
      const cargosDaUnidadeIds = new Set(
        unidade.cargos_unidade?.map((cu) => cu.cargo.id)
      );
      const cargosFiltrados = hospitalData.filter(
        (c) => cargosDaUnidadeIds.has(c.id) && !idsNoSitio.has(c.id)
      );

      setCargosDisponiveis(cargosFiltrados);
      if (cargosFiltrados.length > 0) {
        setSelectedCargoId(cargosFiltrados[0].id);
      }
    } catch (err) {
      setError("Falha ao carregar dados dos cargos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sitioId, hospitalId, unidade]);

  const handleAddCargo = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedCargoId || quantidade < 1) {
      setError("Selecione um cargo e informe uma quantidade válida.");
      return;
    }

    const totalDisponivel = totalVagasNaUnidade[selectedCargoId] || 0;
    const totalJaAlocado = totalAlocadoNaUnidade[selectedCargoId] || 0;

    if (quantidade > totalDisponivel - totalJaAlocado) {
      setError(
        `A quantidade informada (${quantidade}) excede o saldo disponível (${
          totalDisponivel - totalJaAlocado
        }) para este cargo na unidade.`
      );
      return;
    }

    try {
      await addCargoASitio(sitioId, {
        cargoUnidadeId: selectedCargoId,
        quantidade_funcionarios: quantidade,
      });
      fetchData();
      setQuantidade(1);
    } catch (err) {
      setError(
        "Falha ao adicionar cargo. Verifique se este cargo já foi adicionado."
      );
    }
  };

  const handleDeleteCargo = async (cargoSitioId: string) => {
    if (window.confirm("Remover este cargo do sítio?")) {
      try {
        await deleteCargoDeSitio(cargoSitioId);
        fetchData();
      } catch (err) {
        setError("Falha ao remover cargo.");
      }
    }
  };

  const handleSaveDistribuicoes = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateSitioFuncional(sitioId, {
        distribuicoes: distribuicoes,
      });
      toast({
        title: "Sucesso",
        description: "Distribuição de turnos salva com sucesso!",
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      setError("Falha ao salvar distribuições.");
      toast({
        title: "Erro",
        description: "Não foi possível salvar a distribuição de turnos.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-5xl space-y-4 animate-fade-in-down relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold text-primary">
          Gerenciar Sítio: {sitio.nome}
        </h2>

        {loading && <p>Carregando...</p>}
        {error && (
          <p className="text-red-500 text-sm bg-red-50 p-2 rounded flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </p>
        )}

        <Tabs defaultValue="distribuicao" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="distribuicao">Distribuição ENF/TEC</TabsTrigger>
            <TabsTrigger value="cargos">Outros Cargos</TabsTrigger>
          </TabsList>

          <TabsContent value="distribuicao" className="space-y-4">
            <DistribuicaoTurnosForm
              distribuicoes={distribuicoes}
              onChange={setDistribuicoes}
            />
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={handleSaveDistribuicoes}
                disabled={saving}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? "Salvando..." : "Salvar Distribuição"}
              </button>
            </div>
          </TabsContent>

          <TabsContent value="cargos" className="space-y-4">
            <form
              onSubmit={handleAddCargo}
              className="flex items-end gap-2 border-b pb-4"
            >
              <div className="flex-grow">
                <label className="text-sm font-medium">Cargo Disponível</label>
                <select
                  value={selectedCargoId}
                  onChange={(e) => setSelectedCargoId(e.target.value)}
                  className="w-full p-2 border rounded-md mt-1 bg-white"
                  disabled={cargosDisponiveis.length === 0}
                >
                  {cargosDisponiveis.length > 0 ? (
                    cargosDisponiveis.map((c) => {
                      const total = totalVagasNaUnidade[c.id] || 0;
                      const alocado = totalAlocadoNaUnidade[c.id] || 0;
                      const saldo = total - alocado;
                      return (
                        <option key={c.id} value={c.id}>
                          {c.nome} (Saldo: {saldo})
                        </option>
                      );
                    })
                  ) : (
                    <option>Nenhum cargo novo para adicionar</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Qtd.</label>
                <input
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  min="1"
                  className="w-24 p-2 border rounded-md mt-1"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                disabled={cargosDisponiveis.length === 0}
              >
                Adicionar
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h3 className="text-md font-semibold text-gray-700 mt-2">
                Cargos Alocados
              </h3>
              {cargosNoSitio.map((cs) => (
                <div
                  key={cs.id}
                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                >
                  <div>
                    <span className="font-semibold">
                      {cs.cargoUnidade.cargo.nome}
                    </span>
                    <span className="text-sm text-gray-600">
                      {" "}
                      (Qtd: {cs.quantidade_funcionarios})
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteCargo(cs.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {cargosNoSitio.length === 0 && !loading && (
                <p className="text-sm text-center text-gray-500 py-4">
                  Nenhum cargo associado a este sítio.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
