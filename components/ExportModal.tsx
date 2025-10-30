import React, { useState, useEffect } from 'react';
import { BrollAsset } from '../types';
import { Icon } from './Icon';
import LoadingSpinner from './LoadingSpinner';

interface ExportModalProps {
  asset: BrollAsset;
  onClose: () => void;
}

type ExportStatus = {
  state: 'idle' | 'loading' | 'success' | 'error';
  message: string;
};

const WEBHOOK_URL_STORAGE_KEY = 'broll-studio-webhook-url';

const ExportModal: React.FC<ExportModalProps> = ({ asset, onClose }) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [exportStatus, setExportStatus] = useState<ExportStatus>({ state: 'idle', message: '' });

  useEffect(() => {
    const savedUrl = localStorage.getItem(WEBHOOK_URL_STORAGE_KEY);
    if (savedUrl) {
      setWebhookUrl(savedUrl);
    }
  }, []);

  const handleSaveWebhook = () => {
    localStorage.setItem(WEBHOOK_URL_STORAGE_KEY, webhookUrl);
    alert('Webhook URL saved!');
  };

  const handleExport = async () => {
    if (!webhookUrl || !asset) return;
    
    // Basic URL validation
    try {
        new URL(webhookUrl);
    } catch (_) {
        setExportStatus({ state: 'error', message: 'Please enter a valid webhook URL.' });
        return;
    }

    setExportStatus({ state: 'loading', message: 'Preparing asset for export...' });

    try {
      const response = await fetch(asset.url);
      if (!response.ok) throw new Error('Failed to fetch asset data.');
      
      const blob = await response.blob();
      const extension = asset.type === 'video' ? 'mp4' : 'png';
      const filename = `b-roll-studio-${asset.id}.${extension}`;

      const formData = new FormData();
      formData.append('file', blob, filename);
      formData.append('prompt', asset.prompt);
      formData.append('type', asset.type);
      formData.append('id', asset.id);
      if (asset.originalImageUrl) {
        formData.append('originalImageUrl', asset.originalImageUrl);
      }

      setExportStatus({ state: 'loading', message: 'Uploading to your webhook...' });

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook returned an error: ${webhookResponse.status} ${webhookResponse.statusText}`);
      }

      setExportStatus({ state: 'success', message: 'Export successful! Your n8n workflow has been triggered.' });
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setExportStatus({ state: 'error', message: `Export failed: ${errorMessage}` });
    }
  };
  
  const statusColors = {
      loading: 'text-indigo-400',
      success: 'text-green-400',
      error: 'text-red-400',
      idle: 'text-gray-400'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg text-white" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icon name="export" className="w-6 h-6 text-indigo-400" />
            Export Asset
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </header>

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="webhook-url" className="block text-sm font-medium text-gray-300 mb-2">n8n Webhook URL</label>
            <div className="flex gap-2">
              <input
                id="webhook-url"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-n8n-instance/webhook/..."
                className="flex-grow bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              <button onClick={handleSaveWebhook} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition">Save</button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Your webhook URL is saved in your browser's local storage.</p>
          </div>

          <div className="bg-gray-900/50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-300">Asset to Export:</h3>
            <div className="flex items-center gap-4 mt-2">
                <div className="w-16 h-16 bg-black rounded-md flex-shrink-0 flex items-center justify-center">
                    {asset.type === 'video' ? (
                        <video src={asset.url} className="w-full h-full object-cover rounded-md" />
                    ) : (
                        <img src={asset.url} alt={asset.prompt} className="w-full h-full object-cover rounded-md" />
                    )}
                </div>
                 <div className="overflow-hidden">
                    <p className="text-sm font-medium text-indigo-400 capitalize">{asset.type}</p>
                    <p className="text-sm text-gray-400 truncate">{asset.prompt}</p>
                </div>
            </div>
          </div>
          
          <button 
            onClick={handleExport}
            disabled={!webhookUrl || exportStatus.state === 'loading'}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exportStatus.state === 'loading' ? <LoadingSpinner /> : <Icon name="export" className="w-5 h-5" />}
            {exportStatus.state === 'loading' ? 'Exporting...' : 'Export Now'}
          </button>

          {exportStatus.state !== 'idle' && (
            <div className="text-center p-3 bg-gray-700 rounded-lg">
              <p className={`text-sm font-medium ${statusColors[exportStatus.state]}`}>{exportStatus.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;