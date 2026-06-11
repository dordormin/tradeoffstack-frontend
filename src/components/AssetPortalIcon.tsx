
interface AssetPortalIconProps {
  className?: string;
  showWrapper?: boolean;
}

export function AssetPortalIcon({ className = '', showWrapper = true }: AssetPortalIconProps) {
  const svg = (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`text-primary shrink-0 ${showWrapper ? 'w-6 h-6' : 'w-full h-full'}`}
    >
      <rect x="2" y="4" width="20" height="5" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2" y="15" width="20" height="5" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 6.5H6.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 17.5H6.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 6.5H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 17.5H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50" />
    </svg>
  );

  if (!showWrapper) {
    return <div className={`flex items-center justify-center shrink-0 ${className}`}>{svg}</div>;
  }

  return (
    <div className={`p-1.5 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 ${className}`}>
      {svg}
    </div>
  );
}

