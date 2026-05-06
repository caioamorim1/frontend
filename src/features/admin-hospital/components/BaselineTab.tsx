import { useMemo, useEffect, useState } from "react";
import { Briefcase, Users, Calendar, BedDouble, CheckSquare, Activity } from "lucide-react";
import {
  getHospitalSnapshots,
  type Snapshot,
  getControlePeriodoByUnidadeId,
  getAnaliseInternacao,
  type AnaliseInternacaoResponse,
} from "@/lib/api";

const NIVEL_ORDER = [
  "MINIMOS", "CUIDADOS_MINIMOS",
  "INTERMEDIARIOS", "CUIDADOS_INTERMEDIARIOS",
  "ALTA_DEPENDENCIA",
  "SEMI_INTENSIVO", "SEMI_INTENSIVOS",
  "INTENSIVO", "INTENSIVOS",
];

const sortNiveis = (entries: [string, number][]) =>
  [...entries].sort(
    (a, b) => (NIVEL_ORDER.indexOf(a[0]) ?? 99) - (NIVEL_ORDER.indexOf(b[0]) ?? 99)
  );

const NIVEL_LABELS: Record<string, string> = {
  MINIMOS: "Mínimos",
  CUIDADOS_MINIMOS: "Mínimos",
  INTERMEDIARIOS: "Intermediários",
  CUIDADOS_INTERMEDIARIOS: "Intermediários",
  ALTA_DEPENDENCIA: "Alta Dependência",
  SEMI_INTENSIVO: "Semi-Intensivo",
  SEMI_INTENSIVOS: "Semi-Intensivo",
  INTENSIVO: "Intensivo",
  INTENSIVOS: "Intensivo",
};
const NIVEL_COLORS: Record<string, string> = {
  MINIMOS: "bg-sky-400",
  CUIDADOS_MINIMOS: "bg-sky-400",
  INTERMEDIARIOS: "bg-yellow-400",
  CUIDADOS_INTERMEDIARIOS: "bg-yellow-400",
  ALTA_DEPENDENCIA: "bg-orange-400",
  SEMI_INTENSIVO: "bg-orange-400",
  SEMI_INTENSIVOS: "bg-orange-400",
  INTENSIVO: "bg-red-500",
  INTENSIVOS: "bg-red-500",
};

interface QuadroFuncionariosProps {
  hospitalId: string;
  setorId: string;
}

