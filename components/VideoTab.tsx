import React, { useState, useEffect } from 'react';
import { generateVideo } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { Spinner } from './Spinner';
import { Icon } from './Icon';

const loadingMessages = [
    "Warming up the video engine...",
    "Gathering pixels and prompts...",
    "Directing the digital actors...",
    "This can take a few minutes, please wait...",
    "Rendering the final cut...",
    "Polishing the frames...",
    "Almost there, adding the finishing touches...",
];

export const VideoTab: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string>(loadingMessages[0]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isLoading) {
            interval = setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 5000);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isLoading]);
    
    // Clean up the object URL to avoid memory leaks
    useEffect(() => {
      return () => {
        if (videoUrl && videoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(videoUrl);
        }
      };
    }, [videoUrl]);

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
            setVideoUrl(null);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate a video.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setLoadingMessage(loadingMessages[0]);

        try {
            let imagePayload;
            if (file) {
                const imageBase64 = await fileToBase64(file);
                imagePayload = { imageBase64, mimeType: file.type };
            }
            const videoUri = await generateVideo(prompt, imagePayload);
            const downloadUrl = `${videoUri}&key=${process.env.API_KEY}`;

            const response = await fetch(downloadUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch video: ${response.statusText}`);
            }
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            setVideoUrl(objectUrl);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!videoUrl) return;
        try {
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = videoUrl;
            const fileName = prompt.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 50) || 'generated-video';
            a.download = `${fileName}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            setError('Failed to download the video.');
            console.error(err);
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Input */}
            <div className="flex flex-col gap-6">
                <div className="space-y-2">
                    <label htmlFor="prompt-video" className="text-sm font-medium text-gray-300">
                        1. Describe the video you want to create
                    </label>
                    <textarea
                        id="prompt-video"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A neon hologram of a cat driving at top speed"
                        className="w-full h-24 p-3 bg-base-300 border border-base-300 rounded-lg text-content focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition duration-200 ease-in-out"
                        disabled={isLoading}
                        aria-label="Video generation prompt"
                    />
                </div>

                <div>
                    <label htmlFor="file-upload-video" className="block text-sm font-medium text-gray-300 mb-2">
                        2. (Optional) Upload an image to animate
                    </label>
                    <div className="w-full aspect-video bg-base-300 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-600 relative">
                        <input
                            id="file-upload-video"
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isLoading}
                            aria-label="Upload image for video animation"
                        />
                        {preview ? (
                            <img src={preview} alt="Preview" className="object-contain w-full h-full" />
                        ) : (
                            <div className="text-center text-gray-500 p-4">
                                <Icon name="upload" className="w-12 h-12 mx-auto mb-2" />
                                <p>Click or drag to upload an image</p>
                                <p className="text-xs mt-1">PNG, JPG, or WEBP</p>
                            </div>
                        )}
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
                            Generating Video...
                        </>
                    ) : (
                        <>
                            <Icon name="film" className="w-5 h-5" />
                            Generate Video
                        </>
                    )}
                </button>

                {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg text-sm" role="alert">{error}</div>}
            </div>

            {/* Right Column: Output */}
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">Result</label>
                <div className="w-full aspect-video bg-base-300 rounded-lg flex flex-col items-center justify-center overflow-hidden border-2 border-dashed border-gray-600 relative">
                    {isLoading && (
                        <div className="text-center text-gray-400">
                             <Spinner size="lg" />
                             <p className="mt-4 animate-pulse">{loadingMessage}</p>
                             <p className="text-xs mt-2 text-gray-500">(This may take several minutes)</p>
                        </div>
                    )}
                    {!isLoading && videoUrl && (
                        <>
                            <video src={videoUrl} controls autoPlay loop className="object-contain w-full h-full" />
                            <button
                                onClick={handleDownload}
                                className="absolute bottom-4 right-4 flex items-center gap-2 bg-brand-secondary hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-300 focus:ring-brand-primary"
                                aria-label="Download video"
                            >
                                <Icon name="download" className="w-5 h-5" />
                                <span>Download</span>
                            </button>
                        </>
                    )}
                    {!isLoading && !videoUrl && (
                        <div className="text-center text-gray-500">
                            <Icon name="image" className="w-16 h-16 mx-auto mb-2" />
                            <p>Your generated video will appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};