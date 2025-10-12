import { Answer, Question } from "./types";



export function calculateQuestionScoreByCategory(
    questions: Question[],
    answers: Answer[]
): {
    categories: { categoryId: number; score: number }[];
    totalRate: number;
} {
    if (!answers || answers.length === 0) {
        return { categories: [], totalRate: 0 };
    }

    // Mapa de categorias: categoryId -> { score acumulado, máximo possível }
    const categoryMap: Record<number, { score: number; possible: number }> = {};

    for (const ans of answers) {
        if (ans.value === null || ans.value === undefined) continue;

        const question = questions.find((q) => q.id === ans.questionId);
        if (!question || !question.categoryId) continue;

        const categoryId = question.categoryId;

        // encontra a opção escolhida
        const selectedOption = question.options?.find(
            (o) => o.label.toLowerCase() === String(ans.value).toLowerCase()
        );

        let optionWeight = selectedOption?.weight ?? 0;

        // se for tipo número, converte nota 0–10 em percentual 0–100
        if (question.type === "numero" && typeof ans.value === "number") {
            optionWeight = Math.min(100, Math.max(0, (ans.value / 10) * 100));
        }

        // ignora campos texto/data
        if (["texto", "data"].includes(question.type)) continue;

        const weightedScore = optionWeight * question.weight;
        const weightedPossible = 100 * question.weight;

        // inicializa categoria se não existir
        if (!categoryMap[categoryId]) {
            categoryMap[categoryId] = { score: 0, possible: 0 };
        }

        categoryMap[categoryId].score += weightedScore;
        categoryMap[categoryId].possible += weightedPossible;
    }

    // transforma em array e calcula % por categoria
    const categories = Object.entries(categoryMap).map(([categoryId, { score, possible }]) => {
        const percent = possible > 0 ? Math.min(100, (score / possible) * 100) : 0;
        return {
            categoryId: Number(categoryId),
            score: parseFloat(percent.toFixed(2))
        };
    });

    // cálculo do total geral (ponderado pelos pesos das categorias)
    const totalWeightedScore = Object.values(categoryMap).reduce((acc, c) => acc + c.score, 0);
    const totalWeightedPossible = Object.values(categoryMap).reduce((acc, c) => acc + c.possible, 0);
    const totalRate =
        totalWeightedPossible > 0
            ? Math.min(100, (totalWeightedScore / totalWeightedPossible) * 100)
            : 0;

    return {
        categories,
        totalRate: parseFloat(totalRate.toFixed(2))
    };
}
