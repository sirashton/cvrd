import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { jobDescription } = await request.json();

    if (!jobDescription) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const prompt = `
Analyze the following job description and extract key information into three categories:

1. Responsibilities: List 5-8 main job responsibilities and duties
2. Company Culture: List 3-5 cultural values, work environment, or company characteristics mentioned
3. Technical Skills: List 5-8 technical skills, tools, technologies, or qualifications required

Job Description:
${jobDescription}

Please respond with a JSON object in this exact format:
{
  "responsibilities": [
    {
      "summary": "1-2 word summary",
      "description": "full responsibility description"
    }
  ],
  "companyCulture": [
    {
      "summary": "1-2 word summary", 
      "description": "full culture point description"
    }
  ],
  "technicalSkills": [
    {
      "summary": "1-2 word summary",
      "description": "full skill description"
    }
  ]
}

For each item:
- "summary": Provide a 1-2 word summary that captures the essence (e.g., "React Development", "Team Collaboration", "Python")
- "description": The full, detailed description of the requirement, but be concise and to the point.

Make each bullet point concise but descriptive. Focus on the most important and specific requirements. Do not infer any information from the job description that is not explicitly stated.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing job descriptions and extracting key information. Always respond with valid JSON in the exact format requested."
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
    let parsedData;
    try {
      parsedData = JSON.parse(response);
    } catch {
      console.error('Failed to parse OpenAI response:', response);
      throw new Error('Failed to parse AI response');
    }

    // Validate the response structure
    if (!parsedData.responsibilities || !parsedData.companyCulture || !parsedData.technicalSkills) {
      throw new Error('Invalid response structure from AI');
    }

    // Validate that each item has summary and description
    const validateItems = (items: { summary: string; description: string }[], category: string) => {
      if (!Array.isArray(items)) {
        throw new Error(`Invalid ${category} structure`);
      }
      items.forEach((item, index) => {
        if (!item.summary || !item.description) {
          throw new Error(`Invalid ${category} item at index ${index}: missing summary or description`);
        }
      });
    };

    validateItems(parsedData.responsibilities, 'responsibilities');
    validateItems(parsedData.companyCulture, 'companyCulture');
    validateItems(parsedData.technicalSkills, 'technicalSkills');

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Error parsing job description:', error);
    return NextResponse.json(
      { error: 'Failed to parse job description' },
      { status: 500 }
    );
  }
}
