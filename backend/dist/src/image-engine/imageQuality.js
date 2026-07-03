"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPOSITION_KNOWLEDGE = exports.LIGHTING_KNOWLEDGE = exports.CAMERA_KNOWLEDGE = exports.QUALITY_PRESETS = void 0;
exports.getRandomElements = getRandomElements;
exports.QUALITY_PRESETS = [
    "realistic anatomy",
    "detailed fur",
    "cinematic composition",
    "dramatic lighting",
    "volumetric light",
    "realistic shadows",
    "ultra detailed",
    "HDR",
    "sharp focus",
    "masterpiece quality",
    "natural colors",
    "depth of field",
    "8k resolution",
    "highly detailed"
];
exports.CAMERA_KNOWLEDGE = [
    "DSLR", "Mirrorless", "85mm lens", "35mm lens", "Macro", "Wide Angle",
    "Telephoto", "Bokeh", "RAW photo", "Long Exposure", "Shallow Depth of Field",
    "Soft Focus", "Ultra Sharp"
];
exports.LIGHTING_KNOWLEDGE = [
    "Golden Hour", "Blue Hour", "Cinematic", "Studio", "Neon", "Soft Light",
    "Rim Light", "Volumetric Light", "God Rays", "Ambient Light", "Sunset",
    "Moonlight", "Overcast", "Dramatic Shadows"
];
exports.COMPOSITION_KNOWLEDGE = [
    "Rule of Thirds", "Center Composition", "Symmetry", "Leading Lines",
    "Dynamic Perspective", "Low Angle", "High Angle", "Close Up",
    "Extreme Close Up", "Bird's Eye View", "Aerial View", "Dutch Angle"
];
// Helper to pick random elements
function getRandomElements(arr, n) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
}
