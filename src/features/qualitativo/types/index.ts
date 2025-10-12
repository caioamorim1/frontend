export interface Evaluation {
  id: number;
  title: string;
  evaluator: string;
  date: string;
  status: 'completed' | 'pending' | 'in-progress';
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
export interface EvaluationDTO {
  id?: number;
  title: string;
  evaluator: string;
  date: string;
  status: 'completed' | 'pending' | 'in-progress';
  questionnaire: string;
  questionnaireId: number;
  answers?: Answer[];
  calculateRate: RateItem[];
  rate: number;
  sectorId: string;
  hospitalId: string;
  unidadeType: 'internacao' | 'assistencial';
}

export interface RateItem {
  score: number;
  categoryId: number;
}



export interface Answer {
  questionId: number;
  value: string | number | boolean;
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
  type: 'sim-nao-na' | 'texto' | 'numero' | 'data' | 'multipla-escolha';
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
