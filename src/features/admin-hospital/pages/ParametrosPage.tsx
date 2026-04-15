import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  getParametros,
  saveParametros,
  ParametrosUnidade,
  CreateParametrosDTO,
  getAnaliseInternacao,
  AnaliseInternacaoResponse,
  getUnidadeById,
  getControlePeriodoByUnidadeId,
  exportDimensionamentoPdf,
} from "@/lib/api";
import { Settings, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Constante com valores tabelados de horas de enfermagem por classificação de paciente
const HORAS_TABELADAS_POR_CLASSIFICACAO: Record<string, number> = {
  MINIMOS: 4, // PCM - Pacientes de Cuidados Mínimos
  INTERMEDIARIOS: 6, // PCI - Pacientes de Cuidados Intermediários
  ALTA_DEPENDENCIA: 10, // PADC - Pacientes de Alta Dependência de Cuidados
  SEMI_INTENSIVOS: 10, // PCSI - Pacientes de Cuidados Semi-Intensivos
  INTENSIVOS: 18,
};

// Função para obter horas tabeladas independente do formato da chave
const getHorasTabeladas = (classificacao: string): number | undefined => {
  // Tentar busca direta
  if (HORAS_TABELADAS_POR_CLASSIFICACAO[classificacao] !== undefined) {
    return HORAS_TABELADAS_POR_CLASSIFICACAO[classificacao];
  }

  // Tentar buscar pela chave normalizada (sem underscores e lowercase)
  const chaveNormalizada = classificacao.toLowerCase().replace(/_/g, " ");
  const entrada = Object.entries(HORAS_TABELADAS_POR_CLASSIFICACAO).find(
    ([key]) => key.toLowerCase().replace(/_/g, " ") === chaveNormalizada
  );

  return entrada ? entrada[1] : undefined;
};

export default function ParametrosPage() {
  const { setorId } = useParams<{ setorId: string }>();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const readOnly = ["GESTOR_ESTRATEGICO_HOSPITAL", "GESTOR_ESTRATEGICO_REDE"].includes(user?.tipo ?? "");
  const [parametros, setParametros] = useState<Partial<CreateParametrosDTO>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analise, setAnalise] = useState<AnaliseInternacaoResponse | null>(
    null
  );
  const [isInternacao, setIsInternacao] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [periodo, setPeriodo] = useState<{ inicio: string; fim: string } | null>(null);

  const handleExportPdf = async () => {
    if (!setorId) return;
    try {
      setIsExportingPdf(true);
      await exportDimensionamentoPdf(setorId, periodo ?? undefined);
    } catch {
      showAlert("destructive", "Erro", "Não foi possível gerar o relatório PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!setorId) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        // Buscar informações da unidade para saber se é internação
        const unidadeData = await getUnidadeById(setorId);
        if (mounted) {
          setIsInternacao(unidadeData.tipo === "internacao");
        }

        // Se for internação, buscar período salvo e então análise para exibir os cards
        if (unidadeData.tipo === "internacao") {
          try {
            // Buscar o período salvo (travado ou não)
            const periodoSalvo = await getControlePeriodoByUnidadeId(setorId);

            // Somar 12h antes de extrair a data evita deslocamento de timezone:
            // o banco pode retornar meia-noite UTC (ex: 2026-01-24T21:00Z = meia-noite UTC-3),
            // que sem correção produziria um dia a menos.
            const safeDate = (iso: string) =>
              new Date(new Date(iso).getTime() + 12 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0];

            // Montar parâmetros de período se existir período salvo
            const params = periodoSalvo
              ? {
                  inicio: safeDate(periodoSalvo.dataInicial),
                  fim: safeDate(periodoSalvo.dataFinal),
                }
              : undefined;

            if (mounted && params) {
              setPeriodo(params);
            }

            const analiseData = await getAnaliseInternacao(setorId, params);
            if (mounted) {
              setAnalise(analiseData);
            }
          } catch (err) {
            console.warn("Não foi possível carregar análise:", err);
          }
        }

        const data = await getParametros(setorId);

        if (!mounted) return;
        if (data) {
          // Normaliza horas: mantém decimais se existirem, remove se forem zero
          const normalizeHours = (v: any): number | undefined => {
            if (v === null || v === undefined) return undefined;
            let n: number | undefined = undefined;
            if (typeof v === "number") n = v;
            else {
              const s = String(v).replace(/,/g, ".").trim();
              const parsed = Number(s);
              if (!Number.isNaN(parsed)) n = parsed;
            }
            if (n === undefined) return undefined;
            return n % 1 === 0 ? Math.trunc(n) : n;
          };
          const onlyDigitsStr = (v: any): string | undefined => {
            if (v === null || v === undefined) return undefined;
            const digits = String(v).replace(/\D/g, "");
            return digits === "" ? undefined : digits;
          };

          const istPercentNum =
            data.ist !== undefined && data.ist !== null
              ? Math.round(Number(data.ist) * 100)
              : undefined;
          setParametros({
            ...data,
            ist: istPercentNum,
            cargaHorariaEnfermeiro: normalizeHours(
              (data as any).cargaHorariaEnfermeiro
            ),
            cargaHorariaTecnico: normalizeHours(
              (data as any).cargaHorariaTecnico
            ),
          } as any);
        } else {
          setParametros({}); // aceita null/undefined -> {} (sem parâmetros)
        }
      } catch (err: any) {
        // se a API retornar 404 / not found, considerar como "sem parâmetros" (não é erro)
        const status = err?.response?.status ?? err?.status;
        const isNotFound =
          status === 404 || /not\s*found/i.test(err?.message ?? "");
        if (isNotFound) {
          if (mounted) setParametros({});
        } else {
          if (mounted) setError("Falha ao carregar parâmetros.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [setorId]);

  const recarregarAnalise = async () => {
    if (!setorId || !isInternacao) return;

    try {
      // Buscar o período salvo (travado ou não)
      const periodoSalvo = await getControlePeriodoByUnidadeId(setorId);

      const safeDate = (iso: string) =>
        new Date(new Date(iso).getTime() + 12 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

      // Montar parâmetros de período se existir período salvo
      const params = periodoSalvo
        ? {
            inicio: safeDate(periodoSalvo.dataInicial),
            fim: safeDate(periodoSalvo.dataFinal),
          }
        : undefined;

      const analiseData = await getAnaliseInternacao(setorId, params);
      setAnalise(analiseData);
    } catch (err) {
      console.warn("Não foi possível recarregar análise:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    // Campos numéricos que devem ser inteiros (sem casas): horas e IST (%)
    const integerFields = [
      "cargaHorariaEnfermeiro",
      "cargaHorariaTecnico",
      "ist",
    ];

    if (name === "ist") {
      // IST exibido em porcentagem inteira no UI; normaliza vírgula para ponto e mantém apenas inteiros
      const onlyDigits = value.replace(/\D/g, "");
      const num = onlyDigits === "" ? undefined : Number(onlyDigits);
      setParametros((prev) => ({ ...prev, ist: num as any }));
      return;
    }

    if (name === "cargaHorariaEnfermeiro" || name === "cargaHorariaTecnico") {
      // Aceita vírgula ou ponto como separador decimal e remove decimais apenas se forem zero
      const normalized = value.replace(/,/g, ".").trim();
      if (normalized === "") {
        setParametros((prev) => ({ ...prev, [name]: undefined as any }));
        return;
      }
      const parsed = Number(normalized);
      if (Number.isNaN(parsed)) {
        setParametros((prev) => ({ ...prev, [name]: undefined as any }));
        return;
      }
      const finalValue = parsed % 1 === 0 ? Math.trunc(parsed) : parsed;
      setParametros((prev) => ({ ...prev, [name]: finalValue }));
      return;
    }

    setParametros((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!setorId) return;

    if (parametros.aplicarIST === undefined || parametros.aplicarIST === null) {
      parametros.aplicarIST = false;
    }
    try {
      // Converte IST de porcentagem inteira para decimal antes de enviar
      const payload: CreateParametrosDTO = {
        ...parametros,
        // Converte IST inteiro -> decimal
        ist:
          parametros.ist !== undefined && parametros.ist !== null
            ? Number(parametros.ist as any) / 100
            : undefined,
        // Garante tipos corretos nos numéricos
        cargaHorariaEnfermeiro:
          parametros.cargaHorariaEnfermeiro !== undefined &&
          parametros.cargaHorariaEnfermeiro !== null
            ? Number(parametros.cargaHorariaEnfermeiro as any)
            : undefined,
        cargaHorariaTecnico:
          parametros.cargaHorariaTecnico !== undefined &&
          parametros.cargaHorariaTecnico !== null
            ? Number(parametros.cargaHorariaTecnico as any)
            : undefined,
        diasSemana: parametros.diasSemana ?? "7",
      } as CreateParametrosDTO;


      await saveParametros(setorId, payload);
      showAlert("success", "Sucesso", "Parâmetros salvos com sucesso!");

      // Recarregar análise para atualizar dimensionamento
      await recarregarAnalise();
    } catch (err) {
      setError("Falha ao salvar parâmetros.");
      showAlert("destructive", "Erro", "Falha ao salvar parâmetros.");
    }
  };

  if (loading) return <p>Carregando parâmetros...</p>;

  return (
    <div className="space-y-6 max-w-[95vw] mx-auto">
      {error && <p className="text-red-500">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg border shadow-sm space-y-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <Settings />
          <h2 className="text-2xl font-bold text-primary">
            Parâmetros da Unidade
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nome do Enfermeiro Responsável
            </label>
            <input
              name="nome_enfermeiro"
              value={parametros.nome_enfermeiro || ""}
              onChange={handleChange}
              disabled={readOnly}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Número do COREN
            </label>
            <input
              name="numero_coren"
              value={parametros.numero_coren || ""}
              onChange={handleChange}
              disabled={readOnly}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Método de Cálculo
            </label>
            <input
              name="metodoCalculo"
              value={(parametros as any).metodoCalculo || ""}
              onChange={handleChange}
              disabled={readOnly}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Jornada Semanal Enfermeiro (horas)
            </label>
            <input
              name="cargaHorariaEnfermeiro"
              type="number"
              inputMode="numeric"
              step="any"
              value={(parametros.cargaHorariaEnfermeiro as any) || ""}
              onChange={handleChange}
              disabled={readOnly}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Jornada Semanal Técnico (horas)
            </label>
            <input
              name="cargaHorariaTecnico"
              type="number"
              inputMode="numeric"
              step="any"
              value={(parametros.cargaHorariaTecnico as any) || ""}
              onChange={handleChange}
              disabled={readOnly}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div className="w-48">
            <label className="block text-sm font-medium mb-2">
              Valor do IST (%)
            </label>
            <input
              name="ist"
              type="number"
              inputMode="numeric"
              value={parametros.ist || ""}
              onChange={handleChange}
              disabled={readOnly}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium mb-2">
              Dias de Trabalho por Semana
            </label>
            <input
              name="diasSemana"
              type="number"
              inputMode="numeric"
              min={1}
              max={7}
              value={(parametros as any).diasSemana ?? ""}
              onChange={handleChange}
              disabled={readOnly}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="flex items-start gap-3 flex-1 pt-7">
            <input
              id="aplicarIST"
              name="aplicarIST"
              type="checkbox"
              checked={parametros.aplicarIST || false}
              onChange={handleChange}
              disabled={readOnly}
              className="h-4 w-4 rounded mt-1"
            />
            <label htmlFor="aplicarIST" className="text-sm font-medium">
              Equipe de enfermagem é composta em sua maioria de pessoas com
              idade superior a 50 anos, ou 20% da equipe com restrições?
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
          >
            <FileDown className="h-4 w-4 mr-2" />
            {isExportingPdf ? "Gerando PDF..." : "Exportar Relatório"}
          </Button>
          {!readOnly && (
          <button
            type="submit"
            className="px-4 py-2 text-white bg-green-600 rounded-md"
          >
            Salvar Parâmetros
          </button>
          )}
        </div>
      </form>

      {/* Informações de Dimensionamento (apenas para Internação) */}
      {isInternacao && analise && (
        <div className="space-y-6">
          {/* ── Informações da Unidade ── */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-4">
              Informações da Unidade
            </h3>
            <div className="grid grid-cols-3 divide-x border rounded-md overflow-hidden">
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Unidade
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {analise.agregados.unidadeNome || "-"}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Método SCP
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {analise.agregados.metodoAvaliacaoSCP?.title ||
                    analise.agregados.metodoAvaliacaoSCP?.key ||
                    "-"}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Total de Leitos
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {analise.agregados.totalLeitos || 0}
                </p>
              </div>
            </div>
          </div>

          {/* ── Período de Análise ── */}
          {analise.agregados.periodo && (
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-bold text-primary mb-4">
                Período de Análise
              </h3>
              <div className="grid grid-cols-3 divide-x border rounded-md overflow-hidden">
                <div className="px-4 py-3 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Data Início
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {analise.agregados.periodo.inicio.substring(0, 10).split("-").reverse().join("/")}
                  </p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Data Fim
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {analise.agregados.periodo.fim.substring(0, 10).split("-").reverse().join("/")}
                  </p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Total de Dias
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {analise.agregados.periodo.dias}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Ocupação e Avaliações ── */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-4">
              Ocupação e Avaliações
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 divide-x border rounded-md overflow-hidden">
              {[
                {
                  label: "Taxa Média de Ocupação (Período)",
                  value: analise.agregados.taxaOcupacaoPeriodoPercent
                    ? `${Number(analise.agregados.taxaOcupacaoPeriodoPercent).toFixed(2)}%`
                    : "-",
                },
                {
                  label: "Leitos Avaliados (%)",
                  value: analise.agregados.percentualLeitosAvaliados
                    ? `${Number(analise.agregados.percentualLeitosAvaliados).toFixed(1)}%`
                    : "-",
                },
                {
                  label: "Leitos Dia/Período",
                  value: analise.agregados.totalLeitosDia || 0,
                },
                {
                  label: "Total de Avaliações",
                  value: analise.agregados.totalAvaliacoes || 0,
                },
                {
                  label: "Leitos Ocupados",
                  value: analise.agregados.leitosOcupados || 0,
                },
                {
                  label: "Leitos Vagos",
                  value: analise.agregados.leitosVagos || 0,
                },
                {
                  label: "Leitos Inativos",
                  value: analise.agregados.leitosInativos || 0,
                },
                {
                  label: "Leitos Pendentes",
                  value: (analise.agregados as any)?.leitosPendentes ?? "-",
                },
              ].map((item, i) => (
                <div key={i} className="px-3 py-3 text-center">
                  <p className="text-xs font-semibold text-muted-foreground leading-tight mb-1">
                    {item.label}
                  </p>
                  <p className="text-lg font-bold text-primary">{item.value}</p>
                </div>
              ))}
            </div>
            {(() => {
                const custom = analise.agregados.taxaOcupacaoCustomizada;
                const useReal = custom?.utilizarComoBaseCalculo && custom?.distribuicaoTotalClassificacaoReal &&
                  Object.keys(custom.distribuicaoTotalClassificacaoReal).length > 0;
                const distSource = useReal
                  ? custom!.distribuicaoTotalClassificacaoReal!
                  : analise.agregados.distribuicaoTotalClassificacao || {};
                const totalAv = Object.values(distSource).reduce((acc, v) => acc + Number(v), 0);
                const ORDEM = ["MINIMOS", "INTERMEDIARIOS", "ALTA_DEPENDENCIA", "SEMI_INTENSIVOS", "INTENSIVOS"];
                const raw = Object.entries(distSource);
                const clfs = [
                  ...ORDEM.map((k) => raw.find(([rk]) => rk === k)).filter((e): e is [string, number] => e !== undefined),
                  ...raw.filter(([k]) => !ORDEM.includes(k)),
                ];

                if (clfs.length === 0) return null;

                return (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Distribuição da Classificação</p>
                    <div
                      className="grid divide-x border rounded-md overflow-hidden"
                      style={{ gridTemplateColumns: `repeat(${clfs.length}, 1fr)` }}
                    >
                      {clfs.map(([classificacao, total]) => {
                        const pct = totalAv > 0 ? (Number(total) / totalAv) * 100 : 0;
                        return (
                          <div key={classificacao} className="px-3 py-3 text-center">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">
                              {classificacao.replace(/_/g, " ")}
                            </p>
                            <p className="text-xl font-bold text-primary">{pct.toFixed(2)}%</p>
                            <p className="text-xs text-muted-foreground mt-1">{Number(total)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
          </div>
          {analise.agregados.taxaOcupacaoCustomizada?.utilizarComoBaseCalculo && (
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-4">
              Base de Cálculo
            </h3>
            {(() => {
              const custom = analise.agregados.taxaOcupacaoCustomizada;
              const taxa = custom?.taxa
                ? `${custom.taxa}%`
                : analise.agregados.taxaOcupacaoPeriodoPercent
                  ? `${Number(analise.agregados.taxaOcupacaoPeriodoPercent).toFixed(2)}%`
                  : "-";
              const leitosOcupados = custom?.leitosOcupados ?? analise.agregados.leitosOcupados ?? 0;
              const pacientesMedio = custom?.totalPacientesMedio ?? analise.agregados.totalPacientesMedio;
              const pctLeitos = custom?.percentualLeitosAvaliados;
              const distSim = custom?.distribuicaoClassificacao;
              const hasBaseCalculo = custom?.utilizarComoBaseCalculo || false;
              const hasDistSim = distSim && Object.keys(distSim).length > 0;
              const leitosSimulados = custom?.leitosSimulados;
              const ORDEM_SIM = ["MINIMOS", "INTERMEDIARIOS", "ALTA_DEPENDENCIA", "SEMI_INTENSIVOS", "INTENSIVOS"];
              const distSimEntries = hasDistSim
                ? [
                    ...ORDEM_SIM.filter((k) => distSim![k] != null),
                    ...Object.keys(distSim!).filter((k) => !ORDEM_SIM.includes(k)),
                  ]
                : [];
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 sm:grid-cols-9 divide-x border rounded-md overflow-hidden">
                    {[
                      {
                        label: "Taxa de Ocupação",
                        value: taxa,
                      },
                      {
                        label: "% Leitos Avaliados",
                        value: pctLeitos != null ? `${Number(pctLeitos).toFixed(1)}%` : "-",
                      },
                      {
                        label: "Leitos Dia/Período",
                        value: analise.agregados.totalLeitosDia ?? "-",
                      },
                       {
                        label: "Total de Avaliações",
                        value: leitosSimulados?.leitosAvaliados ?? "-",
                      },
                      {
                        label: "Leitos Ocupados",
                        value: leitosSimulados?.leitosOcupados ?? leitosOcupados ?? 0,
                      },
                      {
                        label: "Leitos Vagos",
                        value: leitosSimulados?.leitosVagos ?? "-",
                      },
                      {
                        label: "Leitos Inativos",
                        value: leitosSimulados?.leitosInativos ?? "-",
                      },
                      {
                        label: "Leitos Pendentes",
                        value: leitosSimulados?.leitosPendentes ?? "-",
                      },
                      {
                        label: "Pacientes Médio/dia",
                        value: pacientesMedio ? Number(pacientesMedio).toFixed(2) : "-",
                      },
                    ].map((item, i) => (
                      <div key={i} className="px-3 py-3 text-center">
                        <p className="text-xs font-semibold text-muted-foreground leading-tight mb-1">
                          {item.label}
                        </p>
                        <p className="text-lg font-bold text-primary">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {hasDistSim && hasBaseCalculo && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        Distribuição por nível SCP 
                      </p>
                      <div
                        className="grid divide-x border rounded-md overflow-hidden"
                        style={{ gridTemplateColumns: `repeat(${distSimEntries.length}, 1fr)` }}
                      >
                        {distSimEntries.map((key) => {
                            const pctVal = Number(distSim![key]);
                            const baseLeitos = leitosSimulados?.leitosOcupados ?? custom?.leitosOcupados ?? 0;
                            const count = baseLeitos > 0 ? Math.round((pctVal / 100) * baseLeitos) : null;
                            return (
                              <div key={key} className="px-3 py-3 text-center">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">
                                  {key.replace(/_/g, " ")}
                                </p>
                                <p className="text-lg font-bold text-primary">
                                  {pctVal.toFixed(1)}%
                                </p>
                                {count !== null && (
                                  <p className="text-xs text-muted-foreground mt-1">{count}</p>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  
                </div>
              );
            })()}
          </div>
          )}

          {/* ── Distribuição + Horas + Classificação + QP ── */}
          {analise.agregados.distribuicaoTotalClassificacao &&
            Object.keys(analise.agregados.distribuicaoTotalClassificacao)
              .length > 0 &&
            (() => {
              const ag = analise?.agregados as any;
              const totalAvaliacoes = Object.values(
                analise.agregados.distribuicaoTotalClassificacao!
              ).reduce((acc, v) => acc + Number(v), 0);
              const ORDEM_CLASSIFICACOES = [
                "MINIMOS",
                "INTERMEDIARIOS",
                "ALTA_DEPENDENCIA",
                "SEMI_INTENSIVOS",
                "INTENSIVOS",
              ];
              const rawClassificacoes = Object.entries(
                analise.agregados.distribuicaoTotalClassificacao
              );
              const classificacoes = [
                ...ORDEM_CLASSIFICACOES.map((key) =>
                  rawClassificacoes.find(([k]) => k === key)
                ).filter(
                  (entry): entry is [string, number] => entry !== undefined
                ),
                ...rawClassificacoes.filter(
                  ([k]) => !ORDEM_CLASSIFICACOES.includes(k)
                ),
              ];
              const colCount = classificacoes.length ;

              const PERCENTUAIS: Record<string, { enf: number; tec: number }> =
                {
                  MINIMOS: { enf: 33, tec: 67 },
                  INTERMEDIARIOS: { enf: 33, tec: 67 },
                  ALTA_DEPENDENCIA: { enf: 36, tec: 64 },
                  SEMI_INTENSIVOS: { enf: 42, tec: 58 },
                  INTENSIVOS: { enf: 52, tec: 48 },
                };
              const getPercentuais = (classificacao: string) => {
                const key = classificacao.toUpperCase().replace(/ /g, "_");
                return (
                  PERCENTUAIS[key] ??
                  PERCENTUAIS[classificacao] ?? { enf: "-", tec: "-" }
                );
              };

              return (
                <>
                  {/* Horas de Enfermagem por Classificação */}
                  <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-bold text-primary mb-4">
                      Horas de Enfermagem por Classificação
                    </h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-bold">
                              Classificação
                            </TableHead>
                            <TableHead className="text-center font-bold">
                              Hora/Paciente
                              <br />
                              (Art. 3°, I)
                            </TableHead>
                            <TableHead className="text-center font-bold">
                              Enfermeiros %<br />
                              (Tabela Art. 3°, II)
                            </TableHead>
                            <TableHead className="text-center font-bold">
                              Técnicos/Aux %<br />
                              (Tabela Art. 3°, II)
                            </TableHead>
                            <TableHead className="text-center font-bold">
                              Média Diária
                              <br />
                              de Pacientes
                            </TableHead>
                            <TableHead className="text-center font-bold">
                              Horas de Enfermagem
                              <br />
                              (THE)
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            let totalHoras = 0;
                            const rows = classificacoes.map(
                              ([classificacao]) => {
                                const mediaDiaria =
                                  ag?.mediaDiariaClassificacao?.[classificacao];
                                const horasPorPaciente =
                                  getHorasTabeladas(classificacao);
                                const horasEnfermagem =
                                  horasPorPaciente !== undefined &&
                                  mediaDiaria !== undefined
                                    ? horasPorPaciente * Number(mediaDiaria)
                                    : ag?.horasEnfermagemPorClassificacao?.[
                                        classificacao
                                      ];
                                if (horasEnfermagem !== undefined)
                                  totalHoras += Number(horasEnfermagem);
                                const pcts = getPercentuais(classificacao);
                                return (
                                  <TableRow key={classificacao}>
                                    <TableCell className="font-medium">
                                      {classificacao.replace(/_/g, " ")}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {horasPorPaciente !== undefined
                                        ? `${horasPorPaciente}h`
                                        : "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {typeof pcts.enf === "number"
                                        ? `${pcts.enf}%`
                                        : "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {typeof pcts.tec === "number"
                                        ? `${pcts.tec}%`
                                        : "-"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {mediaDiaria !== undefined
                                        ? Number(mediaDiaria).toFixed(2)
                                        : "-"}
                                    </TableCell>
                                    <TableCell className="text-center font-semibold">
                                      {horasEnfermagem !== undefined
                                        ? `${Number(horasEnfermagem).toFixed(2)}h`
                                        : "-"}
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                            );
                            return (
                              <>
                                {rows}
                                <TableRow className="bg-muted/50 font-bold border-t-2">
                                  <TableCell colSpan={5} className="text-right">
                                    Total de Horas de Enfermagem:
                                  </TableCell>
                                  <TableCell className="text-center text-primary">
                                    {totalHoras.toFixed(2)}h
                                  </TableCell>
                                </TableRow>
                              </>
                            );
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Classificação de Paciente */}
                  <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-bold text-primary mb-4">
                      Classificação de Paciente
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 divide-x border rounded-md overflow-hidden">
                      {[
                        {
                          label: "Total Horas Enfermagem (Período)",
                          value: (() => {
                            let t = 0;
                            classificacoes.forEach(([clf]) => {
                              const md =
                                ag?.mediaDiariaClassificacao?.[clf];
                              const hp = getHorasTabeladas(clf);
                              if (hp !== undefined && md !== undefined)
                                t += hp * Number(md);
                            });
                            return `${t.toFixed(2)}h`;
                          })(),
                        },
                        {
                          label: "KM (Enfermeiro)",
                          value:
                            ag?.kmEnfermeiro !== undefined
                              ? Number(ag.kmEnfermeiro).toLocaleString(
                                  "pt-BR",
                                  {
                                    minimumFractionDigits: 3,
                                    maximumFractionDigits: 3,
                                  }
                                )
                              : "-",
                        },
                        {
                          label: "KM (Técnico)",
                          value:
                            ag?.kmTecnico !== undefined
                              ? Number(ag.kmTecnico).toLocaleString("pt-BR", {
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3,
                                })
                              : "-",
                        },
                        {
                          label: "Nível de Cuidado Predominante",
                          value:
                            analise.agregados.nivelCuidadoPredominante || "-",
                        },
                        {
                          label: "% Enfermeiro",
                          value:
                            ag?.percentualEnfermeiroPercent !== undefined
                              ? `${Number(ag.percentualEnfermeiroPercent).toFixed(0)}%`
                              : ag?.percentualEnfermeiro !== undefined
                                ? `${(Number(ag.percentualEnfermeiro) * 100).toFixed(0)}%`
                                : "-",
                        },
                        {
                          label: "% Técnico",
                          value:
                            ag?.percentualTecnicoPercent !== undefined
                              ? `${Number(ag.percentualTecnicoPercent).toFixed(0)}%`
                              : ag?.percentualTecnico !== undefined
                                ? `${(Number(ag.percentualTecnico) * 100).toFixed(0)}%`
                                : "-",
                        },
                      ].map((item, i) => (
                        <div key={i} className="px-3 py-3 text-center">
                          <p className="text-xs font-semibold text-muted-foreground leading-tight mb-1">
                            {item.label}
                          </p>
                          <p className="text-lg font-bold text-primary">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quadro de Pessoal Dimensionado */}
                  <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-bold text-primary mb-1">
                      Quadro de Pessoal Dimensionado
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      TOTAL de Profissionais:{" "}
                      <span className="font-bold text-primary">
                        {analise.agregados.qpTotal !== undefined
                          ? Number(analise.agregados.qpTotal).toLocaleString(
                              "pt-BR",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )
                          : "-"}
                      </span>
                    </p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-bold"></TableHead>
                            <TableHead className="text-center font-bold">
                              Enfermeiros
                            </TableHead>
                            <TableHead className="text-center font-bold">
                              Técnicos
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">
                              Cuidado
                            </TableCell>
                            <TableCell className="text-center">
                              {ag?.cuidadoEnfermeiro !== undefined
                                ? Number(ag.cuidadoEnfermeiro).toLocaleString(
                                    "pt-BR",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {ag?.cuidadoTecnico !== undefined
                                ? Number(ag.cuidadoTecnico).toLocaleString(
                                    "pt-BR",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : "-"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              Segurança técnica
                            </TableCell>
                            <TableCell className="text-center">
                              {ag?.segurancaEnfermeiro !== undefined
                                ? Number(ag.segurancaEnfermeiro).toLocaleString(
                                    "pt-BR",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {ag?.segurancaTecnico !== undefined
                                ? Number(ag.segurancaTecnico).toLocaleString(
                                    "pt-BR",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )
                                : "-"}
                            </TableCell>
                          </TableRow>
                          <TableRow className="bg-muted/50 font-bold border-t-2">
                            <TableCell>TOTAL de Profissionais</TableCell>
                            <TableCell className="text-center text-primary">
                              {analise.agregados.qpEnfermeiros !== undefined
                                ? Number(
                                    analise.agregados.qpEnfermeiros
                                  ).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : "-"}
                            </TableCell>
                            <TableCell className="text-center text-primary">
                              {analise.agregados.qpTecnicos !== undefined
                                ? Number(
                                    analise.agregados.qpTecnicos
                                  ).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })
                                : "-"}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              );
            })()}
        </div>
      )}
    </div>
  );
}
