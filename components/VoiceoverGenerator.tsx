
import React, { useState } from 'react';
import { generateSpeech } from '../services/geminiService';
import { BrollAsset } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { Icon } from './Icon';

interface VoiceoverGeneratorProps {
  addToLibrary: (asset: Omit<BrollAsset, 'id'>) => void;
}

const VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

const VoiceoverGenerator: React.FC<VoiceoverGeneratorProps> = ({ addToLibrary }) => {
  const [script, setScript] = useState('');
  const [voice, setVoice] = useState(VOICES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!script.trim()) {
      setError('Please enter some text to generate a voiceover.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setGeneratedAudioUrl(null);

    try {
      const audioUrl = await generateSpeech(script, voice);
      setGeneratedAudioUrl(audioUrl);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Generation failed: ${err.message}`);
      } else {
        setError('An unknown error occurred during voiceover generation.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddToLibrary = () => {
    if (generatedAudioUrl) {
      addToLibrary({
        type: 'audio',
        url: generatedAudioUrl,
        prompt: script,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">AI Voiceover Generator</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="script" className="block text-sm font-medium text-gray-300 mb-2">Script</label>
            <textarea
              id="script"
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter the script for your voiceover here..."
              className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
              rows={8}
              required
            />
          </div>
          <div>
            <label htmlFor="voice" className="block text-sm font-medium text-gray-300 mb-2">Voice</label>
            <select
              id="voice"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-500 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isLoading ? <LoadingSpinner /> : <Icon name="voiceover" className="w-5 h-5" />}
            {isLoading ? 'Generating...' : 'Generate Voiceover'}
          </button>
        </form>
      </div>

      <div className="mt-8">
        {isLoading && (
          <div className="text-center p-6 bg-gray-800 rounded-xl">
            <LoadingSpinner />
            <p className="mt-4 text-indigo-300 font-medium">The AI is generating your audio...</p>
          </div>
        )}
        {error && <p className="text-center text-red-400 p-4 bg-red-900/20 rounded-lg">{error}</p>}
        {generatedAudioUrl && !isLoading && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl text-center">
            <h3 className="text-xl font-bold mb-4 text-white">Generated Voiceover</h3>
            <audio src={generatedAudioUrl} controls className="w-full" />
            <button onClick={handleAddToLibrary} className="mt-6 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-500 transition-colors duration-300">
              Add to Library
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceoverGenerator;
