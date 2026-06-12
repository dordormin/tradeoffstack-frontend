import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

interface ConfirmOptions {
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  prompt?: boolean; // If true, shows an input field
  promptPlaceholder?: string; // Placeholder for the input field
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean | string>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { language } = useTranslation();
  const isFr = language === 'fr';

  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<{ resolve: (value: boolean | string) => void } | null>(null);
  const [promptValue, setPromptValue] = useState('');

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setPromptValue(''); // Reset prompt value
    setIsOpen(true);
    return new Promise<boolean | string>((resolve) => {
      setResolver({ resolve });
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (options?.prompt) {
      resolver?.resolve(promptValue);
    } else {
      resolver?.resolve(true);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (options?.prompt) {
      resolver?.resolve(''); // return empty string on cancel for prompt
    } else {
      resolver?.resolve(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleCancel();
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {options && (
          <DialogContent className="sm:max-w-md border-border bg-card">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                {options.variant === 'destructive' && <AlertTriangle className="w-5 h-5 text-destructive" />}
                {options.title || (isFr ? 'Confirmation' : 'Confirmation')}
              </DialogTitle>
              <DialogDescription className="pt-2 text-base text-muted-foreground">
                {options.description}
              </DialogDescription>
              {options.prompt && (
                <div className="pt-4">
                  <input 
                    type="text" 
                    value={promptValue}
                    onChange={(e) => setPromptValue(e.target.value)}
                    placeholder={options.promptPlaceholder || '...'}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    autoFocus
                  />
                </div>
              )}
            </DialogHeader>
            <DialogFooter className="pt-4 mt-2 flex justify-end gap-2 border-t border-border">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="border-border cursor-pointer bg-background"
              >
                {options.cancelText || (isFr ? 'Annuler' : 'Cancel')}
              </Button>
              <Button
                variant={options.variant || 'default'}
                onClick={handleConfirm}
                className="cursor-pointer"
              >
                {options.confirmText || (isFr ? 'Confirmer' : 'Confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
};
