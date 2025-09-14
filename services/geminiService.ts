import { GoogleGenAI, Modality } from "@google/genai";
import { EditResultPart } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
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

export const generateVideo = async (
  prompt: string,
  image?: { imageBase64: string; mimeType: string }
): Promise<string> => {
  try {
    const videoParams: any = {
        model: 'veo-2.0-generate-001',
        prompt,
        config: {
            numberOfVideos: 1
        }
    };
    if (image) {
        videoParams.image = {
            imageBytes: image.imageBase64,
            mimeType: image.mimeType
        };
    }

    let operation = await ai.models.generateVideos(videoParams);

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    if (operation.error) {
      const errorMessage = operation.error.message || 'Unknown error during video generation.';
      console.error("Video generation operation failed:", operation.error);
      throw new Error(`Video generation failed: ${errorMessage}`);
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (downloadLink) {
      return downloadLink;
    }

    throw new Error("Video generation completed, but no download link was found.");
  } catch (error) {
    console.error("Error generating video:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate video: ${error.message}. Please check the console for details.`);
    }
    throw new Error("Failed to generate video due to an unknown error. Please check the console for details.");
  }
};
