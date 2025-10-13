import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getUnidadeById,
  getSessoesAtivasByUnidadeId,
  getSitiosFuncionaisByUnidadeId,
  UnidadeInternacao,
  UnidadeNaoInternacao,
  SessaoAtiva,
  Unidade,
} from "@/lib/api";

import CardInfo from "../components/CardInfo";
import QuadroCargos from "../components/QuadroCargos";
import LeitosAdminPage from "./LeitosAdminPage";
import ParametrosPage from "./ParametrosPage";
import ParametrosNaoInternacaoPage from "./ParametrosNaoInternacaoPage";
import SitiosFuncionaisAdminPage from "./SitiosFuncionaisAdminPage";

import DimensionamentoTab from "../components/DimensionamentoTab";
import AnaliseNaoInternacaoTab from "../components/AnaliseNaoInternacao";
import ProjetadoTab from "../components/ProjetadoTab";
import ProjetadoNaoInternacaoTab from "../components/ProjetadoNaoInternacaoTab";
import AtualTab from "../components/AtualTab"; // Importa o novo componente
import QuadroFuncionariosResumo from "../components/BaselineTab";
import BaselineTabBySitio from "../components/BaselineTabBySitio";

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
      const unidadeData = await getUnidadeById(setorId);

      if (unidadeData.tipo === "internacao") {
        setActiveTab("dimensionamento");
        const sessoesData = await getSessoesAtivasByUnidadeId(setorId);
        setSessoes(sessoesData);
        setUnidade(unidadeData);
      } else {
        setActiveTab("analise-financeira");
        const sitiosDetalhados = await getSitiosFuncionaisByUnidadeId(setorId);
        const unidadeCompleta = {
          ...unidadeData,
          sitiosFuncionais: sitiosDetalhados,
        };
        setUnidade(unidadeCompleta);
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

  const cargosFormatados = useMemo(() => {
    if (!unidade) return [];

    console.log(
      "🔍 [SetorDetailPage] Calculando cargosFormatados para aba Funcionários"
    );

    // Para unidades de não-internação, calcular quantidade dos sítios
    if (
      unidade.tipo === "nao-internacao" &&
      (unidade as UnidadeNaoInternacao).sitiosFuncionais
    ) {
      const sitios = (unidade as UnidadeNaoInternacao).sitiosFuncionais || [];

      console.log(
        "📊 [SetorDetailPage] Calculando de sítios funcionais:",
        sitios.length
      );

      // Agrupa cargos por ID e soma as quantidades de todos os sítios
      const cargosMap = new Map<string, any>();

      sitios.forEach((sitio) => {
        sitio.cargosSitio?.forEach((cargoSitio: any) => {
          const cargoId = cargoSitio.cargoUnidade.cargo.id;
          const cargo = cargoSitio.cargoUnidade.cargo;
          const quantidade = cargoSitio.quantidade_funcionarios || 0;

          if (cargosMap.has(cargoId)) {
            // Soma a quantidade se o cargo já existe
            const existing = cargosMap.get(cargoId)!;
            existing.quantidade_funcionarios += quantidade;
          } else {
            // Adiciona novo cargo
            cargosMap.set(cargoId, {
              cargo: {
                ...cargo,
                salario: cargo.salario ?? "N/D",
                carga_horaria: cargo.carga_horaria ?? "N/A",
                adicionais_tributos: cargo.adicionais_tributos ?? "N/D",
              },
              quantidade_funcionarios: quantidade,
            });
          }
        });
      });

      const cargosArray = Array.from(cargosMap.values());

      console.log("✅ [SetorDetailPage] Cargos calculados dos sítios:", {
        totalCargos: cargosArray.length,
        quantidadeTotal: cargosArray.reduce(
          (sum, c) => sum + c.quantidade_funcionarios,
          0
        ),
        detalhes: cargosArray.map((c) => ({
          nome: c.cargo.nome,
          quantidade: c.quantidade_funcionarios,
        })),
      });

      return cargosArray;
    }

    // Para unidades de internação, usar cargos_unidade (lógica antiga)
    if (!unidade.cargos_unidade) return [];

    console.log("📊 [SetorDetailPage] Usando cargos_unidade (internação)");

    // @ts-ignore
    return unidade.cargos_unidade.map((cu) => ({
      ...cu,
      cargo: {
        ...cu.cargo,
        salario: cu.cargo.salario ?? "N/D",
        carga_horaria: cu.cargo.carga_horaria ?? "N/A",
        adicionais_tributos: cu.cargo.adicionais_tributos ?? "N/D",
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
          { id: "baseline", label: "Baseline" },
          { id: "atual", label: "Atual" },
          { id: "projetado", label: "Projetado" },
        ]
      : [
          { id: "analise-financeira", label: "Análise Financeira" },
          { id: "sitios", label: "Sítios Funcionais" },
          { id: "funcionarios", label: "Funcionários" },
          { id: "parametros", label: "Parâmetros" },
          { id: "baseline", label: "Baseline" },
          { id: "atual", label: "Atual" },
          { id: "projetado", label: "Projetado" },
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
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
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

      {activeTab === "atual" && hospitalId && (
        <AtualTab
          unidade={unidade}
          hospitalId={hospitalId}
          onUpdate={fetchData}
        />
      )}

      {unidade.tipo === "internacao" && (
        <>
          {activeTab === "dimensionamento" && (
            <DimensionamentoTab
              unidade={unidade as UnidadeInternacao}
              sessoes={sessoes}
            />
          )}
          {activeTab === "leitos" && <LeitosAdminPage />}
          {activeTab === "parametros" && <ParametrosPage />}
          {activeTab === "projetado" && (
            <ProjetadoTab unidade={unidade as UnidadeInternacao} />
          )}
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
          {activeTab === "parametros" && <ParametrosNaoInternacaoPage />}
          {activeTab === "projetado" && (
            <ProjetadoNaoInternacaoTab
              unidade={unidade as UnidadeNaoInternacao}
              // hospitalId={hospitalId}
              // onUpdate={fetchData}
            />
          )}
        </>
      )}

      {activeTab === "funcionarios" && (
        <QuadroCargos cargos={cargosFormatados} />
      )}
      {activeTab === "baseline" && hospitalId && setorId && (
        <>
          {unidade?.tipo === "nao-internacao" ? (
            // Para não-internação: mostra baseline por sítio
            <BaselineTabBySitio unidadeId={setorId} hospitalId={hospitalId} />
          ) : (
            // Para internação: mostra baseline resumido (antigo)
            <QuadroFuncionariosResumo
              hospitalId={hospitalId}
              setorId={setorId}
            />
          )}
        </>
      )}
    </div>
  );
}

const TabButton = ({ id, activeTab, setActiveTab, label }: any) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
      activeTab === id
        ? "border-secondary text-secondary"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`}
  >
    {label}
  </button>
);
