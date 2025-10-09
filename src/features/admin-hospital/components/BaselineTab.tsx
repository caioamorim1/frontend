import { useMemo, useEffect, useState } from "react";
import { Briefcase, Users } from "lucide-react";
import { getSnapshotHospitalSectors, HospitalSectorsData } from "@/lib/api";
import { SectorInternation } from "@/mocks/internationDatabase";
import { SectorAssistance } from "@/mocks/noInternationDatabase";

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

  useEffect(() => {
    const fetchSnapshot = async () => {
      if (!hospitalId) return;

      setLoading(true);
      setError(null);

      try {
        console.log("🔄 Buscando snapshot do hospital:", hospitalId);
        const data = (await getSnapshotHospitalSectors(hospitalId)) as any;
        const dados = data.snapshot.dados as Dados;
        console.log("✅ Snapshot carregado:", data);

        setSnapshotData(dados);
      } catch (err: any) {
        console.error("❌ Erro ao buscar snapshot:", err);
        if (err.response?.status === 404) {
          setError(
            "Nenhum snapshot (baseline) encontrado para este hospital. Crie um snapshot primeiro na página de Setores."
          );
        } else {
          setError("Erro ao carregar dados do baseline.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [hospitalId]);

  // Extrai os cargos da unidade específica do snapshot
  const cargos = useMemo(() => {
    if (!snapshotData || !setorId) return [];

    // Procura primeiro nos setores de internação
    const internationSector = snapshotData.internation?.find(
      (sector) => sector.id === setorId
    );

    if (internationSector) {
      return internationSector.staff.map((staffMember) => ({
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
      return assistanceSector.staff.map((staffMember) => ({
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
    if (!cargos) return 0;
    return cargos.reduce((sum, item) => sum + item.quantidade_funcionarios, 0);
  }, [cargos]);

  // Calcula o total de cargos distintos
  const totalCargos = useMemo(() => {
    if (!cargos) return 0;
    return cargos.length;
  }, [cargos]);

  // Estado de "carregando"
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

  // Estado de "erro"
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold text-primary mb-4">
          Resumo de Funcionários (Baseline)
        </h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">{error}</p>
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
