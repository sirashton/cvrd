'use client';

import { useState, useRef, useEffect } from 'react';
import NeobrutalistPanel from './NeobrutalistPanel';
import SentenceImproverMenu from './SentenceImproverMenu';

interface CoverLetterPaneProps {
  coverLetter: string;
  setCoverLetter: (value: string) => void;
}

export default function CoverLetterPane({ coverLetter, setCoverLetter }: CoverLetterPaneProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [currentSentence, setCurrentSentence] = useState('');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [highlightedRange, setHighlightedRange] = useState<{ start: number; end: number } | null>(null);
  const [sentenceImproverEnabled, setSentenceImproverEnabled] = useState(false);
  const [improvementMode, setImprovementMode] = useState<'evolve' | 'cut'>('evolve');

  // Update content when coverLetter prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.textContent !== coverLetter) {
      editorRef.current.textContent = coverLetter;
    }
  }, [coverLetter]);

  // Apply highlighting when highlightedRange changes
  useEffect(() => {
    if (!highlightedRange || !editorRef.current) return;

    const editor = editorRef.current;
    const text = editor.textContent || '';
    const { start, end } = highlightedRange;

    // Only proceed if we have valid text and range
    if (text.length === 0 || start >= text.length || end > text.length || start >= end) {
      return;
    }

    try {
      // Create a range for the highlighted text
      const range = document.createRange();
      const textNode = editor.firstChild;
      
      if (textNode && textNode.nodeType === Node.TEXT_NODE && textNode.textContent) {
        const nodeLength = textNode.textContent.length;
        
        // Ensure our range is within the node's bounds
        const safeStart = Math.min(start, nodeLength);
        const safeEnd = Math.min(end, nodeLength);
        
        if (safeStart < safeEnd) {
          range.setStart(textNode, safeStart);
          range.setEnd(textNode, safeEnd);
          
          // Create highlight span
          const highlightSpan = document.createElement('span');
          highlightSpan.className = 'bg-blue-100 rounded px-1';
          highlightSpan.textContent = text.slice(safeStart, safeEnd);
          
          range.deleteContents();
          range.insertNode(highlightSpan);
        }
      }
    } catch (error) {
      console.log('Highlighting error:', error);
      // If highlighting fails, just clear the highlight state
      setHighlightedRange(null);
    }
  }, [highlightedRange]);

  // Handle text changes
  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent || '';
    setCoverLetter(newText);
  };

  // Detect sentence boundaries and get current sentence
  const getCurrentSentence = (range: Range): { sentence: string; start: number; end: number } => {
    const text = editorRef.current?.textContent || '';
    const startOffset = range.startOffset;
    
    // Find sentence start (look backwards for sentence boundary)
    let sentenceStart = 0;
    for (let i = startOffset - 1; i >= 0; i--) {
      const char = text[i];
      if (char === '.' || char === '!' || char === '?' || char === ':' || char === '\n') {
        sentenceStart = i + 1;
        break;
      }
    }
    
    // Find sentence end (look forwards for sentence boundary)
    let sentenceEnd = text.length;
    for (let i = startOffset; i < text.length; i++) {
      const char = text[i];
      if (char === '.' || char === '!' || char === '?' || char === ':' || char === '\n') {
        sentenceEnd = i + 1;
        break;
      }
    }
    
    const sentence = text.slice(sentenceStart, sentenceEnd).trim();
    return { sentence, start: sentenceStart, end: sentenceEnd };
  };

  // Clear highlights helper function
  const clearHighlights = () => {
    if (editorRef.current) {
      const existingHighlights = editorRef.current.querySelectorAll('span.bg-blue-100');
      existingHighlights.forEach(highlight => {
        const parent = highlight.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
          parent.normalize();
        }
      });
    }
  };

  // Handle click events
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only show sentence improver if enabled
    if (!sentenceImproverEnabled) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Clear any existing highlights first
    clearHighlights();

    // Get fresh range after clearing highlights
    const range = selection.getRangeAt(0);
    const sentenceData = getCurrentSentence(range);
    
    if (sentenceData.sentence.trim()) {
      setCurrentSentence(sentenceData.sentence);
      setSelectedRange(range);
      setHighlightedRange({ start: sentenceData.start, end: sentenceData.end });
      
            // Calculate menu position with smart bounds checking
            const rect = range.getBoundingClientRect();
            const editorRect = editorRef.current?.getBoundingClientRect();
            
            if (editorRect) {
              const menuWidth = 400; // Approximate menu width (min-w-96 = 384px)
              const menuHeight = 200; // Approximate menu height
              const padding = 16; // Safe distance from edges
              
              // Calculate preferred position (centered above the sentence)
              let x = rect.left + (rect.width / 2);
              let y = rect.top - editorRect.top - menuHeight - 8; // 8px gap above sentence
              
              // Adjust X position if menu would go off screen
              const viewportWidth = window.innerWidth;
              if (x - (menuWidth / 2) < padding) {
                x = padding + (menuWidth / 2);
              } else if (x + (menuWidth / 2) > viewportWidth - padding) {
                x = viewportWidth - padding - (menuWidth / 2);
              }
              
              // Adjust Y position if menu would go off top of screen
              const absoluteY = rect.top - menuHeight - 8;
              if (absoluteY < padding) {
                // Position below the sentence instead
                y = rect.bottom - editorRect.top + 8;
              }
              
              setMenuPosition({ x, y });
              setShowMenu(true);
            }
    }
  };

  // Handle sentence replacement
  const handleReplaceSentence = (newSentence: string) => {
    if (!highlightedRange || !editorRef.current) return;

    // Create new text content
    const text = editorRef.current.textContent || '';
    const { start, end } = highlightedRange;
    
    // Replace the sentence
    const newText = text.slice(0, start) + newSentence + text.slice(end);
    setCoverLetter(newText);
    
    // Update the editor content
    editorRef.current.textContent = newText;
    
    // Clear selection and highlighting
    window.getSelection()?.removeAllRanges();
    setHighlightedRange(null);
  };

  // Handle menu close
  const handleCloseMenu = () => {
    clearHighlights();
    setShowMenu(false);
    setCurrentSentence('');
    setSelectedRange(null);
    setHighlightedRange(null);
  };

  return (
    <NeobrutalistPanel 
      title="Cover Letter"
      subtitle={sentenceImproverEnabled ? "Write your cover letter here - click on any sentence to improve it" : "Write your cover letter here"}
    >
      {/* Toggle for sentence improver */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Sentence Improver: (BETA)
          </label>
          <button
            onClick={() => {
              setSentenceImproverEnabled(!sentenceImproverEnabled);
              // Clear any active highlights when toggling off
              if (sentenceImproverEnabled) {
                clearHighlights();
                setShowMenu(false);
              }
            }}
            className={`relative inline-flex h-8 w-16 items-center border-3 rounded-full focus:outline-none ${
              sentenceImproverEnabled 
                ? 'bg-blue-500 border-blue-700 shadow-[3px_3px_0px_0px_rgb(30,58,138)]' 
                : 'bg-gray-200 border-gray-400 shadow-[3px_3px_0px_0px_rgb(107,114,128)]'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full border-2 transition-transform ${
                sentenceImproverEnabled 
                  ? 'translate-x-8 bg-white border-blue-700 shadow-[2px_2px_0px_0px_rgb(30,58,138)]' 
                  : 'translate-x-1 bg-white border-gray-400 shadow-[2px_2px_0px_0px_rgb(107,114,128)]'
              }`}
            />
          </button>
        </div>
        {sentenceImproverEnabled && (
          <div className="text-xs text-gray-500">
            Click any sentence to improve it
          </div>
        )}
      </div>

      {sentenceImproverEnabled && (
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Mode:
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setImprovementMode('evolve')}
              className={`px-3 py-1 text-xs font-medium border-2 rounded-full transition-colors ${
                improvementMode === 'evolve'
                  ? 'bg-blue-500 text-white border-blue-700 shadow-[2px_2px_0px_0px_rgb(30,58,138)]'
                  : 'bg-gray-100 text-gray-700 border-gray-400 shadow-[2px_2px_0px_0px_rgb(107,114,128)] hover:bg-gray-200'
              }`}
            >
              Evolve
            </button>
            <button
              onClick={() => setImprovementMode('cut')}
              className={`px-3 py-1 text-xs font-medium border-2 rounded-full transition-colors ${
                improvementMode === 'cut'
                  ? 'bg-orange-500 text-white border-orange-700 shadow-[2px_2px_0px_0px_rgb(194,65,12)]'
                  : 'bg-gray-100 text-gray-700 border-gray-400 shadow-[2px_2px_0px_0px_rgb(107,114,128)] hover:bg-gray-200'
              }`}
            >
              Waffle Cutter
            </button>
          </div>
          <div className="text-xs text-gray-500">
            {improvementMode === 'evolve' ? 'Improve and refine' : 'Cut down and simplify'}
          </div>
        </div>
      )}
      
      <div className="relative h-full">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onClick={handleClick}
          className="w-full h-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none overflow-y-auto"
          style={{
            minHeight: '200px',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word'
          }}
          suppressContentEditableWarning={true}
        />
        
        <SentenceImproverMenu
          isVisible={showMenu}
          position={menuPosition}
          currentSentence={currentSentence}
          improvementMode={improvementMode}
          onClose={handleCloseMenu}
          onReplace={handleReplaceSentence}
        />
      </div>
    </NeobrutalistPanel>
  );
}
