import { useState, useEffect, FormEvent, useCallback } from "react";
import { useParams, useNavigate, useBeforeUnload } from "react-router-dom";
import {
  getUnidadeById,
  getScpSchema,
  UnidadeInternacao,
  ScpSchema,
  createSessao,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";


interface StateType{
  lid: string;
  pront: string;
  mscp: string;
}
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
  const { unidadeId, hospitalId } = useParams<{ unidadeId: string; hospitalId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as StateType;
  const [leitoId, setLeitoId] = useState<string | null>(() => state?.lid ?? null);
  const [pront, setPront] = useState<string | null>(() => state?.pront ?? null);
  const [mscp, setMscp] = useState<string | null>(() => state?.mscp ?? null);

  const { user } = useAuth();
  const { toast } = useToast();

  const [unidade, setUnidade] = useState<UnidadeInternacao | null>(null);
  const [schema, setSchema] = useState<ScpSchema | null>(null);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avaliationCompleted, setAvaliationCompleted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  useEffect(() => {
    if (!state) return;
    setLeitoId((prev) => prev ?? state.lid ?? null);
    setPront((prev) => prev ?? state.pront ?? null);
    setMscp((prev) => prev ?? state.mscp ?? null);
  }, [state]);


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
  const currentQuestion = schema?.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormComplete || !user?.id) {
      toast({
        title: "Atenção",
        description: "Por favor, responda todas as perguntas para continuar.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createSessao( {unidadeId: unidade.id, prontuario: pront, scp: mscp, leitoId,colaboradorId: user.id, itens: respostas,  });
      setAvaliationCompleted(true); // Marca como concluída antes de navegar
      toast({ title: "Sucesso!", description: "Avaliação salva com sucesso." });
      navigate(`/hospital/${hospitalId}/unidade/${unidadeId}/leitos`);
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível salvar a avaliação.", variant: "destructive" });
    }
  };
  

  if (loading) return <p className="text-center p-10">Carregando formulário de avaliação...</p>;
  if (error) return <p className="text-red-500 bg-red-50 p-4 rounded-md">{error}</p>;
  if (!schema || !currentQuestion) return <p className="text-center p-10">Formulário de avaliação não encontrado.</p>;

  return (
    <>
      {/* Backdrop com modal centralizado */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
          <CardContent className="p-12 flex-1 overflow-auto">
            {/* Cabeçalho com progresso */}
            <div className="mb-12">
              <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                <span className="text-base">Progresso</span>
                <span className="text-base font-semibold">{currentQuestionIndex + 1} / {totalQuestions}</span>
              </div>
              <ProgressBar value={currentQuestionIndex + 1} max={totalQuestions} />
            </div>

            {/* Pergunta atual */}
            <form onSubmit={handleSubmit} className="space-y-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-12 leading-relaxed">
                  {currentQuestionIndex + 1}. {currentQuestion.text}
                </h2>

                {/* Opções da pergunta em coluna */}
                <div className="flex flex-col gap-3">
                  {currentQuestion.options.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={respostas[currentQuestion.key] === option.value ? "default" : "outline"}
                      className={cn(
                        "h-auto py-4 px-6 text-left justify-start text-sm font-medium whitespace-normal min-h-[3rem]",
                        respostas[currentQuestion.key] === option.value && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => handleOptionSelect(currentQuestion.key, option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Navegação */}
              <div className="flex justify-between items-center pt-8 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={isFirstQuestion}
                  className="flex items-center gap-2 text-base py-6 px-6"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Anterior
                </Button>

                {!isLastQuestion ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 text-base py-6 px-6"
                  >
                    Próximo
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!isFormComplete}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-base py-6 px-6"
                  >
                    <CheckCircle className="h-5 w-5" />
                    Finalizar e Salvar Avaliação
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}