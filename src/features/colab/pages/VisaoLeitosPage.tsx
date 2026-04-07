import { useEffect, useState, useMemo, FC, FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getUnidadeById,
  getSessoesAtivasByUnidadeId,
  updateLeito,
  darAltaLeito,
  UnidadeInternacao,
  Leito,
  SessaoAtiva,
  StatusLeito,
  admitirPaciente,
  getUltimoProntuarioLeito,
  getComentariosUnidade,
  createComentarioUnidade,
  deleteComentarioUnidade,
  ComentarioUnidade,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bed,
  MoreVertical,
  Ban,
  Pencil,
  X,
  User,
  FileText,
  Calendar,
  AlertTriangle,
  Send,
  Trash2,
  FileDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAlert } from "@/contexts/AlertContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AvaliacaoScpModal from "../components/AvaliacaoScpModal";

// --- Tipos para os Modais ---
type ModalAction = "EVALUATE" | "INACTIVATE";
interface ActionModalState {
  isOpen: boolean;
  leito: Leito | null;
  action: ModalAction | null;
  suggestedProntuario?: string;
}

interface AvaliacaoModalState {
  isOpen: boolean;
  leitoId: string;
  prontuario: string;
}

// --- Componente do Modal de Ação (Admitir/Inativar) ---
const ActionModal: FC<{
  modalState: ActionModalState;
  onClose: () => void;
  onSubmit: (leitoId: string, value: string) => void;
}> = ({ modalState, onClose, onSubmit }) => {
  const [inputValue, setInputValue] = useState("");
  const { showAlert } = useAlert();

  useEffect(() => {
    if (modalState.isOpen && modalState.suggestedProntuario) {
      setInputValue(modalState.suggestedProntuario);
    } else {
      setInputValue("");
    }
  }, [modalState.isOpen, modalState.suggestedProntuario]);

  const modalConfig = {
    EVALUATE: {
      title: "Iniciar Avaliação",
      label: "Número do Prontuário",
      placeholder: "Digite o prontuário...",
      inputType: "text" as const,
      buttonText: "Admitir e Avaliar",
    },
    INACTIVATE: {
      title: "Inativar Leito",
      label: "Justificativa",
      placeholder: "Descreva o motivo...",
      inputType: "textarea" as const,
      buttonText: "Confirmar Inativação",
    },
  };

  const config = modalState.action ? modalConfig[modalState.action] : null;
  if (!modalState.isOpen || !config || !modalState.leito) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === "") {
      showAlert(
        "destructive",
        "Campo obrigatório",
        "Por favor, preencha o campo para continuar."
      );
      return;
    }
    onSubmit(modalState.leito!.id, inputValue);
    setInputValue("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0">
      <Card className="w-full max-w-md animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-lg">
            {config.title}: Leito {modalState.leito.numero}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="modal-input"
                className="text-sm font-medium text-muted-foreground"
              >
                {config.label}
              </label>
              {config.inputType === "textarea" ? (
                <Textarea
                  id="modal-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={config.placeholder}
                  required
                  autoFocus
                  className="mt-1"
                />
              ) : (
                <Input
                  id="modal-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={config.placeholder}
                  required
                  autoFocus
                  className="mt-1"
                />
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">{config.buttonText}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// --- NOVO: Componente do Modal de Detalhes da Avaliação ---
const EvaluationDetailsModal: FC<{
  sessao: SessaoAtiva | null;
  onClose: () => void;
  onEdit: (sessao: SessaoAtiva) => void;
  onDischarge: (sessao: SessaoAtiva) => Promise<void>;
  canEdit?: boolean;
}> = ({ sessao, onClose, onEdit, onDischarge, canEdit = true }) => {
  if (!sessao) return null;

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsSubmitting(false);
  }, [sessao.id]);

  // A API não retorna a data da avaliação na SessaoAtiva. Se retornar no futuro, basta substituir aqui.

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0">
      <Card className="w-full max-w-md animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-lg">
            Detalhes da Avaliação
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Leito {sessao.leito.numero} - Prontuário {sessao.prontuario}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-3 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">
                Resultado da Classificação
              </p>
              <p className="font-semibold text-primary">
                {sessao.classificacao || "Não classificado"}
              </p>
            </div>
          </div>
          {sessao.justificativa && (
            <div className="flex items-start">
              <FileText className="h-5 w-5 mr-3 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Justificativa da última edição</p>
                <p className="text-sm mt-0.5">{sessao.justificativa}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            {canEdit && (
              <>
                <Button
                  variant="destructive"
                  disabled={isSubmitting}
                  onClick={async () => {
                    try {
                      setIsSubmitting(true);
                      await onDischarge(sessao);
                    } catch {
                      // Mensagem de erro é tratada no handler do componente pai.
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                >
                  Dar alta
                </Button>
                <Button onClick={() => onEdit(sessao)}>Editar Avaliação</Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Modal de Justificativa de Edição ---
const EditJustificationModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justificativa: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  const [justificativa, setJustificativa] = useState("");

  useEffect(() => {
    if (isOpen) {
      setJustificativa("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!justificativa.trim()) return;
    onConfirm(justificativa.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0">
      <Card className="w-full max-w-md animate-in fade-in-0 zoom-in-95">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-lg">
              Justificativa da Edição
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Descreva o motivo da edição desta avaliação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Justificativa *
              </label>
              <Textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Ex.: Correção de dados, mudança no quadro clínico, etc."
                className="mt-1"
                required
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!justificativa.trim()}>
                Continuar
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

// --- Modal de Relatório ---
const RelatorioModal: FC<{
  unidadeId: string;
  hoje: string;
  token: string | null;
  isInternacao: boolean;
  onClose: () => void;
}> = ({ unidadeId, hoje, token, isInternacao, onClose }) => {
  const [tipoRelatorio, setTipoRelatorio] = useState<"diario" | "complexidade">("diario");
  const [modo, setModo] = useState<"hoje" | "data">("hoje");
  const [data, setData] = useState(hoje);
  // type="month" retorna "YYYY-MM"
  const hojeYM = hoje.slice(0, 7);
  const [mesInicio, setMesInicio] = useState(hojeYM);
  const [mesFim, setMesFim] = useState(hojeYM);
  const [gerando, setGerando] = useState(false);

  const inicioMaiorQueFim = mesInicio > mesFim;

  const handleGerar = async () => {
    setGerando(true);
    try {
      let url: string;
      let nomeArquivo: string;
      if (tipoRelatorio === "diario") {
        const dataFinal = modo === "hoje" ? hoje : data;
        url = `http://localhost:3110/export/diario-avaliacoes/${unidadeId}/pdf?data=${dataFinal}`;
        nomeArquivo = `relatorio-diario-${dataFinal}.pdf`;
      } else {
        const inicio = `${mesInicio}-01`;
        const [fY, fM] = mesFim.split("-").map(Number);
        const ultimoDia = new Date(fY, fM, 0).getDate();
        const fim = `${mesFim}-${String(ultimoDia).padStart(2, "0")}`;
        url = `http://localhost:3110/export/grau-complexidade/${unidadeId}/pdf?inicio=${inicio}&fim=${fim}`;
        nomeArquivo = `relatorio-complexidade-${mesInicio}-${mesFim}.pdf`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erro ao gerar relatório");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = nomeArquivo;
      a.click();
      URL.revokeObjectURL(objectUrl);
      onClose();
    } catch {
      alert("Não foi possível gerar o relatório.");
    } finally {
      setGerando(false);
    }
  };

  const podeBaixar = tipoRelatorio === "diario"
    ? !(modo === "data" && !data)
    : !inicioMaiorQueFim && !!mesInicio && !!mesFim;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0">
      <Card className="w-full max-w-sm animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-lg">
            Gerar Relatório
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInternacao && (
            <div className="flex gap-2">
              <Button
                variant={tipoRelatorio === "diario" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTipoRelatorio("diario")}
              >
                Diário de Avaliações
              </Button>
              <Button
                variant={tipoRelatorio === "complexidade" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setTipoRelatorio("complexidade")}
              >
                Grau de Complexidade
              </Button>
            </div>
          )}

          {tipoRelatorio === "diario" && (
            <>
              <div className="flex gap-2">
                <Button
                  variant={modo === "hoje" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setModo("hoje")}
                >
                  Hoje
                </Button>
                <Button
                  variant={modo === "data" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setModo("data")}
                >
                  Data específica
                </Button>
              </div>
              {modo === "data" && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data</label>
                  <input
                    type="date"
                    value={data}
                    max={hoje}
                    onChange={(e) => setData(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
            </>
          )}

          {tipoRelatorio === "complexidade" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mês inicial</label>
                <input
                  type="month"
                  value={mesInicio}
                  max={mesFim || hojeYM}
                  onChange={(e) => setMesInicio(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mês final</label>
                <input
                  type="month"
                  value={mesFim}
                  min={mesInicio}
                  max={hojeYM}
                  onChange={(e) => setMesFim(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              {inicioMaiorQueFim && (
                <p className="text-xs text-destructive">O mês inicial não pode ser maior que o final.</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleGerar} disabled={gerando || !podeBaixar}>
              <FileDown className="h-4 w-4 mr-2" />
              {gerando ? "Gerando..." : "Baixar PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Modal de Justificativa do Leito ---
const JustificativaLeitoModal: FC<{
  leito: Leito | null;
  onClose: () => void;
  onReativar: (leitoId: string) => void;
  canEdit: boolean;
}> = ({ leito, onClose, onReativar, canEdit }) => {
  if (!leito) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-0">
      <Card className="w-full max-w-md animate-in fade-in-0 zoom-in-95">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-lg">
            Justificativa — Leito {leito.numero}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Status atual: <span className="font-medium capitalize">{leito.status.toLowerCase()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-3 text-sm">
            {leito.justificativa || <span className="text-muted-foreground italic">Sem justificativa registrada.</span>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
            {leito.status === StatusLeito.INATIVO && canEdit && (
              <Button onClick={() => { onReativar(leito.id); onClose(); }}>Reativar Leito</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Helper de cor do badge por classificação SCP ---
const scpBadgeClass = (scp: string | null | undefined): string | null => {
  switch (scp) {
    case "MINIMOS":
      return "bg-sky-100 text-sky-700 border-sky-300";
    case "INTERMEDIARIOS":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    case "ALTA_DEPENDENCIA":
    case "SEMI_INTENSIVOS":
      return "bg-orange-100 text-orange-700 border-orange-300";
    case "INTENSIVOS":
      return null; // usa destructive (vermelho) já existente
    default:
      return null;
  }
};

// --- Componente do Card de Leito (Atualizado) ---
const CardWrapper: FC<{
  isOccupied: boolean;
  sessao?: SessaoAtiva;
  leito: Leito;
  canEdit: boolean;
  onShowDetails: (sessao: SessaoAtiva) => void;
  onShowJustificativa: (leito: Leito) => void;
  onAction: (leito: Leito, action: ModalAction) => Promise<void>;
  onSetStatus: (leitoId: string, status: StatusLeito) => void;
  children: React.ReactNode;
}> = ({ isOccupied, sessao, leito, canEdit, onShowDetails, onShowJustificativa, onAction, onSetStatus, children }) => {
  if (isOccupied && sessao) {
    return <div onClick={() => onShowDetails(sessao)}>{children}</div>;
  }
  if (leito.status === StatusLeito.INATIVO) {
    return <div onClick={() => onShowJustificativa(leito)}>{children}</div>;
  }
  if (!canEdit) {
    return <div>{children}</div>;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações para Leito {leito.numero}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAction(leito, "EVALUATE")}>
          <Pencil className="mr-2 h-4 w-4" /> Iniciar Avaliação
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onSetStatus(leito.id, StatusLeito.VAGO)}>
          <Bed className="mr-2 h-4 w-4" /> Marcar como Vago
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSetStatus(leito.id, StatusLeito.PENDENTE)}>
          <Calendar className="mr-2 h-4 w-4" /> Marcar como Pendente
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction(leito, "INACTIVATE")}>
          <Ban className="mr-2 h-4 w-4" /> Marcar como Inativo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const LeitoCard: FC<{
  leito: Leito;
  sessao?: SessaoAtiva;
  onAction: (leito: Leito, action: ModalAction) => Promise<void>;
  onSetStatus: (leitoId: string, status: StatusLeito) => void;
  onShowDetails: (sessao: SessaoAtiva) => void;
  onShowJustificativa: (leito: Leito) => void;
  canEdit: boolean;
}> = ({ leito, sessao, onAction, onSetStatus, onShowDetails, onShowJustificativa, canEdit }) => {
  const isOccupied = !!sessao;
  const statusInfo = useMemo(() => {
    if (isOccupied)
      return {
        text: "Ocupado",
        variant: "destructive" as const,
        iconColor: "text-red-500",
        bgColor: "bg-red-50 border-red-200",
      };
    switch (leito.status) {
      case StatusLeito.VAGO:
        return {
          text: "Vago",
          variant: "default" as const,
          iconColor: "text-green-500",
          bgColor: "bg-green-50 border-green-200",
        };
      case StatusLeito.INATIVO:
        return {
          text: "Inativo",
          variant: "outline" as const,
          iconColor: "text-gray-400",
          bgColor: "bg-gray-100 border-gray-200",
        };
      default:
        return {
          text: "Pendente",
          variant: "secondary" as const,
          iconColor: "text-yellow-500",
          bgColor: "bg-yellow-50 border-yellow-200",
        };
    }
  }, [leito.status, isOccupied]);

  return (
    <CardWrapper
      isOccupied={isOccupied}
      sessao={sessao}
      leito={leito}
      canEdit={canEdit}
      onShowDetails={onShowDetails}
      onShowJustificativa={onShowJustificativa}
      onAction={onAction}
      onSetStatus={onSetStatus}
    >
      <Card
        className={`transition-all hover:shadow-lg ${statusInfo.bgColor} ${
          isOccupied
            ? "cursor-pointer hover:border-primary/50"
            : "cursor-pointer hover:border-primary/50"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-bold text-primary">
            Leito {leito.numero}
          </CardTitle>
          <div className="flex items-center gap-2">
            {leito.pontuacaoDentroIntervalo === false && (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            )}
            {(() => {
              const scpClass = scpBadgeClass(leito.classificacaoScp);
              return (
                <Badge
                  variant={scpClass ? "outline" : statusInfo.variant}
                  className={scpClass ?? undefined}
                >
                  {statusInfo.text}
                </Badge>
              );
            })()}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col justify-center h-[100px]">
          {isOccupied ? (
            <div className="flex items-center gap-2">
              <User className={`h-5 w-5 ${statusInfo.iconColor}`} />
              <span className="text-xl font-semibold text-gray-700">
                {sessao.prontuario}
              </span>
            </div>
          ) : (
            <Bed className={`h-10 w-10 ${statusInfo.iconColor}`} />
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  );
};

// --- Componente Principal da Página ---
export default function VisaoLeitosPage() {
  const { unidadeId, hospitalId } = useParams<{
    unidadeId: string;
    hospitalId: string;
  }>();
  const { user } = useAuth();
  const canEditLeitos = ["ADMIN", "AVALIADOR", "GESTOR_TATICO_TEC_ADM", "GESTOR_TATICO_TECNICO"].includes(user?.tipo ?? "");
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [unidade, setUnidade] = useState<UnidadeInternacao | null>(null);
  const [sessoes, setSessoes] = useState<SessaoAtiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionModalState, setActionModalState] = useState<ActionModalState>({
    isOpen: false,
    leito: null,
    action: null,
  });
  const [detailsModalSessao, setDetailsModalSessao] =
    useState<SessaoAtiva | null>(null);
  const [avaliacaoModalState, setAvaliacaoModalState] =
    useState<AvaliacaoModalState>({
      isOpen: false,
      leitoId: "",
      prontuario: "",
    });
  const [editAvaliacaoModalState, setEditAvaliacaoModalState] = useState<{
    isOpen: boolean;
    sessao: SessaoAtiva | null;
  }>({ isOpen: false, sessao: null });

  const [editJustificationModalState, setEditJustificationModalState] =
    useState<{
      isOpen: boolean;
      sessao: SessaoAtiva | null;
    }>({ isOpen: false, sessao: null });

  const [justificativaLeitoModal, setJustificativaLeitoModal] = useState<Leito | null>(null);
  const [relatorioModalOpen, setRelatorioModalOpen] = useState(false);

  const [justificativaEdicao, setJustificativaEdicao] = useState<string>("");

  // --- Comentários ---
  const hoje = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const [comentarios, setComentarios] = useState<ComentarioUnidade[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  const fetchComentarios = async () => {
    if (!unidadeId) return;
    try {
      const data = await getComentariosUnidade(unidadeId, hoje);
      setComentarios(data);
    } catch {}
  };

  const handleEnviarComentario = async (e: FormEvent) => {
    e.preventDefault();
    if (!novoComentario.trim() || !unidadeId || !user?.id) return;
    try {
      setEnviandoComentario(true);
      await createComentarioUnidade(unidadeId, user.id, hoje, novoComentario.trim());
      setNovoComentario("");
      await fetchComentarios();
    } catch {
      showAlert("destructive", "Erro", "Não foi possível enviar o comentário.");
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleDeletarComentario = async (comentarioId: string) => {
    if (!unidadeId) return;
    try {
      await deleteComentarioUnidade(unidadeId, comentarioId);
      setComentarios((prev) => prev.filter((c) => c.id !== comentarioId));
    } catch {
      showAlert("destructive", "Erro", "Não foi possível deletar o comentário.");
    }
  };

  const fetchData = async () => {
    if (!unidadeId) return;
    try {
      setLoading(true);
      const [unidadeData, sessoesData] = await Promise.all([
        getUnidadeById(unidadeId) as Promise<UnidadeInternacao>,
        getSessoesAtivasByUnidadeId(unidadeId),
      ]);
      setUnidade(unidadeData);
      setSessoes(sessoesData);
    } catch (error) {
      setError("Falha ao buscar dados da unidade.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchComentarios();
  }, [unidadeId]);

  const handleSetStatus = async (
    leitoId: string,
    status: StatusLeito,
    justificativa?: string
  ) => {
    try {
      await updateLeito(leitoId, { status, justificativa, autorId: user?.id, autorNome: user?.nome });
      showAlert(
        "success",
        "Sucesso",
        `Leito marcado como ${status.toLowerCase()}.`
      );
      fetchData();
    } catch (err) {
      showAlert(
        "destructive",
        "Erro",
        "Não foi possível atualizar o status do leito."
      );
    }
  };

  const handleStartEvaluation = async (leitoId: string, prontuario: string) => {
    if (!unidadeId || !user?.id || !unidade?.scpMetodoKey) {
      showAlert(
        "destructive",
        "Erro de Configuração",
        "Verifique as configurações da unidade."
      );
      return;
    }
    try {
      showAlert("success", "Sucesso", "Paciente admitido. Abrindo avaliação.");
      setAvaliacaoModalState({
        isOpen: true,
        leitoId,
        prontuario,
      });
    } catch (error) {
      showAlert("destructive", "Erro", "Não foi possível iniciar a avaliação.");
    }
  };

  const handleOpenActionModal = async (leito: Leito, action: ModalAction) => {
    let suggestedProntuario = undefined;

    // Se for ação de avaliar, buscar último prontuário
    if (action === "EVALUATE") {
      try {
        const ultimoProntuario = await getUltimoProntuarioLeito(leito.id);
        if (ultimoProntuario && ultimoProntuario.prontuario) {
          suggestedProntuario = ultimoProntuario.prontuario;
        } else {
        }
      } catch (err: any) {
        console.warn("Erro ao buscar prontuário (continuando sem sugestão):", {
          leitoId: leito.id,
          status: err.response?.status,
          message: err.response?.data?.message || err.message,
        });
        // Continua normalmente sem prontuário sugerido
      }
    }

    setActionModalState({
      isOpen: true,
      leito,
      action,
      suggestedProntuario,
    });
  };

  const handleModalSubmit = (leitoId: string, value: string) => {
    if (actionModalState.action === "EVALUATE") {
      handleStartEvaluation(leitoId, value);
    }
    if (actionModalState.action === "INACTIVATE") {
      handleSetStatus(leitoId, StatusLeito.INATIVO, value);
    }
    setActionModalState({ isOpen: false, leito: null, action: null });
  };

  const handleDischarge = async (sessao: SessaoAtiva) => {
    try {
      await darAltaLeito(sessao.leito.id);
      showAlert(
        "success",
        "Alta realizada",
        `Leito ${sessao.leito.numero} liberado com sucesso.`
      );
      setDetailsModalSessao(null);
      fetchData();
    } catch (err) {
      showAlert("destructive", "Erro", "Não foi possível dar alta no leito.");
      throw err;
    }
  };

  const sessoesPorLeitoId = useMemo(
    () => new Map(sessoes.map((s) => [s.leito.id, s])),
    [sessoes]
  );
  const leitosOrdenados = useMemo(
    () =>
      unidade?.leitos?.sort((a, b) =>
        a.numero.localeCompare(b.numero, undefined, { numeric: true })
      ) || [],
    [unidade?.leitos]
  );

  // Calcular % de leitos avaliados (não pendentes)
  const estatisticasLeitos = useMemo(() => {
    if (!leitosOrdenados.length) {
      return {
        total: 0,
        avaliados: 0,
        percentualAvaliados: 0,
      };
    }

    const total = leitosOrdenados.length;
    const sessaoLeitoIds = new Set(sessoes.map((s) => s.leito.id));
    const pendentes = leitosOrdenados.filter(
      (leito) =>
        leito.status === StatusLeito.PENDENTE && !sessaoLeitoIds.has(leito.id)
    ).length;
    const avaliados = total - pendentes;
    const percentualAvaliados = total > 0 ? (avaliados / total) * 100 : 0;
    const ocupados = sessoes.length;
    const taxaOcupacao = total > 0 ? (ocupados / total) * 100 : 0;

    return {
      total,
      avaliados,
      pendentes,
      percentualAvaliados,
      ocupados,
      taxaOcupacao,
    };
  }, [leitosOrdenados, sessoes]);

  if (loading) return <p>Carregando mapa de leitos...</p>;
  if (error)
    return <p className="text-red-500 bg-red-50 p-4 rounded-md">{error}</p>;
  if (!unidade) return <p>Unidade não encontrada.</p>;

  const backLink =
    user?.appRole === "ADMIN"
      ? `/hospital/${unidade.hospitalId}/unidades-leitos`
      : "/meu-hospital";

  return (
    <div className="space-y-6">
      <ActionModal
        modalState={actionModalState}
        onClose={() =>
          setActionModalState({ isOpen: false, leito: null, action: null })
        }
        onSubmit={handleModalSubmit}
      />
      <EvaluationDetailsModal
        sessao={detailsModalSessao}
        onClose={() => setDetailsModalSessao(null)}
        canEdit={canEditLeitos}
        onEdit={(sessao) => {
          setDetailsModalSessao(null);
          setEditJustificationModalState({ isOpen: true, sessao });
        }}
        onDischarge={handleDischarge}
      />

      <EditJustificationModal
        isOpen={editJustificationModalState.isOpen}
        onClose={() =>
          setEditJustificationModalState({ isOpen: false, sessao: null })
        }
        onConfirm={(justificativa) => {
          setJustificativaEdicao(justificativa);
          setEditAvaliacaoModalState({
            isOpen: true,
            sessao: editJustificationModalState.sessao,
          });
          setEditJustificationModalState({ isOpen: false, sessao: null });
        }}
      />

      <JustificativaLeitoModal
        leito={justificativaLeitoModal}
        onClose={() => setJustificativaLeitoModal(null)}
        onReativar={(leitoId) => handleSetStatus(leitoId, StatusLeito.PENDENTE)}
        canEdit={canEditLeitos}
      />

      {relatorioModalOpen && unidadeId && (
        <RelatorioModal
          unidadeId={unidadeId}
          hoje={hoje}
          token={localStorage.getItem("authToken")}
          isInternacao={unidade?.tipo === "internacao"}
          onClose={() => setRelatorioModalOpen(false)}
        />
      )}

      <div className="space-y-4">
        <Link to={backLink} className="text-sm text-gray-500 hover:underline">
          &larr; Voltar para Unidades
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">{unidade.nome}</h1>
            <p className="text-muted-foreground">Mapa de leitos da unidade</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-fit"
              onClick={() => setRelatorioModalOpen(true)}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>
          <Card className="w-full sm:w-auto min-w-[280px]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Total de Leitos
                  </p>
                  <p className="text-2xl font-bold">
                    {estatisticasLeitos.total}
                  </p>
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-xs text-muted-foreground">Avaliados</p>
                  <p className="text-2xl font-bold">
                    {estatisticasLeitos.avaliados}
                  </p>
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">
                    {estatisticasLeitos.pendentes}
                  </p>
                </div>
                <div className="space-y-1 text-center pl-4 border-l">
                  <p className="text-xs text-muted-foreground font-semibold">
                    % Avaliados
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {estatisticasLeitos.percentualAvaliados.toFixed(0)}%
                  </p>
                </div>
                <div className="space-y-1 text-right pl-4 border-l">
                  <p className="text-xs text-muted-foreground font-semibold">
                    Taxa Ocupação
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {estatisticasLeitos.taxaOcupacao.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção de comentários */}
      <div className="space-y-3">
        {canEditLeitos && (
        <form onSubmit={handleEnviarComentario} className="flex gap-2">
          <Textarea
            placeholder="Adicionar comentário sobre a unidade hoje..."
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            className="resize-none min-h-[48px] max-h-[120px]"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleEnviarComentario(e as any);
              }
            }}
          />
          <Button
            type="submit"
            disabled={enviandoComentario || !novoComentario.trim()}
            size="sm"
            className="self-end"
          >
            <Send className="h-4 w-4 mr-1" />
            Enviar
          </Button>
        </form>
        )}

        {comentarios.length > 0 && (
          <div className="flex flex-col gap-2">
            {comentarios.map((c) => (
              <div
                key={c.id}
                className="flex items-start gap-3 bg-muted/50 rounded-lg px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-primary">
                      {c.autor?.nome ?? "Usuário removido"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.criadoEm).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5 break-words">{c.texto}</p>
                </div>
                {(user?.id === c.autor?.id || user?.appRole === "ADMIN") && (
                  <button
                    onClick={() => handleDeletarComentario(c.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5"
                    title="Deletar comentário"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {leitosOrdenados.length > 0 ? (
          leitosOrdenados.map((leito) => (
            <LeitoCard
              key={leito.id}
              leito={leito}
              sessao={sessoesPorLeitoId.get(leito.id)}
              canEdit={canEditLeitos}
              onAction={handleOpenActionModal}
              onSetStatus={handleSetStatus}
              onShowDetails={(sessao) => setDetailsModalSessao(sessao)}
              onShowJustificativa={(leito) => setJustificativaLeitoModal(leito)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-16 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">
              Nenhum leito cadastrado nesta unidade.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Avaliação SCP */}
      {unidadeId && hospitalId && (
        <AvaliacaoScpModal
          isOpen={avaliacaoModalState.isOpen}
          onClose={() =>
            setAvaliacaoModalState({
              isOpen: false,
              leitoId: "",
              prontuario: "",
            })
          }
          unidadeId={unidadeId}
          leitoId={avaliacaoModalState.leitoId}
          prontuario={avaliacaoModalState.prontuario}
          hospitalId={hospitalId}
          onSuccess={() => {
            fetchData();
            setAvaliacaoModalState({
              isOpen: false,
              leitoId: "",
              prontuario: "",
            });
          }}
        />
      )}

      {/* Modal de Edição de Avaliação SCP */}
      {unidadeId && hospitalId && editAvaliacaoModalState.sessao && (
        <AvaliacaoScpModal
          isOpen={editAvaliacaoModalState.isOpen}
          onClose={() =>
            setEditAvaliacaoModalState({ isOpen: false, sessao: null })
          }
          unidadeId={unidadeId}
          leitoId={editAvaliacaoModalState.sessao.leito.id}
          prontuario={editAvaliacaoModalState.sessao.prontuario}
          hospitalId={hospitalId}
          sessaoId={editAvaliacaoModalState.sessao.id}
          respostasIniciais={editAvaliacaoModalState.sessao.itens || {}}
          justificativa={justificativaEdicao}
          onSuccess={() => {
            fetchData();
            setEditAvaliacaoModalState({ isOpen: false, sessao: null });
          }}
        />
      )}
    </div>
  );
}
