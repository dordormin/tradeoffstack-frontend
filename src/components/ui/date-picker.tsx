import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, className, placeholder = "Pick a date", disabled }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Convert string YYYY-MM-DD to Date object. We add T12:00:00 to avoid timezone shift issues.
  const dateValue = value ? new Date(value + 'T12:00:00') : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date && onChange) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else if (!date && onChange) {
      onChange('');
    }
    setIsOpen(false);
  };

  // Format Date object to local string
  const displayDate = dateValue ? dateValue.toLocaleDateString() : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger render={
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal border-border bg-background hover:bg-secondary cursor-pointer px-3 py-2 h-auto min-h-[38px]",
            !dateValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50 shrink-0" />
          <span className="truncate">{displayDate}</span>
        </Button>
      } />
      <PopoverContent align="start" className="w-auto p-0 border-border shadow-md">
        <Calendar
          value={dateValue}
          onChange={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
