import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
  Legend,
  PieChart,
  Pie,
  ComposedChart,
  Line,
  LineChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  getTermometroGlobal,
  getTermometroDetalhamento,
  getTermometroSerieHistorica,
  type TermometroGlobalResponse,
  type TermometroDetalhamentoResponse,
  type TermometroSerieHistoricaResponse,
} from "@/lib/api";

// ─── Cores da paleta do projeto ────────────────────────────────────────────────
const COLORS = {
  hoje: "#005D97",
  ontem: "#7DB9D9",
  cuidado: "#0070B9",
  subutilizado: "#0070B9",
  risco: "#f97316",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
type NivelCuidado =
  | "MINIMOS"
  | "INTERMEDIARIOS"
  | "ALTA_DEPENDENCIA"
  | "SEMI_INTENSIVOS"
  | "INTENSIVOS";

type TermometroData = TermometroGlobalResponse;
type SetorOcupacao = TermometroData["setoresOcupacao"][number];
type SetorDesvio = TermometroData["setoresDesvio"][number];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NIVEL_COLORS: Record<NivelCuidado, string> = {
  MINIMOS: "bg-sky-100 text-sky-800 border-sky-300",
  INTERMEDIARIOS: "bg-yellow-100 text-yellow-800 border-yellow-300",
  ALTA_DEPENDENCIA: "bg-orange-100 text-orange-800 border-orange-300",
  SEMI_INTENSIVOS: "bg-orange-200 text-orange-900 border-orange-400",
  INTENSIVOS: "bg-red-100 text-red-800 border-red-300",
};

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
const OcupacaoTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
      <div className="text-sm font-medium text-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="mt-1 text-sm text-muted-foreground">
          {p.name}: <span className="text-foreground font-medium">{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

const DesvioTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
      <div className="text-sm font-medium text-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="mt-1 text-sm text-muted-foreground">
          {p.name}: <span className="text-foreground font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CuidadoTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="mt-1 text-sm text-muted-foreground">
        {payload[0]?.name}: <span className="text-foreground font-medium">{payload[0]?.value}%</span>
      </div>
    </div>
  );
};

const GenericPctTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
      <div className="text-sm font-medium text-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="mt-1 text-sm text-muted-foreground">
          {p.name}: <span className="text-foreground font-medium">{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

const QTD_KEY_MAP: Record<string, string> = {
  minimos: "qtdMinimos",
  intermediarios: "qtdIntermediarios",
  altaDependencia: "qtdAltaDependencia",
  semiIntensivos: "qtdSemiIntensivos",
  intensivos: "qtdIntensivos",
};

const NiveisSerieTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
      <div className="text-sm font-medium text-foreground">{label}</div>
      {row?.qtdTotal != null && (
        <div className="text-xs text-muted-foreground mb-1">Total: {row.qtdTotal} pacientes</div>
      )}
      {payload.map((p: any) => {
        const qtdKey = QTD_KEY_MAP[p.dataKey];
        const qtd = qtdKey ? row?.[qtdKey] : undefined;
        return (
          <div key={p.dataKey} className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.stroke || p.color }} />
            {p.name}: <span className="text-foreground font-medium">{p.value}%</span>
            {qtd != null && <span className="text-xs">({qtd})</span>}
          </div>
        );
      })}
    </div>
  );
};

const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
      <div className="text-sm font-medium text-foreground">{payload[0]?.name}</div>
      <div className="mt-1 text-sm text-muted-foreground">
        <span className="text-foreground font-medium">{payload[0]?.value}%</span>
      </div>
    </div>
  );
};

