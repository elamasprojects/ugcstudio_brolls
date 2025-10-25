
import React, { useState, useEffect } from 'react';
import { editImage } from '../services/geminiService';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { fileToBase64 } from '../utils/fileUtils';
import { BrollAsset } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { Icon } from './Icon';

interface ImageEditorProps {
  addToLibrary: (asset: Omit<BrollAsset, 'id'>) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ addToLibrary }) => {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setOriginalImage(reader.result as string);
        setEditedImage(null); // Clear previous edit on new image upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt || !imageFile) {
      setError('Please provide both an image and a prompt.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setEditedImage(null);

    try {
      const base64Image = await fileToBase64(imageFile);
      const resultImageUrl = await editImage(prompt, base64Image, imageFile.type);
      setEditedImage(resultImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddToLibrary = () => {
    if (editedImage) {
        addToLibrary({
            type: 'image',
            url: editedImage,
            prompt,
            originalImageUrl: originalImage ?? undefined,
        });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-xl shadow-2xl mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-1/3">
            <label htmlFor="image-upload" className="block text-sm font-medium text-gray-300 mb-2">1. Upload Image</label>
            <input type="file" id="image-upload" onChange={handleImageChange} accept="image/*" required className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 transition cursor-pointer" />
        </div>
        <div className="w-full md:w-1/2">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">2. Describe Your Edit</label>
            <div className="relative">
                <input
                    type="text"
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Add a retro filter, make it look like a painting"
                    className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    required
                />
                <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute top-1/2 -translate-y-1/2 right-3 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                >
                    {isListening ? <Icon name="stop" className="w-5 h-5 text-white" /> : <Icon name="microphone" className="w-5 h-5 text-white" />}
                </button>
            </div>
        </div>
        <div className="w-full md:w-auto mt-4 md:mt-0">
             <label className="block text-sm font-medium text-transparent mb-2 hidden md:block">Generate</label>
            <button type="submit" disabled={isLoading || !imageFile} className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-500 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isLoading ? <LoadingSpinner /> : <Icon name="image" className="w-5 h-5" />}
                Edit Image
            </button>
        </div>
      </form>
      
      {error && <p className="text-center text-red-400 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-400 mb-4">Original</h3>
            <div className="aspect-video bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
                {originalImage ? <img src={originalImage} alt="Original" className="object-contain max-h-full max-w-full" /> : <p className="text-gray-500">Upload an image to start</p>}
            </div>
        </div>
        <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-400 mb-4">Edited</h3>
            <div className="aspect-video bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden relative">
                {isLoading && <LoadingSpinner />}
                {editedImage && !isLoading && <img src={editedImage} alt="Edited" className="object-contain max-h-full max-w-full" />}
                {!editedImage && !isLoading && <p className="text-gray-500">Your edited image will appear here</p>}
            </div>
             {editedImage && !isLoading && (
                <button onClick={handleAddToLibrary} className="mt-4 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-500 transition-colors duration-300">
                Add to Library
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
