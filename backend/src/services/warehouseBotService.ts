import TelegramBot from 'node-telegram-bot-api';
import SparePart from '../models/SparePart';

// ============================================
// KONFIGURATSIYA
// ============================================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_WAREHOUSE || '';
const ADMIN_CHAT_ID = process.env.WAREHOUSE_ADMIN_CHAT_ID || '';

// Bot instance
let bot: TelegramBot | null = null;

// Sahifalash uchun state
const userPages = new Map<number, number>();

// ============================================
// YORDAMCHI FUNKSIYALAR
// ============================================

// Narxni formatlash
const formatPrice = (price: number, currency: string): string => {
  if (currency === 'USD') {
    return `$${price.toFixed(2)}`;
  }
  return `${price.toLocaleString('uz-UZ')} so'm`;
};

// ============================================
// KEYBOARD'LAR
// ============================================

// Asosiy menyu
const getMainMenuKeyboard = () => {
  return {
    keyboard: [
      [{ text: '📦 Barcha zapchastlar' }, { text: '⚠️ Kam qolganlar' }],
      [{ text: '📊 Statistika' }, { text: '❓ Yordam' }],
      [{ text: '🔧 Zapchastlar' }, { text: '🛞 Balonlar' }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
};

// Sahifalash tugmalari
const getPaginationKeyboard = (currentPage: number, totalPages: number) => {
  const buttons: any[] = [];
  
  const paginationRow: any[] = [];
  if (currentPage > 1) {
    paginationRow.push({ text: '⬅️ Oldingi' });
  }
  if (currentPage < totalPages) {
    paginationRow.push({ text: '➡️ Keyingi' });
  }
  
  if (paginationRow.length > 0) {
    buttons.push(paginationRow);
  }
  
  buttons.push([{ text: '🏠 Bosh sahifa' }]);
  
  return {
    keyboard: buttons,
    resize_keyboard: true,
    one_time_keyboard: false,
  };
};

// Kategoriya tugmalari
const getCategoryKeyboard = () => {
  return {
    keyboard: [
      [{ text: '🔧 Zapchastlar' }, { text: '🛞 Balonlar' }],
      [{ text: '⚠️ Kam qolganlar' }, { text: '📊 Statistika' }],
      [{ text: '🏠 Bosh sahifa' }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
};

// Zapchastlar bo'limi
const getSparePartsKeyboard = () => {
  return {
    keyboard: [
      [{ text: '📋 Ro\'yxat' }, { text: '⚠️ Kam qolgan zapchastlar' }],
      [{ text: '📊 Zapchastlar statistikasi' }],
      [{ text: '🏠 Bosh sahifa' }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
};

// Balonlar bo'limi
const getTiresKeyboard = () => {
  return {
    keyboard: [
      [{ text: '📋 Balonlar ro\'yxati' }, { text: '⚠️ Kam qolgan balonlar' }],
      [{ text: '📊 Balonlar statistikasi' }],
      [{ text: '🏠 Bosh sahifa' }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
};

// Orqaga qaytish
const getBackKeyboard = () => {
  return {
    keyboard: [
      [{ text: '🏠 Bosh sahifa' }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
  };
};

// ============================================
// ASOSIY MENYU
// ============================================

const sendMainMenu = async (chatId: number) => {
  const menuText = `
🏪 <b>OMBOR BOSHQARUVI</b>

Assalomu alaykum! 👋

Quyidagi bo'limlardan birini tanlang:

📦 <b>Barcha zapchastlar</b> - To'liq ro'yxat
⚠️ <b>Kam qolganlar</b> - Tugab qolayotgan zapchastlar
📊 <b>Statistika</b> - Umumiy ma'lumotlar
🔧 <b>Zapchastlar</b> - Zapchastlar bo'limi
🛞 <b>Balonlar</b> - Balonlar bo'limi
❓ <b>Yordam</b> - Bot haqida ma'lumot
  `;

  try {
    if (bot) {
      await bot.sendMessage(chatId, menuText, {
        parse_mode: 'HTML',
        reply_markup: getMainMenuKeyboard(),
      });
    }
  } catch (error: any) {
    console.error('❌ Menu yuborishda xatolik:', error.message);
  }
};

// ============================================
// ZAPCHASTLAR RO'YXATI
// ============================================

const sendSparePartsList = async (chatId: number, page: number = 1) => {
  try {
    const limit = 10;
    const skip = (page - 1) * limit;

    const [parts, total] = await Promise.all([
      SparePart.find({ isActive: true })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SparePart.countDocuments({ isActive: true }),
    ]);

    if (parts.length === 0) {
      const text = '📦 Omborda zapchastlar yo\'q';

      if (bot) {
        await bot.sendMessage(chatId, text, {
          reply_markup: getBackKeyboard(),
        });
      }
      return;
    }

    const totalPages = Math.ceil(total / limit);
    
    let text = `📦 <b>ZAPCHASTLAR RO'YXATI</b>\n\n`;
    text += `Sahifa: ${page}/${totalPages}\n`;
    text += `Jami: ${total} ta\n\n`;

    parts.forEach((part, index) => {
      const num = skip + index + 1;
      const lowStock = part.quantity < 5 ? '⚠️' : '';
      
      text += `${num}. <b>${part.name}</b> ${lowStock}\n`;
      text += `   💰 Narx: ${formatPrice(part.sellingPrice, part.currency)}\n`;
      text += `   📊 Soni: ${part.quantity} ${part.unit || 'dona'}\n`;
      
      if (part.category === 'balon' && part.tireFullSize) {
        text += `   🛞 Razmer: ${part.tireFullSize}\n`;
      }
      
      text += `\n`;
    });

    if (bot) {
      await bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: getPaginationKeyboard(page, totalPages),
      });
    }
  } catch (error: any) {
    console.error('❌ Zapchastlar ro\'yxatini yuborishda xatolik:', error.message);
    if (bot) {
      await bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
  }
};

// ============================================
// KAM QOLGAN ZAPCHASTLAR
// ============================================

const sendLowStockParts = async (chatId: number) => {
  try {
    const parts = await SparePart.find({
      isActive: true,
      quantity: { $lt: 5 },
    })
      .sort({ quantity: 1 })
      .limit(20)
      .lean();

    if (parts.length === 0) {
      const text = '✅ Barcha zapchastlar yetarli miqdorda mavjud!';

      if (bot) {
        await bot.sendMessage(chatId, text, {
          reply_markup: getCategoryKeyboard(),
        });
      }
      return;
    }

    let text = `⚠️ <b>KAM QOLGAN ZAPCHASTLAR</b>\n\n`;
    text += `Jami: ${parts.length} ta\n\n`;

    parts.forEach((part, index) => {
      const emoji = part.quantity === 0 ? '🔴' : part.quantity < 3 ? '🟠' : '🟡';
      
      text += `${index + 1}. ${emoji} <b>${part.name}</b>\n`;
      text += `   📊 Qoldi: ${part.quantity} ${part.unit || 'dona'}\n`;
      text += `   💰 Narx: ${formatPrice(part.sellingPrice, part.currency)}\n\n`;
    });

    if (bot) {
      await bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: getCategoryKeyboard(),
      });
    }
  } catch (error: any) {
    console.error('❌ Kam qolgan zapchastlarni yuborishda xatolik:', error.message);
    if (bot) {
      await bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
  }
};

// ============================================
// KAM QOLGAN ZAPCHASTLAR (KATEGORIYA BO'YICHA)
// ============================================

const sendLowStockPartsByCategory = async (chatId: number, category: string) => {
  try {
    const parts = await SparePart.find({
      isActive: true,
      category: category,
      quantity: { $lt: 5 },
    })
      .sort({ quantity: 1 })
      .limit(20)
      .lean();

    const categoryName = category === 'balon' ? 'Balonlar' : 'Zapchastlar';

    if (parts.length === 0) {
      const text = `✅ Barcha ${categoryName.toLowerCase()} yetarli miqdorda mavjud!`;

      if (bot) {
        await bot.sendMessage(chatId, text, {
          reply_markup: category === 'balon' ? getTiresKeyboard() : getSparePartsKeyboard(),
        });
      }
      return;
    }

    let text = `⚠️ <b>KAM QOLGAN ${categoryName.toUpperCase()}</b>\n\n`;
    text += `Jami: ${parts.length} ta\n\n`;

    parts.forEach((part, index) => {
      const statusEmoji = part.quantity === 0 ? '🔴' : part.quantity < 3 ? '🟠' : '🟡';
      
      text += `${index + 1}. ${statusEmoji} <b>${part.name}</b>\n`;
      text += `   📊 Qoldi: ${part.quantity} ${part.unit || 'dona'}\n`;
      text += `   💰 Narx: ${formatPrice(part.sellingPrice, part.currency)}\n`;
      
      if (category === 'balon' && part.tireFullSize) {
        text += `   🛞 Razmer: ${part.tireFullSize}\n`;
      }
      
      text += `\n`;
    });

    if (bot) {
      await bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: category === 'balon' ? getTiresKeyboard() : getSparePartsKeyboard(),
      });
    }
  } catch (error: any) {
    console.error('❌ Kam qolgan zapchastlarni yuborishda xatolik:', error.message);
    if (bot) {
      await bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
  }
};

// ============================================
// STATISTIKA
// ============================================

const sendStatistics = async (chatId: number) => {
  try {
    const [
      totalParts,
      totalQuantity,
      lowStockCount,
      outOfStockCount,
      totalValue,
      categoryStats,
    ] = await Promise.all([
      SparePart.countDocuments({ isActive: true }),
      SparePart.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]),
      SparePart.countDocuments({ isActive: true, quantity: { $lt: 5, $gt: 0 } }),
      SparePart.countDocuments({ isActive: true, quantity: 0 }),
      SparePart.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$sellingPrice', '$quantity'] } },
          },
        },
      ]),
      SparePart.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            quantity: { $sum: '$quantity' },
          },
        },
      ]),
    ]);

    const totalQty = totalQuantity[0]?.total || 0;
    const totalVal = totalValue[0]?.total || 0;

    let text = `📊 <b>OMBOR STATISTIKASI</b>\n\n`;
    text += `📦 Jami zapchastlar: ${totalParts} ta\n`;
    text += `📊 Jami miqdor: ${totalQty} dona\n`;
    text += `💰 Umumiy qiymat: ${formatPrice(totalVal, 'UZS')}\n\n`;

    text += `<b>Holat:</b>\n`;
    text += `✅ Yetarli: ${totalParts - lowStockCount - outOfStockCount} ta\n`;
    text += `⚠️ Kam qolgan: ${lowStockCount} ta\n`;
    text += `🔴 Tugagan: ${outOfStockCount} ta\n\n`;

    if (categoryStats.length > 0) {
      text += `<b>Kategoriyalar:</b>\n`;
      categoryStats.forEach((cat) => {
        const emoji = cat._id === 'balon' ? '🛞' : cat._id === 'zapchast' ? '🔧' : '📦';
        const name = cat._id === 'balon' ? 'Balonlar' : cat._id === 'zapchast' ? 'Zapchastlar' : 'Boshqa';
        text += `${emoji} ${name}: ${cat.count} ta (${cat.quantity} dona)\n`;
      });
    }

    if (bot) {
      await bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: getBackKeyboard(),
      });
    }
  } catch (error: any) {
    console.error('❌ Statistikani yuborishda xatolik:', error.message);
    if (bot) {
      await bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
  }
};

