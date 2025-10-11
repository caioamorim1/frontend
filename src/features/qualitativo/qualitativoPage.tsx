import React, { useState } from 'react';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import { EvaluationsTab } from './components/EvaluationsTab';
import { QuestionnairesTab } from './components/QuestionnairesTab';
import { CategoriesTab } from './components/CategoriesTab';

function qualitativoPage() {
  const [activeTab, setActiveTab] = useState('questionnaires');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'questionnaires':
        return <QuestionnairesTab />;
      case 'categories':
        return <CategoriesTab />;
      default:
        return <QuestionnairesTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mt-6">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}

export default qualitativoPage;