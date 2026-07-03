"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeImageEditing = executeImageEditing;
const imageUtils_1 = require("./imageUtils");
async function executeImageEditing(enhancedPrompt, referenceImageUrl) {
    // Image-to-image editing using the reference image URL
    return (0, imageUtils_1.buildPollinationsUrl)(enhancedPrompt, referenceImageUrl);
}
