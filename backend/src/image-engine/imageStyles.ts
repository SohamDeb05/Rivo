export const IMAGE_STYLES = [
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

export function detectStyle(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  for (const style of IMAGE_STYLES) {
    if (lowerPrompt.includes(style.toLowerCase())) {
      return style;
    }
  }
  return "Photorealistic"; // Default style
}
