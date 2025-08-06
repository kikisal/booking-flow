import { useState, useCallback, useRef, useEffect } from "react";
import { generateCalendarDays, getDatesBetween, sortDates, type CalendarDay } from "@/lib/calendar-utils";
import type { Room, Booking } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CalendarGridProps {
  currentDate: Date;
  bookings: Booking[];
  rooms: Room[];
  onDatesSelected: (dates: string[]) => void;
  onMonthChange?: (date: Date) => void;
}

export function CalendarGrid({ currentDate, bookings, rooms, onDatesSelected, onMonthChange }: CalendarGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [autoScrollTimer, setAutoScrollTimer] = useState<NodeJS.Timeout | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = generateCalendarDays(year, month);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const roomsMap = rooms.reduce((acc, room) => {
    acc[room.id] = room;
    return acc;
  }, {} as Record<string, Room>);

  const getBookingsForDate = useCallback((dateString: string) => {
    return bookings.filter(booking => {
      const startDate = booking.startDate;
      const endDate = booking.endDate;
      return dateString >= startDate && dateString <= endDate;
    });
  }, [bookings]);

  const handleMouseDown = (dateString: string) => {
    setIsDragging(true);
    setDragStartDate(dateString);
    setSelectedDates([dateString]);
  };

  const handleMouseEnter = (dateString: string) => {
    if (!isDragging || !dragStartDate) return;

    // Clear any existing auto-scroll timer
    if (autoScrollTimer) {
      clearTimeout(autoScrollTimer);
      setAutoScrollTimer(null);
    }

    const currentDateObj = new Date(dateString);
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const targetMonth = currentDateObj.getMonth();
    const targetYear = currentDateObj.getFullYear();

    // Check if we're hovering over a date in the next or previous month
    const isNextMonth = (targetYear > currentYear) || (targetYear === currentYear && targetMonth > currentMonth);
    const isPrevMonth = (targetYear < currentYear) || (targetYear === currentYear && targetMonth < currentMonth);

    // Set up auto-scroll if we're in a different month and onMonthChange is available
    if ((isNextMonth || isPrevMonth) && onMonthChange) {
      const timer = setTimeout(() => {
        if (isDragging && onMonthChange) {
          const newDate = new Date(currentYear, currentMonth + (isNextMonth ? 1 : -1), 1);
          onMonthChange(newDate);
          
          // Continue the selection by updating the selected dates immediately
          const startDate = dragStartDate;
          const endDate = dateString;
          const dateRange = getDatesBetween(
            startDate <= endDate ? startDate : endDate,
            startDate <= endDate ? endDate : startDate
          );
          setSelectedDates(dateRange);
        }
      }, 500); // 500ms delay before auto-scrolling
      setAutoScrollTimer(timer);
    }

    const startDate = dragStartDate;
    const endDate = dateString;
    const dateRange = getDatesBetween(
      startDate <= endDate ? startDate : endDate,
      startDate <= endDate ? endDate : startDate
    );
    setSelectedDates(dateRange);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    // Clear any pending auto-scroll timer
    if (autoScrollTimer) {
      clearTimeout(autoScrollTimer);
      setAutoScrollTimer(null);
    }

    setIsDragging(false);
    setDragStartDate(null);

    if (selectedDates.length > 0) {
      const sortedDates = sortDates(selectedDates);
      onDatesSelected(sortedDates);
    }

    // Clear selection after a short delay
    setTimeout(() => {
      setSelectedDates([]);
    }, 100);
  };

  const handleTouchStart = (dateString: string) => {
    handleMouseDown(dateString);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const dayElement = element?.closest('[data-date]') as HTMLElement;
    
    if (dayElement) {
      const dateString = dayElement.dataset.date;
      if (dateString) {
        handleMouseEnter(dateString);
      }
    }
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Cleanup timer on unmount or when dragging stops
  useEffect(() => {
    return () => {
      if (autoScrollTimer) {
        clearTimeout(autoScrollTimer);
      }
    };
  }, [autoScrollTimer]);

  return (
    <div className="calendar-container" data-testid="calendar-grid">
      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-slate-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div 
        ref={gridRef}
        className="grid grid-cols-7 gap-1 drag-select-none"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchEnd={handleTouchEnd}
      >
        {calendarDays.map((day) => {
          const dayBookings = getBookingsForDate(day.dateString);
          const isSelected = selectedDates.includes(day.dateString);

          return (
            <div
              key={day.dateString}
              data-date={day.dateString}
              className={cn(
                "calendar-day h-24 p-1 border border-slate-200 rounded-lg relative cursor-pointer transition-colors select-none",
                {
                  "bg-white hover:bg-slate-100": day.isCurrentMonth,
                  "bg-slate-50 text-slate-400": !day.isCurrentMonth,
                  "bg-blue-50 border-blue-300 border-2": day.isToday,
                  "selecting bg-blue-100 border-blue-300 border-2": isSelected,
                }
              )}
              onMouseDown={() => handleMouseDown(day.dateString)}
              onMouseEnter={() => handleMouseEnter(day.dateString)}
              onTouchStart={() => handleTouchStart(day.dateString)}
              onTouchMove={handleTouchMove}
              data-testid={`calendar-day-${day.dateString}`}
            >
              <span 
                className={cn(
                  "text-sm font-medium",
                  {
                    "text-slate-900": day.isCurrentMonth,
                    "text-slate-400": !day.isCurrentMonth,
                    "text-blue-900 font-bold": day.isToday,
                  }
                )}
              >
                {day.dayNumber}
              </span>

              {/* Today indicator */}
              {day.isToday && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                </div>
              )}

              {/* Booking indicators */}
              {dayBookings.length > 0 && (
                <div className="absolute bottom-1 left-1 right-1 space-y-1">
                  {dayBookings.slice(0, 3).map((booking) => {
                    const room = roomsMap[booking.roomId];
                    return (
                      <div
                        key={booking.id}
                        className="booking-bar h-1 rounded-full opacity-80"
                        style={{ backgroundColor: room?.color || '#6b7280' }}
                        title={`${room?.name || 'Unknown Room'} - ${booking.customerName}`}
                        data-testid={`booking-${booking.id}`}
                      />
                    );
                  })}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-slate-500 text-center">
                      +{dayBookings.length - 3} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
