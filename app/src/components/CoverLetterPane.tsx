'use client';

interface CoverLetterPaneProps {
  coverLetter: string;
  setCoverLetter: (value: string) => void;
}

export default function CoverLetterPane({ coverLetter, setCoverLetter }: CoverLetterPaneProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Cover Letter</h2>
        <p className="text-sm text-gray-500 mt-1">Write your cover letter here</p>
      </div>

      <div className="flex-1 p-6">
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          placeholder="Write your cover letter here..."
          className="w-full h-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
