"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImage = generateImage;
async function generateImage(enhancedPrompt) {
    // We use pollinations.ai for image generation.
    // The URL must be properly encoded.
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    // Create a cache buster so we don't get a cached image for the same prompt
    const cacheBuster = Math.random().toString(36).substring(7);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${cacheBuster}&width=1024&height=1024&nologo=true`;
    return imageUrl;
}
