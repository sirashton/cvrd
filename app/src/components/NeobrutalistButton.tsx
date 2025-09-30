interface NeobrutalistButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  color?: 'blue' | 'orange' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  disabled?: boolean;
  pressable?: boolean;
  className?: string;
  logo?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const pressableColorClasses = {
  blue: 'bg-blue-300 hover:bg-blue-400 active:bg-blue-600',
  orange: 'bg-orange-300 hover:bg-orange-400 active:bg-orange-600',
  green: 'bg-green-300 hover:bg-green-400 active:bg-green-600',
  yellow: 'bg-yellow-300 hover:bg-yellow-400 active:bg-yellow-600',
  red: 'bg-red-300 hover:bg-red-400 active:bg-red-600',
  purple: 'bg-purple-300 hover:bg-purple-400 active:bg-purple-600',
  gray: 'bg-gray-300 hover:bg-gray-400 active:bg-gray-600',
};

const staticColorClasses = {
  blue: 'bg-blue-300',
  orange: 'bg-orange-300',
  green: 'bg-green-300',
  yellow: 'bg-yellow-300', 
  red: 'bg-red-300',
  purple: 'bg-purple-300',
  gray: 'bg-gray-300',
};

export default function NeobrutalistButton({
  children,
  onClick,
  color = 'blue',
  disabled = false,
  pressable = true,
  className = '',
  logo = false,
  type = 'button',
}: NeobrutalistButtonProps) {
  const baseClasses = `
    relative font-bold text-black
    border-4 border-[rgb(75,85,99)] rounded-4xl
    shadow-[4px_4px_0px_0px_rgb(75,85,99)]
    transition-all duration-150 ease-out
    ${logo ? 'text-2xl px-6 py-3' : 'text-sm'}
    ${logo ? 'px-1 py-0' : 'px-4 py-2'}
    ${pressable ? `
      hover:shadow-[2px_2px_0px_0px_rgb(75,85,99)]
      hover:translate-x-[2px] hover:translate-y-[2px]
      active:shadow-[2px_2px_0px_0px_rgb(75,85,99)]
      active:translate-x-[2px] active:translate-y-[2px]
    ` : ''}
    disabled:opacity-50 disabled:cursor-not-allowed
    disabled:hover:shadow-[4px_4px_0px_0px_rgb(75,85,99)]
    disabled:hover:translate-x-0 disabled:hover:translate-y-0
    disabled:active:shadow-[4px_4px_0px_0px_rgb(75,85,99)]
    disabled:active:translate-x-0 disabled:active:translate-y-0
  `;

  const colorClass = pressable ? pressableColorClasses[color] : staticColorClasses[color];
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${colorClass} ${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
}
