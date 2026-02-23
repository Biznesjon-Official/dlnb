import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { setupSecurity } from './middleware/security';
import { apiLimiter } from './middleware/rateLimiter';

// Load environment variables FIRST
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import carRoutes from './routes/cars';
import carServiceRoutes from './routes/carServices';
import debtRoutes from './routes/debts';
import aiRoutes from './routes/ai';
import chatRoutes from './routes/chat';
import knowledgeBaseRoutes from './routes/knowledgeBase';
import statsRoutes from './routes/stats';
import telegramRoutes from './routes/telegram';
import installRoutes from './routes/install';
import sparePartRoutes from './routes/spareParts';
import serviceRoutes from './routes/services';
import transactionRoutes from './routes/transactions';
import expenseCategoryRoutes from './routes/expenseCategories';
import bookingRoutes from './routes/bookings';
import smsRoutes from './routes/smsRoutes';
import customerRoutes from './routes/customers';

// Initialize Telegram Service (must be after dotenv.config())
// Only initialize if Telegram tokens are provided and NOT in development mode
if (process.env.NODE_ENV !== 'development' && (process.env.TELEGRAM_BOT_TOKEN_CAR || process.env.TELEGRAM_BOT_TOKEN_DEBT)) {
  try {
    require('./services/telegramService');
  } catch (error) {
    console.error('⚠️ Telegram service initialization failed:', error);
  }
}

// Initialize Warehouse Bot (Ombor uchun)
// Only in production to avoid conflicts with VPS
if (process.env.NODE_ENV !== 'development' && process.env.TELEGRAM_BOT_TOKEN_WAREHOUSE) {
  try {
    const { initializeWarehouseBot } = require('./services/warehouseBotService');
    initializeWarehouseBot();
  } catch (error) {
    console.error('⚠️ Warehouse bot initialization failed:', error);
  }
} else if (process.env.NODE_ENV === 'development') {
  console.log('ℹ️ Telegram bot\'lar development muhitida o\'chirilgan (VPS bilan konflikt oldini olish uchun)');
}

// Initialize Monthly Reset Cron Job
import { startMonthlyResetJob } from './services/monthlyResetService';
startMonthlyResetJob();

// Initialize Daily Payment Cron Job
import { startDailyPaymentCron } from './services/dailyPaymentService';
startDailyPaymentCron();

const app = express();
const PORT = Number(process.env.PORT) || 4000;

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const envOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || [];
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5177',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5177',
      ...envOrigins
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Trust proxy (for Nginx reverse proxy)
app.set('trust proxy', 1);

// Middleware
app.use(cors(corsOptions));

// Compression middleware - JSON response'larni siqish (gzip)
app.use(compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6 // Compression level (0-9, 6 optimal)
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - rasmlar uchun
import path from 'path';
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Security middleware (production only)
if (process.env.NODE_ENV === 'production') {
  setupSecurity(app);
  app.use('/api/', apiLimiter);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/car-services', carServiceRoutes);
app.use('/api/debts', debtRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeBaseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/install', installRoutes);
app.use('/api/spare-parts', sparePartRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/customers', customerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Car Repair Workshop API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check HEAD method (for connection testing)
app.head('/api/health', (req, res) => {
  res.status(200).end();
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global server instance for graceful shutdown
let server: any = null;

// Graceful shutdown handler
const gracefulShutdown = async (_signal: string) => {
  if (server) {
    server.close(async () => {
      try {
        const mongoose = await import('mongoose');
        await mongoose.default.connection.close();
      } catch (error) {
        // Silent error handling
      }
      process.exit(0);
    });

    setTimeout(() => {
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

// Handle uncaught errors
process.on('uncaughtException', (error: any) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: any) => {
  console.error('❌ Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    
    // Bind to 127.0.0.1 for development (Windows compatible)
    // Use 0.0.0.0 only in production (Docker/VPS)
    const HOST = process.env.HOST || '127.0.0.1';
    
    server = app.listen(PORT, HOST, () => {
      console.log('🚀 Server ishga tushdi!');
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 Host: ${HOST}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/api`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      console.error('❌ Server error:', error.message);
      process.exit(1);
    });

    // Set keep-alive timeout for production
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

  } catch (error: any) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

startServer();

