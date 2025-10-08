import { SectorInternation } from "./internationDatabase";
import { SectorAssistance } from "./noInternationDatabase";
import { getHospitalSectors, type HospitalSectorsData } from "@/lib/api";

export type HospitalSector = {
  id: string;
  internation: SectorInternation[];
  assistance: SectorAssistance[];
};

// Cache simples para evitar múltiplas chamadas
let cachedData: HospitalSector | null = null;
let cachedHospitalId: string | null = null;

/**
 * Retorna uma lista de setores hospitalares da API real.
 * @param hospitalId O ID do hospital para buscar os setores.
 * @returns Um objeto contendo os setores de internação e assistência.
 */
export async function getAllHospitalSectors(
  hospitalId: string
): Promise<HospitalSector> {
  console.log("🔍 getAllHospitalSectors chamado com hospitalId:", hospitalId);

  // Retorna cache se for o mesmo hospital
  if (cachedData && cachedHospitalId === hospitalId) {
    console.log("✅ Retornando dados do cache");
    return cachedData;
  }

  try {
    console.log("📡 Buscando dados da API...");
    // Busca dados reais da API
    const apiData: HospitalSectorsData = await getHospitalSectors(hospitalId);
    console.log("✅ Dados recebidos da API:", apiData);

    // Transforma os dados da API para o formato esperado pelos componentes
    const transformedData: HospitalSector = {
      id: apiData.id,
      internation: apiData.internation.map((sector) => ({
        id: sector.id,
        name: sector.name,
        descr: sector.descr,
        costAmount: parseFloat(sector.costAmount),
        bedCount: sector.bedCount,
        CareLevel: {
          minimumCare: sector.careLevel.minimumCare,
          intermediateCare: sector.careLevel.intermediateCare,
          highDependency: sector.careLevel.highDependency,
          semiIntensive: sector.careLevel.semiIntensive,
          intensive: sector.careLevel.intensive,
        },
        bedStatus: {
          evaluated: sector.bedStatus.evaluated,
          vacant: sector.bedStatus.vacant,
          inactive: sector.bedStatus.inactive,
        },
        staff: sector.staff.map((member) => ({
          id: member.id,
          role: member.role,
          quantity: member.quantity,
        })),
      })),
      assistance: apiData.assistance.map((sector) => ({
        id: sector.id,
        name: sector.name,
        descr: sector.descr || "",
        costAmount: parseFloat(sector.costAmount),
        siteCount: sector.staff.reduce((sum, s) => sum + s.quantity, 0), // Total de staff como proxy para siteCount
        areas: [
          {
            name: "Principal",
            quantity: sector.staff.reduce((sum, s) => sum + s.quantity, 0),
          },
        ], // Área padrão
        staff: sector.staff.map((member) => ({
          id: member.id,
          role: member.role,
          quantity: member.quantity,
        })),
      })),
    };

    // Atualiza cache
    cachedData = transformedData;
    cachedHospitalId = hospitalId;

    return transformedData;
  } catch (error) {
    console.error("Erro ao buscar setores hospitalares:", error);
    throw error;
  }
}

// Função para limpar o cache (útil ao trocar de hospital)
export const clearSectorsCache = () => {
  console.log("🔍 Limpar cache de setores");
  cachedData = null;
  cachedHospitalId = null;
};
