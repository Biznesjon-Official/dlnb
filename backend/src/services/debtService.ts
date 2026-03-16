import Debt from '../models/Debt';
import Car from '../models/Car';
import mongoose from 'mongoose';

interface CreateOrUpdateDebtParams {
  carId: mongoose.Types.ObjectId | string;
  totalAmount: number;
  paidAmount: number;
  paymentMethod?: 'cash' | 'card' | 'click';
  notes?: string;
  createdBy: mongoose.Types.ObjectId | string;
}

/**
 * Qarz yaratish yoki yangilash uchun markaziy service
 * Bu service barcha qarz operatsiyalarini bir joyda boshqaradi
 */
class DebtService {
  /**
   * Mashina uchun qarz yaratish yoki yangilash
   * Agar to'liq to'langan bo'lsa, qarzni "paid" ga o'zgartiradi
   */
  async createOrUpdateDebt(params: CreateOrUpdateDebtParams) {
    const { carId, totalAmount, paidAmount, paymentMethod, notes, createdBy } = params;

    // Mashina ma'lumotlarini olish
    const car = await Car.findById(carId);
    if (!car) {
      throw new Error('Car not found');
    }

    const remainingAmount = totalAmount - paidAmount;

    // Mavjud qarzni topish
    let existingDebt = await Debt.findOne({
      car: carId,
      type: 'receivable',
      status: { $in: ['pending', 'partial'] }
    });

    if (remainingAmount <= 0) {
      // To'liq to'langan - barcha qarzlarni "paid" ga o'zgartirish
      if (existingDebt) {
        existingDebt.status = 'paid';
        existingDebt.paidAmount = existingDebt.amount;
        await existingDebt.save();
        console.log(`✅ Qarz to'liq to'landi - ${car.licensePlate}`);
        
        // 👤 Customer'ni yangilash - qarzni kamaytirish
        await this.updateCustomerDebt(car.ownerPhone, car.ownerName);
      }
      return { debt: existingDebt, action: 'paid' };
    }

    if (existingDebt) {
      // Mavjud qarzni yangilash
      existingDebt.amount = totalAmount;
      existingDebt.description = `${car.make} ${car.carModel} (${car.licensePlate}) uchun xizmat to'lovi`;
      
      // Agar yangi to'lov bo'lsa, paymentHistory ga qo'shish
      if (paymentMethod && paidAmount > (existingDebt.paidAmount || 0)) {
        const paymentAmount = paidAmount - (existingDebt.paidAmount || 0);
        existingDebt.paymentHistory.push({
          amount: paymentAmount,
          date: new Date(),
          paymentMethod,
          notes: notes || `Xizmat to'lovi - ${paymentMethod}`
        });
      }
      
      await existingDebt.save();
      console.log(`📝 Qarz yangilandi: ${remainingAmount} so'm qoldi - ${car.ownerName}`);
      
      // 👤 Customer'ni yangilash
      await this.updateCustomerDebt(car.ownerPhone, car.ownerName);
      
      return { debt: existingDebt, action: 'updated' };
    } else {
      // Yangi qarz yaratish
      const newDebt = new Debt({
        type: 'receivable',
        amount: totalAmount,
        description: `${car.make} ${car.carModel} (${car.licensePlate}) uchun xizmat to'lovi`,
        creditorName: car.ownerName,
        creditorPhone: car.ownerPhone,
        car: carId,
        status: 'pending',
        paidAmount: 0,
        paymentHistory: [],
        createdBy
      });

      // Agar allaqachon to'lov bo'lsa, paymentHistory ga qo'shish
      if (paymentMethod && paidAmount > 0) {
        newDebt.paymentHistory.push({
          amount: paidAmount,
          date: new Date(),
          paymentMethod,
          notes: notes || `Xizmat to'lovi - ${paymentMethod}`
        });
      }

      await newDebt.save();
      console.log(`📝 Qarz yaratildi: ${remainingAmount} so'm - ${car.ownerName}`);
      
      // 👤 Customer'ni yangilash
      await this.updateCustomerDebt(car.ownerPhone, car.ownerName);
      
      return { debt: newDebt, action: 'created' };
    }
  }

