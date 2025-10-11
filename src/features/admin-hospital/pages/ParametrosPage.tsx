import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  getParametros,
  saveParametros,
  ParametrosUnidade,
  CreateParametrosDTO,
} from "@/lib/api";
import { Settings } from "lucide-react";

export default function ParametrosPage() {
  const { setorId } = useParams<{ setorId: string }>();
  const [parametros, setParametros] = useState<Partial<CreateParametrosDTO>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!setorId) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        const data = await getParametros(setorId);
        if (!mounted) return;
        setParametros(data ?? {}); // aceita null/undefined -> {} (sem parâmetros)
      } catch (err: any) {
        // se a API retornar 404 / not found, considerar como "sem parâmetros" (não é erro)
        const status = err?.response?.status ?? err?.status;
        const isNotFound =
          status === 404 || /not\s*found/i.test(err?.message ?? "");
        if (isNotFound) {
          if (mounted) setParametros({});
        } else {
          if (mounted) setError("Falha ao carregar parâmetros.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [setorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setParametros((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!setorId) return;
    try {
      await saveParametros(setorId, parametros as CreateParametrosDTO);
      alert("Parâmetros salvos com sucesso!");
    } catch (err) {
      setError("Falha ao salvar parâmetros.");
    }
  };

  if (loading) return <p>Carregando parâmetros...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
        <Settings /> Parâmetros da Unidade
      </h2>
      {error && <p className="text-red-500">{error}</p>}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg border space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">
              Nome do Enfermeiro Responsável
            </label>
            <input
              name="nome_enfermeiro"
              value={parametros.nome_enfermeiro || ""}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Número do COREN</label>
            <input
              name="numero_coren"
              value={parametros.numero_coren || ""}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Dias da Semana para Cálculo
            </label>
            <input
              name="diasSemana"
              type="number"
              value={parametros.diasSemana || 7}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
          <div className="flex items-center gap-4 pt-6">
            <input
              id="aplicarIST"
              name="aplicarIST"
              type="checkbox"
              checked={parametros.aplicarIST || false}
              onChange={handleChange}
              className="h-4 w-4 rounded"
            />
            <label htmlFor="aplicarIST" className="text-sm font-medium">
              Equipe de enfermagem é composta em sua maioria de pessoas com
              idade superior a 50 anos, ou 20% da equipe com restrições?
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium">
              Valor do IST (%)
            </label>
            <input
              name="ist"
              type="number"
              value={parametros.ist ?? 15}
              onChange={handleChange}
              className="mt-1 w-full p-2 border rounded-md"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 text-white bg-green-600 rounded-md"
          >
            Salvar Parâmetros
          </button>
        </div>
      </form>
    </div>
  );
}
// 167 lines