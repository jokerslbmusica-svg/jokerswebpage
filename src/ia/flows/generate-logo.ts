'use server';
/**
 * @fileOverview Un flujo que genera un logo para la banda usando un modelo de texto a imagen.
 *
 * - generateLogo - Una función que genera una imagen de logo a partir de una descripción de texto.
 * - GenerateLogoInput - El tipo de entrada para la función generateLogo.
 * - GenerateLogoOutput - El tipo de retorno para la función generateLogo.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLogoInputSchema = z.object({
  prompt: z.string().describe('La descripción textual del logo a generar.'),
});
export type GenerateLogoInput = z.infer<typeof GenerateLogoInputSchema>;

const GenerateLogoOutputSchema = z.object({
  imageDataUri: z.string().describe('La imagen del logo generada, como un data URI.'),
});
export type GenerateLogoOutput = z.infer<typeof GenerateLogoOutputSchema>;


export async function generateLogo(input: GenerateLogoInput): Promise<GenerateLogoOutput> {
    return generateLogoFlow(input);
}


const generateLogoFlow = ai.defineFlow(
  {
    name: 'generateLogoFlow',
    inputSchema: GenerateLogoInputSchema,
    outputSchema: GenerateLogoOutputSchema,
  },
  async input => {
    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Un logo profesional para una banda de rock llamada "Jokers Live Band". El estilo del logo debe ser: ${input.prompt}. El logo debe ser cuadrado, ideal para una foto de perfil en redes sociales.`,
      config: {
        aspectRatio: '1:1',
      },
    });

    if (!media.url) {
        throw new Error("La generación de imagen no produjo ningún resultado.");
    }
    
    return { imageDataUri: media.url };
  }
);
