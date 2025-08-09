// schema.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { z } from "zod";

// ====== Room Schema ======
export interface IRoom extends Document {
  _id: string;
  name: string;
  color: string;
}

const RoomSchema: Schema<IRoom> = new Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
});

export const RoomModel: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);

// ====== Booking Schema ======
export interface IBooking extends Document {
  roomId: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail?: string | null;
  startDate: Date;
  endDate: Date;
  notes?: string | null;
  createdAt: Date;
}

const BookingSchema: Schema<IBooking> = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, default: null },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  notes: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

export const BookingModel: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

// ====== Zod Schemas ======
export const insertRoomSchema = z.object({
  name: z.string(),
  color: z.string(),
});

export const insertBookingSchema = z.object({
  roomId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email().optional().nullable(),
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
  notes: z.string().optional().nullable(),
});

export type Room = IRoom;
export type Booking = IBooking;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
