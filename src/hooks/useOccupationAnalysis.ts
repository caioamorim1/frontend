import { useState, useEffect } from "react";
import {
  getHospitalOccupationAnalysis,
  getNetworkOccupationAnalysis,
  type OccupationAnalysisResponse,
} from "@/lib/api";

interface UseOccupationAnalysisResult {
  data: OccupationAnalysisResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseOccupationAnalysisParams {
  hospitalId?: string;
  redeId?: string;
}

/**
 * Hook para buscar análise de taxa de ocupação do hospital ou rede
 * @param params.hospitalId ID do hospital (para análise individual)
 * @param params.redeId ID da rede (para análise agregada)
 * @returns Dados da análise, loading state e função de refetch
 */
export function useOccupationAnalysis(
  params: UseOccupationAnalysisParams
): UseOccupationAnalysisResult {
  const { hospitalId, redeId } = params;
  const [data, setData] = useState<OccupationAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!hospitalId && !redeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let response: OccupationAnalysisResponse;

      if (redeId) {
        response = await getNetworkOccupationAnalysis(redeId);
      } else if (hospitalId) {
        response = await getHospitalOccupationAnalysis(hospitalId);
      } else {
        throw new Error("hospitalId ou redeId é necessário");
      }

      setData(response);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Erro ao carregar análise de ocupação";
      console.error("❌ [useOccupationAnalysis] Error:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hospitalId, redeId]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
