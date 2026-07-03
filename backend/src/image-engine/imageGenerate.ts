import { buildPollinationsUrl } from "./imageUtils";

export async function executeImageGeneration(enhancedPrompt: string): Promise<string> {
  // Pure text-to-image generation
  return buildPollinationsUrl(enhancedPrompt);
}
