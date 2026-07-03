export function generateCacheBuster(): string {
  return Math.random().toString(36).substring(7);
}

export function buildPollinationsUrl(prompt: string, referenceImageUrl?: string): string {
  const encodedPrompt = encodeURIComponent(prompt);
  const cacheBuster = generateCacheBuster();
  
  let url = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${cacheBuster}&width=1024&height=1024&nologo=true`;
  
  if (referenceImageUrl) {
    url += `&image=${encodeURIComponent(referenceImageUrl)}`;
  }
  
  return url;
}
