// Mock comparative data for development fallback
export const hospitalComparativeMock = {
  hospitalId: "ffc9f830-a0fb-4af7-af7b-385892f4ddd4",
  atual: {
    id: "ffc9f830-a0fb-4af7-af7b-385892f4ddd4",
    name: "Hospital Geral de Itaquera",
    internation: [
      {
        id: "afb91058-e2f8-4d54-93f8-815d674d9387",
        name: "Enfermaria Cirúrgica",
        descr: "Enfermaria de Cirurgia Geral",
        costAmount: "206125.00",
        bedCount: 0,
        careLevel: {
          minimumCare: 0,
          intermediateCare: 0,
          highDependency: 0,
          semiIntensive: 0,
          intensive: 0,
        },
        bedStatus: { evaluated: 0, vacant: 0, inactive: 0 },
        staff: [
          {
            id: "498dad5e-8550-45eb-909e-5bd05dac8f66",
            role: "Farmacêutico",
            quantity: 2,
          },
          {
            id: "a2558ce9-6171-4815-b046-3f151e0b050b",
            role: "Auxiliar de Enfermagem",
            quantity: 6,
          },
          {
            id: "3fd6ce54-b2fe-41c3-9d43-83a7db72d8f8",
            role: "Fisioterapeuta",
            quantity: 2,
          },
          {
            id: "0b15530b-d418-4929-bab4-2d570101d019",
            role: "Médico Plantonista",
            quantity: 4,
          },
          {
            id: "b51ac6fc-e6bf-48db-ae51-e31d6116c873",
            role: "Técnico de Enfermagem",
            quantity: 8,
          },
          {
            id: "cd11e4aa-8d0b-4007-815d-c4b3674e1e83",
            role: "Enfermeiro",
            quantity: 5,
          },
        ],
      },
      {
        id: "cb39a261-bad6-4236-8ba5-c6c2d7f7014e",
        name: "Enfermaria Clínica",
        descr: "Enfermaria de Clínica Médica",
        costAmount: "206125.00",
        bedCount: 0,
        careLevel: {
          minimumCare: 0,
          intermediateCare: 0,
          highDependency: 0,
          semiIntensive: 0,
          intensive: 0,
        },
        bedStatus: { evaluated: 0, vacant: 0, inactive: 0 },
        staff: [
          {
            id: "498dad5e-8550-45eb-909e-5bd05dac8f66",
            role: "Farmacêutico",
            quantity: 2,
          },
          {
            id: "cd11e4aa-8d0b-4007-815d-c4b3674e1e83",
            role: "Enfermeiro",
            quantity: 5,
          },
          {
            id: "b51ac6fc-e6bf-48db-ae51-e31d6116c873",
            role: "Técnico de Enfermagem",
            quantity: 8,
          },
          {
            id: "0b15530b-d418-4929-bab4-2d570101d019",
            role: "Médico Plantonista",
            quantity: 4,
          },
          {
            id: "3fd6ce54-b2fe-41c3-9d43-83a7db72d8f8",
            role: "Fisioterapeuta",
            quantity: 2,
          },
          {
            id: "a2558ce9-6171-4815-b046-3f151e0b050b",
            role: "Auxiliar de Enfermagem",
            quantity: 6,
          },
        ],
      },
      // truncating for brevity; component only needs some sample sectors for display
    ],
    assistance: [
      {
        id: "15c43ed4-5de2-4419-bd1e-ad4b6b25285d",
        name: "Ambulatório Geral",
        descr: "Ambulatório de consultas gerais",
        costAmount: "75340.00",
        staff: [
          {
            id: "b51ac6fc-e6bf-48db-ae51-e31d6116c873",
            role: "Técnico de Enfermagem",
            quantity: 5,
          },
          {
            id: "cd11e4aa-8d0b-4007-815d-c4b3674e1e83",
            role: "Enfermeiro",
            quantity: 1,
          },
        ],
      },
    ],
  },
  projetado: {
    id: "ffc9f830-a0fb-4af7-af7b-385892f4ddd4",
    name: "Hospital Geral de Itaquera",
    internation: [
      {
        id: "hospital-ffc9f830-a0fb-4af7-af7b-385892f4ddd4|Enfermaria Cirúrgica",
        name: "Enfermaria Cirúrgica",
        entityName: "Hospital Geral de Itaquera",
        costAmount: "206125.00",
        projectedCostAmount: "206071.00",
        staff: [
          { role: "Auxiliar de Enfermagem", quantity: 6 },
          { role: "Enfermeiro", quantity: 5 },
        ],
        projectedStaff: [
          { role: "Enfermeiro", quantity: 101 },
          { role: "Técnico", quantity: 172 },
        ],
        bedCount: 0,
      },
    ],
    assistance: [
      {
        id: "hospital-ffc9f830-a0fb-4af7-af7b-385892f4ddd4|Ambulatório Geral",
        name: "Ambulatório Geral",
        entityName: "Hospital Geral de Itaquera",
        costAmount: "75340.00",
        projectedCostAmount: "68956.00",
        staff: [
          { role: "Auxiliar de Enfermagem", quantity: 2 },
          { role: "Enfermeiro", quantity: 1 },
        ],
        projectedStaff: [
          { role: "Enfermeiro", quantity: 1 },
          { role: "Técnico", quantity: 5 },
        ],
      },
    ],
  },
};
