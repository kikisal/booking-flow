import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express) {
  // Get all rooms
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  // Get bookings (optionally filtered by month)
  app.get("/api/bookings", async (req, res) => {
    try {
      const { year, month } = req.query;
      
      if (year && month) {
        const bookings = await storage.getBookingsByMonth(
          parseInt(year as string),
          parseInt(month as string)
        );
        res.json(bookings);
      } else {
        const bookings = await storage.getBookings();
        res.json(bookings);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/room-bookings/:roomId", async (req, res) => {
    try {
      const { year, month } = req.query;
      const { roomId }      = req.params;
      
      if (year && month) {
        const bookings = await storage.getBookingsByRoomId(
          roomId as string,
          parseInt(year as string),
          parseInt(month as string)
        );
        res.json(bookings);
      } else {
        const bookings = await storage.getBookings();
        res.json(bookings);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  

  // Get single booking
  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  // Create new booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      
      // Check for conflicts
      const hasConflict = await storage.checkBookingConflict(
        validatedData.roomId,
        validatedData.startDate,
        validatedData.endDate
      );

      if (hasConflict) {
        return res.status(409).json({ 
          message: "This room is already booked for the selected dates" 
        });
      }

      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid booking data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Update booking
  app.put("/api/bookings/:id", async (req, res) => {
    try {
      const updateSchema = insertBookingSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      // Check for conflicts if dates or room are being updated
      if (validatedData.roomId || validatedData.startDate || validatedData.endDate) {
        const existing = await storage.getBooking(req.params.id);
        if (!existing) {
          return res.status(404).json({ message: "Booking not found" });
        }
        
        const hasConflict = await storage.checkBookingConflict(
          (validatedData.roomId || existing.roomId) as any,
          (validatedData.startDate || existing.startDate) as any,
          (validatedData.endDate || existing.endDate) as any,
          req.params.id
        );

        if (hasConflict) {
          return res.status(409).json({ 
            message: "This room is already booked for the selected dates" 
          });
        }
      }

      const booking = await storage.updateBooking(req.params.id, validatedData);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid booking data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Delete booking
  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBooking(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // Check booking conflicts
  app.post("/api/bookings/check-conflict", async (req, res) => {
    try {
      const { roomId, startDate, endDate, excludeBookingId } = req.body;

      
      if (!roomId || !startDate || !endDate) {
        return res.status(400).json({ 
          message: "roomId, startDate, and endDate are required" 
        });
      }

      const hasConflict = await storage.checkBookingConflict(
        roomId, 
        startDate, 
        endDate, 
        excludeBookingId
      );
      
      res.json({ hasConflict });
    } catch (error) {
      res.status(500).json({ message: "Failed to check conflicts" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
