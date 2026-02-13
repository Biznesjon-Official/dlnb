import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/dalnoboy-shop';

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  role: String,
  phone: String,
  percentage: Number,
  earnings: Number,
  profession: String,
  experience: Number,
  profileImage: String,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);

async function updateMasterPasswords() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Master 1: Subhonov Mirshod
    const master1Username = 'Subhonov Mirshod';
    const master1Password = '0303';
    const hashedPassword1 = await bcrypt.hash(master1Password, 10);

    const master1 = await User.findOne({ username: master1Username, role: 'master' });
    
    if (master1) {
      master1.password = hashedPassword1;
      master1.name = 'Subhonov Mirshod';
      await master1.save();
      console.log(`✅ Master 1 yangilandi: ${master1Username}`);
      console.log(`   Username: ${master1Username}`);
      console.log(`   Parol: ${master1Password}`);
    } else {
      // Agar yo'q bo'lsa, yangi yaratish
      const newMaster1 = new User({
        name: 'Subhonov Mirshod',
        username: master1Username,
        password: hashedPassword1,
        role: 'master',
        phone: '+998901234567',
        percentage: 100,
        earnings: 0,
        profession: 'Ustoz',
        experience: 10,
        profileImage: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newMaster1.save();
      console.log(`✅ Master 1 yaratildi: ${master1Username}`);
      console.log(`   Username: ${master1Username}`);
      console.log(`   Parol: ${master1Password}`);
    }

    // Master 2: Qurbonov Dilshod
    const master2Username = 'Qurbonov Dilshod';
    const master2Password = '5808';
    const hashedPassword2 = await bcrypt.hash(master2Password, 10);

    const master2 = await User.findOne({ username: master2Username, role: 'master' });
    
    if (master2) {
      master2.password = hashedPassword2;
      master2.name = 'Qurbonov Dilshod';
      await master2.save();
      console.log(`✅ Master 2 yangilandi: ${master2Username}`);
      console.log(`   Username: ${master2Username}`);
      console.log(`   Parol: ${master2Password}`);
    } else {
      // Agar yo'q bo'lsa, yangi yaratish
      const newMaster2 = new User({
        name: 'Qurbonov Dilshod',
        username: master2Username,
        password: hashedPassword2,
        role: 'master',
        phone: '+998901234568',
        percentage: 100,
        earnings: 0,
        profession: 'Ustoz',
        experience: 10,
        profileImage: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newMaster2.save();
      console.log(`✅ Master 2 yaratildi: ${master2Username}`);
      console.log(`   Username: ${master2Username}`);
      console.log(`   Parol: ${master2Password}`);
    }

    console.log('\n✅ Barcha masterlar muvaffaqiyatli yangilandi!');
    console.log('\n📋 Login ma\'lumotlari:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Master 1:');
    console.log(`  Username: ${master1Username}`);
    console.log(`  Parol: ${master1Password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Master 2:');
    console.log(`  Username: ${master2Username}`);
    console.log(`  Parol: ${master2Password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Xatolik:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB bilan aloqa uzildi');
    process.exit(0);
  }
}

// Run the script
updateMasterPasswords();
