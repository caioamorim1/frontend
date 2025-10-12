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
