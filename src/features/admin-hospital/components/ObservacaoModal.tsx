import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ObservacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (observacao: string) => void;
  initialValue?: string;
  cargoNome: string;
}

export function ObservacaoModal({
  isOpen,
  onClose,
  onSave,
  initialValue = "",
  cargoNome,
}: ObservacaoModalProps) {
  const [observacao, setObservacao] = useState(initialValue);

  useEffect(() => {
    setObservacao(initialValue);
  }, [initialValue, isOpen]);

  const handleSave = () => {
    onSave(observacao);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Observação - {cargoNome}
          </DialogTitle>
          <DialogDescription>
            Adicione observações sobre o dimensionamento para este cargo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Digite suas observações aqui..."
            className="min-h-[150px] resize-none"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ObservacaoButtonProps {
  hasObservacao: boolean;
  onClick: () => void;
}

export function ObservacaoButton({
  hasObservacao,
  onClick,
}: ObservacaoButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
        hasObservacao
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
      title={hasObservacao ? "Editar observação" : "Adicionar observação"}
    >
      <MessageSquare className="h-4 w-4" />
      <span className="text-xs font-medium">Observação</span>
    </button>
  );
}
