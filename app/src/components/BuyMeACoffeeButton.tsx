interface BuyMeACoffeeButtonProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function BuyMeACoffeeButton({ 
  size = 'medium', 
  className = "" 
}: BuyMeACoffeeButtonProps) {
  const sizeClasses = {
    small: 'text-xs px-3 py-1',
    medium: 'text-sm px-4 py-2',
    large: 'text-base px-6 py-3'
  };

  return (
    <a
      href="https://buymeacoffee.com/alexashton"
      target="_blank"
      rel="noopener noreferrer"
      className={`
        relative font-bold text-black
        border-2 border-[rgb(75,85,99)] rounded-xl
        shadow-[2px_2px_0px_0px_rgb(75,85,99)]
        transition-all duration-150 ease-out
        hover:shadow-[1px_1px_0px_0px_rgb(75,85,99)]
        hover:translate-x-[1px] hover:translate-y-[1px]
        active:shadow-[1px_1px_0px_0px_rgb(75,85,99)]
        active:translate-x-[1px] active:translate-y-[1px]
        bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-500
        ${sizeClasses[size]}
        ${className}
      `}
    >
      ☕ Buy me a coffee
    </a>
  );
}
