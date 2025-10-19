import {
  setores,
  questionarios,
  avaliacoes,
  Avaliacao,
  Questionario,
} from "./mockDatabase";

// Interface de destino para os dados do gráfico
export interface ChartDataItem {
  subject: string;
  atual: number;
  projetado: number; // Será sempre 100 para representar a meta percentual
}

// Interface para os filtros
interface PerformanceFilters {
  tipo?: "Internacao" | "NaoInternacao";
  setorId?: string;
}

/**
 * Calcula a performance percentual e formata os dados para o gráfico de radar.
 * @param filters - Um objeto opcional com { tipo } ou { setorId }.
 * @returns Um array de objetos no formato ChartDataItem, pronto para o gráfico.
 */
export const calcularPerformanceParaGrafico = (
  filters: PerformanceFilters = {}
): ChartDataItem[] => {
  let avaliacoesFiltradas: Avaliacao[] = [...avaliacoes];

  // 1. APLICAR FILTROS (se existirem)
  if (filters.tipo) {
    const idsSetoresFiltrados = setores
      .filter((setor) => setor.tipo === filters.tipo)
      .map((setor) => setor.id);
    avaliacoesFiltradas = avaliacoes.filter((aval) =>
      idsSetoresFiltrados.includes(aval.setorId)
    );
  } else if (filters.setorId) {
    avaliacoesFiltradas = avaliacoes.filter(
      (aval) => aval.setorId === filters.setorId
    );
  }

  // 2. AGRUPAR PONTOS POR QUESTIONÁRIO
  const totaisPorQuestionario = avaliacoesFiltradas.reduce((acc, aval) => {
    const { questionarioId, pontosAtual, pontosProjetado } = aval;
    if (!acc[questionarioId]) {
      acc[questionarioId] = { totalPontosAtual: 0, totalPontosProjetado: 0 };
    }
    acc[questionarioId].totalPontosAtual += pontosAtual;
    acc[questionarioId].totalPontosProjetado += pontosProjetado;
    return acc;
  }, {} as { [key: string]: { totalPontosAtual: number; totalPontosProjetado: number } });

  // 3. CALCULAR O PERCENTUAL E FORMATAR PARA O GRÁFICO
  const resultadoFinal = questionarios.map((questionario) => {
    const totais = totaisPorQuestionario[questionario.id];
    let percentual = 0;

    if (totais && totais.totalPontosProjetado > 0) {
      percentual =
        (totais.totalPontosAtual / totais.totalPontosProjetado) * 100;
    }

    // Monta o objeto no formato desejado
    return {
      subject: questionario.nome, // Nome do questionário vira o "subject"
      atual: parseFloat(percentual.toFixed(2)), // Percentual calculado é o valor "atual"
      projetado: 85, // A meta é sempre 85%
    };
  });

  return resultadoFinal;
};

// ---------------------------------------------------
// EXEMPLOS DE USO
// ---------------------------------------------------

// Cenário 1: Visão Geral (sem filtro)

const dadosGraficoGeral = calcularPerformanceParaGrafico();
console.table(dadosGraficoGeral);

// Cenário 2: Filtrando por tipo "Internação"

const dadosGraficoInternacao = calcularPerformanceParaGrafico({
  tipo: "Internacao",
});
console.table(dadosGraficoInternacao);

// Cenário 3: Filtrando por setor "UTI Adulto"

const dadosGraficoUtiAdulto = calcularPerformanceParaGrafico({
  setorId: "uti-adulto",
});
console.table(dadosGraficoUtiAdulto);
