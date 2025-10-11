import React, { useState, useEffect } from "react";
import {
  Save,
  X,
  MessageSquare,
  Paperclip,
  Upload,
  FileText,
  Trash2,
} from "lucide-react";
import { Questionnaire, Question, Answer, Evaluation } from "../types";
import { dataRepository } from "../repository/DataRepository";

interface QuestionInputRendererProps {
  question: Question;
  answer: Answer | undefined;
  onAnswerChange: (
    questionId: number,
    value: string | number | boolean
  ) => void;
  onObservationChange: (questionId: number, observation: string) => void;
  onFileUpload: (questionId: number, files: FileList | null) => void;
  onRemoveAttachment: (questionId: number, attachmentIndex: number) => void;
}

const QuestionInputRenderer: React.FC<QuestionInputRendererProps> = ({
  question,
  answer,
  onAnswerChange,
  onObservationChange,
  onFileUpload,
  onRemoveAttachment,
}) => {
  const [showObservation, setShowObservation] = useState(!!answer?.observation);
  const value = answer?.value || "";
  const observation = answer?.observation || "";
  const attachments = answer?.attachments || [];

  switch (question.type) {
    case "sim-nao-na":
      return (
        <div className="space-y-3">
          {/* Botões Sim/Não/N/A */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAnswerChange(question.id, "sim")}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                value === "sim"
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700"
              }`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => onAnswerChange(question.id, "nao")}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                value === "nao"
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700"
              }`}
            >
              Não
            </button>
            <button
              type="button"
              onClick={() => onAnswerChange(question.id, "na")}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                value === "na"
                  ? "bg-yellow-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-yellow-100 hover:text-yellow-700"
              }`}
            >
              N/A
            </button>
          </div>

          {/* Botões de ação */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowObservation(!showObservation)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
              title="Adicionar observação"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Observação</span>
            </button>

            <label className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors duration-200 cursor-pointer">
              <Paperclip className="h-4 w-4" />
              <span>Anexar ({attachments.length}/3)</span>
              <input
                type="file"
                multiple
                onChange={(e) => onFileUpload(question.id, e.target.files)}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={attachments.length >= 3}
              />
            </label>
          </div>

          {/* Campo de observação */}
          {showObservation && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observação
              </label>
              <textarea
                value={observation}
                onChange={(e) =>
                  onObservationChange(question.id, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px]"
                placeholder="Digite sua observação..."
              />
            </div>
          )}

          {/* Lista de anexos */}
          {attachments.length > 0 && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivos Anexados
              </label>
              <div className="space-y-1">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {attachment}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(question.id, index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remover anexo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case "texto":
      return (
        <div className="space-y-3">
          <textarea
            value={value as string}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
            placeholder="Digite sua resposta..."
            required
          />

          {/* Botões de ação para perguntas de texto */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setShowObservation(!showObservation)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200 mr-2"
              title="Adicionar observação"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Observação</span>
            </button>

            <label className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors duration-200 cursor-pointer">
              <Paperclip className="h-4 w-4" />
              <span>Anexar ({attachments.length}/3)</span>
              <input
                type="file"
                multiple
                onChange={(e) => onFileUpload(question.id, e.target.files)}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={attachments.length >= 3}
              />
            </label>
          </div>

          {/* Campo de observação */}
          {showObservation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observação
              </label>
              <textarea
                value={observation}
                onChange={(e) =>
                  onObservationChange(question.id, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px]"
                placeholder="Digite sua observação..."
              />
            </div>
          )}

          {/* Lista de anexos */}
          {attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivos Anexados
              </label>
              <div className="space-y-1">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {attachment}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(question.id, index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remover anexo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case "numero":
      return (
        <div className="space-y-3">
          <input
            type="number"
            value={value as number}
            onChange={(e) =>
              onAnswerChange(question.id, parseFloat(e.target.value) || 0)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite um número..."
            required
          />

          {/* Botões de ação */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowObservation(!showObservation)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
              title="Adicionar observação"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Observação</span>
            </button>

            <label className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors duration-200 cursor-pointer">
              <Paperclip className="h-4 w-4" />
              <span>Anexar ({attachments.length}/3)</span>
              <input
                type="file"
                multiple
                onChange={(e) => onFileUpload(question.id, e.target.files)}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={attachments.length >= 3}
              />
            </label>
          </div>

          {/* Campo de observação */}
          {showObservation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observação
              </label>
              <textarea
                value={observation}
                onChange={(e) =>
                  onObservationChange(question.id, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px]"
                placeholder="Digite sua observação..."
              />
            </div>
          )}

          {/* Lista de anexos */}
          {attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivos Anexados
              </label>
              <div className="space-y-1">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {attachment}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(question.id, index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remover anexo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case "data":
      return (
        <div className="space-y-3">
          <input
            type="date"
            value={value as string}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />

          {/* Botões de ação */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowObservation(!showObservation)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
              title="Adicionar observação"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Observação</span>
            </button>

            <label className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors duration-200 cursor-pointer">
              <Paperclip className="h-4 w-4" />
              <span>Anexar ({attachments.length}/3)</span>
              <input
                type="file"
                multiple
                onChange={(e) => onFileUpload(question.id, e.target.files)}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={attachments.length >= 3}
              />
            </label>
          </div>

          {/* Campo de observação */}
          {showObservation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observação
              </label>
              <textarea
                value={observation}
                onChange={(e) =>
                  onObservationChange(question.id, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px]"
                placeholder="Digite sua observação..."
              />
            </div>
          )}

          {/* Lista de anexos */}
          {attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivos Anexados
              </label>
              <div className="space-y-1">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {attachment}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(question.id, index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remover anexo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    case "multipla-escolha":
      return (
        <div className="space-y-3">
          <select
            value={value as string}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Selecione uma opção</option>
            {question.options?.map((option, index) => (
              <option key={index} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Botões de ação */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowObservation(!showObservation)}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-200"
              title="Adicionar observação"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Observação</span>
            </button>

            <label className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors duration-200 cursor-pointer">
              <Paperclip className="h-4 w-4" />
              <span>Anexar ({attachments.length}/3)</span>
              <input
                type="file"
                multiple
                onChange={(e) => onFileUpload(question.id, e.target.files)}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                disabled={attachments.length >= 3}
              />
            </label>
          </div>

          {/* Campo de observação */}
          {showObservation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observação
              </label>
              <textarea
                value={observation}
                onChange={(e) =>
                  onObservationChange(question.id, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[60px]"
                placeholder="Digite sua observação..."
              />
            </div>
          )}

          {/* Lista de anexos */}
          {attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivos Anexados
              </label>
              <div className="space-y-1">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {attachment}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAttachment(question.id, index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remover anexo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
};

interface EvaluationFormProps {
  onClose: () => void;
  onSave: (evaluationData: any) => void;
  editingEvaluation?: Evaluation | null;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  onClose,
  onSave,
  editingEvaluation,
}) => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<Questionnaire | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    evaluator: "",
    questionnaireId: 0,
  });
  const [answers, setAnswers] = useState<Answer[]>([]);

  useEffect(() => {
    setQuestionnaires(dataRepository.getQuestionnaires());

    // Se estiver editando, carregar os dados da avaliação
    if (editingEvaluation) {
      setFormData({
        title: editingEvaluation.title,
        evaluator: editingEvaluation.evaluator,
        questionnaireId: editingEvaluation.questionnaireId,
      });

      const questionnaire = dataRepository
        .getQuestionnaires()
        .find((q) => q.id === editingEvaluation.questionnaireId);
      if (questionnaire) {
        setSelectedQuestionnaire(questionnaire);
        setAnswers(editingEvaluation.answers || []);
      }
    }
  }, []);

  const getCategoryName = (categoryId: number) => {
    const categories = dataRepository.getCategories();
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Categoria não encontrada";
  };
  const handleQuestionnaireSelect = (questionnaireId: number) => {
    const questionnaire = questionnaires.find((q) => q.id === questionnaireId);
    if (questionnaire) {
      setSelectedQuestionnaire(questionnaire);
      setFormData({ ...formData, questionnaireId });
      // Inicializar respostas vazias
      const initialAnswers: Answer[] = questionnaire.questions.map((q) => ({
        questionId: q.id,
        value: q.type === "sim-nao-na" ? "" : q.type === "numero" ? 0 : "",
        observation: "",
        attachments: [],
      }));
      setAnswers(initialAnswers);
    }
  };

  const handleAnswerChange = (
    questionId: number,
    value: string | number | boolean
  ) => {
    setAnswers((prev) =>
      prev.map((answer) =>
        answer.questionId === questionId ? { ...answer, value } : answer
      )
    );
  };

  const handleObservationChange = (questionId: number, observation: string) => {
    setAnswers((prev) =>
      prev.map((answer) =>
        answer.questionId === questionId ? { ...answer, observation } : answer
      )
    );
  };

  const handleFileUpload = (questionId: number, files: FileList | null) => {
    if (!files) return;

    const currentAttachments =
      answers.find((a) => a.questionId === questionId)?.attachments || [];
    if (currentAttachments.length >= 3) {
      alert("Máximo de 3 arquivos por pergunta");
      return;
    }

    const fileNames = Array.from(files).map((file) => file.name);
    const totalFiles = currentAttachments.length + fileNames.length;

    if (totalFiles > 3) {
      alert(
        `Você pode anexar no máximo 3 arquivos por pergunta. Atualmente há ${currentAttachments.length} arquivo(s) anexado(s).`
      );
      return;
    }

    setAnswers((prev) =>
      prev.map((answer) =>
        answer.questionId === questionId
          ? { ...answer, attachments: [...currentAttachments, ...fileNames] }
          : answer
      )
    );
  };

  const removeAttachment = (questionId: number, attachmentIndex: number) => {
    setAnswers((prev) =>
      prev.map((answer) =>
        answer.questionId === questionId
          ? {
              ...answer,
              attachments: answer.attachments?.filter(
                (_, index) => index !== attachmentIndex
              ),
            }
          : answer
      )
    );
  };

  const handleNext = () => {
    if (
      !formData.title.trim() ||
      !formData.evaluator.trim() ||
      !selectedQuestionnaire
    ) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Validar se todas as perguntas foram respondidas
    const unansweredQuestions = selectedQuestionnaire.questions.filter(
      (question) => {
        const answer = answers.find((a) => a.questionId === question.id);

        if (!answer) return true;

        // Para perguntas sim-nao-na, verificar se foi selecionada uma opção
        if (question.type === "sim-nao-na") {
          return !answer.value || answer.value === "";
        }

        // Para outros tipos, verificar se há valor
        if (question.type === "numero") {
          return (
            answer.value === null ||
            answer.value === undefined ||
            answer.value === ""
          );
        }

        // Para texto, data e múltipla escolha
        return !answer.value || answer.value === "";
      }
    );

    if (unansweredQuestions.length > 0) {
      const questionNumbers = unansweredQuestions
        .map(
          (q) =>
            selectedQuestionnaire.questions.findIndex((sq) => sq.id === q.id) +
            1
        )
        .join(", ");
      alert(
        `Por favor, responda todas as perguntas antes de finalizar.\nPerguntas não respondidas: ${questionNumbers}`
      );
      return;
    }

    const evaluationData = {
      title: formData.title,
      evaluator: formData.evaluator,
      date: new Date().toISOString().split("T")[0],
      status: editingEvaluation
        ? editingEvaluation.status
        : ("completed" as const),
      questionnaire: selectedQuestionnaire!.name,
      questionnaireId: formData.questionnaireId,
      answers,
    };

    if (editingEvaluation) {
      evaluationData.date = editingEvaluation.date; // Manter a data original
    }

    onSave(evaluationData);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {editingEvaluation ? "Editar Avaliação" : "Nova Avaliação"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Informações básicas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Título da Avaliação *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Digite o título da avaliação"
            required
          />
        </div>

        <div>
          <label
            htmlFor="evaluator"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Avaliador *
          </label>
          <input
            type="text"
            id="evaluator"
            value={formData.evaluator}
            onChange={(e) =>
              setFormData({ ...formData, evaluator: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nome do avaliador"
            required
          />
        </div>

        <div>
          <label
            htmlFor="questionnaire"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Questionário *
          </label>
          <select
            id="questionnaire"
            value={formData.questionnaireId}
            onChange={(e) =>
              handleQuestionnaireSelect(parseInt(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!!editingEvaluation}
            required
          >
            <option value={0}>Selecione um questionário</option>
            {questionnaires.map((questionnaire) => (
              <option key={questionnaire.id} value={questionnaire.id}>
                {questionnaire.name} ({questionnaire.questions.length} pergunta
                {questionnaire.questions.length !== 1 ? "s" : ""})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Perguntas */}
      {selectedQuestionnaire && (
        <>
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-900 mb-2">
              Questionário: {selectedQuestionnaire.name}
            </h4>
            <p className="text-sm text-gray-600">
              Responda todas as {selectedQuestionnaire.questions.length}{" "}
              pergunta{selectedQuestionnaire.questions.length !== 1 ? "s" : ""}{" "}
              abaixo:
            </p>
          </div>

          <div className="space-y-6">
            {selectedQuestionnaire?.questions.map((question, index) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Pergunta {index + 1}
                  </label>
                  <p className="text-gray-700 mb-3">{question.text}</p>
                </div>
                <QuestionInputRenderer
                  question={question}
                  answer={answers.find((a) => a.questionId === question.id)}
                  onAnswerChange={handleAnswerChange}
                  onObservationChange={handleObservationChange}
                  onFileUpload={handleFileUpload}
                  onRemoveAttachment={removeAttachment}
                />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
        >
          Cancelar
        </button>
        <button
          onClick={handleNext}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>
            {editingEvaluation ? "Atualizar Avaliação" : "Finalizar Avaliação"}
          </span>
        </button>
      </div>
    </div>
  );
};
