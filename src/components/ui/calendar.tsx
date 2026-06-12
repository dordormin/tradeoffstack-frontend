import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface CalendarProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  className?: string;
}

export function Calendar({ value, onChange, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    if (onChange) {
      onChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    return value.getDate() === day && value.getMonth() === currentMonth.getMonth() && value.getFullYear() === currentMonth.getFullYear();
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className={cn("p-3 bg-card border-none rounded-md", className)}>
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon-sm" onClick={handlePrevMonth} className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-border cursor-pointer">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium text-foreground">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <Button variant="outline" size="icon-sm" onClick={handleNextMonth} className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-border cursor-pointer">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-[0.8rem] font-medium text-muted-foreground w-8 h-8 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="w-8 h-8" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const selected = isSelected(day);
          const today = isToday(day);

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={cn(
                "w-8 h-8 rounded-md text-sm transition-colors flex items-center justify-center cursor-pointer",
                selected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : today
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-foreground hover:bg-secondary/80",
                "focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
