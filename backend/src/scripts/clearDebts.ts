import mongoose from 'mongoose';
import Debt from '../models/Debt';
import dotenv from 'dotenv';

// .env faylini yuklash
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/biznes';

async function clearDebts() {
  try {
    console.log('🔄 Ma\'lumotlar bazasiga ulanmoqda...');
    
    // MongoDB ga ulanish
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Ma\'lumotlar bazasiga muvaffaqiyatli ulandi');

    // Qarzlar sonini ko'rish
    const debtCount = await Debt.countDocuments();
    console.log(`📊 Jami qarzlar soni: ${debtCount}`);

    if (debtCount === 0) {
      console.log('⚠️ Qarzlar topilmadi!');
      return;
    }

    // Tasdiqlash
    console.log('');
    console.log('⚠️  DIQQAT: Barcha qarzlar o\'chiriladi!');
    console.log('');

    // Barcha qarzlarni o'chirish
    console.log('🗑️  Qarzlar o\'chirilmoqda...');
    const result = await Debt.deleteMany({});
    
    console.log('');
    console.log('✅ QARZLAR MUVAFFAQIYATLI O\'CHIRILDI!');
    console.log(`📊 O'chirilgan qarzlar soni: ${result.deletedCount}`);
    console.log('');

  } catch (error: any) {
    console.error('❌ Xatolik yuz berdi:', error);
  } finally {
    // Ma'lumotlar bazasi ulanishini yopish
    await mongoose.disconnect();
    console.log('🔌 Ma\'lumotlar bazasi ulanishi yopildi');
    process.exit(0);
  }
}

// Skriptni ishga tushirish
if (require.main === module) {
  clearDebts();
}

export default clearDebts;
