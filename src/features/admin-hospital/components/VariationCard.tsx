// src/features/admin-hospital/components/VariationCard.tsx

import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VariationCardProps {
    title: string;
    value: string;
    isReduction: boolean | null;
    icon: React.ReactNode;
    footer?: string;
}

export const VariationCard: React.FC<VariationCardProps> = ({ title, value, isReduction, icon, footer }) => {
    const isPositive = isReduction === false;
    const isNegative = isReduction === true;

    return (
        <div className="block p-4 bg-white border rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
                <div className={cn(
                    "flex-shrink-0 p-3 rounded-full",
                    isNegative && "bg-green-100 text-green-700",
                    isPositive && "bg-red-100 text-red-700",
                    isReduction === null && "bg-secondary/10 text-secondary"
                )}>
                    {icon}
                </div>
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <div className={cn(
                        "flex items-center font-bold text-xl",
                        isNegative && "text-green-600",
                        isPositive && "text-red-600",
                        isReduction === null && "text-primary"
                    )}>
                        {isNegative && <ArrowDown className="h-5 w-5" />}
                        {isPositive && <ArrowUp className="h-5 w-5" />}
                        <span className="ml-1">{value}</span>
                    </div>
                     {footer && <p className="text-xs text-muted-foreground mt-1">{footer}</p>}
                </div>
            </div>
        </div>
    );
};