// ─── Sub-componente: gráfico horizontal de ocupação ───────────────────────────
function OcupacaoChart({
  data,
  order,
}: {
  data: SetorOcupacao[];
  order: "maior" | "menor";
}) {
  const sorted = [...data].sort((a, b) =>
    order === "maior" ? b.hoje - a.hoje : a.hoje - b.hoje
  );

  return (
    <ResponsiveContainer width="100%" height={sorted.length * 52 + 40}>
      <BarChart
        layout="vertical"
        data={sorted}
        margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
        barCategoryGap="30%"
        barGap={3}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 10, fill: "#6b7280" }}
        />
        <YAxis
          type="category"
          dataKey="nome"
          width={130}
          tick={{ fontSize: 11, fill: "#374151" }}
        />
        <Tooltip content={<OcupacaoTooltip />} />
        <Legend
          iconType="square"
          iconSize={10}
          formatter={(value) => (
            <span className="text-xs text-gray-600">{value}</span>
          )}
        />
        <Bar dataKey="ontem" name="Ontem" fill={COLORS.ontem} radius={[0, 3, 3, 0]}>
          <LabelList
            dataKey="ontem"
            position="right"
            formatter={(v: number) => `${v}%`}
            style={{ fontSize: 10, fill: "#6b7280" }}
          />
        </Bar>
        <Bar dataKey="hoje" name="Hoje" fill={COLORS.hoje} radius={[0, 3, 3, 0]}>
          <LabelList
            dataKey="hoje"
            position="right"
            formatter={(v: number) => `${v}%`}
            style={{ fontSize: 10, fill: "#374151", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Sub-componente: gráfico horizontal de nível de cuidados ──────────────────
function NivelCuidadoChart({
  setores,
  order,
}: {
  setores: { nome: string; percentual: number }[];
  order: "maior" | "menor";
}) {
  const sorted = [...setores].sort((a, b) =>
    order === "maior" ? b.percentual - a.percentual : a.percentual - b.percentual
  );

  return (
    <ResponsiveContainer width="100%" height={sorted.length * 44 + 40}>
      <BarChart
        layout="vertical"
        data={sorted}
        margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
        barCategoryGap="40%"
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          type="number"
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 10, fill: "#6b7280" }}
        />
        <YAxis
          type="category"
          dataKey="nome"
          width={130}
          tick={{ fontSize: 11, fill: "#374151" }}
        />
        <Tooltip content={<CuidadoTooltip />} />
        <Bar dataKey="percentual" name="% Pacientes" fill={COLORS.cuidado} radius={[0, 3, 3, 0]}>
          <LabelList
            dataKey="percentual"
            position="right"
            formatter={(v: number) => `${v}%`}
            style={{ fontSize: 10, fill: "#374151", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Sub-componente: gráfico de desvios ───────────────────────────────────────
function DesvioChart({
  data,
  order,
}: {
  data: SetorDesvio[];
  order: "maior" | "menor";
}) {
  const sorted = [...data].sort((a, b) => {
    const totalA = a.subutilizacao + a.risco;
    const totalB = b.subutilizacao + b.risco;
    return order === "maior" ? totalB - totalA : totalA - totalB;
  });

  return (
    <ResponsiveContainer width="100%" height={sorted.length * 52 + 40}>
      <BarChart
        layout="vertical"
        data={sorted}
        margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
        barCategoryGap="30%"
        barGap={3}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "#6b7280" }}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="nome"
          width={130}
          tick={{ fontSize: 11, fill: "#374151" }}
        />
        <Tooltip content={<DesvioTooltip />} />
        <Legend
          iconType="square"
          iconSize={10}
          formatter={(value) => (
            <span className="text-xs text-gray-600">{value}</span>
          )}
        />
        <Bar
          dataKey="subutilizacao"
          name="Subutilização"
          fill={COLORS.subutilizado}
          radius={[0, 3, 3, 0]}
        >
          <LabelList
            dataKey="subutilizacao"
            position="right"
            style={{ fontSize: 10, fill: "#374151", fontWeight: 600 }}
          />
        </Bar>
        <Bar
          dataKey="risco"
          name="Risco"
          fill={COLORS.risco}
          radius={[0, 3, 3, 0]}
        >
          <LabelList
            dataKey="risco"
            position="right"
            style={{ fontSize: 10, fill: "#374151", fontWeight: 600 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Componente Toggle Ordenação ──────────────────────────────────────────────
function OrdemToggle({
  value,
  onChange,
}: {
  value: "maior" | "menor";
  onChange: (v: "maior" | "menor") => void;
}) {
  const isMenor = value === "menor";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">Ordenação</span>
      <div className="flex items-center gap-2">
        <span
          className={
            !isMenor
              ? "text-xs font-medium text-foreground whitespace-nowrap"
              : "text-xs text-muted-foreground whitespace-nowrap"
          }
        >
          Maior
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isMenor}
          onClick={() => onChange(isMenor ? "maior" : "menor")}
          className={
            "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors " +
            (isMenor
              ? "bg-primary/10 border-primary/40"
              : "bg-muted border-border")
          }
        >
          <span
            className={
              "inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform " +
              (isMenor ? "translate-x-5" : "translate-x-0")
            }
          />
        </button>
        <span
          className={
            isMenor
              ? "text-xs font-medium text-foreground whitespace-nowrap"
              : "text-xs text-muted-foreground whitespace-nowrap"
          }
        >
          Menor
        </span>
      </div>
    </div>
  );
}

// ─── Aba Global ───────────────────────────────────────────────────────────────
function GlobalTab({ data }: { data: TermometroData }) {
  const [ordemOcupacao, setOrdemOcupacao] = useState<"maior" | "menor">("maior");
  const [ordemNivel, setOrdemNivel] = useState<"maior" | "menor">("maior");
  const [ordemDesvio, setOrdemDesvio] = useState<"maior" | "menor">("maior");
  const [nivelSelecionado, setNivelSelecionado] = useState<NivelCuidado>("INTENSIVOS");

  const nivelAtivo = data.niveis.find((n) => n.nivel === nivelSelecionado)!;

  return (
    <div className="space-y-4">
      {/* ── Cards de Resumo ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Ocupação + Avaliados */}
        <Card className="shadow-[0_4px_12px_rgba(0,93,151,0.3)] border-l-4 border-[#005D97]">
          <CardContent className="pt-6 pb-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-muted-foreground">Taxa de Ocupação</p>
                <p className="text-3xl font-bold leading-tight text-foreground">
                  {data.taxaOcupacaoHospital}%
                </p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <p className="text-sm font-medium text-muted-foreground">Leitos Avaliados</p>
                <p className="text-3xl font-bold leading-tight text-foreground">
                  {data.leitosAvaliadosHospital}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Data + Nível predominante */}
        <Card className="shadow-[0_4px_12px_rgba(0,112,185,0.3)] border-l-4 border-[#0070B9]">
          <CardContent className="pt-6 pb-4 flex flex-col gap-3 justify-center h-full">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data</p>
                <p className="mt-0.5 font-bold text-base">{data.data}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nível Predominante</p>
                <Badge
                  variant="outline"
                  className={`mt-0.5 font-semibold ${
                    NIVEL_COLORS[
                      data.niveis.find((n) => n.label === data.nivelPredominante)
                        ?.nivel ?? "SEMI_INTENSIVOS"
                    ]
                  }`}
                >
                  {data.nivelPredominante}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Desvios de Perfil */}
        <Card className="shadow-[0_4px_12px_rgba(38,140,204,0.3)] border-l-4 border-[#268CCC]">
          <CardContent className="pt-6 pb-4 flex flex-col items-center justify-center gap-1 h-full">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Desvios de Perfil
            </div>
            <p className="text-5xl font-bold leading-tight text-foreground">
              {data.desviosPerfil}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Gráficos ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico 1: Taxa de Ocupação */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Taxa de Ocupação</CardTitle>
              <OrdemToggle value={ordemOcupacao} onChange={setOrdemOcupacao} />
            </div>
            <p className="text-xs text-muted-foreground">Ranking por Setores</p>
          </CardHeader>
          <CardContent className="pb-4">
            <OcupacaoChart data={data.setoresOcupacao} order={ordemOcupacao} />
          </CardContent>
        </Card>

        {/* Gráfico 2: Ranking por Nível de Cuidados */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Ranking por Nível de Cuidados</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pb-4 space-y-3">
            {/* Tabs de nível */}
            <div className="flex flex-wrap gap-1">
              {data.niveis.map((n) => (
                <button
                  key={n.nivel}
                  onClick={() => setNivelSelecionado(n.nivel as NivelCuidado)}
                  className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                    nivelSelecionado === n.nivel
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-600 border-gray-200 hover:border-primary/40"
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>

            {/* Controle de ordenação + gráfico */}
            <div className="flex justify-between items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Ranking por Setores (%)
              </span>
              <OrdemToggle value={ordemNivel} onChange={setOrdemNivel} />
            </div>
            <NivelCuidadoChart
              setores={nivelAtivo.setores}
              order={ordemNivel}
            />
          </CardContent>
        </Card>

        {/* Gráfico 3: Desvios de Perfil */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Desvios de Perfil</CardTitle>
              <OrdemToggle value={ordemDesvio} onChange={setOrdemDesvio} />
            </div>
            <div className="flex gap-4 text-[10px] font-semibold text-gray-500 mt-1">
              <span>SUBUTILIZAÇÃO</span>
              <span>RISCO</span>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <DesvioChart data={data.setoresDesvio} order={ordemDesvio} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Tipos adicionais para Detalhamento ─────────────────────────────────────
interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

// Cores fixas para os donuts (o backend não envia cores)
const ESTADOS_LEITOS_COLORS: Record<string, string> = {
  "Leito Ocupado": "#005D97",
  "Leito Não Avaliado": "#7DB9D9",
  "Leito Inativo": "#9CA3AF",
  "Leito Vago": "#D1D5DB",
};

const NIVEIS_CUIDADO_COLORS: Record<string, string> = {
  "Cuidado Mínimo": "#BAE6FD",
  "Cuidado Intermediário": "#38BDF8",
  "Alta Dependência": "#FCD34D",
  "Semi-Intensivo": "#FB923C",
  "Intensivo": "#EF4444",
};

const SNAPSHOT_NIVEIS_COLORS: Record<string, string> = {
  "Mínimos": "#38BDF8",
  "Intermediários": "#FB923C",
  "Alta Dependência": "#22C55E",
  "Semi-Intensivo": "#3B82F6",
  "Intensivos": "#A855F7",
};

function addDonutColors(
  items: { name: string; value: number }[],
  colorMap: Record<string, string>,
  fallbackColors: string[] = ["#6B7280"]
): DonutSlice[] {
  return items.map((item, i) => ({
    ...item,
    color: colorMap[item.name] ?? fallbackColors[i % fallbackColors.length],
  }));
}

// ─── Helpers para Série Histórica ────────────────────────────────────────────

function formatPeriodoLabel(ini: string, fim: string): string {
  if (ini === fim) return new Date(ini + "T12:00:00").toLocaleDateString("pt-BR");
  return `${new Date(ini + "T12:00:00").toLocaleDateString("pt-BR")} – ${new Date(fim + "T12:00:00").toLocaleDateString("pt-BR")}`;
}

// ─── Gráfico Donut ────────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;

function DonutSliceLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function DonutChart({ data, title }: { data: DonutSlice[]; title: string }) {
  return (
    <div className="flex flex-col items-center h-full">
      <p className="text-sm font-semibold text-gray-700 mb-2 self-start">{title}</p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={80}
            dataKey="value"
            labelLine={false}
            label={DonutSliceLabel}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3 w-full max-w-[260px]">
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-1.5 text-[10px] text-gray-600"
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Aba Perfil (dentro de Detalhamento) ─────────────────────────────────────
function PerfilSubTab({ data }: { data: TermometroDetalhamentoResponse }) {
  const estadosComCor = addDonutColors(data.estadosLeitos, ESTADOS_LEITOS_COLORS);
  const niveisComCor = addDonutColors(data.niveisCuidado, NIVEIS_CUIDADO_COLORS);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 items-start">
      <div className="flex justify-center border rounded-lg p-4 bg-white">
        <DonutChart data={estadosComCor} title="Estados dos Leitos" />
      </div>
      <div className="flex justify-center border rounded-lg p-4 bg-white">
        <DonutChart data={niveisComCor} title="Níveis de Cuidado" />
      </div>
    </div>
  );
}

// ─── Aba Série Histórica ─────────────────────────────────────────────────────
interface SerieHistoricaSubTabProps {
  hospitalId: string;
  setorId?: string;
  dataInicial: string;
  dataFinal: string;
  isHoje: boolean;
}

function SerieHistoricaSubTab({ hospitalId, setorId, dataInicial, dataFinal, isHoje }: SerieHistoricaSubTabProps) {
  const [data, setData] = useState<TermometroSerieHistoricaResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTermometroSerieHistorica(hospitalId, {
      dataInicial,
      dataFinal,
      ...(setorId ? { setorId } : {}),
    })
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => console.error("Erro ao carregar série histórica:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hospitalId, setorId, dataInicial, dataFinal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  if (isHoje && data.snapshotHoje) {
    const snap = data.snapshotHoje;
    const hoje = new Date().toLocaleDateString("pt-BR");
    const overMax = snap.taxaMaxima > 0 && snap.taxaOcupacao > snap.taxaMaxima;
    const niveisComCor = snap.niveis.map((n, i) => ({
      ...n,
      color: SNAPSHOT_NIVEIS_COLORS[n.name] ?? ["#38BDF8","#FB923C","#22C55E","#3B82F6","#A855F7"][i % 5],
    }));
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Taxa de Ocupação – snapshot */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Taxa de Ocupação
              <span className="ml-1 text-xs text-muted-foreground font-normal">({hoje})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 flex flex-col gap-4">
            <div className="flex items-end gap-2">
              <span
                className="text-5xl font-bold"
                style={{ color: overMax ? "#ef4444" : "#005D97" }}
              >
                {snap.taxaOcupacao}%
              </span>
              <span className="text-sm text-muted-foreground mb-1">ocupação atual</span>
            </div>
            {/* Barra de progresso */}
            <div className="relative h-5 bg-gray-100 rounded-full overflow-visible">
              {/* Barra de preenchimento */}
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(snap.taxaOcupacao, 100)}%`,
                  background: overMax ? "#ef4444" : "#005D97",
                }}
              />
              {/* Marcador da taxa máxima */}
              <div
                className="absolute top-0 h-full w-0.5 bg-red-400"
                style={{ left: `${snap.taxaMaxima}%` }}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block w-5 h-0.5 bg-red-400" />
              Taxa Máxima Atendível:&nbsp;
              <span className="font-semibold text-red-500">{snap.taxaMaxima}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Níveis de Cuidados – snapshot */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Níveis de Cuidados
              <span className="ml-1 text-xs text-muted-foreground font-normal">({hoje})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={niveisComCor}
                layout="vertical"
                margin={{ top: 4, right: 40, left: 0, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={115}
                  tick={{ fontSize: 11, fill: "#374151" }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const item = niveisComCor.find((n) => n.name === label);
                    return (
                      <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          Pacientes:&nbsp;
                          <span className="font-medium text-foreground">{item?.value ?? 0}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Percentual:&nbsp;
                          <span className="font-medium text-foreground">{payload[0].value}%</span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="percentual" name="%" maxBarSize={22} radius={[0, 3, 3, 0]}>
                  {niveisComCor.map((n, i) => (
                    <Cell key={i} fill={n.color} />
                  ))}
                  <LabelList
                    dataKey="percentual"
                    position="right"
                    formatter={(v: number) => `${v}%`}
                    style={{ fontSize: 11, fontWeight: 600, fill: "#374151" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gran = data.granularidade;
  const periodoLabel = formatPeriodoLabel(dataInicial, dataFinal);

  const ocupacao = data.ocupacao.map((p) => ({ label: p.label, taxa: p.taxa, taxaMaxima: p.taxaMaxima }));
  const niveis = data.niveis.map((p) => ({
    label: p.label,
    minimos: p.minimos,
    intermediarios: p.intermediarios,
    altaDependencia: p.altaDependencia,
    semiIntensivos: p.semiIntensivos,
    intensivos: p.intensivos,
    qtdMinimos: p.qtdMinimos ?? 0,
    qtdIntermediarios: p.qtdIntermediarios ?? 0,
    qtdAltaDependencia: p.qtdAltaDependencia ?? 0,
    qtdSemiIntensivos: p.qtdSemiIntensivos ?? 0,
    qtdIntensivos: p.qtdIntensivos ?? 0,
    qtdTotal: p.qtdTotal ?? 0,
  }));

  // Ticks inclinados quando há muitos pontos (> 14 dias)
  const manyPoints = ocupacao.length > 14;
  const xTickProps = manyPoints
    ? { fontSize: 9, fill: "#374151", angle: -45, textAnchor: "end" as const }
    : { fontSize: 11, fill: "#374151" };
  const bottomMargin = manyPoints ? 48 : 8;

  const granLabel = gran === "dia" ? "por Dia" : "por Mês";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
      {/* ── Taxa de Ocupação ─────────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold text-gray-700">
            Taxa de Ocupação – {granLabel}
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              ({periodoLabel})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart
              data={ocupacao}
              margin={{ top: 8, right: 24, left: 0, bottom: bottomMargin }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={xTickProps} interval="preserveStartEnd" />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10, fill: "#6b7280" }}
              />
              <Tooltip content={<GenericPctTooltip />} />
              <Legend
                iconSize={10}
                formatter={(value) => (
                  <span className="text-xs text-gray-600">{value}</span>
                )}
              />
              <Bar
                dataKey="taxa"
                name="Taxa de Ocupação"
                fill="#005D97"
                maxBarSize={gran === "dia" ? 12 : 48}
                radius={[3, 3, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="taxaMaxima"
                name="Taxa Máxima Atendível"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                strokeDasharray="6 3"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Níveis de Cuidados ───────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-semibold text-gray-700">
            Níveis de Cuidados – {granLabel}
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              ({periodoLabel})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={niveis}
              margin={{ top: 8, right: 24, left: 0, bottom: bottomMargin }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={xTickProps} interval="preserveStartEnd" />
              <YAxis
                domain={[0, "auto"]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10, fill: "#6b7280" }}
              />
              <Tooltip content={<NiveisSerieTooltip />} />
              <Legend
                iconSize={10}
                formatter={(value) => (
                  <span className="text-xs text-gray-600">{value}</span>
                )}
              />
              <Line type="monotone" dataKey="minimos"        name="Mínimos"         stroke="#38BDF8" strokeWidth={2} dot={gran !== "dia"} />
              <Line type="monotone" dataKey="intermediarios" name="Intermediários"   stroke="#FB923C" strokeWidth={2} dot={gran !== "dia"} />
              <Line type="monotone" dataKey="altaDependencia"name="Alta Dependência" stroke="#22C55E" strokeWidth={2} dot={gran !== "dia"} />
              <Line type="monotone" dataKey="semiIntensivos" name="Semi-Intensivo"   stroke="#3B82F6" strokeWidth={2} dot={gran !== "dia"} />
              <Line type="monotone" dataKey="intensivos"     name="Intensivos"       stroke="#A855F7" strokeWidth={2} dot={gran !== "dia"} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Aba Detalhamento ─────────────────────────────────────────────────────────
function getLocalDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function DetalhamentoTab({ hospitalId }: { hospitalId: string }) {
  const hoje = getLocalDateStr();
  const [setorId, setSetorId] = useState<string | undefined>(undefined);
  const [usarPeriodo, setUsarPeriodo] = useState(false);
  const [dataInicial, setDataInicial] = useState(hoje);
  const [dataFinal, setDataFinal] = useState(hoje);
  const [d, setD] = useState<TermometroDetalhamentoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetalhamento = useCallback(() => {
    setLoading(true);
    getTermometroDetalhamento(hospitalId, {
      ...(setorId ? { setorId } : {}),
      dataInicial: usarPeriodo ? dataInicial : hoje,
      dataFinal: usarPeriodo ? dataFinal : hoje,
    })
      .then(setD)
      .catch((err) => console.error("Erro ao carregar detalhamento:", err))
      .finally(() => setLoading(false));
  }, [hospitalId, setorId, usarPeriodo, dataInicial, dataFinal, hoje]);

  useEffect(() => { fetchDetalhamento(); }, [fetchDetalhamento]);

  if (loading || !d) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleHoje = () => {
    setUsarPeriodo(false);
    setDataInicial(hoje);
    setDataFinal(hoje);
  };

  const nivelClass = NIVEL_COLORS[d.nivelPredominante as NivelCuidado] ?? "";

  return (
    <div className="space-y-4">
      {/* ── Cards de Resumo ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Taxa Ocupação + Leitos Avaliados */}
        <Card className="shadow-[0_4px_12px_rgba(0,93,151,0.3)] border-l-4 border-[#005D97]">
          <CardContent className="pt-6 pb-4">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Taxa de Ocupação Média</p>
                <h3 className="mt-2 font-bold leading-tight tabular-nums text-[clamp(1.05rem,1.8vw,1.5rem)]">
                  {d.taxaOcupacaoMedia}%
                </h3>
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-medium text-muted-foreground">Leitos Avaliados</p>
                <h3 className="mt-2 font-bold leading-tight tabular-nums text-[clamp(1.05rem,1.8vw,1.5rem)]">
                  {d.leitosAvaliadosPerc}%
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Leitos + Total Avaliações */}
        <Card className="shadow-[0_4px_12px_rgba(0,112,185,0.3)] border-l-4 border-[#0070B9]">
          <CardContent className="pt-6 pb-4">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Total de Leitos</p>
                <h3 className="mt-2 font-bold leading-tight tabular-nums text-[clamp(1.05rem,1.8vw,1.5rem)]">
                  {d.totalLeitos}
                </h3>
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-medium text-muted-foreground">Total de Avaliações</p>
                <h3 className="mt-2 font-bold leading-tight tabular-nums text-[clamp(1.05rem,1.8vw,1.5rem)]">
                  {d.totalAvaliacoes}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Método SCP + Nível Predominante */}
        <Card className="shadow-[0_4px_12px_rgba(38,140,204,0.3)] border-l-4 border-[#268CCC]">
          <CardContent className="pt-6 pb-4">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Método SCP</p>
                <h3 className="mt-2 font-bold leading-tight text-[clamp(1.05rem,1.8vw,1.5rem)]">
                  {d.metodoScp}
                </h3>
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-sm font-medium text-muted-foreground">Nível Predominante</p>
                <Badge variant="outline" className={`mt-2 font-semibold ${nivelClass}`}>
                  {d.nivelPredominanteLabel}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Desvios / Riscos / Subutilização */}
        <Card className="shadow-[0_4px_12px_rgba(249,115,22,0.25)] border-l-4 border-orange-400">
          <CardContent className="pt-6 pb-4 flex flex-col justify-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">Desvios de Perfil</p>
            <div className="flex gap-4 items-end">
              <div className="flex flex-col items-center">
                <p className="text-2xl font-bold tabular-nums text-foreground">{d.desvios}</p>
                <p className="text-xs text-muted-foreground">Desvios</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-2xl font-bold tabular-nums text-orange-500">{d.riscos}</p>
                <p className="text-xs text-muted-foreground">Riscos</p>
              </div>
              <div className="flex flex-col items-center">
                <p className="text-2xl font-bold tabular-nums text-[#005D97]">{d.subutilizacao}</p>
                <p className="text-xs text-muted-foreground">Subutilização</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 border rounded-lg">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-medium whitespace-nowrap">
            Filtrar por setor:
          </label>
          <select
            value={setorId ?? ""}
            onChange={(e) => setSetorId(e.target.value || undefined)}
            className="text-xs border border-input rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {d.setores.map((s) => (
              <option key={s.id ?? "todos"} value={s.id ?? ""}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <span
            className={
              !usarPeriodo
                ? "text-xs font-semibold text-foreground whitespace-nowrap"
                : "text-xs text-muted-foreground whitespace-nowrap"
            }
          >
            Hoje
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={usarPeriodo}
            onClick={() => setUsarPeriodo((p) => !p)}
            className={
              "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors " +
              (usarPeriodo
                ? "bg-primary/10 border-primary/40"
                : "bg-muted border-border")
            }
          >
            <span
              className={
                "inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform " +
                (usarPeriodo ? "translate-x-5" : "translate-x-0")
              }
            />
          </button>
          <span
            className={
              usarPeriodo
                ? "text-xs font-semibold text-foreground whitespace-nowrap"
                : "text-xs text-muted-foreground whitespace-nowrap"
            }
          >
            Período
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-primary font-medium">
              Data inicial
            </label>
            <input
              type="date"
              value={dataInicial}
              max={dataFinal}
              disabled={!usarPeriodo}
              onChange={(e) => setDataInicial(e.target.value)}
              className="text-sm border border-input rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <label className="text-xs text-primary font-medium">
              Data final
            </label>
            <input
              type="date"
              value={dataFinal}
              min={dataInicial}
              max={hoje}
              disabled={!usarPeriodo}
              onChange={(e) => setDataFinal(e.target.value)}
              className="text-sm border border-input rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* ── Sub-tabs Perfil / Série Histórica ── */}
      <Tabs defaultValue="perfil">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="serie">Série Histórica</TabsTrigger>
        </TabsList>
        <TabsContent value="perfil">
          <PerfilSubTab data={d} />
        </TabsContent>
        <TabsContent value="serie">
          <SerieHistoricaSubTab
            hospitalId={hospitalId}
            setorId={setorId}
            dataInicial={usarPeriodo ? dataInicial : hoje}
            dataFinal={usarPeriodo ? dataFinal : hoje}
            isHoje={!usarPeriodo}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
interface DashboardTermometroScreenProps {
  title?: string;
  hospitalId?: string;
}

export const DashboardTermometroScreen: React.FC<
  DashboardTermometroScreenProps
> = ({ title = "Análise Técnica", hospitalId }) => {
  const [globalData, setGlobalData] = useState<TermometroGlobalResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) return;
    let cancelled = false;
    setLoading(true);
    getTermometroGlobal(hospitalId)
      .then((res) => { if (!cancelled) setGlobalData(res); })
      .catch((err) => console.error("Erro ao carregar dados globais:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [hospitalId]);

  if (!hospitalId) {
    return (
      <Card className="animate-fade-in-down shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum hospital selecionado.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in-down shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="global">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="detalhamento">Detalhamento</TabsTrigger>
          </TabsList>

          <TabsContent value="global">
            {loading || !globalData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <GlobalTab data={globalData} />
            )}
          </TabsContent>

          <TabsContent value="detalhamento">
            <DetalhamentoTab hospitalId={hospitalId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
