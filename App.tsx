import React, { useState } from 'react';
import { EditTab } from './components/EditTab';
import { GenerateTab } from './components/GenerateTab';
import { VideoTab } from './components/VideoTab';
import { Icon } from './components/Icon';

type Tab = 'generate' | 'edit' | 'video';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'generate':
        return <GenerateTab />;
      case 'edit':
        return <EditTab />;
      case 'video':
        return <VideoTab />;
      default:
        return null;
    }
  };

  const TabButton = ({ tab, label, iconName }: { tab: Tab; label: string; iconName: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-brand-primary rounded-md ${
        activeTab === tab
          ? 'bg-brand-primary text-white shadow-lg'
          : 'bg-base-300 text-content hover:bg-base-200'
      }`}
    >
      <Icon name={iconName} className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-base-100 text-content font-sans flex flex-col">
      <header className="bg-base-200/50 backdrop-blur-sm sticky top-0 z-10 border-b border-base-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
               <Icon name="logo" className="w-8 h-8 text-brand-primary" />
              <h1 className="text-xl font-bold text-gray-100">AI Studio</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-base-200 p-2 rounded-lg shadow-md mb-8 flex flex-wrap gap-2">
            <TabButton tab="generate" label="Generate Image" iconName="image" />
            <TabButton tab="edit" label="Edit Image" iconName="magic" />
            <TabButton tab="video" label="Generate Video" iconName="film" />
          </div>
          <div>{renderTabContent()}</div>
        </div>
      </main>

      <footer className="bg-base-200 py-4 mt-8">
        <div className="container mx-auto text-center text-sm text-gray-400">
          <p>Powered by Gemini API</p>
        </div>
      </footer>
    </div>
  );
};

export default App;