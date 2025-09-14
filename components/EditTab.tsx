import React, { useState, useCallback } from 'react';
import { fileToBase64 } from '../utils/fileUtils';
import { editImage } from '../services/geminiService';
import { EditResultPart } from '../types';
import { Spinner } from './Spinner';
import { Icon } from './Icon';

export const EditTab: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [resultParts, setResultParts] = useState<EditResultPart[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
        setError('Please select a valid image file (JPEG, PNG, WebP).');
        return;
      }
      setError(null);
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResultParts(null);
    }
  };

  const handleEdit = async () => {
    if (!file || !prompt.trim()) {
      setError('Please provide both an image and an editing prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResultParts(null);

    try {
      const imageBase64 = await fileToBase64(file);
      const parts = await editImage(prompt, imageBase64, file.type);
      setResultParts(parts);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback((part: EditResultPart, index: number) => {
    if (!part.inlineData) return;
    const { mimeType, data } = part.inlineData;
    const link = document.createElement('a');
    link.href = `data:${mimeType};base64,${data}`;
    const extension = mimeType.split('/')[1] || 'png';
    link.download = `edited-image-${index + 1}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const renderResult = useCallback(() => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-400">Editing in progress...</p>
        </div>
      );
    }

    if (!resultParts) {
      return (
        <div className="text-center text-gray-500">
          <Icon name="image" className="w-16 h-16 mx-auto mb-2" />
          <p>Your edited image and text will appear here</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4 w-full">
        {resultParts.map((part, index) => {
          if (part.text) {
            return (
              <p key={`text-${index}`} className="text-content bg-base-100 p-3 rounded-md">
                {part.text}
              </p>
            );
          }
          if (part.inlineData) {
            return (
              <div key={`image-${index}`} className="relative group">
                <img
                  src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                  alt={`Edited result ${index}`}
                  className="rounded-lg object-contain w-full h-auto"
                />
                <button
                  onClick={() => handleDownload(part, index)}
                  className="absolute bottom-4 right-4 flex items-center gap-2 bg-brand-secondary hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-opacity duration-300 ease-in-out shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-300 focus:ring-brand-primary"
                  aria-label={`Download edited image ${index + 1}`}
                >
                  <Icon name="download" className="w-5 h-5" />
                  <span>Download</span>
                </button>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }, [isLoading, resultParts, handleDownload]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column: Input */}
      <div className="flex flex-col gap-6">
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">
            1. Upload your image
          </label>
          <div className="w-full aspect-square bg-base-300 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-600 relative">
            <input
              id="file-upload"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isLoading}
              aria-label="Upload image for editing"
            />
            {preview ? (
              <img src={preview} alt="Preview" className="object-contain w-full h-full" />
            ) : (
              <div className="text-center text-gray-500 p-4">
                 <Icon name="upload" className="w-12 h-12 mx-auto mb-2" />
                <p>Click or drag to upload</p>
                <p className="text-xs mt-1">PNG, JPG, or WEBP</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="prompt-edit" className="text-sm font-medium text-gray-300">
            2. Describe the edits you want to make
          </label>
          <textarea
            id="prompt-edit"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Add a futuristic city in the background"
            className="w-full h-24 p-3 bg-base-300 border border-base-300 rounded-lg text-content focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-200 ease-in-out"
            disabled={isLoading}
            aria-label="Image editing prompt"
          />
        </div>

        <button
          onClick={handleEdit}
          disabled={isLoading || !file || !prompt.trim()}
          className="w-full flex justify-center items-center gap-2 bg-brand-secondary hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out disabled:bg-base-300 disabled:cursor-not-allowed disabled:text-gray-500"
        >
          {isLoading ? (
            <>
              <Spinner />
              Editing...
            </>
          ) : (
             <>
              <Icon name="magic" className="w-5 h-5" />
              Edit Image
            </>
          )}
        </button>

        {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg text-sm" role="alert">{error}</div>}
      </div>

      {/* Right Column: Output */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300">Result</label>
        <div className="w-full min-h-[300px] lg:h-full bg-base-300 rounded-lg flex items-center justify-center overflow-auto border-2 border-dashed border-gray-600">
            {renderResult()}
        </div>
      </div>
    </div>
  );
};
