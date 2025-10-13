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
 * Retorna uma lista de setores hospitalares da API real, com tratamento robusto de dados.
 * @param hospitalId O ID do hospital para buscar os setores.
 * @returns Um objeto contendo os setores de internação e assistência.
 */
export async function getAllHospitalSectors(
  hospitalId: string
): Promise<HospitalSector> {
  console.log("🔍 getAllHospitalSectors chamado com hospitalId:", hospitalId);

  if (cachedData && cachedHospitalId === hospitalId) {
    console.log("✅ Retornando dados do cache");
    return cachedData;
  }

  try {
    console.log("📡 Buscando dados da API...");
    const apiData: HospitalSectorsData = await getHospitalSectors(hospitalId);
    console.log("✅ Dados recebidos da API:", apiData);
    console.log("📊 Tipo de apiData:", typeof apiData);
    console.log("📊 Keys de apiData:", Object.keys(apiData || {}));

    const { id, internation, assistance } = apiData;

    console.log(
      "🔍 Processando internation:",
      internation?.length || 0,
      "setores"
    );
    console.log(
      "🔍 Processando assistance:",
      assistance?.length || 0,
      "setores"
    );

    // Transforma os dados da API para o formato esperado pelos componentes

    const internationTransformed = [];

    for (const sector of internation) {
      console.log("🏥 Processando setor de internação:", sector.name);
      const {
        id,
        name,
        descr,
        costAmount,
        bedCount,
        careLevel,
        bedStatus,
        staff,
      } = sector;
      const staffData = staff || [];

      console.log(
        "  💰 costAmount bruto:",
        costAmount,
        "tipo:",
        typeof costAmount
      );

      // Tratamento seguro de costAmount
      let costAmountParsed = 0;
      try {
        costAmountParsed = costAmount ? parseFloat(String(costAmount)) : 0;
        if (isNaN(costAmountParsed)) {
          console.warn(
            `  ⚠️ costAmount inválido para setor ${name}:`,
            costAmount
          );
          costAmountParsed = 0;
        }
      } catch (err) {
        console.error(
          `  ❌ Erro ao parsear costAmount para setor ${name}:`,
          err
        );
        costAmountParsed = 0;
      }

      internationTransformed.push({
        id,
        name,
        descr,
        costAmount: costAmountParsed,
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

    console.log(
      "✅ Setores de internação transformados:",
      internationTransformed.length
    );

    const assistanceTransformed = assistance.map((sector) => {
      console.log("🏥 Processando setor de assistência:", sector.name);
      const { id, name, descr, costAmount, staff } = sector;
      const staffData = staff || [];

      console.log(
        "  💰 costAmount bruto:",
        costAmount,
        "tipo:",
        typeof costAmount
      );

      // Tratamento seguro de costAmount
      let costAmountParsed = 0;
      try {
        costAmountParsed = costAmount ? parseFloat(String(costAmount)) : 0;
        if (isNaN(costAmountParsed)) {
          console.warn(
            `  ⚠️ costAmount inválido para setor ${name}:`,
            costAmount
          );
          costAmountParsed = 0;
        }
      } catch (err) {
        console.error(
          `  ❌ Erro ao parsear costAmount para setor ${name}:`,
          err
        );
        costAmountParsed = 0;
      }

      return {
        id,
        name,
        descr,
        costAmount: costAmountParsed,
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

    console.log(
      "✅ Setores de assistência transformados:",
      assistanceTransformed.length
    );

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
    console.error(
      "❌ Erro ao buscar ou processar setores hospitalares:",
      error
    );

    // Logs detalhados do erro
    if (error instanceof Error) {
      console.error("📛 Mensagem de erro:", error.message);
      console.error("📛 Stack trace:", error.stack);
    }

    // Se for erro do Axios, mostrar detalhes da resposta
    if ((error as any).response) {
      console.error("🔴 Status HTTP:", (error as any).response.status);
      console.error("🔴 Dados da resposta:", (error as any).response.data);
      console.error("🔴 Headers da resposta:", (error as any).response.headers);
    }

    // Se for erro de request
    if ((error as any).request) {
      console.error("📡 Request feito:", (error as any).request);
    }

    // Config da requisição
    if ((error as any).config) {
      console.error("⚙️ Config da requisição:", {
        url: (error as any).config.url,
        method: (error as any).config.method,
        params: (error as any).config.params,
        headers: (error as any).config.headers,
      });
    }

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
