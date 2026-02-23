# KERAKSIZ FAYLLAR — Tozalash ro'yxati

## O'chirish mumkin bo'lgan MD fayllar (16 ta → 3 taga kamaytirish)

AGENTS.md 890 qator bor, CLAUDE.md uni 60 qatorda almashtiradi. Qolganlar bir martalik yoki bo'sh.

| Fayl | Sabab | Hajm |
|------|-------|------|
| `AGENTS.md` | CLAUDE.md bilan almashtirildi | 890 qator |
| `ARCHITECTURE.md` | AGENTS.md ichida dublikat | katta |
| `AUTO_COMPLETE_README.md` | Bir martalik feature doc | o'rtacha |
| `BOOKING_OPTIMIZATION.md` | Bir martalik optimization doc | o'rtacha |
| `CARS_PERFORMANCE_OPTIMIZATION.md` | Bir martalik optimization doc | o'rtacha |
| `KUNLIK_ISHCHI_README.md` | Bir martalik feature doc | o'rtacha |
| `PWA_ICONS_README.md` | Bir martalik setup doc | o'rtacha |
| `PWA_TECHNICAL_GUIDE.md` | Bir martalik guide | o'rtacha |
| `STEP4_NEW_DESIGN.md` | Eskirgan design doc | o'rtacha |
| `FRONTEND_VPS_DEPLOY.md` | **Bo'sh fayl** (0 bytes) | 0 |
| `STEP4_SMART_CARDS_CODE.tsx` | **Bo'sh fayl** (0 bytes) | 0 |
| `VPS_DEPLOY_README.md` | Bir martalik deploy doc | o'rtacha |
| `VPS_FIX_COMMANDS.md` | Bir martalik fix commands | o'rtacha |
| `PROMPT.txt` | Eski prompt fayl | o'rtacha |
| `backend/TEST_WAREHOUSE_BOT.md` | Test qo'llanma | kichik |
| `backend/WAREHOUSE_BOT_README.md` | Feature doc | o'rtacha |

**Qoldirish kerak**: `README.md`, `CLAUDE.md`, `ISSUES.md`, `CLEANUP.md`

---

## O'chirish mumkin bo'lgan boshqa fayllar

| Fayl | Sabab |
|------|-------|
| `/sound.mp3` | 728 KB, maqsadi noma'lum. PWA uchun bo'lsa public/ ga ko'chirish kerak |
| `/ecosystem.config.js` (root) | Eskirgan, noto'g'ri path. Backend'dagi to'g'ri versiyasi bor |
| `.kiro/` | Bo'sh papka, ishlatilmayotgan |

---

## Git'dan chiqarish kerak (track qilmaslik)

| Fayl/Papka | Sabab |
|------------|-------|
| `backend/uploads/spare-parts/*.webp` | User upload fayllar git'da bo'lmasligi kerak |
| `backend/.env` | **CRITICAL**: Haqiqiy credentials. Git tarixdan ham tozalash kerak |
| `frontend/.env` | Google Maps API key ochiq |
| `.claude/` | IDE-specific papka |

---

## Token tejash hisobi

AGENTS.md har safar context'ga yuklanadi: **~890 qator ≈ ~4000 token**
CLAUDE.md faqat: **~60 qator ≈ ~300 token**

**Har bir suhbatda ~3700 token tejaladi** — bu katta farq, ayniqsa uzun sessiyalarda.
