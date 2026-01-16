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
import {
  Questionnaire,
  Question,
  Answer,
  Evaluation,
  QualitativeCategory,
  EvaluationDTO,
  CategoryScore,
  QuestionScore,
} from "../types";
import { getListQualitativesCategories, getQuestionarios } from "@/lib/api";
import { useAlert } from "@/contexts/AlertContext";
import { useModal } from "@/contexts/ModalContext";
import { useAuth } from "@/contexts/AuthContext";

// Interface interna para manter value durante edição
interface AnswerInternal {
  questionId: number;
  value: string | number | boolean;
  observation?: string;
  attachments?: string[];
}

interface QuestionInputRendererProps {
  question: Question;
  answer: AnswerInternal | undefined;
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
              onClick={() =>
                onAnswerChange(question.id, question.options[0]?.label)
              }
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                value === question.options[0]?.label
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700"
              }`}
            >
              {question.options[0]?.label || "Sim"}
            </button>
            <button
              type="button"
              onClick={() =>
                onAnswerChange(question.id, question.options[1]?.label)
              }
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                value === question.options[1]?.label
                  ? "bg-red-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700"
              }`}
            >
              {question.options[1]?.label || "Não"}
            </button>
            <button
              type="button"
              onClick={() =>
                onAnswerChange(question.id, question.options[2]?.label)
              }
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                value === question.options[2]?.label
                  ? "bg-yellow-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-yellow-100 hover:text-yellow-700"
              }`}
            >
              {question.options[2]?.label || "N/A"}
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
          {/* {attachments.length > 0 && (
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
          )} */}
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
  onSave: (evaluationData: EvaluationDTO) => void;
  editingEvaluation?: Evaluation | null;
  sectorId: string;
  hospitalId: string;
  unidadeType: "internacao" | "assistencial";
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  onClose,
  onSave,
  editingEvaluation,
  sectorId,
  hospitalId,
  unidadeType,
}) => {
  const { showAlert } = useAlert();
  const { showModal } = useModal();
  const { user } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [categories, setCategories] = useState<QualitativeCategory[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<Questionnaire | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    evaluator: "",
    questionnaireId: 0,
    questionnaire: "",
  });
  const [answers, setAnswers] = useState<AnswerInternal[]>([]);

  const showModalAviso = (title: string, message: string) => {
    showModal({
      type: "info",
      title: title,
      message: message,
    });
  };

  const loadQuestionnaires = async () => {
    getQuestionarios()
      .then(setQuestionnaires)
      .catch((err) => {
        console.error("Falha ao buscar questionários:", err);
        showAlert("destructive", "Erro", "Falha ao buscar questionários.");
      });
    getListQualitativesCategories()
      .then(setCategories)
      .catch((err) => {
        console.error("Falha ao buscar categorias:", err);
        showAlert("destructive", "Erro", "Falha ao buscar categorias.");
      });
  };

  useEffect(() => {
    // Se estiver editando, carregar os dados da avaliação
    if (editingEvaluation) {
      console.log(
        "🔍 [EDIT] Carregando avaliação para edição:",
        editingEvaluation
      );

      setFormData({
        title: editingEvaluation.title,
        evaluator: editingEvaluation.evaluator,
        questionnaireId: editingEvaluation.questionnaireId,
        questionnaire: editingEvaluation.questionnaire,
      });

      const questionnaire = questionnaires.find(
        (q) => q.id === editingEvaluation.questionnaireId
      );

      console.log("📋 [EDIT] Questionário encontrado:", questionnaire);

      if (questionnaire) {
        setSelectedQuestionnaire(questionnaire);

        // Criar um map de respostas salvas a partir de categories
        const savedQuestionsMap = new Map<number, QuestionScore>();

        console.log("🔍 [EDIT] Verificando formato dos dados...");
        console.log("  - categories:", (editingEvaluation as any).categories);
        console.log("  - answers:", editingEvaluation.answers);

        // Verificar se o formato é o novo (answers como array de CategoryScore) ou antigo (answers com questionId)
        if (editingEvaluation.answers && editingEvaluation.answers.length > 0) {
          const firstItem = editingEvaluation.answers[0];

          // Novo formato: answers é array de CategoryScore (tem questions)
          if ((firstItem as any).questions) {
            console.log(
              "✅ [EDIT] Usando formato NOVO (answers como CategoryScore[])"
            );
            (editingEvaluation.answers as any as CategoryScore[]).forEach(
              (category) => {
                console.log(
                  `  - Categoria ${category.categoryId}: ${category.categoryName}`
                );
                category.questions.forEach((question) => {
                  savedQuestionsMap.set(question.questionId, question);
                  console.log(
                    `    - Carregando questão ${question.questionId}:`,
                    question
                  );
                });
              }
            );
          }
          // Formato antigo: answers é array de Answer (tem questionId)
          else if ((firstItem as any).questionId) {
            console.log(
              "⚠️ [EDIT] Usando formato ANTIGO (answers como Answer[])"
            );
            (editingEvaluation.answers as Answer[]).forEach((answer) => {
              savedQuestionsMap.set(answer.questionId, {
                questionId: answer.questionId,
                questionWeight: 0, // Não temos essa info no formato antigo
                maxResponseWeight: answer.maxResponsePoints || 0,
                selectedResponseWeight: 0,
                questionScore: answer.responsePoints || 0,
                observation: answer.observation,
                attachments: answer.attachments,
              });
              console.log(
                `  - Carregando resposta ${answer.questionId}:`,
                answer
              );
            });
          }
        } else if ((editingEvaluation as any).categories) {
          // Formato com campo categories
          console.log("✅ [EDIT] Usando formato NOVO (campo categories)");
          ((editingEvaluation as any).categories as CategoryScore[]).forEach(
            (category) => {
              category.questions.forEach((question) => {
                savedQuestionsMap.set(question.questionId, question);
                console.log(
                  `  - Carregando questão ${question.questionId}:`,
                  question
                );
              });
            }
          );
        }

        console.log(
          "🗺️ [EDIT] Map de questões salvas:",
          Array.from(savedQuestionsMap.entries())
        );

        // Criar AnswerInternal para todas as perguntas do questionário
        const answersInternal: AnswerInternal[] = questionnaire.questions.map(
          (question) => {
            const savedQuestion = savedQuestionsMap.get(question.id);

            if (!savedQuestion) {
              // Pergunta não respondida - inicializar vazio
              console.log(
                `❌ [EDIT] Questão ${question.id} NÃO TEM resposta salva`
              );
              return {
                questionId: question.id,
                value:
                  question.type === "sim-nao-na"
                    ? ""
                    : question.type === "numero"
                    ? 0
                    : "",
                observation: "",
                attachments: [],
              };
            }

            // Converter QuestionScore salvo de volta para AnswerInternal
            let value: string | number | boolean = "";

            console.log(`✅ [EDIT] Convertendo questão ${question.id}:`, {
              type: question.type,
              savedQuestion,
            });

            if (
              question.type === "sim-nao-na" ||
              question.type === "multipla-escolha"
            ) {
              // Encontrar a opção baseada no selectedResponseWeight
              const matchingOption = question.options?.find((opt) => {
                return (
                  Math.abs(opt.weight - savedQuestion.selectedResponseWeight) <
                  0.01
                );
              });
              value = matchingOption?.label || "";
              console.log(`  - Opções disponíveis:`, question.options);
              console.log(
                `  - selectedResponseWeight: ${savedQuestion.selectedResponseWeight}`
              );
              console.log(`  - Opção encontrada:`, matchingOption);
              console.log(`  - Value final:`, value);
            } else if (question.type === "numero") {
              // Converter selectedResponseWeight de volta para nota 0-10
              // selectedResponseWeight está em percentual (0-100)
              if (savedQuestion.selectedResponseWeight > 0) {
                value = (savedQuestion.selectedResponseWeight / 100) * 10;
              } else {
                value = 0;
              }
              console.log(
                `  - selectedResponseWeight: ${savedQuestion.selectedResponseWeight}`
              );
              console.log(`  - Value final (0-10):`, value);
            } else if (question.type === "texto" || question.type === "data") {
              // Para texto e data, não temos como recuperar o valor original
              value = "";
              console.log(`  - Tipo texto/data, valor vazio`);
            }

            const result = {
              questionId: savedQuestion.questionId,
              value,
              observation: savedQuestion.observation,
              attachments: savedQuestion.attachments,
            };

            console.log(`  - AnswerInternal criado:`, result);
            return result;
          }
        );

        console.log("📝 [EDIT] AnswersInternal final:", answersInternal);
        setAnswers(answersInternal);
      }
    }
  }, [questionnaires]);

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Categoria não encontrada";
  };
  const handleQuestionnaireSelect = (questionnaireId: number) => {
    const questionnaire = questionnaires.find((q) => q.id === questionnaireId);
    if (questionnaire) {
      setSelectedQuestionnaire(questionnaire);
      setFormData({ ...formData, questionnaireId });
      // Inicializar respostas vazias
      const initialAnswers: AnswerInternal[] = questionnaire.questions.map(
        (q) => ({
          questionId: q.id,
          value: q.type === "sim-nao-na" ? "" : q.type === "numero" ? 0 : "",
          observation: "",
          attachments: [],
        })
      );
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
      showModalAviso(
        "Limite de anexos atingido",
        "Você já atingiu o limite máximo de 3 anexos para esta pergunta."
      );
      return;
    }

    const fileNames = Array.from(files).map((file) => file.name);
    const totalFiles = currentAttachments.length + fileNames.length;

    if (totalFiles > 3) {
      showModalAviso(
        "Limite de anexos atingido",
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

  const organizeByCategoryWithScores = (
    questionnaire: Questionnaire,
    answersInternal: AnswerInternal[]
  ): CategoryScore[] => {
    // Agrupar perguntas por categoria
    const categoriesMap = new Map<
      number,
      {
        categoryId: number;
        categoryName: string;
        questions: QuestionScore[];
      }
    >();

    questionnaire.questions.forEach((question) => {
      const answerInternal = answersInternal.find(
        (a) => a.questionId === question.id
      );

      // Apenas processar se houver resposta
      if (
        !answerInternal ||
        answerInternal.value === "" ||
        answerInternal.value === null ||
        answerInternal.value === undefined
      ) {
        return;
      }

      // Calcular peso da maior resposta possível
      const maxResponseWeight =
        question.options && question.options.length > 0
          ? Math.max(...question.options.map((o) => o.weight))
          : 100;

      // Calcular peso da resposta escolhida
      let selectedResponseWeight = 0;
      if (
        question.type === "sim-nao-na" ||
        question.type === "multipla-escolha"
      ) {
        const selectedOption = question.options?.find(
          (o) =>
            o.label.toLowerCase() === String(answerInternal.value).toLowerCase()
        );
        selectedResponseWeight = selectedOption?.weight ?? 0;
      } else if (
        question.type === "numero" &&
        typeof answerInternal.value === "number"
      ) {
        // Converter nota 0-10 em percentual 0-100
        selectedResponseWeight = Math.min(
          100,
          Math.max(0, (answerInternal.value / 10) * 100)
        );
      }

      // Calcular pontuação da pergunta
      const questionScore = question.weight * selectedResponseWeight;

      const questionScoreData: QuestionScore = {
        questionId: question.id,
        questionWeight: question.weight,
        maxResponseWeight: maxResponseWeight,
        selectedResponseWeight: selectedResponseWeight,
        questionScore: parseFloat(questionScore.toFixed(2)),
        observation: answerInternal.observation,
        attachments: answerInternal.attachments,
      };

      // Adicionar à categoria correspondente
      if (!categoriesMap.has(question.categoryId)) {
        const category = categories.find((c) => c.id === question.categoryId);
        categoriesMap.set(question.categoryId, {
          categoryId: question.categoryId,
          categoryName: category?.name || `Categoria ${question.categoryId}`,
          questions: [],
        });
      }

      categoriesMap.get(question.categoryId)!.questions.push(questionScoreData);
    });

    // Calcular totais por categoria
    const categoryScores: CategoryScore[] = Array.from(
      categoriesMap.values()
    ).map((cat) => {
      const totalScore = cat.questions.reduce(
        (sum, q) => sum + q.questionScore,
        0
      );
      const maxScore = cat.questions.reduce(
        (sum, q) => sum + q.questionWeight * q.maxResponseWeight,
        0
      );

      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        totalScore: parseFloat(totalScore.toFixed(2)),
        maxScore: parseFloat(maxScore.toFixed(2)),
        questions: cat.questions,
      };
    });

    return categoryScores;
  };

  const convertToAnswerWithPoints = (
    answerInternal: AnswerInternal,
    question: Question
  ): Answer => {
    let responsePoints = 0;
    let maxResponsePoints = 0;

    // Calcular maxResponsePoints (peso máximo da pergunta)
    const maxOptionWeight =
      question.options && question.options.length > 0
        ? Math.max(...question.options.map((o) => o.weight))
        : 100;
    maxResponsePoints = maxOptionWeight * question.weight;

    // Calcular responsePoints baseado na resposta
    if (
      question.type === "sim-nao-na" ||
      question.type === "multipla-escolha"
    ) {
      const selectedOption = question.options?.find(
        (o) =>
          o.label.toLowerCase() === String(answerInternal.value).toLowerCase()
      );
      const optionWeight = selectedOption?.weight ?? 0;
      responsePoints = optionWeight * question.weight;
    } else if (
      question.type === "numero" &&
      typeof answerInternal.value === "number"
    ) {
      // Converter nota 0-10 em percentual 0-100
      const percentual = Math.min(
        100,
        Math.max(0, (answerInternal.value / 10) * 100)
      );
      responsePoints = percentual * question.weight;
    }
    // Tipos "texto" e "data" não contribuem para pontuação

    return {
      questionId: answerInternal.questionId,
      responsePoints: parseFloat(responsePoints.toFixed(2)),
      maxResponsePoints: parseFloat(maxResponsePoints.toFixed(2)),
      observation: answerInternal.observation,
      attachments: answerInternal.attachments,
    };
  };

  const handleNext = () => {
    if (!formData.title.trim() || !selectedQuestionnaire) {
      showAlert(
        "destructive",
        "Informações incompletas",
        "Por favor, preencha o título e selecione um questionário."
      );
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

    // if (unansweredQuestions.length > 0) {
    //   const questionNumbers = unansweredQuestions.map(q =>
    //     selectedQuestionnaire.questions.findIndex(sq => sq.id === q.id) + 1
    //   ).join(', ');
    //   showModalAviso("Perguntas não respondidas", `Por favor, responda todas as perguntas antes de finalizar.\nPerguntas não respondidas: ${questionNumbers}`);
    //   return;
    // }

    // Organizar respostas por categoria com todas as informações de pontuação
    const categoryScores = organizeByCategoryWithScores(
      selectedQuestionnaire!,
      answers
    );

    const evaluationData: EvaluationDTO = {
      title: formData.title,
      evaluator: user?.id || "",
      date: new Date().toISOString().split("T")[0],
      status: unansweredQuestions.length > 0 ? "in-progress" : "completed",
      questionnaire: selectedQuestionnaire!.name,
      questionnaireId: selectedQuestionnaire!.id,
      sectorId: sectorId,
      hospitalId: hospitalId,
      unidadeType: unidadeType,
      categories: categoryScores,
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
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="text-green-800 hover:text-green-600 transition-colors duration-200"
          >
            <Save className="h-5 w-5" />
          </button>
        </div>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Avaliador
          </label>
          <input
            type="text"
            value={
              editingEvaluation ? editingEvaluation.evaluator : user?.nome || ""
            }
            readOnly
            disabled
            className="w-full px-3 py-2 border border-gray-200 bg-gray-100 rounded-lg text-gray-600"
            placeholder="Avaliador"
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
                    {index + 1} - {question.text}
                  </label>
                  <p className="text-gray-700 mb-3">
                    <span className="text-gray-500">
                      {getCategoryName(question.categoryId)}
                    </span>
                  </p>
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
