/**
 * Componente de exemplo para exibir Taxa de Ocupação do Dia
 * Baseado em avaliações ativas do backend
 */

import { useEffect, useState } from "react";
import {
  getTaxaOcupacaoHospital,
  getTaxaOcupacaoUnidade,
  TaxaOcupacaoHospital,
  TaxaOcupacaoUnidade,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TaxaOcupacaoDiaProps {
  /**
   * Se passar unidadeId, mostra apenas a taxa daquela unidade
   * Se passar hospitalId, mostra consolidado do hospital + todas unidades
   */
  unidadeId?: string;
  hospitalId?: string;
  /**
   * Intervalo de atualização automática em ms (padrão: 60000 = 1 minuto)
   */
  refetchInterval?: number;
}

export function TaxaOcupacaoDia({
  unidadeId,
  hospitalId,
  refetchInterval = 60000,
}: TaxaOcupacaoDiaProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taxaUnidade, setTaxaUnidade] = useState<TaxaOcupacaoUnidade | null>(
    null
  );
  const [taxaHospital, setTaxaHospital] = useState<TaxaOcupacaoHospital | null>(
    null
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (unidadeId) {
        const data = await getTaxaOcupacaoUnidade(unidadeId);
        setTaxaUnidade(data);
      } else if (hospitalId) {
        const data = await getTaxaOcupacaoHospital(hospitalId);
        setTaxaHospital(data);
      }
    } catch (err: any) {
      console.error("Erro ao buscar taxa de ocupação:", err);
      setError(
        err.response?.data?.error ||
          "Erro ao buscar taxa de ocupação. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Atualização automática a cada intervalo
    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [unidadeId, hospitalId, refetchInterval]);

  if (loading && !taxaUnidade && !taxaHospital) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Erro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Renderizar taxa de uma unidade específica
  if (taxaUnidade) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Ocupação do Dia (Média das últimas 24h)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Taxa de Ocupação:</span>
            <span
              className={`text-2xl font-bold ${
                taxaUnidade.taxaOcupacao >= 90
                  ? "text-red-600"
                  : taxaUnidade.taxaOcupacao >= 75
                  ? "text-yellow-600"
                  : "text-green-600"
              }`}
            >
              {taxaUnidade.taxaOcupacao.toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total de Leitos</p>
              <p className="text-lg font-semibold">{taxaUnidade.totalLeitos}</p>
            </div>
            <div>
              <p className="text-gray-600">Leitos Ocupados</p>
              <p className="text-lg font-semibold">
                {taxaUnidade.leitosOcupados}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Leitos Disponíveis</p>
              <p className="text-lg font-semibold">
                {taxaUnidade.leitosDisponiveis}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Avaliações Ativas</p>
              <p className="text-lg font-semibold">
                {taxaUnidade.avaliacoesAtivas}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar taxa consolidada do hospital
  if (taxaHospital) {
    return (
      <div className="space-y-4">
        {/* Card consolidado do hospital */}
        <Card>
          <CardHeader>
            <CardTitle>
              {taxaHospital.hospitalNome} - Taxa de Ocupação do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Taxa de Ocupação Geral:
              </span>
              <span
                className={`text-2xl font-bold ${
                  taxaHospital.consolidadoHospital.taxaOcupacao >= 90
                    ? "text-red-600"
                    : taxaHospital.consolidadoHospital.taxaOcupacao >= 75
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {taxaHospital.consolidadoHospital.taxaOcupacao.toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total de Leitos</p>
                <p className="text-lg font-semibold">
                  {taxaHospital.consolidadoHospital.totalLeitos}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Leitos Ocupados</p>
                <p className="text-lg font-semibold"></p>
              </div>
              <div>
                <p className="text-gray-600">Leitos Disponíveis</p>
                <p className="text-lg font-semibold"></p>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              {taxaHospital.consolidadoHospital.totalUnidades} unidades ativas
            </p>
          </CardContent>
        </Card>

        {/* Lista de unidades */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {taxaHospital.porUnidade.map((unidade) => (
            <Card key={unidade.unidadeId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{unidade.unidadeNome}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Ocupação:</span>
                    <span
                      className={`text-lg font-bold ${
                        unidade.taxaOcupacao >= 90
                          ? "text-red-600"
                          : unidade.taxaOcupacao >= 75
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {unidade.taxaOcupacao.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    <p></p>
                    <p></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
