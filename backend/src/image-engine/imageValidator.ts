export function validatePrompt(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();
  
  // Basic safety check: block common prohibited words
  const prohibited = [
    "nsfw", "gore", "violence", "blood", "nude", "explicit", "sexual", 
    "racist", "hate", "kill", "murder", "terrorist"
  ];
  
  for (const word of prohibited) {
    if (lowerPrompt.includes(word)) {
      return false; // Invalid prompt
    }
  }
  
  return true; // Valid prompt
}
