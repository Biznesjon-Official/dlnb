import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SparePart from '../models/SparePart';

dotenv.config();

const checkSparePartImages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('✅ MongoDB connected');

    const spareParts = await SparePart.find({ isActive: true }).limit(10);
    
    console.log('\n📦 Zapchastlar:');
    spareParts.forEach((part, index) => {
      console.log(`\n${index + 1}. ${part.name}`);
      console.log(`   ID: ${part._id}`);
      console.log(`   imageUrl: ${part.imageUrl || 'YO\'Q'}`);
      console.log(`   Miqdor: ${part.quantity}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkSparePartImages();
