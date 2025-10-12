import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Minus, Edit2 } from 'lucide-react';
import { Questionnaire, Question, QualitativeCategory, QuestionOption } from '../types';
import { createQuestionario, deleteQuestionario, getListQualitativesCategories, getQuestionarios, updateQuestionario } from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';
import { useModal } from '@/contexts/ModalContext';

export const QuestionnairesTab: React.FC = () => {
  const { showAlert } = useAlert();
  const { showModal } = useModal();

  // --- STATES ---
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [categories, setCategories] = useState<QualitativeCategory[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] = useState<Questionnaire | null>(null);

  // Estado para o nome do questionário
  const [formName, setFormName] = useState("");

  // Estado para as perguntas, organizadas por ID de categoria
  const [categoryQuestions, setCategoryQuestions] = useState<{ [key: number]: Question[] }>({});

  // --- EFFECTS ---
  useEffect(() => {
    loadData();
  }, []);

  // --- DATA LOADING ---
  const loadData = async () => {
    try {
      const [questionnairesResult, categoriesResult] = await Promise.all([
        getQuestionarios(),
        getListQualitativesCategories(),
      ]);
      setQuestionnaires(questionnairesResult);
      setCategories(categoriesResult);
    } catch (error) {
      console.error("Failed to load data:", error);
      showAlert("destructive", "Erro", "Não foi possível carregar os dados necessários.");
    }
  };

  // --- CONSTANTS ---
  const questionTypes = [
    { value: 'sim-nao-na', label: 'Sim / Não / N/A' },
    // { value: 'multipla-escolha', label: 'Múltipla Escolha' }
  ];

  // --- FORM HANDLERS ---
  const resetForm = () => {
    setFormName("");
    setCategoryQuestions({});
    setEditingQuestionnaire(null);
    setIsFormOpen(false);
  };

  const handleEdit = (questionnaire: Questionnaire) => {
    setEditingQuestionnaire(questionnaire);
    setFormName(questionnaire.name);

    // Agrupa as perguntas por categoryId para popular o formulário de edição
    const groupedByCategory = questionnaire.questions.reduce((acc, question) => {
      const { categoryId } = question;
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      // Usando structuredClone para garantir uma cópia profunda e evitar mutações de estado
      acc[categoryId].push(structuredClone(question));
      return acc;
    }, {} as Record<number, Question[]>);

    setCategoryQuestions(groupedByCategory);
    setIsFormOpen(true);
  };

  // --- QUESTION & OPTION HANDLERS ---
  const addQuestionToCategory = (categoryId: number) => {
    const newQuestion: Question = {
      id: Date.now(), // ID temporário para o frontend
      text: "",
      type: "sim-nao-na",
      weight: 1,
      options: [
        { label: 'Sim', weight: 100 },
        { label: 'Não', weight: 0 },
        { label: 'Não se aplica', weight: 0 }
      ],
      categoryId
    };
    setCategoryQuestions((prev) => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), newQuestion],
    }));
  };

  const updateQuestionInCategory = (
    categoryId: number,
    questionIndex: number,
    field: keyof Question,
    value: any
  ) => {
    setCategoryQuestions((prev) => {
      const updatedCategoryQs = [...(prev[categoryId] || [])];
      const questionToUpdate = { ...updatedCategoryQs[questionIndex], [field]: value };

      // Ajusta automaticamente as opções padrão ao mudar o tipo da pergunta
      if (field === 'type') {
        if (value === 'sim-nao-na') {
          questionToUpdate.options = [
            { label: 'Sim', weight: 100 },
            { label: 'Não', weight: 0 },
            { label: 'Não se aplica', weight: 0 }
          ];
        } else if (value === 'multipla-escolha') {
          questionToUpdate.options = [{ label: '', weight: 100 }];
        } else {
          questionToUpdate.options = [];
        }
      }

      updatedCategoryQs[questionIndex] = questionToUpdate;
      return { ...prev, [categoryId]: updatedCategoryQs };
    });
  };



  const removeQuestionFromCategory = (categoryId: number, questionIndex: number) => {
    setCategoryQuestions((prev) => ({
      ...prev,
      [categoryId]: (prev[categoryId] || []).filter((_, i) => i !== questionIndex),
    }));
  };

  const addOptionToQuestion = (categoryId: number, questionIndex: number) => {
    setCategoryQuestions((prev) => {
      const updatedCategoryQs = [...(prev[categoryId] || [])];
      const question = updatedCategoryQs[questionIndex];
      if (!question.options) {
        question.options = [];
      }
      question.options.push({ label: '', weight: 100 });
      return { ...prev, [categoryId]: updatedCategoryQs };
    });
  };

  const updateQuestionOption = (categoryId: number, questionIndex: number, optionIndex: number, value: Partial<QuestionOption>) => {
    setCategoryQuestions(prev => {
      const updatedCategoryQs = [...(prev[categoryId] || [])];
      const question = updatedCategoryQs[questionIndex];
      if (question.options) {
        question.options[optionIndex] = { ...question.options[optionIndex], ...value };
      }
      return { ...prev, [categoryId]: updatedCategoryQs };
    });
  };

  const removeQuestionOption = (categoryId: number, questionIndex: number, optionIndex: number) => {
    setCategoryQuestions((prev) => {
      const updatedCategoryQs = [...(prev[categoryId] || [])];
      updatedCategoryQs[questionIndex].options?.splice(optionIndex, 1);
      return { ...prev, [categoryId]: updatedCategoryQs };
    });
  };

  // --- SUBMIT & DELETE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showModal({ type: "info", title: "Atenção", message: "O nome base do questionário é obrigatório." });
      return;
    }

    const allQuestions = Object.values(categoryQuestions).flat();

    if (allQuestions.length === 0) {
      showModal({ type: "info", title: "Atenção", message: "O questionário precisa ter pelo menos uma pergunta." });
      return;
    }

    const hasInvalidQuestion = allQuestions.some(q => !q.text.trim() || !q.weight || q.weight < 1);
    if (hasInvalidQuestion) {
      showModal({ type: "info", title: "Atenção", message: "Por favor, preencha o texto e o peso (maior que zero) de todas as perguntas." });
      return;
    }

    const hasInvalidOption = allQuestions.some(q =>
      q.type === 'multipla-escolha' &&
      (!q.options || q.options.length === 0 || q.options.some(opt => !opt.label.trim()))
    );
    if (hasInvalidOption) {
      showModal({ type: "info", title: "Atenção", message: "Por favor, preencha o texto de todas as opções das perguntas de múltipla escolha." });
      return;
    }

    const questionnaireData = {
      name: formName,
      questions: allQuestions,
    };

    try {
      if (editingQuestionnaire) {
        await updateQuestionario(editingQuestionnaire.id, questionnaireData);
        showAlert("success", "Sucesso", "Questionário atualizado com sucesso.");
      } else {
        await createQuestionario(questionnaireData);
        showAlert("success", "Sucesso", "Questionário criado com sucesso.");
      }
      resetForm();
      loadData();
    } catch (err) {
      console.error("Falha ao salvar questionário:", err);
      showAlert("destructive", "Erro", `Falha ao ${editingQuestionnaire ? 'atualizar' : 'criar'} questionário.`);
    }
  };

  const handleDelete = (id: number) => {
    showModal({
      type: "confirm",
      title: "Excluir registro?",
      message: "Tem certeza que deseja excluir este registro?",
      onConfirm: async () => {
        try {
          await deleteQuestionario(id);
          showAlert("success", "Sucesso", "Questionário excluído com sucesso.");
          loadData();
        } catch (err) {
          console.error("Falha ao excluir questionário:", err);
          showAlert("destructive", "Erro", "Falha ao excluir questionário.");
        }
      }
    });
  };

  // --- HELPERS ---
  const getTotalQuestions = () => {
    return Object.values(categoryQuestions).reduce((total, questions) => total + questions.length, 0);
  };


  // --- RENDER ---
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestão de Questionários
        </h2>
        {!isFormOpen && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="bg-secondary text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 hover:bg-secondary/90"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Questionário</span>
          </button>
        )}
      </div>
      {/* Formulário de Questionário */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingQuestionnaire ? "Editar Questionário" : "Novo Questionário"}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações básicas */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nome Base do Questionário *
              </label>
              <input
                type="text"
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                placeholder="Digite o nome base"
                required
              />
            </div>

            {/* Perguntas por Categoria */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-gray-900">
                  Perguntas por Categoria ({getTotalQuestions()} total)
                </h4>
              </div>

              <div className="space-y-6">
                {categories.map((category) => (
                  <div key={category.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h5 className="font-semibold text-gray-900">{category.name}</h5>
                        <p className="text-sm text-gray-600">Perguntas: {(categoryQuestions[category.id] || []).length}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addQuestionToCategory(category.id)}
                        className="bg-secondary text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 hover:bg-secondary/90"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Adicionar Pergunta</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(categoryQuestions[category.id] || []).map((question, questionIndex) => (
                        <div key={question.id || questionIndex} className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex justify-between items-start mb-3">
                            <h6 className="font-medium text-gray-900">
                              Pergunta {questionIndex + 1}
                            </h6>
                            <button
                              type="button"
                              onClick={() => removeQuestionFromCategory(category.id, questionIndex)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Remover Pergunta"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex flex-col md:flex-row items-start gap-4 mb-4">
                            {/* Campo da pergunta (80%) */}
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Texto da Pergunta *
                              </label>
                              <input
                                type="text"
                                value={question.text}
                                onChange={(e) =>
                                  updateQuestionInCategory(category.id, questionIndex, 'text', e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Digite o texto da pergunta"
                                required
                              />
                            </div>

                            {/* Campo do peso (20%) */}
                            <div className="w-32 flex-shrink-0">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Peso *</label>
                              <input
                                type="number"
                                min="1"
                                value={question.weight}
                                onChange={(e) =>
                                  updateQuestionInCategory(category.id, questionIndex, 'weight', parseInt(e.target.value, 10))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 "
                                placeholder="Peso"
                                required
                              />
                            </div>
                          </div>


                          {/* Opções de Resposta */}
                          {['multipla-escolha', 'sim-nao-na'].includes(question.type) && (
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Opções de Resposta</label>
                                {question.type === 'multipla-escolha' && (
                                  <button
                                    type="button"
                                    onClick={() => addOptionToQuestion(category.id, questionIndex)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    + Adicionar Opção
                                  </button>
                                )}
                              </div>
                              <div className="space-y-2">
                                {question.options?.map((option, optionIndex) => (
                                  <div
                                    key={optionIndex}
                                    className="flex items-center gap-2"
                                  >
                                    {/* Campo de texto da opção (80%) */}
                                    <input
                                      type="text"
                                      value={option.label}
                                      onChange={(e) =>
                                        updateQuestionOption(category.id, questionIndex, optionIndex, {
                                          label: e.target.value,
                                        })
                                      }
                                      className="w-50 px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder={`Opção ${optionIndex + 1}`}
                                      required
                                      disabled={question.type === 'sim-nao-na'} // Desabilita edição para Sim/Não
                                    />

                                    {/* Campo de peso (20%) */}
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={option.weight}
                                      onChange={(e) =>
                                        updateQuestionOption(category.id, questionIndex, optionIndex, {
                                          weight: parseFloat(e.target.value),
                                        })
                                      }
                                      className="w-20 px-2 py-1 text-sm text-center border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Pts"
                                      required
                                    />

                                    {/* Botão remover (somente múltipla escolha) */}
                                    {question.type === 'multipla-escolha' && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeQuestionOption(category.id, questionIndex, optionIndex)
                                        }
                                        className="text-red-600 hover:text-red-800 p-1"
                                        title="Remover Opção"
                                      >
                                        <Minus className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>

                            </div>
                          )}
                        </div>
                      ))}

                      {(categoryQuestions[category.id] || []).length === 0 && (
                        <div className="text-center py-4 text-gray-500 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm">Nenhuma pergunta adicionada nesta categoria.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhuma categoria encontrada.</p>
                  <p className="text-sm">Crie categorias primeiro na aba "Categorias Qualitativas".</p>
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
        </div >
      )}

      {/* Tabela de Questionários */}
      {!isFormOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Questionário</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Nº de Perguntas</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Criação</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Última Atualização</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questionnaires.map((questionnaire) => (
                  <tr key={questionnaire.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{questionnaire.name}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {questionnaire.questions.length} pergunta{questionnaire.questions.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-600">
                        {new Date(questionnaire.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-600">
                        {new Date(questionnaire.updated_at).toLocaleDateString('pt-BR')}
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
              <div className="text-gray-500 text-lg mb-2">Nenhum questionário encontrado</div>
              <div className="text-gray-400 text-sm">Clique em "Novo Questionário" para começar</div>
            </div>
          )}
        </div>
      )}
    </div >
  );
};