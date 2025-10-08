import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowDown, ArrowUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// --- ESTRUTURA DE DADOS ---
interface DivergingScaleProps {
  title: string;
  subtitle?: string;
  atual: number;
  projetado: number;
}

// --- COMPONENTE PRINCIPAL ---
export const HeatScaleChart: React.FC<DivergingScaleProps> = ({
  title,
  subtitle,
  atual,
  projetado,
}) => {
  const variacao = atual - projetado;
  const isReduction = variacao > 0;
  const isIncrease = variacao < 0;

  // Calcula a posição do indicador na escala (0 a 100)
  const maxValue = Math.max(atual, projetado) * 1.2;
  const projetadoPercent = (projetado / maxValue) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4 pt-4">
        {/* Indicadores Numéricos */}
        <div className="w-full flex justify-around items-center text-center px-4">
          <div>
            <p className="text-sm text-muted-foreground">Atual</p>
            <p className="text-4xl font-bold text-primary">{atual}</p>
          </div>
          <div className={cn("flex items-center font-bold text-2xl",
              isReduction ? 'text-green-600' : isIncrease ? 'text-red-600' : 'text-gray-500'
          )}>
            {isReduction && <ArrowDown size={28} />}
            {isIncrease && <ArrowUp size={28} />}
            {!isReduction && !isIncrease && <ArrowRight size={28} />}
            <span className="ml-2">{Math.abs(variacao)}</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Projetado</p>
            <p className="text-4xl font-bold text-green-600">{projetado}</p>
          </div>
        </div>
        
        {/* Escala Visual */}
        <div className="w-full pt-4">
            <p className="text-xs text-center text-muted-foreground mb-2">Escala de Variação</p>
            <div className="w-full h-8 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-lg relative">
              {/* Indicador da Posição Projetada */}
              <div 
                className="absolute top-0 h-full w-1 bg-black rounded-full transition-all duration-500"
                style={{ left: `calc(${projetadoPercent}% - 2px)` }}
                title={`Projetado: ${projetado}`}
              >
                 <div className="absolute -top-3 -translate-x-1/2 w-3 h-3 bg-black rounded-full border-2 border-white"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Menor n° de Pessoal</span>
                <span>Maior n° de Pessoal</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};