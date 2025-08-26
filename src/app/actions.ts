// Server-side code
"use server";

import {
  suggestHashtags,
  type SuggestHashtagsInput,
} from "@/ai/flows/suggest-hashtags";

/**
 * A server action that suggests relevant hashtags for social media posts.
 * This function is intended to be called from client-side components.
 * @param input - The input data for generating hashtag suggestions.
 * @returns An object with either the suggested hashtags or an error message.
 */
export async function getHashtagSuggestions(input: SuggestHashtagsInput) {
  try {
    const result = await suggestHashtags(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error generating hashtags:", error);
    // Return a user-friendly error message.
    return { success: false, error: "Failed to generate hashtags. Please try again." };
  }
}
