import Customer from '../models/Customer';

interface UpdateCustomerData {
  name: string;
  phone: string;
  clientId: string;
  debtAmount?: number;
  paidAmount?: number;
  carAdded?: boolean;
}

export const updateOrCreateCustomer = async (data: UpdateCustomerData) => {
  try {
    const { name, phone, clientId, debtAmount, paidAmount, carAdded } = data;

    // Telefon raqamni tozalash
    const cleanPhone = phone.trim();

    // Mijozni topish
    let customer = await Customer.findOne({ phone: cleanPhone, clientId });

    if (!customer) {
      // Yangi mijoz yaratish
      customer = await Customer.create({
        name: name.trim(),
        phone: cleanPhone,
        clientId,
        totalDebt: debtAmount || 0,
        totalPaid: paidAmount || 0,
        carsCount: carAdded ? 1 : 0,
        lastVisit: new Date(),
      });
    } else {
      // Mavjud mijozni yangilash
      if (debtAmount !== undefined) {
        customer.totalDebt += debtAmount;
      }
      if (paidAmount !== undefined) {
        customer.totalPaid += paidAmount;
      }
      if (carAdded) {
        customer.carsCount += 1;
      }
      customer.lastVisit = new Date();
      await customer.save();
    }

    return customer;
  } catch (error) {
    console.error('❌ Customer service error:', error);
    throw error;
  }
};

export const decreaseCustomerCarsCount = async (phone: string, clientId: string) => {
  try {
    const customer = await Customer.findOne({ phone: phone.trim(), clientId });
    if (customer && customer.carsCount > 0) {
      customer.carsCount -= 1;
      await customer.save();
    }
  } catch (error) {
    console.error('❌ Decrease cars count error:', error);
  }
};

export const updateCustomerDebt = async (
  phone: string,
  clientId: string,
  debtChange: number,
  paidChange: number
) => {
  try {
    const customer = await Customer.findOne({ phone: phone.trim(), clientId });
    if (customer) {
      customer.totalDebt += debtChange;
      customer.totalPaid += paidChange;
      customer.lastVisit = new Date();
      await customer.save();
    }
  } catch (error) {
    console.error('❌ Update customer debt error:', error);
  }
};
