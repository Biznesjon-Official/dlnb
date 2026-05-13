import cron from 'node-cron';
import User from '../models/User';
import Transaction from '../models/Transaction';
import MonthlyHistory from '../models/MonthlyHistory';
import Task from '../models/Task';
import ExpenseCategory from '../models/ExpenseCategory';

/**
 * Har oyning 1-sanasida soat 00:00 da barcha foydalanuvchilarning
 * joriy daromadini (earnings) 0 ga qaytaradi va tarixga saqlaydi
 */
export const startMonthlyResetJob = () => {
  // Har oyning 1-sanasida soat 00:00 da ishga tushadi
  cron.schedule('0 0 1 * *', async () => {
    try {
      console.log('🔄 Oylik avtomatik reset boshlandi:', new Date().toISOString());
      
      const users = await User.find({});
      const masterUser = users.find(u => u.role === 'master');
      
      await saveMonthlyHistoryAndReset(masterUser?._id);
      
    } catch (error) {
      console.error('❌ Oylik avtomatik reset xatosi:', error);
    }
  }, {
    timezone: 'Asia/Tashkent'
  });
  
  console.log('✅ Oylik reset cron job ishga tushdi (har oyning 1-sanasida soat 00:00)');
};

/**
 * Oylik tarixni saqlash va resetlash
 */
async function saveMonthlyHistoryAndReset(resetBy: any) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // 1. Hozirgi oy statistikasini olish
  const monthStart = new Date(currentYear, now.getMonth(), 1);
  const monthEnd = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59);
  
  const transactions = await Transaction.find({
    createdAt: {
      $gte: monthStart,
      $lte: monthEnd
    }
  })
    .populate('categoryId', 'nameUz name')
    .populate('apprenticeId', 'name')
    .populate('createdBy', 'name');

  // Statistikani hisoblash
  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCash = 0;
  let incomeCard = 0;
  let expenseCash = 0;
  let expenseCard = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  // Kategoriyalar bo'yicha aggregate
  const catMap = new Map<string, { type: 'income' | 'expense'; amount: number; count: number }>();
  const transactionSnapshots: any[] = [];

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
      incomeCount++;
      if (t.paymentMethod === 'cash') incomeCash += t.amount;
      else if (t.paymentMethod === 'card') incomeCard += t.amount;
    } else {
      totalExpense += t.amount;
      expenseCount++;
      if (t.paymentMethod === 'cash') expenseCash += t.amount;
      else if (t.paymentMethod === 'card') expenseCard += t.amount;
    }

    const catObj: any = t.categoryId;
    const categoryName = catObj?.nameUz || catObj?.name || (t.type === 'income' ? 'Boshqa kirim' : 'Boshqa chiqim');
    const catKey = `${t.type}:${categoryName}`;
    const cur = catMap.get(catKey) || { type: t.type as 'income' | 'expense', amount: 0, count: 0 };
    cur.amount += t.amount;
    cur.count += 1;
    catMap.set(catKey, cur);

    const apprenticeObj: any = t.apprenticeId;
    const createdByObj: any = t.createdBy;
    transactionSnapshots.push({
      type: t.type,
      amount: t.amount,
      paymentMethod: t.paymentMethod,
      description: t.description,
      categoryName,
      relatedType: t.relatedTo?.type,
      relatedLicensePlate: undefined, // Kerak bo'lsa keyinroq Car'dan olib qo'shamiz
      relatedOwnerName: undefined,
      apprenticeName: apprenticeObj?.name,
      createdByName: createdByObj?.name,
      createdAt: t.createdAt,
    });
  }

  const categoriesBreakdown = Array.from(catMap.entries()).map(([key, val]) => ({
    categoryName: key.split(':')[1],
    type: val.type,
    amount: val.amount,
    count: val.count,
  }));

  const balance = totalIncome - totalExpense;
  const balanceCash = incomeCash - expenseCash;
  const balanceCard = incomeCard - expenseCard;

  // 2. Barcha foydalanuvchilar va ularning ish tarixi
  const users = await User.find({});
  const userEarnings = await Promise.all(users.map(async (user) => {
    let tasks: any[] = [];
    let taskCount = 0;
    if (user.role === 'apprentice') {
      const userTasks = await Task.find({
        $or: [
          { assignedTo: user._id },
          { 'assignments.apprentice': user._id }
        ],
        status: { $in: ['approved', 'completed'] },
        updatedAt: { $gte: monthStart, $lte: monthEnd }
      }).populate('car', 'licensePlate ownerName');
      taskCount = userTasks.length;
      tasks = userTasks.map(t => {
        const car: any = t.car;
        const assignment = t.assignments?.find((a: any) =>
          a.apprentice?.toString() === user._id.toString()
        );
        return {
          title: t.title,
          carLicensePlate: car?.licensePlate,
          carOwnerName: car?.ownerName,
          payment: t.payment || 0,
          apprenticeEarning: assignment?.earning || t.apprenticeEarning || 0,
          completedAt: t.completedAt || t.updatedAt,
        };
      });
    }
    return {
      userId: user._id,
      name: user.name,
      role: user.role,
      earnings: user.earnings,
      taskCount,
      tasks,
    };
  }));

  // 3. Tarixga saqlash — to'liq snapshot bilan
  const history = new MonthlyHistory({
    month: currentMonth,
    year: currentYear,
    totalIncome,
    totalExpense,
    balance,
    incomeCash,
    incomeCard,
    expenseCash,
    expenseCard,
    balanceCash,
    balanceCard,
    incomeCount,
    expenseCount,
    transactionCount: transactions.length,
    userEarnings,
    hasDetailedSnapshot: true,
    transactions: transactionSnapshots,
    categoriesBreakdown,
    resetDate: now,
    resetBy: resetBy
  });
  
  await history.save();
  console.log(`📊 Tarix saqlandi: ${currentMonth}/${currentYear}`);
  
  // 4. ✨ YANGI: Joriy oy transaksiyalarini o'chirish
  const deleteResult = await Transaction.deleteMany({
    createdAt: {
      $gte: monthStart,
      $lte: monthEnd
    }
  });
  console.log(`🗑️ ${deleteResult.deletedCount} ta transaksiya o'chirildi`);
  
  // 5. Barcha foydalanuvchilarning daromadlarini 0 ga qaytarish
  let resetCount = 0;
  for (const user of users) {
    if (user.earnings > 0) {
      user.totalEarnings += user.earnings;
      const oldEarnings = user.earnings;
      user.earnings = 0;
      await user.save();
      
      console.log(`✅ ${user.name}: ${oldEarnings} so'm → 0 so'm (Jami: ${user.totalEarnings} so'm)`);
      resetCount++;
    }
  }
  
  console.log(`✅ Reset tugadi. ${resetCount} ta foydalanuvchi yangilandi.`);
  
  return {
    success: true,
    resetCount,
    deletedTransactions: deleteResult.deletedCount,
    history: {
      month: currentMonth,
      year: currentYear,
      totalIncome,
      totalExpense,
      balance,
      userCount: userEarnings.length
    }
  };
}

