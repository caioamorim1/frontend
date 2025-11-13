import { useState, useEffect } from "react";
import {
  UnidadeInternacao,
  LinhaAnaliseFinanceira,
  getAnaliseInternacao,
  AjustesPayload,
  saveProjetadoFinalInternacao,
  getProjetadoFinalInternacao,
} from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Brain,
  MinusCircle,
  PlusCircle,
  Settings,
  Target,
} from "lucide-react";
import { LinhaAnalise } from "@/components/shared/AnaliseFinanceira";
import { EvaluationsTab } from "@/features/qualitativo/components/EvaluationsTab";
import { useAlert } from "@/contexts/AlertContext";
import brainIcon from "@/assets/brain_ia.jpg";

// Componente para o input de ajuste
const AjusteInput = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (newValue: number) => void;
}) => (
  <div className="flex items-center justify-center gap-2">
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={() => onChange(value - 1)}
    >
      <MinusCircle className="h-5 w-5 text-red-500" />
    </Button>
    <span className="font-bold text-lg w-8 text-center">{value}</span>
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={() => onChange(value + 1)}
    >
      <PlusCircle className="h-5 w-5 text-green-500" />
    </Button>
  </div>
);

interface ProjetadoTabProps {
  unidade: UnidadeInternacao;
  dateRange?: { inicio?: string; fim?: string };
}