  /**
   * Customer'ning umumiy qarzini yangilash
   */
  async updateCustomerDebt(phone: string, name: string) {
    try {
      const Customer = require('../models/Customer').default;
      
      // Mijozning barcha faol qarzlarini hisoblash
      const debts = await Debt.find({
        creditorPhone: phone,
        type: 'receivable',
        status: { $in: ['pending', 'partial'] }
      });
      
      const totalDebt = debts.reduce((sum, debt) => {
        const remaining = debt.amount - (debt.paidAmount || 0);
        return sum + remaining;
      }, 0);
      
      // Customer'ni yangilash yoki yaratish
      await Customer.findOneAndUpdate(
        { phone },
        {
          $set: {
            name,
            totalDebt,
            lastVisit: new Date()
          }
        },
        { upsert: true, new: true }
      );
      
      console.log(`👤 Customer yangilandi: ${name} - Qarz: ${totalDebt} so'm`);
    } catch (error: any) {
      console.error('⚠️ Customer yangilashda xatolik:', error.message);
    }
  }

  /**
   * Mashina tugatilganda avtomatik qarz yaratish
   * Bu funksiya faqat qarz mavjud bo'lmagan holatda yangi qarz yaratadi
   */
  async createDebtForCompletedCar(params: {
    carId: mongoose.Types.ObjectId | string;
    clientName: string;
    clientPhone: string;
    totalAmount: number;
    paidAmount: number;
    description: string;
    notes?: string;
    createdBy: mongoose.Types.ObjectId | string;
  }) {
    const { carId, clientName, clientPhone, totalAmount, paidAmount, description, notes, createdBy } = params;
    
    const remainingAmount = totalAmount - paidAmount;
    
    // Agar to'liq to'langan bo'lsa, qarz yaratmaslik
    if (remainingAmount <= 0) {
      console.log(`✅ Mashina to'liq to'langan - qarz yaratilmaydi: ${clientName}`);
      return null;
    }

    // Mavjud faol qarzni tekshirish
    const existingDebt = await Debt.findOne({
      car: carId,
      type: 'receivable',
      status: { $in: ['pending', 'partial'] }
    });

    if (existingDebt) {
      console.log(`📝 Mavjud qarz topildi - yangi qarz yaratilmaydi: ${clientName}`);
      return existingDebt;
    }

    // Yangi qarz yaratish
    const newDebt = new Debt({
      type: 'receivable',
      amount: remainingAmount,
      description,
      creditorName: clientName,
      creditorPhone: clientPhone,
      car: carId,
      status: 'pending',
      paidAmount: 0,
      paymentHistory: [],
      notes,
      createdBy
    });

    await newDebt.save();
    console.log(`💰 Avtomatik qarz yaratildi: ${remainingAmount} so'm - ${clientName}`);
    return newDebt;
  }

  /**
   * Oddiy qarz yaratish (backward compatibility uchun)
   */
  async createDebt(params: {
    carId: mongoose.Types.ObjectId | string;
    clientName: string;
    clientPhone: string;
    amount: number;
    description: string;
    notes?: string;
  }) {
    const { carId, clientName, clientPhone, amount, description, notes } = params;

    const newDebt = new Debt({
      type: 'receivable',
      amount,
      description,
      creditorName: clientName,
      creditorPhone: clientPhone,
      car: carId,
      status: 'pending',
      paidAmount: 0,
      paymentHistory: [],
      notes
    });

    await newDebt.save();
    console.log(`💰 Yangi qarz yaratildi: ${amount} so'm - ${clientName}`);
    return newDebt;
  }

  /**
   * Qarzga to'lov qo'shish
   */
  async addPaymentToDebt(debtId: string, amount: number, paymentMethod: 'cash' | 'card' | 'click', notes?: string) {
    const debt = await Debt.findById(debtId);
    if (!debt) {
      throw new Error('Debt not found');
    }

    debt.paymentHistory.push({
      amount,
      date: new Date(),
      paymentMethod,
      notes
    });

    await debt.save();
    return debt;
  }

  /**
   * Mashina uchun barcha faol qarzlarni olish
   */
  async getActiveDebtsForCar(carId: string) {
    return await Debt.find({
      car: carId,
      type: 'receivable',
      status: { $in: ['pending', 'partial'] }
    });
  }

  /**
   * Mashina uchun barcha qarzlarni to'langan deb belgilash
   */
  async markDebtsAsPaid(carId: string) {
    const result = await Debt.updateMany(
      {
        car: carId,
        type: 'receivable',
        status: { $in: ['pending', 'partial'] }
      },
      {
        $set: {
          status: 'paid'
        }
      }
    );
    
    console.log(`✅ ${result.modifiedCount} ta qarz to'liq to'landi`);
    return result;
  }
}

export default new DebtService();
