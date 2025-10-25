
import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { Icon } from './Icon';

// FIX: Define the AIStudio interface and use it for window.aistudio
// to resolve the type conflict error, as suggested by the error message.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

interface ApiKeySelectorProps {
  children: ReactNode;
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ children }) => {
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);

  const checkApiKey = useCallback(async () => {
    if (typeof window.aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeySelected(hasKey);
    } else {
      // If the aistudio object is not available, assume we're in a dev environment
      // and a key is set via environment variables.
      setIsKeySelected(true); 
    }
  }, []);
  
  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectKey = async () => {
    if (typeof window.aistudio?.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Optimistically assume key selection was successful to avoid race conditions
      setIsKeySelected(true);
    }
  };
  
  // Pass down a way to reset the key selection state
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { resetKeySelection: () => setIsKeySelected(false) });
    }
    return child;
  });

  if (isKeySelected === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  if (!isKeySelected) {
    return (
      <div className="max-w-2xl mx-auto text-center p-8 bg-gray-800 rounded-lg shadow-2xl">
        <Icon name="video" className="w-16 h-16 mx-auto text-indigo-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">VEO Video Generation</h2>
        <p className="text-gray-400 mb-6">
          To generate videos with VEO, you need to select an API key. This will be used for your requests.
        </p>
        <button
          onClick={handleSelectKey}
          className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-500 transition-colors duration-300 shadow-lg"
        >
          Select API Key
        </button>
        <p className="text-xs text-gray-500 mt-4">
          For more information on billing, please visit the{' '}
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            official documentation
          </a>.
        </p>
      </div>
    );
  }

  return <>{childrenWithProps}</>;
};

export default ApiKeySelector;