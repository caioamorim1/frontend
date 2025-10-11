import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Save, X, Edit2 } from 'lucide-react';
import { QualitativeCategory } from '../types';
import { dataRepository } from '../repository/DataRepository';
import { createCategory, deleteCategory, getListQualitativesCategories, updateCategory } from '@/lib/api';
import { useAlert } from '@/contexts/AlertContext';
import { useModal } from '@/contexts/ModalContext';

export const CategoriesTab: React.FC = () => {
  const { showAlert } = useAlert()
  const { showModal } = useModal()

  const [categories, setCategories] = useState<QualitativeCategory[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<QualitativeCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', meta: 0 });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    getListQualitativesCategories()
      .then(setCategories)
      .catch(err => {
        console.error("Falha ao buscar categorias:", err);
        showAlert("destructive", "Erro", "Falha ao buscar categorias.");
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || formData.meta <= 0) {
      alert('Por favor, preencha todos os campos. A meta deve ser maior que zero.');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, formData).then(() => {
        showAlert("success", "Sucesso", "Categoria atualizada com sucesso.");
        loadCategories();
      }).catch(err => {
        console.error("Falha ao atualizar categoria:", err);
        showAlert("destructive", "Erro", "Falha ao atualizar categoria.");
      });
    } else {
      createCategory({ name: formData.name, meta: formData.meta }).then(() => {
        showAlert("success", "Sucesso", "Categoria criada com sucesso.");
        loadCategories();
      }).catch(err => {
        console.error("Falha ao criar categoria:", err);
        showAlert("destructive", "Erro", "Falha ao criar categoria.");
      });
    }

    loadCategories();
    resetForm();
  };

  const handleEdit = (category: QualitativeCategory) => {
    setEditingCategory(category);
    setFormData({ name: category.name, meta: category.meta });
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    showModal({
      type: "confirm",
      title: "Excluir registro?",
      message: "Tem certeza que deseja deletar este item?",
      onConfirm: () => deleteItem(id),
    })
  };

  const deleteItem = (id: number) => {
    deleteCategory(id)
      .then(() => {
        showAlert("success", "Sucesso", "Categoria excluída com sucesso.");
        loadCategories();
      })
      .catch(err => {
        console.error("Falha ao excluir categoria:", err);
        showAlert("destructive", "Erro", "Falha ao excluir categoria.");
      });
  };

  const resetForm = () => {
    setFormData({ name: '', meta: 0 });
    setEditingCategory(null);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Categorias</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-secondary text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Formulário */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                  placeholder="Digite o nome da categoria"
                  required
                />
              </div>

              <div>
                <label htmlFor="meta" className="block text-sm font-medium text-gray-700 mb-1">
                  Meta (Valor Numérico) *
                </label>
                <input
                  type="number"
                  id="meta"
                  value={formData.meta}
                  onChange={(e) => setFormData({ ...formData, meta: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
                  placeholder="Digite o valor da meta"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{editingCategory ? 'Atualizar' : 'Salvar'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabela de Categorias */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome da Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meta
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{category.meta}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Editar categoria"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Excluir categoria"
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

        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">Nenhuma categoria encontrada</div>
            <div className="text-gray-400 text-sm">Clique em "Nova Categoria" para começar</div>
          </div>
        )}
      </div>
    </div>
  );
};