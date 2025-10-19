import React, { useEffect, useRef, useState } from "react";

// Helper: format CPF 000.000.000-00
function formatCPF(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  const parts: string[] = [];
  if (digits.length > 0)
    parts.push(digits.substring(0, Math.min(3, digits.length)));
  if (digits.length > 3)
    parts.push(digits.substring(3, Math.min(6, digits.length)));
  if (digits.length > 6)
    parts.push(digits.substring(6, Math.min(9, digits.length)));
  const suffix = digits.length > 9 ? digits.substring(9, 11) : "";
  let formatted = parts.join(".");
  if (digits.length > 9) formatted += (formatted ? "-" : "") + suffix;
  return formatted;
}

export function CpfInput({
  value,
  onChange,
  placeholder = "000.000.000-00",
  className = "",
  ...props
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [display, setDisplay] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplay(formatCPF(value || ""));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    const masked = formatCPF(digits);
    setDisplay(masked);
    onChange(masked);

    // keep caret at end
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(masked.length, masked.length);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow control keys
    const allowed = [8, 9, 13, 27, 35, 36, 37, 39, 46];
    if (allowed.includes((e as any).keyCode)) return;
    // Allow numbers only
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <input
      {...props}
      ref={inputRef}
      type="text"
      value={display}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`p-2 border rounded-md ${className}`}
    />
  );
}

export function EmailInput({
  value,
  onChange,
  placeholder = "seu@email.com",
  className = "",
  ...props
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Normalize: lowercase, trim, remove spaces
    const normalized = e.target.value.toLowerCase().replace(/\s+/g, "");
    onChange(normalized);
  };

  return (
    <input
      {...props}
      ref={inputRef}
      type="email"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={`p-2 border rounded-md ${className}`}
      inputMode="email"
      autoComplete="email"
    />
  );
}
