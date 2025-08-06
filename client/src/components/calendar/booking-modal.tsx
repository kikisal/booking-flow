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
  console.log("🔴 BookingModal received selectedDates:", selectedDates, "Length:", selectedDates.length);
  console.log("🔴 BookingModal open state:", open);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [hasConflict, setHasConflict] = useState(false);
  
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
        title: "Success",
        description: "Booking created successfully!",
      });
      onBookingCreated();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
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
      
      console.log("Booking modal conflict check - originalDates:", selectedDates, "sortedDates:", sortedDates, "startDate:", startDate, "endDate:", endDate);
      
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
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (hasConflict) {
      toast({
        title: "Error",
        description: "This room is already booked for some of the selected dates",
        variant: "destructive",
      });
      return;
    }

    // Sort the dates to ensure correct start and end
    const sortedDates = [...selectedDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const startDate = sortedDates[0];
    const endDate = sortedDates[sortedDates.length - 1];

    console.log("Creating booking with dates:", { originalSelected: selectedDates, sortedDates, startDate, endDate });

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
    ? formatDateRange(selectedDates[0], selectedDates[selectedDates.length - 1])
    : "";

  const selectedRoomData = rooms.find(room => room.id === selectedRoom);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md" data-testid="booking-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Create New Booking
            <Button variant="ghost" size="sm" onClick={handleClose} data-testid="button-close-modal">
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" data-testid="booking-form">
          <div>
            <Label className="text-sm font-medium text-slate-700">Selected Dates</Label>
            <div className="p-3 bg-slate-50 rounded-lg mt-2">
              <span className="text-sm text-slate-600" data-testid="selected-dates">
                {selectedDatesText}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="room-select" className="text-sm font-medium text-slate-700">
              Room Assignment *
            </Label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom} required>
              <SelectTrigger className="mt-2" data-testid="select-room">
                <SelectValue placeholder="Select a room..." />
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
              Customer Name *
            </Label>
            <Input
              id="customer-name"
              type="text"
              placeholder="Enter customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-2"
              required
              data-testid="input-customer-name"
            />
          </div>

          <div>
            <Label htmlFor="customer-email" className="text-sm font-medium text-slate-700">
              Customer Email
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
              Special Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or notes..."
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
                This room is already booked for some of the selected dates.
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
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={createBookingMutation.isPending || hasConflict}
              data-testid="button-create-booking"
            >
              {createBookingMutation.isPending ? (
                "Creating..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Booking
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
