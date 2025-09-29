'use client';

import { useState } from 'react';
import JobDescriptionPane from '@/components/JobDescriptionPane';
import CoverLetterPane from '@/components/CoverLetterPane';

export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [parsedData, setParsedData] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Cover Letter Generator</h1>
            <p className="text-sm text-gray-500">AI-powered job application assistant</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
          <JobDescriptionPane 
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            parsedData={parsedData}
            setParsedData={setParsedData}
            coverLetter={coverLetter}
          />
          <CoverLetterPane 
            coverLetter={coverLetter}
            setCoverLetter={setCoverLetter}
          />
        </div>
      </main>
    </div>
  );
}
