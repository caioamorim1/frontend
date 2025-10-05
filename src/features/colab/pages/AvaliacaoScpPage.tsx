import { useState, useEffect, FormEvent, useCallback } from "react";
import { useParams, useNavigate, useBeforeUnload } from "react-router-dom";
import {
  getUnidadeById,
  getScpSchema,
  updateSessao,
  UnidadeInternacao,
  ScpSchema,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Componente para a Barra de Progresso
const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full bg-muted rounded-full h-2.5">
      <div
        className="bg-primary h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

// Componente Principal da Página
export default function AvaliacaoScpPage() {
  const { unidadeId, sessaoId } = useParams<{ unidadeId: string; sessaoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [unidade, setUnidade] = useState<UnidadeInternacao | null>(null);
  const [schema, setSchema] = useState<ScpSchema | null>(null);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avaliationCompleted, setAvaliationCompleted] = useState(false);

  // Aviso ao tentar sair da página (fecha aba/navega para outro site)
  useBeforeUnload(
    useCallback((event) => {
      if (!avaliationCompleted) {
        event.preventDefault();
        return (event.returnValue = "Você tem uma avaliação em andamento. Tem certeza que deseja sair?");
      }
    }, [avaliationCompleted])
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!unidadeId) return;
      try {
        const unidadeData = (await getUnidadeById(unidadeId)) as UnidadeInternacao;
        setUnidade(unidadeData);
        if (unidadeData.scpMetodoKey) {
          const schemaData = await getScpSchema(unidadeData.scpMetodoKey);
          setSchema(schemaData);
        } else {
          setError("Esta unidade não possui um método de avaliação configurado.");
        }
      } catch (err) {
        setError("Falha ao carregar dados da avaliação.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [unidadeId]);

  const handleOptionSelect = (questionKey: string, value: number) => {
    setRespostas((prev) => ({ ...prev, [questionKey]: value }));
  };
  
  const totalQuestions = schema?.questions.length || 0;
  const answeredQuestions = Object.keys(respostas).length;
  const isFormComplete = answeredQuestions === totalQuestions;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormComplete || !sessaoId || !user?.id) {
      toast({
        title: "Atenção",
        description: "Por favor, responda todas as perguntas para continuar.",
        variant: "destructive",
      });
      return;
    }
    try {
      await updateSessao(sessaoId, { colaboradorId: user.id, itens: respostas });
      setAvaliationCompleted(true); // Marca como concluída antes de navegar
      toast({ title: "Sucesso!", description: "Avaliação salva com sucesso." });
      navigate(`/unidade/${unidadeId}/leitos`);
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível salvar a avaliação.", variant: "destructive" });
    }
  };

  if (loading) return <p className="text-center p-10">Carregando formulário de avaliação...</p>;
  if (error) return <p className="text-red-500 bg-red-50 p-4 rounded-md">{error}</p>;
  if (!schema) return <p className="text-center p-10">Formulário de avaliação não encontrado.</p>;

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Importante:</strong> Complete toda a avaliação antes de sair desta página. O paciente já foi admitido e precisa de avaliação completa.
          </p>
        </div>
        <h1 className="text-3xl font-bold text-primary">{schema.title}</h1>
        <p className="text-muted-foreground">Unidade: {unidade?.nome}</p>
      </div>

      <div className="space-y-2 mb-8">
        <div className="flex justify-between text-sm font-medium text-muted-foreground">
          <span>Progresso</span>
          <span>{answeredQuestions} / {totalQuestions}</span>
        </div>
        <ProgressBar value={answeredQuestions} max={totalQuestions} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {schema.questions.map((question, index) => (
          <Card key={question.key} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">
                <span className="text-primary mr-2">{index + 1}.</span>
                {question.text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {question.options.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={respostas[question.key] === option.value ? "default" : "outline"}
                    className={cn(
                      "h-auto py-3 px-4 text-left justify-start",
                      respostas[question.key] === option.value && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleOptionSelect(question.key, option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
          <div className="max-w-4xl mx-auto flex justify-end">
            <Button type="submit" size="lg" disabled={!isFormComplete}>
              <CheckCircle className="h-5 w-5 mr-2"/>
              Finalizar e Salvar Avaliação
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}