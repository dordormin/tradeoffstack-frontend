import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextProps {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 10000);
  }, []);

  const success = useCallback((msg: string) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, 'error'), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`group pointer-events-auto relative overflow-hidden flex items-center justify-between gap-3 min-w-[300px] px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md text-sm font-medium transition-all animate-in slide-in-from-right-5 fade-in duration-300 ${
              t.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
              t.type === 'error' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
              'bg-sky-500/10 text-sky-500 border-sky-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {t.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-sky-500" />}
              <span>{t.message}</span>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Animated progress bar */}
            <div className="absolute bottom-0 left-0 h-1 bg-current opacity-30 animate-shrink-width" style={{ animationDuration: '10000ms', animationTimingFunction: 'linear', animationFillMode: 'forwards' }} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export function withToast<P extends object>(
  WrappedComponent: React.ComponentType<P & ToastContextProps>
) {
  const WithToastComponent: React.FC<P> = (props) => {
    const toastContext = useToast();
    return <WrappedComponent {...props} {...toastContext} />;
  };

  WithToastComponent.displayName = `withToast(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithToastComponent;
}
