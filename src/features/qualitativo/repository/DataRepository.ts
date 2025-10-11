import { getListQualitativesCategories } from "@/lib/api";
import { Evaluation, Questionnaire, QualitativeCategory } from "../types";

class DataRepository {
  private evaluations: Evaluation[] = [
    {
      id: 1,
      title: "Avaliação Trimestral - João Silva",
      evaluator: "Maria Santos",
      date: "2025-01-15",
      status: "completed",
      questionnaire: "EQUIPE MÉDICA",
      questionnaireId: 1,
      answers: [],
    },
    {
      id: 2,
      title: "Avaliação de Desempenho - Ana Costa",
      evaluator: "Pedro Oliveira",
      date: "2025-01-14",
      status: "in-progress",
      questionnaire: "GESTÃO DE PESSOAS",
      questionnaireId: 2,
      answers: [],
    },
    {
      id: 3,
      title: "Avaliação Mensal - Carlos Pereira",
      evaluator: "Lucia Fernandes",
      date: "2025-01-13",
      status: "pending",
      questionnaire: "ATIVIDADES DE SUPORTE",
      questionnaireId: 3,
      answers: [],
    },
    {
      id: 4,
      title: "Avaliação de Processo - Sara Lima",
      evaluator: "Roberto Silva",
      date: "2025-01-12",
      status: "completed",
      questionnaire: "PROCESSOS E ROTINAS",
      questionnaireId: 4,
      answers: [],
    },
  ];

  private questionnaires: Questionnaire[] = [
    {
      id: 1,
      name: "EQUIPE MÉDICA",
      created_at: "2025-01-10",
      updated_at: "2025-01-10",
      questions: [
        {
          id: 1,
          text: "O profissional demonstra conhecimento técnico adequado?",
          type: "sim-nao-na",
          weight: 1,
          categoryId: 1,
          options: [],
        },
        {
          id: 2,
          text: "Observações gerais sobre o atendimento",
          type: "texto",
          weight: 1,
          categoryId: 1,
          options: [],
        },
      ],
    },
    {
      id: 2,
      name: "ATIVIDADES DE SUPORTE",
      created_at: "2025-01-11",
      updated_at: "2025-01-12",
      questions: [
        {
          id: 3,
          text: "As atividades são executadas no prazo?",
          type: "sim-nao-na",
          weight: 2,
          categoryId: 2,
          options: [],
        },
        {
          id: 4,
          text: "Comentários sobre o suporte",
          type: "texto",
          weight: 1,
          categoryId: 2,
          options: [],
        },
        {
          id: 5,
          text: "Número de chamados resolvidos",
          type: "numero",
          weight: 3,
          categoryId: 2,
          options: [],
        },
        {
          id: 6,
          text: "Qualidade do atendimento",
          type: "multipla-escolha",
          options: [
            { label: "Ruim", weight: 25 },
            { label: "Regular", weight: 50 },
            { label: "Bom", weight: 75 },
            { label: "Excelente", weight: 100 },
          ],
          weight: 2,
          categoryId: 2,
        },
      ],
    },
    {
      id: 3,
      name: "GESTÃO DE PESSOAS",
      created_at: "2025-01-08",
      updated_at: "2025-01-13",
      questions: [
        {
          id: 7,
          text: "O colaborador demonstra liderança?",
          type: "sim-nao-na",
          weight: 3,
          categoryId: 3,
          options: [],
        },
        {
          id: 8,
          text: "Quantos anos de experiência possui?",
          type: "numero",
          weight: 1,
          categoryId: 3,
          options: [],
        },
        {
          id: 9,
          text: "Data da última capacitação",
          type: "data",
          weight: 1,
          categoryId: 3,
          options: [],
        },
        {
          id: 10,
          text: "Nível de satisfação",
          type: "multipla-escolha",
          options: [
            { label: "Muito Baixo", weight: 20 },
            { label: "Baixo", weight: 40 },
            { label: "Médio", weight: 60 },
            { label: "Alto", weight: 80 },
            { label: "Muito Alto", weight: 100 },
          ],
          weight: 2,
          categoryId: 3,
        },
      ],
    },
    {
      id: 4,
      name: "INTERAÇÃO DE PROCESSOS",
      created_at: "2025-01-05",
      updated_at: "2025-01-14",
      questions: [
        {
          id: 11,
          text: "A comunicação entre setores é eficaz?",
          type: "sim-nao-na",
          weight: 3,
          categoryId: 4,
          options: [],
        },
        {
          id: 12,
          text: "Tempo médio de resposta (em horas)",
          type: "numero",
          weight: 2,
          categoryId: 4,
          options: [],
        },
        {
          id: 13,
          text: "Data do último alinhamento",
          type: "data",
          weight: 1,
          categoryId: 4,
          options: [],
        },
        {
          id: 14,
          text: "Nível de integração",
          type: "multipla-escolha",
          options: [
            { label: "Baixo", weight: 33 },
            { label: "Médio", weight: 66 },
            { label: "Alto", weight: 100 },
          ],
          weight: 3,
          categoryId: 4,
        },
        {
          id: 15,
          text: "Principais desafios encontrados",
          type: "texto",
          weight: 1,
          categoryId: 4,
          options: [],
        },
        {
          id: 16,
          text: "Frequência de reuniões",
          type: "multipla-escolha",
          options: [
            { label: "Semanal", weight: 100 },
            { label: "Quinzenal", weight: 75 },
            { label: "Mensal", weight: 50 },
            { label: "Trimestral", weight: 25 },
          ],
          weight: 1,
          categoryId: 4,
        },
        {
          id: 17,
          text: "Comentários adicionais",
          type: "texto",
          weight: 1,
          categoryId: 4,
          options: [],
        },
      ],
    },
    {
      id: 5,
      name: "GESTÃO DE ENFERMAGEM",
      created_at: "2025-01-07",
      updated_at: "2025-01-07",
      questions: [
        {
          id: 18,
          text: "O cuidado prestado é adequado?",
          type: "sim-nao-na",
          weight: 3,
          categoryId: 5,
          options: [],
        },
        {
          id: 19,
          text: "Observações sobre os cuidados",
          type: "texto",
          weight: 1,
          categoryId: 5,
          options: [],
        },
      ],
    },
    {
      id: 6,
      name: "PROCESSOS E ROTINAS",
      created_at: "2025-01-09",
      updated_at: "2025-01-15",
      questions: [
        {
          id: 20,
          text: "Os processos estão bem documentados?",
          type: "sim-nao-na",
          weight: 2,
          categoryId: 6,
          options: [],
        },
        {
          id: 21,
          text: "Sugestões de melhoria",
          type: "texto",
          weight: 1,
          categoryId: 6,
          options: [],
        },
        {
          id: 22,
          text: "Data da última revisão do processo",
          type: "data",
          weight: 1,
          categoryId: 6,
          options: [],
        },
      ],
    },
  ];

