import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Parse PDF using DynamicPDF API REST endpoint
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Use DynamicPDF API REST endpoint for text extraction
    const response = await fetch('https://api.dpdf.io/v1.0/pdf-text', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DYNAMICPDF_API_KEY || 'DP.OVfU5AgxiKVceaZf3ADQXvaL/ZbgJiNg45F8lt4WpEXFQKYjeHRwUGDM'}`,
        'Content-Type': 'application/pdf',
        'accept': 'application/json',
      },
      body: buffer,
    });
    
    if (!response.ok) {
      throw new Error(`DynamicPDF API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // DynamicPDF API returns an array of page objects
    // Combine all page text into a single string
    const allText = result.map((page: { pageNumber: number; text: string }) => page.text).join('\n\n');
    const pageCount = result.length;
    
    const data = {
      text: allText,
      numpages: pageCount,
      info: {}
    };
    
    return NextResponse.json({ 
      success: true, 
      text: data.text,
      pages: data.numpages,
      info: data.info 
    });

  } catch (error) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to parse PDF file' }, 
      { status: 500 }
    );
  }
}
