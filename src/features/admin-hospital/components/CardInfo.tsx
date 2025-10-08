import React, { useMemo } from "react";
import {
  UnidadeInternacao,
  UnidadeNaoInternacao,
  SessaoAtiva,
  CargoUnidade,
} from "@/lib/api";
import {
  Building,
  Bed,
  Users,
  Percent,
  Home,
  Activity,
  Briefcase,
} from "lucide-react";

// Um componente auxiliar para os itens de informação
const InfoItem = ({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}) => (
  <div className={`flex items-start text-sm ${className}`}>
    <div className="flex-shrink-0 mr-3 text-gray-500">{icon}</div>
    <div>
      <p className="text-gray-600">{label}</p>
      <p className="font-bold text-lg text-primary">{value}</p>
    </div>
  </div>
);

// Tipagem para as props do nosso novo componente
interface CardInfoProps {
  unidade: UnidadeInternacao | UnidadeNaoInternacao;
  sessoes: SessaoAtiva[];
}

export default function CardInfo({ unidade, sessoes }: CardInfoProps) {
  if (unidade.tipo === "internacao") {
    const unidadeInternacao = unidade as UnidadeInternacao;
    const totalLeitos = unidadeInternacao.leitos?.length || 0;
    const pacientesAtuais = sessoes.length;
    const taxaOcupacao =
      totalLeitos > 0 ? ((pacientesAtuais / totalLeitos) * 100).toFixed(1) : 0;
    console.log(sessoes);
    return (
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Informações da Unidade
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InfoItem
            icon={<Activity size={24} />}
            label="Método SCP"
            value={(unidade as any).scpMetodoKey || "N/A"}
          />
          <InfoItem
            icon={<Bed size={24} />}
            label="Total de Leitos"
            value={totalLeitos}
          />
          <InfoItem
            icon={<Users size={24} />}
            label="Leitos Ocupados"
            value={pacientesAtuais}
          />
          <InfoItem
            icon={<Percent size={24} />}
            label="Taxa de Ocupação"
            value={`${taxaOcupacao}%`}
          />
        </div>
      </div>
    );
  }

  if (unidade.tipo === "nao-internacao") {
    const unidadeNaoInternacao = unidade as UnidadeNaoInternacao;

    const quadroPessoal = useMemo(() => {
      const totalPorCargo: { [key: string]: { nome: string; total: number } } =
        {};
      unidadeNaoInternacao.cargos_unidade?.forEach((cu) => {
        totalPorCargo[cu.cargo.id] = {
          nome: cu.cargo.nome,
          total: cu.quantidade_funcionarios,
        };
      });

      const alocadoPorCargo: { [key: string]: number } = {};
      unidadeNaoInternacao.sitiosFuncionais?.forEach((sitio) => {
        sitio.cargosSitio?.forEach((cs) => {
          const cargoId = cs.cargoUnidade.cargo.id;
          alocadoPorCargo[cargoId] =
            (alocadoPorCargo[cargoId] || 0) + cs.quantidade_funcionarios;
        });
      });

      const totalGeral = Object.values(totalPorCargo).reduce(
        (sum, cargo) => sum + cargo.total,
        0
      );
      const totalAlocado = Object.values(alocadoPorCargo).reduce(
        (sum, qtd) => sum + qtd,
        0
      );

      return {
        totalGeral,
        totalAlocado,
        totalDisponivel: totalGeral - totalAlocado,
        detalhes: Object.entries(totalPorCargo).map(
          ([cargoId, { nome, total }]) => ({
            id: cargoId,
            nome,
            total,
            alocado: alocadoPorCargo[cargoId] || 0,
            disponivel: total - (alocadoPorCargo[cargoId] || 0),
          })
        ),
      };
    }, [unidadeNaoInternacao]);

    return (
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Informações da Unidade
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <InfoItem
            icon={<Building size={24} />}
            label="Tipo"
            value="Não Internação"
          />
          <InfoItem
            icon={<Home size={24} />}
            label="Sítios Funcionais"
            value={unidadeNaoInternacao.sitiosFuncionais?.length || 0}
          />
          <InfoItem
            icon={<Users size={24} />}
            label="Total de Funcionários"
            value={quadroPessoal.totalGeral}
          />
          <InfoItem
            icon={<Briefcase size={24} />}
            label="Cargos na Unidade"
            value={unidadeNaoInternacao.cargos_unidade?.length || 0}
          />
        </div>

        <div className="mt-6 pt-6 border-t">
          <h4 className="text-md font-semibold text-primary mb-3">
            Resumo do Quadro de Pessoal
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-800">
                {quadroPessoal.totalGeral}
              </p>
              <p className="text-xs text-blue-700 font-semibold uppercase">
                Total
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-800">
                {quadroPessoal.totalAlocado}
              </p>
              <p className="text-xs text-yellow-700 font-semibold uppercase">
                Alocados
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-800">
                {quadroPessoal.totalDisponivel}
              </p>
              <p className="text-xs text-green-700 font-semibold uppercase">
                Disponíveis
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {quadroPessoal.detalhes.map((cargo) => (
              <div
                key={cargo.id}
                className="grid grid-cols-4 items-center text-sm p-2 rounded-md hover:bg-slate-50"
              >
                <div className="col-span-2 font-medium text-gray-700">
                  {cargo.nome}
                </div>
                <div className="text-center">
                  <span className="font-bold">{cargo.alocado}</span>
                  <span className="text-gray-500"> / {cargo.total}</span>
                </div>
                <div
                  className={`text-right font-semibold ${
                    cargo.disponivel > 0 ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  Saldo: {cargo.disponivel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
