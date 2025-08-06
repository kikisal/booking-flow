import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { BookingModal } from "@/components/calendar/booking-modal";
import { BookingSummary } from "@/components/calendar/booking-summary";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Room, Booking } from "@shared/schema";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
  });

  const { data: bookings = [], refetch: refetchBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings", { year, month }],
    queryFn: async () => {
      const response = await fetch(`/api/bookings?year=${year}&month=${month}`);
      if (!response.ok) throw new Error("Failed to fetch bookings");
      return response.json();
    },
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleMonthChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleDatesSelected = (dates: string[]) => {
    
    setSelectedDates(dates);
    if (dates.length > 0) {
      setShowBookingModal(true);
    }
  };

  const handleBookingCreated = () => {
    setShowBookingModal(false);
    setSelectedDates([]); // Clear selection after successful booking
    refetchBookings();
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedDates([]); // Clear selection when modal closes
  };

  const monthName = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  useEffect(() => {
    refetchBookings();
  }, [currentDate]);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="calendar-page">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="page-title">
              Room Booking Calendar
            </h1>
            <p className="text-slate-600 mt-1">Manage your room reservations efficiently</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Room Legend */}
            <div className="hidden md:flex items-center space-x-4 mr-6">
              <span className="text-sm font-medium text-slate-700">Rooms:</span>
              <div className="flex space-x-3">
                {rooms.map((room) => (
                  <div key={room.id} className="flex items-center space-x-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: room.color }}
                      data-testid={`room-legend-${room.id}`}
                    />
                    <span className="text-xs text-slate-600">{room.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button 
              onClick={() => setShowBookingModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-new-booking"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Calendar Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900" data-testid="current-month">
              {monthName}
            </h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                data-testid="button-prev-month"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                data-testid="button-today"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                data-testid="button-next-month"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <CalendarGrid
            currentDate={currentDate}
            bookings={bookings}
            rooms={rooms}
            onDatesSelected={handleDatesSelected}
            onMonthChange={handleMonthChange}
            selectedDates={selectedDates}
          />
        </div>

        <BookingSummary 
          bookings={bookings} 
          rooms={rooms} 
          onBookingUpdated={refetchBookings}
        />
      </main>

      {/* Mobile Room Legend */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-slate-200">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Room Legend</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: room.color }}
              />
              <span className="text-slate-600">{room.name}</span>
            </div>
          ))}
        </div>
      </div>

      <BookingModal
        open={showBookingModal}
        onClose={handleCloseModal}
        selectedDates={selectedDates}
        rooms={rooms}
        onBookingCreated={handleBookingCreated}
      />
    </div>
  );
}
