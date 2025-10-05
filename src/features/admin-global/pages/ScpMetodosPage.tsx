import { useState, useEffect, FormEvent } from 'react';
import { getScpMetodos, createScpMetodo, updateScpMetodo, deleteScpMetodo, ScpMetodo, CreateScpMetodoDTO } from '@/lib/api';
import { Trash2, Edit, PlusCircle } from 'lucide-react';

const initialFormState: CreateScpMetodoDTO = {
    key: '',
    title: '',
    description: '',
    questions: [],
    faixas: [],
};

export default function ScpMetodosPage() {
  const [metodos, setMetodos] = useState<ScpMetodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [formData, setFormData] = useState<Partial<ScpMetodo>>(initialFormState);

  const fetchMetodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScpMetodos();
      setMetodos(data);
    } catch (err) {
      setError('Falha ao carregar os métodos SCP.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetodos();
  }, []);

  const handleEdit = (metodo: ScpMetodo) => {
    setFormData(metodo);
    setIsFormVisible(true);
  };

  const handleAddNew = () => {
    setFormData(initialFormState);
    setIsFormVisible(true);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setFormData(initialFormState);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.key || !formData.title) return;

    try {
      if (formData.id) {
        await updateScpMetodo(formData.id, formData as CreateScpMetodoDTO);
      } else {
        await createScpMetodo(formData as CreateScpMetodoDTO);
      }
      handleCancel();
      fetchMetodos();
    } catch (err) {
      setError(formData.id ? 'Falha ao atualizar o método.' : 'Falha ao criar o método.');
    }
  };

  const handleDelete = async (metodoId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este método?')) {
      try {
        await deleteScpMetodo(metodoId);
        fetchMetodos();
      } catch (err) {
        setError('Falha ao excluir o método.');
      }
    }
  };

  // Funções para manipular questões e faixas (simplificado, pode ser expandido)
  const addQuestion = () => {
    const newQuestion = { key: '', text: '', options: [{ label: '', value: 0 }] };
    setFormData(prev => ({ ...prev, questions: [...(prev.questions || []), newQuestion] }));
  };

  const addFaixa = () => {
    const newFaixa = { min: 0, max: 0, classe: 'MINIMOS' };
    setFormData(prev => ({ ...prev, faixas: [...(prev.faixas || []), newFaixa] }));
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Métodos de Avaliação (SCP)</h1>
        <button
          onClick={isFormVisible ? handleCancel : handleAddNew}
          className="px-4 py-2 text-white bg-secondary rounded-md hover:opacity-90 transition-opacity"
        >
          {isFormVisible ? 'Cancelar' : '+ Novo Método'}
        </button>
      </div>

      {isFormVisible && (
        <div className="bg-white p-6 rounded-lg border animate-fade-in-down space-y-4">
           <h2 className="text-xl font-semibold text-primary">{formData.id ? 'Editar Método' : 'Adicionar Novo Método'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="key" value={formData.key || ''} onChange={handleChange} placeholder="Chave (ex: FUGULIN)" required className="p-2 border rounded-md"/>
                <input name="title" value={formData.title || ''} onChange={handleChange} placeholder="Título (ex: Escala de Fugulin)" required className="p-2 border rounded-md"/>
             </div>
             <textarea name="description" value={formData.description || ''} onChange={handleChange} placeholder="Descrição" rows={2} className="w-full p-2 border rounded-md" />

             {/* UI Simplificada para questões e faixas */}
             <div className="space-y-2">
                <h3 className="font-medium">Questões</h3>
                <button type="button" onClick={addQuestion} className="text-sm text-secondary flex items-center gap-1"><PlusCircle size={16}/> Adicionar Questão</button>
                {formData.questions?.map((q, i) => <div key={i} className="text-xs p-2 bg-gray-50 rounded">{q.key || 'Nova Questão'}</div>)}
             </div>
             <div className="space-y-2">
                <h3 className="font-medium">Faixas de Classificação</h3>
                <button type="button" onClick={addFaixa} className="text-sm text-secondary flex items-center gap-1"><PlusCircle size={16}/> Adicionar Faixa</button>
                {formData.faixas?.map((f, i) => <div key={i} className="text-xs p-2 bg-gray-50 rounded">{f.classe}: {f.min} - {f.max}</div>)}
             </div>

            <div className="flex justify-end mt-4">
              <button type="submit" className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700">
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border">
        {loading && <p>Carregando...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!loading && !error && (
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chave</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {metodos.map((metodo) => (
                    <tr key={metodo.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{metodo.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{metodo.key}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                        <button onClick={() => handleEdit(metodo)} className="text-secondary hover:opacity-70">
                          <Edit size={20} />
                        </button>
                        <button onClick={() => handleDelete(metodo.id)} className="text-red-600 hover:opacity-70">
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
        )}
      </div>
    </div>
  );
}