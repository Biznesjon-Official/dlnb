/**
 * BARCHA MASHINALARNI O'CHIRISH - COMPLETE DELETE
 * 
 * Bu skript:
 * 1. Barcha faol mashinalarni o'chiradi
 * 2. Barcha arxivdagi mashinalarni o'chiradi
 * 3. Barcha CarService'larni o'chiradi
 * 4. Barcha Task'larni o'chiradi (mashinalar bilan bog'liq)
 * 
 * ⚠️ OGOHLANTIRISH: Bu operatsiya qaytarib bo'lmaydi!
 * 
 * Ishlatish: npm run delete-all-cars-complete
 */

import mongoose from 'mongoose';
import Car from '../models/Car';
import dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

const deleteAllCars = async () => {
  try {
    console.log('🔌 MongoDB ga ulanmoqda...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dalnoboy');
    
    console.log('✅ MongoDB ga ulandi\n');

    // Statistika olish
    const totalCars = await Car.countDocuments();
    const activeCars = await Car.countDocuments({ 
      isDeleted: { $ne: true },
      status: { $nin: ['completed', 'delivered'] },
      paymentStatus: { $nin: ['paid'] }
    });
    const archivedCars = await Car.countDocuments({
      $or: [
        { isDeleted: true },
        { status: 'completed' },
        { status: 'delivered' },
        { paymentStatus: 'paid' }
      ]
    });

    console.log('📊 HOZIRGI HOLAT:');
    console.log(`   Jami mashinalar: ${totalCars}`);
    console.log(`   Faol mashinalar: ${activeCars}`);
    console.log(`   Arxivdagi mashinalar: ${archivedCars}\n`);

    if (totalCars === 0) {
      console.log('ℹ️ Hech qanday mashina topilmadi.');
      process.exit(0);
    }

    // Tasdiqlash
    console.log('⚠️ OGOHLANTIRISH: Bu operatsiya BARCHA mashinalarni o\'chiradi!');
    console.log('⚠️ Bu operatsiya QAYTARIB BO\'LMAYDI!\n');
    
    const answer = await askQuestion('Davom etishni xohlaysizmi? (ha/yo\'q): ');
    
    if (answer.toLowerCase() !== 'ha' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Operatsiya bekor qilindi.');
      process.exit(0);
    }

    console.log('\n🗑️ O\'chirish boshlandi...\n');

    // 1. Barcha mashinalarni o'chirish
    console.log('1️⃣ Mashinalar o\'chirilmoqda...');
    const carsResult = await Car.deleteMany({});
    console.log(`   ✅ ${carsResult.deletedCount} ta mashina o'chirildi`);

    // 2. CarService'larni o'chirish
    try {
      const CarService = require('../models/CarService').default;
      console.log('2️⃣ CarService\'lar o\'chirilmoqda...');
      const servicesResult = await CarService.deleteMany({});
      console.log(`   ✅ ${servicesResult.deletedCount} ta CarService o'chirildi`);
    } catch (err) {
      console.log('   ⚠️ CarService model topilmadi yoki xatolik');
    }

    // 3. Task'larni o'chirish (mashinalar bilan bog'liq)
    try {
      const Task = require('../models/Task').default;
      console.log('3️⃣ Task\'lar o\'chirilmoqda (mashinalar bilan bog\'liq)...');
      const tasksResult = await Task.deleteMany({ car: { $exists: true } });
      console.log(`   ✅ ${tasksResult.deletedCount} ta Task o'chirildi`);
    } catch (err) {
      console.log('   ⚠️ Task model topilmadi yoki xatolik');
    }

    // 4. Transaction'larni o'chirish (mashinalar bilan bog'liq)
    try {
      const Transaction = require('../models/Transaction').default;
      console.log('4️⃣ Transaction\'lar o\'chirilmoqda (mashinalar bilan bog\'liq)...');
      const transactionsResult = await Transaction.deleteMany({ 
        'relatedTo.type': 'car' 
      });
      console.log(`   ✅ ${transactionsResult.deletedCount} ta Transaction o'chirildi`);
    } catch (err) {
      console.log('   ⚠️ Transaction model topilmadi yoki xatolik');
    }

    // 5. Debt'larni o'chirish (mashinalar bilan bog'liq)
    try {
      const Debt = require('../models/Debt').default;
      console.log('5️⃣ Debt\'lar o\'chirilmoqda (mashinalar bilan bog\'liq)...');
      const debtsResult = await Debt.deleteMany({ 
        description: { $regex: /mashina/i } 
      });
      console.log(`   ✅ ${debtsResult.deletedCount} ta Debt o'chirildi`);
    } catch (err) {
      console.log('   ⚠️ Debt model topilmadi yoki xatolik');
    }

    console.log('\n🎉 BARCHA MASHINALAR VA BOG\'LIQ MA\'LUMOTLAR O\'CHIRILDI!');
    console.log('\n📊 YANGI HOLAT:');
    console.log(`   Jami mashinalar: 0`);
    console.log(`   Faol mashinalar: 0`);
    console.log(`   Arxivdagi mashinalar: 0\n`);

    console.log('✅ Tayyor! Database tozalandi.');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Xatolik:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
};

deleteAllCars();
