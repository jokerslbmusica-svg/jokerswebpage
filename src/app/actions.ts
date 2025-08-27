// Server-side code
"use server";

export async function getHashtagSuggestions(values: { contentDescription: string, mediaType: 'photo' | 'video', bandName: string }) {
    console.warn("Genkit dependencies are not installed. Skipping AI generation.");
    return { success: false, error: "La función de IA no está disponible en este momento. Por favor, inténtelo de nuevo más tarde." };
}
