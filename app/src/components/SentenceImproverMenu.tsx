'use client';

import { useState, useEffect, useRef } from 'react';
import NeobrutalistButton from './NeobrutalistButton';

interface SentenceImproverMenuProps {
  isVisible: boolean;
  position: { x: number; y: number };
  currentSentence: string;
  onClose: () => void;
  onReplace: (newSentence: string) => void;
}

interface SuggestionData {
  suggestions: string[];
  changes: Array<Array<{ from: string; to: string }>>;
}

export default function SentenceImproverMenu({
  isVisible,
  position,
  currentSentence,
  onClose,
  onReplace
}: SentenceImproverMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [suggestionData, setSuggestionData] = useState<SuggestionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch suggestions when menu becomes visible
  useEffect(() => {
    if (isVisible && currentSentence.trim()) {
      fetchSuggestions();
    }
  }, [isVisible, currentSentence]);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/improve-sentence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sentence: currentSentence }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestionData(data);
      } else {
        console.error('Failed to fetch suggestions');
        setSuggestionData(null);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestionData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to highlight changes in text
  const highlightChanges = (suggestion: string, changes: Array<{ from: string; to: string }>) => {
    if (!changes || changes.length === 0) {
      return <span>{suggestion}</span>;
    }

    // Highlight only the "to" words that represent actual changes
    let result = suggestion;
    const highlightedWords = new Set(); // Track what we've already highlighted
    
    for (const change of changes) {
      if (change.to && change.to.trim()) {
        // Remove brackets from the "to" value since the actual text doesn't have them
        const cleanTo = change.to.replace(/^\[|\]$/g, '');
        
        // Only highlight if we haven't already highlighted this word
        if (!highlightedWords.has(cleanTo.toLowerCase())) {
          // Escape special regex characters
          const escapedTo = cleanTo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b${escapedTo}\\b`, 'gi');
          
          // Check if this word exists in the suggestion
          if (regex.test(result)) {
            // Reset regex for actual replacement
            const replaceRegex = new RegExp(`\\b${escapedTo}\\b`, 'gi');
            result = result.replace(replaceRegex, (match) => {
              return `<span class="bg-yellow-200 px-1 rounded font-medium">${match}</span>`;
            });
            
            // Mark this word as highlighted
            highlightedWords.add(cleanTo.toLowerCase());
          }
        }
      }
    }

    // Return as dangerouslySetInnerHTML for now (we'll make this safer)
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !currentSentence.trim()) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg border-3 border-[rgb(75,85,99)] shadow-[3px_3px_0px_0px_rgb(75,85,99)] p-4 min-w-96 max-w-4xl"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, 0%)', // Center horizontally, position at cursor level
      }}
    >
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Improve this sentence:</h4>
        <p className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded border">
          "{currentSentence}"
        </p>
      </div>

      <div className="space-y-2">
        <h5 className="text-xs font-medium text-gray-700">Suggestions:</h5>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Generating suggestions...</div>
          </div>
        ) : suggestionData ? (
          <div className="grid grid-cols-3 gap-2">
            {suggestionData.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="cursor-pointer p-3 rounded border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400 transition-colors hover:shadow-sm"
                onClick={() => {
                  onReplace(suggestion);
                  onClose();
                }}
              >
                <p className="text-sm text-gray-700 leading-relaxed">
                  {highlightChanges(suggestion, suggestionData.changes[index] || [])}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-sm text-red-600 font-medium mb-1">Suggestions not available</div>
              <div className="text-xs text-gray-500">Please try again later</div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200">
        <NeobrutalistButton
          onClick={onClose}
          color="gray"
          className="text-xs px-3 py-1 w-full"
        >
          Cancel
        </NeobrutalistButton>
      </div>
    </div>
  );
}
