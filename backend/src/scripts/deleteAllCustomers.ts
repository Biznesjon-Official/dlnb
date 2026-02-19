/**
 * BARCHA MIJOZLARNI O'CHIRISH - COMPLETE DELETE
 * 
 * Bu skript:
 * 1. Barcha mijozlarni o'chiradi
 * 2. Barcha qarzlarni o'chiradi
 * 
 * ⚠️ OGOHLANTIRISH: Bu operatsiya qaytarib bo'lmaydi!
 * 
 * Ishlatish: npm run delete-all-customers
 */

import mongoose from 'mongoose';
import Customer from '../models/Customer';
import Debt from '../models/Debt';
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

const deleteAllCustomers = async () => {
  try {
    console.log('🔌 MongoDB ga ulanmoqda...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dalnoboy');
    
    console.log('✅ MongoDB ga ulandi\n');

    // Statistika olish
    const totalCustomers = await Customer.countDocuments();
    const totalDebts = await Debt.countDocuments();

    console.log('📊 HOZIRGI HOLAT:');
    console.log(`   Jami mijozlar: ${totalCustomers}`);
    console.log(`   Jami qarzlar: ${totalDebts}\n`);

    if (totalCustomers === 0) {
      console.log('ℹ️ Hech qanday mijoz topilmadi.');
      process.exit(0);
    }

    // Tasdiqlash
    console.log('⚠️ OGOHLANTIRISH: Bu operatsiya BARCHA mijozlarni o\'chiradi!');
    console.log('⚠️ Bu operatsiya QAYTARIB BO\'LMAYDI!\n');
    
    const answer = await askQuestion('Davom etishni xohlaysizmi? (ha/yo\'q): ');
    
    if (answer.toLowerCase() !== 'ha' && answer.toLowerCase() !== 'yes') {
      console.log('❌ Operatsiya bekor qilindi.');
      process.exit(0);
    }

    console.log('\n🗑️ O\'chirish boshlandi...\n');

    // 1. Barcha mijozlarni o'chirish
    console.log('1️⃣ Mijozlar o\'chirilmoqda...');
    const customersResult = await Customer.deleteMany({});
    console.log(`   ✅ ${customersResult.deletedCount} ta mijoz o'chirildi`);

    // 2. Barcha qarzlarni o'chirish
    console.log('2️⃣ Qarzlar o\'chirilmoqda...');
    const debtsResult = await Debt.deleteMany({});
    console.log(`   ✅ ${debtsResult.deletedCount} ta qarz o'chirildi`);

    console.log('\n🎉 BARCHA MIJOZLAR VA QARZLAR O\'CHIRILDI!');
    console.log('\n📊 YANGI HOLAT:');
    console.log(`   Jami mijozlar: 0`);
    console.log(`   Jami qarzlar: 0\n`);

    console.log('✅ Tayyor! Database tozalandi.');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Xatolik:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
};

deleteAllCustomers();
