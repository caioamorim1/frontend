import React from 'react';
import { LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-2 py-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">Sistema de Avaliações</h1>
        </div>

      </div>
    </header>
  );
};