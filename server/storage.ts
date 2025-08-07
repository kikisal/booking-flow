import { type Room, type Booking, type InsertRoom, type InsertBooking } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Room methods
  getRooms(): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  
  // Booking methods
  getBookings(): Promise<Booking[]>;
  getBookingsByMonth(year: number, month: number): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<boolean>;
  checkBookingConflict(roomId: string, startDate: string, endDate: string, excludeBookingId?: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;
  private bookings: Map<string, Booking>;

  constructor() {
    this.rooms = new Map();
    this.bookings = new Map();
    this.initializeRooms();
    this.initializeSampleBookings();
  }

  private initializeRooms() {
    const defaultRooms: Room[] = [
      { id: "green-room", name: "Green Room", color: "hsl(142, 71%, 45%)" },
      { id: "red-room", name: "Red Room", color: "hsl(0, 84%, 60%)" },
      { id: "yellow-room", name: "Yellow Room", color: "hsl(38, 92%, 50%)" }
    ];

    defaultRooms.forEach(room => {
      this.rooms.set(room.id, room);
    });
  }

  private initializeSampleBookings() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // const sampleBookings: Array<Omit<Booking, 'id' | 'createdAt'>> = [
    // //   {
    // //     roomId: "executive",
    // //     customerName: "John Smith",
    // //     customerEmail: "john.smith@example.com",
    // //     startDate: new Date(currentYear, currentMonth, 5).toISOString().split('T')[0],
    // //     endDate: new Date(currentYear, currentMonth, 7).toISOString().split('T')[0],
    // //     notes: "Business conference"
    // //   },
    // //   {
    // //     roomId: "standard",
    // //     customerName: "Sarah Johnson",
    // //     customerEmail: "sarah@example.com",
    // //     startDate: new Date(currentYear, currentMonth, 12).toISOString().split('T')[0],
    // //     endDate: new Date(currentYear, currentMonth, 14).toISOString().split('T')[0],
    // //     notes: null
    // //   },
    // //   {
    // //     roomId: "deluxe",
    // //     customerName: "Mike Wilson",
    // //     customerEmail: null,
    // //     startDate: new Date(currentYear, currentMonth, 20).toISOString().split('T')[0],
    // //     endDate: new Date(currentYear, currentMonth, 22).toISOString().split('T')[0],
    // //     notes: "Wedding celebration"
    // //   },
    // //   {
    // //     roomId: "family",
    // //     customerName: "Emma Davis",
    // //     customerEmail: "emma.davis@example.com",
    // //     startDate: new Date(currentYear, currentMonth, 15).toISOString().split('T')[0],
    // //     endDate: new Date(currentYear, currentMonth, 18).toISOString().split('T')[0],
    // //     notes: "Family vacation"
    // //   },
    // //   {
    // //     roomId: "penthouse",
    // //     customerName: "Robert Brown",
    // //     customerEmail: "rbrown@example.com",
    // //     startDate: new Date(currentYear, currentMonth, 25).toISOString().split('T')[0],
    // //     endDate: new Date(currentYear, currentMonth, 28).toISOString().split('T')[0],
    // //     notes: "Corporate retreat"
    // //   }
    // // ];

    const sampleBookings: Array<Omit<Booking, 'id' | 'createdAt'>>  = [];

    sampleBookings.forEach(booking => {
      const id = randomUUID();
      const fullBooking: Booking = {
        ...booking,
        id,
        createdAt: new Date()
      };
      this.bookings.set(id, fullBooking);
    });
  }

  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBookingsByMonth(year: number, month: number): Promise<Booking[]> {
    const bookings = Array.from(this.bookings.values());
    return bookings.filter(booking => {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      
      return (startDate <= monthEnd && endDate >= monthStart);
    });
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      id,
      customerEmail: insertBooking.customerEmail ?? null,
      notes: insertBooking.notes ?? null,
      createdAt: new Date(),
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existing = this.bookings.get(id);
    if (!existing) return undefined;

    const updated: Booking = {
      ...existing,
      ...updates,
    };
    this.bookings.set(id, updated);
    return updated;
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookings.delete(id);
  }

  async checkBookingConflict(
    roomId: string, 
    startDate: string, 
    endDate: string, 
    excludeBookingId?: string
  ): Promise<boolean> {
    const bookings = Array.from(this.bookings.values());
    const start = new Date(startDate);
    const end = new Date(endDate);

    return bookings.some(booking => {
      if (booking.id === excludeBookingId) return false;
      if (booking.roomId !== roomId) return false;

      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);

      return (start <= bookingEnd && end >= bookingStart);
    });
  }
}

export const storage = new MemStorage();
