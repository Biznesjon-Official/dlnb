import { Response } from 'express';
import Task from '../models/Task';
import { AuthRequest } from '../middleware/auth';

/**
 * Mashina barcha ishlar tugaganda avtomatik tugatish funksiyasi
 * Bu funksiya ham vazifalar, ham xizmatlar tasdiqlanganda ishlaydi
 */
async function checkAndCompleteCarIfReady(carId: any) {
  try {
    const CarService = require('../models/CarService').default;
    
    // Barcha vazifalar va xizmatlarni tekshirish
    const allTasks = await Task.find({ car: carId });
    const allServices = await CarService.find({ car: carId });
    
    // Vazifalar holati: barcha vazifalar ko'rib chiqilgan va kamida bittasi tasdiqlangan
    const allTasksReviewed = allTasks.length === 0 || allTasks.every((t: any) => 
      t.status === 'approved' || t.status === 'rejected'
    );
    const hasApprovedTasks = allTasks.length === 0 || allTasks.some((t: any) => t.status === 'approved');
    
    // Xizmatlar holati: barcha xizmatlar tasdiqlangan
    const allServicesApproved = allServices.length === 0 || allServices.every((s: any) => 
      s.status === 'completed'
    );
    
    console.log(`🔍 Mashina holati tekshirilmoqda:`, {
      carId,
      tasksCount: allTasks.length,
      servicesCount: allServices.length,
      allTasksReviewed,
      hasApprovedTasks,
      allServicesApproved,
      taskStatuses: allTasks.map((t: any) => ({ id: t._id, status: t.status, title: t.title })),
      serviceStatuses: allServices.map((s: any) => ({ id: s._id, status: s.status }))
    });
    
    // Agar barcha ishlar tugagan bo'lsa
    if (allTasksReviewed && hasApprovedTasks && allServicesApproved) {
      const Car = require('../models/Car').default;
      const car = await Car.findById(carId);
      
      if (car && car.status !== 'completed') {
        console.log(`🎯 Barcha ishlar tugadi - mashina tugatilmoqda: ${car.licensePlate}`);
        
        // Mashina statusini completed ga o'zgartirish
        car.status = 'completed';
        
        // Qarz tekshirish va yaratish
        const totalAmount = car.totalEstimate || 0;
        const paidAmount = car.paidAmount || 0;
        const remainingAmount = totalAmount - paidAmount;

        if (remainingAmount > 0) {
          try {
            const debtService = require('../services/debtService').default;
            await debtService.createDebtForCompletedCar({
              carId: car._id,
              clientName: car.ownerName,
              clientPhone: car.ownerPhone,
              totalAmount,
              paidAmount,
              description: `${car.make} ${car.carModel} (${car.licensePlate}) - Avtomatik yaratilgan qarz (barcha ishlar tugadi)`,
              notes: 'Barcha ishlar tugaganda avtomatik yaratilgan qarz'
            });
          } catch (debtError) {
            console.error('❌ Qarz yaratishda xatolik:', debtError);
          }
        } else {
          console.log(`✅ Mashina to'liq to'langan holda tugatildi: ${car.licensePlate}`);
        }

        await car.save();
        console.log(`✅ Mashina avtomatik tugatildi: ${car.licensePlate} - ${car.ownerName}`);
        
        return { completed: true, car };
      }
    } else {
      console.log(`⏳ Mashina hali tugamagan: vazifalar=${allTasksReviewed}, xizmatlar=${allServicesApproved}`);
    }
    
    return { completed: false };
  } catch (error) {
    console.error('❌ Mashina tugatishda xatolik:', error);
    throw error;
  }
}

