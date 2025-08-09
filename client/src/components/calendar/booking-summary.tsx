import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDateRange } from "@/lib/calendar-utils";
import type { Room, Booking } from "@shared/schema";
import { Edit, Trash2 } from "lucide-react";
import { getStrings } from "@shared/strings";
import { config } from "@shared/config";
import { string } from "zod";

interface BookingSummaryProps {
  bookings: Booking[];
  rooms: Room[];
  onBookingUpdated: () => void;
}

export function BookingSummary({ bookings, rooms, onBookingUpdated }: BookingSummaryProps) {
  const { toast } = useToast();

  const roomsMap = rooms.reduce((acc, room) => {
    acc[room._id] = room;
    return acc;
  }, {} as Record<string, Room>);

  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      await apiRequest("DELETE", `/api/bookings/${bookingId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });
      onBookingUpdated();
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking",
        variant: "destructive",
      });
    },
  });

  const handleDeleteBooking = (bookingId: string, customerName: string) => {
    if (window.confirm(`Are you sure you want to delete the booking for ${customerName}?`)) {
      deleteBookingMutation.mutate(bookingId);
    }
  };

  const calculateDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const strings = getStrings(config.defaultLanguage);

  if (bookings.length === 0) {
    return (
      <Card data-testid="booking-summary">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            {strings.CURRENT_MONTH_BOOKINGS}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-500">{strings.NO_BOOKINGS_AVAILABLE}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="booking-summary">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">
          {strings.CURRENT_MONTH_BOOKINGS} ({bookings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookings.map((booking) => {
            const room = roomsMap[(booking.roomId as any)._id];

            const dateToString = (date: Date) => {
              return date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
            }


            const duration = calculateDuration(dateToString(new Date(booking.startDate)), dateToString(new Date(booking.endDate)));
            const dateRange = formatDateRange(dateToString(new Date(booking.startDate)), dateToString(new Date(booking.endDate)));

            return (
              <div
                key={(booking as any)._id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                data-testid={`booking-summary-${booking._id as string}`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: room?.color || '#6b7280' }}
                  />
                  <div>
                    <p className="font-medium text-slate-900" data-testid={`booking-customer-${booking._id as string}`}>
                      {booking.customerName}
                    </p>
                    <p className="text-sm text-slate-600" data-testid={`booking-room-${booking._id as string}`}>
                      {room?.name || 'Unknown Room'}
                    </p>
                    {booking.customerEmail && (
                      <p className="text-xs text-slate-500">
                        {booking.customerEmail}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900" data-testid={`booking-dates-${booking._id as string}`}>
                    {dateRange}
                  </p>
                  <p className="text-xs text-slate-500">
                    {duration} {duration !== 1 ? strings.DAYS_LABEL : strings.DAY_LABEL}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    onClick={() => {
                      // TODO: Implement edit functionality
                      toast({
                        title: "Coming Soon",
                        description: "Edit functionality will be available soon",
                      });
                    }}
                    data-testid={`button-edit-${booking._id as string}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    onClick={() => handleDeleteBooking(booking._id as string, booking.customerName)}
                    disabled={deleteBookingMutation.isPending}
                    data-testid={`button-delete-${booking._id as string}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
