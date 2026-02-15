import mongoose from 'mongoose';
import User from '../models/User';
import ExpenseCategory from '../models/ExpenseCategory';
import dotenv from 'dotenv';

// .env faylini yuklash
dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/biznes';

async function seedMaster() {
  try {
    console.log('🔄 Ma\'lumotlar bazasiga ulanmoqda...');
    
    // MongoDB ga ulanish
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Ma\'lumotlar bazasiga muvaffaqiyatli ulandi');

    // Mavjud master userlarni o'chirish
    console.log('🗑️ Mavjud master userlarni o\'chirmoqda...');
    await User.deleteMany({ role: 'master' });

    // Yangi master user yaratish
    console.log('👤 Yangi master user yaratmoqda...');
    
    const masterUser = new User({
      name: 'Subhonov Mirshod',
      username: 'Subhonov Mirshod',
      password: '0303', // Bu avtomatik hash qilinadi
      role: 'master',
      email: 'subhonov.mirshod@biznes.com',
      earnings: 0
    });

    await masterUser.save();
    console.log('✅ Master user muvaffaqiyatli yaratildi!');

    // Asosiy xarajat kategoriyalarini yaratish
    console.log('📊 Asosiy xarajat kategoriyalarini yaratmoqda...');
    
    await ExpenseCategory.deleteMany({}); // Mavjudlarini o'chirish
    
    const categories = [
      { 
        name: 'Salary', 
        nameUz: 'Maosh', 
        description: 'Xodimlar maoshi', 
        icon: 'Users', 
        color: 'blue', 
        isDefault: true,
        createdBy: masterUser._id 
      },
      { 
        name: 'Rent', 
        nameUz: 'Ijara', 
        description: 'Bino va jihozlar ijarasi', 
        icon: 'Building', 
        color: 'green', 
        isDefault: true,
        createdBy: masterUser._id 
      },
      { 
        name: 'Utilities', 
        nameUz: 'Kommunal', 
        description: 'Elektr, gaz, suv to\'lovlari', 
        icon: 'Zap', 
        color: 'yellow', 
        isDefault: true,
        createdBy: masterUser._id 
      },
      { 
        name: 'Spare Parts', 
        nameUz: 'Zapchastlar', 
        description: 'Avtomobil zapchastlari', 
        icon: 'Package', 
        color: 'purple', 
        isDefault: true,
        createdBy: masterUser._id 
      },
      { 
        name: 'Other', 
        nameUz: 'Boshqa', 
        description: 'Boshqa xarajatlar', 
        icon: 'DollarSign', 
        color: 'gray', 
        isDefault: true,
        createdBy: masterUser._id 
      }
    ];

    await ExpenseCategory.insertMany(categories);
    console.log('✅ Xarajat kategoriyalari yaratildi!');

    // Login ma'lumotlarini ko'rsatish
    console.log('');
    console.log('🎉 SEED MUVAFFAQIYATLI YAKUNLANDI!');
    console.log('');
    console.log('📋 LOGIN MA\'LUMOTLARI:');
    console.log('   👤 Username: Subhonov Mirshod');
    console.log('   🔑 Password: 0303');
    console.log('   🎭 Role: master');
    console.log('   📧 Email: subhonov.mirshod@biznes.com');
    console.log('');
    console.log('💡 Bu ma\'lumotlar bilan tizimga kirishingiz mumkin!');

  } catch (error) {
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
  seedMaster();
}

export default seedMaster;