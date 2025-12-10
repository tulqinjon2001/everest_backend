# Muammolarni Hal Qilish Qo'llanmasi

## "Invalid credentials" Xatosi

### Muammo:
Login qilishda "Invalid credentials" xatosi qaytmoqda.

### Sabablari va Yechimlari:

#### 1. Student hali yaratilmagan
**Muammo:** `student1` foydalanuvchisi mavjud emas.

**Yechim:**
1. Avval **o'qituvchi** sifatida login qiling:
   ```
   POST /api/auth/login
   {
     "username": "teacher",
     "password": "teacher123"
   }
   ```

2. Keyin student yarating:
   ```
   POST /api/students
   Authorization: Bearer YOUR_TEACHER_TOKEN
   {
     "fullName": "Ali Valiyev",
     "phone": "+998901234567",
     "username": "student1",
     "password": "password123"
   }
   ```

3. Endi student sifatida login qilish mumkin:
   ```
   POST /api/auth/login
   {
     "username": "student1",
     "password": "password123"
   }
   ```

#### 2. Parol noto'g'ri
**Muammo:** Parol noto'g'ri kiritilgan.

**Yechim:**
- Student yaratilganda kiritilgan parolni to'g'ri kiriting
- Parol katta-kichik harflarga sezgir (case-sensitive)

#### 3. Database'da student mavjud emas
**Muammo:** Student yaratilgan, lekin User account yaratilmagan.

**Yechim:**
- Student yaratishda avtomatik User account yaratiladi
- Agar muammo bo'lsa, student ni qayta yarating

---

## Tekshirish Usullari

### 1. Database'da User borligini tekshirish

MongoDB shell yoki MongoDB Compass da:

```javascript
use everest_homework
db.users.find({ username: "student1" })
```

Agar bo'sh bo'lsa, student yaratilmagan.

### 2. Student borligini tekshirish

```javascript
db.students.find({ username: "student1" })
```

### 3. Server loglarini ko'rish

Server console da quyidagi loglar ko'rinadi:
- `Login attempt failed: User 'student1' not found` - User topilmadi
- `Login attempt failed: Incorrect password for user 'student1'` - Parol noto'g'ri

---

## To'liq Test Jarayoni

### 1-qadam: Teacher login
```bash
POST http://localhost:5000/api/auth/login
Body: {
  "username": "teacher",
  "password": "teacher123"
}
```

### 2-qadam: Student yaratish
```bash
POST http://localhost:5000/api/students
Headers: {
  "Authorization": "Bearer YOUR_TEACHER_TOKEN"
}
Body: {
  "fullName": "Ali Valiyev",
  "phone": "+998901234567",
  "username": "student1",
  "password": "password123"
}
```

### 3-qadam: Student login
```bash
POST http://localhost:5000/api/auth/login
Body: {
  "username": "student1",
  "password": "password123"
}
```

---

## Boshqa Muammolar

### MongoDB ulanmagan
**Xato:** `MongoDB connection error`

**Yechim:**
- MongoDB ishlamoqda ekanligini tekshiring
- `.env` faylda `MONGODB_URI` to'g'ri ekanligini tekshiring

### Token ishlamayapti
**Xato:** `Not authorized to access this route`

**Yechim:**
- Token ni to'g'ri header da yuborish: `Authorization: Bearer TOKEN`
- Token muddati tugagan bo'lishi mumkin, qayta login qiling

### File upload ishlamayapti
**Xato:** File yuklanmayapti

**Yechim:**
- `Content-Type: multipart/form-data` ishlatilganligini tekshiring
- File formData da to'g'ri yuborilganligini tekshiring

