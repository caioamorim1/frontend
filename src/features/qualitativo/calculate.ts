import { Answer, Question } from "./types";

/**
 * @deprecated Este arquivo não é mais utilizado.
 * A lógica de cálculo foi movida para EvaluationForm.tsx (função organizeByCategoryWithScores)
 * Mantido apenas para evitar quebrar imports antigos, mas pode ser removido.
 */

export function calculateQuestionScoreByCategory(
  questions: Question[],
  answers: Answer[]
): {
  categories: { categoryId: number; score: number }[];
  totalRate: number;
} {
  // Função deprecated - retorna valores vazios
  console.warn(
    "calculateQuestionScoreByCategory is deprecated. Use organizeByCategoryWithScores from EvaluationForm instead."
  );
  return { categories: [], totalRate: 0 };
}
