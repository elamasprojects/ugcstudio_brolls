
import React, { useState, useEffect } from 'react';
import { generateVideo, VEO_LOADING_MESSAGES } from '../services/geminiService';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { fileToBase64 } from '../utils/fileUtils';
import { BrollAsset } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { Icon } from './Icon';

interface VideoGeneratorProps {
  addToLibrary: (asset: Omit<BrollAsset, 'id'>) => void;
  resetKeySelection?: () => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ addToLibrary, resetKeySelection }) => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

  const { transcript, isListening, startListening, stopListening, setTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setPrompt(prev => prev + transcript);
      setTranscript('');
    }
  }, [transcript, setTranscript]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt && !imageFile) {
      setError('Please provide a prompt and/or a reference image.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setGeneratedVideoUrl(null);

    try {
      const base64Image = imageFile ? await fileToBase64(imageFile) : null;
      const mimeType = imageFile ? imageFile.type : null;
      
      const videoUrl = await generateVideo(prompt, base64Image, mimeType, aspectRatio, setLoadingMessage);
      
      setGeneratedVideoUrl(videoUrl);
    } catch (err) {
       if (err instanceof Error && err.message === "API_KEY_INVALID" && resetKeySelection) {
            resetKeySelection();
            setError("Your API Key seems to be invalid. Please select a valid key.");
        } else if (err instanceof Error) {
            setError(`Generation failed: ${err.message}`);
        } else {
            setError('An unknown error occurred during video generation.');
        }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleAddToLibrary = () => {
    if (generatedVideoUrl) {
      addToLibrary({
        type: 'video',
        url: generatedVideoUrl,
        prompt,
        originalImageUrl: imagePreview ?? undefined,
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">Create Your B-Roll</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
            <div className="relative">
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A neon hologram of a cat driving at top speed"
                className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                rows={4}
              />
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500'}`}
              >
                {isListening ? <Icon name="stop" className="w-5 h-5 text-white" /> : <Icon name="microphone" className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-2">Reference Image (Optional)</label>
            <input type="file" id="image" onChange={handleImageChange} accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 transition cursor-pointer" />
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-4 rounded-lg max-h-40" />}
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</span>
            <div className="flex gap-4">
              {['16:9', '9:16'].map(ratio => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio as '16:9' | '9:16')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${aspectRatio === ratio ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  {ratio} {ratio === '16:9' ? '(Landscape)' : '(Portrait)'}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isLoading ? <LoadingSpinner /> : <Icon name="video" className="w-5 h-5" />}
            {isLoading ? 'Generating...' : 'Generate Video'}
          </button>
        </form>
      </div>
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl flex flex-col justify-center items-center">
        {isLoading && (
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-indigo-300 font-medium">{loadingMessage || VEO_LOADING_MESSAGES[0]}</p>
            <p className="mt-2 text-sm text-gray-400">Video generation can take several minutes. Please be patient.</p>
          </div>
        )}
        {error && <p className="text-red-400">{error}</p>}
        {generatedVideoUrl && !isLoading && (
          <div className="w-full text-center">
            <h3 className="text-xl font-bold mb-4 text-white">Generated Video</h3>
            <video src={generatedVideoUrl} controls autoPlay loop className="w-full rounded-lg shadow-lg" />
            <button onClick={handleAddToLibrary} className="mt-4 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-500 transition-colors duration-300">
              Add to Library
            </button>
          </div>
        )}
        {!isLoading && !generatedVideoUrl && (
            <div className="text-center text-gray-500">
                <Icon name="logo" className="w-24 h-24 mx-auto opacity-20"/>
                <p className="mt-4">Your generated b-roll will appear here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default VideoGenerator;
