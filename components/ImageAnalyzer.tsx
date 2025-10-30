
import React, { useState } from 'react';
import { analyzeImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import LoadingSpinner from './LoadingSpinner';
import { Icon } from './Icon';

const ImageAnalyzer: React.FC = () => {
  const [prompt, setPrompt] = useState('Describe this image in detail.');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setAnalysisResult(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      setError('Please upload an image to analyze.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const base64Image = await fileToBase64(imageFile);
      const mimeType = imageFile.type;
      
      const result = await analyzeImage(prompt, base64Image, mimeType);
      
      setAnalysisResult(result);
    } catch (err) {
       if (err instanceof Error) {
            setError(`Analysis failed: ${err.message}`);
        } else {
            setError('An unknown error occurred during image analysis.');
        }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">Analyze Image</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="image-analyzer-upload" className="block text-sm font-medium text-gray-300 mb-2">1. Upload Image</label>
            <input type="file" id="image-analyzer-upload" onChange={handleImageChange} accept="image/*" required className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 transition cursor-pointer" />
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-4 rounded-lg max-h-60 w-full object-contain" />}
          </div>
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">2. Ask a Question (Optional)</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
              rows={3}
            />
          </div>
          <button type="submit" disabled={isLoading || !imageFile} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-500 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isLoading ? <LoadingSpinner /> : <Icon name="analyzer" className="w-5 h-5" />}
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </button>
        </form>
      </div>
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl flex flex-col justify-center items-center">
        {isLoading && (
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-indigo-300 font-medium">Analyzing image content...</p>
          </div>
        )}
        {error && <p className="text-red-400 text-center">{error}</p>}
        {analysisResult && !isLoading && (
          <div className="w-full h-full">
            <h3 className="text-xl font-bold mb-4 text-white">Analysis Result</h3>
            <div className="bg-gray-900/50 p-4 rounded-lg text-gray-200 h-[calc(100%-2.5rem)] overflow-y-auto">
                <p className="whitespace-pre-wrap font-sans text-sm">{analysisResult}</p>
            </div>
          </div>
        )}
        {!isLoading && !analysisResult && (
            <div className="text-center text-gray-500">
                <Icon name="logo" className="w-24 h-24 mx-auto opacity-20"/>
                <p className="mt-4">Your image analysis will appear here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalyzer;
