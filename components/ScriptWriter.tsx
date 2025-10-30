import React, { useState } from 'react';
import { generateScript } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import LoadingSpinner from './LoadingSpinner';
import { Icon } from './Icon';

const ScriptWriter: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [audience, setAudience] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useThinkingMode, setUseThinkingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [rawScriptParagraph, setRawScriptParagraph] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

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
  
  const handleCopy = () => {
    if (!rawScriptParagraph) return;
    navigator.clipboard.writeText(rawScriptParagraph).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError('Please provide a context or prompt for the script.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setGeneratedScript(null);
    setRawScriptParagraph('');

    try {
      const base64Image = imageFile ? await fileToBase64(imageFile) : null;
      const mimeType = imageFile ? imageFile.type : null;
      
      const script = await generateScript(prompt, audience, useThinkingMode, base64Image, mimeType);
      
      setGeneratedScript(script);

      const rawText = script
        .replace(/^[A-Z\s]+:/gm, '')
        .replace(/\(.*\)/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      setRawScriptParagraph(rawText);

    } catch (err) {
       if (err instanceof Error) {
            setError(`Generation failed: ${err.message}`);
        } else {
            setError('An unknown error occurred during script generation.');
        }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 p-6 rounded-xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">AI Script Writer</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">Context / Prompt</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., An unboxing video for a new pair of headphones."
              className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
              rows={4}
              required
            />
          </div>
           <div>
            <label htmlFor="audience" className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
            <input
              id="audience"
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g., Tech enthusiasts aged 18-25"
              className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              required
            />
          </div>
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-2">Inspiration Image (Optional)</label>
            <input type="file" id="image" onChange={handleImageChange} accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 transition cursor-pointer" />
            {imagePreview && <img src={imagePreview} alt="Preview" className="mt-4 rounded-lg max-h-40" />}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label htmlFor="thinking-mode" className="text-sm font-medium text-gray-300">Thinking Mode</label>
                <button
                    type="button"
                    onClick={() => setUseThinkingMode(!useThinkingMode)}
                    className={`${useThinkingMode ? 'bg-indigo-600' : 'bg-gray-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                    role="switch"
                    aria-checked={useThinkingMode}
                    disabled={!!imageFile}
                >
                    <span className={`${useThinkingMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                </button>
                 <p className="text-xs text-gray-400">(Uses Gemini 2.5 Pro for complex queries. Disabled with image.)</p>
            </div>
            <button type="submit" disabled={isLoading} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-500 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <LoadingSpinner /> : <Icon name="script" className="w-5 h-5" />}
              {isLoading ? 'Generating...' : 'Generate Script'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8">
        {isLoading && (
          <div className="text-center p-6 bg-gray-800 rounded-xl">
            <LoadingSpinner />
            <p className="mt-4 text-indigo-300 font-medium">The AI is writing your script...</p>
          </div>
        )}
        {error && <p className="text-center text-red-400 p-4 bg-red-900/20 rounded-lg">{error}</p>}
        {generatedScript && !isLoading && (
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Generated Script</h3>
              <pre className="bg-gray-900/50 p-4 rounded-lg text-gray-200 whitespace-pre-wrap font-sans text-sm h-96 overflow-y-auto">{generatedScript}</pre>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">Raw Paragraph Version</h3>
              <div className="relative">
                <textarea
                  readOnly
                  value={rawScriptParagraph}
                  className="w-full bg-gray-900/50 p-4 rounded-lg text-gray-300 whitespace-pre-wrap font-sans text-sm resize-none pr-12"
                  rows={5}
                />
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  title={isCopied ? "Copied!" : "Copy to clipboard"}
                >
                  <Icon name={isCopied ? "check" : "copy"} className="w-5 h-5 text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScriptWriter;