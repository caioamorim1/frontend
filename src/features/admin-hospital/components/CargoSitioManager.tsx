import { useState, useEffect } from "react";
import {
  updateSitioFuncional,
  SitioFuncional,
  UnidadeNaoInternacao,
  SitioDistribuicao,
  getSitioDistribuicoes,
} from "@/lib/api";
import { X, AlertTriangle, Save } from "lucide-react";
import DistribuicaoTurnosForm from "./DistribuicaoTurnosForm";
import { toast } from "@/hooks/use-toast";

interface CargoSitioManagerProps {
  sitioId: string;
  sitio: SitioFuncional;
  onClose: () => void;
  onUpdate?: () => void;
  disabled?: boolean;
}

export default function CargoSitioManager({
  sitioId,
  sitio,
  onClose,
  onUpdate,
  disabled = false,
}: CargoSitioManagerProps) {
  console.log("🟢 [CargoSitioManager] Componente montado");
  console.log("🟢 [CargoSitioManager] sitioId:", sitioId);
  console.log("🟢 [CargoSitioManager] sitio recebido:", sitio);
  console.log("🟢 [CargoSitioManager] disabled:", disabled);
  console.log(
    "🟢 [CargoSitioManager] distribuicoes recebidas:",
    sitio.distribuicoes
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Estado para distribuições ENF/TEC
  const [distribuicoes, setDistribuicoes] = useState<SitioDistribuicao[]>(
    sitio.distribuicoes || []
  );

  console.log(
    "🟢 [CargoSitioManager] Estado inicial de distribuicoes:",
    distribuicoes
  );

  // Buscar distribuições salvas do backend ao montar o componente
  useEffect(() => {
    const fetchDistribuicoes = async () => {
      console.log(
        "🔄 [CargoSitioManager] Buscando distribuições do backend..."
      );
      setLoading(true);
      try {
        const response = await getSitioDistribuicoes(sitioId);
        console.log(
          "✅ [CargoSitioManager] Resposta completa do backend:",
          response
        );

        // A resposta vem como { sitioId, sitioNome, distribuicoes: { ENF: {...}, TEC: {...} } }
        // Precisamos converter para array de SitioDistribuicao
        if (response && (response as any).distribuicoes) {
          const dist = (response as any).distribuicoes;
          console.log("🔍 [CargoSitioManager] Objeto distribuicoes:", dist);

          const distribuicoesArray: SitioDistribuicao[] = [];

          // Converter ENF
          if (dist.ENF) {
            distribuicoesArray.push({
              id: dist.ENF.id,
              categoria: "ENF",
              segSexManha: dist.ENF.segSex.manha,
              segSexTarde: dist.ENF.segSex.tarde,
              segSexNoite1: dist.ENF.segSex.noite1,
              segSexNoite2: dist.ENF.segSex.noite2,
              sabDomManha: dist.ENF.sabDom.manha,
              sabDomTarde: dist.ENF.sabDom.tarde,
              sabDomNoite1: dist.ENF.sabDom.noite1,
              sabDomNoite2: dist.ENF.sabDom.noite2,
            });
          }

          // Converter TEC
          if (dist.TEC) {
            distribuicoesArray.push({
              id: dist.TEC.id,
              categoria: "TEC",
              segSexManha: dist.TEC.segSex.manha,
              segSexTarde: dist.TEC.segSex.tarde,
              segSexNoite1: dist.TEC.segSex.noite1,
              segSexNoite2: dist.TEC.segSex.noite2,
              sabDomManha: dist.TEC.sabDom.manha,
              sabDomTarde: dist.TEC.sabDom.tarde,
              sabDomNoite1: dist.TEC.sabDom.noite1,
              sabDomNoite2: dist.TEC.sabDom.noite2,
            });
          }

          console.log(
            "✅ [CargoSitioManager] Distribuições convertidas para array:",
            distribuicoesArray
          );

          if (distribuicoesArray.length > 0) {
            setDistribuicoes(distribuicoesArray);
          } else {
            console.log(
              "⚠️ [CargoSitioManager] Nenhuma distribuição encontrada, usando dados locais"
            );
          }
        } else {
          console.log(
            "⚠️ [CargoSitioManager] Resposta não contém distribuições, usando dados locais"
          );
        }
      } catch (error) {
        console.error(
          "❌ [CargoSitioManager] Erro ao buscar distribuições:",
          error
        );
        // Em caso de erro, mantém as distribuições que vieram do prop
      } finally {
        setLoading(false);
      }
    };
    fetchDistribuicoes();
  }, [sitioId]);

  const handleSaveDistribuicoes = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateSitioFuncional(sitioId, {
        distribuicoes: distribuicoes,
      });

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

        {disabled && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md flex items-center gap-2">
            <AlertTriangle size={18} />
            <span className="text-sm font-medium">
              Este sítio possui pelo menos um cargo com entrega concluída. Os
              campos estão bloqueados para edição.
            </span>
          </div>
        )}

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
              setDistribuicoes(novasDistribuicoes);
            }}
            readonly={disabled}
          />
          <div className="flex justify-end pt-4 border-t">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleSaveDistribuicoes();
                }}
                disabled={saving || disabled}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} />
                {saving ? "Salvando..." : "Salvar Distribuição"}
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
