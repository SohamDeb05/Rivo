export type ImageRequestMode = 'GENERATE' | 'EDIT' | 'NO';

export interface ImageRequest {
  prompt: string;
  mode: ImageRequestMode;
  referenceImageUrl?: string;
}

export interface EngineResult {
  success: boolean;
  message: string;
  imageUrl?: string;
  error?: string;
}
