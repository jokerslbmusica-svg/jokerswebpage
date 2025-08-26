'use server';

import { generateLogo, type GenerateLogoInput } from '@/ai/flows/generate-logo';

/**
 * A server action that generates a band logo image.
 * @param input - The input data for generating the logo.
 * @returns An object with either the generated image data URI or an error message.
 */
export async function getLogoSuggestion(input: GenerateLogoInput) {
    try {
        const result = await generateLogo(input);
        return { success: true, data: result };
    } catch (error: any) {
        console.error("Error generating logo:", error);
        return { success: false, error: error.message || "No se pudo generar el logo. Inténtalo de nuevo." };
    }
}