// ============================================
// KATEGORIYA STATISTIKASI
// ============================================

const sendCategoryStatistics = async (chatId: number, category: string) => {
  try {
    const [
      totalParts,
      totalQuantity,
      lowStockCount,
      outOfStockCount,
      totalValue,
    ] = await Promise.all([
      SparePart.countDocuments({ isActive: true, category }),
      SparePart.aggregate([
        { $match: { isActive: true, category } },
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]),
      SparePart.countDocuments({ isActive: true, category, quantity: { $lt: 5, $gt: 0 } }),
      SparePart.countDocuments({ isActive: true, category, quantity: 0 }),
      SparePart.aggregate([
        { $match: { isActive: true, category } },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$sellingPrice', '$quantity'] } },
          },
        },
      ]),
    ]);

    const totalQty = totalQuantity[0]?.total || 0;
    const totalVal = totalValue[0]?.total || 0;
    const categoryName = category === 'balon' ? 'BALONLAR' : 'ZAPCHASTLAR';
    const emoji = category === 'balon' ? '🛞' : '🔧';

    let text = `${emoji} <b>${categoryName} STATISTIKASI</b>\n\n`;
    text += `📦 Jami: ${totalParts} ta\n`;
    text += `📊 Jami miqdor: ${totalQty} dona\n`;
    text += `💰 Umumiy qiymat: ${formatPrice(totalVal, 'UZS')}\n\n`;

    text += `<b>Holat:</b>\n`;
    text += `✅ Yetarli: ${totalParts - lowStockCount - outOfStockCount} ta\n`;
    text += `⚠️ Kam qolgan: ${lowStockCount} ta\n`;
    text += `🔴 Tugagan: ${outOfStockCount} ta\n`;

    if (bot) {
      await bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: category === 'balon' ? getTiresKeyboard() : getSparePartsKeyboard(),
      });
    }
  } catch (error: any) {
    console.error('❌ Kategoriya statistikasini yuborishda xatolik:', error.message);
    if (bot) {
      await bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
  }
};

