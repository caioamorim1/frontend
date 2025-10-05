import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getUnidadeById,
  getSessoesAtivasByUnidadeId,
  getSitiosFuncionaisByUnidadeId, // <--- ADICIONADO
  UnidadeInternacao,
  UnidadeNaoInternacao,
  SessaoAtiva,
  Unidade,
} from "@/lib/api";

import CardInfo from "../components/CardInfo";
import QuadroCargos from "../components/QuadroCargos";
import LeitosAdminPage from "./LeitosAdminPage";
import ParametrosPage from "./ParametrosPage";
import SitiosFuncionaisAdminPage from "./SitiosFuncionaisAdminPage";

import DimensionamentoTab from "../components/DimensionamentoTab";
import AnaliseNaoInternacaoTab from "../components/AnaliseNaoInternacao";

export default function SetorDetailPage() {
  const { hospitalId, setorId } = useParams<{
    hospitalId: string;
    setorId: string;
  }>();
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [sessoes, setSessoes] = useState<SessaoAtiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dimensionamento");

  const fetchData = async () => {
    if (!setorId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Busca os dados base da unidade
      const unidadeData = await getUnidadeById(setorId);

      // 2. Verifica o tipo da unidade para buscar dados complementares
      if (unidadeData.tipo === "internacao") {
        setActiveTab("dimensionamento");
        const sessoesData = await getSessoesAtivasByUnidadeId(setorId);
        setSessoes(sessoesData);
        setUnidade(unidadeData); // Armazena os dados da unidade de internação
      } else {
        setActiveTab("analise-financeira");
        // CORREÇÃO: Busca os sítios funcionais com todos os detalhes de alocação
        const sitiosDetalhados = await getSitiosFuncionaisByUnidadeId(setorId);
        
        // Combina os dados base com os detalhes de alocação
        const unidadeCompleta = {
          ...unidadeData,
          sitiosFuncionais: sitiosDetalhados,
        };
        setUnidade(unidadeCompleta); // Armazena a unidade completa com todos os dados
      }
    } catch (err) {
      setError("Falha ao carregar dados do setor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [setorId]);

  // Prepara os dados para o QuadroCargos, garantindo que os campos opcionais sejam sempre strings.
  const cargosFormatados = useMemo(() => {
    if (!unidade?.cargos_unidade) return [];

    // O componente QuadroCargos espera que todos os campos sejam strings.
    // Esta transformação garante isso, evitando erros de tipo.
    // @ts-ignore
    return unidade.cargos_unidade.map((cu) => ({
      ...cu,
      cargo: {
        ...cu.cargo,
        salario: cu.cargo.salario ?? "N/D",
        carga_horaria: cu.cargo.carga_horaria ?? "N/A",
        adicionais_tributos: cu.cargo.adicionais_tributos ?? "N/D", // Correção adicionada aqui
      },
    }));
  }, [unidade]);

  if (loading) return <p>A carregar detalhes do setor...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!unidade) return <p>Setor não encontrado.</p>;

  const tabs =
    unidade.tipo === "internacao"
      ? [
          { id: "dimensionamento", label: "Dimensionamento" },
          { id: "leitos", label: "Leitos" },
          { id: "funcionarios", label: "Funcionários" },
          { id: "parametros", label: "Parâmetros" },
        ]
      : [
          { id: "analise-financeira", label: "Análise Financeira" },
          { id: "sitios", label: "Sítios Funcionais" },
          { id: "funcionarios", label: "Funcionários" },
        ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/hospital/${hospitalId}/setores`}
          className="text-sm text-gray-500 hover:underline"
        >
          &larr; Voltar para Setores
        </Link>
        <h1 className="text-3xl font-bold text-primary">{unidade.nome}</h1>
      </div>

      <CardInfo unidade={unidade} sessoes={sessoes} />

      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              id={tab.id}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              label={tab.label}
            />
          ))}
        </nav>
      </div>

      {unidade.tipo === "internacao" && (
        <>
          {activeTab === "dimensionamento" && (
            <DimensionamentoTab
              unidade={unidade as UnidadeInternacao}
              sessoes={sessoes}
              onDataChange={fetchData}
            />
          )}
          {activeTab === "leitos" && <LeitosAdminPage />}
          {activeTab === "parametros" && <ParametrosPage />}
        </>
      )}

      {unidade.tipo === "nao-internacao" && (
        <>
          {activeTab === "sitios" && <SitiosFuncionaisAdminPage />}
          {activeTab === "analise-financeira" && (
            <AnaliseNaoInternacaoTab
              unidade={unidade as UnidadeNaoInternacao}
            />
          )}
        </>
      )}

      {activeTab === "funcionarios" && (
        <QuadroCargos cargos={cargosFormatados} />
      )}
    </div>
  );
}

const TabButton = ({ id, activeTab, setActiveTab, label }: any) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`py-4 px-1 border-b-2 font-medium text-sm ${
      activeTab === id
        ? "border-secondary text-secondary"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`}
  >
    {label}
  </button>
);