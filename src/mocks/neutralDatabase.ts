export interface SectorNeutral {
  id: string;
  name: string;
  descr: string;
  costAmount: number;
  status: string;
}

// Exemplo de setores neutros (pode estar vazio se não houver no hospital)
export const neutralSectorsDatabase: SectorNeutral[] = [];
