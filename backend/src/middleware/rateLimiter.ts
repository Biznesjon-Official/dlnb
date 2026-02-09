import rateLimit from 'express-rate-limit';

// General API rate limiter (yumshatilgan - PWA uchun)
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute (15 daqiqa emas)
  max: 500, // 1 daqiqada 500 ta so'rov (100 emas)
  message: 'Juda ko\'p so\'rov yuborildi, iltimos keyinroq urinib ko\'ring',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for authenticated users with valid tokens
  skip: (req) => {
    // Agar token bor bo'lsa, rate limit'ni skip qilish
    return !!req.headers.authorization;
  }
});

// Auth endpoints rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 5 dan 10 ga oshirdik
  message: 'Juda ko\'p kirish urinishi, 15 daqiqadan keyin urinib ko\'ring',
  skipSuccessfulRequests: true,
});

// AI endpoints rate limiter
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 10 dan 20 ga oshirdik
  message: 'AI so\'rovlar limiti tugadi, 1 daqiqadan keyin urinib ko\'ring',
});
