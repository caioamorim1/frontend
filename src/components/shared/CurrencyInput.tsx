import React, { useState, useEffect, useRef } from "react";

// Formata em tempo real conforme digita
const formatCurrencyWhileTyping = (value: string): string => {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, "");

  if (!numbers) return "";

  // Converte para número com centavos
  const amount = parseFloat(numbers) / 100;

  // Formata como BRL
  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Extrai o valor numérico
const parseValue = (formattedValue: string): string => {
  const numbers = formattedValue.replace(/\D/g, "");
  if (!numbers) return "0";
  return (parseFloat(numbers) / 100).toFixed(2);
};

interface CurrencyInputProps {
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "R$ 0,00",
  className = "",
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Inicializa com o valor formatado
  useEffect(() => {
    const numValue =
      typeof value === "string" ? parseFloat(value || "0") : value;
    const cents = Math.round(numValue * 100).toString();
    const formatted = formatCurrencyWhileTyping(cents);
    setDisplayValue(formatted);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    // Pega apenas os números digitados
    const numbers = input.replace(/\D/g, "");

    // Formata
    const formatted = formatCurrencyWhileTyping(numbers);

    // Atualiza o display
    setDisplayValue(formatted);

    // Atualiza o valor no formato numérico
    onChange(parseValue(formatted));

    // Mantém o cursor no final (melhor UX para dinheiro)
    setTimeout(() => {
      if (inputRef.current) {
        const newLength = formatted.length;
        inputRef.current.setSelectionRange(newLength, newLength);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permite: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].includes(e.keyCode)) {
      return;
    }

    // Permite apenas números
    if (
      (e.keyCode < 48 || e.keyCode > 57) &&
      (e.keyCode < 96 || e.keyCode > 105)
    ) {
      e.preventDefault();
    }
  };

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`p-2 border rounded-md ${className}`}
    />
  );
}
