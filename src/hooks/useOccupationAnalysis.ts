import { useState, useEffect } from "react";
import {
  getHospitalOccupationAnalysis,
  type OccupationAnalysisResponse,
} from "@/lib/api";

interface UseOccupationAnalysisResult {
  data: OccupationAnalysisResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook para buscar análise de taxa de ocupação do hospital
 * @param hospitalId ID do hospital
 * @returns Dados da análise, loading state e função de refetch
 */
export function useOccupationAnalysis(
  hospitalId: string | undefined
): UseOccupationAnalysisResult {
  const [data, setData] = useState<OccupationAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(
        "🔄 [useOccupationAnalysis] Fetching data for hospital:",
        hospitalId
      );

      const response = await getHospitalOccupationAnalysis(hospitalId);

      console.log("✅ [useOccupationAnalysis] Data received:", response);
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
  }, [hospitalId]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
