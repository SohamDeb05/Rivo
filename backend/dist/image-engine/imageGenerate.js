"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeImageGeneration = executeImageGeneration;
const imageUtils_1 = require("./imageUtils");
async function executeImageGeneration(enhancedPrompt) {
    // Pure text-to-image generation
    return (0, imageUtils_1.buildPollinationsUrl)(enhancedPrompt);
}
