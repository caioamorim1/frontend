import React, { useState, useEffect } from "react";
import { Plus, CreditCard as Edit, Trash2, Save, X, Minus } from "lucide-react";
import { Questionnaire, Question, QualitativeCategory } from "../types";
import { dataRepository } from "../repository/DataRepository";

export const QuestionnairesTab: React.FC = () => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [categories, setCategories] = useState<QualitativeCategory[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestionnaire, setEditingQuestionnaire] =
    useState<Questionnaire | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    questions: [] as Question[],
  });
  const [categoryQuestions, setCategoryQuestions] = useState<{
    [key: number]: Question[];
  }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setQuestionnaires(dataRepository.getQuestionnaires());
    setCategories(dataRepository.getCategories());
  };

  const questionTypes = [
    { value: "sim-nao-na", label: "Sim / Não / N/A" },
    { value: "texto", label: "Texto" },
    { value: "numero", label: "Número" },
    { value: "data", label: "Data" },
    { value: "multipla-escolha", label: "Múltipla Escolha" },
  ];

  const addQuestion = () => {
    // This function is no longer used since we add questions per category
  };

  const addQuestionToCategory = (categoryId: number) => {
    const newQuestion: Question = {
      id: Date.now(),
      text: "",
      type: "sim-nao-na",
      weight: 1,
      options: [],
      categoryId: 0,
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
      const categoryQs = [...(prev[categoryId] || [])];
      categoryQs[questionIndex] = {
        ...categoryQs[questionIndex],
        [field]: value,
      };

      // Se mudou para múltipla escolha, inicializa as opções
      if (
        field === "type" &&
        value === "multipla-escolha" &&
        !categoryQs[questionIndex].options
      ) {
        categoryQs[questionIndex].options = [""];
      }

      return {
        ...prev,
        [categoryId]: categoryQs,
      };
    });
  };

  const removeQuestionFromCategory = (
    categoryId: number,
    questionIndex: number
  ) => {
    setCategoryQuestions((prev) => ({
      ...prev,
      [categoryId]: (prev[categoryId] || []).filter(
        (_, i) => i !== questionIndex
      ),
    }));
  };

  const addOptionToQuestion = (categoryId: number, questionIndex: number) => {
    setCategoryQuestions((prev) => {
      const categoryQs = [...(prev[categoryId] || [])];
      if (!categoryQs[questionIndex].options) {
        categoryQs[questionIndex].options = [];
      }
      categoryQs[questionIndex].options!.push("");
      return {
        ...prev,
        [categoryId]: categoryQs,
      };
    });
  };

  const updateQuestionOption = (
    categoryId: number,
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    setCategoryQuestions((prev) => {
      const categoryQs = [...(prev[categoryId] || [])];
      categoryQs[questionIndex].options![optionIndex] = value;
      return {
        ...prev,
        [categoryId]: categoryQs,
      };
    });
  };

  const removeQuestionOption = (
    categoryId: number,
    questionIndex: number,
    optionIndex: number
  ) => {
    setCategoryQuestions((prev) => {
      const categoryQs = [...(prev[categoryId] || [])];
      categoryQs[questionIndex].options!.splice(optionIndex, 1);
      return {
        ...prev,
        [categoryId]: categoryQs,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Por favor, preencha o nome do questionário");
      return;
    }

    // Verificar se há pelo menos uma pergunta em alguma categoria
    const totalQuestions = Object.values(categoryQuestions).reduce(
      (total, questions) => total + questions.length,
      0
    );
    if (totalQuestions === 0) {
      alert("Por favor, adicione pelo menos uma pergunta em alguma categoria");
      return;
    }

    // Validar se todas as perguntas têm texto em todas as categorias
    const invalidQuestions = Object.values(categoryQuestions).some(
      (questions) =>
        questions.some((q) => !q.text.trim() || !q.weight || q.weight < 1)
    );
    if (invalidQuestions) {
      alert(
        "Por favor, preencha o texto e peso de todas as perguntas. O peso deve ser maior que zero."
      );
      return;
    }

    // Validar opções de múltipla escolha
    const invalidOptions = Object.values(categoryQuestions).some((questions) =>
      questions.some(
        (q) =>
          q.type === "multipla-escolha" &&
          (!q.options ||
            q.options.length === 0 ||
            q.options.some((opt) => !opt.trim()))
      )
    );
    if (invalidOptions) {
      alert(
        "Por favor, preencha todas as opções das perguntas de múltipla escolha"
      );
      return;
    }

    // Criar um único questionário com todas as perguntas organizadas por categoria
    const allQuestions: Question[] = [];

    Object.entries(categoryQuestions).forEach(([categoryId, questions]) => {
      questions.forEach((question) => {
        allQuestions.push({
          ...question,
          categoryId: parseInt(categoryId),
        });
      });
    });

    const questionnaireData = {
      name: formData.name,
      questions: allQuestions,
    };

    if (editingQuestionnaire) {
      dataRepository.updateQuestionnaire(
        editingQuestionnaire.id,
        questionnaireData
      );
    } else {
      //dataRepository.addQuestionnaire(questionnaireData);
    }

    loadData();
    resetForm();
  };

  const handleEdit = (questionnaire: Questionnaire) => {
    setEditingQuestionnaire(questionnaire);
    setFormData({
      name: questionnaire.name.replace(
        ` - ${getCategoryName(questionnaire.categoryId)}`,
        ""
      ),
      questions: [] as Question[],
    });

    // Carregar perguntas na categoria correspondente
    if (questionnaire.categoryId) {
      setCategoryQuestions({
        [questionnaire.categoryId]: [...questionnaire.questions],
      });
    }
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      questions: [] as Question[],
    });
    setCategoryQuestions({});
    setEditingQuestionnaire(null);
    setIsFormOpen(false);
  };
  const getTotalQuestions = () => {
    return Object.values(categoryQuestions).reduce(
      (total, questions) => total + questions.length,
      0
    );
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este questionário?")) {
      dataRepository.deleteQuestionnaire(id);
      loadData();
    }
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "Sem categoria";
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Categoria não encontrada";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestão de Questionários
        </h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Questionário</span>
        </button>
      </div>

      {/* Formulário */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingQuestionnaire
                ? "Editar Questionário"
                : "Novo Questionário"}
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
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nome Base do Questionário *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors duration-200"
                placeholder="Digite o nome base (será combinado com o nome da categoria)"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                O nome final será: "{formData.name} - [Nome da Categoria]"
              </p>
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
                  <div
                    key={category.id}
                    className="border border-gray-300 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h5 className="font-semibold text-gray-900">
                          {category.name}
                        </h5>
                        <p className="text-sm text-gray-600">
                          Meta: {category.meta} | Perguntas:{" "}
                          {(categoryQuestions[category.id] || []).length}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addQuestionToCategory(category.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Adicionar Pergunta</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(categoryQuestions[category.id] || []).map(
                        (question, questionIndex) => (
                          <div
                            key={question.id}
                            className="border border-gray-200 rounded-lg p-4 bg-white"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h6 className="font-medium text-gray-900">
                                Pergunta {questionIndex + 1}
                              </h6>
                              <button
                                type="button"
                                onClick={() =>
                                  removeQuestionFromCategory(
                                    category.id,
                                    questionIndex
                                  )
                                }
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Texto da Pergunta *
                                </label>
                                <input
                                  type="text"
                                  value={question.text}
                                  onChange={(e) =>
                                    updateQuestionInCategory(
                                      category.id,
                                      questionIndex,
                                      "text",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Digite o texto da pergunta"
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Resposta *
                                  </label>
                                  <select
                                    value={question.type}
                                    onChange={(e) =>
                                      updateQuestionInCategory(
                                        category.id,
                                        questionIndex,
                                        "type",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    {questionTypes.map((type) => (
                                      <option
                                        key={type.value}
                                        value={type.value}
                                      >
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Peso *
                                  </label>
                                  <input
                                    type="number"
                                    value={question.weight}
                                    onChange={(e) =>
                                      updateQuestionInCategory(
                                        category.id,
                                        questionIndex,
                                        "weight",
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="1-10"
                                    min="1"
                                    max="10"
                                    required
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Opções para múltipla escolha */}
                            {question.type === "multipla-escolha" && (
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Opções de Resposta
                                  </label>
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
                                          value={option}
                                          onChange={(e) =>
                                            updateQuestionOption(
                                              category.id,
                                              questionIndex,
                                              optionIndex,
                                              e.target.value
                                            )
                                          }
                                          className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder={`Opção ${
                                            optionIndex + 1
                                          }`}
                                          required
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeQuestionOption(
                                              category.id,
                                              questionIndex,
                                              optionIndex
                                            )
                                          }
                                          className="text-red-600 hover:text-red-800 p-1"
                                        >
                                          <Minus className="h-3 w-3" />
                                        </button>
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
                    Crie categorias primeiro na aba "Categorias".
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
                    <td className="px-6 py-4">
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
                        {new Date(questionnaire.createdAt).toLocaleDateString(
                          "pt-BR"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-600">
                        {new Date(questionnaire.updatedAt).toLocaleDateString(
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
                          <Edit className="h-4 w-4" />
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
