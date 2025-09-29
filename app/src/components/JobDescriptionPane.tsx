'use client';

import { useState } from 'react';

interface ParsedData {
  responsibilities: string[];
  companyCulture: string[];
  technicalSkills: string[];
}

interface JobDescriptionPaneProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
  parsedData: ParsedData | null;
  setParsedData: (data: ParsedData | null) => void;
  coverLetter: string;
}

export default function JobDescriptionPane({ 
  jobDescription, 
  setJobDescription, 
  parsedData, 
  setParsedData,
  coverLetter 
}: JobDescriptionPaneProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [coverageResults, setCoverageResults] = useState<{[key: string]: {score: number, feedback: string}}>({});

  const handleParseJobDescription = async () => {
    if (!jobDescription.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/parse-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobDescription }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse job description');
      }

      const data = await response.json();
      setParsedData(data);
    } catch (error) {
      console.error('Error parsing job description:', error);
      alert('Failed to parse job description. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckCoverage = async () => {
    if (!parsedData || !coverLetter.trim()) {
      alert('Please parse a job description and write a cover letter first.');
      return;
    }

    setIsLoading(true);
    try {
      const results: {[key: string]: {score: number, feedback: string}} = {};

      // Check responsibilities
      if (parsedData.responsibilities.length > 0) {
        try {
          const response = await fetch('/api/check-coverage-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              section: 'responsibilities',
              bulletPoints: parsedData.responsibilities,
              coverLetter
            }),
          });

          if (response.ok) {
            const data = await response.json();
            data.results.forEach((result: any, index: number) => {
              results[`resp-${index}`] = result;
            });
          }
        } catch (error) {
          console.error('Error checking responsibilities:', error);
        }
      }

      // Check company culture
      if (parsedData.companyCulture.length > 0) {
        try {
          const response = await fetch('/api/check-coverage-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              section: 'companyCulture',
              bulletPoints: parsedData.companyCulture,
              coverLetter
            }),
          });

          if (response.ok) {
            const data = await response.json();
            data.results.forEach((result: any, index: number) => {
              results[`culture-${index}`] = result;
            });
          }
        } catch (error) {
          console.error('Error checking company culture:', error);
        }
      }

      // Check technical skills
      if (parsedData.technicalSkills.length > 0) {
        try {
          const response = await fetch('/api/check-coverage-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              section: 'technicalSkills',
              bulletPoints: parsedData.technicalSkills,
              coverLetter
            }),
          });

          if (response.ok) {
            const data = await response.json();
            data.results.forEach((result: any, index: number) => {
              results[`skill-${index}`] = result;
            });
          }
        } catch (error) {
          console.error('Error checking technical skills:', error);
        }
      }

      setCoverageResults(results);
    } catch (error) {
      console.error('Error checking coverage:', error);
      alert('Failed to check coverage. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
        <p className="text-sm text-gray-500 mt-1">Paste the job description below to extract key points</p>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <div className="flex-1 mb-4">
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="w-full h-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={handleParseJobDescription}
            disabled={isLoading || !jobDescription.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Parsing...' : 'Parse Job Description'}
          </button>
          
          {parsedData && (
            <button
              onClick={handleCheckCoverage}
              disabled={isLoading || !coverLetter.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Checking...' : 'Have I covered it?'}
            </button>
          )}
        </div>

        {parsedData && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Responsibilities</h3>
              <ul className="space-y-2">
                {parsedData.responsibilities.map((item, index) => {
                  const result = coverageResults[`resp-${index}`];
                  return (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">{item}</span>
                        {result && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(result.score)}`}>
                              {result.score}/100
                            </span>
                            <span className="text-xs text-gray-600">{result.feedback}</span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Company Culture</h3>
              <ul className="space-y-2">
                {parsedData.companyCulture.map((item, index) => {
                  const result = coverageResults[`culture-${index}`];
                  return (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">{item}</span>
                        {result && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(result.score)}`}>
                              {result.score}/100
                            </span>
                            <span className="text-xs text-gray-600">{result.feedback}</span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Technical Skills</h3>
              <ul className="space-y-2">
                {parsedData.technicalSkills.map((item, index) => {
                  const result = coverageResults[`skill-${index}`];
                  return (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <div className="flex-1">
                        <span className="text-sm text-gray-700">{item}</span>
                        {result && (
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(result.score)}`}>
                              {result.score}/100
                            </span>
                            <span className="text-xs text-gray-600">{result.feedback}</span>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
