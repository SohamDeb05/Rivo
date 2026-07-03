export const QUALITY_PRESETS = [
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

export const CAMERA_KNOWLEDGE = [
  "DSLR", "Mirrorless", "85mm lens", "35mm lens", "Macro", "Wide Angle", 
  "Telephoto", "Bokeh", "RAW photo", "Long Exposure", "Shallow Depth of Field", 
  "Soft Focus", "Ultra Sharp"
];

export const LIGHTING_KNOWLEDGE = [
  "Golden Hour", "Blue Hour", "Cinematic", "Studio", "Neon", "Soft Light", 
  "Rim Light", "Volumetric Light", "God Rays", "Ambient Light", "Sunset", 
  "Moonlight", "Overcast", "Dramatic Shadows"
];

export const COMPOSITION_KNOWLEDGE = [
  "Rule of Thirds", "Center Composition", "Symmetry", "Leading Lines", 
  "Dynamic Perspective", "Low Angle", "High Angle", "Close Up", 
  "Extreme Close Up", "Bird's Eye View", "Aerial View", "Dutch Angle"
];

// Helper to pick random elements
export function getRandomElements(arr: string[], n: number): string[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}
