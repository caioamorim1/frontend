import { Answer, Question } from "./types";



export function calculateQuestionScore(questions: Question[], answers: Answer[]): number {
    if (!answers || answers.length === 0) return 0;

    let totalScore = 0;

    answers.forEach((ans) => {
        if (ans.value === null || ans.value === undefined) return;

        // 🔍 Encontrar a pergunta correspondente
        const question = questions.find((q) => q.id === ans.questionId);
        if (!question) return;

        // 🔍 Encontrar o peso da opção escolhida (para múltipla escolha ou sim/não)
        const selectedOption = question.options?.find(
            (o) => o.label.toLowerCase() === String(ans.value).toLowerCase()
        );

        // Se for "sim-nao-na" ou "multipla-escolha"
        let optionWeight = selectedOption?.weight ?? 0;

        // Se for tipo número — converte para percentual (ex: nota de 0–10 vira 0–100)
        if (question.type === 'numero' && typeof ans.value === 'number') {
            optionWeight = Math.min(100, Math.max(0, (ans.value / 10) * 100));
        }

        // Tipos texto ou data não entram no cálculo
        if (['texto', 'data'].includes(question.type)) return;

        // 💯 Cálculo ponderado
        const weightedScore = optionWeight * question.weight;
        totalScore += weightedScore;

        console.log(
            `Questão ${question.id}: opção "${ans.value}" => pesoOpção=${optionWeight}, pesoQuestão=${question.weight}, score=${weightedScore}`
        );
    });

    console.log('✅ Total calculado:', totalScore);
    return totalScore;
}
