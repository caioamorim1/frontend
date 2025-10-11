import React from 'react';
import { useState } from 'react';
import { Eye, CreditCard as Edit, Calendar, User, Edit2, Trash2 } from 'lucide-react';
import { Evaluation, Questionnaire } from '../types';
import { EvaluationForm } from './EvaluationForm';
import { createAvaliacao, deleteAvaliacao, getAvaliacoes, getQuestionarios, UnidadeInternacao, UnidadeNaoInternacao, updateAvaliacao } from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';
import { useModal } from '@/contexts/ModalContext';

export const EvaluationsTab: React.FC<{
  onClose: () => void;
  unidadeInternacao?: UnidadeInternacao;
  unidadeNaoInternacao?: UnidadeNaoInternacao;

}> = ({ onClose, unidadeInternacao, unidadeNaoInternacao }) => {
  const { showAlert } = useAlert()
  const { showModal } = useModal()
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);

  React.useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = () => {
    getAvaliacoes().then(data => {
      setEvaluations(data);
    }).catch(error => {
      showAlert('destructive', 'Erro ao carregar avaliações: ' + error.message, 'error');
    });
  };



  const handleSaveEvaluation = (evaluationData: any) => {
    console.log('Received evaluation data:', evaluationData);
    if (!evaluationData || !evaluationData.questionnaireId) {
      showAlert('destructive', 'Dados da avaliação inválidos.', 'error');
      return;
    }
    evaluationData.sectorId = unidadeInternacao ? unidadeInternacao.id : (unidadeNaoInternacao ? unidadeNaoInternacao.id : null);
    if (!evaluationData.sectorId) {
      showAlert('destructive', 'Setor inválido para a avaliação.', 'error');
      return;
    }
    console.log('Saving evaluation:', evaluationData);
    if (editingEvaluation) {
      updateAvaliacao(editingEvaluation.id, evaluationData).then(() => {
        loadEvaluations();
        handleCloseForm();
        showAlert('success', 'Avaliação atualizada com sucesso!', 'success');
      });
    } else {
      createAvaliacao(evaluationData).then(() => {
        loadEvaluations();
        handleCloseForm();
        showAlert('success', 'Avaliação criada com sucesso!', 'success');
      }).catch(error => {
        showAlert('destructive', 'Erro ao criar avaliação: ' + error.message, 'error');
      });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEvaluation(null);
  };

  const handleEdit = (evaluation: Evaluation) => {
    setEditingEvaluation(evaluation);
    setIsFormOpen(true);
  };

  const handleNewEvaluation = async () => {
    setIsFormOpen(true);


  }

  const handleDelete = (id: number) => {
    showModal({
      type: "confirm",
      title: "Excluir registro?",
      message: "Tem certeza que deseja deletar este item?",
      onConfirm: () => deleteItem(id),
    })
  };

  const deleteItem = (id: number) => {
    deleteAvaliacao(id)
      .then(() => {
        showAlert("success", "Sucesso", "Avaliação excluída com sucesso.");
        loadEvaluations();
      })
      .catch(err => {
        console.error("Falha ao excluir avaliação:", err);
        showAlert("destructive", "Erro", "Falha ao excluir avaliação.");
      });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completo':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'incompleto':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completo':
        return 'Concluída';
      case 'pending':
        return 'Pendente';
      case 'incompleto':
        return 'Em Andamento';
      default:
        return 'Desconhecido';
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Avaliações Realizadas</h2>
        <div className="flex justify-end mt-6 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
          >
            <span>Voltar</span>
          </button>
          {!isFormOpen && (
            <button
              onClick={handleNewEvaluation}
              className="bg-secondary text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <span>+ Nova Avaliação</span>
            </button>
          )}
        </div>
      </div>

      {isFormOpen ? (
        <EvaluationForm
          onClose={handleCloseForm}
          onSave={handleSaveEvaluation}
          editingEvaluation={editingEvaluation}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AVALIAÇÃO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AVALIADOR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DATA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QUESTIONÁRIO
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AÇÕES
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {evaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{evaluation.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        {evaluation.evaluator}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(evaluation.date).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(evaluation.status)}`}>
                        {getStatusText(evaluation.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {evaluation.questionnaire}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(evaluation)}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200"
                          title="Editar avaliação"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(evaluation.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Excluir avaliação"
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
        </div>
      )}
    </div>
  );
};