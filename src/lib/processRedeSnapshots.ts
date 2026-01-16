import { SnapshotSelecionadoItem } from "./api";

/**
 * Processa snapshots de múltiplos hospitais de uma rede para agregar dados
 * Similar ao processamento do dashboard hospitalar, mas agregando dados de todos hospitais
 */

export interface ProcessedRedeData {
  baseline: {
    global: {
      totalProfissionais: number;
      custoTotal: number;
      totalHospitais: number;
      totalUnidadesInternacao: number;
      totalUnidadesNaoInternacao: number;
      hospitais: Array<{
        hospitalId: string;
        hospitalNome: string;
        totalProfissionais: number;
        custoTotal: number;
        unidadesInternacao: number;
        unidadesNaoInternacao: number;
      }>;
    };
    internacao: {
      totalLeitos: number;
      leitosOcupados: number;
      leitosVagos: number;
      leitosInativos: number;
      taxaOcupacao: number;
      distribuicaoClassificacao: Record<string, number>;
      funcionariosPorCargo: Array<{
        cargoId: string;
        cargoNome: string;
        quantidade: number;
        custoUnitario: number;
        custoTotal: number;
      }>;
      custoPorSetor: Array<{
        setorId: string;
        setorNome: string;
        hospitalNome: string;
        custoTotal: number;
      }>;
    };
    naoInternacao: {
      funcionariosPorCargo: Array<{
        cargoId: string;
        cargoNome: string;
        quantidade: number;
        custoUnitario: number;
        custoTotal: number;
      }>;
      custoPorSetor: Array<{
        setorId: string;
        setorNome: string;
        hospitalNome: string;
        custoTotal: number;
      }>;
    };
  };
  projetado: {
    internacao: {
      funcionariosPorCargo: Array<{
        cargoId: string;
        cargoNome: string;
        quantidade: number;
        projetadoFinal: number;
      }>;
    };
    naoInternacao: {
      funcionariosPorCargo: Array<{
        cargoId: string;
        cargoNome: string;
        quantidade: number;
        projetadoFinal: number;
      }>;
    };
  };
}

