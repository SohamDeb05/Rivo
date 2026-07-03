export interface PromptContext {
  subject: string;
  environment: string;
  style: string;
  composition: string;
  lighting: string;
  camera: string;
  quality: string;
  text?: string;
}

export function buildPrompt(context: PromptContext): string {
  let promptParts = [];
  
  promptParts.push(context.subject);
  
  if (context.environment) {
    promptParts.push(context.environment);
  }
  
  promptParts.push(context.style);
  
  if (context.composition) {
    promptParts.push(context.composition);
  }
  
  if (context.lighting) {
    promptParts.push(context.lighting);
  }
  
  if (context.camera) {
    promptParts.push(context.camera);
  }
  
  promptParts.push(context.quality);
  
  if (context.text) {
    // Preserve exact spelling for text if requested
    promptParts.push(`with the exact text "${context.text}" written clearly`);
  }
  
  return promptParts.join(", ");
}
