
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import VideoGenerator from './components/VideoGenerator';
import ImageEditor from './components/ImageEditor';
import Library from './components/Library';
import Chatbot from './components/Chatbot';
import { BrollAsset, View } from './types';
import ApiKeySelector from './components/ApiKeySelector';

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.Video);
  const [library, setLibrary] = useState<BrollAsset[]>([]);

  const addToLibrary = useCallback((asset: Omit<BrollAsset, 'id'>) => {
    setLibrary(prev => [...prev, { ...asset, id: Date.now().toString() }]);
    if(asset.type === 'video') {
        setView(View.Library);
    }
  }, []);

  const renderView = () => {
    switch (view) {
      case View.Video:
        return <ApiKeySelector><VideoGenerator addToLibrary={addToLibrary} /></ApiKeySelector>;
      case View.Image:
        return <ImageEditor addToLibrary={addToLibrary} />;
      case View.Library:
        return <Library assets={library} />;
      default:
        return <ApiKeySelector><VideoGenerator addToLibrary={addToLibrary} /></ApiKeySelector>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header currentView={view} setView={setView} />
      <main className="p-4 md:p-8">
        {renderView()}
      </main>
      <Chatbot />
    </div>
  );
};

export default App;