export function processRedeSnapshots(
  snapshots: SnapshotSelecionadoItem[]
): ProcessedRedeData {
  // Estruturas para agregação
  const hospitaisData: ProcessedRedeData["baseline"]["global"]["hospitais"] =
    [];

  const cargoMapInternacao = new Map<
    string,
    {
      cargoId: string;
      cargoNome: string;
      quantidade: number;
      custoUnitario: number;
      custoTotal: number;
    }
  >();

  const cargoMapNaoInternacao = new Map<
    string,
    {
      cargoId: string;
      cargoNome: string;
      quantidade: number;
      custoUnitario: number;
      custoTotal: number;
    }
  >();

  const cargoMapProjetadoInternacao = new Map<
    string,
    {
      cargoId: string;
      cargoNome: string;
      quantidade: number;
      projetadoFinal: number;
    }
  >();

  const cargoMapProjetadoNaoInternacao = new Map<
    string,
    {
      cargoId: string;
      cargoNome: string;
      quantidade: number;
      projetadoFinal: number;
    }
  >();

  const setoresCustoInternacao: ProcessedRedeData["baseline"]["internacao"]["custoPorSetor"] =
    [];
  const setoresCustoNaoInternacao: ProcessedRedeData["baseline"]["naoInternacao"]["custoPorSetor"] =
    [];

  let totalLeitosGeral = 0;
  let leitosOcupadosGeral = 0;
  let leitosVagosGeral = 0;
  let leitosInativosGeral = 0;
  const distribuicaoClassificacaoGeral: Record<string, number> = {};

  // Processar cada snapshot (hospital)
  snapshots.forEach((snapshot) => {
    const { hospital, dados, resumo } = snapshot;

    // Dados do hospital para o array
    hospitaisData.push({
      hospitalId: hospital.id,
      hospitalNome: hospital.nome,
      totalProfissionais: resumo.totalProfissionais,
      custoTotal: resumo.custoTotal,
      unidadesInternacao: resumo.totalUnidadesInternacao,
      unidadesNaoInternacao: resumo.totalUnidadesAssistencia,
    });

    // Processar unidades de INTERNAÇÃO
    if (dados.internation && Array.isArray(dados.internation)) {
      dados.internation.forEach((unidade: any) => {
        // Agregação de leitos
        totalLeitosGeral += unidade.bedCount || 0;
        leitosOcupadosGeral += unidade.bedStatus?.evaluated || 0;
        leitosVagosGeral += unidade.bedStatus?.vacant || 0;
        leitosInativosGeral += unidade.bedStatus?.inactive || 0;

        // Agregação de classificação de cuidado
        if (unidade.careLevel) {
          Object.entries(unidade.careLevel).forEach(([nivel, valor]) => {
            distribuicaoClassificacaoGeral[nivel] =
              (distribuicaoClassificacaoGeral[nivel] || 0) + (valor as number);
          });
        }

        // Agregação de funcionários por cargo (INTERNAÇÃO)
        if (unidade.staff && Array.isArray(unidade.staff)) {
          unidade.staff.forEach((staff: any) => {
            const key = staff.id;
            if (cargoMapInternacao.has(key)) {
              const existing = cargoMapInternacao.get(key)!;
              existing.quantidade += staff.quantity || 0;
              existing.custoTotal += staff.totalCost || 0;
            } else {
              cargoMapInternacao.set(key, {
                cargoId: staff.id,
                cargoNome: staff.role,
                quantidade: staff.quantity || 0,
                custoUnitario: staff.unitCost || 0,
                custoTotal: staff.totalCost || 0,
              });
            }
          });
        }

        // Custo por setor (INTERNAÇÃO)
        setoresCustoInternacao.push({
          setorId: unidade.id,
          setorNome: unidade.name,
          hospitalNome: hospital.nome,
          custoTotal: unidade.costAmount || 0,
        });
      });
    }

    // Processar unidades de NÃO INTERNAÇÃO
    if (dados.assistance && Array.isArray(dados.assistance)) {
      dados.assistance.forEach((unidade: any) => {
        // Agregação de funcionários por cargo (NÃO INTERNAÇÃO)
        if (unidade.staff && Array.isArray(unidade.staff)) {
          unidade.staff.forEach((staff: any) => {
            const key = staff.id;
            if (cargoMapNaoInternacao.has(key)) {
              const existing = cargoMapNaoInternacao.get(key)!;
              existing.quantidade += staff.quantity || 0;
              existing.custoTotal += staff.totalCost || 0;
            } else {
              cargoMapNaoInternacao.set(key, {
                cargoId: staff.id,
                cargoNome: staff.role,
                quantidade: staff.quantity || 0,
                custoUnitario: staff.unitCost || 0,
                custoTotal: staff.totalCost || 0,
              });
            }
          });
        }

        // Custo por setor (NÃO INTERNAÇÃO)
        setoresCustoNaoInternacao.push({
          setorId: unidade.id,
          setorNome: unidade.name,
          hospitalNome: hospital.nome,
          custoTotal: unidade.costAmount || 0,
        });
      });
    }

    // Processar PROJETADO FINAL
    if (dados.projetadoFinal) {
      // Projetado - Internação
      if (
        dados.projetadoFinal.internacao &&
        Array.isArray(dados.projetadoFinal.internacao)
      ) {
        dados.projetadoFinal.internacao.forEach((unidade: any) => {
          if (unidade.cargos && Array.isArray(unidade.cargos)) {
            unidade.cargos.forEach((cargo: any) => {
              const key = cargo.cargoId;
              if (cargoMapProjetadoInternacao.has(key)) {
                const existing = cargoMapProjetadoInternacao.get(key)!;
                existing.quantidade += 0; // Quantidade atual não está nesse contexto
                existing.projetadoFinal += cargo.projetadoFinal || 0;
              } else {
                // Buscar nome do cargo no mapa de baseline
                const cargoBaseline = cargoMapInternacao.get(key);
                cargoMapProjetadoInternacao.set(key, {
                  cargoId: cargo.cargoId,
                  cargoNome: cargoBaseline?.cargoNome || "Desconhecido",
                  quantidade: 0,
                  projetadoFinal: cargo.projetadoFinal || 0,
                });
              }
            });
          }
        });
      }

      // Projetado - Não Internação
      if (
        dados.projetadoFinal.naoInternacao &&
        Array.isArray(dados.projetadoFinal.naoInternacao)
      ) {
        dados.projetadoFinal.naoInternacao.forEach((unidade: any) => {
          if (unidade.cargos && Array.isArray(unidade.cargos)) {
            unidade.cargos.forEach((cargo: any) => {
              const key = cargo.cargoId;
              if (cargoMapProjetadoNaoInternacao.has(key)) {
                const existing = cargoMapProjetadoNaoInternacao.get(key)!;
                existing.quantidade += 0;
                existing.projetadoFinal += cargo.projetadoFinal || 0;
              } else {
                const cargoBaseline = cargoMapNaoInternacao.get(key);
                cargoMapProjetadoNaoInternacao.set(key, {
                  cargoId: cargo.cargoId,
                  cargoNome: cargoBaseline?.cargoNome || "Desconhecido",
                  quantidade: 0,
                  projetadoFinal: cargo.projetadoFinal || 0,
                });
              }
            });
          }
        });
      }
    }
  });

  // Calcular totais
  const totalProfissionais = hospitaisData.reduce(
    (sum, h) => sum + h.totalProfissionais,
    0
  );
  const custoTotal = hospitaisData.reduce((sum, h) => sum + h.custoTotal, 0);
  const totalUnidadesInternacao = hospitaisData.reduce(
    (sum, h) => sum + h.unidadesInternacao,
    0
  );
  const totalUnidadesNaoInternacao = hospitaisData.reduce(
    (sum, h) => sum + h.unidadesNaoInternacao,
    0
  );

  const taxaOcupacao =
    totalLeitosGeral > 0 ? (leitosOcupadosGeral / totalLeitosGeral) * 100 : 0;

  const result: ProcessedRedeData = {
    baseline: {
      global: {
        totalProfissionais,
        custoTotal,
        totalHospitais: snapshots.length,
        totalUnidadesInternacao,
        totalUnidadesNaoInternacao,
        hospitais: hospitaisData,
      },
      internacao: {
        totalLeitos: totalLeitosGeral,
        leitosOcupados: leitosOcupadosGeral,
        leitosVagos: leitosVagosGeral,
        leitosInativos: leitosInativosGeral,
        taxaOcupacao,
        distribuicaoClassificacao: distribuicaoClassificacaoGeral,
        funcionariosPorCargo: Array.from(cargoMapInternacao.values()),
        custoPorSetor: setoresCustoInternacao,
      },
      naoInternacao: {
        funcionariosPorCargo: Array.from(cargoMapNaoInternacao.values()),
        custoPorSetor: setoresCustoNaoInternacao,
      },
    },
    projetado: {
      internacao: {
        funcionariosPorCargo: Array.from(cargoMapProjetadoInternacao.values()),
      },
      naoInternacao: {
        funcionariosPorCargo: Array.from(
          cargoMapProjetadoNaoInternacao.values()
        ),
      },
    },
  };

  return result;
}
