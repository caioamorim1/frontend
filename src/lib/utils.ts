import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmountBRL(amount: number): string {
  // Formata o valor completo sem abreviações e sem centavos
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function formatDateTimePtBr(value: unknown, placeholder = "--"): string {
  if (value === null || value === undefined) return placeholder;

  const raw = value instanceof Date ? value.toISOString() : String(value);
  if (!raw || raw === placeholder) return placeholder;

  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return placeholder;

  return dt.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