export default function QuadroFuncionariosResumo({
  hospitalId,
  setorId,
}: QuadroFuncionariosProps) {
  const [snapshotSelecionado, setSnapshotSelecionado] =
    useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [periodo, setPeriodo] = useState<{ inicio: string; fim: string } | null>(null);
  const [analise, setAnalise] = useState<AnaliseInternacaoResponse | null>(null);
  const [observacoesMap, setObservacoesMap] = useState<Record<string, string>>({});
  const [projetadoRaw, setProjetadoRaw] = useState<any>(null);

  const safeDate = (iso: string) =>
    new Date(new Date(iso).getTime() + 12 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

  useEffect(() => {
    const fetchSnapshot = async () => {
      if (!hospitalId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch snapshot + control period in parallel
        const [snapshotsData, controlePeriodo] = await Promise.all([
          getHospitalSnapshots(hospitalId, 10),
          getControlePeriodoByUnidadeId(setorId).catch(() => null),
        ]);

        const snapshotSelecionado = snapshotsData.snapshots?.find(
          (s) => s.selecionado === true
        );

        if (!snapshotSelecionado) {
          setError(
            "Nenhum baseline selecionado para este hospital. Selecione um baseline na página de Baseline."
          );
          setSnapshotSelecionado(null);
        } else {
          setSnapshotSelecionado(snapshotSelecionado);
        }

        // Extract projetado data directly from snapshot (dados.projetadoFinal.internacao)
        const projetadoData =
          snapshotSelecionado?.dados?.projetadoFinal?.internacao?.find(
            (u: any) => u.unidadeId === setorId
          ) ?? null;

        if (projetadoData) {
          setProjetadoRaw(projetadoData);
          const map: Record<string, string> = {};
          projetadoData.cargos?.forEach((c: any) => {
            if (c.observacao) map[c.cargoId] = c.observacao;
          });
          setObservacoesMap(map);
        }

        // Fetch analise for internação stats
        const params = controlePeriodo?.dataInicial && controlePeriodo?.dataFinal
          ? { inicio: safeDate(controlePeriodo.dataInicial), fim: safeDate(controlePeriodo.dataFinal) }
          : undefined;
        if (params) setPeriodo(params);

        const analiseData = await getAnaliseInternacao(setorId, params).catch(() => null);
        if (analiseData) setAnalise(analiseData);

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
    const projetadoFinal = dados.projetadoFinal || {};

    // Procura primeiro nos setores de internação
    const internationSector = dados.internation?.find(
      (sector: any) => sector.id === setorId
    );

    if (internationSector) {
      // Buscar dados projetados desta unidade
      const unidadeProjetada = projetadoFinal.internacao?.find(
        (up: any) => up.unidadeId === setorId
      );

      return (internationSector.staff || []).map((staffMember: any) => {
        // Buscar quantidade projetada do cargo
        let quantidadeProjetada = null;
        if (unidadeProjetada && unidadeProjetada.cargos) {
          const cargoProj = unidadeProjetada.cargos.find(
            (c: any) => c.cargoId === staffMember.id
          );
          if (cargoProj) {
            quantidadeProjetada = cargoProj.projetadoFinal;
          }
        }

        return {
          cargo: {
            id: staffMember.id,
            nome: staffMember.role,
          },
          quantidade_funcionarios: staffMember.quantity,
          quantidade_projetada: quantidadeProjetada,
        };
      });
    }

    // Se não encontrou, procura nos setores de assistência (não-internação)
    const assistanceSector = dados.assistance?.find(
      (sector: any) => sector.id === setorId
    );

    if (assistanceSector) {
      // Buscar dados projetados desta unidade
      const unidadeProjetada = projetadoFinal.naoInternacao?.find(
        (up: any) => up.unidadeId === setorId
      );

      const functionalSites = assistanceSector.functionalSites;

      if (
        functionalSites &&
        Array.isArray(functionalSites) &&
        functionalSites.length > 0
      ) {
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
                quantidade_projetada: null,
              });
            }
          });
        });

        // Adicionar dados projetados aos cargos
        if (unidadeProjetada && unidadeProjetada.sitios) {
          unidadeProjetada.sitios.forEach((sitioProj: any) => {
            sitioProj.cargos?.forEach((cargoProj: any) => {
              if (cargosMap.has(cargoProj.cargoId)) {
                const cargo = cargosMap.get(cargoProj.cargoId);
                // Somar as quantidades projetadas de todos os sítios
                if (cargo.quantidade_projetada === null) {
                  cargo.quantidade_projetada = 0;
                }
                cargo.quantidade_projetada += cargoProj.projetadoFinal || 0;
              }
            });
          });
        }

        const cargosArray = Array.from(cargosMap.values());

        return cargosArray;
      }

      // Se não tem sítios, usa staff direto (estrutura antiga)
      return (assistanceSector.staff || []).map((staffMember: any) => {
        let quantidadeProjetada = null;
        if (unidadeProjetada && unidadeProjetada.cargos) {
          const cargoProj = unidadeProjetada.cargos.find(
            (c: any) => c.cargoId === staffMember.id
          );
          if (cargoProj) {
            quantidadeProjetada = cargoProj.projetadoFinal;
          }
        }

        return {
          cargo: {
            id: staffMember.id,
            nome: staffMember.role,
          },
          quantidade_funcionarios: staffMember.quantity,
          quantidade_projetada: quantidadeProjetada,
        };
      });
    }

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
    <div className="bg-white p-6 rounded-lg border animate-fade-in-down space-y-6">
      {/* Cabeçalho com totais */}
      <div className="flex justify-between items-start">
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

      {/* Painel de informações do período / análise */}
      {(periodo || analise) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {periodo && (
            <>
              <div className="bg-slate-50 border rounded-lg p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase">
                  <Calendar className="h-3.5 w-3.5" /> Data Inicial
                </div>
                <p className="font-bold text-sm text-primary">
                  {new Date(periodo.inicio + "T12:00:00").toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="bg-slate-50 border rounded-lg p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase">
                  <Calendar className="h-3.5 w-3.5" /> Data Final
                </div>
                <p className="font-bold text-sm text-primary">
                  {new Date(periodo.fim + "T12:00:00").toLocaleDateString("pt-BR")}
                </p>
              </div>
            </>
          )}

          {analise && (
            <>
              <div className="bg-slate-50 border rounded-lg p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase">
                  <BedDouble className="h-3.5 w-3.5" /> Taxa de Ocupação
                </div>
                <p className="font-bold text-sm text-primary">
                  {projetadoRaw?.utilizarComoBaseCalculo === true && projetadoRaw?.taxa != null
                    ? `${Number(projetadoRaw.taxa).toFixed(1)}%`
                    : "0.0%"}
                </p>
                <p className="text-[10px] text-muted-foreground">para fins de cálculo</p>
              </div>

              {analise.agregados.taxaOcupacaoPeriodoPercent != null && (
                <div className="bg-slate-50 border rounded-lg p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase">
                    <Activity className="h-3.5 w-3.5" /> Taxa Média
                  </div>
                  <p className="font-bold text-sm text-primary">
                    {analise.agregados.taxaOcupacaoPeriodoPercent.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">média do período</p>
                </div>
              )}

              {(analise.agregados.percentualLeitosAvaliadosPercent != null ||
                analise.agregados.percentualLeitosAvaliados != null) && (
                <div className="bg-slate-50 border rounded-lg p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase">
                    <CheckSquare className="h-3.5 w-3.5" /> Leitos Avaliados
                  </div>
                  <p className="font-bold text-sm text-primary">
                    {(
                      analise.agregados.percentualLeitosAvaliadosPercent ??
                      analise.agregados.percentualLeitosAvaliados ??
                      0
                    ).toFixed(1)}%
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Níveis de Cuidado */}
      {analise?.agregados.distribuicaoTotalClassificacao &&
        Object.keys(analise.agregados.distribuicaoTotalClassificacao).length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
              Níveis de Cuidado
            </p>
            <div className="flex flex-wrap gap-2">
              {sortNiveis(Object.entries(analise.agregados.distribuicaoTotalClassificacao) as [string, number][]).map(
                ([nivel, qty]) => (
                  <div
                    key={nivel}
                    className="flex items-center gap-1.5 bg-slate-50 border rounded-full px-3 py-1 text-xs font-medium"
                  >
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        NIVEL_COLORS[nivel] ?? "bg-gray-400"
                      }`}
                    />
                    {NIVEL_LABELS[nivel] ?? nivel}: {qty}
                  </div>
                )
              )}
            </div>
          </div>
        )}

      {/* Níveis de Cuidado Personalizados (quando utilizarComoBaseCalculo = true) */}
      {projetadoRaw?.utilizarComoBaseCalculo === true &&
        projetadoRaw?.distribuicaoPorcentagem &&
        Object.keys(projetadoRaw.distribuicaoPorcentagem).length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
              Níveis de Cuidado Personalizados
            </p>
            <div className="flex flex-wrap gap-2">
              {sortNiveis(Object.entries(projetadoRaw.distribuicaoPorcentagem) as [string, number][]).map(
                ([nivel, pct]) => (
                  <div
                    key={nivel}
                    className="flex items-center gap-1.5 bg-slate-50 border rounded-full px-3 py-1 text-xs font-medium"
                  >
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${
                        NIVEL_COLORS[nivel] ?? "bg-gray-400"
                      }`}
                    />
                    {NIVEL_LABELS[nivel] ?? nivel}: {pct}%
                  </div>
                )
              )}
            </div>
          </div>
        )}

      {/* Tabela com Atual e Projetado */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3 w-2/5">
                Cargo
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Atual Baseline
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Projetado Baseline
              </th>
              <th scope="col" className="px-6 py-3">
                Observações
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
                <td className="px-6 py-4 text-right font-bold text-primary">
                  {item.quantidade_projetada !== null &&
                  item.quantidade_projetada !== undefined
                    ? item.quantidade_projetada
                    : "-"}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground italic">
                  {observacoesMap[item.cargo.id] ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
