const scpMetodoid: string = "c6489290-1ce6-4298-b99e-2786d40a596a";
const regiaoId: string = "31265f1d-2626-4934-bae1-ecdbb491466e";

export type Hospital = {
    id: string; // uuid
    nome: string;
    cnpj: string | null;
    endereco: string | null;
    telefone: string | null;
    regiaoId: string | null; // uuid
};

export interface BedStatus {
    unidadeId: number;
    bedCount: number;
    minimumCare: number;
    intermediateCare: number;
    highDependency: number;
    semiIntensive: number;
    intensive: number;
    evaluated: number;
    vacant: number;
    inactive: number;
}


export type Cargo = {
    id: string;
    nome: string;
    hospital_id: string;
    salario: string;
    carga_horaria: string;
    adicionais_tributos: string;
    descricao: string | null;
};


export type UnidadeInternacao = {
    id: string; // uuid
    nome: string;
    horasExtraReais: string | null;
    horasExtraProjetadas: string | null;
    hospitalId: string; // uuid
    scpMetodoId: string | null; // uuid
    descricao: string | null;
};

export type UnidadeNaoInternacao = {
    id: string; // uuid
    nome: string;
    status: string;
    descricao: string | null;
    horasExtraReais: string | null;
    horasExtraProjetadas: string | null;
    hospitalId: string; // uuid
};

export type CargoUnidade = {
    id: string; // uuid
    cargoId: string; // uuid
    unidadeId: string | null; // uuid
    unidadeNaoInternacaoId: string | null; // uuid
    quantidadeFuncionarios: number;
};

export type CargoSitio = {
    id: string; // uuid
    cargoUnidadeId: string; // uuid
    sitioId: string; // uuid
    quantidadeFuncionarios: number;
};