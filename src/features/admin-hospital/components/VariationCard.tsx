// src/features/admin-hospital/components/VariationCard.tsx

import React from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VariationCardProps {
  title: string;
  value: string;
  isReduction: boolean | null;
  icon: React.ReactNode;
  footer?: string;
}

export const VariationCard: React.FC<VariationCardProps> = ({
  title,
  value,
  isReduction,
  icon,
  footer,
}) => {
  const isPositive = isReduction === false;
  const isNegative = isReduction === true;

  // Determinar variant baseado na redução/aumento (usando cores do projeto)
  const variantStyles = isNegative
    ? "shadow-[0_4px_12px_rgba(38,140,204,0.3)] border-l-4 border-[#268CCC]" // success (redução = positivo)
    : isPositive
      ? "shadow-[0_4px_12px_rgba(0,112,185,0.3)] border-l-4 border-[#0070B9]" // warning (aumento)
      : "shadow-[0_4px_12px_rgba(0,93,151,0.3)] border-l-4 border-[#005D97]"; // primary (neutro)

  return (
    <Card className={variantStyles}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground break-words">
              {title}
            </p>
            <div className="flex items-center mt-2 font-bold leading-tight tabular-nums break-words text-[clamp(1.05rem,1.8vw,1.5rem)]">
              {isNegative && (
                <ArrowUp className="h-6 w-6 mr-1 text-green-600" />
              )}
              {isPositive && (
                <ArrowDown className="h-6 w-6 mr-1 text-red-600" />
              )}
              <span>{value}</span>
            </div>
            {footer && (
              <p className="mt-1 text-sm text-muted-foreground leading-snug break-words">
                {footer}
              </p>
            )}
          </div>
          <div className="shrink-0 text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};
