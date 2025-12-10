# Tezkor Boshlash Qo'llanmasi

## 1. Login qilish va Token olish

```javascript
// Login
const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'teacher',
    password: 'teacher123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.token; // Token ni saqlash kerak!
```

## 2. Ma'lumotlarni olish (GET requests)

### Guruhlar ro'yxati:
```javascript
const response = await fetch('http://localhost:5000/api/groups', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
const groups = data.data; // Array of groups
```

### O'quvchilar ro'yxati:
```javascript
const response = await fetch('http://localhost:5000/api/students', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
const students = data.data; // Array of students
```

### Vazifalar ro'yxati:
```javascript
const response = await fetch('http://localhost:5000/api/homework', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
const homeworks = data.data; // Array of homeworks
```

### Bitta vazifa:
```javascript
const response = await fetch(`http://localhost:5000/api/homework/${homeworkId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
const homework = data.data; // Single homework object
```

## 3. Ma'lumot yaratish (POST requests)

### Guruh yaratish:
```javascript
const response = await fetch('http://localhost:5000/api/groups', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Matematika 1-guruh',
    startTime: '09:00',
    endTime: '10:30',
    daysOfWeek: ['Monday', 'Wednesday', 'Friday']
  })
});
const data = await response.json();
const newGroup = data.data;
```

### O'quvchi yaratish:
```javascript
const response = await fetch('http://localhost:5000/api/students', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fullName: 'Ali Valiyev',
    phone: '+998901234567',
    username: 'student1',
    password: 'password123'
  })
});
const data = await response.json();
const newStudent = data.data;
```

### Vazifa yaratish (File bilan):
```javascript
const formData = new FormData();
formData.append('name', 'Matematika vazifasi');
formData.append('description', '5-mashqni bajaring');
formData.append('category', 'FILE');
formData.append('assignmentType', 'group');
formData.append('groupId', groupId);
formData.append('file', fileInput.files[0]); // File input

const response = await fetch('http://localhost:5000/api/homework', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
const data = await response.json();
const newHomework = data.data;
```

## 4. Vazifa yuborish (Student)

### TEXT vazifa:
```javascript
const formData = new FormData();
formData.append('textContent', 'Men vazifani bajardim...');

const response = await fetch(
  `http://localhost:5000/api/homework/${homeworkId}/submit`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  }
);
const data = await response.json();
```

### FILE vazifa:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch(
  `http://localhost:5000/api/homework/${homeworkId}/submit`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  }
);
const data = await response.json();
```

## 5. Response Format

### Muvaffaqiyatli:
```json
{
  "success": true,
  "data": { ... },
  "count": 5  // Faqat list larda
}
```

### Xato:
```json
{
  "success": false,
  "message": "Error message"
}
```

## 6. Status Kodlar

- **200**: Muvaffaqiyatli
- **201**: Yaratildi (POST)
- **400**: Noto'g'ri so'rov
- **401**: Token yo'q yoki noto'g'ri
- **403**: Ruxsat yo'q
- **404**: Topilmadi
- **500**: Server xatosi

## 7. Frontend da Umumiy Pattern

```javascript
// Helper function
async function apiRequest(url, options = {}) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:5000${url}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  return data;
}

// Foydalanish:
const groups = await apiRequest('/api/groups');
console.log(groups.data);

const newGroup = await apiRequest('/api/groups', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Yangi guruh',
    startTime: '09:00',
    endTime: '10:30',
    daysOfWeek: ['Monday']
  })
});
```

## 8. O'quvchi uchun Vazifalar

O'quvchi login qilgandan keyin:

```javascript
// O'quvchining barcha vazifalari
const response = await fetch('http://localhost:5000/api/homework', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

data.data.forEach(homework => {
  console.log(homework.name);
  console.log('Status:', homework.status);
  console.log('Can submit:', homework.canSubmit);
  if (homework.submission) {
    console.log('Topshirilgan:', homework.submission.status);
  }
});
```

## 9. O'qituvchi uchun O'quvchi Ma'lumotlari

```javascript
// O'quvchining barcha vazifalari va topshirishlari
const response = await fetch(`http://localhost:5000/api/students/${studentId}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

console.log('O\'quvchi:', data.data.student);
console.log('Vazifalar:', data.data.homeworks);

data.data.homeworks.forEach(hw => {
  console.log(hw.name);
  if (hw.submission) {
    console.log('Topshirilgan:', hw.submission.status);
  }
});
```

## 10. Vazifani Tekshirish (Teacher)

```javascript
const response = await fetch(
  `http://localhost:5000/api/homework/submissions/${submissionId}/review`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'approved', // yoki 'rejected'
      teacherComment: 'Yaxshi ishladingiz!'
    })
  }
);
const data = await response.json();
```

