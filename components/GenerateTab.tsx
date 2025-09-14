import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { Spinner } from './Spinner';
import { Icon } from './Icon';

const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

export const GenerateTab: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>(aspectRatios[0]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const imageBase64 = await generateImage(prompt, aspectRatio);
      setGeneratedImage(`data:image/png;base64,${imageBase64}`);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    const fileName = prompt.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 50) || 'generated-image';
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="prompt-generate" className="text-sm font-medium text-gray-300">
            Describe the image you want to create
          </label>
          <textarea
            id="prompt-generate"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., A majestic lion wearing a crown, photorealistic style"
            className="w-full h-24 p-3 bg-base-300 border border-base-300 rounded-lg text-content focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-200 ease-in-out"
            disabled={isLoading}
            aria-label="Image generation prompt"
          />
        </div>
        <div className="space-y-2">
            <label htmlFor="aspect-ratio-generate" className="text-sm font-medium text-gray-300">
                Aspect Ratio
            </label>
            <select
                id="aspect-ratio-generate"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full p-3 bg-base-300 border border-base-300 rounded-lg text-content focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-200 ease-in-out h-24"
                disabled={isLoading}
                aria-label="Image aspect ratio"
            >
                {aspectRatios.map(ratio => (
                    <option key={ratio} value={ratio}>{ratio}</option>
                ))}
            </select>
        </div>
      </div>


      <button
        onClick={handleGenerate}
        disabled={isLoading || !prompt.trim()}
        className="w-full flex justify-center items-center gap-2 bg-brand-primary hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out disabled:bg-base-300 disabled:cursor-not-allowed disabled:text-gray-500"
      >
        {isLoading ? (
          <>
            <Spinner />
            Generating...
          </>
        ) : (
          <>
            <Icon name="sparkles" className="w-5 h-5" />
            Generate
          </>
        )}
      </button>

      {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg text-sm" role="alert">{error}</div>}

      <div className="w-full aspect-square bg-base-300 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-600 relative">
        {isLoading && <Spinner size="lg" />}
        {!isLoading && generatedImage && (
          <img src={generatedImage} alt="Generated" className="object-contain w-full h-full" />
        )}
        {!isLoading && !generatedImage && (
          <div className="text-center text-gray-500">
            <Icon name="image" className="w-16 h-16 mx-auto mb-2" />
            <p>Your generated image will appear here</p>
          </div>
        )}
        {generatedImage && !isLoading && (
          <button
            onClick={handleDownload}
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-brand-secondary hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-300 focus:ring-brand-primary"
            aria-label="Download image"
          >
            <Icon name="download" className="w-5 h-5" />
            <span>Download</span>
          </button>
        )}
      </div>
    </div>
  );
};
