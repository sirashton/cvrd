'use client';

import { useState } from 'react';
import NeobrutalistPanel from './NeobrutalistPanel';
import NeobrutalistButton from './NeobrutalistButton';
import CustomTooltip from './CustomTooltip';

interface ParsedData {
  responsibilities: { summary: string; description: string }[];
  companyCulture: { summary: string; description: string }[];
  technicalSkills: { summary: string; description: string }[];
}

interface BatchFile {
  id: string;
  name: string;
  file: File;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  results?: {
    summaryScore: number;
    individualScores: {
      responsibilities: { score: number; feedback: string };
      companyCulture: { score: number; feedback: string };
      technicalSkills: { score: number; feedback: string };
    };
  };
}

interface BatchModeProps {
  jobDescription: string;
  setJobDescription: (value: string) => void;
  parsedData: ParsedData | null;
  setParsedData: (data: ParsedData | null) => void;
  weights: {[key: string]: number};
  setWeights: (weights: {[key: string]: number}) => void;
  onSaveData: () => void;
}

export default function BatchMode({ 
  jobDescription, 
  setJobDescription, 
  parsedData, 
  setParsedData, 
  weights, 
  setWeights, 
  onSaveData 
}: BatchModeProps) {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupCollapsed, setSetupCollapsed] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(true);
  const [swapRowsColumns, setSwapRowsColumns] = useState(false);
  const [scores, setScores] = useState<{[key: string]: {[key: string]: {score: number, feedback: string}}}>({});
  const [isScoring, setIsScoring] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'score'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const parseFileContent = async (file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    switch (fileExtension) {
      case 'txt':
        return await file.text();
      
      case 'pdf':
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/parse-pdf', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to parse PDF');
          }
          
          const data = await response.json();
          return data.text;
        } catch (error) {
          console.error('Error parsing PDF:', error);
          throw new Error('Failed to parse PDF file');
        }
      
      case 'docx':
        try {
          const mammoth = await import('mammoth');
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          return result.value;
        } catch (error) {
          console.error('Error parsing DOCX:', error);
          throw new Error('Failed to parse DOCX file');
        }
      
      
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  };

  const handleFiles = async (newFiles: File[]) => {
    // First, add all files with pending status
    const initialFiles: BatchFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file,
      content: '',
      status: 'pending' as const
    }));
    
    setFiles(prev => [...prev, ...initialFiles]);
    
    // Then process each file asynchronously
    initialFiles.forEach(async (batchFile) => {
      try {
        // Update status to processing
        setFiles(prev => prev.map(f => 
          f.id === batchFile.id 
            ? { ...f, status: 'processing' as const }
            : f
        ));
        
        // Parse the file content
        const content = await parseFileContent(batchFile.file);
        
        // Update with parsed content and completed status
        setFiles(prev => prev.map(f => 
          f.id === batchFile.id 
            ? { ...f, content, status: 'completed' as const }
            : f
        ));
        
      } catch (error) {
        console.error(`Error processing ${batchFile.name}:`, error);
        
        // Update with error status
        setFiles(prev => prev.map(f => 
          f.id === batchFile.id 
            ? { ...f, status: 'error' as const }
            : f
        ));
      }
    });
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

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
      
      // Clear existing scores and feedback since criteria have changed
      setScores({});
      
      // Initialize weights with default value of 5 if not already set
      const currentWeights = { ...weights };
      let weightsUpdated = false;
      
      data.responsibilities.forEach((_: { summary: string; description: string }, index: number) => {
        if (!currentWeights[`resp-${index}`]) {
          currentWeights[`resp-${index}`] = 5;
          weightsUpdated = true;
        }
      });
      data.companyCulture.forEach((_: { summary: string; description: string }, index: number) => {
        if (!currentWeights[`culture-${index}`]) {
          currentWeights[`culture-${index}`] = 5;
          weightsUpdated = true;
        }
      });
      data.technicalSkills.forEach((_: { summary: string; description: string }, index: number) => {
        if (!currentWeights[`skill-${index}`]) {
          currentWeights[`skill-${index}`] = 5;
          weightsUpdated = true;
        }
      });
      
      if (weightsUpdated) {
        setWeights(currentWeights);
      }
      
      onSaveData(); // Save data to localStorage
    } catch (error) {
      console.error('Error parsing job description:', error);
      alert('Failed to parse job description. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateWeight = (key: string, delta: number) => {
    const newWeights = {
      ...weights,
      [key]: Math.max(0, Math.min(10, (weights[key] || 5) + delta))
    };
    setWeights(newWeights);
  };

  const processAllFiles = async () => {
    if (!parsedData || files.length === 0) return;
    
    // Only process files that have been successfully parsed
    const completedFiles = files.filter(file => file.status === 'completed' && file.content.length > 0);
    
    if (completedFiles.length === 0) {
      alert('No files are ready for processing. Please wait for files to finish parsing or check for errors.');
      return;
    }
    
    setIsScoring(true);
    setScores({});
    
    // Create promises for all file-section combinations
    const promises = completedFiles.map(file => {
      const filePromises = [];
      
      // Process responsibilities
      if (parsedData.responsibilities.length > 0) {
        filePromises.push(
          fetch('/api/check-coverage-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              section: 'responsibilities',
              bulletPoints: parsedData.responsibilities.map(item => item.description),
              coverLetter: file.content
            }),
          }).then(async (response) => {
            if (response.ok) {
              const data = await response.json();
              data.results.forEach((result: { score: number; feedback: string }, index: number) => {
                setScores(prev => ({
                  ...prev,
                  [file.id]: {
                    ...prev[file.id],
                    [`resp-${index}`]: result
                  }
                }));
              });
            }
          }).catch((error) => {
            console.error(`Error scoring ${file.name} for responsibilities:`, error);
          })
        );
      }
      
      // Process company culture
      if (parsedData.companyCulture.length > 0) {
        filePromises.push(
          fetch('/api/check-coverage-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              section: 'companyCulture',
              bulletPoints: parsedData.companyCulture.map(item => item.description),
              coverLetter: file.content
            }),
          }).then(async (response) => {
            if (response.ok) {
              const data = await response.json();
              data.results.forEach((result: { score: number; feedback: string }, index: number) => {
                setScores(prev => ({
                  ...prev,
                  [file.id]: {
                    ...prev[file.id],
                    [`culture-${index}`]: result
                  }
                }));
              });
            }
          }).catch((error) => {
            console.error(`Error scoring ${file.name} for company culture:`, error);
          })
        );
      }
      
      // Process technical skills
      if (parsedData.technicalSkills.length > 0) {
        filePromises.push(
          fetch('/api/check-coverage-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              section: 'technicalSkills',
              bulletPoints: parsedData.technicalSkills.map(item => item.description),
              coverLetter: file.content
            }),
          }).then(async (response) => {
            if (response.ok) {
              const data = await response.json();
              data.results.forEach((result: { score: number; feedback: string }, index: number) => {
                setScores(prev => ({
                  ...prev,
                  [file.id]: {
                    ...prev[file.id],
                    [`skill-${index}`]: result
                  }
                }));
              });
            }
          }).catch((error) => {
            console.error(`Error scoring ${file.name} for technical skills:`, error);
          })
        );
      }
      
      return filePromises;
    });

    // Wait for all promises to complete
    await Promise.all(promises.flat());
    setIsScoring(false);
  };

  const getScore = (fileId: string, criteriaKey: string) => {
    return scores[fileId]?.[criteriaKey] || null;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getSummaryScore = (fileId: string) => {
    const fileScores = scores[fileId];
    if (!fileScores) return null;

    const allScores = Object.values(fileScores);
    if (allScores.length === 0) return null;

    // Calculate weighted average
    let totalWeightedScore = 0;
    let totalWeight = 0;

    Object.entries(fileScores).forEach(([criteriaKey, score]) => {
      const weight = weights[criteriaKey] ?? 5;
      totalWeightedScore += score.score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  };

  const getSortedFiles = () => {
    const sortedFiles = [...files].sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        const scoreA = getSummaryScore(a.id) ?? 0;
        const scoreB = getSummaryScore(b.id) ?? 0;
        return sortOrder === 'asc' 
          ? scoreA - scoreB
          : scoreB - scoreA;
      }
    });
    return sortedFiles;
  };


  return (
    <div className="space-y-6">
      {/* Setup Section */}
      <div>
        {/* Setup Section Header */}
        <div className="flex items-center mb-4">
          <div className="flex-1 h-1 bg-gray-300"></div>
          <NeobrutalistButton
            onClick={() => setSetupCollapsed(!setupCollapsed)}
            color="gray"
            className="mx-6 px-6 py-2 whitespace-nowrap"
          >
            {setupCollapsed ? 'Show Setup' : 'Hide Setup'}
          </NeobrutalistButton>
          <div className="flex-1 h-1 bg-gray-300"></div>
        </div>

        {!setupCollapsed && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column - Job Description */}
            <div className="space-y-6">
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
                className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  onClick={() => {
                    const resetWeights: {[key: string]: number} = {};
                    parsedData.responsibilities.forEach((_, index) => {
                      resetWeights[`resp-${index}`] = 5;
                    });
                    parsedData.companyCulture.forEach((_, index) => {
                      resetWeights[`culture-${index}`] = 5;
                    });
                    parsedData.technicalSkills.forEach((_, index) => {
                      resetWeights[`skill-${index}`] = 5;
                    });
                    setWeights(resetWeights);
                  }}
                  color="gray"
                >
                  Reset Weights
                </NeobrutalistButton>
              )}
            </div>

            {parsedData && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Responsibilities</h3>
                  <ul className="space-y-2">
                    {parsedData.responsibilities.map((item, index) => {
                      const weightKey = `resp-${index}`;
                      return (
                        <li key={index} className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex items-center gap-1 bg-white border-2 border-gray-600 rounded-lg px-2 py-1 shadow-[2px_2px_0px_0px_rgb(75,85,99)]">
                                <button
                                  onClick={() => updateWeight(weightKey, -1)}
                                  className="text-gray-600 hover:text-gray-800 font-bold text-lg leading-none px-1 py-0.5 hover:bg-gray-100 rounded"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium min-w-[20px] text-center">
                                  {weights[weightKey] ?? 5}
                                </span>
                                <button
                                  onClick={() => updateWeight(weightKey, 1)}
                                  className="text-gray-600 hover:text-gray-800 font-bold text-lg leading-none px-1 py-0.5 hover:bg-gray-100 rounded"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm text-gray-700">{item.description}</span>
                            </div>
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
                      const weightKey = `culture-${index}`;
                      return (
                        <li key={index} className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex items-center gap-1 bg-white border-2 border-gray-600 rounded-lg px-2 py-1 shadow-[2px_2px_0px_0px_rgb(75,85,99)]">
                                <button
                                  onClick={() => updateWeight(weightKey, -1)}
                                  className="text-gray-600 hover:text-gray-800 font-bold text-lg leading-none px-1 py-0.5 hover:bg-gray-100 rounded"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium min-w-[20px] text-center">
                                  {weights[weightKey] ?? 5}
                                </span>
                                <button
                                  onClick={() => updateWeight(weightKey, 1)}
                                  className="text-gray-600 hover:text-gray-800 font-bold text-lg leading-none px-1 py-0.5 hover:bg-gray-100 rounded"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm text-gray-700">{item.description}</span>
                            </div>
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
                      const weightKey = `skill-${index}`;
                      return (
                        <li key={index} className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex items-center gap-1 bg-white border-2 border-gray-600 rounded-lg px-2 py-1 shadow-[2px_2px_0px_0px_rgb(75,85,99)]">
                                <button
                                  onClick={() => updateWeight(weightKey, -1)}
                                  className="text-gray-600 hover:text-gray-800 font-bold text-lg leading-none px-1 py-0.5 hover:bg-gray-100 rounded"
                                >
                                  -
                                </button>
                                <span className="text-sm font-medium min-w-[20px] text-center">
                                  {weights[weightKey] ?? 5}
                                </span>
                                <button
                                  onClick={() => updateWeight(weightKey, 1)}
                                  className="text-gray-600 hover:text-gray-800 font-bold text-lg leading-none px-1 py-0.5 hover:bg-gray-100 rounded"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm text-gray-700">{item.description}</span>
                            </div>
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
      </div>

      {/* Right Column - File Upload and Processing */}
      <div className="space-y-6">
        {/* File Upload Area */}
        <NeobrutalistPanel
          title="Upload Files"
          subtitle={files.length > 0 ? `${files.length} file(s) ready for processing` : "Upload your cover letter files"}
          className="flex flex-col"
        >
          {/* File List */}
          {files.length > 0 && (
            <div className="mb-6">
              <div className="max-h-128 overflow-y-auto space-y-3 pr-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                      file.status === 'completed' 
                        ? 'bg-green-50 border-green-200' 
                        : file.status === 'error'
                        ? 'bg-red-50 border-red-200'
                        : file.status === 'processing'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">
                        {file.status === 'completed' ? '✅' : 
                         file.status === 'error' ? '❌' : 
                         file.status === 'processing' ? '⏳' : '📄'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.status === 'completed' && `Ready (${file.content.length} chars)`}
                          {file.status === 'processing' && 'Processing...'}
                          {file.status === 'error' && 'Failed to parse'}
                          {file.status === 'pending' && 'Pending'}
                        </p>
                      </div>
                    </div>
                    <NeobrutalistButton
                      onClick={() => removeFile(file.id)}
                      color="red"
                      className="text-sm px-3 py-1"
                    >
                      Remove
                    </NeobrutalistButton>
                  </div>
                ))}
              </div>
              
            </div>
          )}

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer block"
            >
              <div className="text-4xl mb-4">📁</div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, DOCX, and TXT files
              </p>
            </label>
          </div>
        </NeobrutalistPanel>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div>
        {/* Results Section Header */}
        <div className="flex items-center mb-4">
          <div className="flex-1 h-1 bg-gray-300"></div>
          <NeobrutalistButton
            onClick={() => setResultsCollapsed(!resultsCollapsed)}
            color="blue"
            className="mx-6 px-6 py-2 whitespace-nowrap"
          >
            {resultsCollapsed ? 'Show Results' : 'Hide Results'}
          </NeobrutalistButton>
          <div className="flex-1 h-1 bg-gray-300"></div>
        </div>

        {!resultsCollapsed && (
          <NeobrutalistPanel
            title="Results"
            subtitle="Analysis results for your uploaded files"
            className="w-full"
          >
            {(parsedData || files.length > 0) ? (
              <div className="space-y-4">
                {/* Table Controls */}
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    {files.length} file(s) uploaded
                    {parsedData && ` • ${parsedData.responsibilities.length + parsedData.companyCulture.length + parsedData.technicalSkills.length} criteria`}
                  </div>
                  <NeobrutalistButton
                    onClick={() => setSwapRowsColumns(!swapRowsColumns)}
                    color="blue"
                    className="px-4 py-2 text-sm"
                  >
                    {swapRowsColumns ? 'Candidates as Rows' : 'Candidates as Columns'}
                  </NeobrutalistButton>
                  <NeobrutalistButton
                    onClick={processAllFiles}
                    disabled={!parsedData || files.filter(f => f.status === 'completed').length === 0 || isScoring}
                    color="green"
                    className="px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isScoring ? 'Processing...' : `Process Files (${files.filter(f => f.status === 'completed').length} ready)`}
                  </NeobrutalistButton>
                  
                  {/* Sort Controls */}
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'score')}
                      className="border-2 border-gray-600 rounded px-2 py-1 text-sm bg-white"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="score">Sort by Score</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="border-2 border-gray-600 rounded px-2 py-1 text-sm bg-white hover:bg-gray-100"
                      title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                  </div>
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border-2 border-gray-600">
                    <thead>
                      <tr className="bg-gray-100">
                        {swapRowsColumns ? (
                          <>
                            <th className="border-2 border-gray-600 px-4 py-2 text-left font-bold">Criteria</th>
                            {getSortedFiles().map((file) => (
                              <th key={file.id} className="border-2 border-gray-600 px-4 py-2 text-center font-bold min-w-[120px]">
                                {file.name.length > 15 ? `${file.name.substring(0, 15)}...` : file.name}
                              </th>
                            ))}
                          </>
                        ) : (
                          <>
                            <th className="border-2 border-gray-600 px-4 py-2 text-left font-bold">File Name</th>
                            <th className="border-2 border-gray-600 px-4 py-2 text-center font-bold">Summary</th>
                            {parsedData?.responsibilities.map((item, index) => (
                              <th 
                                key={`resp-${index}`} 
                                className="border-2 border-gray-600 px-4 py-2 text-center font-bold min-w-[100px]"
                              >
                                <CustomTooltip content={item.description}>
                                  <span className="cursor-help">{item.summary}</span>
                                </CustomTooltip>
                              </th>
                            ))}
                            {parsedData?.companyCulture.map((item, index) => (
                              <th 
                                key={`culture-${index}`} 
                                className="border-2 border-gray-600 px-4 py-2 text-center font-bold min-w-[100px]"
                              >
                                <CustomTooltip content={item.description}>
                                  <span className="cursor-help">{item.summary}</span>
                                </CustomTooltip>
                              </th>
                            ))}
                            {parsedData?.technicalSkills.map((item, index) => (
                              <th 
                                key={`skill-${index}`} 
                                className="border-2 border-gray-600 px-4 py-2 text-center font-bold min-w-[100px]"
                              >
                                <CustomTooltip content={item.description}>
                                  <span className="cursor-help">{item.summary}</span>
                                </CustomTooltip>
                              </th>
                            ))}
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {swapRowsColumns ? (
                        // Candidates as columns, criteria as rows
                        <>
                          {/* Summary row - first */}
                          <tr key="summary" className="bg-gray-50 font-bold">
                            <td className="border-2 border-gray-600 px-4 py-2 font-medium">
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-gray-600 text-white px-2 py-1 rounded">Summary</span>
                                <span className="text-sm font-bold">Weighted Average</span>
                              </div>
                            </td>
                            {getSortedFiles().map((file) => {
                              const summaryScore = getSummaryScore(file.id);
                              return (
                                <td key={file.id} className="border-2 border-gray-600 px-4 py-2 text-center">
                                  {summaryScore !== null ? (
                                    <div className={`inline-block px-3 py-1 rounded text-sm font-bold ${getScoreColor(summaryScore)}`}>
                                      {summaryScore}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 text-sm">-</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                          {parsedData?.responsibilities.map((item, index) => (
                            <tr key={`resp-${index}`}>
                              <td className="border-2 border-gray-600 px-4 py-2 font-medium">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Resp</span>
                                  <CustomTooltip content={item.description}>
                                    <span className="text-sm font-bold cursor-help">
                                      {item.summary}
                                    </span>
                                  </CustomTooltip>
                                </div>
                              </td>
                              {getSortedFiles().map((file) => {
                                const score = getScore(file.id, `resp-${index}`);
                                return (
                                  <td key={file.id} className="border-2 border-gray-600 px-4 py-2 text-center">
                                    {score ? (
                                      <CustomTooltip content={score.feedback}>
                                        <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getScoreColor(score.score)}`}>
                                          {score.score}
                                        </div>
                                      </CustomTooltip>
                                    ) : (
                                      <div className="text-gray-400 text-sm">-</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                          {parsedData?.companyCulture.map((item, index) => (
                            <tr key={`culture-${index}`}>
                              <td className="border-2 border-gray-600 px-4 py-2 font-medium">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Culture</span>
                                  <CustomTooltip content={item.description}>
                                    <span className="text-sm font-bold cursor-help">
                                      {item.summary}
                                    </span>
                                  </CustomTooltip>
                                </div>
                              </td>
                              {getSortedFiles().map((file) => {
                                const score = getScore(file.id, `culture-${index}`);
                                return (
                                  <td key={file.id} className="border-2 border-gray-600 px-4 py-2 text-center">
                                    {score ? (
                                      <CustomTooltip content={score.feedback}>
                                        <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getScoreColor(score.score)}`}>
                                          {score.score}
                                        </div>
                                      </CustomTooltip>
                                    ) : (
                                      <div className="text-gray-400 text-sm">-</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                          {parsedData?.technicalSkills.map((item, index) => (
                            <tr key={`skill-${index}`}>
                              <td className="border-2 border-gray-600 px-4 py-2 font-medium">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Skill</span>
                                  <CustomTooltip content={item.description}>
                                    <span className="text-sm font-bold cursor-help">
                                      {item.summary}
                                    </span>
                                  </CustomTooltip>
                                </div>
                              </td>
                              {getSortedFiles().map((file) => {
                                const score = getScore(file.id, `skill-${index}`);
                                return (
                                  <td key={file.id} className="border-2 border-gray-600 px-4 py-2 text-center">
                                    {score ? (
                                      <CustomTooltip content={score.feedback}>
                                        <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getScoreColor(score.score)}`}>
                                          {score.score}
                                        </div>
                                      </CustomTooltip>
                                    ) : (
                                      <div className="text-gray-400 text-sm">-</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </>
                      ) : (
                        // Candidates as rows, criteria as columns
                        getSortedFiles().map((file) => (
                          <tr key={file.id}>
                            <td className="border-2 border-gray-600 px-4 py-2 font-medium">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">📄</span>
                                <span className="text-sm">{file.name}</span>
                              </div>
                            </td>
                            <td className="border-2 border-gray-600 px-4 py-2 text-center">
                              {(() => {
                                const summaryScore = getSummaryScore(file.id);
                                return summaryScore !== null ? (
                                  <div className={`inline-block px-3 py-1 rounded text-sm font-bold ${getScoreColor(summaryScore)}`}>
                                    {summaryScore}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-sm">-</div>
                                );
                              })()}
                            </td>
                            {parsedData?.responsibilities.map((_, index) => {
                              const score = getScore(file.id, `resp-${index}`);
                              return (
                                <td key={`resp-${index}`} className="border-2 border-gray-600 px-4 py-2 text-center">
                                  {score ? (
                                    <CustomTooltip content={score.feedback}>
                                      <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getScoreColor(score.score)}`}>
                                        {score.score}
                                      </div>
                                    </CustomTooltip>
                                  ) : (
                                    <div className="text-gray-400 text-sm">-</div>
                                  )}
                                </td>
                              );
                            })}
                            {parsedData?.companyCulture.map((_, index) => {
                              const score = getScore(file.id, `culture-${index}`);
                              return (
                                <td key={`culture-${index}`} className="border-2 border-gray-600 px-4 py-2 text-center">
                                  {score ? (
                                    <CustomTooltip content={score.feedback}>
                                      <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getScoreColor(score.score)}`}>
                                        {score.score}
                                      </div>
                                    </CustomTooltip>
                                  ) : (
                                    <div className="text-gray-400 text-sm">-</div>
                                  )}
                                </td>
                              );
                            })}
                            {parsedData?.technicalSkills.map((_, index) => {
                              const score = getScore(file.id, `skill-${index}`);
                              return (
                                <td key={`skill-${index}`} className="border-2 border-gray-600 px-4 py-2 text-center">
                                  {score ? (
                                    <CustomTooltip content={score.feedback}>
                                      <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getScoreColor(score.score)}`}>
                                        {score.score}
                                      </div>
                                    </CustomTooltip>
                                  ) : (
                                    <div className="text-gray-400 text-sm">-</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Upload files and parse a job description to see results</p>
              </div>
            )}
          </NeobrutalistPanel>
        )}
      </div>
    </div>
  );
}
