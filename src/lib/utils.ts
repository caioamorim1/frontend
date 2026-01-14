import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmountBRL(amount: number): string {
  // Se o valor for 1 milhão ou mais, formata como "M"
  if (amount >= 1_000_000) {
    const valueInMillions = amount / 1_000_000;
    // Formata com 2 casas decimais usando ponto
    const formattedValue = valueInMillions.toFixed(3);
    return `R$ ${formattedValue} M`;
  }

  // Se o valor for 1 mil ou mais, formata como "k"
  if (amount >= 1_000) {
    const valueInThousands = amount / 1_000;
    // Formata com 2 casas decimais usando ponto
    const formattedValue = valueInThousands.toFixed(3);
    return `R$ ${formattedValue}`;
  }

  // Para valores menores que 1000, usa a formatação padrão
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
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
