import cron from 'node-cron';
import User from '../models/User';
import Transaction from '../models/Transaction';

/**
 * Kunlik ishchilar uchun avtomatik to'lov qo'shish
 * Har kuni soat 00:01 da ishga tushadi
 */
export const startDailyPaymentCron = () => {
  // Har kuni soat 00:01 da ishga tushadi
  cron.schedule('1 0 * * *', async () => {
    try {
      console.log('🕐 Kunlik to\'lovlar jarayoni boshlandi...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Kunlik ishchilarni topish
      const dailyWorkers = await User.find({
        role: 'apprentice',
        paymentType: 'daily',
        dailyRate: { $gt: 0 }
      });

      console.log(`📋 ${dailyWorkers.length} ta kunlik ishchi topildi`);

      let successCount = 0;
      let skipCount = 0;

      for (const worker of dailyWorkers) {
        try {
          // Bugun allaqachon to'lov qo'shilganmi tekshirish
          const lastPaymentDate = worker.lastDailyPaymentDate 
            ? new Date(worker.lastDailyPaymentDate) 
            : null;
          
          if (lastPaymentDate) {
            lastPaymentDate.setHours(0, 0, 0, 0);
            
            // Agar bugun allaqachon to'lov qo'shilgan bo'lsa, o'tkazib yuborish
            if (lastPaymentDate.getTime() === today.getTime()) {
              console.log(`⏭️  ${worker.name} - bugun allaqachon to'lov qo'shilgan`);
              skipCount++;
              continue;
            }
          }

          // Kunlik to'lovni qo'shish
          const dailyRate = worker.dailyRate || 0;
          
          // Master ID'sini olish (worker.masterId yoki birinchi master)
          const User = require('../models/User').default;
          const master = worker.masterId 
            ? await User.findById(worker.masterId)
            : await User.findOne({ role: 'master' });

          if (!master) {
            console.error(`❌ ${worker.name} uchun master topilmadi`);
            continue;
          }
          
          // Transaction yaratish
          const transaction = new Transaction({
            type: 'income',
            category: 'daily_payment',
            amount: dailyRate,
            description: `${worker.name} - kunlik to'lov (${today.toLocaleDateString('uz-UZ')})`,
            apprenticeId: worker._id,
            createdBy: master._id,
            date: today
          });
          await transaction.save();

          // Ishchi daromadini yangilash
          worker.earnings += dailyRate;
          worker.totalEarnings += dailyRate;
          worker.lastDailyPaymentDate = today;
          await worker.save();

          console.log(`✅ ${worker.name} - ${dailyRate.toLocaleString()} so'm qo'shildi`);
          successCount++;
        } catch (error) {
          console.error(`❌ ${worker.name} uchun to'lov qo'shishda xatolik:`, error);
        }
      }

      console.log(`✨ Kunlik to'lovlar jarayoni tugadi: ${successCount} muvaffaqiyatli, ${skipCount} o'tkazib yuborildi`);
    } catch (error) {
      console.error('❌ Kunlik to\'lovlar jarayonida xatolik:', error);
    }
  });

  console.log('✅ Kunlik to\'lovlar cron job ishga tushirildi (har kuni 00:01)');
};

/**
 * Qo'lda kunlik to'lov qo'shish (test uchun)
 */
export const addDailyPaymentManually = async (userId: string) => {
  try {
    const UserModel = require('../models/User').default;
    const worker = await UserModel.findById(userId);
    
    if (!worker) {
      throw new Error('Ishchi topilmadi');
    }

    if (worker.paymentType !== 'daily') {
      throw new Error('Bu ishchi kunlik ishchi emas');
    }

    if (!worker.dailyRate || worker.dailyRate <= 0) {
      throw new Error('Kunlik to\'lov summasi belgilanmagan');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bugun allaqachon to'lov qo'shilganmi tekshirish
    const lastPaymentDate = worker.lastDailyPaymentDate 
      ? new Date(worker.lastDailyPaymentDate) 
      : null;
    
    if (lastPaymentDate) {
      lastPaymentDate.setHours(0, 0, 0, 0);
      
      if (lastPaymentDate.getTime() === today.getTime()) {
        throw new Error('Bugun allaqachon to\'lov qo\'shilgan');
      }
    }

    // Master ID'sini olish
    const master = worker.masterId 
      ? await UserModel.findById(worker.masterId)
      : await UserModel.findOne({ role: 'master' });

    if (!master) {
      throw new Error('Master topilmadi');
    }

    // Transaction yaratish
    const transaction = new Transaction({
      type: 'income',
      category: 'daily_payment',
      amount: worker.dailyRate,
      description: `${worker.name} - kunlik to'lov (${today.toLocaleDateString('uz-UZ')})`,
      apprenticeId: worker._id,
      createdBy: master._id,
      date: today
    });
    await transaction.save();

    // Ishchi daromadini yangilash
    worker.earnings += worker.dailyRate;
    worker.totalEarnings += worker.dailyRate;
    worker.lastDailyPaymentDate = today;
    await worker.save();

    return {
      success: true,
      message: `${worker.name} uchun ${worker.dailyRate.toLocaleString()} so'm kunlik to'lov qo'shildi`,
      transaction
    };
  } catch (error: any) {
    throw new Error(error.message || 'Kunlik to\'lov qo\'shishda xatolik');
  }
};
