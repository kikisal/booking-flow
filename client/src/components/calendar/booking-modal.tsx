import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDateRange } from "@/lib/calendar-utils";
import type { Room, InsertBooking } from "@shared/schema";
import { AlertTriangle, Check, X } from "lucide-react";
import { getStrings } from "@shared/strings";
import { config } from "@shared/config";

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  selectedDates: string[];
  rooms: Room[];
  onBookingCreated: () => void;
}

export function BookingModal({ 
  open, 
  onClose, 
  selectedDates, 
  rooms, 
  onBookingCreated 
}: BookingModalProps) {
  
  const [selectedRoom, setSelectedRoom] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [hasConflict, setHasConflict] = useState(false);
  const strings = getStrings(config.defaultLanguage);
  
  const { toast } = useToast();

  const checkConflictMutation = useMutation({
    mutationFn: async (data: { roomId: string; startDate: string; endDate: string }) => {
      const response = await apiRequest("POST", "/api/bookings/check-conflict", data);
      return response.json();
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (booking: InsertBooking) => {
      const response = await apiRequest("POST", "/api/bookings", booking);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: strings.MODAL_BOOKING_CREATED_TITLE,
        description: strings.MODAL_BOOKING_CREATED,
      });
      onBookingCreated();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: strings.MODAL_BOOKING_ERROR_TITLE,
        description: error.message || strings.MODAL_CREATION_FAILED,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (selectedRoom && selectedDates.length > 0) {
      // Sort the selected dates to ensure proper order
      const sortedDates = selectedDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      const startDate = sortedDates[0];
      const endDate = sortedDates[sortedDates.length - 1];
            
      checkConflictMutation.mutate({
        roomId: selectedRoom,
        startDate,
        endDate,
      }, {
        onSuccess: (data) => {
          setHasConflict(data.hasConflict);
        },
      });
    } else {
      setHasConflict(false);
    }
  }, [selectedRoom, selectedDates]);

  const resetForm = () => {
    setSelectedRoom("");
    setCustomerName("");
    setCustomerEmail("");
    setNotes("");
    setHasConflict(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoom || !customerName || selectedDates.length === 0) {
      toast({
        title: strings.MODAL_BOOKING_ERROR_TITLE,
        description: strings.MODAL_BOOKING_ERROR,
        variant: "destructive",
      });
      return;
    }

    if (hasConflict) {
      toast({
        title: strings.MODAL_BOOKING_ERROR_TITLE,
        description: strings.MODAL_DATE_CONFLICT,
        variant: "destructive",
      });
      return;
    }

    // Sort the dates to ensure correct start and end
    const sortedDates = [...selectedDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];

    const bookingData: InsertBooking = {
      roomId: selectedRoom,
      customerName,
      customerEmail: customerEmail || null,
      startDate,
      endDate,
      notes: notes || null,
    };

    createBookingMutation.mutate(bookingData);
  };

  const selectedDatesText = selectedDates.length > 0 
    ? (() => {
        const sortedDates = [...selectedDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        return formatDateRange(sortedDates[0], sortedDates[sortedDates.length - 1]);
      })()
    : "";

  const selectedRoomData = rooms.find(room => room.id === selectedRoom);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md" data-testid="booking-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {strings.MODAL_CREATE_NEW_BOOKING}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="booking-form">
          <div>
            <Label className="text-sm font-medium text-slate-700">{strings.MODAL_SELECT_DATES}</Label>
            <div className="p-3 bg-slate-50 rounded-lg mt-2">
              <span className="text-sm text-slate-600" data-testid="selected-dates">
                {selectedDatesText}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="room-select" className="text-sm font-medium text-slate-700">
              {strings.MODAL_ROOM_ASSIGNMENT} *
            </Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom} required>
              <SelectTrigger className="mt-2" data-testid="select-room">
                <SelectValue placeholder={strings.MODAL_SELECT_ROOM_INPUT} />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id} data-testid={`room-option-${room.id}`}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: room.color }}
                      />
                      <span>{room.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="customer-name" className="text-sm font-medium text-slate-700">
              {strings.MODAL_CUSTOMER_NAME} *
            </Label>
            <Input
              id="customer-name"
              type="text"
              placeholder={strings.MODAL_ENTER_CUSTOMER_NAME_INPUT}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-2"
              required
              data-testid="input-customer-name"
            />
          </div>

          <div>
            <Label htmlFor="customer-email" className="text-sm font-medium text-slate-700">
              {strings.MODAL_CUSTOMER_EMAIL}
            </Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="customer@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="mt-2"
              data-testid="input-customer-email"
            />
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
              {strings.MODAL_SPECIAL_NOTES}
            </Label>
            <Textarea
              id="notes"
              placeholder={strings.MODAL_SPECIAL_NOTES_INPUT}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 h-20 resize-none"
              data-testid="textarea-notes"
            />
          </div>

          {hasConflict && (
            <Alert variant="destructive" data-testid="conflict-warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {strings.MODAL_DATE_CONFLICT}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={handleClose}
              data-testid="button-cancel"
            >
              {strings.MODAL_CANCEL_BUTTON}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={createBookingMutation.isPending || hasConflict}
              data-testid="button-create-booking"
            >
              {createBookingMutation.isPending ? (
                strings.MODAL_PENDING_CREATING
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {strings.MODAL_CREATE_BOOKING_BUTTON}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
