import { useState, useEffect } from 'react';

interface SavedData {
  jobDescription: string;
  coverLetter: string;
  parsedData: {
    responsibilities: { summary: string; description: string }[];
    companyCulture: { summary: string; description: string }[];
    technicalSkills: { summary: string; description: string }[];
  } | null;
  coverageResults: {[key: string]: {score: number, feedback: string}};
  lastSaved: string;
}

const STORAGE_KEY = 'cvrd-saved-data';

export function useLocalStorage() {
  const [savedData, setSavedData] = useState<SavedData | null>(null);
  const [hasCheckedStorage, setHasCheckedStorage] = useState(false);

  // Check for saved data on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if data is recent (within last 30 days)
        const lastSaved = new Date(parsed.lastSaved);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        if (lastSaved > thirtyDaysAgo) {
          console.log('📁 Loading saved data from localStorage:', {
            jobDescriptionLength: parsed.jobDescription?.length || 0,
            coverLetterLength: parsed.coverLetter?.length || 0,
            hasParsedData: !!parsed.parsedData,
            parsedDataSummary: parsed.parsedData ? {
              responsibilities: parsed.parsedData.responsibilities?.length || 0,
              companyCulture: parsed.parsedData.companyCulture?.length || 0,
              technicalSkills: parsed.parsedData.technicalSkills?.length || 0
            } : null,
            coverageResultsCount: Object.keys(parsed.coverageResults || {}).length,
            lastSaved: parsed.lastSaved
          });
          setSavedData(parsed);
        } else {
          console.log('🗑️ Clearing expired data (older than 30 days)');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHasCheckedStorage(true);
    }
  }, []);

  const saveData = (data: Omit<SavedData, 'lastSaved'>) => {
    try {
      const dataToSave = {
        ...data,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      console.log('💾 Auto-saving data to localStorage:', {
        jobDescriptionLength: data.jobDescription?.length || 0,
        coverLetterLength: data.coverLetter?.length || 0,
        hasParsedData: !!data.parsedData,
        coverageResultsCount: Object.keys(data.coverageResults || {}).length
      });
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const clearData = () => {
    console.log('🗑️ Clearing all saved data from localStorage');
    localStorage.removeItem(STORAGE_KEY);
    setSavedData(null);
  };

  const loadSavedData = () => {
    return savedData;
  };

  return {
    savedData,
    hasCheckedStorage,
    saveData,
    clearData,
    loadSavedData
  };
}
