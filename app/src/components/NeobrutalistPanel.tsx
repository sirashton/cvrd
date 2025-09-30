interface NeobrutalistPanelProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function NeobrutalistPanel({ 
  children, 
  title, 
  subtitle, 
  className = "" 
}: NeobrutalistPanelProps) {
  return (
    <div className={`bg-white rounded-lg border-3 rounded-xl border-[rgb(75,85,99)] h-full flex flex-col shadow-[3px_3px_0px_0px_rgb(75,85,99)] ${className}`}>
      <div className="p-6 border-b-3 border-[rgb(75,85,99)]">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className="flex-1 p-6">
        {children}
      </div>
    </div>
  );
}
