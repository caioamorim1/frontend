import { useMemo, useEffect, useState } from "react";
import { Briefcase, Users } from "lucide-react";
import {
  getSnapshotHospitalSectors,
  getBaselinesByHospitalId,
  type Baseline,
} from "@/lib/api";
import { SectorInternation } from "@/mocks/internationDatabase";
import { SectorAssistance } from "@/mocks/noInternationDatabase";
import { ReusableWaterfall } from "./graphicsComponents/ReusableWaterfall";
import { HorizontalBarChartComp } from "./graphicsComponents/HorizontalBarChartComp";
import { parseCost as parseCostUtil } from "@/lib/dataUtils";
import { generateBlueMonochromaticScale } from "@/lib/generateMultiColorScale";

// As interfaces foram mantidas para compatibilidade com a estrutura de dados
interface Cargo {
  id: string;
  nome: string;
}
export type HospitalSector = {
  id: string;
  internation: SectorInternation[];
  assistance: SectorAssistance[];
  snapshot?: [];
};

type Dados = {
  id: string;
  internation: SectorInternation[];
  assistance: SectorAssistance[];
};

export interface CargoUnidade {
  cargo: Cargo;
  quantidade_funcionarios: number;
}

interface QuadroFuncionariosProps {
  hospitalId: string;
  setorId: string;
}

