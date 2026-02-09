# PWA (Progressive Web App) - Texnik Yo'riqnoma

## 📱 PWA NIMA?

**Progressive Web App (PWA)** - bu zamonaviy web texnologiyalar yordamida yaratilgan web ilovalar bo'lib, ular mobil ilovalar kabi ishlaydi va foydalanuvchi tajribasini yaxshilaydi.

### PWA'ning Asosiy Xususiyatlari

1. **Installable** - Telefon/kompyuterga o'rnatish mumkin
2. **Offline Work** - Internet yo'qligida ham ishlaydi
3. **Fast Loading** - Tez yuklanadi (cache)
4. **Push Notifications** - Xabarnomalar yuborish
5. **App-like Experience** - Mobil ilova kabi ko'rinish
6. **Responsive** - Barcha ekranlarda ishlaydi
7. **Secure** - HTTPS orqali ishlaydi

---

## 🏗️ PWA ARXITEKTURASI

### Asosiy Komponentlar

```
PWA
├── manifest.json        # Ilova haqida ma'lumot
├── service-worker.js    # Offline va cache boshqaruvi
├── icons/              # Ilova ikonkalari
└── index.html          # Asosiy HTML fayl
```

---

## 📄 MANIFEST.JSON

**Maqsad**: Ilova haqida ma'lumot berish (nom, rang, ikonka, va h.k.)

### Bizning Loyihadagi Manifest

**Fayl**: `frontend/public/manifest.json`

```json
{
  "name": "Dalnoboy Shop",
  "short_name": "Dalnoboy",
  "description": "Avtomobil ta'mirlash ustaxonasi boshqaruv tizimi",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/logo.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/logo.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Manifest Parametrlari

| Parametr | Tavsif | Qiymat |
|----------|--------|--------|
| `name` | To'liq nom | "Dalnoboy Shop" |
| `short_name` | Qisqa nom (home screen) | "Dalnoboy" |
| `description` | Tavsif | "Avtomobil ta'mirlash..." |
| `start_url` | Boshlang'ich URL | "/" |
| `display` | Ko'rinish rejimi | "standalone" |
| `background_color` | Fon rangi | "#ffffff" |
| `theme_color` | Tema rangi | "#3b82f6" |
| `orientation` | Ekran yo'nalishi | "portrait" |
| `icons` | Ikonkalar ro'yxati | Array |

### Display Modes

- **`standalone`** - Mobil ilova kabi (bizda ishlatilgan)
- **`fullscreen`** - To'liq ekran
- **`minimal-ui`** - Minimal UI elementlar
- **`browser`** - Oddiy brauzer

---

## 🔧 SERVICE WORKER

**Maqsad**: Offline ishlash, cache boshqaruvi, background sync

### Bizning Loyihadagi Service Worker

**Fayl**: `frontend/public/sw.js`

```javascript
const CACHE_NAME = 'dalnoboy-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// Install event - cache'ga fayllarni saqlash
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - cache'dan yoki network'dan olish
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Activate event - eski cache'larni o'chirish
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### Service Worker Lifecycle

```
┌─────────────┐
│  Installing │  ← sw.js yuklanadi
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Installed  │  ← Install event
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Activating │  ← Activate event
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Activated  │  ← Fetch events
└─────────────┘
```

### Cache Strategies

#### 1. Cache First (Offline-First)
```javascript
// Cache'dan olish, yo'q bo'lsa network'dan
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

#### 2. Network First
```javascript
// Network'dan olish, xato bo'lsa cache'dan
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
```

#### 3. Stale While Revalidate
```javascript
// Cache'dan olish va background'da yangilash
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return response || fetchPromise;
      });
    })
  );
});
```

---

## 🎨 VITE PWA PLUGIN

**Bizning loyihada**: `vite-plugin-pwa` ishlatiladi

### Konfiguratsiya

**Fayl**: `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'dalnoboy.jpg'],
      manifest: {
        name: 'Dalnoboy Shop',
        short_name: 'Dalnoboy',
        description: 'Avtomobil ta\'mirlash ustaxonasi boshqaruv tizimi',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 soat
              }
            }
          }
        ]
      }
    })
  ]
});
```

### Plugin Parametrlari

| Parametr | Tavsif | Qiymat |
|----------|--------|--------|
| `registerType` | Registratsiya turi | 'autoUpdate' |
| `includeAssets` | Qo'shimcha fayllar | ['logo.png', ...] |
| `manifest` | Manifest konfiguratsiyasi | Object |
| `workbox` | Workbox konfiguratsiyasi | Object |

---

## 📦 INDEXEDDB (Offline Storage)

**Maqsad**: Ma'lumotlarni mahalliy saqlash (offline ishlash uchun)

### Bizning Loyihadagi IndexedDB

**Fayl**: `frontend/src/lib/storage/IndexedDBManager.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DalnoboyDB extends DBSchema {
  cars: {
    key: string;
    value: Car;
    indexes: { 'by-clientId': string };
  };
  debts: {
    key: string;
    value: Debt;
  };
  transactions: {
    key: string;
    value: Transaction;
  };
  pendingOperations: {
    key: string;
    value: PendingOperation;
  };
}

