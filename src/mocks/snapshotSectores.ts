import { SectorInternation } from "./internationDatabase";
import { SectorAssistance } from "./noInternationDatabase";
import { SectorNeutral } from "./neutralDatabase";
import {
  getSnapshotHospitalSectors,
  type HospitalSectorsData,
} from "@/lib/api";

export type HospitalSector = {
  id: string;
  internation: SectorInternation[];
  assistance: SectorAssistance[];
  neutral: SectorNeutral[];
  snapshot?: [];
};

type Dados = {
  id: string;
  internation: SectorInternation[];
  assistance: SectorAssistance[];
  neutral: SectorNeutral[];
};
// Cache simples para evitar múltiplas chamadas
let cachedData: HospitalSector | null = null;
let cachedHospitalId: string | null = null;

/**
 * Retorna uma lista de setores hospitalares da API real, com tratamento robusto de dados.
 * @param hospitalId O ID do hospital para buscar os setores.
 * @returns Um objeto contendo os setores de internação e assistência.
 */
export async function getAllSnapshotHospitalSectors(
  hospitalId: string
): Promise<HospitalSector> {
  if (cachedData && cachedHospitalId === hospitalId) {
    return cachedData;
  }

  try {
    const apiData: any = await getSnapshotHospitalSectors(hospitalId);

    // Estrutura de fallback caso os dados da API venham vazios ou nulos
    const fallbackData: HospitalSector = {
      id: hospitalId,
      internation: [],
      assistance: [],
      neutral: [],
    };

    if (!apiData) {
      console.warn("⚠️ API não retornou dados. Usando estrutura de fallback.");
      return fallbackData;
    } // Mapeamento seguro para setores de internação

    // Helper: normaliza valores monetários
    const normalizeCurrencyAmount = (v: any): number => {
      if (v === null || v === undefined) return 0;
      if (typeof v === "number") {
        return v;
      }
      const raw = String(v).trim();
      // Remove símbolos R$, pontos de milhar e usa vírgula como decimal
      const cleaned = raw
        .replace(/[^0-9,.-]/g, "")
        .replace(/\./g, "")
        .replace(/,/g, ".");
      const parsed = parseFloat(cleaned);
      if (Number.isNaN(parsed)) return 0;
      return parsed;
    };

    // Mapear dados de projetadoFinal.internacao para enriquecer os setores
    // ✅ CORREÇÃO: projetadoFinal está dentro de snapshot.dados, não diretamente em snapshot
    const projetadoInternacao =
      apiData.snapshot?.dados?.projetadoFinal?.internacao || [];

    const dados = apiData.snapshot?.dados || {};

    const internationSectors = Array.isArray(dados.internation)
      ? apiData.snapshot.dados.internation.map((sector, index) => {
          const costAmount = normalizeCurrencyAmount(sector.costAmount);
          const staff = Array.isArray(sector.staff) ? sector.staff : [];

          // Buscar dados de dimensionamento do projetadoFinal
          const projetadoData = projetadoInternacao.find(
            (p: any) => p.unidadeId === sector.id
          );

          const dimensionamento = projetadoData?.dimensionamento || null;

          // Se tiver dimensionamento, usar esses dados de leitos
          const bedCount = dimensionamento?.totalLeitos || sector.bedCount || 0;
          const evaluatedBeds =
            dimensionamento?.leitosOcupados || sector.bedStatus?.evaluated || 0;
          const vacantBeds =
            dimensionamento?.leitosVagos || sector.bedStatus?.vacant || 0;
          const inactiveBeds =
            dimensionamento?.leitosInativos || sector.bedStatus?.inactive || 0;

          // Mapear distribuição de classificação para CareLevel
          const distribuicao = dimensionamento?.distribuicaoClassificacao || {};

          const careLevel = {
            minimumCare:
              distribuicao.CUIDADOS_MINIMOS ||
              sector.careLevel?.minimumCare ||
              0,
            intermediateCare:
              distribuicao.INTERMEDIARIOS ||
              sector.careLevel?.intermediateCare ||
              0,
            highDependency:
              distribuicao.ALTA_DEPENDENCIA ||
              sector.careLevel?.highDependency ||
              0,
            semiIntensive:
              distribuicao.SEMI_INTENSIVOS ||
              sector.careLevel?.semiIntensive ||
              0,
            intensive:
              distribuicao.INTENSIVOS || sector.careLevel?.intensive || 0,
          };

          return {
            id: sector.id || `internation-${Math.random()}`,
            name: sector.name || "Setor sem nome",
            descr: sector.descr || "",
            costAmount: costAmount,
            bedCount: bedCount,
            CareLevel: careLevel,
            bedStatus: {
              evaluated: evaluatedBeds,
              vacant: vacantBeds,
              inactive: inactiveBeds,
            },
            staff: staff.map((member) => ({
              id: member.id || `staff-${Math.random()}`,
              role: member.role || "Cargo desconhecido",
              quantity: member.quantity || 0,
            })),
            // Dados adicionais do projetado
            projetadoFinal: projetadoData
              ? {
                  cargos: projetadoData.cargos || [],
                  periodoTravado: projetadoData.periodoTravado || null,
                  dimensionamento: dimensionamento,
                }
              : null,
          };
        })
      : []; // Mapeamento seguro para setores de assistência

    const assistanceSectors = Array.isArray(dados.assistance)
      ? dados.assistance.map((sector) => {
          const costAmount = normalizeCurrencyAmount(sector.costAmount);
          const staff = Array.isArray(sector.staff) ? sector.staff : [];
          const totalStaff = staff.reduce(
            (sum, s) => sum + (s.quantity || 0),
            0
          );

          return {
            id: sector.id || `assistance-${Math.random()}`,
            name: sector.name || "Setor sem nome",
            descr: sector.descr || "",
            costAmount: costAmount,
            siteCount: totalStaff,
            areas: [{ name: "Principal", quantity: totalStaff }],
            staff: staff.map((member) => ({
              id: member.id || `staff-${Math.random()}`,
              role: member.role || "Cargo desconhecido",
              quantity: member.quantity || 0,
            })),
          };
        })
      : [];

    // Transformar setores neutros (apenas custo, sem staff)
    const neutralSectors: SectorNeutral[] =
      dados.neutral && Array.isArray(dados.neutral)
        ? dados.neutral.map((unit: any) => {
            const costAmount = normalizeCurrencyAmount(
              unit.costAmount || unit.custoTotal || 0
            );

            return {
              id: unit.id || `neutral-${Math.random()}`,
              name: unit.name || unit.nome || "Unidade Neutra",
              descr: unit.descr || unit.descricao || "",
              costAmount: costAmount,
              status: unit.status || "ativo",
            };
          })
        : [];

    const transformedData: HospitalSector = {
      id: apiData.id || hospitalId,
      internation: internationSectors,
      assistance: assistanceSectors,
      neutral: neutralSectors,
    };

    cachedData = transformedData;
    cachedHospitalId = hospitalId;

    return transformedData;
  } catch (error) {
    console.error(
      "❌ Erro ao buscar ou processar setores hospitalares:",
      error
    );
    // Em caso de erro, retorna uma estrutura vazia para não quebrar a UI
    return {
      id: hospitalId,
      internation: [],
      assistance: [],
      neutral: [],
    };
  }
}

export const clearSectorsCache = () => {
  cachedData = null;
  cachedHospitalId = null;
};
