'use client';

import NeobrutalistPanel from './NeobrutalistPanel';

interface CoverLetterPaneProps {
  coverLetter: string;
  setCoverLetter: (value: string) => void;
}

export default function CoverLetterPane({ coverLetter, setCoverLetter }: CoverLetterPaneProps) {
  return (
    <NeobrutalistPanel 
      title="Cover Letter"
      subtitle="Write your cover letter here"
    >
      <textarea
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        placeholder="Write your cover letter here..."
        className="w-full h-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </NeobrutalistPanel>
  );
}
