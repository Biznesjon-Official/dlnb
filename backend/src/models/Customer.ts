import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  totalDebt: number;
  totalPaid: number;
  carsCount: number;
  lastVisit: Date;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    totalDebt: {
      type: Number,
      default: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    carsCount: {
      type: Number,
      default: 0,
    },
    lastVisit: {
      type: Date,
      default: Date.now,
    },
    clientId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index'lar
customerSchema.index({ phone: 1, clientId: 1 });
customerSchema.index({ name: 1, clientId: 1 });
customerSchema.index({ clientId: 1, lastVisit: -1 });

export default mongoose.model<ICustomer>('Customer', customerSchema);
