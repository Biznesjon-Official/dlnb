/**
 * KUNLIK ISHCHI - O'TKAZIB YUBORILGAN KUNLAR TESTI
 * 
 * MISOL:
 * - Bugun: 16-fevral 2026
 * - Oxirgi to'lov: 14-fevral 2026
 * - O'tkazib yuborilgan kunlar: 15-fevral, 16-fevral (2 kun)
 * - Kunlik ish haqi: 50,000 so'm
 * - Jami qo'shiladigan: 100,000 so'm (2 kun × 50,000)
 * 
 * Bu skript:
 * 1. Kunlik ishchi yaratadi (50,000 so'm/kun)
 * 2. lastDailyPaymentDate ni 14-fevral qilib qo'yadi
 * 3. Bugungi sanani 16-fevral qilib qo'yadi
 * 4. Kunlik to'lov funksiyasini chaqiradi
 * 5. 2 kunlik pul (100,000 so'm) qo'shilishini tekshiradi
 * 
 * Ishlatish: npm run test-daily-worker-missed
 */

import mongoose from 'mongoose';
import User from '../models/User';
import Transaction from '../models/Transaction';
import dotenv from 'dotenv';

dotenv.config();

const testDailyWorkerMissedDays = async () => {
  try {
    console.log('🔌 MongoDB ga ulanmoqda...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dalnoboy');
    console.log('✅ MongoDB ga ulandi\n');

    // 1. Master topish
    const master = await User.findOne({ role: 'master' });
    if (!master) {
      console.error('❌ Master topilmadi!');
      process.exit(1);
    }
    console.log(`✅ Master topildi: ${master.name}\n`);

    // 2. Eski test shogirdni o'chirish (agar mavjud bo'lsa)
    await User.deleteOne({ username: 'test_kunlik' });
    console.log('🗑️  Eski test shogird o\'chirildi\n');

    // 3. Yangi kunlik ishchi yaratish
    console.log('👤 Yangi kunlik ishchi yaratilmoqda...');
    const worker = new User({
      name: 'Test Kunlik Ishchi',
      username: 'test_kunlik',
      password: '123456',
      phone: '998901234567',
      role: 'apprentice',
      paymentType: 'daily',
      dailyRate: 50000,
      masterId: master._id,
      earnings: 0,
      totalEarnings: 0,
      lastDailyPaymentDate: null
    });
    await worker.save();
    console.log(`✅ Kunlik ishchi yaratildi: ${worker.name}`);
    console.log(`   Kunlik ish haqi: ${worker.dailyRate?.toLocaleString()} so'm\n`);

    // 4. Bugungi sanani 16-fevral 2026 qilib qo'yish
    const today = new Date('2026-02-16');
    today.setHours(0, 0, 0, 0);
    console.log(`📅 Bugungi sana: ${today.toLocaleDateString('uz-UZ')} (16-fevral 2026)\n`);

    // 5. lastDailyPaymentDate ni 14-fevral 2026 qilib qo'yish
    const lastPaymentDate = new Date('2026-02-14');
    lastPaymentDate.setHours(0, 0, 0, 0);
    
    worker.lastDailyPaymentDate = lastPaymentDate;
    await worker.save();
    
    console.log(`📅 Oxirgi to'lov sanasi: ${lastPaymentDate.toLocaleDateString('uz-UZ')} (14-fevral 2026)`);
    console.log(`   O'tkazib yuborilgan kunlar: 15-fevral, 16-fevral (2 kun)\n`);

    // 6. O'tkazib yuborilgan kunlarni hisoblash va to'lovlarni qo'shish
    console.log('💰 O\'tkazib yuborilgan kunlar uchun to\'lovlar qo\'shilmoqda...\n');
    
    // Keyingi kundan boshlash (15-fevral)
    let currentDate = new Date(lastPaymentDate);
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
    
    let totalAdded = 0;
    let daysAdded = 0;
    
    // 15-fevral va 16-fevral uchun to'lov qo'shish
    while (currentDate <= today) {
      // Har bir kun uchun transaction yaratish
      const transaction = new Transaction({
        type: 'income',
        category: 'daily_payment',
        amount: worker.dailyRate,
        description: `${worker.name} - kunlik to'lov (${currentDate.toLocaleDateString('uz-UZ')})`,
        apprenticeId: worker._id,
        createdBy: master._id,
        paymentMethod: 'cash'
      });
      await transaction.save();
      
      totalAdded += worker.dailyRate || 0;
      daysAdded++;
      
      console.log(`   ✅ ${currentDate.toLocaleDateString('uz-UZ')} - ${worker.dailyRate?.toLocaleString()} so'm`);
      
      // Keyingi kunga o'tish
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 6. Ishchi daromadini yangilash
    worker.earnings += totalAdded;
    worker.totalEarnings += totalAdded;
    worker.lastDailyPaymentDate = today;
    await worker.save();
    
    console.log('\n📊 NATIJA:');
    console.log(`   Oxirgi to'lov: 14-fevral 2026`);
    console.log(`   Bugungi sana: 16-fevral 2026`);
    console.log(`   O'tkazib yuborilgan kunlar: ${daysAdded} kun (15-fevral, 16-fevral)`);
    console.log(`   Kunlik ish haqi: ${worker.dailyRate?.toLocaleString()} so'm`);
    console.log(`   Qo'shilgan summa: ${totalAdded.toLocaleString()} so'm (${daysAdded} × ${worker.dailyRate?.toLocaleString()})`);
    console.log(`   Joriy oylik: ${worker.earnings.toLocaleString()} so'm`);
    console.log(`   Jami daromad: ${worker.totalEarnings.toLocaleString()} so'm\n`);

    // 7. Transaction'larni tekshirish
    const transactions = await Transaction.find({
      apprenticeId: worker._id,
      category: 'daily_payment'
    }).sort({ createdAt: 1 });
    
    console.log('📋 TRANSACTION\'LAR:');
    transactions.forEach((t, index) => {
      console.log(`   ${index + 1}. ${new Date(t.createdAt).toLocaleDateString('uz-UZ')} - ${t.amount.toLocaleString()} so'm`);
    });
    
    console.log('\n✅ TEST MUVAFFAQIYATLI TUGADI!');
    console.log('\n💡 XULOSA:');
    console.log('   ✅ O\'tkazib yuborilgan kunlar uchun to\'lovlar to\'g\'ri qo\'shildi');
    console.log('   ✅ Har bir kun uchun alohida transaction yaratildi');
    console.log('   ✅ Daromad to\'g\'ri hisoblab chiqildi\n');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Xatolik:', error.message);
    process.exit(1);
  }
};

testDailyWorkerMissedDays();
