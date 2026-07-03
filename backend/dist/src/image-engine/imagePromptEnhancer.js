"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhanceImagePrompt = enhanceImagePrompt;
const imageStyles_1 = require("./imageStyles");
const imageCategories_1 = require("./imageCategories");
const imageQuality_1 = require("./imageQuality");
const imagePromptTemplates_1 = require("./imagePromptTemplates");
const imageValidator_1 = require("./imageValidator");
async function enhanceImagePrompt(userPrompt) {
    try {
        // 1. Safety Check
        if (!(0, imageValidator_1.validatePrompt)(userPrompt)) {
            return { success: false, error: "Your request violates safety policies." };
        }
        // 2. Intent Analysis & Categorization
        // (In a full AI system, this might use a lightweight LLM call. For now, we do basic heuristic detection)
        const category = (0, imageCategories_1.detectCategory)(userPrompt);
        const style = (0, imageStyles_1.detectStyle)(userPrompt);
        // 3. Automatic Quality Enhancement based on Category
        let qualityTags = (0, imageQuality_1.getRandomElements)(imageQuality_1.QUALITY_PRESETS, 4).join(", ");
        let cameraTags = (0, imageQuality_1.getRandomElements)(imageQuality_1.CAMERA_KNOWLEDGE, 2).join(", ");
        let lightingTags = (0, imageQuality_1.getRandomElements)(imageQuality_1.LIGHTING_KNOWLEDGE, 2).join(", ");
        let compositionTags = (0, imageQuality_1.getRandomElements)(imageQuality_1.COMPOSITION_KNOWLEDGE, 1).join(", ");
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
        const context = {
            subject: userPrompt,
            environment: category !== "Logos & Icons" ? "detailed background" : "",
            style: `${style} style`,
            composition: compositionTags,
            lighting: lightingTags,
            camera: cameraTags,
            quality: qualityTags,
            text: textToRender
        };
        const finalPrompt = (0, imagePromptTemplates_1.buildPrompt)(context);
        // DEBUG Mode logging (Hidden from users)
        if (process.env.DEBUG === 'true') {
            console.log("=== IMAGE ENGINE DEBUG ===");
            console.log("Original Prompt:", userPrompt);
            console.log("Category:", category);
            console.log("Enhanced Prompt:", finalPrompt);
            console.log("==========================");
        }
        return { success: true, enhancedPrompt: finalPrompt };
    }
    catch (error) {
        console.error("Error enhancing image prompt:", error);
        return { success: false, error: "Internal enhancement error." };
    }
}