export const createTask = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      description, 
      assignedTo, // Bitta shogird (eski tizim)
      assignments, // Ko'p shogirdlar (yangi tizim)
      car, 
      service, 
      priority, 
      dueDate, 
      estimatedHours, 
      payment, 
      apprenticePercentage 
    } = req.body;

    console.log('📥 Vazifa yaratish so\'rovi:', {
      title,
      assignedTo,
      assignments,
      car,
      payment
    });

    const User = require('../models/User').default;

    const taskData: any = {
      title,
      assignedBy: req.user!._id,
      car,
      service,
      serviceItemId: service,
      priority,
      dueDate,
      estimatedHours,
      payment: payment || 0
    };

    // Description ixtiyoriy - faqat mavjud bo'lsa qo'shish
    if (description && description.trim()) {
      taskData.description = description;
    }

    // Yangi tizim: Ko'p shogirdlar
    if (assignments && Array.isArray(assignments) && assignments.length > 0) {
      console.log('👥 Ko\'p shogirdlar tizimi ishlatilmoqda:', assignments);
      
      const totalPayment = payment || 0;
      const apprenticeCount = assignments.length;
      const allocatedAmount = totalPayment / apprenticeCount; // Har biriga teng bo'lish

      // Har bir shogird uchun hisoblash
      const assignmentsWithPercentage = await Promise.all(
        assignments.map(async (assignment: any) => {
          if (!assignment.apprenticeId) {
            throw new Error('apprenticeId maydoni yo\'q');
          }
          
          // Shogirtning foizini User modelidan olish
          const apprentice = await User.findById(assignment.apprenticeId);
          if (!apprentice) {
            throw new Error(`Shogird topilmadi: ${assignment.apprenticeId}`);
          }
          
          const percentage = apprentice?.percentage || 50; // Agar foiz yo'q bo'lsa, default 50%
          
          const earning = (allocatedAmount * percentage) / 100;
          const masterShare = allocatedAmount - earning;

          console.log(`💰 Shogird ${apprentice?.name}: ${percentage}% = ${earning} so'm (jami: ${allocatedAmount})`);

          return {
            apprentice: assignment.apprenticeId,
            percentage,
            allocatedAmount,
            earning,
            masterShare
          };
        })
      );

      taskData.assignments = assignmentsWithPercentage;

      // Birinchi shogirdni assignedTo ga ham qo'yish (backward compatibility)
      taskData.assignedTo = assignments[0].apprenticeId;
    } 
    // Eski tizim: Bitta shogird
    else if (assignedTo) {
      console.log('👤 Bitta shogird tizimi ishlatilmoqda:', assignedTo);
      
      // Shogirtning foizini User modelidan olish
      const apprentice = await User.findById(assignedTo);
      if (!apprentice) {
        return res.status(400).json({ message: `Shogird topilmadi: ${assignedTo}` });
      }
      
      const percentage = apprentice?.percentage || 50; // Agar foiz yo'q bo'lsa, default 50%
      
      const apprenticeEarning = (payment * percentage) / 100;
      const masterEarning = payment - apprenticeEarning;

      console.log(`💰 Shogird ${apprentice?.name}: ${percentage}% = ${apprenticeEarning} so'm (jami: ${payment})`);

      taskData.assignedTo = assignedTo;
      taskData.apprenticePercentage = percentage;
      taskData.apprenticeEarning = apprenticeEarning;
      taskData.masterEarning = masterEarning;
    } else {
      return res.status(400).json({ message: 'Kamida bitta shogird tanlang (assignedTo yoki assignments)' });
    }

    const task = new Task(taskData);
    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service', 'assignments.apprentice']);

    // ✅ YANGI: Vazifa yaratilganda darhol shogirdga pul qo'shish
    console.log('💰 Vazifa yaratildi - darhol shogirdga pul qo\'shilmoqda...');
    
    // Yangi tizim: Ko'p shogirdlar
    if (taskData.assignments && taskData.assignments.length > 0) {
      console.log('👥 Ko\'p shogirdli tizim - Pul qo\'shilmoqda...');
      for (const assignment of taskData.assignments) {
        console.log(`  → Shogird ${assignment.apprentice} ga ${assignment.earning} so'm qo'shilmoqda`);
        const updatedUser = await User.findByIdAndUpdate(
          assignment.apprentice,
          { 
            $inc: { 
              earnings: assignment.earning
            } 
          },
          { new: true }
        );
        console.log(`  ✅ Yangilandi! Joriy oylik: ${updatedUser?.earnings}`);
      }
    } 
    // Eski tizim: Bitta shogird
    else if (taskData.assignedTo && taskData.apprenticeEarning) {
      console.log('👤 Bitta shogirdli tizim - Pul qo\'shilmoqda...');
      console.log(`  → Shogird ${taskData.assignedTo} ga ${taskData.apprenticeEarning} so'm qo'shilmoqda`);
      const updatedUser = await User.findByIdAndUpdate(
        taskData.assignedTo,
        { 
          $inc: { 
            earnings: taskData.apprenticeEarning
          } 
        },
        { new: true }
      );
      console.log(`  ✅ Yangilandi! Joriy oylik: ${updatedUser?.earnings}`);
    }

    console.log('✅ Vazifa muvaffaqiyatli yaratildi va pul qo\'shildi:', task._id);

    res.status(201).json({
      message: 'Task created successfully',
      task
    });
  } catch (error: any) {
    console.error('❌ Task yaratishda xatolik:', error);
    res.status(500).json({ 
      message: 'Vazifalarni yaratishda xatolik yuz berdi', 
      error: error.message,
      details: error.stack 
    });
  }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
  try {
    const { status, assignedTo, car } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (car) filter.car = car; // Mashina bo'yicha filtrlash

    // If user is apprentice, show tasks where they are assigned
    if (req.user!.role === 'apprentice') {
      filter.$or = [
        { assignedTo: req.user!._id }, // Eski tizim
        { 'assignments.apprentice': req.user!._id } // Yangi tizim
      ];
    } else if (assignedTo) {
      // Master filter qilganda
      filter.$or = [
        { assignedTo: assignedTo },
        { 'assignments.apprentice': assignedTo }
      ];
    }

    // ⚡ ULTRA FAST: Minimal populate - faqat kerakli maydonlar
    const tasks = await Task.find(filter)
      .select('+apprenticePercentage +apprenticeEarning +masterEarning') // Foiz va daromad maydonlarini qo'shish
      .populate('car', 'make carModel licensePlate ownerName') // Faqat mashina ma'lumotlari
      .populate('assignments.apprentice', 'name percentage') // Faqat ism va foiz
      .lean() // ⚡ Plain JS object - 2x tezroq
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('car')
      .populate('service', 'name price')
      .populate('assignments.apprentice', 'name email'); // Assignments'dagi shogirdlarni ham populate qilish

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if apprentice is trying to access someone else's task
    if (req.user!.role === 'apprentice') {
      const isAssigned = task.assignedTo?._id.toString() === req.user!._id.toString() ||
                        task.assignments?.some(a => a.apprentice._id.toString() === req.user!._id.toString());
      
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ task });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, 
      description, 
      assignedTo, 
      assignments, // Ko'p shogirdlar
      car, 
      service, 
      priority, 
      dueDate, 
      estimatedHours, 
      payment 
    } = req.body;
    
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Master can update any task, apprentice can only update their own tasks
    if (req.user!.role !== 'master') {
      const isAssignedOldSystem = task.assignedTo?.toString() === req.user!._id.toString();
      const isAssignedNewSystem = task.assignments?.some((a: any) => 
        a.apprentice.toString() === req.user!._id.toString()
      );
      
      if (!isAssignedOldSystem && !isAssignedNewSystem) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Update basic fields
    if (title) task.title = title;
    if (description !== undefined) {
      // Description ixtiyoriy - bo'sh string bo'lsa ham yangilash
      task.description = description;
    }
    if (car) task.car = car;
    if (service) task.service = service;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (estimatedHours) task.estimatedHours = estimatedHours;
    if (payment !== undefined) task.payment = payment;

    const User = require('../models/User').default;

    // Yangi tizim: Ko'p shogirdlar
    if (assignments && Array.isArray(assignments) && assignments.length > 0) {
      console.log('🔄 Shogirdlar o\'zgaryapti:', {
        oldAssignments: task.assignments?.map((a: any) => a.apprentice?.toString()),
        newAssignments: assignments.map((a: any) => a.apprenticeId)
      });

      const totalPayment = payment !== undefined ? payment : task.payment;
      const apprenticeCount = assignments.length;
      const allocatedAmount = totalPayment / apprenticeCount;

      // Har bir shogird uchun hisoblash
      const assignmentsWithPercentage = await Promise.all(
        assignments.map(async (assignment: any) => {
          // Agar apprenticeId berilgan bo'lsa, User modelidan foizni olish
          const apprentice = await User.findById(assignment.apprenticeId);
          const percentage = assignment.percentage || apprentice?.percentage || 50;
          
          const earning = (allocatedAmount * percentage) / 100;
          const masterShare = allocatedAmount - earning;

          console.log(`💰 UPDATE: Shogird ${apprentice?.name}: ${percentage}% = ${earning} so'm (jami: ${allocatedAmount})`);

          return {
            apprentice: assignment.apprenticeId,
            percentage,
            allocatedAmount,
            earning,
            masterShare
          };
        })
      );

      task.assignments = assignmentsWithPercentage;
      task.assignedTo = assignments[0].apprenticeId; // Backward compatibility
      
      console.log('✅ Assignments yangilandi:', assignmentsWithPercentage.map((a: any) => ({
        apprentice: a.apprentice.toString(),
        percentage: a.percentage
      })));
    } 
    // Eski tizim: Bitta shogird
    else if (assignedTo) {
      const apprentice = await User.findById(assignedTo);
      const percentage = apprentice?.percentage || 50;
      const totalPayment = payment !== undefined ? payment : task.payment;
      
      const apprenticeEarning = (totalPayment * percentage) / 100;
      const masterEarning = totalPayment - apprenticeEarning;

      console.log(`💰 UPDATE: Shogird ${apprentice?.name}: ${percentage}% = ${apprenticeEarning} so'm (jami: ${totalPayment})`);

      task.assignedTo = assignedTo;
      task.apprenticePercentage = percentage;
      task.apprenticeEarning = apprenticeEarning;
      task.masterEarning = masterEarning;
      
      console.log('✅ Bitta shogird yangilandi');
    }
    // Agar faqat payment o'zgargan bo'lsa va assignments mavjud bo'lsa
    else if (payment !== undefined && task.assignments && task.assignments.length > 0) {
      const apprenticeCount = task.assignments.length;
      const allocatedAmount = payment / apprenticeCount;

      // Mavjud assignments'ni yangilash
      const updatedAssignments = await Promise.all(
        task.assignments.map(async (assignment: any) => {
          const apprentice = await User.findById(assignment.apprentice);
          const percentage = assignment.percentage || apprentice?.percentage || 50;
          
          const earning = (allocatedAmount * percentage) / 100;
          const masterShare = allocatedAmount - earning;

          console.log(`💰 PAYMENT UPDATE: Shogird ${apprentice?.name}: ${percentage}% = ${earning} so'm (jami: ${allocatedAmount})`);

          return {
            apprentice: assignment.apprentice,
            percentage,
            allocatedAmount,
            earning,
            masterShare
          };
        })
      );

      task.assignments = updatedAssignments;
      console.log('✅ Payment o\'zgarganda assignments yangilandi');
    }
    // Agar faqat payment o'zgargan bo'lsa va bitta shogird bo'lsa
    else if (payment !== undefined && task.assignedTo) {
      const apprentice = await User.findById(task.assignedTo);
      const percentage = task.apprenticePercentage || apprentice?.percentage || 50;
      
      const apprenticeEarning = (payment * percentage) / 100;
      const masterEarning = payment - apprenticeEarning;

      console.log(`💰 PAYMENT UPDATE: Shogird ${apprentice?.name}: ${percentage}% = ${apprenticeEarning} so'm (jami: ${payment})`);

      task.apprenticePercentage = percentage;
      task.apprenticeEarning = apprenticeEarning;
      task.masterEarning = masterEarning;
      
      console.log('✅ Payment o\'zgarganda bitta shogird yangilandi');
    }

    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service', 'assignments.apprentice']);

    console.log('✅ Task muvaffaqiyatli yangilandi');

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error: any) {
    console.error('❌ Task yangilashda xatolik:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes, actualHours } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions - Yangi va eski tizim uchun
    if (req.user!.role === 'apprentice') {
      const isAssignedOldSystem = task.assignedTo?.toString() === req.user!._id.toString();
      const isAssignedNewSystem = task.assignments?.some((a: any) => 
        a.apprentice.toString() === req.user!._id.toString()
      );
      
      if (!isAssignedOldSystem && !isAssignedNewSystem) {
        console.log('❌ 403 Forbidden: Shogird bu vazifaga ruxsati yo\'q');
        console.log('User ID:', req.user!._id);
        console.log('Task assignedTo:', task.assignedTo);
        console.log('Task assignments:', task.assignments);
        return res.status(403).json({ message: 'Bu vazifaga ruxsatingiz yo\'q' });
      }
      console.log('✅ Ruxsat berildi: Shogird vazifani yangilashi mumkin');
    }

    task.status = status;
    if (notes) task.notes = notes;
    if (actualHours) task.actualHours = actualHours;

    if (status === 'completed') {
      task.completedAt = new Date();
      
      // Check if all tasks for this car service are completed
      const allTasks = await Task.find({ car: task.car });
      const allCompleted = allTasks.every(t => 
        t._id.toString() === task._id.toString() ? status === 'completed' : t.status === 'completed' || t.status === 'approved'
      );
      
      // If all tasks are completed, update car service status to ready-for-delivery
      if (allCompleted) {
        const CarService = require('../models/CarService').default;
        await CarService.findOneAndUpdate(
          { car: task.car },
          { status: 'ready-for-delivery' },
          { sort: { createdAt: -1 } } // Get the latest service
        );
      }
    }

    if (status === 'approved') {
      task.approvedAt = new Date();
    }

    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service']);

    res.json({
      message: 'Task updated successfully',
      task
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const approveTask = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 APPROVE TASK BOSHLANDI');
    console.log('Request body:', req.body);
    console.log('Task ID:', req.params.id);
    console.log('User:', req.user?.name, req.user?.role);
    
    const { approved, rejectionReason, serviceItemId } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      console.log('❌ Task topilmadi!');
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('📋 Task topildi:', {
      id: task._id,
      title: task.title,
      status: task.status,
      assignedTo: task.assignedTo,
      assignments: task.assignments,
      payment: task.payment,
      apprenticeEarning: task.apprenticeEarning,
      serviceItemId: task.serviceItemId
    });

    if (task.status !== 'completed') {
      console.log('❌ Task completed emas! Current status:', task.status);
      return res.status(400).json({ message: 'Task must be completed before approval' });
    }

    task.status = approved ? 'approved' : 'rejected';
    console.log('✏️ Status o\'zgartirildi:', task.status);
    
    if (approved) {
      task.approvedAt = new Date();
      console.log(`✅ Vazifa tasdiqlandi: ${task.title}`);
      
      // ⚠️ PUL QO'SHILMAYDI - Allaqachon createTask da qo'shilgan!
      console.log('ℹ️ Pul allaqachon vazifa yaratilganda qo\'shilgan, qayta qo\'shilmaydi.');

      // Barcha vazifalar va xizmatlar tasdiqlangan yoki yo'qligini tekshirish
      if (task.car) {
        console.log('🚗 Mashina holatini tekshirish...');
        const completionResult = await checkAndCompleteCarIfReady(task.car);
        
        await task.save();
        await task.populate(['assignedTo', 'assignedBy', 'car', 'service', 'assignments.apprentice']);
        
        console.log('✅ APPROVE TASK MUVAFFAQIYATLI YAKUNLANDI');
        
        // Response'ga mashina tugatilganligi haqida ma'lumot qo'shish
        return res.json({
          message: `Task ${approved ? 'approved' : 'rejected'} successfully`,
          task,
          carCompleted: completionResult.completed,
          carData: completionResult.car
        });
      }
    } else {
      console.log('❌ Vazifa rad etildi');
      task.rejectionReason = rejectionReason;
    }

    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service', 'assignments.apprentice']);

    console.log('✅ APPROVE TASK YAKUNLANDI');
    
    res.json({
      message: `Task ${approved ? 'approved' : 'rejected'} successfully`,
      task
    });
  } catch (error: any) {
    console.error('❌ APPROVE TASK XATOLIK:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTaskStats = async (req: AuthRequest, res: Response) => {
  try {
    const filter: any = {};
    
    // If apprentice, only their stats
    if (req.user!.role === 'apprentice') {
      filter.assignedTo = req.user!._id;
    }

    const stats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalEstimatedHours: { $sum: '$estimatedHours' },
          totalActualHours: { $sum: { $ifNull: ['$actualHours', 0] } }
        }
      }
    ]);

    const totalTasks = await Task.countDocuments(filter);

    res.json({
      stats,
      totalTasks
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const restartTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is rejected
    if (task.status !== 'rejected') {
      return res.status(400).json({ message: 'Only rejected tasks can be restarted' });
    }

    // Check permissions - Yangi va eski tizim uchun
    if (req.user!.role === 'apprentice') {
      const isAssignedOldSystem = task.assignedTo?.toString() === req.user!._id.toString();
      const isAssignedNewSystem = task.assignments?.some((a: any) => 
        a.apprentice.toString() === req.user!._id.toString()
      );
      
      if (!isAssignedOldSystem && !isAssignedNewSystem) {
        return res.status(403).json({ message: 'Bu vazifaga ruxsatingiz yo\'q' });
      }
    }

    // Reset task to assigned status
    task.status = 'assigned';
    task.rejectionReason = undefined;
    task.completedAt = undefined;
    task.actualHours = undefined;
    task.notes = undefined;

    await task.save();
    await task.populate(['assignedTo', 'assignedBy', 'car', 'service', 'assignments.apprentice']);

    res.json({
      message: 'Task restarted successfully',
      task
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Master can delete any task, apprentice can only delete their own tasks
    if (req.user!.role !== 'master') {
      const isAssignedOldSystem = task.assignedTo?.toString() === req.user!._id.toString();
      const isAssignedNewSystem = task.assignments?.some((a: any) => 
        a.apprentice.toString() === req.user!._id.toString()
      );
      
      if (!isAssignedOldSystem && !isAssignedNewSystem) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Task deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};