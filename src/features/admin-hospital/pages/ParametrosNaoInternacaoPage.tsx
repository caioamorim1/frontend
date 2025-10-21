import { useState, useEffect, FormEvent } from "react";
import { useParams } from "react-router-dom";
import {
  getParametrosNaoInternacao,
  saveParametrosNaoInternacao,
  CreateParametrosNaoInternacaoDTO,
} from "@/lib/api";
import { Settings } from "lucide-react";
import { useAlert } from "@/contexts/AlertContext";

export default function ParametrosNaoInternacaoPage() {
  const { setorId } = useParams<{ setorId: string }>();
  const { showAlert } = useAlert();
  const [parametros, setParametros] = useState<
    Partial<CreateParametrosNaoInternacaoDTO>
  >({
    jornadaSemanalEnfermeiro: 36,
    jornadaSemanalTecnico: 36,
    // UI usa porcentagem inteira (ex: 15 = 15%)
    indiceSegurancaTecnica: 15,
    equipeComRestricao: false,
    diasFuncionamentoMensal: 30,
    diasSemana: 7,
  });
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
        const data = await getParametrosNaoInternacao(setorId);
        if (!mounted) return;
        if (data) {
          // Converte valor decimal (ex: 0.15) para inteiro (%) (ex: 15)
          const istPercent = Math.round(
            (data.indiceSegurancaTecnica ?? 0) * 100
          );
          setParametros({ ...data, indiceSegurancaTecnica: istPercent });
        } else {
          setParametros({
            jornadaSemanalEnfermeiro: 36,
            jornadaSemanalTecnico: 36,
            indiceSegurancaTecnica: 15,
            equipeComRestricao: false,
            diasFuncionamentoMensal: 30,
            diasSemana: 7,
          });
        }
      } catch (err: any) {
        const status = err?.response?.status ?? err?.status;
        const isNotFound =
          status === 404 || /not\s*found/i.test(err?.message ?? "");
        if (isNotFound) {
          if (mounted)
            setParametros({
              jornadaSemanalEnfermeiro: 36,
              jornadaSemanalTecnico: 36,
              indiceSegurancaTecnica: 15,
              equipeComRestricao: false,
              diasFuncionamentoMensal: 30,
              diasSemana: 7,
            });
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
    // Tratamento específico: IST como porcentagem inteira (0-100)
    if (name === "indiceSegurancaTecnica") {
      const onlyDigits = value.replace(/\D/g, "");
      const num =
        onlyDigits === ""
          ? undefined
          : Math.min(100, Math.max(0, parseInt(onlyDigits, 10)));
      setParametros((prev) => ({ ...prev, indiceSegurancaTecnica: num }));
      return;
    }

    let finalValue: any;
    if (type === "checkbox") {
      finalValue = checked;
    } else if (type === "number") {
      finalValue = value === "" ? undefined : Number(value);
    } else {
      finalValue = value;
    }

    setParametros((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!setorId) return;

    setError(null);

    try {
      // Converte IST de porcentagem inteira para decimal antes de enviar
      const payload: CreateParametrosNaoInternacaoDTO = {
        ...parametros,
        indiceSegurancaTecnica:
          ((parametros.indiceSegurancaTecnica ?? 0) as number) / 100,
      } as CreateParametrosNaoInternacaoDTO;

      await saveParametrosNaoInternacao(setorId, payload);
      showAlert("success", "Sucesso", "Parâmetros salvos com sucesso!");
    } catch (err) {
      setError("Falha ao salvar parâmetros.");
      showAlert("destructive", "Erro", "Falha ao salvar parâmetros.");
    }
  };

  if (loading) return <p>Carregando parâmetros...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
        <Settings /> Parâmetros da Unidade (Não-Internação)
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {null}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg border space-y-6"
      >
        {/* Identificação do Responsável */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Responsável pela Unidade
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome do Enfermeiro Responsável
              </label>
              <input
                name="nome_enfermeiro"
                type="text"
                value={parametros.nome_enfermeiro || ""}
                onChange={handleChange}
                className="mt-1 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Dr. Carlos Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Número do COREN
              </label>
              <input
                name="numero_coren"
                type="text"
                value={parametros.numero_coren || ""}
                onChange={handleChange}
                className="mt-1 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 123456"
              />
            </div>
          </div>
        </div>

        {/* Jornadas de Trabalho */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Jornadas de Trabalho
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Jornada Semanal do Enfermeiro (horas)
              </label>
              <input
                name="jornadaSemanalEnfermeiro"
                type="number"
                value={parametros.jornadaSemanalEnfermeiro ?? 36}
                onChange={handleChange}
                min="0"
                className="mt-1 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Jornada Semanal do Técnico (horas)
              </label>
              <input
                name="jornadaSemanalTecnico"
                type="number"
                value={parametros.jornadaSemanalTecnico ?? 36}
                onChange={handleChange}
                min="0"
                className="mt-1 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Configurações de Segurança e Funcionamento */}
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Segurança e Funcionamento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Índice de Segurança Técnica (IST)
              </label>
              <input
                name="indiceSegurancaTecnica"
                type="number"
                inputMode="numeric"
                step="1"
                value={parametros.indiceSegurancaTecnica ?? 15}
                onChange={handleChange}
                min="0"
                max="100"
                className="mt-1 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Informe em porcentagem. Ex: 15 = 15%
              </p>
            </div>

            <div className="flex items-start pt-6">
              <div className="flex items-center h-5">
                <input
                  id="equipeComRestricao"
                  name="equipeComRestricao"
                  type="checkbox"
                  checked={parametros.equipeComRestricao || false}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="ml-3">
                <label
                  htmlFor="equipeComRestricao"
                  className="text-sm font-medium text-gray-700"
                >
                  Equipe com Restrição
                </label>
                <p className="text-xs text-gray-500">
                  Equipe composta em sua maioria de pessoas com idade superior a
                  50 anos, ou 20% da equipe com restrições
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dias de Funcionamento */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Período de Funcionamento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dias de Funcionamento Mensal
              </label>
              <input
                name="diasFuncionamentoMensal"
                type="number"
                value={parametros.diasFuncionamentoMensal ?? 30}
                onChange={handleChange}
                min="1"
                max="31"
                className="mt-1 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Quantos dias por mês a unidade funciona (1-31)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dias da Semana para Cálculo
              </label>
              <input
                name="diasSemana"
                type="number"
                value={parametros.diasSemana ?? 7}
                onChange={handleChange}
                min="1"
                max="7"
                className="mt-1 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dias da semana considerados (1-7)
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            className="px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            Salvar Parâmetros
          </button>
        </div>
      </form>
    </div>
  );
}
