"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImageRequest = processImageRequest;
const imageSafety_1 = require("./imageSafety");
const promptEnhancer_1 = require("./promptEnhancer");
const imageGenerate_1 = require("./imageGenerate");
const imageEdit_1 = require("./imageEdit");
async function processImageRequest(request) {
    try {
        // 1. Safety Check (Pre-flight)
        if (!(0, imageSafety_1.validateImageSafety)(request.prompt)) {
            return {
                success: false,
                message: "Policy Violation",
                error: "Your request contains blocked terms or violates our safety policies."
            };
        }
        // 2. Enhance Prompt using LLM
        const enhancedPrompt = await (0, promptEnhancer_1.enhancePrompt)(request.prompt, request.mode);
        // 3. Post-enhancement Safety Check (in case LLM generated something unsafe)
        if (!(0, imageSafety_1.validateImageSafety)(enhancedPrompt)) {
            return {
                success: false,
                message: "Policy Violation",
                error: "The enhanced request was flagged by our safety filters."
            };
        }
        // 4. Route to Generation or Editing
        let imageUrl = "";
        if (request.mode === 'EDIT' && request.referenceImageUrl) {
            imageUrl = await (0, imageEdit_1.executeImageEditing)(enhancedPrompt, request.referenceImageUrl);
        }
        else {
            imageUrl = await (0, imageGenerate_1.executeImageGeneration)(enhancedPrompt);
        }
        return {
            success: true,
            message: "Success",
            imageUrl
        };
    }
    catch (err) {
        console.error("Error in processImageRequest:", err);
        return {
            success: false,
            message: "API failure",
            error: "An internal error occurred while processing your image request."
        };
    }
}
