import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  createSnapshotHospitalSectors,
  getHospitalSnapshots,
  updateSnapshotSelecionado,
  getHospitalById,
  Hospital,
  Snapshot,
} from "@/lib/api";
import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/contexts/AlertContext";

export default function BaselinePage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const { showAlert } = useAlert();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const toNumber = (value: any): number => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const computeTotalsFromDados = (
    dados: any,
    unitCostDivisor: number
  ): { baseline: number; projected: number } => {
    if (!dados) return { baseline: 0, projected: 0 };

    const unitCost = (raw: any) => (toNumber(raw) || 0) / unitCostDivisor;

    // 1) Baseline (snapshot atual)
    let baseline = 0;
    const sumBaseline = (units?: any[]) => {
      units?.forEach((unit: any) => {
        unit?.staff?.forEach((s: any) => {
          baseline += (toNumber(s?.quantity) || 0) * unitCost(s?.unitCost);
        });
      });
    };
    sumBaseline(dados.internation);
    sumBaseline(dados.assistance);

    // Neutral: costAmount geralmente vem em centavos
    dados.neutral?.forEach((unit: any) => {
      baseline += (toNumber(unit?.costAmount) || 0) / 100;
    });

    // 2) Projetado (projetadoFinal)
    let projected = 0;

    // Mapear custo unitário por cargo a partir do baseline
    const unitCostByCargo = new Map<string, number>();
    const collectUnitCosts = (units?: any[]) => {
      units?.forEach((unit: any) => {
        unit?.staff?.forEach((s: any) => {
          const id = s?.cargoId ?? s?.id;
          if (!id) return;
          unitCostByCargo.set(String(id), unitCost(s?.unitCost));
        });
      });
    };
    collectUnitCosts(dados.internation);
    collectUnitCosts(dados.assistance);

    // Internação
    dados.projetadoFinal?.internacao?.forEach((unidade: any) => {
      if (typeof unidade?.custoTotalUnidade === "number") {
        projected += unidade.custoTotalUnidade;
        return;
      }

      unidade?.cargos?.forEach((cargo: any) => {
        const cargoId = String(cargo?.cargoId ?? "");
        const qtd = toNumber(cargo?.projetadoFinal);
        const uc = unitCostByCargo.get(cargoId) || 0;
        projected += qtd * uc;
      });
    });

    // Não internação
    dados.projetadoFinal?.naoInternacao?.forEach((unidade: any) => {
      if (typeof unidade?.custoTotalUnidade === "number") {
        projected += unidade.custoTotalUnidade;
        return;
      }

      unidade?.sitios?.forEach((sitio: any) => {
        sitio?.cargos?.forEach((cargo: any) => {
          const cargoId = String(cargo?.cargoId ?? "");
          const qtd = toNumber(cargo?.projetadoFinal);
          const uc = unitCostByCargo.get(cargoId) || 0;
          projected += qtd * uc;
        });
      });
    });

    // Neutral: não tem projetadoFinal, então mantém o custo baseline
    dados.neutral?.forEach((unit: any) => {
      projected += (toNumber(unit?.costAmount) || 0) / 100;
    });

    return { baseline, projected };
  };

  const getResumoNormalizado = (snapshot: Snapshot) => {
    const resumo: any = snapshot?.resumo || {};

    const custoTotalRaw = toNumber(resumo.custoTotal);
    const custoProjetadoRaw = toNumber(resumo.custoTotalProjetado);

    const dados = (snapshot as any).dados;

    // Detectar escala do unitCost (às vezes vem em centavos)
    const totalsUnitCost1 = computeTotalsFromDados(dados, 1);
    const totalsUnitCost100 = computeTotalsFromDados(dados, 100);

    const resumoCandidates = [
      { scale: 1, custo: custoTotalRaw, custoProj: custoProjetadoRaw },
      {
        scale: 100,
        custo: custoTotalRaw / 100,
        custoProj: custoProjetadoRaw / 100,
      },
    ];

    const dadosCandidates = [
      { unitCostDivisor: 1, value: totalsUnitCost1.baseline },
      { unitCostDivisor: 100, value: totalsUnitCost100.baseline },
    ].filter((c) => c.value > 0);

    let chosenResumoScale = 1;
    let chosenUnitCostDivisor = 1;

    if (dadosCandidates.length > 0 && custoTotalRaw > 0) {
      let best = {
        diff: Number.POSITIVE_INFINITY,
        resumoScale: 1,
        unitCostDivisor: 1,
      };

      for (const r of resumoCandidates) {
        for (const d of dadosCandidates) {
          const diff = Math.abs(r.custo - d.value);
          if (diff < best.diff) {
            best = {
              diff,
              resumoScale: r.scale,
              unitCostDivisor: d.unitCostDivisor,
            };
          }
        }
      }

      chosenResumoScale = best.resumoScale;
      chosenUnitCostDivisor = best.unitCostDivisor;
    }

    const custoTotalFromResumo =
      chosenResumoScale === 100 ? custoTotalRaw / 100 : custoTotalRaw;
    const custoTotalProjetadoFromResumo =
      chosenResumoScale === 100 ? custoProjetadoRaw / 100 : custoProjetadoRaw;

    const computed = computeTotalsFromDados(dados, chosenUnitCostDivisor);

    // Preferir baseline calculado a partir de dados, pois o resumo pode não
    // incluir unidades neutras (ou vir em escala inconsistente).
    const custoTotal =
      computed.baseline > 0 ? computed.baseline : custoTotalFromResumo;

    // Preferir projetado calculado a partir de dados, se existir.
    // (O campo resumo.custoTotalProjetado pode não vir, ou vir em escala errada.)
    const custoTotalProjetado =
      computed.projected > 0
        ? computed.projected
        : custoTotalProjetadoFromResumo;

    return {
      custoTotal,
      custoTotalProjetado,
      totalProfissionais: toNumber(resumo.totalProfissionais),
      totalUnidadesInternacao: toNumber(resumo.totalUnidadesInternacao),
      totalUnidadesAssistencia: toNumber(resumo.totalUnidadesAssistencia),
      hasProjetado:
        Number.isFinite(custoTotalProjetado) && custoTotalProjetado > 0,
    };
  };

  // Estado para criar novo baseline
  const [nomeBaseline, setNomeBaseline] = useState("");

  // Estado para selecionar snapshot/baseline
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>("");
  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId);

  // Função para calcular a variação de custo de um snapshot
  const calcularVariacaoCusto = (snapshot: Snapshot) => {
    if (!snapshot?.resumo) {
      return null;
    }

    const resumo = getResumoNormalizado(snapshot);
    const custoAtualTotal = resumo.custoTotal || 0;
    const custoProjetadoTotal = resumo.custoTotalProjetado || 0;
    const variacao = custoProjetadoTotal - custoAtualTotal;
    const percentualVariacao =
      custoAtualTotal > 0 ? (variacao / custoAtualTotal) * 100 : 0;

    return {
      custoAtual: custoAtualTotal,
      custoProjetado: custoProjetadoTotal,
      variacao,
      percentualVariacao,
    };
  };

  const fetchData = async () => {
    if (!hospitalId) return;

    setLoading(true);
    try {
      const [hospitalData, snapshotsData] = await Promise.all([
        getHospitalById(hospitalId),
        getHospitalSnapshots(hospitalId, 10),
      ]);

      setHospital(hospitalData);
      setSnapshots(snapshotsData.snapshots || []);

      // Encontrar e selecionar o snapshot que está marcado como selecionado
      const snapshotSelecionado = snapshotsData.snapshots?.find(
        (s) => s.selecionado === true
      );

      if (snapshotSelecionado) {
        setSelectedSnapshotId(snapshotSelecionado.id);
      }
    } catch (error) {
      showAlert("destructive", "Erro", "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hospitalId]);

  const handleGerarBaseline = async () => {
    if (!nomeBaseline.trim()) {
      showAlert(
        "destructive",
        "Erro",
        "Por favor, informe o nome/descrição do baseline."
      );
      return;
    }

    if (!hospitalId) return;

    setCreating(true);
    try {
      await createSnapshotHospitalSectors(hospitalId, nomeBaseline);

      showAlert("success", "Sucesso", "Baseline criado com sucesso!");
      setNomeBaseline("");
      await fetchData();
    } catch (error: any) {
      // Verifica se é o erro de setores pendentes
      if (error?.response?.data?.setoresPendentes) {
        const setoresPendentes = error.response.data.setoresPendentes;
        const mensagemSetores = setoresPendentes.join(", ");
        showAlert(
          "destructive",
          "Setores Pendentes",
          `Não é possível criar o baseline. Os seguintes setores não estão com status concluído: ${mensagemSetores}`
        );
      } else {
        showAlert("destructive", "Erro", "Não foi possível criar o baseline.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleSelecionarBaseline = async (snapshotId: string) => {
    try {
      // Se já havia um snapshot selecionado, desmarcar ele
      if (selectedSnapshotId && selectedSnapshotId !== snapshotId) {
        await updateSnapshotSelecionado(selectedSnapshotId, false);
      }
      await updateSnapshotSelecionado(snapshotId, true);
      setSelectedSnapshotId(snapshotId);
      const snapshot = snapshots.find((s) => s.id === snapshotId);
      if (snapshot) {
        showAlert(
          "success",
          "Sucesso",
          `Baseline "${snapshot.observacao || "Sem descrição"}" selecionado!`
        );
      }
      // Aqui você pode adicionar a lógica para aplicar o baseline
    } catch (error) {
      showAlert(
        "destructive",
        "Erro",
        "Não foi possível selecionar o baseline."
      );
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-800">
          Baseline - {hospital?.nome}
        </h1>
      </div>

      {/* Card para criar novo baseline */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Baseline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomeBaseline">NOME / Descrição</Label>
            <div className="flex gap-4">
              <Input
                id="nomeBaseline"
                placeholder="Digite o nome ou descrição do baseline"
                value={nomeBaseline}
                onChange={(e) => setNomeBaseline(e.target.value)}
                className="border-2"
              />
              <Button
                onClick={handleGerarBaseline}
                disabled={creating || !nomeBaseline.trim()}
                className="shrink-0"
              >
                {creating ? "Gerando..." : "Gerar Baseline"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card para listar snapshots (baselines) disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Baselines Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshots.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum baseline encontrado. Crie um novo baseline acima.
            </p>
          ) : (
            <div className="space-y-3">
              {snapshots.map((snapshot) => {
                const variacaoCusto = calcularVariacaoCusto(snapshot);
                const resumoNorm = getResumoNormalizado(snapshot);

                return (
                  <div
                    key={snapshot.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {snapshot.observacao || "Sem descrição"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Criado em:{" "}
                        {new Date(snapshot.dataHora).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                      {snapshot.resumo && (
                        <div className="flex gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">
                            Profissionais:{" "}
                            <strong>{resumoNorm.totalProfissionais}</strong>
                          </span>
                          <span className="text-muted-foreground">
                            Custo Atual:{" "}
                            <strong>
                              R$ {formatCurrency(resumoNorm.custoTotal)}
                            </strong>
                          </span>
                          {variacaoCusto && (
                            <>
                              <span className="text-muted-foreground">
                                Custo Projetado:{" "}
                                <strong>
                                  R${" "}
                                  {formatCurrency(variacaoCusto.custoProjetado)}
                                </strong>
                              </span>
                              <span className="text-muted-foreground">
                                Variação:{" "}
                                <strong>
                                  {variacaoCusto.variacao > 0 ? "+" : ""}
                                  R${" "}
                                  {Math.abs(
                                    variacaoCusto.variacao
                                  ).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}{" "}
                                  ({variacaoCusto.variacao > 0 ? "+" : ""}
                                  {variacaoCusto.percentualVariacao.toFixed(2)}
                                  %)
                                </strong>
                              </span>
                            </>
                          )}
                          <span className="text-muted-foreground">
                            Unidades:{" "}
                            <strong>
                              {resumoNorm.totalUnidadesInternacao +
                                resumoNorm.totalUnidadesAssistencia}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant={
                        selectedSnapshotId === snapshot.id
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => handleSelecionarBaseline(snapshot.id)}
                    >
                      {selectedSnapshotId === snapshot.id
                        ? "Selecionado"
                        : "Selecionar Baseline"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
