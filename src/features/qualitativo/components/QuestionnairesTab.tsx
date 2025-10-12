import React from "react";
import { Minus, Save, Edit2, Trash2 } from "lucide-react";

interface Option {
  label: string;
  weight: number;
}

interface Question {
  id?: number;
  type: string;
  options?: Option[];
}

interface Category {
  id: number;
  name: string;
}

interface Questionnaire {
  id: number;
  name: string;
  questions: Question[];
  created_at: string;
  updated_at: string;
}

interface Props {
  categories?: Category[];
  questionnaires?: Questionnaire[];
  categoryQuestions?: Record<number, Question[]>;
  isFormOpen?: boolean;
  editingQuestionnaire?: boolean;
  handleEdit?: (q: Questionnaire) => void;
  handleDelete?: (id: number) => void;
  addOptionToQuestion?: (categoryId: number, questionIndex: number) => void;
  updateQuestionOption?: (
    categoryId: number,
    questionIndex: number,
    optionIndex: number,
    updated: Partial<Option>
  ) => void;
  removeQuestionOption?: (
    categoryId: number,
    questionIndex: number,
    optionIndex: number
  ) => void;
  resetForm?: () => void;
}

export const QuestionnairesTab: React.FC<Props> = ({
  categories = [],
  questionnaires = [],
  categoryQuestions = {},
  isFormOpen = false,
  editingQuestionnaire = false,
  handleEdit = () => {},
  handleDelete = () => {},
  addOptionToQuestion = () => {},
  updateQuestionOption = () => {},
  removeQuestionOption = () => {},
  resetForm = () => {},
}) => {
  return (
    <div className="space-y-6">
      {/* Formulário de Questionário */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form>
            <div className="space-y-6">
              {/* Lista de Categorias */}
              <div className="space-y-8">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-gray-50 rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {category.name}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {(categoryQuestions[category.id] || []).map(
                        (question, questionIndex) => (
                          <div
                            key={questionIndex}
                            className="bg-white p-4 rounded-lg border border-gray-200"
                          >
                            {/* Opções de Resposta */}
                            {["multipla-escolha", "sim-nao-na"].includes(
                              question.type
                            ) && (
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Opções de Resposta
                                  </label>
                                  {question.type === "multipla-escolha" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addOptionToQuestion(
                                          category.id,
                                          questionIndex
                                        )
                                      }
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      + Adicionar Opção
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  {question.options?.map(
                                    (option, optionIndex) => (
                                      <div
                                        key={optionIndex}
                                        className="flex items-center space-x-2"
                                      >
                                        <input
                                          type="text"
                                          value={option.label}
                                          onChange={(e) =>
                                            updateQuestionOption(
                                              category.id,
                                              questionIndex,
                                              optionIndex,
                                              { label: e.target.value }
                                            )
                                          }
                                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder={`Opção ${
                                            optionIndex + 1
                                          }`}
                                          required
                                          disabled={
                                            question.type === "sim-nao-na"
                                          } // Desabilita edição para Sim/Não
                                        />

                                        <input
                                          type="number"
                                          min={0}
                                          max={100}
                                          value={option.weight}
                                          onChange={(e) =>
                                            updateQuestionOption(
                                              category.id,
                                              questionIndex,
                                              optionIndex,
                                              {
                                                weight: parseFloat(
                                                  e.target.value
                                                ),
                                              }
                                            )
                                          }
                                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="Pontos"
                                          required
                                        />

                                        {question.type ===
                                          "multipla-escolha" && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              removeQuestionOption(
                                                category.id,
                                                questionIndex,
                                                optionIndex
                                              )
                                            }
                                            className="text-red-600 hover:text-red-800 p-2"
                                            title="Remover Opção"
                                          >
                                            <Minus className="h-4 w-4" />
                                          </button>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}

                      {(categoryQuestions[category.id] || []).length === 0 && (
                        <div className="text-center py-4 text-gray-500 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm">
                            Nenhuma pergunta adicionada nesta categoria.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma categoria encontrada.</p>
                  <p className="text-sm">
                    Crie categorias primeiro na aba "Categorias Qualitativas".
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingQuestionnaire ? "Atualizar" : "Salvar"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabela de Questionários */}
      {!isFormOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome do Questionário
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nº de Perguntas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data de Criação
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Atualização
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questionnaires.map((questionnaire) => (
                  <tr
                    key={questionnaire.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {questionnaire.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {questionnaire.questions.length} pergunta
                        {questionnaire.questions.length !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-600">
                        {new Date(questionnaire.created_at).toLocaleDateString(
                          "pt-BR"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-600">
                        {new Date(questionnaire.updated_at).toLocaleDateString(
                          "pt-BR"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(questionnaire)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Editar questionário"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(questionnaire.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Excluir questionário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {questionnaires.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">
                Nenhum questionário encontrado
              </div>
              <div className="text-gray-400 text-sm">
                Clique em "Novo Questionário" para começar
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
