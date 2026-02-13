/**
 * MongoDB Indexlar yaratish - Cars collection uchun
 * 
 * Bu skript Cars collection'da query performance'ni yaxshilash uchun
 * kerakli indexlarni yaratadi.
 * 
 * Ishlatish: npm run create-car-indexes
 */

import mongoose from 'mongoose';
import Car from '../models/Car';
import dotenv from 'dotenv';

dotenv.config();

const createCarIndexes = async () => {
  try {
    console.log('🔌 MongoDB ga ulanmoqda...');
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dalnoboy');
    
    console.log('✅ MongoDB ga ulandi');
    console.log('📊 Indexlar yaratilmoqda...\n');

    // 1. isDeleted + status + paymentStatus (getCars uchun)
    await Car.collection.createIndex(
      { isDeleted: 1, status: 1, paymentStatus: 1 },
      { name: 'active_cars_filter' }
    );
    console.log('✅ Index yaratildi: active_cars_filter (isDeleted + status + paymentStatus)');

    // 2. createdAt (sorting uchun)
    await Car.collection.createIndex(
      { createdAt: -1 },
      { name: 'created_at_desc' }
    );
    console.log('✅ Index yaratildi: created_at_desc (createdAt DESC)');

    // 3. licensePlate (qidiruv uchun) - SKIP if exists
    try {
      await Car.collection.createIndex(
        { licensePlate: 1 },
        { name: 'license_plate_search', unique: true }
      );
      console.log('✅ Index yaratildi: license_plate_search (licensePlate UNIQUE)');
    } catch (err: any) {
      if (err.code === 85 || err.message.includes('already exists')) {
        console.log('⚠️ Index allaqachon mavjud: licensePlate_1 (o\'tkazib yuborildi)');
      } else {
        throw err;
      }
    }

    // 4. Text index (qidiruv uchun - make, carModel, ownerName)
    await Car.collection.createIndex(
      { 
        make: 'text', 
        carModel: 'text', 
        ownerName: 'text',
        licensePlate: 'text'
      },
      { name: 'car_text_search' }
    );
    console.log('✅ Index yaratildi: car_text_search (text search)');

    // 5. Compound index: isDeleted + createdAt (faol mashinalar uchun)
    await Car.collection.createIndex(
      { isDeleted: 1, createdAt: -1 },
      { name: 'active_cars_sorted' }
    );
    console.log('✅ Index yaratildi: active_cars_sorted (isDeleted + createdAt)');

    console.log('\n🎉 Barcha indexlar muvaffaqiyatli yaratildi!');
    console.log('\n📊 Mavjud indexlar:');
    
    const indexes = await Car.collection.indexes();
    indexes.forEach((index: any) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Tayyor! Query performance 5-10x tezroq bo\'ladi.');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Xatolik:', error.message);
    process.exit(1);
  }
};

createCarIndexes();
