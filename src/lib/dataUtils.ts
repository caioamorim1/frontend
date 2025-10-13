export const parseCost = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/,/g, "."));
  return Number.isNaN(n) ? 0 : n;
};

export const getStaffArray = (
  sector: any
): Array<{ role?: string; quantity?: number }> => {
  if (!sector) return [];
  if (Array.isArray(sector.staff)) return sector.staff;
  return [];
};

export const sumStaff = (sector: any): number => {
  const staff = getStaffArray(sector);
  return staff.reduce((s, it) => s + (it?.quantity || 0), 0);
};

// --- New helpers for projected-by-sitio support ---
export const isProjectedBySitio = (projectedStaff: any): boolean => {
  if (!projectedStaff) return false;
  if (!Array.isArray(projectedStaff)) return false;
  if (projectedStaff.length === 0) return false;
  const first = projectedStaff[0];
  return first && typeof first === "object" && "sitioId" in first;
};

// Flatten projectedStaff in sitio format into aggregated role->quantity array
export const flattenProjectedBySitio = (
  projectedStaff: any
): Array<{ role: string; quantity: number; custoPorFuncionario?: number }> => {
  if (!isProjectedBySitio(projectedStaff)) return [];
  const map = new Map<
    string,
    { role: string; quantity: number; custoPorFuncionario?: number }
  >();
  projectedStaff.forEach((sitio: any) => {
    if (!sitio || !Array.isArray(sitio.cargos)) return;
    sitio.cargos.forEach((c: any) => {
      const role = c.role || "";
      const qty = Number(c.quantity || 0);
      const custo = c.custoPorFuncionario;
      const existing = map.get(role);
      if (existing) {
        existing.quantity += qty;
        if (existing.custoPorFuncionario === undefined && custo !== undefined) {
          existing.custoPorFuncionario = custo;
        }
      } else {
        map.set(role, { role, quantity: qty, custoPorFuncionario: custo });
      }
    });
  });
  return Array.from(map.values());
};

// Compute projected cost for a sector taking into account sitio-level cargos if provided
export const computeProjectedCostFromSitios = (sector: any): number => {
  const projected = sector.projectedStaff;
  if (!isProjectedBySitio(projected)) return 0;
  const flattened = flattenProjectedBySitio(projected);
  // If custoPorFuncionario provided per cargo, use it; otherwise fallback to 0
  return flattened.reduce(
    (sum, c) =>
      sum + Number(c.custoPorFuncionario || 0) * Number(c.quantity || 0),
    0
  );
};
