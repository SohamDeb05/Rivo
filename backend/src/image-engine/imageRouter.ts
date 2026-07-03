import { ImageRequest, EngineResult } from "./imageTypes";
import { validateImageSafety } from "./imageSafety";
import { enhancePrompt } from "./promptEnhancer";
import { executeImageGeneration } from "./imageGenerate";
import { executeImageEditing } from "./imageEdit";

export async function processImageRequest(request: ImageRequest): Promise<EngineResult> {
  try {
    // 1. Safety Check (Pre-flight)
    if (!validateImageSafety(request.prompt)) {
      return { 
        success: false, 
        message: "Policy Violation", 
        error: "Your request contains blocked terms or violates our safety policies." 
      };
    }

    // 2. Enhance Prompt using LLM
    const enhancedPrompt = await enhancePrompt(request.prompt, request.mode);
    
    // 3. Post-enhancement Safety Check (in case LLM generated something unsafe)
    if (!validateImageSafety(enhancedPrompt)) {
      return { 
        success: false, 
        message: "Policy Violation", 
        error: "The enhanced request was flagged by our safety filters." 
      };
    }

    // 4. Route to Generation or Editing
    let imageUrl = "";
    if (request.mode === 'EDIT' && request.referenceImageUrl) {
      imageUrl = await executeImageEditing(enhancedPrompt, request.referenceImageUrl);
    } else {
      imageUrl = await executeImageGeneration(enhancedPrompt);
    }

    return {
      success: true,
      message: "Success",
      imageUrl
    };

  } catch (err) {
    console.error("Error in processImageRequest:", err);
    return {
      success: false,
      message: "API failure",
      error: "An internal error occurred while processing your image request."
    };
  }
}
