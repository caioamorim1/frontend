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
        if (data) {
          // Normaliza horas: mantém decimais se existirem, remove se forem zero
          const normalizeHours = (v: any): number | undefined => {
            if (v === null || v === undefined) return undefined;
            let n: number | undefined = undefined;
            if (typeof v === "number") n = v;
            else {
              const s = String(v).replace(/,/g, ".").trim();
              const parsed = Number(s);
              if (!Number.isNaN(parsed)) n = parsed;
            }
            if (n === undefined) return undefined;
            return n % 1 === 0 ? Math.trunc(n) : n;
          };
          const onlyDigitsStr = (v: any): string | undefined => {
            if (v === null || v === undefined) return undefined;
            const digits = String(v).replace(/\D/g, "");
            return digits === "" ? undefined : digits;
          };

          const istPercentNum =
            data.ist !== undefined && data.ist !== null
              ? Math.round(Number(data.ist) * 100)
              : undefined;
          setParametros({
            ...data,
            ist: istPercentNum,
            cargaHorariaEnfermeiro: normalizeHours(
              (data as any).cargaHorariaEnfermeiro
            ),
            cargaHorariaTecnico: normalizeHours(
              (data as any).cargaHorariaTecnico
            ),
            diasSemana: onlyDigitsStr((data as any).diasSemana),
          } as any);
        } else {
          setParametros({}); // aceita null/undefined -> {} (sem parâmetros)
        }
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

    // Campos numéricos que devem ser inteiros (sem casas): horas e IST (%)
    const integerFields = [
      "diasSemana",
      "cargaHorariaEnfermeiro",
      "cargaHorariaTecnico",
      "ist",
    ];

    if (name === "ist") {
      // IST exibido em porcentagem inteira no UI; normaliza vírgula para ponto e mantém apenas inteiros
      const onlyDigits = value.replace(/\D/g, "");
      const num = onlyDigits === "" ? undefined : Number(onlyDigits);
      setParametros((prev) => ({ ...prev, ist: num as any }));
      return;
    }

    if (name === "cargaHorariaEnfermeiro" || name === "cargaHorariaTecnico") {
      // Aceita vírgula ou ponto como separador decimal e remove decimais apenas se forem zero
      const normalized = value.replace(/,/g, ".").trim();
      if (normalized === "") {
        setParametros((prev) => ({ ...prev, [name]: undefined as any }));
        return;
      }
      const parsed = Number(normalized);
      if (Number.isNaN(parsed)) {
        setParametros((prev) => ({ ...prev, [name]: undefined as any }));
        return;
      }
      const finalValue = parsed % 1 === 0 ? Math.trunc(parsed) : parsed;
      setParametros((prev) => ({ ...prev, [name]: finalValue }));
      return;
    }

    if (name === "diasSemana") {
      const onlyDigits = value.replace(/\D/g, "");
      setParametros((prev) => ({ ...prev, diasSemana: onlyDigits }));
      return;
    }

    setParametros((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!setorId) return;

    if (parametros.aplicarIST === undefined || parametros.aplicarIST === null) {
      parametros.aplicarIST = false;
    }
    try {
      // Converte IST de porcentagem inteira para decimal antes de enviar
      const payload: CreateParametrosDTO = {
        ...parametros,
        // Converte IST inteiro -> decimal
        ist:
          parametros.ist !== undefined && parametros.ist !== null
            ? Number(parametros.ist as any) / 100
            : undefined,
        // Garante tipos corretos nos numéricos
        cargaHorariaEnfermeiro:
          parametros.cargaHorariaEnfermeiro !== undefined &&
          parametros.cargaHorariaEnfermeiro !== null
            ? Number(parametros.cargaHorariaEnfermeiro as any)
            : undefined,
        cargaHorariaTecnico:
          parametros.cargaHorariaTecnico !== undefined &&
          parametros.cargaHorariaTecnico !== null
            ? Number(parametros.cargaHorariaTecnico as any)
            : undefined,
        // diasSemana no DTO é string; mantém como string
        diasSemana:
          parametros.diasSemana !== undefined && parametros.diasSemana !== null
            ? String(parametros.diasSemana as any)
            : undefined,
      } as CreateParametrosDTO;

      await saveParametros(setorId, payload);
      alert("Parâmetros salvos com sucesso!");
    } catch (err) {
      setError("Falha ao salvar parâmetros.");
    }
  };

  if (loading) return <p>Carregando parâmetros...</p>;

  return (
    <div className="space-y-6 max-w-[95vw] mx-auto">
      {error && <p className="text-red-500">{error}</p>}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg border shadow-sm space-y-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <Settings />
          <h2 className="text-2xl font-bold text-primary">
            Parâmetros da Unidade
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nome do Enfermeiro Responsável
            </label>
            <input
              name="nome_enfermeiro"
              value={parametros.nome_enfermeiro || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Número do COREN
            </label>
            <input
              name="numero_coren"
              value={parametros.numero_coren || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Dias da Semana para Cálculo
            </label>
            <input
              name="diasSemana"
              type="number"
              inputMode="numeric"
              step={1}
              value={(parametros.diasSemana as any) || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Jornada Semanal Enfermeiro (horas)
            </label>
            <input
              name="cargaHorariaEnfermeiro"
              type="number"
              inputMode="numeric"
              step="any"
              value={(parametros.cargaHorariaEnfermeiro as any) || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Jornada Semanal Técnico (horas)
            </label>
            <input
              name="cargaHorariaTecnico"
              type="number"
              inputMode="numeric"
              step="any"
              value={(parametros.cargaHorariaTecnico as any) || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex items-start gap-6">
          <div className="w-48">
            <label className="block text-sm font-medium mb-2">
              Valor do IST (%)
            </label>
            <input
              name="ist"
              type="number"
              inputMode="numeric"
              value={parametros.ist || ""}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="flex items-start gap-3 flex-1 pt-7">
            <input
              id="aplicarIST"
              name="aplicarIST"
              type="checkbox"
              checked={parametros.aplicarIST || false}
              onChange={handleChange}
              className="h-4 w-4 rounded mt-1"
            />
            <label htmlFor="aplicarIST" className="text-sm font-medium">
              Equipe de enfermagem é composta em sua maioria de pessoas com
              idade superior a 50 anos, ou 20% da equipe com restrições?
            </label>
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
