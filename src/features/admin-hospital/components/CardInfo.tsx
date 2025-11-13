import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  UnidadeInternacao,
  UnidadeNaoInternacao,
  SessaoAtiva,
} from "@/lib/api";
import { Building, Bed, Home, Activity, Briefcase, Users } from "lucide-react";
import { useAlert } from "@/contexts/AlertContext";
import { Checkbox } from "@/components/ui/checkbox";

import {
  getAnaliseInternacao,
  type AnaliseInternacaoResponse,
  saveControlePeriodo,
} from "@/lib/api";
import { PieChartComp } from "./graphicsComponents/PieChartComp";

const InfoItem = ({
  icon,
  label,
  value,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  className?: string;
}) => (
  <div className={`flex items-start text-sm ${className}`}>
    <div className="flex-shrink-0 mr-3 text-gray-500">{icon}</div>
    <div>
      <p className="text-gray-600">{label}</p>
      <p className="font-bold text-lg text-primary">{value}</p>
    </div>
  </div>
);

interface CardInfoProps {
  unidade: UnidadeInternacao | UnidadeNaoInternacao;
  sessoes: SessaoAtiva[];
  onCalculate?: (
    range: { inicio?: string; fim?: string; travado?: boolean } | null
  ) => void;
  initialRange?: { inicio?: string; fim?: string } | null;
  initialTravado?: boolean;
}

