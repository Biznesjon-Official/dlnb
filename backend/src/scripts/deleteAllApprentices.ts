import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const deleteAllApprentices = async () => {
  try {
    // MongoDB'ga ulanish
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ MongoDB connected');

    // Barcha shogirdlarni topish
    const apprentices = await User.find({ role: 'apprentice' });
    console.log(`📋 Topilgan shogirdlar: ${apprentices.length} ta`);

    if (apprentices.length === 0) {
      console.log('ℹ️ O\'chiradigan shogird yo\'q');
      process.exit(0);
    }

    // Tasdiqlash
    console.log('\n⚠️ OGOHLANTIRISH: Barcha shogirdlar o\'chiriladi!');
    console.log('Shogirdlar ro\'yxati:');
    apprentices.forEach((app, index) => {
      console.log(`${index + 1}. ${app.name} (@${app.username}) - ${app.phone || 'telefon yo\'q'}`);
    });

    // Barcha shogirdlarni o'chirish
    const result = await User.deleteMany({ role: 'apprentice' });
    console.log(`\n✅ ${result.deletedCount} ta shogird o'chirildi`);

    // Shogirdlarga tegishli vazifalarni ham o'chirish
    const Task = require('../models/Task').default;
    const taskResult = await Task.deleteMany({ 
      assignedTo: { $in: apprentices.map(a => a._id) } 
    });
    console.log(`✅ ${taskResult.deletedCount} ta vazifa o'chirildi`);

    console.log('\n✨ Barcha shogirdlar va ularning vazifalari o\'chirildi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

deleteAllApprentices();
