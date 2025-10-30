
import React, { useState, useCallback } from 'react';
// FIX: Imported 'motion' from 'framer-motion' to resolve animation component errors.
import { motion } from 'framer-motion';
import VideoGenerator from './components/VideoGenerator';
import ImageEditor from './components/ImageEditor';
import Library from './components/Library';
import Chatbot from './components/Chatbot';
import ScriptWriter from './components/ScriptWriter';
import ImageAnalyzer from './components/ImageAnalyzer';
import VoiceoverGenerator from './components/VoiceoverGenerator';
import { BrollAsset, View } from './types';
import ApiKeySelector from './components/ApiKeySelector';
import { Sidebar, SidebarBody, SidebarLink } from './components/ui/sidebar';
import { Icon } from './components/Icon';

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.Video);
  const [library, setLibrary] = useState<BrollAsset[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: View.Video, label: 'Video Generator', icon: <Icon name="video" className="w-5 h-5 text-gray-400" /> },
    { id: View.Image, label: 'Image Editor', icon: <Icon name="image" className="w-5 h-5 text-gray-400" /> },
    { id: View.Script, label: 'Script Writer', icon: <Icon name="script" className="w-5 h-5 text-gray-400" /> },
    { id: View.Analyzer, label: 'Image Analyzer', icon: <Icon name="analyzer" className="w-5 h-5 text-gray-400" /> },
    { id: View.Voiceover, label: 'AI Voiceover', icon: <Icon name="voiceover" className="w-5 h-5 text-gray-400" /> },
    { id: View.Library, label: 'B-Roll Library', icon: <Icon name="library" className="w-5 h-5 text-gray-400" /> },
  ];

  const addToLibrary = useCallback((asset: Omit<BrollAsset, 'id'>) => {
    setLibrary(prev => [...prev, { ...asset, id: Date.now().toString() }]);
    if (asset.type === 'video' || asset.type === 'audio') {
      setView(View.Library);
    }
  }, []);
  
  const handleSetView = (newView: View) => {
    setView(newView);
    setSidebarOpen(false); // Close mobile sidebar on navigation
  };


  const renderView = () => {
    switch (view) {
      case View.Video:
        return <ApiKeySelector><VideoGenerator addToLibrary={addToLibrary} /></ApiKeySelector>;
      case View.Image:
        return <ImageEditor addToLibrary={addToLibrary} />;
      case View.Script:
        return <ScriptWriter />;
      case View.Analyzer:
        return <ImageAnalyzer />;
      case View.Voiceover:
        return <VoiceoverGenerator addToLibrary={addToLibrary} />;
      case View.Library:
        return <Library assets={library} />;
      default:
        return <ApiKeySelector><VideoGenerator addToLibrary={addToLibrary} /></ApiKeySelector>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col md:flex-row">
       <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="justify-between gap-10 bg-gray-800 text-white border-r border-gray-700">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
             <div className="p-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Icon name="logo" className="w-6 h-6 text-white"/>
                    </div>
                     <motion.span
                        animate={{
                          display: sidebarOpen ? "inline-block" : "none",
                          opacity: sidebarOpen ? 1 : 0,
                        }}
                        className="text-xl font-bold text-white tracking-tight whitespace-pre"
                      >
                       B-Roll Studio <span className="text-indigo-400">AI</span>
                    </motion.span>
                </div>
            </div>
            <div className="mt-8 flex flex-col gap-2">
              {navItems.map(item => (
                <SidebarLink
                  key={item.id}
                  view={item.id}
                  label={item.label}
                  icon={item.icon}
                  currentView={view}
                  onClick={handleSetView}
                />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {renderView()}
      </main>
      <Chatbot />
    </div>
  );
};

export default App;