class IndexedDBManager {
  private db: IDBPDatabase<DalnoboyDB> | null = null;

  async init() {
    this.db = await openDB<DalnoboyDB>('dalnoboy-db', 1, {
      upgrade(db) {
        // Cars store
        if (!db.objectStoreNames.contains('cars')) {
          const carsStore = db.createObjectStore('cars', { keyPath: '_id' });
          carsStore.createIndex('by-clientId', 'clientId');
        }

        // Debts store
        if (!db.objectStoreNames.contains('debts')) {
          db.createObjectStore('debts', { keyPath: '_id' });
        }

        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: '_id' });
        }

        // Pending operations store
        if (!db.objectStoreNames.contains('pendingOperations')) {
          db.createObjectStore('pendingOperations', { keyPath: 'id' });
        }
      }
    });
  }

  async save<T extends BaseEntity>(storeName: string, data: T): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.put(storeName as any, data as any);
  }

  async getAll<T extends BaseEntity>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();
    return this.db!.getAll(storeName as any) as Promise<T[]>;
  }

  async getById<T extends BaseEntity>(storeName: string, id: string): Promise<T | undefined> {
    if (!this.db) await this.init();
    return this.db!.get(storeName as any, id) as Promise<T | undefined>;
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.delete(storeName as any, id);
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init();
    await this.db!.clear(storeName as any);
  }
}

export const indexedDBManager = new IndexedDBManager();
```

### IndexedDB Stores

| Store | Maqsad | Key |
|-------|--------|-----|
| `cars` | Mashinalar | `_id` |
| `debts` | Qarzlar | `_id` |
| `transactions` | Tranzaksiyalar | `_id` |
| `pendingOperations` | Kutilayotgan operatsiyalar | `id` |

### IndexedDB API

```typescript
// Saqlash
await indexedDBManager.save('cars', car);

// Barcha ma'lumotlarni olish
const cars = await indexedDBManager.getAll<Car>('cars');

// ID bo'yicha olish
const car = await indexedDBManager.getById<Car>('cars', carId);

// O'chirish
await indexedDBManager.delete('cars', carId);

// Barcha ma'lumotlarni o'chirish
await indexedDBManager.clear('cars');
```

---

## 🔄 OFFLINE SYNC SYSTEM

### Arxitektura

```
┌─────────────────────────────────────────────────┐
│                  User Action                     │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              Repository Layer                    │
│  (CarsRepository, DebtsRepository, etc.)        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Online Mode    │    │  Offline Mode   │
│  (API Call)     │    │  (IndexedDB)    │
└────────┬────────┘    └────────┬────────┘
         │                      │
         │                      ▼
         │            ┌─────────────────┐
         │            │  Queue Manager  │
         │            │  (Pending Ops)  │
         │            └────────┬────────┘
         │                     │
         └─────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │    Sync Manager       │
         │  (Background Sync)    │
         └───────────────────────┘
```

### Komponentlar

#### 1. NetworkManager
**Vazifa**: Network holatini kuzatish

```typescript
class NetworkManager {
  private isOnlineState = navigator.onLine;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));
    this.startHealthCheck();
  }

  isOnline(): boolean {
    return this.isOnlineState;
  }

  onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private async startHealthCheck() {
    setInterval(async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        this.updateStatus(response.ok);
      } catch {
        this.updateStatus(false);
      }
    }, 5000); // 5 soniyada bir
  }

  private updateStatus(isOnline: boolean) {
    if (this.isOnlineState !== isOnline) {
      this.isOnlineState = isOnline;
      this.listeners.forEach(listener => listener(isOnline));
    }
  }
}

