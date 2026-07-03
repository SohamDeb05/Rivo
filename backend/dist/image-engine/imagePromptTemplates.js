"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPrompt = buildPrompt;
function buildPrompt(context) {
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
