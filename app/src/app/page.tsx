'use client';

import { useState, useEffect } from 'react';
import JobDescriptionPane from '../components/JobDescriptionPane';
import CoverLetterPane from '../components/CoverLetterPane';
import RestoreModal from '../components/RestoreModal';
import NeobrutalistButton from '../components/NeobrutalistButton';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ParsedData {
  responsibilities: string[];
  companyCulture: string[];
  technicalSkills: string[];
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [coverageResults, setCoverageResults] = useState<{[key: string]: {score: number, feedback: string}}>({});
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [hasShownRestoreModal, setHasShownRestoreModal] = useState(false);
  
  const { savedData, hasCheckedStorage, saveData, clearData } = useLocalStorage();

  // Show restore modal when saved data is found
  useEffect(() => {
    if (hasCheckedStorage && savedData && !hasShownRestoreModal) {
      console.log('📋 Showing restore modal for saved data');
      setShowRestoreModal(true);
      setHasShownRestoreModal(true);
    }
  }, [hasCheckedStorage, savedData, hasShownRestoreModal]);

  // Auto-save data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (jobDescription || coverLetter || parsedData) {
        saveData({
          jobDescription,
          coverLetter,
          parsedData,
          coverageResults
        });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [jobDescription, coverLetter, parsedData, coverageResults, saveData]);

  // Save data when important actions happen
  const handleParseJobDescription = () => {
    // This will be called from JobDescriptionPane
    setTimeout(() => {
      saveData({
        jobDescription,
        coverLetter,
        parsedData,
        coverageResults
      });
    }, 100);
  };

  const handleCheckCoverage = () => {
    // This will be called from JobDescriptionPane
    setTimeout(() => {
      saveData({
        jobDescription,
        coverLetter,
        parsedData,
        coverageResults
      });
    }, 100);
  };

  const handleRestoreData = () => {
    if (savedData) {
      console.log('🔄 Restoring previous work:', {
        jobDescriptionLength: savedData.jobDescription?.length || 0,
        coverLetterLength: savedData.coverLetter?.length || 0,
        hasParsedData: !!savedData.parsedData,
        parsedDataSummary: savedData.parsedData ? {
          responsibilities: savedData.parsedData.responsibilities?.length || 0,
          companyCulture: savedData.parsedData.companyCulture?.length || 0,
          technicalSkills: savedData.parsedData.technicalSkills?.length || 0
        } : null,
        coverageResultsCount: Object.keys(savedData.coverageResults || {}).length,
        lastSaved: savedData.lastSaved
      });
      setJobDescription(savedData.jobDescription);
      setCoverLetter(savedData.coverLetter);
      setParsedData(savedData.parsedData);
      setCoverageResults(savedData.coverageResults);
    }
    setShowRestoreModal(false);
  };

  const handleStartFresh = () => {
    console.log('🆕 Starting fresh - clearing all data');
    clearData();
    setJobDescription('');
    setCoverLetter('');
    setParsedData(null);
    setCoverageResults({});
    setShowRestoreModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">We&apos;ve got you </h1><NeobrutalistButton
                color="orange"
                pressable={false}
                logo={true}
              >
                CVRD
              </NeobrutalistButton>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">AI-powered cover letter assistant</p>
              <NeobrutalistButton
                onClick={handleStartFresh}
                color="gray"
                className="text-sm px-4 py-2"
              >
                Start Fresh
              </NeobrutalistButton>
            </div>
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
            coverageResults={coverageResults}
            setCoverageResults={setCoverageResults}
            onParseJobDescription={handleParseJobDescription}
            onCheckCoverage={handleCheckCoverage}
          />
          <CoverLetterPane 
            coverLetter={coverLetter}
            setCoverLetter={setCoverLetter}
          />
        </div>
      </main>

      <RestoreModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreData}
        onStartFresh={handleStartFresh}
        lastSaved={savedData?.lastSaved || ''}
      />
    </div>
  );
}
