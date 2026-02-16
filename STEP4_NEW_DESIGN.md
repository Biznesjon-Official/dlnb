# Step 4 - Yangi Smart Cards Dizayni

## Asosiy O'zgarishlar:

### 1. Xizmatlar Avtomatik Kartochkalarga Aylanadi
- 3-stepda qo'shilgan `laborItems` avtomatik ko'rsatiladi
- Har bir xizmat = alohida kartochka
- Checkbox bilan vazifa yaratish/yaratmaslik

### 2. Inline Shogird Qo'shish
- Har bir kartochka ichida shogird qo'shish
- Dropdown bilan tez tanlash
- Real-time hisob-kitob

### 3. Vizual Yaxshilash
- Gradient kartochkalar
- Icon'lar va emoji'lar
- Smooth animations
- Mobil-friendly

## Barcha Funksiyalar Saqlanadi:
✅ Ko'p shogird qo'shish
✅ Foiz hisoblash
✅ Vazifa yaratish/o'chirish
✅ Xizmat tanlash
✅ Muddat, muhimlik belgilash
✅ Validatsiya
✅ Submit logikasi

## Kod Strukturasi:
```tsx
// 1. Xizmatlar ro'yxati
{laborItems.map(service => (
  <ServiceCard 
    service={service}
    task={getTaskForService(service)}
    onToggle={toggleTask}
    onAddApprentice={addApprentice}
  />
))}

// 2. Har bir kartochka:
// - Checkbox
// - Xizmat ma'lumotlari
// - Shogirdlar ro'yxati
// - Hisob-kitob
```
