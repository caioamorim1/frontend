import React, { useState, useEffect, useMemo } from "react";
import {
  getSnapshotHospitalSectors,
  getControlePeriodoByUnidadeId,
  getProjetadoFinalNaoInternacao,
  type SaveProjetadoFinalNaoInternacaoDTO,
} from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  AlertCircle,
  MinusCircle,
  PlusCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BaselineTabBySitioProps {
  unidadeId: string;
  hospitalId: string;
}

interface SitioBaseline {
  id: string;
  nome: string;
  cargosSitio: {
    cargoUnidade: {
      cargo: {
        id: string;
        nome: string;
      };
    };
    quantidade_funcionarios: number;
    quantidade_projetada?: number | null;
  }[];
}

export default function BaselineTabBySitio({
  unidadeId,
  hospitalId,
}: BaselineTabBySitioProps) {
  const [snapshotData, setSnapshotData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<{ inicio: string; fim: string } | null>(null);
  // Map: sitioId → { cargoId → observacao }
  const [obsMap, setObsMap] = useState<Record<string, Record<string, string>>>({});

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
        const [snapshotResult, controlePeriodo, projetadoData] = await Promise.all([
          getSnapshotHospitalSectors(hospitalId),
          getControlePeriodoByUnidadeId(unidadeId).catch(() => null),
          getProjetadoFinalNaoInternacao(unidadeId).catch(() => null as SaveProjetadoFinalNaoInternacaoDTO | null),
        ]);

        const dados = (snapshotResult as any).snapshot.dados;
        setSnapshotData(dados);

        if (controlePeriodo?.dataInicial && controlePeriodo?.dataFinal) {
          setPeriodo({
            inicio: safeDate(controlePeriodo.dataInicial),
            fim: safeDate(controlePeriodo.dataFinal),
          });
        }

        if (projetadoData?.sitios) {
          const map: Record<string, Record<string, string>> = {};
          projetadoData.sitios.forEach((sitio) => {
            const cargoObs: Record<string, string> = {};
            sitio.cargos.forEach((c) => {
              if (c.observacao) cargoObs[c.cargoId] = c.observacao;
            });
            if (Object.keys(cargoObs).length > 0) map[sitio.sitioId] = cargoObs;
          });
          setObsMap(map);
        }

      } catch (err: any) {
        console.error("[BASELINE BY SITIO] Erro ao buscar snapshot:", err);
        if (err.response?.status === 404) {
          setError(
            "Nenhum snapshot (baseline) encontrado para este hospital. Crie um snapshot primeiro."
          );
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

  // Extrai os sítios funcionais do snapshot para a unidade específica
  const sitiosBaseline = useMemo<SitioBaseline[]>(() => {
    if (!snapshotData || !unidadeId) {
      return [];
    }

    // Procura nos setores de assistência (não-internação)
    const assistanceSector = snapshotData.assistance?.find(
      (sector: any) => sector.id === unidadeId
    );

    if (!assistanceSector) {
      return [];
    }

    // @ts-ignore - sitiosFuncionais pode não estar na interface antiga
    const sitiosFuncionais = assistanceSector.sitiosFuncionais;

    if (
      !sitiosFuncionais ||
      !Array.isArray(sitiosFuncionais) ||
      sitiosFuncionais.length === 0
    ) {
      return [];
    }

    // Buscar dados projetados
    const projetadoFinal = snapshotData.projetadoFinal || {};
    const unidadeProjetada = projetadoFinal.naoInternacao?.find(
      (up: any) => up.unidadeId === unidadeId
    );

    // Mapear sítios com dados projetados
    return sitiosFuncionais.map((sitio: any) => {
      const sitioProjetado = unidadeProjetada?.sitios?.find(
        (sp: any) => sp.sitioId === sitio.id
      );

      return {
        ...sitio,
        cargosSitio: (sitio.cargosSitio || []).map((cargoSitio: any) => {
          const cargoId = cargoSitio.cargoUnidade.cargo.id;
          const cargoProj = sitioProjetado?.cargos?.find(
            (cp: any) => cp.cargoId === cargoId
          );

          return {
            ...cargoSitio,
            quantidade_projetada: cargoProj ? cargoProj.projetadoFinal : null,
          };
        }),
      };
    });
  }, [snapshotData, unidadeId]);

  // Calcula totais
  const totals = useMemo(() => {
    const totalFuncionarios = sitiosBaseline.reduce(
      (sum, sitio) =>
        sum +
        (sitio.cargosSitio || []).reduce(
          (s, c) => s + (c.quantidade_funcionarios || 0),
          0
        ),
      0
    );

    const totalSitios = sitiosBaseline.length;

    return { totalFuncionarios, totalSitios };
  }, [sitiosBaseline]);

  // Lista única de cargos para o cabeçalho da tabela
  const cargosUnicos = useMemo(() => {
    const cargosMap = new Map<string, string>();

    sitiosBaseline.forEach((sitio) => {
      (sitio.cargosSitio || []).forEach((cs) => {
        const cargoId = cs.cargoUnidade.cargo.id;
        const cargoNome = cs.cargoUnidade.cargo.nome;
        if (!cargosMap.has(cargoId)) {
          cargosMap.set(cargoId, cargoNome);
        }
      });
    });

    return Array.from(cargosMap.entries()).map(([id, nome]) => ({ id, nome }));
  }, [sitiosBaseline]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Baseline por Sítio Funcional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (sitiosBaseline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Baseline por Sítio Funcional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              ⚠️ Baseline sem estrutura de Sítios Funcionais
            </p>
            <p className="text-sm text-yellow-700">
              O snapshot (baseline) atual foi criado antes da implementação dos
              Sítios Funcionais.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              <strong>Solução:</strong> Crie um novo snapshot para capturar os
              dados atualizados com a estrutura de sítios funcionais.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in-down">
      <CardHeader>
        <CardTitle className="mb-3">
          Gerenciar Quadro de Funcionários por Sítio Funcional
        </CardTitle>
        {/* Período */}
        {periodo && (
          <div className="flex gap-3 mt-1">
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
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Cargo</TableHead>
                <TableHead className="text-center">Atual Baseline</TableHead>
                <TableHead className="text-center">
                  Projetado Baseline
                </TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sitiosBaseline.map((sitio) => (
                <React.Fragment key={`sitio-fragment-${sitio.id}`}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell
                      colSpan={4}
                      className="font-semibold text-primary"
                    >
                      {sitio.nome}
                      <span className="ml-2 text-sm text-muted-foreground font-normal">
                        ({(sitio.cargosSitio || []).length} cargo
                        {(sitio.cargosSitio || []).length !== 1 ? "s" : ""})
                      </span>
                    </TableCell>
                  </TableRow>

                  {(sitio.cargosSitio || []).map((cargoSitio) => {
                    const cargoId = cargoSitio.cargoUnidade.cargo.id;
                    const obs = obsMap[sitio.id]?.[cargoId];
                    return (
                      <TableRow
                        key={`cargo-${cargoId}-${sitio.id}`}
                      >
                        <TableCell className="font-medium pl-8">
                          {cargoSitio.cargoUnidade.cargo.nome}
                        </TableCell>
                        <TableCell className="text-center font-bold text-lg text-gray-700">
                          {cargoSitio.quantidade_funcionarios}
                        </TableCell>
                        <TableCell className="text-center font-bold text-lg text-primary">
                          {cargoSitio.quantidade_projetada !== null &&
                          cargoSitio.quantidade_projetada !== undefined
                            ? cargoSitio.quantidade_projetada
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground italic">
                          {obs ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {(sitio.cargosSitio || []).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground h-12 pl-8 italic"
                      >
                        Nenhum cargo associado a este sítio.
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
