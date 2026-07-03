"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCacheBuster = generateCacheBuster;
exports.buildPollinationsUrl = buildPollinationsUrl;
function generateCacheBuster() {
    return Math.random().toString(36).substring(7);
}
function buildPollinationsUrl(prompt, referenceImageUrl) {
    const encodedPrompt = encodeURIComponent(prompt);
    const cacheBuster = generateCacheBuster();
    let url = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${cacheBuster}&width=1024&height=1024&nologo=true`;
    if (referenceImageUrl) {
        url += `&image=${encodeURIComponent(referenceImageUrl)}`;
    }
    return url;
}
