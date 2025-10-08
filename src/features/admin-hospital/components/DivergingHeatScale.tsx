import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from 'lucide-react';

interface DivergingHeatScaleProps {
  title: string;
  atual: number;
  projetado: number;
  variacao: number;
}

export const DivergingHeatScale: React.FC<DivergingHeatScaleProps> = ({ title, atual, projetado, variacao }) => {
  const isReduction = variacao > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4">
        <div className="w-full flex justify-around items-center text-center">
          <div>
            <p className="text-sm text-muted-foreground">Atual</p>
            <p className="text-3xl font-bold text-primary">{atual}</p>
          </div>
          <div className={`flex items-center font-bold ${isReduction ? 'text-destructive' : 'text-success'}`}>
            {isReduction ? <ArrowDown size={24} /> : <ArrowUp size={24} />}
            <span className="text-2xl">{variacao}</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Projetado</p>
            <p className="text-3xl font-bold text-success">{projetado}</p>
          </div>
        </div>
        <div className="w-full h-8 bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 rounded-lg relative mt-4">
           {/* Indicador pode ser adicionado aqui se necessário */}
        </div>
         <p className="text-xs text-muted-foreground pt-2">Demonstrativo de variação do quadro de pessoal.</p>
      </CardContent>
    </Card>
  );
};