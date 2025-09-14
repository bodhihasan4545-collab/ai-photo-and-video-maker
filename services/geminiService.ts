import { GoogleGenAI, Modality } from "@google/genai";
import { EditResultPart } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    }
    throw new Error("No image was generated.");

  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image. Please check the console for details.");
  }
};

export const editImage = async (
  prompt: string,
  imageBase64: string,
  mimeType: string
): Promise<EditResultPart[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
        return response.candidates[0].content.parts as EditResultPart[];
    }
    throw new Error("No edited content was returned.");

  } catch (error) {
    console.error("Error editing image:", error);
    throw new Error("Failed to edit image. Please check the console for details.");
  }
};

export interface VideoGenerationConfig {
    aspectRatio: string;
    duration: number;
    image?: { 
        imageBase64: string; 
        mimeType: string 
    };
}

export const generateVideo = async (
  prompt: string,
  config: VideoGenerationConfig
): Promise<string> => {
  try {
    const videoParams: any = {
        model: 'veo-2.0-generate-001',
        prompt,
        config: {
            numberOfVideos: 1,
            aspectRatio: config.aspectRatio,
            durationSecs: config.duration,
        }
    };
    if (config.image) {
        videoParams.image = {
            imageBytes: config.image.imageBase64,
            mimeType: config.image.mimeType
        };
    }

    let operation = await ai.models.generateVideos(videoParams);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    if (operation.error) {
      console.error("Video generation operation failed:", operation.error);
      let errorMessage = 'Video generation failed.';
      
      if (operation.error.message && typeof operation.error.message === 'string') {
          errorMessage = operation.error.message;
      } else {
          // Fallback for other error object shapes to prevent '[object Object]'.
          errorMessage = typeof operation.error === 'string' 
            ? operation.error 
            : JSON.stringify(operation.error);
      }
      throw new Error(errorMessage);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (downloadLink) {
      // FIX: Fetch the video within the service to avoid exposing the API key to the client.
      // Return a blob URL that can be used directly in the video player.
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }

    throw new Error("Video generation completed, but no download link was found.");
  } catch (error) {
    console.error("Error generating video:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unknown error occurred while generating the video.");
  }
};