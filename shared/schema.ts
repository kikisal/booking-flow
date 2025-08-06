import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true });
export const insertBookingSchema = createInsertSchema(bookings).omit({ 
  id: true, 
  createdAt: true 
});

export type Room = typeof rooms.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
