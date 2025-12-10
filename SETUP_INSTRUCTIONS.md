# Server O'rnatish va Ishlatish

## 1. Dependencies O'rnatish

```bash
npm install
```

## 2. Environment Variables

`.env` fayl yaratish (agar yo'q bo'lsa):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/everest_homework
JWT_SECRET=your_secret_key_here_change_in_production
JWT_EXPIRE=7d
```

## 3. MongoDB Ishga Tushirish

MongoDB server ishlamoqda ekanligini tekshiring:

```bash
# Windows da (agar service sifatida o'rnatilgan bo'lsa)
# MongoDB avtomatik ishga tushadi

# Yoki MongoDB Compass yoki boshqa client orqali ulanishni tekshiring
```

## 4. Server Ishga Tushirish

### Development (auto-reload bilan):
```bash
npm run dev
```

### Production:
```bash
npm start
```

## 5. Default Teacher

Server ishga tushganda **avtomatik** default teacher yaratiladi:

- **Username:** `teacher`
- **Password:** `teacher123`

Agar teacher allaqachon mavjud bo'lsa, yangi teacher yaratilmaydi.

## 6. Login Qilish

### Teacher Login:
```json
POST http://localhost:5000/api/auth/login
{
  "username": "teacher",
  "password": "teacher123"
}
```

### Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "teacher",
    "role": "teacher",
    "fullName": "Default Teacher",
    "phone": "+998901234567"
  }
}
```

## 7. Student Yaratish

Teacher login qilgandan keyin, student yaratish:

```json
POST http://localhost:5000/api/students
Authorization: Bearer YOUR_TEACHER_TOKEN

{
  "fullName": "Ali Valiyev",
  "phone": "+998901234567",
  "username": "student1",
  "password": "password123"
}
```

## 8. Student Login

Student yaratilgandan keyin:

```json
POST http://localhost:5000/api/auth/login
{
  "username": "student1",
  "password": "password123"
}
```

---

## Muammolarni Hal Qilish

### "User 'teacher' not found" Xatosi

**Sabab:** Server ishga tushganda teacher yaratilmagan.

**Yechim:**
1. Server ni to'xtating (Ctrl+C)
2. Qayta ishga tushiring: `npm start` yoki `npm run dev`
3. Server console da quyidagi xabar ko'rinishi kerak:
   ```
   Default teacher created:
     Username: teacher
     Password: teacher123
   ```

### MongoDB Connection Error

**Yechim:**
- MongoDB ishlamoqda ekanligini tekshiring
- `.env` faylda `MONGODB_URI` to'g'ri ekanligini tekshiring
- MongoDB port 27017 da ochiq ekanligini tekshiring

### Port Already in Use

**Yechim:**
- Boshqa port ishlatish: `.env` da `PORT=5001` qo'shing
- Yoki 5000 portni ishlatayotgan boshqa dasturni to'xtating

---

## Server Console Loglari

Muvaffaqiyatli ishga tushganda quyidagi loglar ko'rinadi:

```
MongoDB connected
Default teacher created:
  Username: teacher
  Password: teacher123
  Please change the password after first login!
Server running on port 5000
```

Agar teacher allaqachon mavjud bo'lsa, faqat:
```
MongoDB connected
Server running on port 5000
```


