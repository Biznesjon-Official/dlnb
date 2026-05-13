/**
 * Backfill Customers — eski Car va Debt yozuvlaridan Customer collection'ni to'ldiradi.
 *
 * Idempotent: qayta ishga tushirilsa duplicate yaratmaydi (telefon bo'yicha topadi va yangilaydi).
 *
 * Ishlatish:
 *   npx ts-node src/scripts/backfillCustomers.ts            # haqiqiy ishlash
 *   npx ts-node src/scripts/backfillCustomers.ts --dry-run  # faqat preview
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Car from '../models/Car';
import Debt from '../models/Debt';
import Customer from '../models/Customer';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

interface CustomerAccumulator {
  name: string;
  phone: string;
  carsCount: number;
  lastVisit: Date;
}

async function backfillCustomers() {
  console.log(DRY_RUN ? '🔍 DRY-RUN rejimi — hech narsa yozilmaydi' : '✍️  HAQIQIY rejim — DB yoziladi');
  console.log('🔌 MongoDB ga ulanmoqda...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/biznes');
  console.log('✅ Ulandi\n');

  // 1. Mashinalardan unique ownerPhone bo'yicha guruh
  console.log('📊 Mashinalardan ma\'lumot yig\'ilmoqda...');
  const cars = await Car.find({}, { ownerName: 1, ownerPhone: 1, createdAt: 1, isDeleted: 1 }).lean();
  console.log(`   ${cars.length} ta mashina topildi`);

  const phoneMap = new Map<string, CustomerAccumulator>();
  for (const car of cars) {
    if (!car.ownerPhone || !car.ownerName) continue;
    const phone = car.ownerPhone.trim();
    if (!phone) continue;

    const carCreatedAt = car.createdAt instanceof Date ? car.createdAt : new Date(car.createdAt as unknown as string);
    const existing = phoneMap.get(phone);
    if (existing) {
      existing.carsCount += 1;
      if (carCreatedAt > existing.lastVisit) existing.lastVisit = carCreatedAt;
    } else {
      phoneMap.set(phone, {
        name: car.ownerName.trim(),
        phone,
        carsCount: 1,
        lastVisit: carCreatedAt,
      });
    }
  }
  console.log(`   ${phoneMap.size} ta unique telefon raqami topildi\n`);

  // 2. Har bir telefon uchun faol qarzlarni hisoblash
  console.log('💰 Qarzlar hisoblanmoqda...');
  const debtAgg = await Debt.aggregate([
    { $match: { type: 'receivable', status: { $in: ['pending', 'partial'] } } },
    {
      $group: {
        _id: '$creditorPhone',
        totalDebt: {
          $sum: { $subtract: ['$amount', { $ifNull: ['$paidAmount', 0] }] },
        },
      },
    },
  ]);
  const paidAgg = await Debt.aggregate([
    { $match: { type: 'receivable' } },
    {
      $group: {
        _id: '$creditorPhone',
        totalPaid: { $sum: { $ifNull: ['$paidAmount', 0] } },
      },
    },
  ]);
  const debtMap = new Map<string, number>();
  debtAgg.forEach((d: { _id: string; totalDebt: number }) => {
    if (d._id) debtMap.set(d._id.trim(), d.totalDebt || 0);
  });
  const paidMap = new Map<string, number>();
  paidAgg.forEach((d: { _id: string; totalPaid: number }) => {
    if (d._id) paidMap.set(d._id.trim(), d.totalPaid || 0);
  });
  console.log(`   ${debtMap.size} ta telefon faol qarzga ega\n`);

  // 3. Mavjud customer'larni yuklash (duplicate'larni oldini olish)
  const existingCustomers = await Customer.find({}, { phone: 1, _id: 1 }).lean();
  const existingPhones = new Set(existingCustomers.map((c: { phone: string }) => c.phone.trim()));
  console.log(`📚 Hozir ${existingCustomers.length} ta Customer mavjud\n`);

  // 4. Upsert har bir telefon uchun
  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const [phone, info] of phoneMap.entries()) {
    const totalDebt = debtMap.get(phone) || 0;
    const totalPaid = paidMap.get(phone) || 0;
    const wasExisting = existingPhones.has(phone);

    if (DRY_RUN) {
      console.log(
        `  ${wasExisting ? '🔄 UPDATE' : '➕ CREATE'} | ${info.name.padEnd(25)} | ${phone.padEnd(20)} | ${info.carsCount} mashina | qarz: ${totalDebt}`
      );
      if (wasExisting) updated++;
      else created++;
      continue;
    }

    const result = await Customer.findOneAndUpdate(
      { phone },
      {
        $set: {
          name: info.name,
          carsCount: info.carsCount,
          totalDebt,
          totalPaid,
          lastVisit: info.lastVisit,
        },
        $setOnInsert: { phone },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!wasExisting) {
      created++;
      console.log(`  ➕ ${result.name} - ${phone} (${info.carsCount} mashina, qarz: ${totalDebt})`);
    } else {
      updated++;
    }
  }

  // 5. Mashinalarda ko'rinmaydigan eski customer'lar (orphan)
  for (const c of existingCustomers) {
    if (!phoneMap.has(c.phone.trim())) {
      unchanged++;
    }
  }

  console.log('\n📈 Yakuniy hisobot:');
  console.log(`   ➕ Yangi yaratildi: ${created}`);
  console.log(`   🔄 Yangilandi:      ${updated}`);
  console.log(`   ⏸️  Tegmagan:        ${unchanged} (mashinada uchramaydigan eski customer'lar)`);

  if (DRY_RUN) {
    console.log('\n💡 Dry-run yakunlandi. Haqiqiy ishlatish uchun --dry-run flag\'sini olib tashlang.');
  } else {
    const finalCount = await Customer.countDocuments();
    console.log(`\n✅ Backfill tugadi. Endi Customer collection'da ${finalCount} ta yozuv bor.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

backfillCustomers().catch((err) => {
  console.error('❌ Backfill xatosi:', err);
  process.exit(1);
});
