import { SectorInternation } from "./internationDatabase";
import { SectorAssistance } from "./noInternationDatabase";
import {
  getSnapshotHospitalSectors,
  type HospitalSectorsData,
} from "@/lib/api";

export type HospitalSector = {
  id: string;
  internation: SectorInternation[];
  assistance: SectorAssistance[];
  snapshot?: [];
};

type Dados = {
  id: string;
  internation: SectorInternation[];
  assistance: SectorAssistance[];
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
  console.log("🔍 getAllHospitalSectors chamado com hospitalId:", hospitalId);

  if (cachedData && cachedHospitalId === hospitalId) {
    console.log("✅ Retornando dados do cache");
    return cachedData;
  }

  try {
    console.log("📡 Buscando dados da API...");
    const apiData: any = await getSnapshotHospitalSectors(hospitalId);
    console.log("✅ Dados recebidos da API:", apiData);

    // Estrutura de fallback caso os dados da API venham vazios ou nulos
    const fallbackData: HospitalSector = {
      id: hospitalId,
      internation: [],
      assistance: [],
    };

    if (!apiData) {
      console.warn("⚠️ API não retornou dados. Usando estrutura de fallback.");
      return fallbackData;
    } // Mapeamento seguro para setores de internação

    const internationSectors = Array.isArray(apiData.snapshot.dados.internation)
      ? apiData.snapshot.dados.internation.map((sector) => {
          const costAmount = parseFloat(sector.costAmount) || 0;
          const staff = Array.isArray(sector.staff) ? sector.staff : [];

          return {
            id: sector.id || `internation-${Math.random()}`,
            name: sector.name || "Setor sem nome",
            descr: sector.descr || "",
            costAmount: costAmount,
            bedCount: sector.bedCount || 0,
            CareLevel: {
              minimumCare: sector.careLevel?.minimumCare || 0,
              intermediateCare: sector.careLevel?.intermediateCare || 0,
              highDependency: sector.careLevel?.highDependency || 0,
              semiIntensive: sector.careLevel?.semiIntensive || 0,
              intensive: sector.careLevel?.intensive || 0,
            },
            bedStatus: {
              evaluated: sector.bedStatus?.evaluated || 0,
              vacant: sector.bedStatus?.vacant || 0,
              inactive: sector.bedStatus?.inactive || 0,
            },
            staff: staff.map((member) => ({
              id: member.id || `staff-${Math.random()}`,
              role: member.role || "Cargo desconhecido",
              quantity: member.quantity || 0,
            })),
          };
        })
      : []; // Mapeamento seguro para setores de assistência

    const assistanceSectors = Array.isArray(apiData.snapshot.dados.assistance)
      ? apiData.snapshot.dados.assistance.map((sector) => {
          const costAmount = parseFloat(sector.costAmount) || 0;
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

    const transformedData: HospitalSector = {
      id: apiData.id || hospitalId,
      internation: internationSectors,
      assistance: assistanceSectors,
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
    };
  }
}

export const clearSectorsCache = () => {
  console.log("🧹 Limpando cache de setores");
  cachedData = null;
  cachedHospitalId = null;
};
