"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMAGE_CATEGORIES = void 0;
exports.detectCategory = detectCategory;
exports.IMAGE_CATEGORIES = [
    "Portraits",
    "Landscapes",
    "Wildlife",
    "Architecture",
    "Product Photography",
    "Logos",
    "Posters",
    "Social Media Graphics",
    "Book Covers",
    "YouTube Thumbnails",
    "UI Mockups",
    "App Screens",
    "Icons",
    "Stickers",
    "Food Photography",
    "Vehicles",
    "Fashion",
    "Interior Design"
];
function detectCategory(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes("logo") || lowerPrompt.includes("icon"))
        return "Logos & Icons";
    if (lowerPrompt.includes("landscape") || lowerPrompt.includes("mountain") || lowerPrompt.includes("cityscape"))
        return "Landscapes";
    if (lowerPrompt.includes("portrait") || lowerPrompt.includes("person") || lowerPrompt.includes("face"))
        return "Portraits";
    if (lowerPrompt.includes("product") || lowerPrompt.includes("mockup"))
        return "Product Photography";
    if (lowerPrompt.includes("ui") || lowerPrompt.includes("app screen") || lowerPrompt.includes("website"))
        return "UI Mockups";
    return "General";
}
