import { cn } from "@/lib/utils"; // ou sua função de utilitário para mesclar classes
import React from "react";

interface DimensionaLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function DimensionaLogo({ size = "md", className }: DimensionaLogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-4xl",
  };
  return (
    <div className={cn("font-bold text-gray-800", sizeClasses[size], className)}>
      Dimensiona+
    </div>
  );
}