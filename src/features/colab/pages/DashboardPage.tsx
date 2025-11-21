// src/features/colab/pages/DashboardPage.tsx

import { Sheet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardAtualScreen } from "@/features/admin-hospital/components/DashboardAtualScreen";
import { DashboardBaselineScreen } from "@/features/admin-hospital/components/DashboardBaselineScreen";
import { DashboardProjetadoScreen } from "@/features/admin-hospital/components/DashboardProjetadoScreen";
// ✅ NOVO IMPORT
import { DashboardComparativoHospitalScreen } from "@/features/admin-hospital/components/DashboardComparativoHospitalScreen";
import { useEffect, useState } from "react";
import { clearSectorsCache } from "@/mocks/functionSectores";
import { useParams } from "react-router-dom";
import { getAllSnapshotHospitalSectors } from "@/lib/api";

export default function HospitalDashboardPage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const [hasBaseline, setHasBaseline] = useState(false);
  const [checkingBaseline, setCheckingBaseline] = useState(true);

  useEffect(() => {
    clearSectorsCache();
  }, []);

  useEffect(() => {
    const checkBaseline = async () => {
      if (!hospitalId) {
        setCheckingBaseline(false);
        return;
      }

      try {
        const snapshotData = await getAllSnapshotHospitalSectors(hospitalId);
        const hasData =
          snapshotData &&
          ((snapshotData.internation && snapshotData.internation.length > 0) ||
            (snapshotData.assistance && snapshotData.assistance.length > 0));
        setHasBaseline(!!hasData);
      } catch (error) {
        console.error("Erro ao verificar baseline:", error);
        setHasBaseline(false);
      } finally {
        setCheckingBaseline(false);
      }
    };

    checkBaseline();
  }, [hospitalId]);

  if (checkingBaseline) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Sheet /> Dashboard Hospitalar
        </h1>
        <p className="text-muted-foreground">
          Visualização dos gráficos com base nos dados fornecidos na planilha.
        </p>
      </div>

      <Tabs defaultValue={hasBaseline ? "baseline" : "atual"}>
        <TabsList className={`grid w-full ${hasBaseline ? "grid-cols-4" : "grid-cols-3"}`}>
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

        {/* ✅ CONTEÚDO DA ABA "COMPARATIVO" ATUALIZADO */}
        <TabsContent value="comparativo">
          <div className="grid grid-cols-1 gap-6 mt-6">
            <DashboardComparativoHospitalScreen title="Análise Comparativa" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
