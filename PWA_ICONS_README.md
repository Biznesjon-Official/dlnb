# PWA Icon'lar - Dalnoboy Shop

## 📱 Icon O'lchamlari

PWA ilovamiz uchun quyidagi o'lchamdagi icon'lar yaratilgan:

| O'lcham | Fayl nomi | Hajmi | Maqsad |
|---------|-----------|-------|--------|
| 72x72 | icon-72x72.png | 10.4 KB | Android Chrome |
| 96x96 | icon-96x96.png | 17.6 KB | Android Chrome |
| 128x128 | icon-128x128.png | 29.8 KB | Android Chrome |
| 144x144 | icon-144x144.png | 36.9 KB | Android Chrome |
| 152x152 | icon-152x152.png | 40.9 KB | iOS Safari |
| 192x192 | icon-192x192.png | 63.7 KB | Android Chrome (maskable) |
| 384x384 | icon-384x384.png | 238.1 KB | Android Chrome |
| 512x512 | icon-512x512.png | 421.5 KB | Android Chrome (maskable) |

## 🎨 Icon Yaratish

Icon'lar `dlnb.png` faylidan Python Pillow kutubxonasi yordamida yaratilgan.

### Yangi Icon'lar Yaratish

Agar logo o'zgarsa, quyidagi skript bilan yangi icon'lar yaratish mumkin:

```python
from PIL import Image
import os

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
INPUT_IMAGE = 'frontend/public/dlnb.png'
OUTPUT_DIR = 'frontend/public'

def create_icons():
    img = Image.open(INPUT_IMAGE)
    for size in SIZES:
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        output_path = os.path.join(OUTPUT_DIR, f'icon-{size}x{size}.png')
        resized.save(output_path, 'PNG', optimize=True)
        print(f"✅ {size}x{size} yaratildi")

if __name__ == '__main__':
    create_icons()
```

## 📝 Manifest Konfiguratsiyasi

Icon'lar `manifest.webmanifest` faylida quyidagicha ko'rsatilgan:

```json
{
  "icons": [
    {
      "src": "icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## 🔧 Vite Konfiguratsiyasi

`vite.config.ts` faylida icon'lar quyidagicha qo'shilgan:

```typescript
VitePWA({
  includeAssets: ['dlnb.png', 'icon-*.png'],
  manifest: {
    icons: [
      {
        src: 'icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      // ...
    ]
  }
})
```

## 🚀 Build va Deploy

Icon'lar build vaqtida avtomatik `dist` papkasiga nusxalanadi:

```bash
cd frontend
npm run build
```

Build natijasida:
- `dist/icon-*.png` - Barcha icon'lar
- `dist/manifest.webmanifest` - PWA manifest
- `dist/sw.js` - Service Worker

## ✅ Test Qilish

### Desktop (Chrome)
1. `npm run dev` - Dev server'ni ishga tushirish
2. Chrome DevTools > Application > Manifest
3. Icon'larni ko'rish

### Mobile (Android)
1. Chrome'da saytni ochish
2. Menu > "Add to Home Screen"
3. Icon'ni tekshirish

### Mobile (iOS)
1. Safari'da saytni ochish
2. Share > "Add to Home Screen"
3. Icon'ni tekshirish

## 🎯 Muhim Eslatmalar

1. **Icon o'lchamlari** - Har bir platforma uchun to'g'ri o'lcham kerak
2. **Maskable icon'lar** - Android adaptive icon'lar uchun
3. **Optimizatsiya** - Icon'lar PNG formatda va optimize qilingan
4. **Cache** - Service Worker icon'larni cache'laydi

## 📚 Qo'shimcha Ma'lumot

- [PWA Icons Guide](https://web.dev/add-manifest/)
- [Maskable Icons](https://web.dev/maskable-icon/)
- [iOS PWA Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)

---

**Oxirgi yangilanish**: 2026-02-16  
**Versiya**: 1.0.0  
**Status**: ✅ Production Ready
