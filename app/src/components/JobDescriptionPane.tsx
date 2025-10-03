'use client';

import { useState } from 'react';
import NeobrutalistButton from './NeobrutalistButton';
import CoverageScore from './CoverageScore';
import NeobrutalistPanel from './NeobrutalistPanel';

interface ParsedData {
  responsibilities: { summary: string; description: string }[];
  companyCulture: { summary: string; description: string }[];
  technicalSkills: { summary: string; description: string }[];
}

interface JobDescriptionPaneProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
  parsedData: ParsedData | null;
  setParsedData: (data: ParsedData | null) => void;
  coverLetter: string;
  coverageResults: {[key: string]: {score: number, feedback: string}};
  setCoverageResults: (results: {[key: string]: {score: number, feedback: string}}) => void;
  onParseJobDescription: () => void;
  onCheckCoverage: () => void;
}

export default function JobDescriptionPane({ 
  jobDescription, 
  setJobDescription, 
  parsedData, 
  setParsedData,
  coverLetter,
  coverageResults,
  setCoverageResults,
  onParseJobDescription,
  onCheckCoverage
}: JobDescriptionPaneProps) {
  const [isLoading, setIsLoading] = useState(false);

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
      onParseJobDescription(); // Trigger save
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

      // Create array of promises for parallel execution
      const promises = [];

      // Check responsibilities
      if (parsedData.responsibilities.length > 0) {
        promises.push(
          fetch('/api/check-coverage-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              section: 'responsibilities',
              bulletPoints: parsedData.responsibilities.map(item => item.description),
              coverLetter
            }),
          }).then(async (response) => {
            if (response.ok) {
              const data = await response.json();
              data.results.forEach((result: { score: number; feedback: string }, index: number) => {
                results[`resp-${index}`] = result;
              });
            }
          }).catch((error) => {
            console.error('Error checking responsibilities:', error);
          })
        );
      }

      // Check company culture
      if (parsedData.companyCulture.length > 0) {
        promises.push(
          fetch('/api/check-coverage-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              section: 'companyCulture',
              bulletPoints: parsedData.companyCulture.map(item => item.description),
              coverLetter
            }),
          }).then(async (response) => {
            if (response.ok) {
              const data = await response.json();
              data.results.forEach((result: { score: number; feedback: string }, index: number) => {
                results[`culture-${index}`] = result;
              });
            }
          }).catch((error) => {
            console.error('Error checking company culture:', error);
          })
        );
      }

      // Check technical skills
      if (parsedData.technicalSkills.length > 0) {
        promises.push(
          fetch('/api/check-coverage-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              section: 'technicalSkills',
              bulletPoints: parsedData.technicalSkills.map(item => item.description),
              coverLetter
            }),
          }).then(async (response) => {
            if (response.ok) {
              const data = await response.json();
              data.results.forEach((result: { score: number; feedback: string }, index: number) => {
                results[`skill-${index}`] = result;
              });
            }
          }).catch((error) => {
            console.error('Error checking technical skills:', error);
          })
        );
      }

      // Wait for all requests to complete in parallel
      await Promise.all(promises);

      setCoverageResults(results);
      onCheckCoverage(); // Trigger save
    } catch (error) {
      console.error('Error checking coverage:', error);
      alert('Failed to check coverage. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <NeobrutalistPanel 
      title="Job Description"
      subtitle="Paste the job description below to extract key points"
      className="flex flex-col"
    >
      <div className="flex-1 flex flex-col">
        <div className="flex-1 mb-4">
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="w-full h-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 mb-4">
          <NeobrutalistButton
            onClick={handleParseJobDescription}
            disabled={isLoading || !jobDescription.trim()}
            color="blue"
          >
            {isLoading ? 'Summarising...' : 'Summarise Job Description'}
          </NeobrutalistButton>
          
          {parsedData && (
            <NeobrutalistButton
              onClick={handleCheckCoverage}
              disabled={isLoading || !coverLetter.trim()}
              color="green"
            >
              {isLoading ? 'Checking...' : 'Have I covered it?'}
            </NeobrutalistButton>
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
                        <div className="flex items-center gap-2 mb-1">
                          {result && <CoverageScore score={result.score} />}
                          <span className="text-sm text-gray-700">{item.description}</span>
                        </div>
                        {result && (
                          <div className="mt-1">
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
                        <div className="flex items-center gap-2 mb-1">
                          {result && <CoverageScore score={result.score} />}
                          <span className="text-sm text-gray-700">{item.description}</span>
                        </div>
                        {result && (
                          <div className="mt-1">
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
                        <div className="flex items-center gap-2 mb-1">
                          {result && <CoverageScore score={result.score} />}
                          <span className="text-sm text-gray-700">{item.description}</span>
                        </div>
                        {result && (
                          <div className="mt-1">
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
    </NeobrutalistPanel>
  );
}
