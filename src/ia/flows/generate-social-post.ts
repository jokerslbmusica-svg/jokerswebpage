// Server-side code
'use server';

/**
 * @fileOverview A flow that generates a social media post for a band.
 *
 * - generateSocialPost - A function that generates a post based on a topic, platform, and an optional flyer image.
 * - GenerateSocialPostInput - The input type for the generateSocialPost function.
 * - GenerateSocialPostOutput - The return type for the generateSocialPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { socialPlatforms } from '@/config/band-constants';

const GenerateSocialPostInputSchema = z.object({
  topic: z.string().describe('The main topic or event for the social media post.'),
  platform: z.enum(socialPlatforms).describe('The social media platform the post is for.'),
  flyerDataUri: z.optional(z.string()).describe(
    "An optional flyer for the event, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  bandName: z.string().describe('The name of the band, to be included in the post.'),
});
export type GenerateSocialPostInput = z.infer<typeof GenerateSocialPostInputSchema>;

const GenerateSocialPostOutputSchema = z.object({
  postText: z
    .string()
    .describe('The generated text content for the social media post, including relevant hashtags.'),
});
export type GenerateSocialPostOutput = z.infer<typeof GenerateSocialPostOutputSchema>;


export async function generateSocialPost(input: GenerateSocialPostInput): Promise<GenerateSocialPostOutput> {
  return generateSocialPostFlow(input);
}

const generateSocialPostPrompt = ai.definePrompt({
  name: 'generateSocialPostPrompt',
  input: {schema: GenerateSocialPostInputSchema},
  output: {schema: GenerateSocialPostOutputSchema},
  prompt: `You are an expert social media manager for a rock band named "{{bandName}}".

  Your task is to write an engaging social media post.

  - Target Platform: {{platform}}
  - Main Topic: {{{topic}}}
  {{#if flyerDataUri}}
  - Key Information from Flyer: Analyze the provided image of the promotional flyer. Extract key details like date, time, venue, special guests, or special offers and incorporate them naturally into the post.
  - Flyer: {{media url=flyerDataUri}}
  {{/if}}

  Your tone should be energetic and exciting. Adapt the post length and style for the specified platform. Include a call to action, like asking a question or encouraging shares.

  Finally, add a list of 5-10 relevant hashtags to maximize reach.

  Please generate the complete post text.`,
});

const generateSocialPostFlow = ai.defineFlow(
  {
    name: 'generateSocialPostFlow',
    inputSchema: GenerateSocialPostInputSchema,
    outputSchema: GenerateSocialPostOutputSchema,
  },
  async input => {
    const {output} = await generateSocialPostPrompt(input);
    return output!;
  }
);
