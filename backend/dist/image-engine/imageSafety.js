"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImageSafety = validateImageSafety;
// Define a list of blocked terms (basic heuristic safety check before hitting API)
const BLOCKED_TERMS = [
    "nsfw", "gore", "blood", "violence", "porn", "explicit", "nudity", "kill", "murder", "terrorist"
];
function validateImageSafety(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    for (const term of BLOCKED_TERMS) {
        if (lowerPrompt.includes(term)) {
            return false;
        }
    }
    return true;
}
