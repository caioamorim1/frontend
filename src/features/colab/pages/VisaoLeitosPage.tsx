import { useEffect, useState, useMemo, FC, FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getUnidadeById,
  getSessoesAtivasByUnidadeId,
  updateLeito,
  UnidadeInternacao,
  Leito,
  SessaoAtiva,
  StatusLeito,
  admitirPaciente,
  getUltimoProntuarioLeito,
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
      console.log(
        "Preenchendo campo com prontuário sugerido:",
        modalState.suggestedProntuario
      );
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
}> = ({ sessao, onClose, onEdit }) => {
  if (!sessao) return null;

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
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={() => onEdit(sessao)}>Editar Avaliação</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Componente do Card de Leito (Atualizado) ---
const LeitoCard: FC<{
  leito: Leito;
  sessao?: SessaoAtiva;
  onAction: (leito: Leito, action: ModalAction) => Promise<void>;
  onSetStatus: (leitoId: string, status: StatusLeito) => void;
  onShowDetails: (sessao: SessaoAtiva) => void;
}> = ({ leito, sessao, onAction, onSetStatus, onShowDetails }) => {
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

  const CardWrapper = ({ children }) =>
    isOccupied ? (
      <div onClick={() => onShowDetails(sessao)}>{children}</div>
    ) : (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações para Leito {leito.numero}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onAction(leito, "EVALUATE")}>
            <Pencil className="mr-2 h-4 w-4" /> Iniciar Avaliação
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onSetStatus(leito.id, StatusLeito.VAGO)}
          >
            <Bed className="mr-2 h-4 w-4" /> Marcar como Vago
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onSetStatus(leito.id, StatusLeito.PENDENTE)}
          >
            <Calendar className="mr-2 h-4 w-4" /> Marcar como Pendente
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction(leito, "INACTIVATE")}>
            <Ban className="mr-2 h-4 w-4" /> Marcar como Inativo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

  return (
    <CardWrapper>
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
          <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
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
  }, [unidadeId]);

  const handleSetStatus = async (
    leitoId: string,
    status: StatusLeito,
    justificativa?: string
  ) => {
    try {
      await updateLeito(leitoId, { status });
      showAlert(
        "success",
        "Sucesso",
        `Leito marcado como ${status.toLowerCase()}. ${
          justificativa ? `Justificativa: ${justificativa}` : ""
        }`
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
        console.log("Buscando último prontuário para leito:", leito.id);
        const ultimoProntuario = await getUltimoProntuarioLeito(leito.id);
        if (ultimoProntuario && ultimoProntuario.prontuario) {
          suggestedProntuario = ultimoProntuario.prontuario;
          console.log("✅ Prontuário encontrado:", {
            prontuario: suggestedProntuario,
            dataAplicacao: ultimoProntuario.dataAplicacao,
            avaliacaoId: ultimoProntuario.avaliacaoId,
          });
        } else {
          console.log(
            "ℹ️ Nenhum prontuário anterior encontrado para este leito"
          );
        }
      } catch (err: any) {
        console.warn(
          "⚠️ Erro ao buscar prontuário (continuando sem sugestão):",
          {
            leitoId: leito.id,
            status: err.response?.status,
            message: err.response?.data?.message || err.message,
          }
        );
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
    const pendentes = leitosOrdenados.filter(
      (leito) => leito.status === StatusLeito.PENDENTE
    ).length;
    const avaliados = total - pendentes;
    const percentualAvaliados = total > 0 ? (avaliados / total) * 100 : 0;

    return {
      total,
      avaliados,
      pendentes,
      percentualAvaliados,
    };
  }, [leitosOrdenados]);

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
        onEdit={(sessao) => {
          setDetailsModalSessao(null);
          setEditAvaliacaoModalState({ isOpen: true, sessao });
        }}
      />

      <div className="space-y-4">
        <Link to={backLink} className="text-sm text-gray-500 hover:underline">
          &larr; Voltar para Unidades
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">{unidade.nome}</h1>
            <p className="text-muted-foreground">Mapa de leitos da unidade</p>
          </div>

          {/* Card compacto com estatísticas */}
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
                <div className="space-y-1 text-right pl-4 border-l">
                  <p className="text-xs text-muted-foreground font-semibold">
                    % Avaliados
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {estatisticasLeitos.percentualAvaliados.toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {leitosOrdenados.length > 0 ? (
          leitosOrdenados.map((leito) => (
            <LeitoCard
              key={leito.id}
              leito={leito}
              sessao={sessoesPorLeitoId.get(leito.id)}
              onAction={handleOpenActionModal}
              onSetStatus={handleSetStatus}
              onShowDetails={(sessao) => setDetailsModalSessao(sessao)}
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
          onSuccess={() => {
            fetchData();
            setEditAvaliacaoModalState({ isOpen: false, sessao: null });
          }}
        />
      )}
    </div>
  );
}
