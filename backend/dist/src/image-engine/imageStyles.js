"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMAGE_STYLES = void 0;
exports.detectStyle = detectStyle;
exports.IMAGE_STYLES = [
    "Photorealistic",
    "Anime",
    "Ghibli",
    "Pixar",
    "Disney",
    "Cyberpunk",
    "Oil Painting",
    "Watercolor",
    "Pencil Sketch",
    "Digital Art",
    "Concept Art",
    "Fantasy",
    "Sci-Fi",
    "Low Poly",
    "LEGO",
    "Clay",
    "Isometric",
    "Minimal",
    "Cartoon",
    "Comic",
    "Pixel Art",
    "3D Render"
];
function detectStyle(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    for (const style of exports.IMAGE_STYLES) {
        if (lowerPrompt.includes(style.toLowerCase())) {
            return style;
        }
    }
    return "Photorealistic"; // Default style
}
