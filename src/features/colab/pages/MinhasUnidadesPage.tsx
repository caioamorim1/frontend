import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUnidadesInternacao,
  getSessoesAtivasByUnidadeId,
  UnidadeInternacao,
  SessaoAtiva,
  StatusLeito,
} from "@/lib/api";
import { useParams, Link } from "react-router-dom";
import {
  Building2,
  CheckSquare,
  AlertTriangle,
  BedDouble,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";

// Tipos locais
interface UnidadeComStats {
  unidade: UnidadeInternacao;
  sessoes: SessaoAtiva[];
}

// Distribuição de níveis de cuidado
const NIVEL_LABELS: Record<string, string> = {
  MINIMOS: "Mínimos",
  CUIDADOS_MINIMOS: "Mínimos",
  INTERMEDIARIOS: "Intermediários",
  CUIDADOS_INTERMEDIARIOS: "Intermediários",
  ALTA_DEPENDENCIA: "Alta Dependência",
  SEMI_INTENSIVO: "Semi-Intensivo",
  SEMI_INTENSIVOS: "Semi-Intensivo",
  INTENSIVO: "Intensivo",
  INTENSIVOS: "Intensivo",
};
const NIVEL_COLORS: Record<string, string> = {
  MINIMOS: "bg-sky-400",
  CUIDADOS_MINIMOS: "bg-sky-400",
  INTERMEDIARIOS: "bg-yellow-400",
  CUIDADOS_INTERMEDIARIOS: "bg-yellow-400",
  ALTA_DEPENDENCIA: "bg-orange-400",
  SEMI_INTENSIVO: "bg-orange-400",
  SEMI_INTENSIVOS: "bg-orange-400",
  INTENSIVO: "bg-red-500",
  INTENSIVOS: "bg-red-500",
};

function UnidadeStatCard({ item, hospitalId }: { item: UnidadeComStats; hospitalId: string }) {
  const { unidade, sessoes } = item;
  const leitos = unidade.leitos ?? [];
  const total = leitos.length;

  const sessaoIds = useMemo(() => new Set(sessoes.map((s) => s.leito.id)), [sessoes]);

  const pendentes = leitos.filter(
    (l) => l.status === StatusLeito.PENDENTE && !sessaoIds.has(l.id)
  ).length;
  const avaliados = total - pendentes;
  const percentAvaliados = total > 0 ? Math.round((avaliados / total) * 100) : 0;
  const percentOcupacao = total > 0 ? Math.round((sessoes.length / total) * 100) : 0;

  const gatilho = Number(unidade.gatilho ?? 0);
  const gatilhoAlcancado = gatilho > 0 ? percentAvaliados >= gatilho : false;

  const leitosFora = leitos.filter((l) => l.pontuacaoDentroIntervalo === false).length;

  // Distribuição de níveis
  const distribuicao = useMemo(() => {
    const map: Record<string, number> = {};
    leitos.forEach((l) => {
      if (l.classificacaoScp) {
        const key = l.classificacaoScp;
        map[key] = (map[key] ?? 0) + 1;
      }
    });
    return map;
  }, [leitos]);

  const hasDistribuicao = Object.keys(distribuicao).length > 0;

  // Cor do card
  let cardBorder = "border-gray-200";
  let cardBg = "bg-white";
  if (gatilhoAlcancado) {
    if (leitosFora > 0) {
      cardBorder = "border-yellow-400";
      cardBg = "bg-yellow-50";
    } else {
      cardBorder = "border-green-400";
      cardBg = "bg-green-50";
    }
  }

  return (
    <Link to={`/hospital/${hospitalId}/unidade/${unidade.id}/leitos`}>
      <Card className={`border-2 ${cardBorder} ${cardBg} hover:shadow-md transition-all cursor-pointer`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            {/* Ícone + nome */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-primary/10 rounded-lg p-2 shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-primary truncate">{unidade.nome}</p>
                <p className="text-xs text-muted-foreground">{total} leitos</p>
              </div>
            </div>

            {/* Métricas */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Fora do intervalo — só mostra se gatilho alcançado e houver leitos fora */}
              {gatilhoAlcancado && leitosFora > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex flex-col items-center gap-0.5">
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm font-bold text-yellow-600">{leitosFora}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{leitosFora} leito(s) fora do intervalo de pontuação</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Taxa de Ocupação */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-0.5">
                      <BedDouble className="h-5 w-5 text-primary" />
                      {hasDistribuicao ? (
                        // Mini gráfico de barras empilhadas no hover — aqui usamos um segundo tooltip
                        <span className="text-sm font-bold text-primary">{percentOcupacao}%</span>
                      ) : (
                        <span className="text-sm font-bold text-primary">{percentOcupacao}%</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1 min-w-[160px]">
                      <p className="font-semibold text-xs mb-1">Taxa de Ocupação do dia</p>
                      {hasDistribuicao && (
                        <>
                          <p className="text-xs text-muted-foreground mb-1">Distribuição por nível:</p>
                          {Object.entries(distribuicao).map(([key, qty]) => (
                            <div key={key} className="flex items-center gap-2 text-xs">
                              <span className={`inline-block w-2.5 h-2.5 rounded-sm ${NIVEL_COLORS[key] ?? "bg-gray-400"}`} />
                              <span>{NIVEL_LABELS[key] ?? key}: {qty}</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* % Avaliações */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-0.5">
                      <CheckSquare className="h-5 w-5 text-primary" />
                      <span className="text-sm font-bold text-primary">{percentAvaliados}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>% de leitos avaliados no setor</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MinhasUnidadesPage() {
  const { user } = useAuth();
  const { hospitalId: hospitalIdFromParams } = useParams<{ hospitalId: string }>();
  const [items, setItems] = useState<UnidadeComStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hospitalId = hospitalIdFromParams || user?.hospital?.id;

  // Stats consolidados do hospital
  const hospitalStats = useMemo(() => {
    if (!items.length) return null;
    const totalLeitos = items.reduce((s, i) => s + (i.unidade.leitos?.length ?? 0), 0);
    const totalOcupados = items.reduce((s, i) => s + i.sessoes.length, 0);
    const totalAvaliados = items.reduce((acc, { unidade, sessoes }) => {
      const leitos = unidade.leitos ?? [];
      const ids = new Set(sessoes.map((s) => s.leito.id));
      const pend = leitos.filter((l) => l.status === StatusLeito.PENDENTE && !ids.has(l.id)).length;
      return acc + (leitos.length - pend);
    }, 0);
    return {
      taxaOcupacao: totalLeitos > 0 ? Math.round((totalOcupados / totalLeitos) * 100) : 0,
      percentAvaliados: totalLeitos > 0 ? Math.round((totalAvaliados / totalLeitos) * 100) : 0,
    };
  }, [items]);

  useEffect(() => {
    if (!hospitalId) {
      setLoading(false);
      setError("Hospital não identificado.");
      return;
    }
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const unidades = await getUnidadesInternacao(hospitalId);
        const sessoesPorUnidade = await Promise.all(
          unidades.map((u) => getSessoesAtivasByUnidadeId(u.id).catch(() => [] as SessaoAtiva[]))
        );
        setItems(unidades.map((u, i) => ({ unidade: u, sessoes: sessoesPorUnidade[i] })));
      } catch (err) {
        setError("Não foi possível carregar as unidades.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [hospitalId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-primary">Unidades de Internação</h1>

        {hospitalStats && (
          <Card className="w-full sm:w-auto min-w-[280px]">
            <CardContent className="p-4">
              <div className="flex items-center gap-6">
                <div className="space-y-1 text-center">
                  <p className="text-xs text-muted-foreground font-semibold">
                    Taxa Ocupação
                  </p>
                  <p className="text-3xl font-bold text-primary">{hospitalStats.taxaOcupacao}%</p>
                </div>
                <div className="space-y-1 text-center border-l pl-6">
                  <p className="text-xs text-muted-foreground font-semibold">
                    % Avaliados
                  </p>
                  <p className="text-3xl font-bold text-primary">{hospitalStats.percentAvaliados}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {loading && <p>A carregar unidades...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.length > 0 ? (
            items.map((item) => (
              <UnidadeStatCard
                key={item.unidade.id}
                item={item}
                hospitalId={hospitalId!}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              Nenhuma unidade de internação encontrada para este hospital.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
