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
    const formattedValue = valueInMillions.toFixed(2);
    return `R$ ${formattedValue} M`;
  }

  // Se o valor for 1 mil ou mais, formata como "k"
  if (amount >= 1_000) {
    const valueInThousands = amount / 1_000;
    // Formata com 2 casas decimais usando ponto
    const formattedValue = valueInThousands.toFixed(2);
    return `R$ ${formattedValue} k`;
  }

  // Para valores menores que 1000, usa a formatação padrão
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}
