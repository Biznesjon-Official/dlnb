import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Transaction from '../models/Transaction';
import { connectDatabase } from '../config/database';

dotenv.config();

const seedDailyWorker = async () => {
  try {
    console.log('🌱 Kunlik ishchi yaratish boshlandi...\n');

    await connectDatabase();

    // 1. Master'ni topish
    const master = await User.findOne({ role: 'master' });
    if (!master) {
      console.error('❌ Master topilmadi! Avval master yarating.');
      process.exit(1);
    }
    console.log('✅ Master topildi:', master.name);

    // 2. Eski kunlik ishchini o'chirish (agar mavjud bo'lsa)
    const existingWorker = await User.findOne({ username: 'kunlik_ishchi' });
    if (existingWorker) {
      await User.deleteOne({ _id: existingWorker._id });
      console.log('🗑️  Eski kunlik ishchi o\'chirildi');
    }

    // 3. Yangi kunlik ishchi yaratish
    const dailyWorkerData = {
      name: 'Kunlik Ishchi Test',
      username: 'kunlik_ishchi',
      email: 'kunlik@test.com',
      phone: '998901234567',
      password: '998901234567',
      role: 'apprentice',
      paymentType: 'daily',
      dailyRate: 100000,
      profession: 'Yordamchi',
      experience: 1,
      earnings: 0,
      totalEarnings: 0
    };

    console.log('\n📝 Yaratilayotgan ma\'lumotlar:');
    console.log(JSON.stringify(dailyWorkerData, null, 2));

    const dailyWorker = new User(dailyWorkerData);
    await dailyWorker.save();

    console.log('\n✅ Kunlik ishchi yaratildi!');
    console.log('─────────────────────────────────────');
    console.log('ID:', dailyWorker._id);
    console.log('Ism:', dailyWorker.name);
    console.log('Username:', dailyWorker.username);
    console.log('To\'lov turi:', dailyWorker.paymentType);
    console.log('Kunlik ish haqi:', dailyWorker.dailyRate?.toLocaleString(), 'so\'m');
    console.log('Foiz:', dailyWorker.percentage || 'yo\'q');
    console.log('Joriy daromad:', dailyWorker.earnings?.toLocaleString(), 'so\'m');
    console.log('─────────────────────────────────────\n');

    // 4. Foizli ishchi ham yaratish (taqqoslash uchun)
    const existingPercentageWorker = await User.findOne({ username: 'foizli_ishchi' });
    if (existingPercentageWorker) {
      await User.deleteOne({ _id: existingPercentageWorker._id });
      console.log('🗑️  Eski foizli ishchi o\'chirildi');
    }

    const percentageWorkerData = {
      name: 'Foizli Ishchi Test',
      username: 'foizli_ishchi',
      email: 'foizli@test.com',
      phone: '998907654321',
      password: '998907654321',
      role: 'apprentice',
      paymentType: 'percentage',
      percentage: 50,
      profession: 'Mexanik',
      experience: 3,
      earnings: 0,
      totalEarnings: 0
    };

    const percentageWorker = new User(percentageWorkerData);
    await percentageWorker.save();

    console.log('✅ Foizli ishchi yaratildi!');
    console.log('─────────────────────────────────────');
    console.log('ID:', percentageWorker._id);
    console.log('Ism:', percentageWorker.name);
    console.log('Username:', percentageWorker.username);
    console.log('To\'lov turi:', percentageWorker.paymentType);
    console.log('Foiz:', percentageWorker.percentage + '%');
    console.log('Kunlik ish haqi:', percentageWorker.dailyRate || 'yo\'q');
    console.log('Joriy daromad:', percentageWorker.earnings?.toLocaleString(), 'so\'m');
    console.log('─────────────────────────────────────\n');

    // 5. Kunlik ishchiga qo'lda to'lov qo'shish (test uchun)
    console.log('💰 Kunlik ishchiga to\'lov qo\'shilmoqda...\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Transaction yaratish
    const transaction = new Transaction({
      type: 'income',
      category: 'daily_payment',
      amount: dailyWorker.dailyRate,
      description: `${dailyWorker.name} - kunlik to'lov (${today.toLocaleDateString('uz-UZ')})`,
      apprenticeId: dailyWorker._id,
      createdBy: master._id,
      date: today,
      paymentMethod: 'cash'
    });
    await transaction.save();

    // Daromadni yangilash
    dailyWorker.earnings = (dailyWorker.earnings || 0) + (dailyWorker.dailyRate || 0);
    dailyWorker.totalEarnings = (dailyWorker.totalEarnings || 0) + (dailyWorker.dailyRate || 0);
    dailyWorker.lastDailyPaymentDate = today;
    await dailyWorker.save();

    console.log('✅ To\'lov qo\'shildi!');
    console.log('─────────────────────────────────────');
    console.log('Transaction ID:', transaction._id);
    console.log('Summa:', transaction.amount.toLocaleString(), 'so\'m');
    console.log('Yangi daromad:', dailyWorker.earnings?.toLocaleString(), 'so\'m');
    console.log('Oxirgi to\'lov sanasi:', dailyWorker.lastDailyPaymentDate?.toLocaleDateString('uz-UZ'));
    console.log('─────────────────────────────────────\n');

    // 6. Ma'lumotlarni tekshirish
    console.log('🔍 Ma\'lumotlarni tekshirish...\n');

    const savedDailyWorker = await User.findById(dailyWorker._id);
    const savedPercentageWorker = await User.findById(percentageWorker._id);

    console.log('📊 KUNLIK ISHCHI (Database):');
    console.log('─────────────────────────────────────');
    console.log('paymentType:', savedDailyWorker?.paymentType);
    console.log('dailyRate:', savedDailyWorker?.dailyRate);
    console.log('percentage:', savedDailyWorker?.percentage);
    console.log('earnings:', savedDailyWorker?.earnings);
    console.log('totalEarnings:', savedDailyWorker?.totalEarnings);
    console.log('lastDailyPaymentDate:', savedDailyWorker?.lastDailyPaymentDate);
    console.log('─────────────────────────────────────\n');

    console.log('📊 FOIZLI ISHCHI (Database):');
    console.log('─────────────────────────────────────');
    console.log('paymentType:', savedPercentageWorker?.paymentType);
    console.log('dailyRate:', savedPercentageWorker?.dailyRate);
    console.log('percentage:', savedPercentageWorker?.percentage);
    console.log('earnings:', savedPercentageWorker?.earnings);
    console.log('totalEarnings:', savedPercentageWorker?.totalEarnings);
    console.log('─────────────────────────────────────\n');

    // 7. Transactionlarni tekshirish
    const transactions = await Transaction.find({ apprenticeId: dailyWorker._id });
    console.log('📝 Transactionlar soni:', transactions.length);
    if (transactions.length > 0) {
      console.log('Oxirgi transaction:', {
        type: transactions[0].type,
        category: transactions[0].category,
        amount: transactions[0].amount,
        description: transactions[0].description
      });
    }

    console.log('\n✨ Seed muvaffaqiyatli yakunlandi!\n');
    console.log('📌 Login ma\'lumotlari:');
    console.log('─────────────────────────────────────');
    console.log('Kunlik ishchi:');
    console.log('  Username: kunlik_ishchi');
    console.log('  Password: 998901234567');
    console.log('');
    console.log('Foizli ishchi:');
    console.log('  Username: foizli_ishchi');
    console.log('  Password: 998907654321');
    console.log('─────────────────────────────────────\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Xatolik:', error.message);
    console.error(error);
    process.exit(1);
  }
};

seedDailyWorker();
