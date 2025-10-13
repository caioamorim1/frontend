import { useState, useEffect } from "react";
import {
  updateSitioFuncional,
  SitioFuncional,
  UnidadeNaoInternacao,
  SitioDistribuicao,
} from "@/lib/api";
import { X, AlertTriangle, Save } from "lucide-react";
import DistribuicaoTurnosForm from "./DistribuicaoTurnosForm";
import { toast } from "@/hooks/use-toast";

interface CargoSitioManagerProps {
  sitioId: string;
  sitio: SitioFuncional;
  onClose: () => void;
  onUpdate?: () => void;
}

export default function CargoSitioManager({
  sitioId,
  sitio,
  onClose,
  onUpdate,
}: CargoSitioManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Estado para distribuições ENF/TEC
  const [distribuicoes, setDistribuicoes] = useState<SitioDistribuicao[]>(
    sitio.distribuicoes || []
  );

  const handleSaveDistribuicoes = async () => {
    console.log("🔍 [CargoSitioManager] handleSaveDistribuicoes chamado");
    console.log("📊 [CargoSitioManager] Dados a serem salvos:", {
      sitioId,
      distribuicoes,
      distribuicoesLength: distribuicoes.length,
    });

    setSaving(true);
    setError(null);
    try {
      console.log("📡 [CargoSitioManager] Enviando para API...");
      await updateSitioFuncional(sitioId, {
        distribuicoes: distribuicoes,
      });
      console.log("✅ [CargoSitioManager] Salvo com sucesso!");
      toast({
        title: "Sucesso",
        description: "Distribuição de turnos salva com sucesso!",
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("❌ [CargoSitioManager] Erro ao salvar:", err);
      setError("Falha ao salvar distribuições.");
      toast({
        title: "Erro",
        description: "Não foi possível salvar a distribuição de turnos.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-5xl space-y-4 animate-fade-in-down relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold text-primary">
          Gerenciar Sítio: {sitio.nome}
        </h2>

        {loading && <p>Carregando...</p>}
        {error && (
          <p className="text-red-500 text-sm bg-red-50 p-2 rounded flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </p>
        )}

        <div className="space-y-4">
          <DistribuicaoTurnosForm
            distribuicoes={distribuicoes}
            onChange={(novasDistribuicoes) => {
              console.log(
                "🔍 [CargoSitioManager] onChange recebido:",
                novasDistribuicoes
              );
              setDistribuicoes(novasDistribuicoes);
            }}
          />
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => {
                console.log("🔍 [CargoSitioManager] Botão Salvar clicado!");
                handleSaveDistribuicoes();
              }}
              disabled={saving}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar Distribuição"}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
