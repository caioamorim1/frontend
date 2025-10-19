import React, { useState, useEffect, useMemo } from "react";
import { getSnapshotHospitalSectors } from "@/lib/api";
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
  }[];
}

export default function BaselineTabBySitio({
  unidadeId,
  hospitalId,
}: BaselineTabBySitioProps) {
  const [snapshotData, setSnapshotData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSnapshot = async () => {
      if (!hospitalId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await getSnapshotHospitalSectors(hospitalId);
        const dados = (data as any).snapshot.dados;

        setSnapshotData(dados);
      } catch (err: any) {
        console.error("❌ [BASELINE BY SITIO] Erro ao buscar snapshot:", err);
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

    return sitiosFuncionais;
  }, [snapshotData, unidadeId]);

  // Calcula totais
  const totals = useMemo(() => {
    const totalFuncionarios = sitiosBaseline.reduce(
      (sum, sitio) =>
        sum +
        sitio.cargosSitio.reduce(
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
      sitio.cargosSitio.forEach((cs) => {
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
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Cargo</TableHead>
                <TableHead className="text-center">Quantidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sitiosBaseline.map((sitio) => (
                <React.Fragment key={`sitio-fragment-${sitio.id}`}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell
                      colSpan={2}
                      className="font-semibold text-primary"
                    >
                      {sitio.nome}
                      <span className="ml-2 text-sm text-muted-foreground font-normal">
                        ({sitio.cargosSitio.length} cargo
                        {sitio.cargosSitio.length !== 1 ? "s" : ""})
                      </span>
                    </TableCell>
                  </TableRow>

                  {sitio.cargosSitio.map((cargoSitio) => (
                    <TableRow
                      key={`cargo-${cargoSitio.cargoUnidade.cargo.id}-${sitio.id}`}
                    >
                      <TableCell className="font-medium pl-8">
                        {cargoSitio.cargoUnidade.cargo.nome}
                      </TableCell>
                      <TableCell className="text-center font-bold text-lg">
                        {cargoSitio.quantidade_funcionarios}
                      </TableCell>
                    </TableRow>
                  ))}

                  {sitio.cargosSitio.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={2}
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
