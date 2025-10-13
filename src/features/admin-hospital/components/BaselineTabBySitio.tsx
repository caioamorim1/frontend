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
import { Building2, Users, AlertCircle } from "lucide-react";

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
        console.log(
          "🔄 [BASELINE BY SITIO] Buscando snapshot do hospital:",
          hospitalId
        );
        const data = await getSnapshotHospitalSectors(hospitalId);
        const dados = (data as any).snapshot.dados;
        console.log("✅ [BASELINE BY SITIO] Snapshot carregado:", dados);

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
      console.log("⚠️ [BASELINE BY SITIO] Sem dados ou unidadeId");
      return [];
    }

    console.log("🔍 [BASELINE BY SITIO] Procurando unidade:", unidadeId);

    // Procura nos setores de assistência (não-internação)
    const assistanceSector = snapshotData.assistance?.find(
      (sector: any) => sector.id === unidadeId
    );

    if (!assistanceSector) {
      console.log("❌ [BASELINE BY SITIO] Unidade não encontrada no snapshot");
      return [];
    }

    console.log(
      "📊 [BASELINE BY SITIO] Unidade encontrada:",
      assistanceSector.name
    );

    // @ts-ignore - sitiosFuncionais pode não estar na interface antiga
    const sitiosFuncionais = assistanceSector.sitiosFuncionais;

    if (
      !sitiosFuncionais ||
      !Array.isArray(sitiosFuncionais) ||
      sitiosFuncionais.length === 0
    ) {
      console.log("⚠️ [BASELINE BY SITIO] Sem sítios funcionais no snapshot");
      console.log(
        "⚠️ [BASELINE BY SITIO] O backend ainda não salvou os sítios no snapshot"
      );
      return [];
    }

    console.log(
      "✅ [BASELINE BY SITIO] Sítios encontrados:",
      sitiosFuncionais.length
    );
    console.log("📊 [BASELINE BY SITIO] Dados dos sítios:", sitiosFuncionais);

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
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
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
    <div className="space-y-4">
      {/* Header com totais */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">
            Baseline - Distribuição por Sítio Funcional
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Snapshot histórico da distribuição de funcionários
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-medium">
              Sítios
            </p>
            <p className="text-2xl font-bold text-primary flex items-center gap-2">
              <Building2 size={20} />
              {totals.totalSitios}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-medium">
              Funcionários
            </p>
            <p className="text-2xl font-bold text-primary flex items-center gap-2">
              <Users size={20} />
              {totals.totalFuncionarios}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Sítios Agrupados */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Cargo
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                Quantidade
              </th>
            </tr>
          </thead>
          <tbody>
            {sitiosBaseline.map((sitio) => (
              <React.Fragment key={sitio.id}>
                {/* Nome do Sítio - Linha de Cabeçalho */}
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td colSpan={2} className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {sitio.nome}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({sitio.cargosSitio.length} cargo
                        {sitio.cargosSitio.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Cargos do Sítio */}
                {sitio.cargosSitio.map((cargoSitio, idx) => (
                  <tr
                    key={`${sitio.id}-${cargoSitio.cargoUnidade.cargo.id}`}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-2 px-4 pl-8 text-gray-700">
                      {cargoSitio.cargoUnidade.cargo.nome}
                    </td>
                    <td className="py-2 px-4 text-right font-medium text-gray-900">
                      {cargoSitio.quantidade_funcionarios}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
