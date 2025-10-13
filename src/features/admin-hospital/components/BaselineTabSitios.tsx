import { useMemo, useEffect, useState } from "react";
import { getSnapshotHospitalSectors } from "@/lib/api";

interface BaselineTabSitiosProps {
  hospitalId: string;
  setorId: string;
}

export default function BaselineTabSitios({
  hospitalId,
  setorId,
}: BaselineTabSitiosProps) {
  const [snapshotData, setSnapshotData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      if (!hospitalId) return;

      setLoading(true);
      setError(null);

      try {
        const data = (await getSnapshotHospitalSectors(hospitalId)) as any;
        const dados = data.snapshot.dados;
        setSnapshotData(dados);
      } catch (err: any) {
        console.error("❌ Erro ao buscar snapshot:", err);
        if (err.response?.status === 404) {
          setError("Nenhum snapshot (baseline) encontrado para este hospital.");
        } else {
          setError("Erro ao carregar dados do baseline.");
        }
        setSnapshotData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, [hospitalId]);

  // Extrai os sítios do snapshot
  const sitiosAgrupados = useMemo(() => {
    if (!snapshotData || !setorId) return [];

    const assistanceSector = snapshotData.assistance?.find(
      (sector: any) => sector.id === setorId
    );

    if (!assistanceSector) return [];

    // @ts-ignore - sitiosFuncionais pode não existir ainda
    const sitiosFuncionais = assistanceSector.sitiosFuncionais;

    if (
      !sitiosFuncionais ||
      !Array.isArray(sitiosFuncionais) ||
      sitiosFuncionais.length === 0
    ) {
      return [];
    }

    // Retorna os sítios com seus cargos
    return sitiosFuncionais.map((sitio: any) => ({
      id: sitio.id,
      nome: sitio.nome,
      cargos:
        sitio.cargosSitio?.map((cs: any) => ({
          id: cs.cargoUnidade.cargo.id,
          nome: cs.cargoUnidade.cargo.nome,
          quantidade: cs.quantidade_funcionarios || 0,
        })) || [],
    }));
  }, [snapshotData, setorId]);

  // Calcula totais
  const totais = useMemo(() => {
    const totalFuncionarios = sitiosAgrupados.reduce(
      (sum, sitio) =>
        sum + sitio.cargos.reduce((s: number, c: any) => s + c.quantidade, 0),
      0
    );
    const totalCargosUnicos = new Set(
      sitiosAgrupados.flatMap((s) => s.cargos.map((c: any) => c.id))
    ).size;

    return {
      totalFuncionarios,
      totalSitios: sitiosAgrupados.length,
      totalCargosUnicos,
    };
  }, [sitiosAgrupados]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Baseline - Distribuição por Sítio
        </h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-sm text-gray-500">
            Carregando dados do baseline...
          </p>
        </div>
      </div>
    );
  }

  if (error || sitiosAgrupados.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Baseline - Distribuição por Sítio
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            {error ||
              "Não há dados de sítios funcionais no baseline para esta unidade."}
          </p>
          <p className="text-xs text-blue-600 mt-2">
            O snapshot precisa incluir os sítios funcionais. Aguardando
            atualização do backend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border">
      {/* Header com totais */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Baseline - Distribuição por Sítio
        </h2>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>
            <strong>{totais.totalSitios}</strong> sítios
          </span>
          <span>
            <strong>{totais.totalCargosUnicos}</strong> cargos diferentes
          </span>
          <span>
            <strong>{totais.totalFuncionarios}</strong> funcionários
          </span>
        </div>
      </div>

      {/* Lista de sítios */}
      <div className="space-y-3">
        {sitiosAgrupados.map((sitio: any) => (
          <div key={sitio.id} className="border-l-4 border-blue-500 pl-3">
            {/* Nome do sítio */}
            <h3 className="text-sm font-semibold text-blue-700 mb-2">
              {sitio.nome}{" "}
              <span className="text-gray-500 font-normal">
                ({sitio.cargos.length} cargo
                {sitio.cargos.length !== 1 ? "s" : ""})
              </span>
            </h3>

            {/* Tabela de cargos do sítio */}
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr>
                  <th>Cargo</th>
                  <th>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {sitio.cargos.map((cargo: any) => (
                  <tr
                    key={cargo.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="py-2 pl-2 text-gray-700">{cargo.nome}</td>
                    <td className="py-2 pr-2 text-right font-medium text-gray-900 w-24">
                      {cargo.quantidade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