// ============================================
// KATEGORIYA BO'YICHA
// ============================================

const sendPartsByCategory = async (chatId: number, category: string) => {
  try {
    const parts = await SparePart.find({
      isActive: true,
      category: category,
    })
      .sort({ name: 1 })
      .limit(20)
      .lean();

    if (parts.length === 0) {
      const text = `📦 ${category === 'balon' ? 'Balonlar' : 'Zapchastlar'} topilmadi`;

      if (bot) {
        await bot.sendMessage(chatId, text, {
          reply_markup: category === 'balon' ? getTiresKeyboard() : getSparePartsKeyboard(),
        });
      }
      return;
    }

    const emoji = category === 'balon' ? '🛞' : '🔧';
    const name = category === 'balon' ? 'BALONLAR BO\'LIMI' : 'ZAPCHASTLAR BO\'LIMI';

    let text = `${emoji} <b>${name}</b>\n\n`;
    text += `Jami: ${parts.length} ta\n\n`;

    parts.forEach((part, index) => {
      const lowStock = part.quantity < 5 ? '⚠️' : '';
      
      text += `${index + 1}. <b>${part.name}</b> ${lowStock}\n`;
      text += `   💰 Narx: ${formatPrice(part.sellingPrice, part.currency)}\n`;
      text += `   📊 Soni: ${part.quantity} ${part.unit || 'dona'}\n`;
      
      if (category === 'balon' && part.tireFullSize) {
        text += `   🛞 Razmer: ${part.tireFullSize}\n`;
        if (part.tireBrand) {
          text += `   🏷️ Brend: ${part.tireBrand}\n`;
        }
      }
      
      text += `\n`;
    });

    if (bot) {
      await bot.sendMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: category === 'balon' ? getTiresKeyboard() : getSparePartsKeyboard(),
      });
    }
  } catch (error: any) {
    console.error('❌ Kategoriya bo\'yicha zapchastlarni yuborishda xatolik:', error.message);
    if (bot) {
      await bot.sendMessage(chatId, '❌ Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
  }
};

// ============================================
// YORDAM
// ============================================

const sendHelp = async (chatId: number) => {
  const text = `
❓ <b>YORDAM</b>

<b>Buyruqlar:</b>
/start - Asosiy menyu
/help - Bu yordam xabari

<b>Bo'limlar:</b>

📦 <b>Barcha zapchastlar</b>
   To'liq ro'yxat (sahifalash bilan)

⚠️ <b>Kam qolganlar</b>
   5 tadan kam qolgan zapchastlar

📊 <b>Statistika</b>
   Umumiy ma'lumotlar va hisobotlar

🔧 <b>Zapchastlar</b>
   Faqat zapchastlar ro'yxati

🛞 <b>Balonlar</b>
   Faqat balonlar ro'yxati
  `;

  if (bot) {
    await bot.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      reply_markup: getBackKeyboard(),
    });
  }
};

