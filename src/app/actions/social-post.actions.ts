// Server-side code
"use server";

import {
  generateSocialPost,
  type GenerateSocialPostInput,
} from "@/ai/flows/generate-social-post";
import type { socialPlatforms } from "@/config/band-constants";


// Helper to convert file to Base64
async function fileToBase64(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${file.type};base64,${base64}`;
}

/**
 * A server action that generates a social media post.
 * This function handles file conversion and calls the AI flow.
 * @param formData - The form data containing the topic, platform, and optional flyer.
 * @returns An object with either the generated post or an error message.
 */
export async function getSocialPostSuggestion(formData: FormData) {
  try {
    const topic = formData.get("topic") as string;
    const platform = formData.get("platform") as (typeof socialPlatforms)[number];
    const bandName = formData.get("bandName") as string;
    const flyerFile = formData.get("flyer") as File | null;

    if (!topic || !platform || !bandName) {
        throw new Error("Topic, platform, and band name are required.");
    }
    
    const input: GenerateSocialPostInput = {
        topic,
        platform,
        bandName,
    };
    
    if (flyerFile && flyerFile.size > 0) {
        input.flyerDataUri = await fileToBase64(flyerFile);
    }

    const result = await generateSocialPost(input);
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error generating social post:", error);
    // Return a user-friendly error message.
    return { success: false, error: error.message || "Failed to generate post. Please try again." };
  }
}