  private categories: QualitativeCategory[] = [
    { id: 1, name: "EQUIPE MÉDICA", meta: 85 },
    { id: 2, name: "ATIVIDADES DE SUPORTE", meta: 92 },
    { id: 3, name: "GESTÃO DE PESSOAS", meta: 78 },
    { id: 4, name: "INTERAÇÃO DE PROCESSOS", meta: 88 },
    { id: 5, name: "GESTÃO DE ENFERMAGEM", meta: 90 },
    { id: 6, name: "PROCESSOS E ROTINAS", meta: 82 },
  ];

  private nextEvaluationId = 5;
  private nextQuestionnaireId = 7;
  private nextCategoryId = 7;

  // Evaluations
  getEvaluations(): Evaluation[] {
    return [...this.evaluations];
  }

  addEvaluation(evaluation: Omit<Evaluation, "id">): Evaluation {
    const newEvaluation = { ...evaluation, id: this.nextEvaluationId++ };
    this.evaluations.push(newEvaluation);
    return newEvaluation;
  }

  updateEvaluation(
    id: number,
    evaluation: Partial<Evaluation>
  ): Evaluation | null {
    const index = this.evaluations.findIndex((e) => e.id === id);
    if (index === -1) return null;

    this.evaluations[index] = { ...this.evaluations[index], ...evaluation };
    return this.evaluations[index];
  }

  deleteEvaluation(id: number): boolean {
    const index = this.evaluations.findIndex((e) => e.id === id);
    if (index === -1) return false;

    this.evaluations.splice(index, 1);
    return true;
  }

  // Questionnaires
  getQuestionnaires(): Questionnaire[] {
    return [...this.questionnaires];
  }

  addQuestionnaire(questionnaire: Omit<Questionnaire, "id">): Questionnaire {
    const now = new Date().toISOString().split("T")[0];
    const newQuestionnaire = {
      ...questionnaire,
      id: this.nextQuestionnaireId++,
      createdAt: now,
      updatedAt: now,
    };
    this.questionnaires.push(newQuestionnaire);
    return newQuestionnaire;
  }

  updateQuestionnaire(
    id: number,
    questionnaire: Partial<Questionnaire>
  ): Questionnaire | null {
    const index = this.questionnaires.findIndex((q) => q.id === id);
    if (index === -1) return null;

    const now = new Date().toISOString().split("T")[0];
    this.questionnaires[index] = {
      ...this.questionnaires[index],
      ...questionnaire,
      updated_at: now,
    };
    return this.questionnaires[index];
  }

  deleteQuestionnaire(id: number): boolean {
    const index = this.questionnaires.findIndex((q) => q.id === id);
    if (index === -1) return false;

    this.questionnaires.splice(index, 1);
    return true;
  }

  // Categories
  getCategories(): QualitativeCategory[] {
    return [...this.categories];
  }

  addCategory(category: Omit<QualitativeCategory, "id">): QualitativeCategory {
    const newCategory = { ...category, id: this.nextCategoryId++ };
    this.categories.push(newCategory);
    return newCategory;
  }

  updateCategory(
    id: number,
    category: Partial<QualitativeCategory>
  ): QualitativeCategory | null {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) return null;

    this.categories[index] = { ...this.categories[index], ...category };
    return this.categories[index];
  }

  deleteCategory(id: number): boolean {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) return false;

    this.categories.splice(index, 1);
    return true;
  }

  getCategoryById(id: number): QualitativeCategory | null {
    return this.categories.find((c) => c.id === id) || null;
  }
}

export const dataRepository = new DataRepository();
