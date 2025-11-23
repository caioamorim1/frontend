import { useState, useEffect, FormEvent } from "react";
import { createPortal } from "react-dom";
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

interface AvaliacaoScpModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidadeId: string;
  leitoId: string;
  prontuario: string;
  hospitalId: string;
  onSuccess: () => void;
}

export default function AvaliacaoScpModal({
  isOpen,
  onClose,
  unidadeId,
  leitoId,
  prontuario,
  hospitalId,
  onSuccess,
}: AvaliacaoScpModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [unidade, setUnidade] = useState<UnidadeInternacao | null>(null);
  const [schema, setSchema] = useState<ScpSchema | null>(null);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      if (!unidadeId) return;
      try {
        setLoading(true);
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
  }, [isOpen, unidadeId]);

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
    if (!isFormComplete || !user?.id || !unidade) {
      toast({
        title: "Atenção",
        description: "Por favor, responda todas as perguntas para continuar.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createSessao({
        unidadeId: unidade.id,
        prontuario: prontuario,
        scp: unidade.scpMetodoKey,
        leitoId,
        colaboradorId: user.id,
        itens: respostas,
      });
      toast({ title: "Sucesso!", description: "Avaliação salva com sucesso." });
      onSuccess();
      onClose();
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a avaliação.",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
          <Card className="w-full max-w-md relative z-[100000]">
            <CardContent className="p-8">
              <p className="text-center">Carregando formulário de avaliação...</p>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999]">
          <Card className="w-full max-w-md relative z-[100000]">
            <CardContent className="p-8">
              <p className="text-red-500">{error}</p>
              <Button onClick={onClose} className="mt-4 w-full">
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && !error && schema && currentQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[99999] p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col relative z-[100000]">
            <CardContent className="p-12 flex-1 overflow-auto">
              {/* Cabeçalho com progresso */}
              <div className="mb-12">
                <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
                  <span className="text-base">Progresso</span>
                  <span className="text-base font-semibold">
                    {currentQuestionIndex + 1} / {totalQuestions}
                  </span>
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
                          respostas[currentQuestion.key] === option.value &&
                            "bg-primary text-primary-foreground"
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
                  <div className="flex gap-3">
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
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="flex items-center gap-2 text-base py-6 px-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Cancelar
                    </Button>
                  </div>

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
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}
