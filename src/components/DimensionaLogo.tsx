import { cn } from "@/lib/utils"; // ou sua função de utilitário para mesclar classes
import React from "react";
import logoLogin from "@/assets/logo-login.png";

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
    <div className="h-20 flex items-center justify-center border-t border-white/20 px-6 py-3 mt-auto">
      <img
        src={logoLogin}
        alt="Dimensiona+"
        className="h-16 md:h-24 lg:h-28 w-auto object-contain opacity-90"
      />
    </div>
  );
}