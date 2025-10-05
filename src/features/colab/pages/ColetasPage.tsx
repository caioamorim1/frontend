import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUnidadesInternacao, getUnidadesNaoInternacao, getQuestionarios, getColetasPorHospital, Unidade, Questionario, Coleta } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Eye, AlertTriangle } from "lucide-react";
import ColetaDetalhesModal from "@/features/admin-hospital/components/ColetaDetalhesModal";
import { useToast } from "@/hooks/use-toast";

export default function ColetasPage() {
    const { user, loading: userLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [unidades, setUnidades] = useState<Unidade[]>([]);
    const [questionarios, setQuestionarios] = useState<Questionario[]>([]);
    const [coletas, setColetas] = useState<Coleta[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [coletasError, setColetasError] = useState(false);

    const [selectedUnidade, setSelectedUnidade] = useState("");
    const [selectedQuestionario, setSelectedQuestionario] = useState("");
    const [selectedColeta, setSelectedColeta] = useState<Coleta | null>(null);

    useEffect(() => {
        if (userLoading) {
            return;
        }

        const hospitalId = user?.hospital?.id;
        if (!hospitalId) {
            setLoading(false);
            setError("Usuário não está associado a um hospital.");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setColetasError(false);
            
            try {
                const [unidadesInternacao, unidadesNaoInternacao] = await Promise.all([
                    getUnidadesInternacao(hospitalId),
                    getUnidadesNaoInternacao(hospitalId),
                ]);
                setUnidades([...unidadesInternacao, ...unidadesNaoInternacao]);
            } catch (err) {
                 console.error("Falha ao carregar unidades:", err);
                 setError("Não foi possível carregar as unidades/setores.");
            }

            try {
                const questionariosData = await getQuestionarios();
                setQuestionarios(questionariosData);
            } catch(err) {
                console.error("Falha ao carregar questionários:", err);
                setError(prev => prev ? `${prev} E não foi possível carregar os questionários.` : "Não foi possível carregar os questionários.");
            }

            try {
                const coletasData = await getColetasPorHospital(hospitalId);
                setColetas(coletasData);
            } catch (err) {
                console.error("Falha ao carregar histórico de coletas (erro 500 esperado):", err);
                setColetasError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, userLoading]);

    const handleStartColeta = () => {
        if (!selectedUnidade || !selectedQuestionario) {
            toast({ title: "Atenção", description: "Por favor, selecione uma unidade e um questionário.", variant: "destructive"});
            return;
        }
        const unidadeNome = unidades.find(u => u.id === selectedUnidade)?.nome || 'desconhecida';
        navigate(`/coletas/realizar/${selectedQuestionario}/${selectedUnidade}/${encodeURIComponent(unidadeNome)}`);
    };
    
    if (loading) return <p className="text-center p-10">Carregando dados de coletas...</p>;
    if (error && unidades.length === 0 && questionarios.length === 0) {
        return <p className="text-red-500 text-center p-10">{error}</p>;
    }

    return (
        <div className="space-y-8">
            {selectedColeta && <ColetaDetalhesModal coleta={selectedColeta} onClose={() => setSelectedColeta(null)} />}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PlusCircle className="text-primary"/> Iniciar Nova Coleta de Dados</CardTitle>
                    <CardDescription>Selecione a unidade e o questionário que deseja aplicar.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select onValueChange={setSelectedUnidade} value={selectedUnidade} disabled={unidades.length === 0}>
                        <SelectTrigger>
                            <SelectValue placeholder={unidades.length > 0 ? "Selecione a Unidade/Setor" : "Nenhuma unidade encontrada"} />
                        </SelectTrigger>
                        <SelectContent>
                            {unidades.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select onValueChange={setSelectedQuestionario} value={selectedQuestionario} disabled={questionarios.length === 0}>
                        <SelectTrigger>
                            <SelectValue placeholder={questionarios.length > 0 ? "Selecione o Questionário" : "Nenhum questionário encontrado"} />
                        </SelectTrigger>
                        <SelectContent>
                            {questionarios.map(q => <SelectItem key={q.id} value={q.id}>{q.nome}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    
                    <Button onClick={handleStartColeta} disabled={!selectedUnidade || !selectedQuestionario}>
                        Iniciar Avaliação
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Histórico de Coletas</CardTitle>
                    <CardDescription>Visualize as avaliações já realizadas neste hospital.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Unidade</TableHead>
                                <TableHead>Questionário</TableHead>
                                <TableHead>Responsável</TableHead>
                                {/* ✅ Coluna Pontuação REMOVIDA */}
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coletasError ? (
                                <TableRow>
                                     {/* ✅ ColSpan ATUALIZADO */}
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        <div className="flex items-center justify-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            <span>Não foi possível carregar o histórico de coletas.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : coletas.length > 0 ? (
                                coletas.map(coleta => (
                                    <TableRow key={coleta.id}>
                                        <TableCell>{new Date(coleta.created_at).toLocaleString('pt-BR')}</TableCell>
                                        <TableCell>{coleta.localNome}</TableCell>
                                        <TableCell>{coleta.questionario.nome}</TableCell>
                                        <TableCell>{coleta.colaborador?.nome || 'N/A'}</TableCell>
                                        {/* ✅ Célula Pontuação REMOVIDA */}
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => setSelectedColeta(coleta)}>
                                                <Eye className="h-4 w-4"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    {/* ✅ ColSpan ATUALIZADO */}
                                    <TableCell colSpan={5} className="text-center h-24">
                                        Nenhuma coleta encontrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}