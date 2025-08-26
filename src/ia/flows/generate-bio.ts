// Server-side code
'use server';

/**
 * @fileOverview A flow that generates a band biography using AI.
 *
 * - generateBio - A function that generates a biography based on key points and a desired tone.
 * - GenerateBioInput - The input type for the generateBio function.
 * - GenerateBioOutput - The return type for the generateBio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { tones } from '@/config/band-constants';

const GenerateBioInputSchema = z.object({
  bandName: z.string().describe('The name of the band.'),
  keyPoints: z
    .array(z.string())
    .min(1)
    .describe('An array of key points or facts about the band.'),
  tone: z.enum(tones).describe('The desired tone for the biography.'),
});
export type GenerateBioInput = z.infer<typeof GenerateBioInputSchema>;

const GenerateBioOutputSchema = z.object({
  biography: z
    .string()
    .describe('The generated biography for the band.'),
});
export type GenerateBioOutput = z.infer<typeof GenerateBioOutputSchema>;

export async function generateBio(input: GenerateBioInput): Promise<GenerateBioOutput> {
  return generateBioFlow(input);
}

const generateBioPrompt = ai.definePrompt({
  name: 'generateBioPrompt',
  input: {schema: GenerateBioInputSchema},
  output: {schema: GenerateBioOutputSchema},
  prompt: `You are an expert music publicist and copywriter.

  Your task is to write a compelling biography for the band "{{bandName}}".

  The desired tone for the biography is: {{tone}}.

  Use the following key points to craft the narrative. You can elaborate on them, connect them, and add creative flair, but the core information must be based on these points.

  Key Points:
  {{#each keyPoints}}
  - {{{this}}}
  {{/each}}

  Please generate a biography that is engaging, professional, and ready for use in a press kit, website, or social media profile. Provide only the biography text.`,
});

const generateBioFlow = ai.defineFlow(
  {
    name: 'generateBioFlow',
    inputSchema: GenerateBioInputSchema,
    outputSchema: GenerateBioOutputSchema,
  },
  async input => {
    const {output} = await generateBioPrompt(input);
    return output!;
  }
);
