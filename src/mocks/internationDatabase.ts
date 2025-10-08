interface Staff {
    id: string;
    role: string;
    quantity: number;
}

interface CareLevel {
    minimumCare: number;
    intermediateCare: number;
    highDependency: number;
    semiIntensive: number;
    intensive: number;
}

interface BedStatus {
    evaluated: number; // Leitos Operacionais
    vacant: number;
    inactive: number;
}

export interface SectorInternation {
    id: string;
    name: string;
    descr: string;
    costAmount: number;
    bedCount: number;
    CareLevel: CareLevel;
    bedStatus: BedStatus;
    staff: Staff[];
}



// Unidade 1: UTI Pediátrica (fornecida como exemplo)
const unit1: SectorInternation = {
    id: '1',
    name: 'UTI Pediátrica',
    descr: 'Oferece cuidados intensivos para crianças e adolescentes',
    costAmount: 500000,
    bedCount: 10,
    CareLevel: {
        minimumCare: 0,
        intermediateCare: 0,
        highDependency: 0,
        semiIntensive: 2,
        intensive: 6,
    },
    bedStatus: {
        evaluated: 8,
        vacant: 2,
        inactive: 0,
    },
    staff: [
        { id: '1', role: 'Médico Intensivista Pediátrico', quantity: 3 },
        { id: '2', role: 'Enfermeiro', quantity: 5 },
        { id: '3', role: 'Técnico de Enfermagem', quantity: 8 },
        { id: '4', role: 'Fisioterapeuta', quantity: 2 },
    ],
};

// Unidade 2: Clínica Médica
const unit2: SectorInternation = {
    id: '2',
    name: 'Clínica Médica',
    descr: 'Atende pacientes adultos com condições clínicas diversas',
    costAmount: 850000,
    bedCount: 70,
    CareLevel: {
        minimumCare: 30,
        intermediateCare: 25,
        highDependency: 9,
        semiIntensive: 0,
        intensive: 0,
    },
    bedStatus: {
        evaluated: 64,
        vacant: 6,
        inactive: 0,
    },
    staff: [
        { id: '1', role: 'Médico Clínico', quantity: 8 },
        { id: '2', role: 'Enfermeiro', quantity: 15 },
        { id: '3', role: 'Técnico de Enfermagem', quantity: 25 },
        { id: '4', role: 'Fisioterapeuta', quantity: 4 },
    ],
};

// Unidade 3: Cirurgia Geral
const unit3: SectorInternation = {
    id: '3',
    name: 'Cirurgia Geral',
    descr: 'Realiza cirurgias eletivas e de emergência',
    costAmount: 1100000,
    bedCount: 70,
    CareLevel: {
        minimumCare: 35,
        intermediateCare: 15,
        highDependency: 10,
        semiIntensive: 0,
        intensive: 0,
    },
    bedStatus: {
        evaluated: 60,
        vacant: 10,
        inactive: 0,
    },
    staff: [
        { id: '1', role: 'Médico Cirurgião', quantity: 10 },
        { id: '2', role: 'Anestesista', quantity: 5 },
        { id: '3', role: 'Enfermeiro', quantity: 18 },
        { id: '4', role: 'Técnico de Enfermagem', quantity: 30 },
    ],
};

// Unidade 4: Pediatria
const unit4: SectorInternation = {
    id: '4',
    name: 'Pediatria',
    descr: 'Atende crianças e adolescentes com condições clínicas e cirúrgicas',
    costAmount: 650000,
    bedCount: 50,
    CareLevel: {
        minimumCare: 10,
        intermediateCare: 30,
        highDependency: 0,
        semiIntensive: 0,
        intensive: 0,
    },
    bedStatus: {
        evaluated: 40,
        vacant: 10,
        inactive: 0,
    },
    staff: [
        { id: '1', role: 'Médico Pediatra', quantity: 6 },
        { id: '2', role: 'Enfermeiro', quantity: 12 },
        { id: '3', role: 'Técnico de Enfermagem', quantity: 20 },
    ],
};

// Unidade 5: Ortopedia
const unit5: SectorInternation = {
    id: '5',
    name: 'Ortopedia',
    descr: 'Trata condições ortopédicas, incluindo fraturas e cirurgias',
    costAmount: 920000,
    bedCount: 30,
    CareLevel: {
        minimumCare: 10,
        intermediateCare: 11,
        highDependency: 6,
        semiIntensive: 0,
        intensive: 0,
    },
    bedStatus: {
        evaluated: 27,
        vacant: 3,
        inactive: 0,
    },
    staff: [
        { id: '1', role: 'Médico Ortopedista', quantity: 4 },
        { id: '2', role: 'Enfermeiro', quantity: 8 },
        { id: '3', role: 'Técnico de Enfermagem', quantity: 12 },
        { id: '4', role: 'Fisioterapeuta', quantity: 6 },
    ],
};

