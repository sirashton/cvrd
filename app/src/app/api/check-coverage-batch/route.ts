import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { section, bulletPoints, coverLetter } = await request.json();

    if (!section || !bulletPoints || !Array.isArray(bulletPoints) || !coverLetter) {
      return NextResponse.json({ error: 'Section, bulletPoints array, and coverLetter are required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const sectionContext = {
      responsibilities: 'job responsibilities and duties',
      companyCulture: 'company culture and work environment aspects',
      technicalSkills: 'technical skills and qualifications'
    };

    const prompt = `
You are a hiring manager reviewing a cover letter against ${sectionContext[section as keyof typeof sectionContext]} from the job description.

Job Requirements (${section}):
${bulletPoints.map((point: string, index: number) => `${index + 1}. ${point}`).join('\n')}

Cover Letter:
${coverLetter}

For each requirement above, rate how well the cover letter addresses it on a scale of 0-100, where:
- 0-30: Not addressed at all or very poorly
- 31-60: Partially addressed or mentioned briefly
- 61-80: Well addressed with good examples
- 81-100: Excellently addressed with specific, relevant examples

Respond with JSON in this exact format:
{
  "results": [
    {
      "score": 85,
      "feedback": "The cover letter demonstrates strong experience with React and provides specific examples of projects built using this technology."
    },
    {
      "score": 45,
      "feedback": "The cover letter mentions leadership but doesn't provide specific examples of team management experience."
    }
  ]
}

Provide one result object for each requirement in the same order as listed above.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an experienced hiring manager who evaluates cover letters objectively. Always respond with valid JSON in the exact format requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let result;
    try {
      // Remove markdown code blocks if present
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      result = JSON.parse(cleanResponse);
    } catch {
      console.error('Failed to parse OpenAI response:', response);
      throw new Error('Failed to parse AI response');
    }

    // Validate the response structure
    if (!result.results || !Array.isArray(result.results)) {
      throw new Error('Invalid response structure from AI');
    }

    // Ensure scores are within valid range
    result.results = result.results.map((item: { score: number; feedback: string }) => ({
      ...item,
      score: Math.max(0, Math.min(100, item.score))
    }));

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error checking coverage:', error);
    return NextResponse.json(
      { error: 'Failed to check coverage' },
      { status: 500 }
    );
  }
}