// ============================================
// KOMANDALARNI SOZLASH
// ============================================

const setupCommands = () => {
  if (!bot) return;

  // /start - Asosiy menyu
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    userPages.delete(chatId);
    await sendMainMenu(chatId);
  });

  // /help - Yordam
  bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    await sendHelp(chatId);
  });

  // Pastdagi tugmalarni ushlash
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return;

    switch (text) {
      // Asosiy menyu
      case '📦 Barcha zapchastlar':
        userPages.set(chatId, 1);
        await sendSparePartsList(chatId, 1);
        break;

      case '⬅️ Oldingi':
        {
          const currentPage = userPages.get(chatId) || 1;
          const newPage = Math.max(1, currentPage - 1);
          userPages.set(chatId, newPage);
          await sendSparePartsList(chatId, newPage);
        }
        break;

      case '➡️ Keyingi':
        {
          const currentPage = userPages.get(chatId) || 1;
          const newPage = currentPage + 1;
          userPages.set(chatId, newPage);
          await sendSparePartsList(chatId, newPage);
        }
        break;

      case '⚠️ Kam qolganlar':
        await sendLowStockParts(chatId);
        break;

      case '📊 Statistika':
        await sendStatistics(chatId);
        break;

      case '🔧 Zapchastlar':
        await sendPartsByCategory(chatId, 'zapchast');
        break;

      case '🛞 Balonlar':
        await sendPartsByCategory(chatId, 'balon');
        break;

      case '❓ Yordam':
        await sendHelp(chatId);
        break;

      case '🏠 Bosh sahifa':
        userPages.delete(chatId);
        await sendMainMenu(chatId);
        break;

      // Zapchastlar bo'limi
      case '📋 Ro\'yxat':
        await sendPartsByCategory(chatId, 'zapchast');
        break;

      case '⚠️ Kam qolgan zapchastlar':
        await sendLowStockPartsByCategory(chatId, 'zapchast');
        break;

      case '📊 Zapchastlar statistikasi':
        await sendCategoryStatistics(chatId, 'zapchast');
        break;

      // Balonlar bo'limi
      case '📋 Balonlar ro\'yxati':
        await sendPartsByCategory(chatId, 'balon');
        break;

      case '⚠️ Kam qolgan balonlar':
        await sendLowStockPartsByCategory(chatId, 'balon');
        break;

      case '📊 Balonlar statistikasi':
        await sendCategoryStatistics(chatId, 'balon');
        break;
    }
  });
};

// ============================================
// BOT'NI ISHGA TUSHIRISH
// ============================================

export const initializeWarehouseBot = () => {
  if (!BOT_TOKEN) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN_WAREHOUSE topilmadi. Ombor bot ishga tushmaydi.');
    return;
  }

  try {
    bot = new TelegramBot(BOT_TOKEN, { polling: true });
    console.log('✅ Ombor Telegram Bot ishga tushdi!');
    console.log(`📦 Admin Chat ID: ${ADMIN_CHAT_ID}`);

    // Error handling
    bot.on('polling_error', (error) => {
      console.error('❌ Telegram Bot polling error:', error.message);
    });

    bot.on('error', (error) => {
      console.error('❌ Telegram Bot error:', error.message);
    });

    // Komandalarni sozlash
    setupCommands();

  } catch (error: any) {
    console.error('❌ Ombor bot ishga tushmadi:', error.message);
  }
};

// ============================================
// EXPORT
// ============================================

export const getWarehouseBot = () => bot;
