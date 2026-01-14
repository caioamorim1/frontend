import type { ReactNode } from "react";
import { buildFileUrl } from "@/lib/api";

interface HospitalHeaderProps {
  hospitalName?: string;
  hospitalPhoto?: string | null;
  userName?: string;
  subtitle?: ReactNode;
  className?: string;
}

export function HospitalHeader({
  hospitalName,
  hospitalPhoto,
  userName,
  subtitle,
  className,
}: HospitalHeaderProps) {
  return (
    <div
      className={
        className ??
        "bg-gradient-to-r from-primary to-primary/80 rounded-lg p-8 text-white shadow-lg"
      }
    >
      <div className="flex items-center gap-6">
        {!!hospitalPhoto && (
          <div className="flex-shrink-0">
            <img
              src={buildFileUrl(hospitalPhoto)}
              alt={`Logo ${hospitalName ?? "Hospital"}`}
              className="w-24 h-24 object-contain bg-white rounded-lg p-2"
            />
          </div>
        )}

        <div className="flex-1">
          <h1 className="text-4xl font-bold mb-2">
            {hospitalName || "Hospital"}
          </h1>
          <p className="text-lg opacity-90">
            {subtitle ?? `Bem vindo, ${userName || "@USER"}`}
          </p>
        </div>
      </div>
    </div>
  );
}
