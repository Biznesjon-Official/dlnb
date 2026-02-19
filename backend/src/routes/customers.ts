import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCustomers,
  getCustomerById,
  getCustomersStats,
} from '../controllers/customerController';

const router = express.Router();

// Barcha route'lar authenticate qilingan
router.use(authenticate);

// GET /api/customers - Barcha mijozlar
router.get('/', getCustomers);

// GET /api/customers/stats - Statistika
router.get('/stats', getCustomersStats);

// GET /api/customers/:id - Bitta mijoz
router.get('/:id', getCustomerById);

export default router;
