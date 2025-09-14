
import { Modality } from "@google/genai";

export interface EditResultPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

// Ensure Modality enum is exported if used across files
export { Modality };
