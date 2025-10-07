import { allInternationSectors, SectorInternation } from "./internationDatabase";
import { allAssistanceSectors, SectorAssistance } from "./noInternationDatabase";


export type HospitalSector = {
    id: string;
    internation: SectorInternation[];
    assistance: SectorAssistance[];
};
/**
 * Retorna uma lista de setores hospitalares, com a opção de filtrar por tipo.
 * @param filter O tipo de setor a ser retornado: 'internation', 'assistance', ou 'all'.
 * @returns Um array contendo os objetos de setor solicitados.
 */
export function getAllHospitalSectors(): HospitalSector {
    return {
        id: 'hospital-sectors',
        internation: allInternationSectors,
        assistance: allAssistanceSectors
    }
}




// // --- Exemplo 1: Obter TODOS os setores ---
// const allSectors = getHospitalSectors(); // ou getHospitalSectors('all')
// console.log(`Total de setores encontrados: ${allSectors.length}`);


// // --- Exemplo 2: Obter APENAS setores de INTERNAÇÃO ---
// const internationOnly = getHospitalSectors('internation');
// internationOnly.forEach(sector => console.log(sector.name));


// // --- Exemplo 3: Obter APENAS setores ASSISTENCIAIS ---
// const assistanceOnly = getHospitalSectors('assistance');
// assistanceOnly.forEach(sector => console.log(sector.name));


// // --- Exemplo 4: Processando a lista completa e diferenciando os tipos ---
// const completeList = getHospitalSectors('all');
