import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import { randomUUID } from 'crypto';

dotenv.config();

const addClientIdToUsers = async () => {
  try {
    console.log('🔄 MongoDB ga ulanish...');
    await mongoose.connect(process.env.MONGO_URI!);
    console.log('✅ MongoDB ga ulandi');

    // clientId yo'q userlarni topish
    const usersWithoutClientId = await User.find({ 
      $or: [
        { clientId: { $exists: false } },
        { clientId: null },
        { clientId: '' }
      ]
    });

    console.log(`📊 ${usersWithoutClientId.length} ta user topildi (clientId yo'q)`);

    for (const user of usersWithoutClientId) {
      const clientId = randomUUID();
      user.clientId = clientId;
      await user.save();
      console.log(`✅ User yangilandi: ${user.name} - clientId: ${clientId}`);
    }

    console.log('✅ Barcha userlar yangilandi!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Xatolik:', error);
    process.exit(1);
  }
};

addClientIdToUsers();
