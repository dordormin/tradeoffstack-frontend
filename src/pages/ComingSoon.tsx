import { ArrowLeft, Construction } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ComingSoon = ({ title }: { title?: string }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] -z-10 animate-pulse delay-1000" />

      <div className="max-w-md w-full bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          <Construction className="w-10 h-10 text-primary relative z-10" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4 font-outfit tracking-tight">
          {title || "Coming Soon"}
        </h1>
        
        <p className="text-muted-foreground mb-8 text-lg">
          We are working hard to bring this module to life. Stay tuned for updates!
        </p>

        <button 
          onClick={() => navigate('/dashboard')}
          className="relative z-10 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Hub
        </button>
      </div>
    </div>
  );
};
