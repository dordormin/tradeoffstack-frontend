
interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* SVG Icon representing a "Stack" */}
      <svg 
        width="36" 
        height="36" 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="shrink-0"
      >
        <path d="M16 3L3 9.5L16 16L29 9.5L16 3Z" fill="currentColor" className="text-primary" />
        <path d="M3 15.5L16 22L29 15.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary/70" />
        <path d="M3 21.5L16 28L29 21.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary/40" />
      </svg>
      
      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl tracking-tight text-foreground font-extrabold uppercase font-mono leading-none">
            TradeOff<span className="text-primary font-black">Stack</span>
          </span>
          <span className="text-[9px] text-muted-foreground/60 font-semibold tracking-wider uppercase mt-1 self-start">
            by Dordor Minetdi
          </span>
        </div>
      )}
    </div>
  );
}
