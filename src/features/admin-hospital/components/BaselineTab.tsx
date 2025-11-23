import { useMemo, useEffect, useState } from "react";
import { Briefcase, Users } from "lucide-react";
import {
  getHospitalSnapshots,
  type Snapshot,
} from "@/lib/api";

interface QuadroFuncionariosProps {
  hospitalId: string;
  setorId: string;
}

export default function QuadroFuncionariosResumo({
  hospitalId,
  setorId,
}: QuadroFuncionariosProps) {
  const [snapshotSelecionado, setSnapshotSelecionado] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      if (!hospitalId) return;

      setLoading(true);
      setError(null);

      try {
        // Buscar snapshots do hospital
        const snapshotsData = await getHospitalSnapshots(hospitalId, 10);
        
        // Encontrar o snapshot selecionado
        const snapshotSelecionado = snapshotsData.snapshots?.find(
          (s) => s.selecionado === true
        );

        console.log('=== BASELINE TAB - SETOR DETAIL ===');
        console.log('Hospital ID:', hospitalId);
        console.log('Setor ID:', setorId);
        console.log('Todos os snapshots:', snapshotsData.snapshots);
        console.log('Snapshot selecionado:', snapshotSelecionado);
        console.log('Dados do snapshot:', snapshotSelecionado?.dados);
        console.log('===================================');

        if (!snapshotSelecionado) {
          setError(
            "Nenhum baseline selecionado para este hospital. Selecione um baseline na página de Baseline."
          );
          setSnapshotSelecionado(null);
        } else {
          setSnapshotSelecionado(snapshotSelecionado);
        }
      } catch (err: any) {
        console.error("❌ Erro ao buscar snapshot:", err);
        if (err.response?.status === 404) {
          setError(
            "Nenhum snapshot (baseline) encontrado para este hospital. Crie um snapshot primeiro na página de Baseline."
          );
        } else {
          setError("Erro ao carregar dados do baseline.");
        }
        setSnapshotSelecionado(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [hospitalId, setorId]);

  // Extrai os cargos da unidade específica do snapshot
  const cargos = useMemo(() => {
    if (!snapshotSelecionado?.dados || !setorId) {
      return [];
    }

    const dados = snapshotSelecionado.dados;

    // Procura primeiro nos setores de internação
    const internationSector = dados.internation?.find(
      (sector: any) => sector.id === setorId
    );

    if (internationSector) {
      console.log('=== BASELINE TAB - SETOR DE INTERNAÇÃO ===');
      console.log('Setor encontrado:', internationSector);
      console.log('Staff do setor:', internationSector.staff);
      console.log('==========================================');

      return (internationSector.staff || []).map((staffMember: any) => ({
        cargo: {
          id: staffMember.id,
          nome: staffMember.role,
        },
        quantidade_funcionarios: staffMember.quantity,
      }));
    }

    // Se não encontrou, procura nos setores de assistência (não-internação)
    const assistanceSector = dados.assistance?.find(
      (sector: any) => sector.id === setorId
    );

    if (assistanceSector) {
      console.log('=== BASELINE TAB - SETOR DE NÃO-INTERNAÇÃO ===');
      console.log('Setor encontrado:', assistanceSector);
      console.log('Sítios funcionais:', assistanceSector.functionalSites);
      console.log('===============================================');

      const functionalSites = assistanceSector.functionalSites;

      if (functionalSites && Array.isArray(functionalSites) && functionalSites.length > 0) {
        // Calcular cargos dos sítios funcionais
        const cargosMap = new Map();

        functionalSites.forEach((sitio: any) => {
          sitio.staff?.forEach((staffMember: any) => {
            const cargoId = staffMember.id;
            const cargoNome = staffMember.role;
            const quantidade = staffMember.quantity || 0;

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
        
        console.log('=== BASELINE TAB - CARGOS CALCULADOS ===');
        console.log('Cargos agregados dos sítios:', cargosArray);
        console.log('========================================');

        return cargosArray;
      }

      // Se não tem sítios, usa staff direto (estrutura antiga)
      return (assistanceSector.staff || []).map((staffMember: any) => ({
        cargo: {
          id: staffMember.id,
          nome: staffMember.role,
        },
        quantidade_funcionarios: staffMember.quantity,
      }));
    }

    console.log('=== BASELINE TAB - SETOR NÃO ENCONTRADO ===');
    console.log('Setor ID procurado:', setorId);
    console.log('===========================================');

    return [];
  }, [snapshotSelecionado, setorId]);

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

  // Localiza o setor pelo ID no snapshot para pegar o nome
  const setorSnapshot = useMemo(() => {
    if (!snapshotSelecionado?.dados || !setorId) return null as any;
    const dados = snapshotSelecionado.dados;
    const inIntern = dados.internation?.find((s: any) => s.id === setorId);
    if (inIntern) return inIntern as any;
    const inAssist = dados.assistance?.find((s: any) => s.id === setorId);
    return inAssist as any;
  }, [snapshotSelecionado, setorId]);

  const setorNome = setorSnapshot?.name?.toString() ?? "";

  // Removidos cálculos de custo (não serão mais exibidos)

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
