import { useMemo } from "react";
import { Briefcase, Users } from "lucide-react";

// As interfaces foram mantidas para compatibilidade com a estrutura de dados
interface Cargo {
  id: string;
  nome: string;
}

export interface CargoUnidade {
  cargo: Cargo;
  quantidade_funcionarios: number;
}

interface QuadroFuncionariosProps {
  cargos: CargoUnidade[];
}

export default function QuadroFuncionariosResumo({
  cargos,
}: QuadroFuncionariosProps) {
  // Calcula o total de funcionários
  const totalFuncionarios = useMemo(() => {
    if (!cargos) return 0;
    return cargos.reduce((sum, item) => sum + item.quantidade_funcionarios, 0);
  }, [cargos]);

  // Calcula o total de cargos distintos
  const totalCargos = useMemo(() => {
    if (!cargos) return 0;
    return cargos.length;
  }, [cargos]);

  // Estado de "carregando" ou "sem dados"
  if (!cargos || cargos.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold text-primary mb-4">
          Resumo de Funcionários
        </h2>
        <p className="text-sm text-gray-500 mt-4">
          Não há informações de funcionários para esta unidade.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
      {/* Cabeçalho com totais */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-primary">
            Resumo de Funcionários
          </h2>
          <p className="text-sm text-gray-500">
            Distribuição de funcionários por cargo.
          </p>
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Total de Cargos
            </p>
            <p className="font-bold text-2xl text-primary flex items-center justify-end gap-2">
              <Briefcase size={20} />
              {totalCargos}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-semibold">
              Total de Funcionários
            </p>
            <p className="font-bold text-2xl text-primary flex items-center justify-end gap-2">
              <Users size={20} />
              {totalFuncionarios}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela Simplificada */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3 w-3/4">
                Cargo
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Nº de Funcionários
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cargos.map((item) => (
              <tr key={item.cargo.id} className="bg-white hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {item.cargo.nome}
                </td>
                <td className="px-6 py-4 text-right font-bold text-gray-700">
                  {item.quantidade_funcionarios}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}