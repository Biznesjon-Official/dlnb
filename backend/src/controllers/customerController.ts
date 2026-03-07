import { Response } from 'express';
import Customer from '../models/Customer';
import Car from '../models/Car';
import Debt from '../models/Debt';
import { AuthRequest } from '../middleware/auth';

// Barcha mijozlarni olish
export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.user?.clientId;

    console.log('🔍 Get customers request:', { 
      userId: req.user?._id, 
      clientId,
      hasUser: !!req.user 
    });

    if (!clientId) {
      console.log('❌ Client ID topilmadi:', req.user);
      return res.status(400).json({ message: 'Client ID topilmadi' });
    }

    const customers = await Customer.find({ clientId })
      .sort({ lastVisit: -1 })
      .lean();

    // Har bir mijoz uchun mashinalar ma'lumotini qo'shish
    const customersWithCars = await Promise.all(
      customers.map(async (customer) => {
        // Mijozning barcha mashinalarini olish
        const cars = await Car.find({
          ownerPhone: customer.phone,
        })
          .select('make carModel licensePlate year createdAt')
          .sort({ createdAt: -1 })
          .lean();

        return {
          ...customer,
          cars: cars.map((car) => ({
            make: car.make,
            model: car.carModel,
            licensePlate: car.licensePlate,
            year: car.year,
            createdAt: car.createdAt,
          })),
        };
      })
    );

    console.log(`✅ ${customersWithCars.length} ta mijoz topildi (mashinalar bilan)`);
    res.json(customersWithCars);
  } catch (error) {
    console.error('❌ Get customers error:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Bitta mijozni olish (detalli)
export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const clientId = req.user?.clientId;

    if (!clientId) {
      return res.status(400).json({ message: 'Client ID topilmadi' });
    }

    const customer = await Customer.findOne({ _id: id, clientId });

    if (!customer) {
      return res.status(404).json({ message: 'Mijoz topilmadi' });
    }

    // Mijozning barcha mashinalarini olish (arxivlanganlar ham — tarix uchun)
    const cars = await Car.find({
      ownerPhone: customer.phone,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Mijozning barcha qarzlarini olish (creditorPhone ishlatiladi)
    const debts = await Debt.find({
      creditorPhone: customer.phone,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      customer,
      cars,
      debts,
    });
  } catch (error) {
    console.error('❌ Get customer by ID error:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
};

// Mijozlar statistikasi
export const getCustomersStats = async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.user?.clientId;

    if (!clientId) {
      return res.status(400).json({ message: 'Client ID topilmadi' });
    }

    const totalCustomers = await Customer.countDocuments({ clientId });
    const customersWithDebt = await Customer.countDocuments({
      clientId,
      totalDebt: { $gt: 0 },
    });
    const customersWithCars = await Customer.countDocuments({
      clientId,
      carsCount: { $gt: 0 },
    });

    const totalDebtResult = await Customer.aggregate([
      { $match: { clientId } },
      { $group: { _id: null, total: { $sum: '$totalDebt' } } },
    ]);

    const totalPaidResult = await Customer.aggregate([
      { $match: { clientId } },
      { $group: { _id: null, total: { $sum: '$totalPaid' } } },
    ]);

    res.json({
      totalCustomers,
      customersWithDebt,
      customersWithCars,
      totalDebt: totalDebtResult[0]?.total || 0,
      totalPaid: totalPaidResult[0]?.total || 0,
    });
  } catch (error) {
    console.error('❌ Get customers stats error:', error);
    res.status(500).json({ message: 'Server xatosi' });
  }
};