export default function CardInfo({
  unidade,
  sessoes,
  onCalculate,
  initialRange = null,
  initialTravado = false,
}: CardInfoProps) {
  if (unidade.tipo === "internacao") {
    const unidadeInternacao = unidade as UnidadeInternacao;
    const totalLeitos = unidadeInternacao.leitos?.length || 0;

    const [dataInicial, setDataInicial] = useState<string>(
      initialRange?.inicio ?? ""
    );
    const [dataFinal, setDataFinal] = useState<string>(initialRange?.fim ?? "");
    const [travado, setTravado] = useState<boolean>(initialTravado ?? false);
    const { showAlert } = useAlert();

    const [isCalculating, setIsCalculating] = useState(false);
    const [isPersistingTravado, setIsPersistingTravado] = useState(false);
    const [analise, setAnalise] = useState<AnaliseInternacaoResponse | null>(
      null
    );
    const lastAutoLoadedKeyRef = useRef<string | null>(null);
    const lastSavedRangeRef = useRef<{ inicio: string; fim: string } | null>(
      initialRange?.inicio && initialRange?.fim
        ? { inicio: initialRange.inicio, fim: initialRange.fim }
        : null
    );

    useEffect(() => {
      setDataInicial(initialRange?.inicio ?? "");
      setDataFinal(initialRange?.fim ?? "");
      if (!initialRange?.inicio || !initialRange?.fim) {
        setAnalise(null);
        lastAutoLoadedKeyRef.current = null;
        lastSavedRangeRef.current = null;
      } else {
        lastSavedRangeRef.current = {
          inicio: initialRange.inicio,
          fim: initialRange.fim,
        };
      }
    }, [initialRange?.inicio, initialRange?.fim]);

    useEffect(() => {
      setTravado(initialTravado ?? false);
    }, [initialTravado]);

    type CalculoOptions = {
      inicio?: string;
      fim?: string;
      silent?: boolean;
      notifyParent?: boolean;
      saveControle?: boolean;
    };

    const runCalculo = async ({
      inicio,
      fim,
      silent = false,
      notifyParent = true,
      saveControle = false,
    }: CalculoOptions) => {
      const hasInicio = Boolean(inicio);
      const hasFim = Boolean(fim);

      if (!hasInicio && !hasFim) {
        try {
          setIsCalculating(true);
          const resp = await getAnaliseInternacao(unidadeInternacao.id);
          setAnalise(resp);
          lastAutoLoadedKeyRef.current = null;
          lastSavedRangeRef.current = null;
          if (notifyParent) {
            onCalculate?.(null);
          }
          if (!silent) {
            showAlert(
              "success",
              "Pronto",
              "Indicadores calculados (sem período)."
            );
          }
        } catch (e: any) {
          if (!silent) {
            showAlert(
              "destructive",
              "Erro",
              e?.response?.data?.error || "Falha ao calcular indicadores."
            );
          }
        } finally {
          setIsCalculating(false);
        }
        return;
      }

      if (!inicio || !fim) {
        if (!silent) {
          showAlert(
            "destructive",
            "Período incompleto",
            "Preencha a data inicial e a data final ou deixe ambos vazios."
          );
        }
        return;
      }

      if (new Date(fim) < new Date(inicio)) {
        if (!silent) {
          showAlert(
            "destructive",
            "Período inválido",
            "A data final deve ser maior ou igual à data inicial."
          );
        }
        return;
      }

      try {
        setIsCalculating(true);
        const resp = await getAnaliseInternacao(unidadeInternacao.id, {
          inicio,
          fim,
        });
        setAnalise(resp);
        const currentKey = `${inicio}__${fim}`;

        if (saveControle) {
          try {
            await saveControlePeriodo({
              unidadeId: unidadeInternacao.id,
              travado,
              dataInicial: inicio,
              dataFinal: fim,
            });
          } catch (saveError: any) {
            if (!silent) {
              showAlert(
                "destructive",
                "Erro",
                saveError?.response?.data?.error ||
                  "Falha ao salvar período selecionado."
              );
            }
            return;
          }
        }

        lastAutoLoadedKeyRef.current = currentKey;
        lastSavedRangeRef.current = { inicio, fim };

        if (notifyParent) {
          onCalculate?.({ inicio, fim, travado });
        }

        if (!silent) {
          showAlert(
            "success",
            "Pronto",
            "Indicadores calculados para o período."
          );
        }
      } catch (e: any) {
        if (!silent) {
          showAlert(
            "destructive",
            "Erro",
            e?.response?.data?.error || "Falha ao calcular indicadores."
          );
        }
      } finally {
        setIsCalculating(false);
      }
    };

    useEffect(() => {
      if (initialRange?.inicio && initialRange?.fim) {
        const autoKey = `${initialRange.inicio}__${initialRange.fim}`;
        if (lastAutoLoadedKeyRef.current !== autoKey) {
          lastAutoLoadedKeyRef.current = autoKey;
          void runCalculo({
            inicio: initialRange.inicio,
            fim: initialRange.fim,
            silent: true,
            notifyParent: false,
            saveControle: false,
          });
        }
      }
    }, [initialRange?.inicio, initialRange?.fim]);

    const handleCalcular = () => {
      // Verifica se a unidade está travada
      if (travado) {
        showAlert(
          "destructive",
          "Unidade Bloqueada",
          "Não é possível calcular com a unidade já bloqueada para novos cálculos. Desmarque a opção 'Travar período' para realizar novos cálculos."
        );
        return;
      }

      return runCalculo({
        inicio: dataInicial || undefined,
        fim: dataFinal || undefined,
        silent: false,
        notifyParent: true,
        saveControle: Boolean(dataInicial && dataFinal),
      });
    };

    const persistTravado = async (nextValue: boolean) => {
      if (nextValue === travado) return;

      const effectiveInicio =
        lastSavedRangeRef.current?.inicio || dataInicial || undefined;
      const effectiveFim =
        lastSavedRangeRef.current?.fim || dataFinal || undefined;

      if (!effectiveInicio || !effectiveFim) {
        showAlert(
          "destructive",
          "Período obrigatório",
          "Defina um período antes de alterar o travamento."
        );
        return;
      }

      const previousValue = travado;
      setTravado(nextValue);
      setIsPersistingTravado(true);

      try {
        await saveControlePeriodo({
          unidadeId: unidadeInternacao.id,
          travado: nextValue,
          dataInicial: effectiveInicio,
          dataFinal: effectiveFim,
        });
        lastSavedRangeRef.current = {
          inicio: effectiveInicio,
          fim: effectiveFim,
        };
        onCalculate?.({
          inicio: effectiveInicio,
          fim: effectiveFim,
          travado: nextValue,
        });
        showAlert(
          "success",
          "Travamento atualizado",
          nextValue
            ? "O período foi marcado como travado."
            : "O período foi destravado."
        );
      } catch (error: any) {
        setTravado(previousValue);
        showAlert(
          "destructive",
          "Erro",
          error?.response?.data?.error ||
            "Falha ao atualizar o estado de travamento."
        );
      } finally {
        setIsPersistingTravado(false);
      }
    };

    return (
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Informações da Unidade
        </h3>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
              <InfoItem
                icon={<Activity size={24} />}
                label="Método SCP"
                value={(unidade as any).scpMetodoKey || "N/A"}
              />
              <InfoItem
                icon={<Bed size={24} />}
                label="Total de Leitos"
                value={totalLeitos}
              />
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  Data inicial
                </label>
                <input
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className="w-full sm:max-w-[180px] p-2 border rounded-md"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Data final</label>
                <input
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  className="w-full sm:max-w-[180px] p-2 border rounded-md"
                />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3 lg:justify-start">
              <label
                htmlFor={`travado-${unidadeInternacao.id}`}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <Checkbox
                  id={`travado-${unidadeInternacao.id}`}
                  checked={travado}
                  disabled={isPersistingTravado || isCalculating}
                  onCheckedChange={(checked) =>
                    void persistTravado(checked === true)
                  }
                />
                Travado
              </label>
              <button
                onClick={handleCalcular}
                disabled={isCalculating}
                className="w-full sm:w-auto px-5 py-2.5 h-11 bg-secondary text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {isCalculating ? "Calculando..." : "Calcular"}
              </button>
            </div>
          </div>

          {analise && (
            <div className="border rounded-lg p-4 bg-white flex flex-col">
              <div className="flex flex-row border rounded-lg justify-around min-w-[200px]">
                <div className="p-3 bg-white">
                  <p className="text-xs text-gray-600">% Avaliações</p>
                  <p className="text-2xl font-bold tracking-tight text-primary">
                    {(() => {
                      const ag = analise?.agregados as any;
                      let v = ag?.percentualLeitosAvaliadosHojePercent;
                      if ((v === undefined || v === null) && ag) {
                        const totalLeitosDia = Number(ag.totalLeitosDia || 0);
                        const totalAvaliacoes = Number(ag.totalAvaliacoes || 0);
                        if (totalLeitosDia > 0) {
                          v = (totalAvaliacoes / totalLeitosDia) * 100;
                        }
                      }
                      if (v === undefined || v === null) return "-";
                      return `${Number(v).toFixed(1)}%`;
                    })()}
                  </p>
                </div>
                <div className="p-3 bg-white">
                  <p className="text-xs text-gray-600">% Taxa de Ocupação</p>
                  <p className="text-2xl font-bold tracking-tight text-primary">
                    {(() => {
                      let v = (analise as any)?.agregados
                        ?.taxaOcupacaoMensalPercent;
                      if (v === undefined || v === null) {
                        const raw = (analise as any)?.agregados
                          ?.taxaOcupacaoMensal;
                        if (raw !== undefined && raw !== null) {
                          const num = Number(raw);
                          v = num <= 1 ? num * 100 : num;
                        }
                      }
                      if (v === undefined || v === null) return "-";
                      return `${Number(v).toFixed(1)}%`;
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex justify-center w-full ">
                <div className="w-full h-full ">
                  <PieChartComp
                    title="Niveis de Cuidado"
                    data={(() => {
                      const dist =
                        analise?.agregados?.distribuicaoTotalClassificacao ||
                        {};
                      const entries = Object.entries(
                        dist as Record<string, number>
                      );
                      const normalize = (k: string) =>
                        k
                          .toLowerCase()
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c) => c.toUpperCase());
                      return entries.map(([name, value]) => ({
                        name: normalize(name),
                        value: Number(value || 0),
                      }));
                    })()}
                    labelType="percent"
                    height={300}
                    innerRadius={45}
                    outerRadius={70}
                    color="#0b6f88"
                    className="border-0 shadow-none p-0"
                    totalForPercent={(() => {
                      const dist =
                        analise?.agregados?.distribuicaoTotalClassificacao ||
                        {};
                      return Object.values(
                        dist as Record<string, number>
                      ).reduce((sum, val) => sum + (val || 0), 0);
                    })()}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (unidade.tipo === "nao-internacao") {
    const unidadeNaoInternacao = unidade as UnidadeNaoInternacao;

    // Calcular total de funcionários a partir dos sítios funcionais
    const totalFuncionarios =
      unidadeNaoInternacao.sitiosFuncionais?.reduce((total, sitio) => {
        const totalSitio =
          sitio.cargosSitio?.reduce(
            (sum, cs) => sum + cs.quantidade_funcionarios,
            0
          ) || 0;
        return total + totalSitio;
      }, 0) || 0;

    // Calcular quantidade única de cargos (sem duplicatas entre sítios)
    const cargosUnicos = new Set<string>();
    unidadeNaoInternacao.sitiosFuncionais?.forEach((sitio) => {
      sitio.cargosSitio?.forEach((cs) => {
        cargosUnicos.add(cs.cargoUnidade.cargo.id);
      });
    });

    return (
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Informações da Unidade
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InfoItem
            icon={<Building size={24} />}
            label="Tipo"
            value="Não Internação"
          />
          <InfoItem
            icon={<Home size={24} />}
            label="Sítios Funcionais"
            value={unidadeNaoInternacao.sitiosFuncionais?.length || 0}
          />
          <InfoItem
            icon={<Users size={24} />}
            label="Total de Funcionários"
            value={totalFuncionarios}
          />
          <InfoItem
            icon={<Briefcase size={24} />}
            label="Cargos na Unidade"
            value={cargosUnicos.size}
          />
        </div>
      </div>
    );
  }

  return null;
}
