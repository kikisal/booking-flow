export interface CalendarDay {
  date: Date;
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPrevMonth: boolean;
  isNextMonth: boolean;
}

export function generateCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  const endDate = new Date(lastDay);
  
  // Get the first Sunday of the calendar grid
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  // Get the last Saturday of the calendar grid
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
  
  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateString = formatDateString(currentDate);
    const isCurrentMonth = currentDate.getMonth() === month;
    const isToday = currentDate.getTime() === today.getTime();
    
    days.push({
      date: new Date(currentDate),
      dateString,
      dayNumber: currentDate.getDate(),
      isCurrentMonth,
      isToday,
      isPrevMonth: currentDate.getMonth() < month || (currentDate.getMonth() === 11 && month === 0),
      isNextMonth: currentDate.getMonth() > month || (currentDate.getMonth() === 0 && month === 11),
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
}

export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDateRange(startDate: string, endDate: string): string {
  // Parse dates as local dates to avoid timezone issues
  // Input format: "2025-08-10" -> create date in local timezone
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  
  const start = new Date(startYear, startMonth - 1, startDay); // Month is 0-indexed
  const end = new Date(endYear, endMonth - 1, endDay);
  
  if (startDate === endDate) {
    return start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
  
  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })}-${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${start.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })} - ${end.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })}, ${start.getFullYear()}`;
    }
  } else {
    return `${start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })} - ${end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
  }
}

export function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(formatDateString(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

export function sortDates(dates: string[]): string[] {
  return dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}
