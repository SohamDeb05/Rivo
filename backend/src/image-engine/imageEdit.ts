import { buildPollinationsUrl } from "./imageUtils";

export async function executeImageEditing(enhancedPrompt: string, referenceImageUrl: string): Promise<string> {
  // Image-to-image editing using the reference image URL
  return buildPollinationsUrl(enhancedPrompt, referenceImageUrl);
}
