import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getColetasPorHospital, deleteColeta, Coleta } from '@/lib/api';
import { Eye, Trash2 } from 'lucide-react';
import ColetaDetalhesModal from '../components/ColetaDetalhesModal'; // Criaremos este componente a seguir

export default function HistoricoColetasPage() {
    const { hospitalId } = useParams<{ hospitalId: string }>();
    const [coletas, setColetas] = useState<Coleta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedColeta, setSelectedColeta] = useState<Coleta | null>(null);

    const fetchData = async () => {
        if (!hospitalId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getColetasPorHospital(hospitalId);
            setColetas(data);
        } catch (err) {
            setError('Falha ao carregar o histórico de coletas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [hospitalId]);
    
    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta coleta?')) {
            try {
                await deleteColeta(id);
                fetchData(); // Atualiza a lista
            } catch (err) {
                setError('Falha ao excluir a coleta.');
            }
        }
    };

    return (
        <div className="space-y-6">
            {selectedColeta && (
                <ColetaDetalhesModal 
                    coleta={selectedColeta}
                    onClose={() => setSelectedColeta(null)}
                />
            )}
            <h1 className="text-3xl font-bold text-primary">Histórico de Coletas</h1>
            
            <div className="bg-white p-6 rounded-lg border">
                {loading && <p>Carregando...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!loading && (
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Local</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Questionário</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {coletas.map(coleta => (
                                <tr key={coleta.id}>
                                    <td className="px-4 py-2 text-sm">{new Date(coleta.created_at).toLocaleString('pt-BR')}</td>
                                    <td className="px-4 py-2 text-sm">{coleta.localNome}</td>
                                    <td className="px-4 py-2 text-sm">{coleta.questionario.nome}</td>
                                    <td className="px-4 py-2 text-sm">{coleta.colaborador?.nome || 'N/A'}</td>
                                    <td className="px-4 py-2 text-right space-x-4">
                                        <button onClick={() => setSelectedColeta(coleta)} className="text-blue-600 hover:text-blue-800"><Eye size={18} /></button>
                                        <button onClick={() => handleDelete(coleta.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                             {coletas.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-sm text-gray-500">Nenhuma coleta encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}