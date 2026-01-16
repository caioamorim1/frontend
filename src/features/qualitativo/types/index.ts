export interface Evaluation {
  id: number;
  title: string;
  evaluator: string;
  date: string;
  status: "completed" | "pending" | "in-progress";
  questionnaire: string;
  questionnaireId: number;
  answers?: Answer[];
  calculateRate: number;
  sectorId: string;
}

export interface RateItem {
  score: number;
  categoryId: number;
}
export interface QuestionScore {
  questionId: number;
  questionWeight: number; // Peso da pergunta
  maxResponseWeight: number; // Peso da maior resposta possível
  selectedResponseWeight: number; // Peso da resposta escolhida
  questionScore: number; // peso pergunta × peso resposta escolhida
  observation?: string;
  attachments?: string[];
}

export interface CategoryScore {
  categoryId: number;
  categoryName: string;
  totalScore: number; // Pontuação obtida da categoria (soma de questionScore)
  maxScore: number; // Pontuação máxima da categoria (soma de questionWeight × maxResponseWeight)
  questions: QuestionScore[];
}

export interface EvaluationDTO {
  id?: number;
  title: string;
  evaluator: string;
  date: string;
  status: "completed" | "pending" | "in-progress";
  questionnaire: string;
  questionnaireId: number;
  sectorId: string;
  hospitalId: string;
  unidadeType: "internacao" | "assistencial";
  categories: CategoryScore[];
}

export interface RateItem {
  score: number;
  categoryId: number;
}

export interface Answer {
  questionId: number;
  responsePoints: number;
  maxResponsePoints: number;
  observation?: string;
  attachments?: string[];
}

export interface Questionnaire {
  id: number;
  name: string;
  categoryId?: number;
  questions: Question[];
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireSelected {
  id: number;
  name: string;
}

export interface QuestionOption {
  label: string;
  weight: number;
}

export interface Question {
  id: number;
  text: string;
  type: "sim-nao-na" | "texto" | "numero" | "data" | "multipla-escolha";
  weight: number;
  categoryId: number;
  options?: QuestionOption[]; // Para múltipla escolha
}

export interface QualitativeCategory {
  id: number;
  name: string;
  meta: number;
}

export interface CreateCategoryDTO {
  name: string;
  meta: number;
}

export interface UpdateCategoryDTO {
  name?: string;
  meta?: number;
}
