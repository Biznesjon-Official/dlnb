import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, username, password, phone, percentage, role, profileImage, profession, experience, paymentType, dailyRate } = req.body;

    // Validation: name va username majburiy
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Ism kiritilishi shart' });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({ message: 'Username kiritilishi shart' });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ message: 'Parol kamida 4 ta belgidan iborat bo\'lishi kerak' });
    }

    const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu username allaqachon band' });
    }

    if (email && email.trim()) {
      const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ message: 'Bu email allaqachon band' });
      }
    }

    // Phone validation
    let phoneDigits: string | undefined;
    if (phone && phone.trim()) {
      phoneDigits = phone.trim().replace(/\D/g, ''); // Faqat raqamlar
      const existingPhone = await User.findOne({ phone: phoneDigits });
      if (existingPhone) {
        return res.status(400).json({ message: 'Bu telefon raqam allaqachon band' });
      }
    }

    const userData: any = {
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password,
      role: role || 'apprentice'
    };

    // Email faqat mavjud bo'lsa qo'shish
    if (email && email.trim()) {
      userData.email = email.trim().toLowerCase();
    }

    // Phone faqat mavjud bo'lsa qo'shish
    if (phoneDigits) {
      userData.phone = phoneDigits;
    }

    if (profileImage) userData.profileImage = profileImage;
    if (profession) userData.profession = profession;
    if (experience !== undefined) userData.experience = experience;

    // To'lov turi bo'yicha
    if (paymentType) {
      userData.paymentType = paymentType;

      if (paymentType === 'percentage') {
        if (percentage !== undefined) {
          userData.percentage = percentage;
        }
      } else if (paymentType === 'daily') {
        userData.dailyRate = dailyRate || 0;
      }
    } else {
      userData.paymentType = 'percentage';
      if (percentage !== undefined) {
        userData.percentage = percentage;
      }
    }

    const user = new User(userData);
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRY || '7d' } as any
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        percentage: user.percentage,
        paymentType: user.paymentType,
        dailyRate: user.dailyRate,
        role: user.role,
        earnings: user.earnings || 0,
        totalEarnings: user.totalEarnings || 0,
        profileImage: user.profileImage,
        profession: user.profession,
        experience: user.experience,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error: any) {
    console.error('❌ Register error:', error);

    // MongoDB validation xatoliklarini aniqroq ko'rsatish
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }

    // Duplicate key xatoligi
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `Bu ${field} allaqachon band` });
    }

    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { username, email, password, phone } = req.body;

    // Agar telefon raqam berilgan bo'lsa (shogirtlar uchun - username va telefon raqam)
    if (phone) {
      if (!username) {
        return res.status(400).json({ message: 'Username kiritilishi kerak' });
      }

      // Telefon raqamni tozalash (faqat raqamlar)
      const phoneDigits = phone.trim().replace(/\D/g, '');

      // Username va telefon raqam bilan kirish
      const user = await User.findOne({ 
        username: username,
        phone: phoneDigits
      });
      
      if (!user) {
        return res.status(400).json({ message: 'Username yoki telefon raqam noto\'g\'ri' });
      }

      // Faqat shogirtlar telefon raqam bilan kira oladi
      if (user.role !== 'apprentice') {
        return res.status(400).json({ message: 'Bu ma\'lumotlar bilan kirish mumkin emas' });
      }

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRY || '7d' } as any
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          phone: user.phone,
          percentage: user.percentage,
          role: user.role,
          earnings: user.earnings || 0,
          totalEarnings: user.totalEarnings || 0,
          profileImage: user.profileImage,
          profession: user.profession,
          experience: user.experience,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }

    // Username/email bilan kirish (ustoz uchun)
    const loginField = username || email;
    if (!loginField) {
      return res.status(400).json({ message: 'Username, email yoki telefon raqam kerak' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Parol kerak' });
    }

    const user = await User.findOne({
      $or: [
        { username: loginField },
        { email: loginField }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'Login yoki parol noto\'g\'ri' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Login yoki parol noto\'g\'ri' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRY || '7d' } as any
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        percentage: user.percentage,
        role: user.role,
        earnings: user.earnings || 0,
        totalEarnings: user.totalEarnings || 0,
        profileImage: user.profileImage,
        profession: user.profession,
        experience: user.experience,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        phone: user.phone,
        percentage: user.percentage,
        role: user.role,
        earnings: user.earnings || 0,
        totalEarnings: user.totalEarnings || 0,
        profileImage: user.profileImage,
        profession: user.profession,
        experience: user.experience,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error: any) {
    console.error('getProfile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.query;
    const filter: any = {};
    
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).select('-password');
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getApprentices = async (req: AuthRequest, res: Response) => {
  try {
    const apprentices = await User.find({ role: 'apprentice' }).select('-password');
    res.json({ apprentices });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Ustoz o'zi qo'shgan shogirdlarni olish
export const getMyApprentices = async (req: AuthRequest, res: Response) => {
  try {
    const masterId = req.user!._id;
    
    // Faqat shu ustoz qo'shgan shogirdlarni topish
    const apprentices = await User.find({ 
      role: 'apprentice',
      masterId: masterId 
    }).select('-password').lean();
    
    res.json({ apprentices });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Ustoz o'zi qo'shgan shogirdlarni statistika bilan olish
export const getMyApprenticesWithStats = async (req: AuthRequest, res: Response) => {
  try {
    const masterId = req.user!._id;
    const Task = require('../models/Task').default;
    
    // Faqat shu ustoz qo'shgan shogirdlarni topish
    const apprentices = await User.find({ 
      role: 'apprentice',
      masterId: masterId 
    }).select('-password').lean();
    
    // Har bir shogird uchun statistika hisoblash
    const apprenticesWithStats = await Promise.all(
      apprentices.map(async (apprentice) => {
        const tasks = await Task.find({ assignedTo: apprentice._id });
        
        const stats = {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: any) => t.status === 'completed' || t.status === 'approved').length,
          approvedTasks: tasks.filter((t: any) => t.status === 'approved').length,
          inProgressTasks: tasks.filter((t: any) => t.status === 'in-progress').length,
          assignedTasks: tasks.filter((t: any) => t.status === 'assigned').length,
          rejectedTasks: tasks.filter((t: any) => t.status === 'rejected').length,
          performance: tasks.length > 0 
            ? Math.round((tasks.filter((t: any) => t.status === 'approved').length / tasks.length) * 100)
            : 0,
          awards: tasks.filter((t: any) => t.status === 'approved').length
        };
        
        return {
          ...apprentice,
          stats
        };
      })
    );
    
    res.json({ users: apprenticesWithStats });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getApprenticesWithStats = async (req: AuthRequest, res: Response) => {
  try {
    const Task = require('../models/Task').default;
    
    // Shogirtlarni olish
    const apprentices = await User.find({ role: 'apprentice' })
      .select('_id name username email phone percentage earnings totalEarnings profileImage profession experience paymentType dailyRate lastDailyPaymentDate createdAt')
      .lean()
      .exec();
    
    if (apprentices.length === 0) {
      return res.json({ users: [] });
    }
    
    const apprenticeIds = apprentices.map(a => a._id);
    
    // MongoDB Aggregation - super tez!
    const taskStats = await Task.aggregate([
      {
        $match: {
          $or: [
            { assignedTo: { $in: apprenticeIds } },
            { 'assignments.apprentice': { $in: apprenticeIds } }
          ]
        }
      },
      {
        $project: {
          apprenticeId: {
            $cond: {
              if: { $ifNull: ['$assignedTo', false] },
              then: '$assignedTo',
              else: { $arrayElemAt: ['$assignments.apprentice', 0] }
            }
          },
          status: 1
        }
      },
      {
        $group: {
          _id: '$apprenticeId',
          totalTasks: { $sum: 1 },
          approvedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          completedTasks: {
            $sum: { 
              $cond: [
                { $in: ['$status', ['completed', 'approved']] }, 
                1, 
                0
              ] 
            }
          },
          inProgressTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          assignedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] }
          },
          rejectedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]).exec();
    
    // Map'ga o'tkazish - O(1) qidiruv
    const statsMap = new Map();
    for (const stat of taskStats) {
      const performance = stat.totalTasks > 0 
        ? Math.round((stat.approvedTasks / stat.totalTasks) * 100)
        : 0;
      
      statsMap.set(stat._id.toString(), {
        totalTasks: stat.totalTasks,
        completedTasks: stat.completedTasks,
        approvedTasks: stat.approvedTasks,
        inProgressTasks: stat.inProgressTasks,
        assignedTasks: stat.assignedTasks,
        rejectedTasks: stat.rejectedTasks,
        performance,
        awards: stat.approvedTasks
      });
    }
    
    // Shogirtlar bilan birlashtirish
    const apprenticesWithStats = apprentices.map((apprentice) => ({
      ...apprentice,
      stats: statsMap.get(apprentice._id.toString()) || {
        totalTasks: 0,
        completedTasks: 0,
        approvedTasks: 0,
        inProgressTasks: 0,
        assignedTasks: 0,
        rejectedTasks: 0,
        performance: 0,
        awards: 0
      }
    }));
    
    res.json({ users: apprenticesWithStats });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, username, password, phone, percentage, profileImage, profession, experience, paymentType, dailyRate } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username is taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Check if phone is taken by another user
    if (phone && phone !== user.phone) {
      const phoneDigits = phone.trim().replace(/\D/g, ''); // Faqat raqamlar
      const existingPhone = await User.findOne({ phone: phoneDigits });
      if (existingPhone && existingPhone._id.toString() !== id) {
        return res.status(400).json({ message: 'Bu telefon raqam allaqachon band' });
      }
      user.phone = phoneDigits; // Faqat raqamlarni saqlash
    }

    // Update fields
    if (name) user.name = name;
    if (username) user.username = username;
    if (password) user.password = password;
    // phone allaqachon yuqorida yangilangan
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (profession !== undefined) user.profession = profession;
    if (experience !== undefined) user.experience = experience;

    // To'lov turi bo'yicha yangilash
    if (paymentType) {
      user.paymentType = paymentType;
      
      if (paymentType === 'percentage') {
        // Foizli ishchi
        if (percentage !== undefined) {
          user.percentage = percentage;
        }
        user.dailyRate = undefined; // Kunlik ish haqini tozalash
        user.lastDailyPaymentDate = undefined;
      } else if (paymentType === 'daily') {
        // Kunlik ishchi
        if (dailyRate !== undefined) {
          user.dailyRate = dailyRate;
        }
        user.percentage = undefined; // Foizni tozalash
      }
    } else {
      // Agar paymentType berilmagan bo'lsa, faqat percentage yoki dailyRate yangilash
      if (percentage !== undefined) user.percentage = percentage;
      if (dailyRate !== undefined) user.dailyRate = dailyRate;
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        percentage: user.percentage,
        paymentType: user.paymentType,
        dailyRate: user.dailyRate,
        role: user.role,
        profileImage: user.profileImage,
        profession: user.profession,
        experience: user.experience
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete all tasks assigned to this user
    const Task = require('../models/Task').default;
    await Task.deleteMany({ assignedTo: id });

    // Delete user
    await User.findByIdAndDelete(id);

    res.json({ message: 'User and related tasks deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


