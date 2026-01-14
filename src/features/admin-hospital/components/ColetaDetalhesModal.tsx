import { buildFileUrl, Coleta } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { X, AlertCircle, MessageSquare } from "lucide-react";
import { useMemo } from "react";

interface ColetaDetalhesModalProps {
  coleta: Coleta | null;
  onClose: () => void;
}

export default function ColetaDetalhesModal({
  coleta,
  onClose,
}: ColetaDetalhesModalProps) {
  const respostasArray = useMemo(() => {
    if (!coleta?.respostas) {
      return [];
    }
    if (typeof coleta.respostas === "string") {
      try {
        const parsed = JSON.parse(coleta.respostas);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Falha ao fazer parse das respostas JSON:", e);
        return [];
      }
    }
    return Array.isArray(coleta.respostas) ? coleta.respostas : [];
  }, [coleta]);

  const perguntasMap = useMemo(() => {
    if (!coleta?.questionario?.perguntas) {
      return new Map();
    }
    return new Map(coleta.questionario.perguntas.map((p) => [p.id, p]));
  }, [coleta?.questionario]);

  if (!coleta) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-in fade-in-0">
      <Card className="w-full max-w-2xl animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Detalhes da Coleta
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Realizada em {new Date(coleta.created_at).toLocaleString("pt-BR")}{" "}
            por {coleta.colaborador?.nome || "Não identificado"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          <div className="text-sm space-y-1 p-3 bg-muted/50 rounded-md">
            <p>
              <strong>Local:</strong> {coleta.localNome}
            </p>
            <p>
              <strong>Questionário:</strong> {coleta.questionario.nome}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-primary">Respostas:</h3>
            {respostasArray.length > 0 ? (
              respostasArray.map((resposta: any) => {
                const pergunta = perguntasMap.get(resposta.perguntaId);
                return (
                  <div
                    key={resposta.perguntaId}
                    className="p-3 border rounded-md space-y-2"
                  >
                    <p className="font-medium text-gray-800 text-sm">
                      {pergunta?.texto || "Pergunta não encontrada"}
                    </p>
                    <p className="text-gray-600 pl-2">
                      - Resposta:{" "}
                      <span className="font-semibold text-primary">
                        {String(resposta.valor) || "Não respondida"}
                      </span>
                    </p>

                    {/* ✅ EXIBIÇÃO DO COMENTÁRIO */}
                    {resposta.comentario && (
                      <div className="pl-2 flex items-start gap-2 text-sm text-gray-500 italic">
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>"{resposta.comentario}"</p>
                      </div>
                    )}

                    {resposta.fotoUrl && (
                      <div className="mt-2 pl-2">
                        <a
                          href={buildFileUrl(resposta.fotoUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Clique para ver a imagem completa"
                        >
                          <img
                            src={buildFileUrl(resposta.fotoUrl)}
                            alt={`Evidência para a pergunta: ${
                              pergunta?.texto || "pergunta"
                            }`}
                            className="max-w-xs h-auto rounded-md border shadow-sm transition-transform hover:scale-105"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted-foreground p-4 flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Nenhuma resposta encontrada para esta coleta.</span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