// Unidade 6: Neurologia
const unit6: SectorInternation = {
    id: '6',
    name: 'Neurologia',
    descr: 'Especializada em condições neurológicas, como AVC e epilepsia',
    costAmount: 780000,
    bedCount: 20,
    CareLevel: {
        minimumCare: 7,
        intermediateCare: 9,
        highDependency: 0,
        semiIntensive: 0,
        intensive: 0,
    },
    bedStatus: {
        evaluated: 16,
        vacant: 4,
        inactive: 0,
    },
    staff: [
        { id: '1', role: 'Médico Neurologista', quantity: 3 },
        { id: '2', role: 'Enfermeiro', quantity: 7 },
        { id: '3', role: 'Técnico de Enfermagem', quantity: 9 },
        { id: '4', role: 'Fonoaudiólogo', quantity: 2 },
    ],
};

// Unidade 7: Cardiologia
const unit7: SectorInternation = {
    id: '7',
    name: 'Cardiologia',
    descr: 'Atende pacientes com condições cardíacas, incluindo insuficiência cardíaca',
    costAmount: 990000,
    bedCount: 20,
    CareLevel: {
        minimumCare: 6,
        intermediateCare: 10,
        highDependency: 2,
        semiIntensive: 0,
        intensive: 0,
    },
    bedStatus: {
        evaluated: 18,
        vacant: 2,
        inactive: 0,
    },
    staff: [
        { id: '1', role: 'Médico Cardiologista', quantity: 4 },
        { id: '2', role: 'Enfermeiro', quantity: 8 },
        { id: '3', role: 'Técnico de Enfermagem', quantity: 10 },
        { id: '4', role: 'Nutricionista', quantity: 1 },
    ],
};

// Unidade 8: UTI Adulto
const unit8: SectorInternation = {
    id: '8',
    name: 'UTI Adulto',
    descr: 'Oferece cuidados intensivos para pacientes adultos em estado grave',
    costAmount: 1800000,
    bedCount: 30,
    CareLevel: {
        minimumCare: 1,
        intermediateCare: 1,
        highDependency: 0,
        semiIntensive: 5,
        intensive: 17,
    },
    bedStatus: {
        evaluated: 24,
        vacant: 6,
        inactive: 0,
    },
    staff: [
        { id: '1', role: 'Médico Intensivista', quantity: 6 },
        { id: '2', role: 'Enfermeiro', quantity: 15 },
        { id: '3', role: 'Técnico de Enfermagem', quantity: 20 },
        { id: '4', role: 'Fisioterapeuta Respiratório', quantity: 5 },
    ],
};


// Você pode então agrupar todos em um array para facilitar o uso:
export const allInternationSectors: SectorInternation[] = [
    unit1,
    unit2,
    unit3,
    unit4,
    unit5,
    unit6,
    unit7,
    unit8
];



/*

SELECT 
    uni.id AS "id",
    uni.nome AS "name",
    uni.descricao AS "descr",
    SUM(
        (
            (COALESCE(REPLACE(c.salario, ',', '.')::numeric, 0) + 
             COALESCE(REPLACE(c.adicionais_tributos, ',', '.')::numeric, 0) +
             COALESCE(REPLACE(uni.horas_extra_reais, ',', '.')::numeric, 0)
             )
            * COALESCE(cuni.quantidade_funcionarios, 0)
        )
    ) AS "costAmount",
    COALESCE(ls.bed_count, 0) AS "bedCount",
    JSON_BUILD_OBJECT(
        'minimumCare',      COALESCE(ls.minimum_care, 0),
        'intermediateCare', COALESCE(ls.intermediate_care, 0),
        'highDependency',   COALESCE(ls.high_dependency, 0),
        'semiIntensive',    COALESCE(ls.semi_intensive, 0),
        'intensive',        COALESCE(ls.intensive, 0)
    ) AS "CareLevel",
    JSON_BUILD_OBJECT(
        'evaluated', COALESCE(ls.evaluated, 0),
        'vacant',    COALESCE(ls.vacant, 0),
        'inactive',  COALESCE(ls.inactive, 0)
    ) AS "bedStatus",
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', c.id,
            'role', c.nome,
            'quantity', cuni.quantidade_funcionarios
        )
    ) AS "staff"
FROM public.cargos_unidade cuni
LEFT JOIN cargo c 
    ON c.id = cuni.cargo_id
LEFT JOIN unidades_internacao uni 
    ON uni.id = cuni.unidade_id
LEFT JOIN leitos_status ls
    ON ls.unidade_id = uni.id
WHERE cuni.unidade_id IS NOT NULL
GROUP BY 
    uni.id, uni.nome, uni.descricao,
    ls.bed_count, ls.minimum_care, ls.intermediate_care,
    ls.high_dependency, ls.semi_intensive, ls.intensive,
    ls.evaluated, ls.vacant, ls.inactive
ORDER BY uni.id;

*/