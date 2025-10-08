// src/features/colab/pages/DashboardPage.tsx

import { Sheet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardAtualScreen } from "@/features/admin-hospital/components/DashboardAtualScreen";
import { DashboardBaselineScreen } from "@/features/admin-hospital/components/DashboardBaselineScreen";
import { DashboardProjetadoScreen } from "@/features/admin-hospital/components/DashboardProjetadoScreen";
// ✅ NOVO IMPORT
import { DashboardComparativoScreen } from "@/features/admin-hospital/components/DashboardComparativoScreen";

export default function HospitalDashboardPage() {
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

      <Tabs defaultValue="baseline">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="baseline">Baseline</TabsTrigger>
          <TabsTrigger value="atual">Atual</TabsTrigger>
          <TabsTrigger value="projetado">Projetado</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
        </TabsList>

        <TabsContent value="baseline">
          <div className="grid grid-cols-1 gap-6 mt-6">
            <DashboardBaselineScreen title="Análise Econômico-Financeira Base" />
          </div>
        </TabsContent>

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
            <DashboardComparativoScreen title="Análise Comparativa" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

