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

    const { id, internation, assistance } = apiData;
    // Transforma os dados da API para o formato esperado pelos componentes

    const internationTransformed = [];

    for (const sector of internation) {
      const { id, name, descr, costAmount, bedCount, careLevel, bedStatus, staff } = sector;
      const staffData = staff || [];
      internationTransformed.push({
        id,
        name,
        descr,
        costAmount: parseFloat(costAmount),
        bedCount,
        CareLevel: {
          minimumCare: careLevel.minimumCare,
          intermediateCare: careLevel.intermediateCare,
          highDependency: careLevel.highDependency,
          semiIntensive: careLevel.semiIntensive,
          intensive: careLevel.intensive,
        },
        bedStatus: {
          evaluated: bedStatus.evaluated,
          vacant: bedStatus.vacant,
          inactive: bedStatus.inactive,
        },
        staff: staffData.map((member) => ({
          id: member.id,
          role: member.role,
          quantity: member.quantity,
        })),
      });
    }

    const assistanceTransformed = assistance.map((sector) => {
      const { id, name, descr, costAmount, staff } = sector;
      const staffData = staff || [];
      return {
        id,
        name,
        descr,
        costAmount: parseFloat(costAmount),
        siteCount: staffData.reduce((sum, s) => sum + s.quantity, 0),
        areas: [
          {
            name: "Principal",
            quantity: staffData.reduce((sum, s) => sum + s.quantity, 0),
          },
        ],
        staff: staffData.map((member) => ({
          id: member.id,
          role: member.role,
          quantity: member.quantity,
        })),
      };
    });

    const transformedData: HospitalSector = {
      id,
      internation: internationTransformed,
      assistance: assistanceTransformed,
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