export const networkManager = new NetworkManager();
```

#### 2. QueueManager
**Vazifa**: Pending operatsiyalarni boshqarish

```typescript
interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string; // 'cars', 'debts', etc.
  data: any;
  timestamp: number;
  retries: number;
}

class QueueManager {
  async addOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retries'>) {
    const pendingOp: PendingOperation = {
      ...operation,
      id: `${operation.entity}-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      retries: 0
    };

    await indexedDBManager.save('pendingOperations', pendingOp);
    return pendingOp.id;
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    return indexedDBManager.getAll<PendingOperation>('pendingOperations');
  }

  async removeOperation(id: string) {
    await indexedDBManager.delete('pendingOperations', id);
  }

  async getPendingCount(): Promise<number> {
    const operations = await this.getPendingOperations();
    return operations.length;
  }
}

export const queueManager = new QueueManager();
```

#### 3. SyncManager
**Vazifa**: Pending operatsiyalarni sync qilish

```typescript
class SyncManager {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  startAutoSync() {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(async () => {
      if (networkManager.isOnline() && !this.isSyncing) {
        await this.syncPendingOperations();
      }
    }, 10000); // 10 soniyada bir
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncPendingOperations() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const operations = await queueManager.getPendingOperations();
      
      for (const operation of operations) {
        try {
          await this.executeOperation(operation);
          await queueManager.removeOperation(operation.id);
        } catch (error) {
          console.error('Sync failed:', error);
          // Retry logic
          if (operation.retries < 3) {
            operation.retries++;
            await indexedDBManager.save('pendingOperations', operation);
          } else {
            // Max retries reached, remove operation
            await queueManager.removeOperation(operation.id);
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async executeOperation(operation: PendingOperation) {
    const { type, entity, data } = operation;

    switch (type) {
      case 'create':
        await api.post(`/${entity}`, data);
        break;
      case 'update':
        await api.put(`/${entity}/${data._id}`, data);
        break;
      case 'delete':
        await api.delete(`/${entity}/${data._id}`);
        break;
    }
  }
}

export const syncManager = new SyncManager();
```

---

## 🎯 OFFLINE-FIRST STRATEGY

### Network-First Strategy

```typescript
class CarsRepository extends BaseRepository<Car> {
  async getAll(): Promise<Car[]> {
    try {
      // 1. Online bo'lsa - server'dan olish
      if (networkManager.isOnline()) {
        const response = await api.get('/cars');
        const cars = response.data;

        // 2. IndexedDB'ga saqlash (cache)
        await Promise.all(cars.map(car => 
          indexedDBManager.save('cars', car)
        ));

        return cars;
      }
    } catch (error) {
      console.error('Failed to fetch from server:', error);
    }

    // 3. Offline bo'lsa yoki xato - IndexedDB'dan olish
    return indexedDBManager.getAll<Car>('cars');
  }

  async create(data: Partial<Car>): Promise<Car> {
    const tempId = `temp-${Date.now()}`;
    const newCar: Car = {
      ...data,
      _id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Car;

    // 1. IndexedDB'ga darhol saqlash (Optimistic UI)
    await indexedDBManager.save('cars', newCar);

    // 2. Online bo'lsa - server'ga yuborish
    if (networkManager.isOnline()) {
      try {
        const response = await api.post('/cars', data);
        const serverCar = response.data;

        // 3. Server ID bilan yangilash
        await indexedDBManager.delete('cars', tempId);
        await indexedDBManager.save('cars', serverCar);

        return serverCar;
      } catch (error) {
        // 4. Xato bo'lsa - queue'ga qo'shish
        await queueManager.addOperation({
          type: 'create',
          entity: 'cars',
          data
        });
      }
    } else {
      // 5. Offline bo'lsa - queue'ga qo'shish
      await queueManager.addOperation({
        type: 'create',
        entity: 'cars',
        data
      });
    }

    return newCar;
  }
}
```

### Optimistic UI Updates

```typescript
// React Hook
function useCarsNew() {
  const [cars, setCars] = useState<Car[]>([]);

  const createCar = async (data: Partial<Car>) => {
    // 1. UI'ni darhol yangilash (0ms)
    const tempCar: Car = {
      ...data,
      _id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString()
    } as Car;

    setCars(prev => [...prev, tempCar]);

    // 2. Background'da saqlash (sezilmasin)
    try {
      const savedCar = await carsRepository.create(data);
      
      // 3. Server ID bilan yangilash
      setCars(prev => prev.map(car => 
        car._id === tempCar._id ? savedCar : car
      ));
    } catch (error) {
      // 4. Xato bo'lsa - rollback
      setCars(prev => prev.filter(car => car._id !== tempCar._id));
      toast.error('Xatolik yuz berdi');
    }
  };

  return { cars, createCar };
}
```

---

## � PWA O'RNATISH

### Android

1. Chrome brauzerda saytni oching
2. Menu → "Add to Home screen"
3. Nom kiriting va "Add" bosing
4. Ilova home screen'da paydo bo'ladi

### iOS (iPhone/iPad)

1. Safari brauzerda saytni oching
2. Share button → "Add to Home Screen"
3. Nom kiriting va "Add" bosing
4. Ilova home screen'da paydo bo'ladi

### Desktop (Chrome/Edge)

1. Address bar'da install icon'ni bosing
2. "Install" tugmasini bosing
3. Ilova alohida oynada ochiladi

---

## 🔍 PWA DEBUGGING

### Chrome DevTools

#### Application Tab
- **Manifest**: Manifest.json ko'rish
- **Service Workers**: SW holati va cache
- **Storage**: IndexedDB, LocalStorage
- **Cache Storage**: Cache'dagi fayllar

#### Network Tab
- **Offline mode**: Offline rejimni test qilish
- **Throttling**: Sekin internet simulyatsiya

#### Console
- Service Worker logs
- IndexedDB operations
- Network errors

### Lighthouse Audit

```bash
# Chrome DevTools → Lighthouse
# PWA audit qilish
```

**Tekshiriladigan narsalar:**
- ✅ HTTPS
- ✅ Service Worker
- ✅ Manifest.json
- ✅ Icons
- ✅ Offline support
- ✅ Fast loading
- ✅ Responsive design

---

## 📊 PWA PERFORMANCE METRICS

### Core Web Vitals

| Metric | Tavsif | Target |
|--------|--------|--------|
| **LCP** | Largest Contentful Paint | < 2.5s |
| **FID** | First Input Delay | < 100ms |
| **CLS** | Cumulative Layout Shift | < 0.1 |

### PWA Metrics

| Metric | Tavsif | Target |
|--------|--------|--------|
| **TTI** | Time to Interactive | < 3.8s |
| **FCP** | First Contentful Paint | < 1.8s |
| **Speed Index** | Visual progress | < 3.4s |

---

## 🚀 PWA BEST PRACTICES

### 1. Service Worker
- ✅ Cache static assets
- ✅ Network-first for API
- ✅ Fallback to cache
- ✅ Update strategy

### 2. Manifest
- ✅ Proper icons (192x192, 512x512)
- ✅ Theme color
- ✅ Display mode
- ✅ Start URL

### 3. Offline Support
- ✅ IndexedDB for data
- ✅ Queue for operations
- ✅ Background sync
- ✅ Error handling

### 4. Performance
- ✅ Code splitting
- ✅ Lazy loading
- ✅ Image optimization
- ✅ Minification

### 5. UX
- ✅ Loading states
- ✅ Offline indicator
- ✅ Sync status
- ✅ Error messages

---

## � PWA SECURITY

### HTTPS Required
PWA faqat HTTPS orqali ishlaydi (localhost bundan mustasno)

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';">
```

### Permissions
- Camera
- Geolocation
- Notifications
- Background Sync

---

## 📚 FOYDALI LINKLAR

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)

---

**Oxirgi yangilanish**: 2026-02-09  
**Versiya**: 1.0.0  
**Muallif**: Dalnoboy Shop Team

---

## 🎓 XULOSA

PWA - bu zamonaviy web ilovalar uchun eng yaxshi yechim. U:
- 📱 Mobil ilovalar kabi ishlaydi
- 🚀 Tez yuklanadi
- 📡 Offline ishlaydi
- 💾 Ma'lumotlarni mahalliy saqlaydi
- 🔄 Avtomatik sync qiladi
- 🎨 Yaxshi UX beradi

**Bizning loyihada** PWA to'liq qo'llab-quvvatlanadi va barcha zamonaviy texnologiyalar ishlatilgan.