/**
 * Qo'lda reset qilish uchun funksiya
 */
export const manualMonthlyReset = async (resetBy: any) => {
  try {
    console.log('🔄 Qo\'lda oylik reset boshlandi:', new Date().toISOString());
    
    const result = await saveMonthlyHistoryAndReset(resetBy);
    
    return result;
  } catch (error) {
    console.error('❌ Qo\'lda reset xatosi:', error);
    throw error;
  }
};

/**
 * Oylik tarixni olish
 */
export const getMonthlyHistory = async (limit: number = 12) => {
  try {
    const history = await MonthlyHistory.find()
      .sort({ year: -1, month: -1 })
      .limit(limit)
      .populate('resetBy', 'name email');
    
    return history;
  } catch (error: any) {
    console.error('❌ Tarixni olishda xatolik:', error);
    throw error;
  }
};

/**
 * Ma'lum oy tarixini olish.
 * Agar shu oy uchun MonthlyHistory mavjud bo'lsa — uni qaytaradi (snapshot bilan).
 * Agar yo'q va bu joriy oy bo'lsa — Transaction'lardan real-time hisoblanadi.
 * Eski oy uchun MonthlyHistory yo'q bo'lsa — null qaytaradi.
 */
export const getMonthHistory = async (year: number, month: number) => {
  try {
    const history = await MonthlyHistory.findOne({ year, month })
      .populate('resetBy', 'name email')
      .populate('userEarnings.userId', 'name email role');

    if (history) return history;

    // Joriy oy uchun real-time tarix
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    if (year === currentYear && month === currentMonth) {
      return await buildLiveMonthDetail(year, month);
    }

    return null;
  } catch (error: any) {
    console.error('❌ Oy tarixini olishda xatolik:', error);
    throw error;
  }
};

/**
 * Joriy oy yoki tahlil uchun "live" oy snapshot'ini Transaction/Task'lardan hisoblaydi.
 * MonthlyHistory yozuvi yaratmaydi — faqat o'qish uchun.
 */
