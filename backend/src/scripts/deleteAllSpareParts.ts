import mongoose from 'mongoose';
import SparePart from '../models/SparePart';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const deleteAllSpareParts = async () => {
  try {
    console.log('🔄 MongoDB ga ulanish...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI as string);
    
    console.log('✅ MongoDB ga ulandi!');
    console.log('📊 Database:', mongoose.connection.db?.databaseName || 'Unknown');
    
    // Barcha tovarlarni sanash
    const count = await SparePart.countDocuments();
    console.log(`📦 Jami tovarlar soni: ${count}`);
    
    if (count === 0) {
      console.log('⚠️ O\'chiriladigan tovarlar yo\'q!');
      process.exit(0);
    }
    
    // Tasdiqlash
    console.log('\n⚠️⚠️⚠️ OGOHLANTIRISH ⚠️⚠️⚠️');
    console.log(`Siz ${count} ta tovarni o'chirmoqchisiz!`);
    console.log('Bu amalni ortga qaytarib bo\'lmaydi!');
    console.log('\n5 soniya kutilmoqda...\n');
    
    // 5 soniya kutish
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Barcha tovarlarni o'chirish
    console.log('🗑️ Tovarlar o\'chirilmoqda...');
    const result = await SparePart.deleteMany({});
    
    console.log(`✅ ${result.deletedCount} ta tovar o'chirildi!`);
    console.log('✅ Barcha tovarlar muvaffaqiyatli o\'chirildi!');
    
    // Disconnect
    await mongoose.disconnect();
    console.log('👋 MongoDB dan uzildi');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Xatolik:', error.message);
    process.exit(1);
  }
};

// Run the script
deleteAllSpareParts();
