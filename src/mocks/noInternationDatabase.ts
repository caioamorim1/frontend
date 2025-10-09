interface Staff {
  id: string;
  role: string;
  quantity: number;
}

// Representa uma sub-área ou processo dentro do setor
interface AreaUnit {
  name: string;
  quantity: number;
}

export interface SectorAssistance {
  id: string;
  name: string;
  descr: string;
  costAmount: number;
  siteCount: number; // A soma da quantidade de todas as 'areas'
  areas: AreaUnit[];
  staff: Staff[];
}

// Setor 1: Centro Cirúrgico
const sector1: SectorAssistance = {
  id: "101", // Usando IDs diferentes para não conflitar com os de internação
  name: "Centro Cirúrgico",
  descr:
    "Setor responsável pela realização de procedimentos cirúrgicos programados e de emergência.",
  costAmount: 2500000,
  siteCount: 15, // 5 salas + 3 SRA + 6 SPO + 1 Posto
  areas: [
    { name: "Salas Cirúrgicas", quantity: 5 },
    { name: "Salas de Recuperação Anestésica (SRA)", quantity: 3 },
    { name: "Leitos de Preparo Ortopédico (SPO)", quantity: 6 },
    { name: "Posto de Enfermagem", quantity: 1 },
  ],
  staff: [
    { id: "1", role: "Médico Cirurgião", quantity: 15 },
    { id: "2", role: "Médico Anestesista", quantity: 8 },
    { id: "3", role: "Enfermeiro de Centro Cirúrgico", quantity: 12 },
    { id: "4", role: "Instrumentador Cirúrgico", quantity: 10 },
    { id: "5", role: "Técnico de Enfermagem", quantity: 20 },
  ],
};

// Setor 2: CME (Central de Material e Esterilização)
const sector2: SectorAssistance = {
  id: "102",
  name: "CME (Central de Material e Esterilização)",
  descr:
    "Responsável pelo processamento, limpeza, esterilização e distribuição de todos os materiais médicos.",
  costAmount: 450000,
  siteCount: 4, // 4 áreas de processo
  areas: [
    { name: "Área de Recolhimento e distribuição", quantity: 1 },
    { name: "Área de Separação e Lavagem", quantity: 1 },
    { name: "Área de Empacotamento e Esterelização", quantity: 1 },
    { name: "Área de Armazenagem (estéril)", quantity: 1 },
  ],
  staff: [
    { id: "1", role: "Enfermeiro Supervisor de CME", quantity: 4 },
    { id: "2", role: "Técnico de Enfermagem", quantity: 12 },
    { id: "3", role: "Auxiliar de Limpeza Hospitalar", quantity: 5 },
  ],
};

// Setor 3: Ambulatório
const sector3: SectorAssistance = {
  id: "103",
  name: "Ambulatório",
  descr:
    "Oferece consultas agendadas, exames e pequenos procedimentos que não necessitam de internação.",
  costAmount: 1200000,
  siteCount: 42, // 40 consultórios + 1 acolhimento + 1 proc.
  areas: [
    { name: "Consultórios", quantity: 40 },
    { name: "Área de Acolhimento e Encaminhamento", quantity: 1 },
    { name: "Sala de Pequenos Procedimentos", quantity: 1 },
  ],
  staff: [
    { id: "1", role: "Médico (Diversas Especialidades)", quantity: 35 },
    { id: "2", role: "Enfermeiro", quantity: 20 },
    { id: "3", role: "Técnico de Enfermagem", quantity: 40 },
    { id: "4", role: "Recepcionista", quantity: 10 },
  ],
};

// Setor 4: SADT (Serviços Diagnósticos e Terapêuticos)
const sector4: SectorAssistance = {
  id: "104",
  name: "SADT (Serviços Diagnósticos e Terapêuticos)",
  descr: "Setor de exames de imagem para apoio diagnóstico.",
  costAmount: 3500000,
  siteCount: 5, // 1 Ressonância + 2 USG + 2 Tomografia
  areas: [
    { name: "Equipamento de Ressonância Magnética", quantity: 1 },
    { name: "Sala de Ultrassonografia (USG)", quantity: 2 },
    { name: "Equipamento de Tomografia", quantity: 2 },
  ],
  staff: [
    { id: "1", role: "Médico Radiologista", quantity: 6 },
    { id: "2", role: "Técnico em Radiologia", quantity: 12 },
    { id: "3", role: "Enfermeiro de Apoio", quantity: 5 },
    { id: "4", role: "Técnico de Enfermagem", quantity: 5 },
  ],
};

// Setor 5: Urgência e Emergência
const sector5: SectorAssistance = {
  id: "105",
  name: "Urgência e Emergência",
  descr: "Pronto-atendimento 24h para casos de urgência e emergência.",
  costAmount: 2200000,
  siteCount: 20, // Soma de todas as salas e leitos de observação
  areas: [
    { name: "Posto de Classificação de Riscos", quantity: 1 },
    { name: "Sala de Estabilização (Sala Vermelha)", quantity: 2 },
    { name: "Leitos de Observação Masculina", quantity: 6 },
    { name: "Leitos de Observação Feminina", quantity: 6 },
    { name: "Leitos de Observação Pediátrica", quantity: 3 },
    { name: "Sala de Pequenos Procedimentos", quantity: 2 },
  ],
  staff: [
    { id: "1", role: "Médico Emergencista", quantity: 15 },
    { id: "2", role: "Médico Ortopedista (Plantão)", quantity: 4 },
    { id: "3", role: "Enfermeiro", quantity: 25 },
    { id: "4", role: "Técnico de Enfermagem", quantity: 45 },
    { id: "5", role: "Maqueiro", quantity: 8 },
  ],
};

// Array com todos os novos setores
export const allAssistanceSectors: SectorAssistance[] = [
  sector1,
  sector2,
  sector3,
  sector4,
  sector5,
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
LEFT JOIN unidades_nao_internacao uni 
    ON uni.id = cuni.unidade_nao_internacao_id
WHERE cuni.unidade_nao_internacao_id IS NOT NULL
GROUP BY 
    uni.id, uni.nome, uni.descricao
ORDER BY uni.id;
*/
