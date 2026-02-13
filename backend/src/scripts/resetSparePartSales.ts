/**
 * Reset Spare Part Sales Script
 * 
 * Bu skript barcha zapchast sotuvlar tarixini o'chiradi
 * va statistikani 0 ga qaytaradi
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// SparePartSale model
const sparePartSaleSchema = new mongoose.Schema({
  sparePart: { type: mongoose.Schema.Types.ObjectId, ref: 'SparePart', required: true },
  quantity: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  totalRevenue: { type: Number, required: true },
  profit: { type: Number, required: true },
  customerName: { type: String },
  customerPhone: { type: String },
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  soldAt: { type: Date, default: Date.now }
});

const SparePartSale = mongoose.model('SparePartSale', sparePartSaleSchema);

async function resetSparePartSales() {
  try {
    console.log('🔌 MongoDB\'ga ulanmoqda...');
    
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/dalnoboy-shop';
    await mongoose.connect(mongoUri);
    
    console.log('✅ MongoDB\'ga muvaffaqiyatli ulandi');
    console.log('📊 Hozirgi statistika:');
    
    // Hozirgi statistikani ko'rsatish
    const totalSales = await SparePartSale.countDocuments();
    const salesData = await SparePartSale.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalRevenue: { $sum: '$totalRevenue' },
          totalProfit: { $sum: '$profit' }
        }
      }
    ]);
    
    if (salesData.length > 0) {
      console.log(`   - Jami sotuvlar: ${totalSales}`);
      console.log(`   - Jami miqdor: ${salesData[0].totalQuantity}`);
      console.log(`   - Jami tushum: ${salesData[0].totalRevenue.toLocaleString()} so'm`);
      console.log(`   - Jami foyda: ${salesData[0].totalProfit.toLocaleString()} so'm`);
    } else {
      console.log('   - Hech qanday sotuv yo\'q');
    }
    
    console.log('\n🗑️  Barcha sotuvlarni o\'chirmoqda...');
    
    // Barcha sotuvlarni o'chirish
    const result = await SparePartSale.deleteMany({});
    
    console.log(`✅ ${result.deletedCount} ta sotuv muvaffaqiyatli o'chirildi`);
    console.log('✅ Statistika 0 ga qaytarildi');
    
    console.log('\n📊 Yangi statistika:');
    const newTotalSales = await SparePartSale.countDocuments();
    console.log(`   - Jami sotuvlar: ${newTotalSales}`);
    console.log(`   - Jami tushum: 0 so'm`);
    console.log(`   - Jami foyda: 0 so'm`);
    
  } catch (error) {
    console.error('❌ Xatolik yuz berdi:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB\'dan uzildi');
    process.exit(0);
  }
}

// Skriptni ishga tushirish
resetSparePartSales();