export default function ProjetadoTab({
  unidade,
  dateRange,
}: ProjetadoTabProps) {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analiseBase, setAnaliseBase] = useState<LinhaAnaliseFinanceira[]>([]);
  const [ajustes, setAjustes] = useState<AjustesPayload>({});
  const [showAvaliarPage, setShowAvaliarPage] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const analiseData = await getAnaliseInternacao(
          unidade.id,
          dateRange && dateRange.inicio && dateRange.fim ? dateRange : undefined
        );

        if (analiseData && analiseData.tabela) {
          setAnaliseBase(analiseData.tabela);
        }

        // Tenta obter projetado final já salvo no backend e convertê-lo para mapa de ajustes (delta)
        try {
          const saved = await getProjetadoFinalInternacao(unidade.id);
          if (saved && saved.cargos) {
            const baseByCargo = new Map<string, number>();
            const unique: Record<string, LinhaAnaliseFinanceira> = {};
            (analiseData?.tabela || []).forEach((l: LinhaAnaliseFinanceira) => {
              if (!unique[l.cargoId]) unique[l.cargoId] = l;
            });

            const isCargoSCP = (nome: string): boolean => {
              const s = (nome || "").toLowerCase();
              const tecnicoPatterns = [
                "técnico em enfermagem",
                "tecnico em enfermagem",
                "técnico enfermagem",
                "tec enfermagem",
                "tec. enfermagem",
                "tec. em enfermagem",
                "técnico de enfermagem",
              ];
              const isTecnico = tecnicoPatterns.some((pat) => s.includes(pat));
              const isEnfermeiro = s.includes("enfermeiro");
              return isEnfermeiro || isTecnico;
            };

            Object.values(unique).forEach((l) => {
              const isScp = isCargoSCP(l.cargoNome);
              const quantidadeAtualUnidade = unidade.cargos_unidade?.find(
                (cu) => cu.cargo.id === l.cargoId
              )?.quantidade_funcionarios;
              const base = isScp
                ? l.quantidadeProjetada
                : quantidadeAtualUnidade ?? 0;
              baseByCargo.set(l.cargoId, base);
            });

            const novoMapa: AjustesPayload = {};
            saved.cargos.forEach((c: any) => {
              const base = baseByCargo.get(c.cargoId) ?? 0;
              const delta = Math.max(0, c.projetadoFinal ?? 0) - base;
              if (delta !== 0) novoMapa[c.cargoId] = delta;
            });
            setAjustes(novoMapa);
          } else {
            setAjustes({});
          }
        } catch {
          setAjustes({});
        }
      } catch (error) {
        showAlert("destructive", "Erro", "Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [unidade.id, dateRange?.inicio, dateRange?.fim]);

  const handleAjusteChange = (cargoId: string, novoValor: number) => {
    setAjustes((prev) => ({ ...prev, [cargoId]: novoValor }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Calcular projetado final por cargo e enviar para o backend
      const cargosMap = new Map<string, LinhaAnaliseFinanceira>();
      analiseBase.forEach((l) => {
        if (!cargosMap.has(l.cargoId)) cargosMap.set(l.cargoId, l);
      });

      const isCargoSCP = (nome: string): boolean => {
        const s = (nome || "").toLowerCase();
        const tecnicoPatterns = [
          "técnico em enfermagem",
          "tecnico em enfermagem",
          "técnico enfermagem",
          "tec enfermagem",
          "tec. enfermagem",
          "tec. em enfermagem",
          "técnico de enfermagem",
        ];
        const isTecnico = tecnicoPatterns.some((pat) => s.includes(pat));
        const isEnfermeiro = s.includes("enfermeiro");
        return isEnfermeiro || isTecnico;
      };

      const cargos = Array.from(cargosMap.values()).map((l) => {
        const isScp = isCargoSCP(l.cargoNome);
        const quantidadeAtual =
          unidade.cargos_unidade?.find((cu) => cu.cargo.id === l.cargoId)
            ?.quantidade_funcionarios || 0;
        const base = isScp ? l.quantidadeProjetada : quantidadeAtual;
        const ajuste = ajustes[l.cargoId] || 0;
        const projetadoFinal = Math.max(0, Math.floor(base + ajuste));
        return { cargoId: l.cargoId, projetadoFinal };
      });

      const payload: any = {
        hospitalId: unidade.hospitalId,
        unidadeId: unidade.id,
        hospital_id: unidade.hospitalId,
        unidade_id: unidade.id,
        cargos: cargos.map((c) => ({
          ...c,
          cargo_id: c.cargoId,
        })),
      };

      await saveProjetadoFinalInternacao(unidade.id, payload);

      showAlert("success", "Sucesso", "Projetado final salvo com sucesso.");
    } catch (error) {
      showAlert(
        "destructive",
        "Erro",
        "Não foi possível salvar o projetado final."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAvaliar = () => {
    setShowAvaliarPage(true);
  };

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  // Remover duplicatas por cargoId
  const cargosMap = new Map<string, LinhaAnaliseFinanceira>();
  analiseBase.forEach((linha) => {
    if (!cargosMap.has(linha.cargoId)) {
      cargosMap.set(linha.cargoId, linha);
    }
  });
  const linhasUnicas = Array.from(cargosMap.values());

  const isCargoSCPView = (nome: string): boolean => {
    const s = (nome || "").toLowerCase();
    const tecnicoPatterns = [
      "técnico em enfermagem",
      "tecnico em enfermagem",
      "técnico enfermagem",
      "tec enfermagem",
      "tec. enfermagem",
      "tec. em enfermagem",
      "técnico de enfermagem",
    ];
    const isTecnico = tecnicoPatterns.some((pat) => s.includes(pat));
    const isEnfermeiro = s.includes("enfermeiro");
    return isEnfermeiro || isTecnico;
  };

  // Separar cargos que têm projetado (Enfermeiro/Técnico) dos outros
  const cargosComProjetado = linhasUnicas.filter((linha) =>
    isCargoSCPView(linha.cargoNome)
  );

  const cargosAtuais = linhasUnicas.filter(
    (linha) => !isCargoSCPView(linha.cargoNome)
  );

  // DEBUG: Logs detalhados para analisar classificação e valores projetados
  try {
    const isBrowser = typeof window !== "undefined";
    if (isBrowser) {
      console.groupCollapsed(
        "[ProjetadoTab] Classificação de cargos e valores projetados"
      );
      linhasUnicas.forEach((l) => {
        const lower = (l.cargoNome || "").toLowerCase();
        const isScp = isCargoSCPView(l.cargoNome);
        console.log({
          cargoId: l.cargoId,
          cargoNome: l.cargoNome,
          lower,
          includes_enfermeiro: lower.includes("enfermeiro"),
          tecnico_patterns_match: [
            "técnico em enfermagem",
            "tecnico em enfermagem",
            "técnico enfermagem",
            "tec enfermagem",
            "tec. enfermagem",
            "tec. em enfermagem",
            "técnico de enfermagem",
          ].some((p) => lower.includes(p)),
          isClassificadoComoSCP: isScp,
          quantidadeProjetada: l.quantidadeProjetada,
        });
      });
      console.log(
        "[ProjetadoTab] cargosComProjetado:",
        cargosComProjetado.map((l) => ({
          cargoId: l.cargoId,
          cargoNome: l.cargoNome,
          quantidadeProjetada: l.quantidadeProjetada,
        }))
      );
      console.log(
        "[ProjetadoTab] cargosAtuais:",
        cargosAtuais.map((l) => ({
          cargoId: l.cargoId,
          cargoNome: l.cargoNome,
        }))
      );
      console.groupEnd();
    }
  } catch {}

  // Buscar quantidade atual da unidade para os cargos sem projetado
  const getQuantidadeAtual = (cargoId: string): number => {
    const cargoUnidade = unidade.cargos_unidade?.find(
      (cu) => cu.cargo.id === cargoId
    );
    return cargoUnidade?.quantidade_funcionarios || 0;
  };

  return (
    <>
      {showAvaliarPage ? (
        <EvaluationsTab
          onClose={() => setShowAvaliarPage(false)}
          unidadeInternacao={unidade}
        />
      ) : (
        <Card className="animate-fade-in-down">
          <CardHeader>
            <CardTitle>Ajuste Qualitativo do Quadro Projetado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="h-20">
                    <TableHead className="w-[30%]">Função</TableHead>

                    <TableHead className="text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center justify-center">
                          <BarChart3 className="h-7 w-7 text-gray-700" />
                          <span className="ml-2 text-sm font-medium">
                            Atual
                          </span>
                        </div>
                      </div>
                    </TableHead>

                    <TableHead className="text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center justify-center">
                          <img
                            src={brainIcon}
                            alt="Projetado (Sistema)"
                            className="h-10 w-10 object-contain mb-1"
                          />
                          <span className="text-sm font-medium">
                            Projetado (Sistema)
                          </span>
                        </div>
                      </div>
                    </TableHead>

                    <TableHead className="text-center w-[200px]">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center justify-center">
                          <Settings className="h-7 w-7 text-gray-700" />
                          <span className="ml-2 text-sm font-medium">
                            Ajuste Qualitativo
                          </span>
                        </div>
                      </div>
                    </TableHead>

                    <TableHead className="text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-center justify-center">
                          <Target className="h-7 w-7 text-gray-700" />
                          <span className="ml-2 text-sm font-medium">
                            Projetado Final
                          </span>
                        </div>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {/* Cargos com Projetado (Enfermeiro/Técnico) */}
                  {cargosComProjetado.map((linha) => {
                    const quantidadeAtual = getQuantidadeAtual(linha.cargoId);
                    const ajusteAtual = ajustes[linha.cargoId] || 0;
                    // Usa quantidadeAtual como base para o ajuste qualitativo
                    const projetadoFinal = quantidadeAtual + ajusteAtual;
                    return (
                      <TableRow key={linha.cargoId}>
                        <TableCell className="font-medium">
                          {linha.cargoNome}
                        </TableCell>
                        <TableCell className="text-center font-medium text-gray-500">
                          {quantidadeAtual}
                        </TableCell>
                        <TableCell className="text-center font-medium text-gray-600">
                          {linha.quantidadeProjetada}
                        </TableCell>
                        <TableCell>
                          <AjusteInput
                            value={ajusteAtual}
                            onChange={(novoValor) =>
                              handleAjusteChange(linha.cargoId, novoValor)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center font-bold text-xl text-primary">
                          {projetadoFinal}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Outros Cargos (sem projetado - usa Atual) */}
                  {cargosAtuais.map((linha) => {
                    const quantidadeAtual = getQuantidadeAtual(linha.cargoId);
                    const ajusteAtual = ajustes[linha.cargoId] || 0;
                    const projetadoFinal = quantidadeAtual + ajusteAtual;
                    return (
                      <TableRow key={linha.cargoId}>
                        <TableCell className="font-medium">
                          {linha.cargoNome}
                        </TableCell>
                        <TableCell className="text-center font-medium text-gray-600">
                          {quantidadeAtual}
                        </TableCell>
                        <TableCell className="text-center font-medium text-gray-400">
                          -
                        </TableCell>
                        <TableCell>
                          <AjusteInput
                            value={ajusteAtual}
                            onChange={(novoValor) =>
                              handleAjusteChange(linha.cargoId, novoValor)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center font-bold text-xl text-primary">
                          {projetadoFinal}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {linhasUnicas.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground h-24"
                      >
                        Nenhum cargo encontrado para dimensionamento.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-6 gap-3">
              <Button onClick={handleOpenAvaliar} disabled={saving}>
                {"Avaliação"}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar Ajustes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
