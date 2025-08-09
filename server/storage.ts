// storage.ts
import mongoose from "mongoose";
import {
	RoomModel,
	BookingModel,
	type Room,
	type Booking,
	type InsertRoom,
	type InsertBooking,
} from "@shared/schema";

// ===== Storage Interface =====
export interface IStorage {
	getRooms(): Promise<Room[]>;
	getRoom(id: string): Promise<Room | null>;

	getBookings(): Promise<Booking[]>;
	getBookingsByMonth(year: number, month: number): Promise<Booking[]>;
	getBookingsByRoomId(roomId: string, year: number, month: number): Promise<Booking[]>;

	getBooking(id: string): Promise<Booking | null>;
	createBooking(booking: InsertBooking): Promise<Booking>;
	updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | null>;
	deleteBooking(id: string): Promise<boolean>;
	checkBookingConflict(
		roomId: string,
		startDate: string,
		endDate: string,
		excludeBookingId?: string
	): Promise<boolean>;
}

// ===== Mongo Storage Implementation =====
export class MongoStorage implements IStorage {
	async getRooms(): Promise<Room[]> {
		return RoomModel.find().lean();
	}

	async getRoom(id: string): Promise<Room | null> {
		return RoomModel.findById(id).lean();
	}

	async getBookings(): Promise<Booking[]> {
		return BookingModel.find().populate("roomId").lean();
	}

	async getBookingsByMonth(year: number, month: number): Promise<Booking[]> {
		const monthStart = new Date(year, month - 1, 1);
		const monthEnd = new Date(year, month, 0, 23, 59, 59);

		return BookingModel.find({
			$or: [
				{ startDate: { $lte: monthEnd }, endDate: { $gte: monthStart } },
			],
		})
		.populate("roomId")
		.lean();
	}

	async getBookingsByRoomId(
		roomId: string,
		year: number,
		month: number
	): Promise<Booking[]> {
		const monthStart = new Date(year, month - 1, 1);
		const monthEnd = new Date(year, month, 0, 23, 59, 59);

		return BookingModel.find({
			roomId,
			$or: [
				{ startDate: { $lte: monthEnd }, endDate: { $gte: monthStart } },
			],
		})
			.populate("roomId")
			.lean();
	}

	async getBooking(id: string): Promise<Booking | null> {
		return BookingModel.findById(id).populate("roomId").lean();
	}

	async createBooking(insertBooking: InsertBooking): Promise<Booking> {
		const booking = new BookingModel({
			...insertBooking,
			startDate: new Date(insertBooking.startDate),
			endDate: new Date(insertBooking.endDate),
		});
		await booking.save();
		return booking.toObject();
	}

	async updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | null> {
		if (updates.startDate) updates.startDate = new Date(updates.startDate) as any;
		if (updates.endDate) updates.endDate = new Date(updates.endDate) as any;

		const booking = await BookingModel.findByIdAndUpdate(id, updates, { new: true }).lean();
		return booking;
	}

	async deleteBooking(id: string): Promise<boolean> {
		const result = await BookingModel.findByIdAndDelete(id);
		return !!result;
	}

	async checkBookingConflict(
		roomId: string,
		startDate: string,
		endDate: string,
		excludeBookingId?: string
	): Promise<boolean> {
		const start = new Date(startDate);
		const end = new Date(endDate);

		const conflict = await BookingModel.findOne({
			roomId,
			_id: excludeBookingId ? { $ne: excludeBookingId } : { $exists: true },
			$or: [
				{ startDate: { $lte: end }, endDate: { $gte: start } },
			],
		}).lean();

		return !!conflict;
	}
}

export const storage = new MongoStorage();
