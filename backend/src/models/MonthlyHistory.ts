import mongoose, { Document, Schema } from 'mongoose';

export interface ITransactionSnapshot {
  type: 'income' | 'expense';
  amount: number;
  paymentMethod?: 'cash' | 'card' | 'click';
  description?: string;
  categoryName?: string;
  relatedType?: string;
  relatedLicensePlate?: string;
  relatedOwnerName?: string;
  apprenticeName?: string;
  createdByName?: string;
  createdAt: Date;
}

export interface ITaskSnapshot {
  title: string;
  carLicensePlate?: string;
  carOwnerName?: string;
  payment: number;
  apprenticeEarning?: number;
  completedAt?: Date;
}

export interface ICategoryBreakdown {
  categoryName: string;
  type: 'income' | 'expense';
  amount: number;
  count: number;
}

export interface IUserEarning {
  userId: mongoose.Types.ObjectId;
  name: string;
  role: string;
  earnings: number;
  taskCount?: number;
  tasks?: ITaskSnapshot[];
}

export interface IMonthlyHistory extends Document {
  month: number; // 1-12
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCash: number;
  incomeCard: number;
  expenseCash: number;
  expenseCard: number;
  balanceCash: number;
  balanceCard: number;
  incomeCount: number;
  expenseCount: number;
  transactionCount: number;
  userEarnings: IUserEarning[];
  // Yangi snapshot fieldlari — eski yozuvlarda yo'q, yangilarida to'la
  hasDetailedSnapshot: boolean;
  transactions?: ITransactionSnapshot[];
  categoriesBreakdown?: ICategoryBreakdown[];
  resetDate: Date;
  resetBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const monthlyHistorySchema = new Schema<IMonthlyHistory>({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  totalIncome: {
    type: Number,
    default: 0
  },
  totalExpense: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  incomeCash: {
    type: Number,
    default: 0
  },
  incomeCard: {
    type: Number,
    default: 0
  },
  expenseCash: {
    type: Number,
    default: 0
  },
  expenseCard: {
    type: Number,
    default: 0
  },
  balanceCash: {
    type: Number,
    default: 0
  },
  balanceCard: {
    type: Number,
    default: 0
  },
  incomeCount: {
    type: Number,
    default: 0
  },
  expenseCount: {
    type: Number,
    default: 0
  },
  transactionCount: {
    type: Number,
    default: 0
  },
  userEarnings: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    },
    earnings: {
      type: Number,
      default: 0
    },
    taskCount: {
      type: Number,
      default: 0
    },
    tasks: [{
      title: String,
      carLicensePlate: String,
      carOwnerName: String,
      payment: { type: Number, default: 0 },
      apprenticeEarning: { type: Number, default: 0 },
      completedAt: Date
    }]
  }],
  // Eski yozuvlar uchun false (faqat aggregate), yangilar uchun true (to'liq snapshot)
  hasDetailedSnapshot: {
    type: Boolean,
    default: false
  },
  transactions: [{
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['cash', 'card', 'click'] },
    description: String,
    categoryName: String,
    relatedType: String,
    relatedLicensePlate: String,
    relatedOwnerName: String,
    apprenticeName: String,
    createdByName: String,
    createdAt: { type: Date, required: true }
  }],
  categoriesBreakdown: [{
    categoryName: { type: String, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }],
  resetDate: {
    type: Date,
    default: Date.now
  },
  resetBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
monthlyHistorySchema.index({ year: -1, month: -1 });
monthlyHistorySchema.index({ resetDate: -1 });

export default mongoose.model<IMonthlyHistory>('MonthlyHistory', monthlyHistorySchema);
