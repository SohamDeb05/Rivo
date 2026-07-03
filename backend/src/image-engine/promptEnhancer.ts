import { GoogleGenerativeAI } from "@google/generative-ai";
import { ImageRequestMode } from "./imageTypes";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function enhancePrompt(userPrompt: string, mode: ImageRequestMode): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const systemInstruction = mode === 'EDIT' 
    ? `You are an expert image editing prompt engineer. The user is providing instructions to edit an existing image. 
Your goal is to rewrite their instruction into a rich, descriptive visual prompt suitable for an Image-to-Image AI model.
CRITICAL RULES:
1. DO NOT write instructional prompts (e.g., "Add a doodle", "Make it darker", "Remove the background").
2. ALWAYS convert instructions into a descriptive final state (e.g., "The image features elegant white handwritten doodles surrounding the main subject, with a dark, moody atmosphere").
3. Improve wording, lighting, composition, quality, and realism.
4. Preserve the user's core intent.
5. Do not include introductory or explanatory text. Output ONLY the final enhanced prompt.`
    : `You are an expert image generation prompt engineer. The user wants to generate a completely new image from scratch.
Your goal is to rewrite their idea into a rich, descriptive visual prompt suitable for a Text-to-Image AI model.
CRITICAL RULES:
1. DO NOT write instructional prompts (e.g., "Draw a cat", "Create a logo").
2. ALWAYS describe the image as if it already exists (e.g., "A stunning high-resolution photograph of a cat sitting on a windowsill, bathed in golden hour sunlight").
3. Improve wording, lighting, composition, quality, and realism.
4. Preserve the user's core intent.
5. Do not include introductory or explanatory text. Output ONLY the final enhanced prompt.`;

  const prompt = `${systemInstruction}\n\nUser Request: "${userPrompt}"\n\nEnhanced Prompt:`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text;
  } catch (error) {
    console.error("Error in enhancePrompt LLM call:", error);
    // Fallback to original prompt if LLM fails
    return userPrompt;
  }
}
