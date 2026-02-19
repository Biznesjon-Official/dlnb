import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  customerName: string;
  phoneNumber: string;
  licensePlate: string;
  carMake?: string; // Mashina markasi (ixtiyoriy)
  carModel?: string; // Mashina modeli (ixtiyoriy)
  carYear?: number; // Mashina yili (ixtiyoriy)
  bookingDate?: Date; // Ixtiyoriy
  birthDate?: Date; // Tug'ilgan kun (ixtiyoriy)
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    licensePlate: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    carMake: {
      type: String,
      required: false,
      trim: true,
    },
    carModel: {
      type: String,
      required: false,
      trim: true,
    },
    carYear: {
      type: Number,
      required: false,
    },
    bookingDate: {
      type: Date,
      required: false, // Ixtiyoriy
    },
    birthDate: {
      type: Date,
      required: false, // Ixtiyoriy
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
bookingSchema.index({ bookingDate: 1, status: 1 });
bookingSchema.index({ phoneNumber: 1 });
bookingSchema.index({ licensePlate: 1 });
bookingSchema.index({ createdBy: 1 }); // ⚡ Populate tezroq ishlashi uchun
bookingSchema.index({ createdAt: -1 }); // ⚡ Sort tezroq ishlashi uchun
bookingSchema.index({ status: 1, bookingDate: 1, createdAt: -1 }); // ⚡ Compound index

export default mongoose.model<IBooking>('Booking', bookingSchema);
