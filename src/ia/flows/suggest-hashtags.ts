// Server-side code
'use server';

/**
 * @fileOverview A flow that suggests relevant hashtags for social media posts based on uploaded content.
 *
 * - suggestHashtags - A function that generates hashtag suggestions.
 * - SuggestHashtagsInput - The input type for the suggestHashtags function.
 * - SuggestHashtagsOutput - The return type for the suggestHashtags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestHashtagsInputSchema = z.object({
  contentDescription: z
    .string()
    .describe('A description of the photo or video content.'),
  mediaType: z.enum(['photo', 'video']).describe('The type of media content.'),
  bandName: z.string().describe('The name of the band.'),
});
export type SuggestHashtagsInput = z.infer<typeof SuggestHashtagsInputSchema>;

const SuggestHashtagsOutputSchema = z.object({
  hashtags: z
    .array(z.string())
    .describe('An array of relevant hashtags for the content.'),
});
export type SuggestHashtagsOutput = z.infer<typeof SuggestHashtagsOutputSchema>;

export async function suggestHashtags(input: SuggestHashtagsInput): Promise<SuggestHashtagsOutput> {
  return suggestHashtagsFlow(input);
}

const suggestHashtagsPrompt = ai.definePrompt({
  name: 'suggestHashtagsPrompt',
  input: {schema: SuggestHashtagsInputSchema},
  output: {schema: SuggestHashtagsOutputSchema},
  prompt: `You are a social media expert for musical artists.

  Given the following information about a band's content, suggest relevant hashtags to maximize its reach on social media. Consider trending topics, musical genres, and the band's name.

  Band Name: {{{bandName}}}
  Content Type: {{{mediaType}}}
  Content Description: {{{contentDescription}}}

  Provide only the array of hashtags.  Do not include any other text.`,
});

const suggestHashtagsFlow = ai.defineFlow(
  {
    name: 'suggestHashtagsFlow',
    inputSchema: SuggestHashtagsInputSchema,
    outputSchema: SuggestHashtagsOutputSchema,
  },
  async input => {
    const {output} = await suggestHashtagsPrompt(input);
    return output!;
  }
);
