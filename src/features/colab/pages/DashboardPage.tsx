// src/features/colab/pages/DashboardPage.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardAtualScreen } from "@/features/admin-hospital/components/DashboardAtualScreen";
import { DashboardBaselineScreen } from "@/features/admin-hospital/components/DashboardBaselineScreen";
import { DashboardProjetadoScreen } from "@/features/admin-hospital/components/DashboardProjetadoScreen";
import { DashboardComparativoHospitalScreen } from "@/features/admin-hospital/components/DashboardComparativoHospitalScreen";
import { useEffect, useState } from "react";
import { clearSectorsCache } from "@/mocks/functionSectores";
import { useParams } from "react-router-dom";
import {
  getHospitalById,
  getHospitalSectors,
  getSnapshotHospitalSectors,
  Hospital,
} from "@/lib/api";
import { HospitalHeader } from "@/components/shared/HospitalHeader";
import { useAuth } from "@/contexts/AuthContext";

export default function HospitalDashboardPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const { user } = useAuth();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [hasBaseline, setHasBaseline] = useState(false);
  const [checkingBaseline, setCheckingBaseline] = useState(true);
  const [atualData, setAtualData] = useState<any>(null);

  const effectiveHospitalId = hospitalId || user?.hospital?.id;

  useEffect(() => {
    clearSectorsCache();
  }, []);

  useEffect(() => {
    const checkBaseline = async () => {
      if (!effectiveHospitalId) {
        setCheckingBaseline(false);
        return;
      }

      try {
        // Tenta buscar o snapshot selecionado
        const snapshotData = await getSnapshotHospitalSectors(
          effectiveHospitalId
        );

        // A API retorna {snapshot: {...}} onde os dados estão em snapshot.dados
        const snapshot = (snapshotData as any).snapshot || snapshotData;
        const dados = snapshot.dados || snapshot;
        const hasData =
          dados &&
          ((dados.internation && dados.internation.length > 0) ||
            (dados.assistance && dados.assistance.length > 0));

        setHasBaseline(!!hasData);
      } catch (error: any) {
        // Se o erro for 404, significa que não há snapshot selecionado
        // Qualquer outro erro também resulta em não mostrar a aba baseline
        console.error("Erro ao verificar baseline:", error);
        setHasBaseline(false);
      } finally {
        setCheckingBaseline(false);
      }
    };

    checkBaseline();
  }, [effectiveHospitalId]);

  // Buscar dados do hospital para header
  useEffect(() => {
    const fetchHospital = async () => {
      if (!effectiveHospitalId) return;
      try {
        const data = await getHospitalById(effectiveHospitalId);
        setHospital(data);
      } catch (error) {
        console.error(" Erro ao buscar hospital:", error);
        setHospital(null);
      }
    };

    fetchHospital();
  }, [effectiveHospitalId]);

  // Buscar dados atuais para o comparativo
  useEffect(() => {
    const fetchAtualData = async () => {
      if (!effectiveHospitalId) return;

      try {
        const data = await getHospitalSectors(effectiveHospitalId);
        console.log(" [Dashboard Hospital] Dados atuais carregados:", data);
        setAtualData(data);
      } catch (error) {
        console.error("Erro ao buscar dados atuais:", error);
      }
    };

    fetchAtualData();
  }, [effectiveHospitalId]);

  if (checkingBaseline) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <HospitalHeader
        hospitalName={hospital?.nome}
        hospitalPhoto={hospital?.foto}
        userName={user?.nome}
        subtitle="Dashboard do Hospital"
      />

      <Tabs defaultValue={hasBaseline ? "baseline" : "atual"}>
        <TabsList
          className={`grid w-full ${
            hasBaseline ? "grid-cols-4" : "grid-cols-3"
          }`}
        >
          {hasBaseline && <TabsTrigger value="baseline">Baseline</TabsTrigger>}
          <TabsTrigger value="atual">Atual</TabsTrigger>
          <TabsTrigger value="projetado">Projetado</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
        </TabsList>

        {hasBaseline && (
          <TabsContent value="baseline">
            <div className="grid grid-cols-1 gap-6 mt-6">
              <DashboardBaselineScreen title="Análise Econômico-Financeira Base" />
            </div>
          </TabsContent>
        )}

        <TabsContent value="atual">
          <div className="grid grid-cols-1 gap-6 mt-6">
            <DashboardAtualScreen title="Análise Econômico-Financeira Atual" />
          </div>
        </TabsContent>

        <TabsContent value="projetado">
          <div className="grid grid-cols-1 gap-6 mt-6">
            <DashboardProjetadoScreen title="Análise Econômico-Financeira Projetada" />
          </div>
        </TabsContent>

        <TabsContent value="comparativo">
          <div className="grid grid-cols-1 gap-6 mt-6">
            <DashboardComparativoHospitalScreen
              title="Análise Comparativa"
              atualData={atualData}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
