// src/features/colab/pages/DashboardPage.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardAtualScreen } from "@/features/admin-hospital/components/DashboardAtualScreen";
import { DashboardBaselineScreen } from "@/features/admin-hospital/components/DashboardBaselineScreen";
import { DashboardProjetadoScreen } from "@/features/admin-hospital/components/DashboardProjetadoScreen";
import { DashboardComparativoHospitalScreen } from "@/features/admin-hospital/components/DashboardComparativoHospitalScreen";
import { DashboardTermometroScreen } from "@/features/admin-hospital/components/DashboardTermometroScreen";
import { useEffect, useState } from "react";
import { clearSectorsCache } from "@/lib/functionSectores";
import { useParams } from "react-router-dom";
import {
  getHospitalById,
  getHospitalSectors,
  getSnapshotHospitalSectors,
  Hospital,
} from "@/lib/api";
import { HospitalHeader } from "@/components/shared/HospitalHeader";
import { useAuth } from "@/contexts/AuthContext";
import {
  can,
  PERM_DASHBOARD_BASELINE,
  PERM_DASHBOARD_TERMOMETRO,
  PERM_DASHBOARD_FINANCEIRO,
} from "@/lib/permissions";

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
      } catch (error: any) {
        // Se 403, usa os dados básicos do JWT
        if (error?.response?.status === 403 && user?.hospital) {
          setHospital(user.hospital as any);
        } else {
          console.error(" Erro ao buscar hospital:", error);
          setHospital(null);
        }
      }
    };

    fetchHospital();
  }, [effectiveHospitalId]);

  // Buscar dados atuais para o comparativo — só necessário para ADMIN (tab Comparativo)
  useEffect(() => {
    if (!effectiveHospitalId || !can(user?.tipo, ...PERM_DASHBOARD_FINANCEIRO)) return;

    const fetchAtualData = async () => {
      try {
        const data = await getHospitalSectors(effectiveHospitalId);
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

  const tipo = user?.tipo;
  const showBaseline = hasBaseline && can(tipo, ...PERM_DASHBOARD_BASELINE);
  const showTermometro = can(tipo, ...PERM_DASHBOARD_TERMOMETRO);
  const showFinanceiro = can(tipo, ...PERM_DASHBOARD_FINANCEIRO);
  const tabCount = [showBaseline, showTermometro, showFinanceiro, showFinanceiro, showFinanceiro].filter(Boolean).length;
  const gridColsClass: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
  };
  const defaultTab = showBaseline ? "baseline" : showTermometro ? "termometro" : showFinanceiro ? "atual" : "baseline";

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <HospitalHeader
        hospitalName={hospital?.nome}
        hospitalPhoto={hospital?.foto}
        userName={user?.nome}
        subtitle="Dashboard do Hospital"
      />

      <Tabs defaultValue={defaultTab}>
        <TabsList className={`grid w-full ${gridColsClass[tabCount] ?? "grid-cols-5"}`}>
          {showBaseline && <TabsTrigger value="baseline">Baseline</TabsTrigger>}
          {showTermometro && <TabsTrigger value="termometro">Termômetro</TabsTrigger>}
          {showFinanceiro && <TabsTrigger value="atual">Atual</TabsTrigger>}
          {showFinanceiro && <TabsTrigger value="projetado">Projetado</TabsTrigger>}
          {showFinanceiro && <TabsTrigger value="comparativo">Comparativo</TabsTrigger>}
        </TabsList>

        {showBaseline && (
          <TabsContent value="baseline">
            <div className="grid grid-cols-1 gap-6 mt-6">
              <DashboardBaselineScreen title="Análise Econômico-Financeira Base" />
            </div>
          </TabsContent>
        )}

        {showTermometro && (
          <TabsContent value="termometro">
            <div className="grid grid-cols-1 gap-6 mt-6">
              <DashboardTermometroScreen
                title="Análise Técnica"
                hospitalId={effectiveHospitalId}
              />
            </div>
          </TabsContent>
        )}

        {showFinanceiro && (
          <TabsContent value="atual">
            <div className="grid grid-cols-1 gap-6 mt-6">
              <DashboardAtualScreen title="Análise Econômico-Financeira Atual" />
            </div>
          </TabsContent>
        )}

        {showFinanceiro && (
          <TabsContent value="projetado">
            <div className="grid grid-cols-1 gap-6 mt-6">
              <DashboardProjetadoScreen title="Análise Econômico-Financeira Projetada" />
            </div>
          </TabsContent>
        )}

        {showFinanceiro && (
          <TabsContent value="comparativo">
            <div className="grid grid-cols-1 gap-6 mt-6">
              <DashboardComparativoHospitalScreen
                title="Análise Comparativa"
                atualData={atualData}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
