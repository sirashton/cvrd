interface CoverageScoreProps {
  score: number;
  className?: string;
}

export default function CoverageScore({ score, className = "" }: CoverageScoreProps) {
  // Create continuous color spectrum from red (0) to green (100)
  // Using HSL: hue goes from 0 (red) to 120 (green)
  // Saturation and lightness stay consistent for good contrast
  const getHue = (score: number) => {
    // Clamp score between 0 and 100
    const clampedScore = Math.max(0, Math.min(100, score));
    // Map 0-100 to 0-120 degrees (red to green)
    return (clampedScore / 100) * 120;
  };

  const getTextColor = (score: number) => {
    // Use darker text for better contrast
    const clampedScore = Math.max(0, Math.min(100, score));
    const hue = (clampedScore / 100) * 120;
    return `hsl(${hue}, 70%, 20%)`; // Darker version of the background
  };

  const hue = getHue(score);
  const backgroundColor = `hsl(${hue}, 70%, 50%)`;
  const textColor = getTextColor(score);

  return (
    <div 
      className={`
        relative px-3 py-1 font-bold text-xs
        border-2 border-[rgb(75,85,99)] rounded-xl
        shadow-[2px_2px_0px_0px_rgb(75,85,99)]
        ${className}
      `}
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {score}/100
    </div>
  );
}
