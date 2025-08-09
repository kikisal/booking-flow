import { useState, useCallback, useRef, useEffect } from "react";
import { generateCalendarDays, getDatesBetween, sortDates, type CalendarDay } from "@/lib/calendar-utils";
import type { Room, Booking } from "@shared/schema";
import { cn } from "@/lib/utils";
import { getStrings } from "@shared/strings";
import { config } from "@shared/config";

interface CalendarGridProps {
	currentDate: Date;
	bookings: Booking[];
	rooms: Room[];
	onDatesSelected: (dates: string[]) => void;
	onMonthChange?: (date: Date) => void;
	selectedDates?: string[];
}

let _gMouseUp = true;

export function CalendarGrid({ currentDate, bookings, rooms, onDatesSelected, onMonthChange, selectedDates: externalSelectedDates = [] }: CalendarGridProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [dragStartDate, setDragStartDate] = useState<string | null>(null);
	const [internalSelectedDates, setInternalSelectedDates] = useState<string[]>([]);
	const [autoScrollTimer, setAutoScrollTimer] = useState<NodeJS.Timeout | null>(null);
	const gridRef = useRef<HTMLDivElement>(null);
	const currentSelectionRef = useRef<string[]>([]);

	const year 		   = currentDate.getFullYear();
	const month 	   = currentDate.getMonth();
	const calendarDays = generateCalendarDays(year, month);


	const strings = getStrings(config.defaultLanguage);
	const daysOfWeek = [
		strings.WEEK_SUNDAY_SHORT,
		strings.WEEK_MONDAY_SHORT,
		strings.WEEK_TUESDAY_SHORT,
		strings.WEEK_WEDNESDAY_SHORT,
		strings.WEEK_THURSDAY_SHORT,
		strings.WEEK_FRIDAY_SHORT,
		strings.WEEK_SATURDAY_SHORT
	];

	const roomsMap = rooms.reduce((acc, room) => {
		acc[room._id] = room;
		return acc;
	}, {} as Record<string, Room>);

	const getBookingsForDate = (dateString: string) => {
		const d = new Date(dateString);
		return bookings.filter(booking => {
			const startDate = new Date(booking.startDate);
			const endDate = new Date(booking.endDate);
			return d >= startDate && d <= endDate;
		});
	};

	const handleMouseDown = (dateString: string) => {
		_gMouseUp = false;
		setIsDragging(true);
		setDragStartDate(dateString);
		setInternalSelectedDates([dateString]);
		currentSelectionRef.current = [dateString]; // Keep ref in sync
	};

	const handleMouseEnter = (dateString: string) => {
		if (!isDragging || !dragStartDate) return;

		// Clear any existing auto-scroll timer
		if (autoScrollTimer) {
			clearTimeout(autoScrollTimer);
			setAutoScrollTimer(null);
		}

		// Find the index of the current date in the calendar grid
		const currentDateIndex = calendarDays.findIndex(day => day.dateString === dateString);
		const isLastCellOfGrid = currentDateIndex === calendarDays.length - 1; // Last cell (bottom-right)
		const isFirstCellOfGrid = currentDateIndex === 0; // First cell (top-left)

		// Check if the date is in next/previous month for navigation direction
		const currentDateObj = new Date(dateString);
		const currentMonth = currentDate.getMonth();
		const currentYear = currentDate.getFullYear();
		const targetMonth = currentDateObj.getMonth();
		const targetYear = currentDateObj.getFullYear();

		const isNextMonth = (targetYear > currentYear) || (targetYear === currentYear && targetMonth > currentMonth);
		const isPrevMonth = (targetYear < currentYear) || (targetYear === currentYear && targetMonth < currentMonth);

		// Auto-scroll logic: last cell goes to next month, first cell goes to previous month
		const shouldScrollNext = isLastCellOfGrid && isNextMonth;
		const shouldScrollPrev = isFirstCellOfGrid && isPrevMonth;

		// Only set up auto-scroll for the specific corner cells
		if ((shouldScrollNext || shouldScrollPrev) && onMonthChange) {
			const timer = setTimeout(() => {
				if (_gMouseUp) return;
				
				if (isDragging && onMonthChange) {
					const newDate = new Date(currentYear, currentMonth + (shouldScrollNext ? 1 : -1), 1);
					onMonthChange(newDate);

					// Continue the selection by updating the selected dates immediately
					const startDate = dragStartDate;
					const endDate = dateString;
					const _startDate = new Date(startDate);
					const _endDate	 = new Date(endDate);

					const dateRange = getDatesBetween(
						_startDate <= _endDate ? startDate : endDate,
						_startDate <= _endDate ? endDate : startDate
					);
					setInternalSelectedDates(dateRange);
					currentSelectionRef.current = dateRange; // Keep ref in sync
				}
			}, 1000);
			setAutoScrollTimer(timer);
		}

		const startDate = dragStartDate;
		const endDate = dateString;
		const _startDate = new Date(startDate);
		const _endDate	 = new Date(endDate);
		
		const dateRange = getDatesBetween(
			_startDate <= _endDate ? startDate : endDate,
			_startDate <= _endDate ? endDate : startDate
		);
		setInternalSelectedDates(dateRange);
		currentSelectionRef.current = dateRange; // Keep ref in sync
	};

	const handleMouseUp = () => {
		_gMouseUp = true;
		if (!isDragging) return;

		// Clear any pending auto-scroll timer
		if (autoScrollTimer) {
			clearTimeout(autoScrollTimer);
			setAutoScrollTimer(null);
		}

		setIsDragging(false);

		// Capture the current selection before clearing drag state
		const finalSelection = [...currentSelectionRef.current];

		setDragStartDate(null);

		if (finalSelection.length > 0) {
			const sortedDates = sortDates(finalSelection);

			// Pass the dates immediately, don't wait
			onDatesSelected(sortedDates);

			// Don't clear selection immediately - let the parent component handle it
		}
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

	// Add global mouseup listener when dragging starts
	useEffect(() => {
		const handleGlobalMouseUp = () => {
			if (isDragging) {
				handleMouseUp();
			}
		};

		if (isDragging) {
			window.addEventListener('mouseup', handleGlobalMouseUp);
			return () => {
				window.removeEventListener('mouseup', handleGlobalMouseUp);
			};
		}
	}, [isDragging]);

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
				onTouchEnd={handleTouchEnd}
			>
				{calendarDays.map((day) => {
					const dayBookings = getBookingsForDate(day.dateString);

					const displayedSelectedDates = isDragging ? internalSelectedDates : externalSelectedDates;
					const isSelected = displayedSelectedDates.includes(day.dateString);

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
										const room = roomsMap[(booking.roomId as any)._id];
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
