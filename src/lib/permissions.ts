export type Permissao =
  | "ADMIN"
  | "AVALIADOR"
  | "GESTOR_TATICO_TEC_ADM"
  | "GESTOR_TATICO_TECNICO"
  | "GESTOR_TATICO_ADM"
  | "GESTOR_ESTRATEGICO_HOSPITAL"
  | "GESTOR_ESTRATEGICO_REDE";

/** Returns true if the user's tipo is in the allowed list. */
export function can(tipo: string | null | undefined, ...allowed: Permissao[]): boolean {
  return !!tipo && (allowed as string[]).includes(tipo);
}

// ─── Dashboard tabs ──────────────────────────────────────────────────────────

/** Baseline tab: administrative / strategic profiles */
export const PERM_DASHBOARD_BASELINE: Permissao[] = [
  "ADMIN",
  "GESTOR_TATICO_TEC_ADM",
  "GESTOR_TATICO_ADM",
  "GESTOR_ESTRATEGICO_HOSPITAL",
  "GESTOR_ESTRATEGICO_REDE",
];

/** Termômetro tab: technical / clinical profiles */
export const PERM_DASHBOARD_TERMOMETRO: Permissao[] = [
  "ADMIN",
  "GESTOR_TATICO_TEC_ADM",
  "GESTOR_TATICO_TECNICO",
  "GESTOR_ESTRATEGICO_HOSPITAL",
  "GESTOR_ESTRATEGICO_REDE",
];

/** Atual, Projetado, Comparativo tabs: ADMIN only */
export const PERM_DASHBOARD_FINANCEIRO: Permissao[] = ["ADMIN"];

// ─── Hospital pages ──────────────────────────────────────────────────────────

/** Can open the Dashboard page at all (has at least one visible tab) */
export const PERM_SEE_DASHBOARD: Permissao[] = [
  "ADMIN",
  "GESTOR_TATICO_TEC_ADM",
  "GESTOR_TATICO_TECNICO",
  "GESTOR_TATICO_ADM",
  "GESTOR_ESTRATEGICO_HOSPITAL",
  "GESTOR_ESTRATEGICO_REDE",
];

export const PERM_PARETO: Permissao[] = [
  "ADMIN",
  "GESTOR_TATICO_TEC_ADM",
  "GESTOR_TATICO_ADM",
  "GESTOR_ESTRATEGICO_HOSPITAL",
  "GESTOR_ESTRATEGICO_REDE",
];

/** Gerir Setores (card view + full management) */
export const PERM_SETORES: Permissao[] = [
  "ADMIN",
  "GESTOR_TATICO_TEC_ADM",
  "GESTOR_TATICO_TECNICO",
  "GESTOR_TATICO_ADM",
  "GESTOR_ESTRATEGICO_HOSPITAL",
  "GESTOR_ESTRATEGICO_REDE",
];

/** Unidades e Leitos: all roles including AVALIADOR */
export const PERM_UNIDADES_LEITOS: Permissao[] = [
  "ADMIN",
  "AVALIADOR",
  "GESTOR_TATICO_TEC_ADM",
  "GESTOR_TATICO_TECNICO",
  "GESTOR_TATICO_ADM",
  "GESTOR_ESTRATEGICO_HOSPITAL",
  "GESTOR_ESTRATEGICO_REDE",
];

/** Baseline page: all roles */
export const PERM_BASELINE: Permissao[] = [
  "ADMIN",
  "AVALIADOR",
  "GESTOR_TATICO_TEC_ADM",
  "GESTOR_TATICO_TECNICO",
  "GESTOR_TATICO_ADM",
  "GESTOR_ESTRATEGICO_HOSPITAL",
  "GESTOR_ESTRATEGICO_REDE",
];

/** Usuários page: all roles (read-only for non-ADMIN) */
export const PERM_USUARIOS: Permissao[] = [
  "ADMIN",
  "AVALIADOR",
  "GESTOR_TATICO_TEC_ADM",
  "GESTOR_TATICO_TECNICO",
  "GESTOR_TATICO_ADM",
  "GESTOR_ESTRATEGICO_HOSPITAL",
  "GESTOR_ESTRATEGICO_REDE",
];

export const PERM_CARGOS: Permissao[] = [
  "ADMIN",
  "GESTOR_TATICO_TEC_ADM",
  "GESTOR_TATICO_ADM",
  "GESTOR_ESTRATEGICO_HOSPITAL",
  "GESTOR_ESTRATEGICO_REDE",
];

/** Setores (cadastros / dimensionar) */
export const PERM_SETORES_CADASTRO: Permissao[] = [
  "ADMIN",
  "GESTOR_TATICO_TEC_ADM",
  "GESTOR_TATICO_TECNICO",
  "GESTOR_TATICO_ADM",
  "GESTOR_ESTRATEGICO_HOSPITAL",
  "GESTOR_ESTRATEGICO_REDE",
];
