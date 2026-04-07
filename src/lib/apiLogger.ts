/**
 * apiLogger — dev-only interceptor que regista todas as chamadas axios.
 *
 * Uso:
 *   1. Importar e chamar `startApiLogger()` uma vez (ex: main.tsx ou api.ts)
 *   2. Navegar normalmente pela aplicação
 *   3. No console do browser correr:
 *        printApiLog()       → imprime tabela formatada
 *        exportApiLog()      → copia JSON para clipboard
 *        clearApiLog()       → limpa o registo
 */

import axios from "axios";

const STORAGE_KEY = "api_log";

interface ApiLogEntry {
  method: string;
  route: string;
  count: number;
  lastSeen: string;
}

// Normaliza URLs: substitui UUIDs, IDs numéricos e tokens por placeholders
function normalizeUrl(url: string): string {
  return url
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "/:id")
    .replace(/\/\d{5,}/g, "/:id")
    .replace(/\/[A-Za-z0-9_-]{40,}/g, "/:token")
    .replace(/\?.*$/, ""); // remove query string
}

function getLog(): ApiLogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLog(entries: ApiLogEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function recordCall(method: string, url: string) {
  const route = normalizeUrl(url);
  const key = `${method.toUpperCase()} ${route}`;
  const entries = getLog();
  const existing = entries.find((e) => `${e.method} ${e.route}` === key);

  if (existing) {
    existing.count++;
    existing.lastSeen = new Date().toISOString();
  } else {
    entries.push({
      method: method.toUpperCase(),
      route,
      count: 1,
      lastSeen: new Date().toISOString(),
    });
  }

  saveLog(entries);
}

export function startApiLogger() {
  if (typeof window === "undefined") return;

  // Interceptor de request
  axios.interceptors.request.use((config) => {
    const url = config.url || "";
    const method = config.method || "GET";
    recordCall(method, url);
    return config;
  });

  // Expõe helpers globais no browser
  (window as any).printApiLog = () => {
    const entries = getLog().sort((a, b) => a.route.localeCompare(b.route));
    console.group("📡 API Routes Log");
    console.table(
      entries.map((e) => ({
        Method: e.method,
        Route: e.route,
        Calls: e.count,
        "Last Seen": new Date(e.lastSeen).toLocaleTimeString(),
      }))
    );
    console.groupEnd();
    return entries;
  };

  (window as any).exportApiLog = () => {
    const entries = getLog().sort((a, b) => a.route.localeCompare(b.route));
    const text = entries
      .map((e) => `| ${e.method.padEnd(6)} | ${e.route} |`)
      .join("\n");
    const markdown = `| Método | Endpoint |\n|---|---|\n${text}`;
    navigator.clipboard.writeText(markdown).then(() => {
      console.log("✅ Log copiado para o clipboard em formato Markdown!");
    });
    return entries;
  };

  (window as any).clearApiLog = () => {
    localStorage.removeItem(STORAGE_KEY);
    console.log("🗑️ API log limpo.");
  };

  console.log(
    "%c[apiLogger] Activo. Comandos disponíveis: printApiLog() | exportApiLog() | clearApiLog()",
    "color: #7c3aed; font-weight: bold;"
  );
}
