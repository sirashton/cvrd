'use client';

import { useState, useEffect } from 'react';
import JobDescriptionPane from '../components/JobDescriptionPane';
import CoverLetterPane from '../components/CoverLetterPane';
import RestoreModal from '../components/RestoreModal';
import MobileWarning from '../components/MobileWarning';
import NeobrutalistButton from '../components/NeobrutalistButton';
import BuyMeACoffeeButton from '../components/BuyMeACoffeeButton';
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MobileWarning />
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-3 sm:py-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Have you </h1>
              <NeobrutalistButton
                color="orange"
                pressable={false}
                logo={true}
                className="text-sm sm:text-base"
              >
                CVRD
              </NeobrutalistButton>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">everything?</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">AI-powered cover letter assistant</p>
              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href="https://buymeacoffee.com/alexashton"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <NeobrutalistButton
                    color="yellow"
                    className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                  >
                    ☕ Buy me a coffee
                  </NeobrutalistButton>
                </a>
                <NeobrutalistButton
                  onClick={handleStartFresh}
                  color="gray"
                  className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
                >
                  Start Fresh
                </NeobrutalistButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 w-full">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 h-full">
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

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <NeobrutalistButton
                color="gray"
                pressable={false}
                className="text-xs px-2 py-1"
              >
                CVRD
              </NeobrutalistButton>
              <span className="text-xs sm:text-sm text-gray-500">Cover Letter Analyst</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Given freely to the world by <a href="https://www.linkedin.com/in/alex-e-ashton/" className="text-blue-500 hover:text-blue-600">Alex Ashton</a>
              </div>
              <BuyMeACoffeeButton size="small" />
            </div>
          </div>
        </div>
      </footer>

      <RestoreModal
        isOpen={showRestoreModal}
        onRestore={handleRestoreData}
        onStartFresh={handleStartFresh}
        lastSaved={savedData?.lastSaved || ''}
      />
    </div>
  );
}
