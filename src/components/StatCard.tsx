import { type ReactNode } from 'react';

interface StatCardProps {
  children: ReactNode;
  className?: string;
}

export const StatCard = ({ children, className = '' }: StatCardProps) => {
  return (
    <div className={`bg-card rounded-xl border border-border p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
};

interface StatCardHeaderProps {
  icon: ReactNode;
  iconColor?: 'sky' | 'amber' | 'emerald' | 'rose' | 'primary';
  title: string;
}

StatCard.Header = ({ icon, iconColor = 'primary', title }: StatCardHeaderProps) => {
  const colorMap = {
    sky: 'text-sky-500 bg-sky-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
    emerald: 'text-emerald-500 bg-emerald-500/10',
    rose: 'text-rose-500 bg-rose-500/10',
    primary: 'text-primary bg-primary/10'
  };

  return (
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorMap[iconColor]}`}>
        {icon}
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
    </div>
  );
};

interface StatCardValueProps {
  value: ReactNode;
  description?: string;
}

StatCard.Value = ({ value, description }: StatCardValueProps) => {
  return (
    <div className="text-3xl font-bold">
      {value}
      {description && <span className="text-sm font-normal text-muted-foreground ml-2">{description}</span>}
    </div>
  );
};
