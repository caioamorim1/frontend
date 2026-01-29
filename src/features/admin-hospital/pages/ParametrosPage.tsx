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
  getPeriodoTravado,
} from "@/lib/api";
import { Settings } from "lucide-react";
import { useAlert } from "@/contexts/AlertContext";
import { Card, CardContent } from "@/components/ui/card";
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
  const [parametros, setParametros] = useState<Partial<CreateParametrosDTO>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analise, setAnalise] = useState<AnaliseInternacaoResponse | null>(
    null
  );
  const [isInternacao, setIsInternacao] = useState(false);

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

        // Se for internação, buscar período travado e então análise para exibir os cards
        if (unidadeData.tipo === "internacao") {
          try {
            // Primeiro buscar o período travado
            const periodoTravado = await getPeriodoTravado(setorId);

            // Montar parâmetros de período se existir período travado
            const params = periodoTravado
              ? {
                  inicio: periodoTravado.dataInicial.split("T")[0], // YYYY-MM-DD
                  fim: periodoTravado.dataFinal.split("T")[0], // YYYY-MM-DD
                }
              : undefined;

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
      // Buscar período travado
      const periodoTravado = await getPeriodoTravado(setorId);

      // Montar parâmetros de período se existir período travado
      const params = periodoTravado
        ? {
            inicio: periodoTravado.dataInicial.split("T")[0],
            fim: periodoTravado.dataFinal.split("T")[0],
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
        // diasSemana sempre 7 (padrão)
        diasSemana: "7",
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
              className="h-4 w-4 rounded mt-1"
            />
            <label htmlFor="aplicarIST" className="text-sm font-medium">
              Equipe de enfermagem é composta em sua maioria de pessoas com
              idade superior a 50 anos, ou 20% da equipe com restrições?
            </label>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 text-white bg-green-600 rounded-md"
          >
            Salvar Parâmetros
          </button>
        </div>
      </form>

      {/* Informações de Dimensionamento (apenas para Internação) */}
      {isInternacao && analise && (
        <div className="space-y-6">
          {/* Seção de Informações Gerais */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-4">
              Informações da Unidade
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {analise.agregados.unidadeNome && (
                <Card className="border">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Unidade
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {analise.agregados.unidadeNome}
                    </p>
                  </CardContent>
                </Card>
              )}

              {analise.agregados.metodoAvaliacaoSCP && (
                <Card className="border">
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Método SCP
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {analise.agregados.metodoAvaliacaoSCP.title ||
                        analise.agregados.metodoAvaliacaoSCP.key ||
                        "-"}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="border">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Total de Leitos
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {analise.agregados.totalLeitos || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Leitos/Dia (Período)
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {analise.agregados.totalLeitosDia || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Seção de Período */}
          {analise.agregados.periodo && (
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-bold text-primary mb-4">
                Período de Análise
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border">
                  <CardContent className="pt-4 pb-4 text-center">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Data Início
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {new Date(
                        analise.agregados.periodo.inicio
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="pt-4 pb-4 text-center">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Data Fim
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {new Date(
                        analise.agregados.periodo.fim
                      ).toLocaleDateString("pt-BR")}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardContent className="pt-4 pb-4 text-center">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Total de Dias
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {analise.agregados.periodo.dias}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Seção de Taxa de Ocupação e Avaliações */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-4">
              Ocupação e Avaliações
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Taxa de Ocupação
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {analise.agregados.taxaOcupacaoPeriodoPercent
                      ? `${Number(analise.agregados.taxaOcupacaoPeriodoPercent).toFixed(2)}%`
                      : "-"}
                  </p>
                </CardContent>
              </Card>

              {analise.agregados.taxaOcupacaoCustomizada && (
                <Card className="border">
                  <CardContent className="pt-4 pb-4 text-center">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Taxa Customizada
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {analise.agregados.taxaOcupacaoCustomizada.taxa}%
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="border">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Total de Avaliações
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {analise.agregados.totalAvaliacoes || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Pacientes Médio/Dia
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {analise.agregados.totalPacientesMedio
                      ? Number(analise.agregados.totalPacientesMedio).toFixed(2)
                      : "-"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Seção de Status dos Leitos */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-4">
              Status dos Leitos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Leitos Ocupados
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {analise.agregados.leitosOcupados || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Leitos Vagos
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {analise.agregados.leitosVagos || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Leitos Inativos
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {analise.agregados.leitosInativos || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Leitos Avaliados
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {analise.agregados.percentualLeitosAvaliados
                      ? `${Number(analise.agregados.percentualLeitosAvaliados).toFixed(1)}%`
                      : "-"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Seção de Distribuição de Classificação */}
          {analise.agregados.distribuicaoTotalClassificacao &&
            Object.keys(analise.agregados.distribuicaoTotalClassificacao)
              .length > 0 && (
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-bold text-primary mb-4">
                  Distribuição de Classificação
                </h3>

                {/* Cards de Classificação */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {Object.entries(
                    analise.agregados.distribuicaoTotalClassificacao
                  ).map(([classificacao, total]) => {
                    const ag = analise?.agregados as any;
                    const mediaDiaria =
                      ag?.mediaDiariaClassificacao?.[classificacao];

                    return (
                      <Card key={classificacao} className="border">
                        <CardContent className="pt-4 pb-4 text-center">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            {classificacao.replace(/_/g, " ")}
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {total}
                          </p>
                          {mediaDiaria !== undefined && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Média diária: {Number(mediaDiaria).toFixed(2)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Tabela de Horas de Enfermagem */}
                <div>
                  <h4 className="text-md font-semibold text-primary mb-3">
                    Horas de Enfermagem por Classificação
                  </h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">
                            Classificação
                          </TableHead>
                          <TableHead className="text-center font-bold">
                            Hora/Paciente (Tabelado)
                          </TableHead>
                          <TableHead className="text-center font-bold">
                            Média Diária de Pacientes
                          </TableHead>
                          <TableHead className="text-center font-bold">
                            Horas de Enfermagem (THE)
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          let totalHorasEnfermagem = 0;
                          const rows = Object.entries(
                            analise.agregados.distribuicaoTotalClassificacao
                          ).map(([classificacao, total]) => {
                            const ag = analise?.agregados as any;
                            const mediaDiaria =
                              ag?.mediaDiariaClassificacao?.[classificacao];

                            // Console.log para debug
                            console.log("=== DEBUG CLASSIFICAÇÃO ===");
                            console.log(
                              "Classificação recebida:",
                              classificacao
                            );
                            console.log("Tipo:", typeof classificacao);
                            console.log("Total pacientes:", total);
                            console.log("Média diária:", mediaDiaria);

                            // Usar a função para obter as horas tabeladas
                            const horasPorPaciente =
                              getHorasTabeladas(classificacao);

                            console.log(
                              "Horas tabeladas encontradas:",
                              horasPorPaciente
                            );

                            // Calcular THE usando a média diária ao invés do total
                            const horasEnfermagem =
                              horasPorPaciente !== undefined &&
                              mediaDiaria !== undefined
                                ? horasPorPaciente * Number(mediaDiaria)
                                : ag?.horasEnfermagemPorClassificacao?.[
                                    classificacao
                                  ];

                            console.log("THE calculado:", horasEnfermagem);
                            console.log("===========================");

                            if (horasEnfermagem !== undefined) {
                              totalHorasEnfermagem += Number(horasEnfermagem);
                            }

                            return (
                              <TableRow key={classificacao}>
                                <TableCell className="font-medium">
                                  {classificacao.replace(/_/g, " ")}
                                </TableCell>
                                <TableCell className="text-center">
                                  {horasPorPaciente !== undefined
                                    ? `${Number(horasPorPaciente)}h`
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
                          });

                          return (
                            <>
                              {rows}
                              <TableRow className="bg-muted/50 font-bold border-t-2">
                                <TableCell colSpan={3} className="text-right">
                                  Total de Horas de Enfermagem:
                                </TableCell>
                                <TableCell className="text-center text-primary">
                                  {totalHorasEnfermagem.toFixed(2)}h
                                </TableCell>
                              </TableRow>
                            </>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

          {/* Seção de Nível de Cuidado */}
          {analise.agregados.nivelCuidadoPredominante && (
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-bold text-primary mb-4">
                Classificação de Pacientes
              </h3>
              <Card className="border">
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    Nível de Cuidado Predominante
                  </p>
                  <p className="text-base font-bold text-primary">
                    {analise.agregados.nivelCuidadoPredominante}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Seção de Quadro de Pessoal */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-4">
              Quadro de Pessoal Dimensionado
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    QP Enfermeiros
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {analise.agregados.qpEnfermeiros || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    QP Técnicos
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {analise.agregados.qpTecnicos || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    QP Total
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {analise.agregados.qpTotal || 0}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Seção de Constantes e Percentuais */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h3 className="text-lg font-bold text-primary mb-4">
              Constantes de Marinho e Distribuição
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border bg-white">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Constante de Marinho (Enfermeiro)
                  </p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-primary">
                    {(() => {
                      const ag = analise?.agregados as any;
                      const v = ag?.kmEnfermeiro;
                      if (v === undefined || v === null) return "-";
                      return Number(v).toLocaleString("pt-BR", {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      });
                    })()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border bg-white">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Constante de Marinho (Técnico)
                  </p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-primary">
                    {(() => {
                      const ag = analise?.agregados as any;
                      const v = ag?.kmTecnico;
                      if (v === undefined || v === null) return "-";
                      return Number(v).toLocaleString("pt-BR", {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      });
                    })()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border bg-white">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Percentual Enfermeiro
                  </p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-primary">
                    {(() => {
                      const ag = analise?.agregados as any;
                      const enf =
                        ag?.percentualEnfermeiroPercent ??
                        (typeof ag?.percentualEnfermeiro === "number"
                          ? ag.percentualEnfermeiro * 100
                          : null);
                      if (enf === null) return "-";
                      return `${Number(enf).toFixed(0)}%`;
                    })()}
                  </p>
                </CardContent>
              </Card>

              <Card className="border bg-white">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Percentual Técnico
                  </p>
                  <p className="mt-1 text-xl font-bold tracking-tight text-primary">
                    {(() => {
                      const ag = analise?.agregados as any;
                      const tec =
                        ag?.percentualTecnicoPercent ??
                        (typeof ag?.percentualTecnico === "number"
                          ? ag.percentualTecnico * 100
                          : null);
                      if (tec === null) return "-";
                      return `${Number(tec).toFixed(0)}%`;
                    })()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Seção de Parâmetros Utilizados */}
          {analise.agregados.parametros && (
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-bold text-primary mb-4">
                Parâmetros Utilizados no Cálculo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {analise.agregados.parametros.istPercent !== undefined && (
                  <Card className="border">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        IST (Índice Segurança Técnica)
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {analise.agregados.parametros.istPercent}%
                      </p>
                    </CardContent>
                  </Card>
                )}

                {analise.agregados.parametros.cargaHorariaEnfermeiro && (
                  <Card className="border">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Jornada Enfermeiro
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {analise.agregados.parametros.cargaHorariaEnfermeiro}h
                      </p>
                    </CardContent>
                  </Card>
                )}

                {analise.agregados.parametros.cargaHorariaTecnico && (
                  <Card className="border">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Jornada Técnico
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {analise.agregados.parametros.cargaHorariaTecnico}h
                      </p>
                    </CardContent>
                  </Card>
                )}

                {analise.agregados.parametros.diasTrabalhoSemana !==
                  undefined && (
                  <Card className="border">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Dias/Semana
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {analise.agregados.parametros.diasTrabalhoSemana}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {analise.agregados.parametros.equipeComRestricoes !==
                  undefined && (
                  <Card className="border">
                    <CardContent className="pt-4 pb-4 text-center">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Equipe com Restrições
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {analise.agregados.parametros.equipeComRestricoes
                          ? "Sim"
                          : "Não"}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Seção de Horas Totais */}
          {analise.agregados.totalHorasEnfermagem !== undefined && (
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-bold text-primary mb-4">
                Horas de Enfermagem
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border">
                  <CardContent className="pt-4 pb-4 text-center">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Total Horas Enfermagem (Período)
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {Number(analise.agregados.totalHorasEnfermagem).toFixed(
                        2
                      )}
                      h
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