export default function QuadroFuncionariosResumo({
  hospitalId,
  setorId,
}: QuadroFuncionariosProps) {
  const [snapshotData, setSnapshotData] = useState<HospitalSector | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<Baseline | null>(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      if (!hospitalId) return;

      setLoading(true);
      setError(null);

      try {
        const data = (await getSnapshotHospitalSectors(hospitalId)) as any;
        const dados = data.snapshot.dados as Dados;
        setSnapshotData(dados);

        // Fetch baseline (API) for cost and total quantity
        const baseData = await getBaselinesByHospitalId(hospitalId);
        const baselineObj = Array.isArray(baseData) ? baseData[0] : baseData;
        // Parse setores if they come as JSON strings
        const parsedBaseline = baselineObj
          ? {
              ...baselineObj,
              setores: Array.isArray(baselineObj.setores)
                ? baselineObj.setores.map((s: any) => {
                    if (typeof s === "string") {
                      try {
                        return JSON.parse(s);
                      } catch {
                        return s;
                      }
                    }
                    return s;
                  })
                : baselineObj.setores ?? [],
            }
          : null;
        setBaseline(parsedBaseline);
      } catch (err: any) {
        console.error("❌ Erro ao buscar snapshot:", err);
        if (err.response?.status === 404) {
          setError(
            "Nenhum snapshot (baseline) encontrado para este hospital. Crie um snapshot primeiro na página de Setores."
          );
        } else {
          setError("Erro ao carregar dados do baseline.");
        }
        setSnapshotData(null); // Garante que snapshotData fica null em caso de erro
        setBaseline(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [hospitalId]);

  // Extrai os cargos da unidade específica do snapshot
  const cargos = useMemo(() => {
    if (!snapshotData || !setorId) {
      return [];
    }

    // Procura primeiro nos setores de internação
    const internationSector = snapshotData.internation?.find(
      (sector) => sector.id === setorId
    );

    if (internationSector) {
      // @ts-ignore - sitiosFuncionais ainda não está na interface
      const sitiosFuncionaisIntern = internationSector.sitiosFuncionais;

      // Remove duplicatas baseado no nome do cargo
      const staffSemDuplicatas = internationSector.staff.filter(
        (staff, index, self) =>
          index === self.findIndex((s) => s.role === staff.role)
      );

      return staffSemDuplicatas.map((staffMember) => ({
        cargo: {
          id: staffMember.id,
          nome: staffMember.role,
        },
        quantidade_funcionarios: staffMember.quantity,
      }));
    }

    // Se não encontrou, procura nos setores de assistência
    const assistanceSector = snapshotData.assistance?.find(
      (sector) => sector.id === setorId
    );

    if (assistanceSector) {
      // @ts-ignore - sitiosFuncionais ainda não está na interface (aguardando backend)
      const sitiosFuncionais = assistanceSector.sitiosFuncionais;

      if (
        sitiosFuncionais &&
        Array.isArray(sitiosFuncionais) &&
        sitiosFuncionais.length > 0
      ) {
        // ✨ NOVA LÓGICA: Se tem sitiosFuncionais, calcular deles
        const cargosMap = new Map();

        sitiosFuncionais.forEach((sitio: any) => {
          sitio.cargosSitio?.forEach((cargoSitio: any) => {
            const cargoId = cargoSitio.cargoUnidade.cargo.id;
            const cargoNome = cargoSitio.cargoUnidade.cargo.nome;
            const quantidade = cargoSitio.quantidade_funcionarios || 0;

            if (cargosMap.has(cargoId)) {
              const existing = cargosMap.get(cargoId);
              existing.quantidade_funcionarios += quantidade;
            } else {
              cargosMap.set(cargoId, {
                cargo: {
                  id: cargoId,
                  nome: cargoNome,
                },
                quantidade_funcionarios: quantidade,
              });
            }
          });
        });

        const cargosArray = Array.from(cargosMap.values());

        return cargosArray;
      }

      // Se não tem sitiosFuncionais, usa staff (estrutura antiga)

      // Remove duplicatas baseado no nome do cargo
      const staffSemDuplicatas = assistanceSector.staff.filter(
        (staff, index, self) =>
          index === self.findIndex((s) => s.role === staff.role)
      );

      return staffSemDuplicatas.map((staffMember) => ({
        cargo: {
          id: staffMember.id,
          nome: staffMember.role,
        },
        quantidade_funcionarios: staffMember.quantity,
      }));
    }

    return [];
  }, [snapshotData, setorId]);

  // Calcula o total de funcionários
  const totalFuncionarios = useMemo(() => {
    if (!cargos || cargos.length === 0) return 0;
    return cargos.reduce((sum, item) => sum + item.quantidade_funcionarios, 0);
  }, [cargos]);

  // Calcula o total de cargos distintos
  const totalCargos = useMemo(() => {
    if (!cargos || cargos.length === 0) return 0;
    return cargos.length;
  }, [cargos]);

  // Localiza o setor pelo ID no snapshot para pegar o nome e custo
  const setorSnapshot = useMemo(() => {
    if (!snapshotData || !setorId) return null as any;
    const inIntern = snapshotData.internation?.find((s) => s.id === setorId);
    if (inIntern) return inIntern as any;
    const inAssist = snapshotData.assistance?.find((s) => s.id === setorId);
    return inAssist as any;
  }, [snapshotData, setorId]);

  const setorNome = setorSnapshot?.name?.toString() ?? "";

  // Custo baseline do setor pela API (casando por nome, respeitando ativo)
  const setorCustoBaseline = useMemo(() => {
    if (!baseline || !Array.isArray(baseline.setores) || !setorNome) return 0;
    const nomeLower = setorNome.trim().toLowerCase();
    const match = (baseline.setores as any[]).find((s) => {
      const ativo = s?.ativo !== false;
      const nome = (s?.nome || "").trim().toLowerCase();
      return ativo && nome === nomeLower;
    });
    const v = match?.custo ?? 0;
    return parseCostUtil(v);
  }, [baseline, setorNome]);

  // Distribuição por função (quantidade e custo distribuído proporcionalmente)
  const roleQuantidades = useMemo(() => {
    if (!cargos || cargos.length === 0)
      return [] as { name: string; value: number }[];
    return cargos.map((c) => ({
      name: c.cargo.nome,
      value: c.quantidade_funcionarios,
    }));
  }, [cargos]);

  const roleCustosDistribuidos = useMemo(() => {
    const totalQtd = roleQuantidades.reduce((s, r) => s + (r.value || 0), 0);
    if (totalQtd === 0 || setorCustoBaseline <= 0)
      return [] as { name: string; value: number }[];
    return roleQuantidades.map((r) => ({
      name: r.name,
      value: (r.value / totalQtd) * setorCustoBaseline,
    }));
  }, [roleQuantidades, setorCustoBaseline]);

  // Estado de "carregando" - verificar ANTES dos useMemo que dependem de dados
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold text-primary mb-4">
          Resumo de Funcionários (Baseline)
        </h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-sm text-gray-500">
            Carregando dados do baseline...
          </p>
        </div>
      </div>
    );
  }

  // Estado de "erro" - mostrar ANTES de tentar renderizar a tabela
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold text-primary mb-4">
          Resumo de Funcionários (Baseline)
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            Ainda não há baseline cadastrado para este setor.
          </p>
        </div>
      </div>
    );
  }

  // Estado de "sem dados"
  if (!cargos || cargos.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold text-primary mb-4">
          Resumo de Funcionários (Baseline)
        </h2>
        <p className="text-sm text-gray-500 mt-4">
          Não há informações de funcionários no baseline para esta unidade.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
      {/* Cabeçalho com totais */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-primary">
            Resumo de Funcionários (Baseline)
          </h2>
          <p className="text-sm text-gray-500">
            Distribuição de funcionários por cargo no momento do snapshot.
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Total de Cargos
            </p>
            <p className="font-bold text-2xl text-primary flex items-center justify-end gap-2">
              <Briefcase size={20} />
              {totalCargos}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Total de Funcionários
            </p>
            <p className="font-bold text-2xl text-primary flex items-center justify-end gap-2">
              <Users size={20} />
              {totalFuncionarios}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela Simplificada */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3 w-3/4">
                Cargo
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Nº de Funcionários
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cargos.map((item) => (
              <tr key={item.cargo.id} className="bg-white hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {item.cargo.nome}
                </td>
                <td className="px-6 py-4 text-right font-bold text-gray-700">
                  {item.quantidade_funcionarios}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
