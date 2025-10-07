import { DashboardAnalytics, hospitalDashboardMock } from "./mocksDashAtualDatabase";

/**
 * Simula uma chamada de API para buscar os dados do dashboard.
 * Retorna uma Promise que resolve com os dados após um atraso de 1 segundo.
 * @returns {Promise<DashboardAnalytics>}
 */
export const fetchDashboardAtualData = (): Promise<DashboardAnalytics> => {
    console.log("Iniciando busca dos dados...");

    return new Promise((resolve) => {
        // Simula o tempo de espera da rede (1000ms = 1 segundo)
        setTimeout(() => {
            console.log("Dados recebidos com sucesso!");
            resolve(hospitalDashboardMock);
        }, 300);
    });
};