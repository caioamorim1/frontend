import { useMemo } from "react";
import { Briefcase } from "lucide-react";

interface Cargo {
  id: string;
  nome: string;
  salario: string;
  carga_horaria: string;
  adicionais_tributos: string;
}

export interface CargoUnidade {
  cargo: Cargo;
  quantidade_funcionarios: number;
}

interface QuadroCargosProps {
  cargos: CargoUnidade[];
}

// Função auxiliar para formatar os valores como moeda
const formatCurrency = (value: string | number) => {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
};

export default function QuadroCargos({ cargos }: QuadroCargosProps) {
  // Remove duplicatas baseado no nome do cargo
  const cargosSemDuplicatas = useMemo(() => {
    if (!cargos) return [];

    // Remove duplicatas mantendo apenas a primeira ocorrência de cada nome de cargo
    const cargosFiltrados = cargos.filter(
      (cargo, index, self) =>
        index === self.findIndex((c) => c.cargo.nome === cargo.cargo.nome)
    );

    return cargosFiltrados;
  }, [cargos]);

  const totalFuncionarios = useMemo(() => {
    if (!cargosSemDuplicatas || cargosSemDuplicatas.length === 0) return 0;
    return cargosSemDuplicatas.reduce(
      (sum, item) => sum + item.quantidade_funcionarios,
      0
    );
  }, [cargosSemDuplicatas]);

  if (!cargosSemDuplicatas || cargosSemDuplicatas.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-xl font-semibold text-primary mb-4">
          Quadro de Funcionários
        </h2>
        <p className="text-sm text-gray-500 mt-4">
          Não há informações de cargos para esta unidade.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border animate-fade-in-down">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-primary">
          Quadro de Funcionários por Cargo
        </h2>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase font-semibold">
            Total de Funcionários
          </p>
          <p className="font-bold text-2xl text-primary">{totalFuncionarios}</p>
        </div>
      </div>

      {/* [ALTERADO] Estilo da tabela aprimorado */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-3">
                Cargo
              </th>
              <th scope="col" className="px-6 py-3">
                Salário Base
              </th>
              <th scope="col" className="px-6 py-3">
                C. Horária
              </th>
              <th scope="col" className="px-6 py-3">
                Tributos + Adicionais
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Quantidade
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {cargosSemDuplicatas.map((item) => (
              <tr key={item.cargo.id} className="bg-white hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center gap-2">
                  <Briefcase className="text-gray-400" size={16} />
                  {item.cargo.nome}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {formatCurrency(item.cargo.salario)}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {item.cargo.carga_horaria}h
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {formatCurrency(item.cargo.adicionais_tributos)}
                </td>
                <td className="px-6 py-4 text-right font-bold text-primary">
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
