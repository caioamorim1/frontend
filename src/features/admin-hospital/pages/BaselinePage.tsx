import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  getBaselinesByHospitalId,
  createBaseline,
  createSnapshotHospitalSectors,
  getHospitalSnapshots,
  updateSnapshotSelecionado,
  Baseline,
  getHospitalById,
  Hospital,
  Snapshot,
} from "@/lib/api";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAlert } from "@/contexts/AlertContext";

export default function BaselinePage() {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const { showAlert } = useAlert();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Estado para criar novo baseline
  const [nomeBaseline, setNomeBaseline] = useState("");

  // Estado para selecionar snapshot/baseline
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>("");
  const selectedSnapshot = snapshots.find((s) => s.id === selectedSnapshotId);

  const fetchData = async () => {
    if (!hospitalId) return;

    setLoading(true);
    try {
      const [hospitalData, baselinesData, snapshotsData] = await Promise.all([
        getHospitalById(hospitalId),
        getBaselinesByHospitalId(hospitalId),
        getHospitalSnapshots(hospitalId, 10),
      ]);

      setHospital(hospitalData);
      setBaselines(
        Array.isArray(baselinesData)
          ? baselinesData
          : baselinesData
          ? [baselinesData]
          : []
      );
      setSnapshots(snapshotsData.snapshots || []);

      // Encontrar e selecionar o snapshot que está marcado como selecionado
      const snapshotSelecionado = snapshotsData.snapshots?.find(
        (s) => s.selecionado === true
      );
      if (snapshotSelecionado) {
        setSelectedSnapshotId(snapshotSelecionado.id);
      }
    } catch (error) {
      showAlert("destructive", "Erro", "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hospitalId]);

  const handleGerarBaseline = async () => {
    if (!nomeBaseline.trim()) {
      showAlert(
        "destructive",
        "Erro",
        "Por favor, informe o nome/descrição do baseline."
      );
      return;
    }

    if (!hospitalId) return;

    setCreating(true);
    try {
      await createSnapshotHospitalSectors(hospitalId, nomeBaseline);

      showAlert("success", "Sucesso", "Baseline criado com sucesso!");
      setNomeBaseline("");
      await fetchData();
    } catch (error: any) {
      // Verifica se é o erro de setores pendentes
      if (error?.response?.data?.setoresPendentes) {
        const setoresPendentes = error.response.data.setoresPendentes;
        const mensagemSetores = setoresPendentes.join(", ");
        showAlert(
          "destructive",
          "Setores Pendentes",
          `Não é possível criar o baseline. Os seguintes setores não estão com status concluído: ${mensagemSetores}`
        );
      } else {
        showAlert("destructive", "Erro", "Não foi possível criar o baseline.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleSelecionarBaseline = async (snapshotId: string) => {
    try {
      // Se já havia um snapshot selecionado, desmarcar ele
      if (selectedSnapshotId && selectedSnapshotId !== snapshotId) {
        await updateSnapshotSelecionado(selectedSnapshotId, false);
      }
      await updateSnapshotSelecionado(snapshotId, true);
      setSelectedSnapshotId(snapshotId);
      const snapshot = snapshots.find((s) => s.id === snapshotId);
      if (snapshot) {
        showAlert(
          "success",
          "Sucesso",
          `Baseline "${snapshot.observacao || "Sem descrição"}" selecionado!`
        );
      }
      // Aqui você pode adicionar a lógica para aplicar o baseline
    } catch (error) {
      showAlert(
        "destructive",
        "Erro",
        "Não foi possível selecionar o baseline."
      );
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-800">
          Baseline - {hospital?.nome}
        </h1>
      </div>

      {/* Card para criar novo baseline */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Baseline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomeBaseline">NOME / Descrição</Label>
            <div className="flex gap-4">
              <Input
                id="nomeBaseline"
                placeholder="Digite o nome ou descrição do baseline"
                value={nomeBaseline}
                onChange={(e) => setNomeBaseline(e.target.value)}
                className="border-2"
              />
              <Button
                onClick={handleGerarBaseline}
                disabled={creating || !nomeBaseline.trim()}
                className="shrink-0"
              >
                {creating ? "Gerando..." : "Gerar Baseline"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card para listar snapshots (baselines) disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Baselines Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshots.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum baseline encontrado. Crie um novo baseline acima.
            </p>
          ) : (
            <div className="space-y-3">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">
                      {snapshot.observacao || "Sem descrição"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Criado em:{" "}
                      {new Date(snapshot.dataHora).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                    {snapshot.resumo && (
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          Profissionais:{" "}
                          <strong>{snapshot.resumo.totalProfissionais}</strong>
                        </span>
                        <span className="text-muted-foreground">
                          Custo:{" "}
                          <strong>
                            R${" "}
                            {(snapshot.resumo.custoTotal / 100)
                              .toFixed(0)
                              .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                          </strong>
                        </span>
                        <span className="text-muted-foreground">
                          Unidades:{" "}
                          <strong>
                            {snapshot.resumo.totalUnidadesInternacao +
                              snapshot.resumo.totalUnidadesAssistencia}
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant={
                      selectedSnapshotId === snapshot.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleSelecionarBaseline(snapshot.id)}
                  >
                    {selectedSnapshotId === snapshot.id
                      ? "Selecionado"
                      : "Selecionar Baseline"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
