import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/biznes';
    
    console.log('🔄 MongoDB ga ulanish boshlandi...');
    
    // ⚡ ULTRA FAST CONNECTION: Optimized settings
    await mongoose.connect(mongoUri, {
      maxPoolSize: 50,        // Connection pool (default: 100, optimal: 50)
      minPoolSize: 10,        // Minimum connections
      socketTimeoutMS: 45000, // Socket timeout (45s)
      serverSelectionTimeoutMS: 5000, // Server selection timeout (5s)
      family: 4,              // IPv4 (tezroq)
    });
    
    // ⚡ QUERY OPTIMIZATION: Global settings
    mongoose.set('strictQuery', false);
    mongoose.set('autoIndex', false); // Production'da false (tezroq)
    
    console.log('✅ MongoDB ga muvaffaqiyatli ulandi!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    console.log(`⚡ Connection pool: 10-50 connections`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});