import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

// .env faylini yuklash
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/biznes';

async function createSecondMaster() {
  try {
    console.log('🔄 Ma\'lumotlar bazasiga ulanmoqda...');
    
    // MongoDB ga ulanish
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Ma\'lumotlar bazasiga muvaffaqiyatli ulandi');

    // Mavjud 2-ustoz borligini tekshirish
    console.log('🔍 Mavjud 2-ustoz borligini tekshirmoqda...');
    const existingSecondMaster = await User.findOne({ 
      username: 'Qurbonov Dilshod',
      role: 'master' 
    });
    
    if (existingSecondMaster) {
      console.log('⚠️ 2-ustoz allaqachon mavjud!');
      console.log('📝 Mavjud ma\'lumotlar:');
      console.log('   👤 Ism:', existingSecondMaster.name);
      console.log('   👤 Username:', existingSecondMaster.username);
      console.log('   📧 Email:', existingSecondMaster.email);
      console.log('');
      console.log('💡 Agar yangilash kerak bo\'lsa, avval o\'chirib keyin qayta yarating.');
      return;
    }

    // Yangi 2-ustoz yaratish
    console.log('👤 Yangi 2-ustoz yaratmoqda...');
    
    const secondMaster = new User({
      name: 'Qurbonov Dilshod',
      username: 'Qurbonov Dilshod',
      password: '5808', // Bu avtomatik hash qilinadi
      role: 'master',
      email: 'qurbonov.dilshod@biznes.com',
      earnings: 0
    });

    await secondMaster.save();
    console.log('✅ 2-ustoz muvaffaqiyatli yaratildi!');

    // Login ma'lumotlarini ko'rsatish
    console.log('');
    console.log('🎉 2-USTOZ MUVAFFAQIYATLI YARATILDI!');
    console.log('');
    console.log('📋 LOGIN MA\'LUMOTLARI:');
    console.log('   👤 Username: Qurbonov Dilshod');
    console.log('   🔑 Password: 5808');
    console.log('   🎭 Role: master');
    console.log('   📧 Email: qurbonov.dilshod@biznes.com');
    console.log('');
    console.log('💡 Bu ma\'lumotlar bilan tizimga kirishingiz mumkin!');
    console.log('');
    console.log('✅ 1-ustoz (Subhonov Mirshod) o\'chmasligi ta\'minlandi!');

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
  createSecondMaster();
}

export default createSecondMaster;
