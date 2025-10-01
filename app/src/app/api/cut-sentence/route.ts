import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { sentence } = await request.json();

    if (!sentence || typeof sentence !== 'string') {
      return NextResponse.json({ error: 'Sentence is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const prompt = `You are a professional writing assistant specializing in making cover letters more concise. Given a sentence, provide exactly 3 different versions that are SHORTER and more direct, cutting out unnecessary words while keeping the meaning.

IMPORTANT GUIDELINES:
- Make sentences SIGNIFICANTLY SHORTER - aim for 20-40% word reduction
- Cut out filler words, redundant phrases, and corporate jargon
- Keep the core meaning and impact
- Sound natural and human, not robotic
- Remove unnecessary qualifiers and weak language
- Make every word count

Return the response as a JSON object with this exact structure:
{
  "suggestions": [
    "First shorter sentence",
    "Second shorter sentence", 
    "Third shorter sentence"
  ],
  "changes": [
    [{"from": "original_word_1", "to": "new_word_1"}, {"from": "original_phrase_1", "to": "new_phrase_1"}],
    [{"from": "original_word_2", "to": "new_word_2"}],
    [{"from": "original_word_3", "to": "new_word_3"}, {"from": "original_phrase_3", "to": "new_phrase_3"}]
  ]
}

Original sentence: "${sentence}"`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_completion_tokens: 500,
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const parsedResponse = JSON.parse(response);

    if (!parsedResponse.suggestions || !Array.isArray(parsedResponse.suggestions) ||
        !parsedResponse.changes || !Array.isArray(parsedResponse.changes)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return NextResponse.json(parsedResponse);

  } catch (error) {
    console.error('Error cutting sentence:', error);
    return NextResponse.json(
      { error: 'Failed to cut sentence' },
      { status: 500 }
    );
  }
}
