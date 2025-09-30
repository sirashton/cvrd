import NeobrutalistButton from './NeobrutalistButton';

interface RestoreModalProps {
  isOpen: boolean;
  onRestore: () => void;
  onStartFresh: () => void;
  lastSaved: string;
}

export default function RestoreModal({ isOpen, onRestore, onStartFresh, lastSaved }: RestoreModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Welcome Back!
        </h3>
        <p className="text-gray-600 mb-4">
          We found your previous work from {formatDate(lastSaved)}. Would you like to continue where you left off?
        </p>
        
        <div className="flex gap-3">
          <NeobrutalistButton
            onClick={onRestore}
            color="blue"
            className="flex-1"
          >
            Restore Previous Work
          </NeobrutalistButton>
          <NeobrutalistButton
            onClick={onStartFresh}
            color="gray"
            className="flex-1"
          >
            Start Fresh
          </NeobrutalistButton>
        </div>
      </div>
    </div>
  );
}
