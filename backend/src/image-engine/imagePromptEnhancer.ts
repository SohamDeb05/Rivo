import { detectStyle } from './imageStyles';
import { detectCategory } from './imageCategories';
import { QUALITY_PRESETS, CAMERA_KNOWLEDGE, LIGHTING_KNOWLEDGE, COMPOSITION_KNOWLEDGE, getRandomElements } from './imageQuality';
import { buildPrompt, PromptContext } from './imagePromptTemplates';
import { validatePrompt } from './imageValidator';

export async function enhanceImagePrompt(userPrompt: string): Promise<{
  success: boolean;
  enhancedPrompt?: string;
  error?: string;
}> {
  try {
    // 1. Safety Check
    if (!validatePrompt(userPrompt)) {
      return { success: false, error: "Your request violates safety policies." };
    }

    // 2. Intent Analysis & Categorization
    // (In a full AI system, this might use a lightweight LLM call. For now, we do basic heuristic detection)
    const category = detectCategory(userPrompt);
    const style = detectStyle(userPrompt);
    
    // 3. Automatic Quality Enhancement based on Category
    let qualityTags = getRandomElements(QUALITY_PRESETS, 4).join(", ");
    let cameraTags = getRandomElements(CAMERA_KNOWLEDGE, 2).join(", ");
    let lightingTags = getRandomElements(LIGHTING_KNOWLEDGE, 2).join(", ");
    let compositionTags = getRandomElements(COMPOSITION_KNOWLEDGE, 1).join(", ");

    // If it's a Logo or UI Mockup, camera and lighting usually don't apply the same way
    if (category === "Logos & Icons" || category === "UI Mockups") {
      cameraTags = "flat design, vector graphics, clean background";
      lightingTags = "even lighting";
      compositionTags = "centered";
      qualityTags = "high resolution, sharp edges, professional design";
    }

    // Check for explicit text requests
    let textToRender = "";
    const textMatch = userPrompt.match(/text:? ["']([^"']+)["']/i) || userPrompt.match(/saying ["']([^"']+)["']/i);
    if (textMatch && textMatch[1]) {
      textToRender = textMatch[1];
    }

    // 4. Build Structured Prompt
    const context: PromptContext = {
      subject: userPrompt,
      environment: category !== "Logos & Icons" ? "detailed background" : "",
      style: `${style} style`,
      composition: compositionTags,
      lighting: lightingTags,
      camera: cameraTags,
      quality: qualityTags,
      text: textToRender
    };

    const finalPrompt = buildPrompt(context);

    // DEBUG Mode logging (Hidden from users)
    if (process.env.DEBUG === 'true') {
      console.log("=== IMAGE ENGINE DEBUG ===");
      console.log("Original Prompt:", userPrompt);
      console.log("Category:", category);
      console.log("Enhanced Prompt:", finalPrompt);
      console.log("==========================");
    }

    return { success: true, enhancedPrompt: finalPrompt };
  } catch (error) {
    console.error("Error enhancing image prompt:", error);
    return { success: false, error: "Internal enhancement error." };
  }
}
