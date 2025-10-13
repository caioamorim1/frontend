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
        setSnapshotData(null); // Garante que snapshotData fica null em caso de erro
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [hospitalId]);

  // Extrai os cargos da unidade específica do snapshot
  const cargos = useMemo(() => {
    if (!snapshotData || !setorId) {
      console.log("⚠️ [BASELINE TAB] Dados insuficientes:", {
        temSnapshotData: !!snapshotData,
        temSetorId: !!setorId,
      });
      return [];
    }

    console.log("🔍 [BASELINE TAB] ========================================");
    console.log("🔍 [BASELINE TAB] Processando dados do snapshot");
    console.log("🔍 [BASELINE TAB] SetorId buscado:", setorId);
    console.log("🔍 [BASELINE TAB] Tipo do setorId:", typeof setorId);
    console.log(
      "🔍 [BASELINE TAB] Snapshot - Internation:",
      snapshotData.internation?.length || 0,
      "setores"
    );
    console.log(
      "🔍 [BASELINE TAB] Snapshot - Assistance:",
      snapshotData.assistance?.length || 0,
      "setores"
    );
    console.log(
      "🔍 [BASELINE TAB] Snapshot completo:",
      JSON.stringify(snapshotData, null, 2)
    );

    // Procura primeiro nos setores de internação
    const internationSector = snapshotData.internation?.find(
      (sector) => sector.id === setorId
    );

    if (internationSector) {
      console.log("📊 [BASELINE TAB] Setor encontrado em INTERNAÇÃO");
      console.log(
        "📊 [BASELINE TAB] Dados do setor:",
        JSON.stringify(internationSector, null, 2)
      );
      console.log("📊 [BASELINE TAB] Staff:", internationSector.staff);

      // @ts-ignore - sitiosFuncionais ainda não está na interface
      const sitiosFuncionaisIntern = internationSector.sitiosFuncionais;
      console.log(
        "📊 [BASELINE TAB] Tem sitiosFuncionais?",
        !!sitiosFuncionaisIntern
      );

      if (sitiosFuncionaisIntern) {
        console.log(
          "📊 [BASELINE TAB] sitiosFuncionais:",
          JSON.stringify(sitiosFuncionaisIntern, null, 2)
        );
      }

      // Remove duplicatas baseado no nome do cargo
      const staffSemDuplicatas = internationSector.staff.filter(
        (staff, index, self) =>
          index === self.findIndex((s) => s.role === staff.role)
      );

      console.log(
        "✅ [BASELINE TAB] Staff sem duplicatas (internação):",
        staffSemDuplicatas
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

    console.log("🔎 [BASELINE TAB] Procurando em assistance...");
    console.log(
      "🔎 [BASELINE TAB] IDs disponíveis em assistance:",
      snapshotData.assistance?.map((s) => ({
        id: s.id,
        nome: s.name,
        tipo: typeof s.id,
      }))
    );
    console.log("🔎 [BASELINE TAB] Setor encontrado?", !!assistanceSector);

    if (assistanceSector) {
      console.log(
        "📊 [BASELINE TAB] ✅ Setor encontrado em ASSISTÊNCIA (não-internação)"
      );
      console.log("📊 [BASELINE TAB] Nome do setor:", assistanceSector.name);
      console.log("📊 [BASELINE TAB] ID do setor:", assistanceSector.id);
      console.log(
        "📊 [BASELINE TAB] Dados completos do setor:",
        JSON.stringify(assistanceSector, null, 2)
      );
      console.log(
        "📊 [BASELINE TAB] Staff length:",
        assistanceSector.staff?.length || 0
      );
      console.log("📊 [BASELINE TAB] Staff:", assistanceSector.staff);

      // @ts-ignore - sitiosFuncionais ainda não está na interface (aguardando backend)
      const sitiosFuncionais = assistanceSector.sitiosFuncionais;
      console.log(
        "📊 [BASELINE TAB] Tem sitiosFuncionais?",
        !!sitiosFuncionais
      );
      console.log(
        "📊 [BASELINE TAB] Tipo sitiosFuncionais:",
        typeof sitiosFuncionais
      );
      console.log(
        "📊 [BASELINE TAB] É array?",
        Array.isArray(sitiosFuncionais)
      );
      console.log("📊 [BASELINE TAB] Length:", sitiosFuncionais?.length);

      if (
        sitiosFuncionais &&
        Array.isArray(sitiosFuncionais) &&
        sitiosFuncionais.length > 0
      ) {
        console.log("✅ [BASELINE TAB] sitiosFuncionais ENCONTRADOS!");
        console.log(
          "📊 [BASELINE TAB] sitiosFuncionais:",
          JSON.stringify(sitiosFuncionais, null, 2)
        );

        // ✨ NOVA LÓGICA: Se tem sitiosFuncionais, calcular deles
        const cargosMap = new Map();

        sitiosFuncionais.forEach((sitio: any) => {
          console.log(`📍 [BASELINE TAB] Processando sítio: ${sitio.nome}`);

          sitio.cargosSitio?.forEach((cargoSitio: any) => {
            const cargoId = cargoSitio.cargoUnidade.cargo.id;
            const cargoNome = cargoSitio.cargoUnidade.cargo.nome;
            const quantidade = cargoSitio.quantidade_funcionarios || 0;

            console.log(`  └─ Cargo: ${cargoNome}, Quantidade: ${quantidade}`);

            if (cargosMap.has(cargoId)) {
              const existing = cargosMap.get(cargoId);
              existing.quantidade_funcionarios += quantidade;
              console.log(
                `    ✅ Somado ao existente. Total: ${existing.quantidade_funcionarios}`
              );
            } else {
              cargosMap.set(cargoId, {
                cargo: {
                  id: cargoId,
                  nome: cargoNome,
                },
                quantidade_funcionarios: quantidade,
              });
              console.log(`    ✅ Novo cargo adicionado`);
            }
          });
        });

        const cargosArray = Array.from(cargosMap.values());
        console.log("✅ [BASELINE TAB] Cargos calculados dos sítios:", {
          total: cargosArray.length,
          quantidadeTotal: cargosArray.reduce(
            (sum, c) => sum + c.quantidade_funcionarios,
            0
          ),
          detalhes: cargosArray,
        });

        return cargosArray;
      }

      // Se não tem sitiosFuncionais, usa staff (estrutura antiga)
      console.log(
        "⚠️ [BASELINE TAB] Sem sitiosFuncionais, usando staff (estrutura antiga)"
      );
      console.log("📊 [BASELINE TAB] Staff bruto:", assistanceSector.staff);

      // Remove duplicatas baseado no nome do cargo
      const staffSemDuplicatas = assistanceSector.staff.filter(
        (staff, index, self) =>
          index === self.findIndex((s) => s.role === staff.role)
      );

      console.log(
        "✅ [BASELINE TAB] Staff sem duplicatas:",
        staffSemDuplicatas
      );

      return staffSemDuplicatas.map((staffMember) => ({
        cargo: {
          id: staffMember.id,
          nome: staffMember.role,
        },
        quantidade_funcionarios: staffMember.quantity,
      }));
    }

    console.log("❌ [BASELINE TAB] Setor NÃO encontrado!");
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