async function buildLiveMonthDetail(year: number, month: number) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);

  const transactions = await Transaction.find({
    createdAt: { $gte: monthStart, $lte: monthEnd }
  })
    .populate('categoryId', 'nameUz name')
    .populate('apprenticeId', 'name')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCash = 0;
  let incomeCard = 0;
  let expenseCash = 0;
  let expenseCard = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  const catMap = new Map<string, { type: 'income' | 'expense'; amount: number; count: number }>();
  const txSnapshots: any[] = [];

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
      incomeCount++;
      if (t.paymentMethod === 'cash') incomeCash += t.amount;
      else if (t.paymentMethod === 'card') incomeCard += t.amount;
    } else {
      totalExpense += t.amount;
      expenseCount++;
      if (t.paymentMethod === 'cash') expenseCash += t.amount;
      else if (t.paymentMethod === 'card') expenseCard += t.amount;
    }

    const catObj: any = t.categoryId;
    const categoryName = catObj?.nameUz || catObj?.name || (t.type === 'income' ? 'Boshqa kirim' : 'Boshqa chiqim');
    const catKey = `${t.type}:${categoryName}`;
    const cur = catMap.get(catKey) || { type: t.type as 'income' | 'expense', amount: 0, count: 0 };
    cur.amount += t.amount;
    cur.count += 1;
    catMap.set(catKey, cur);

    const apprenticeObj: any = t.apprenticeId;
    const createdByObj: any = t.createdBy;
    txSnapshots.push({
      type: t.type,
      amount: t.amount,
      paymentMethod: t.paymentMethod,
      description: t.description,
      categoryName,
      relatedType: t.relatedTo?.type,
      apprenticeName: apprenticeObj?.name,
      createdByName: createdByObj?.name,
      createdAt: t.createdAt,
    });
  }

  const categoriesBreakdown = Array.from(catMap.entries()).map(([key, val]) => ({
    categoryName: key.split(':')[1],
    type: val.type,
    amount: val.amount,
    count: val.count,
  }));

  const users = await User.find({});
  const userEarnings = await Promise.all(users.map(async (user) => {
    let tasks: any[] = [];
    let taskCount = 0;
    if (user.role === 'apprentice') {
      const userTasks = await Task.find({
        $or: [
          { assignedTo: user._id },
          { 'assignments.apprentice': user._id }
        ],
        status: { $in: ['approved', 'completed'] },
        updatedAt: { $gte: monthStart, $lte: monthEnd }
      }).populate('car', 'licensePlate ownerName').sort({ updatedAt: -1 });
      taskCount = userTasks.length;
      tasks = userTasks.map(t => {
        const car: any = t.car;
        const assignment = t.assignments?.find((a: any) =>
          a.apprentice?.toString() === user._id.toString()
        );
        return {
          title: t.title,
          carLicensePlate: car?.licensePlate,
          carOwnerName: car?.ownerName,
          payment: t.payment || 0,
          apprenticeEarning: assignment?.earning || t.apprenticeEarning || 0,
          completedAt: t.completedAt || t.updatedAt,
        };
      });
    }
    return {
      userId: user._id,
      name: user.name,
      role: user.role,
      earnings: user.earnings,
      taskCount,
      tasks,
    };
  }));

  // MongoDB hujjati emas, frontend uchun mos shaklda qaytaradi
  return {
    _id: null,
    month,
    year,
    isLive: true, // Joriy oy — hali reset bo'lmagan
    hasDetailedSnapshot: true,
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    incomeCash,
    incomeCard,
    expenseCash,
    expenseCard,
    balanceCash: incomeCash - expenseCash,
    balanceCard: incomeCard - expenseCard,
    incomeCount,
    expenseCount,
    transactionCount: transactions.length,
    userEarnings,
    transactions: txSnapshots,
    categoriesBreakdown,
    resetDate: null,
    resetBy: null,
  };
}

/**
 * Berilgan foydalanuvchi uchun oxirgi N oyga daromad tarixini olish.
 * MonthlyHistory yozuvlarini + joriy oyni live hisoblash bilan birlashtiradi.
 */
export const getUserMonthlyEarnings = async (userId: string, limit: number = 12) => {
  const histories = await MonthlyHistory.find({ 'userEarnings.userId': userId })
    .sort({ year: -1, month: -1 })
    .limit(limit)
    .lean();

  const result = histories.map((h: any) => {
    const ue = (h.userEarnings || []).find((u: any) => String(u.userId) === String(userId));
    return {
      month: h.month,
      year: h.year,
      earnings: ue?.earnings || 0,
      taskCount: ue?.taskCount || 0,
      tasks: ue?.tasks || [],
      hasDetailedSnapshot: h.hasDetailedSnapshot,
      isLive: false,
    };
  });

  // Joriy oy uchun live data (agar MonthlyHistory hali yo'q bo'lsa)
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const hasCurrentInHistory = result.some(r => r.year === currentYear && r.month === currentMonth);

  if (!hasCurrentInHistory) {
    const live = await buildLiveMonthDetail(currentYear, currentMonth);
    const liveUserData = (live.userEarnings || []).find((u: any) => String(u.userId) === String(userId));
    if (liveUserData) {
      result.unshift({
        month: currentMonth,
        year: currentYear,
        earnings: liveUserData.earnings,
        taskCount: liveUserData.taskCount || 0,
        tasks: liveUserData.tasks || [],
        hasDetailedSnapshot: true,
        isLive: true,
      });
    }
  }

  return result;
};
