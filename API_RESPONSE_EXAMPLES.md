# API Response Examples - Qanday Ma'lumot Olinadi

## 1. LOGIN - Foydalanuvchi Kirish

### Request:
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "username": "teacher",
  "password": "teacher123"
}
```

### Response (Muvaffaqiyatli):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "username": "teacher",
    "role": "teacher",
    "fullName": "Default Teacher",
    "phone": "+998901234567",
    "studentInfo": null
  }
}
```

### Response (Xato):
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## 2. GET CURRENT USER - Joriy Foydalanuvchi Ma'lumotlari

### Request:
```javascript
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response (Teacher):
```json
{
  "success": true,
  "user": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "username": "teacher",
    "role": "teacher",
    "fullName": "Default Teacher",
    "phone": "+998901234567",
    "studentInfo": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Response (Student):
```json
{
  "success": true,
  "user": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k2",
    "username": "student1",
    "role": "student",
    "fullName": "Ali Valiyev",
    "phone": "+998901234567",
    "studentId": "64a1b2c3d4e5f6g7h8i9j0k3",
    "studentInfo": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
      "fullName": "Ali Valiyev",
      "phone": "+998901234567",
      "username": "student1",
      "groupId": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
        "name": "Matematika 1-guruh",
        "startTime": "09:00",
        "endTime": "10:30",
        "daysOfWeek": ["Monday", "Wednesday", "Friday"]
      }
    }
  }
}
```

---

## 3. GET ALL GROUPS - Barcha Guruhlar (Teacher)

### Request:
```javascript
GET /api/groups
Authorization: Bearer YOUR_TOKEN
```

### Response:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
      "name": "Matematika 1-guruh",
      "startTime": "09:00",
      "endTime": "10:30",
      "daysOfWeek": ["Monday", "Wednesday", "Friday"],
      "teacherId": "64a1b2c3d4e5f6g7h8i9j0k1",
      "students": [
        {
          "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
          "fullName": "Ali Valiyev",
          "phone": "+998901234567",
          "username": "student1"
        },
        {
          "_id": "64a1b2c3d4e5f6g7h8i9j0k5",
          "fullName": "Vali Aliyev",
          "phone": "+998901234568",
          "username": "student2"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 4. GET SINGLE GROUP - Bitta Guruh

### Request:
```javascript
GET /api/groups/64a1b2c3d4e5f6g7h8i9j0k4
Authorization: Bearer YOUR_TOKEN
```

### Response:
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
    "name": "Matematika 1-guruh",
    "startTime": "09:00",
    "endTime": "10:30",
    "daysOfWeek": ["Monday", "Wednesday", "Friday"],
    "teacherId": "64a1b2c3d4e5f6g7h8i9j0k1",
    "students": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
        "fullName": "Ali Valiyev",
        "phone": "+998901234567",
        "username": "student1"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 5. GET ALL STUDENTS - Barcha O'quvchilar (Teacher)

### Request:
```javascript
GET /api/students
Authorization: Bearer YOUR_TOKEN
```

### Response:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
      "fullName": "Ali Valiyev",
      "phone": "+998901234567",
      "username": "student1",
      "teacherId": "64a1b2c3d4e5f6g7h8i9j0k1",
      "groupId": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
        "name": "Matematika 1-guruh"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 6. GET SINGLE STUDENT - Bitta O'quvchi (Teacher uchun)

### Request:
```javascript
GET /api/students/64a1b2c3d4e5f6g7h8i9j0k3
Authorization: Bearer YOUR_TOKEN
```

### Response:
```json
{
  "success": true,
  "data": {
    "student": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
      "fullName": "Ali Valiyev",
      "phone": "+998901234567",
      "username": "student1",
      "groupId": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
        "name": "Matematika 1-guruh",
        "startTime": "09:00",
        "endTime": "10:30",
        "daysOfWeek": ["Monday", "Wednesday", "Friday"]
      }
    },
    "homeworks": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k6",
        "name": "Matematika vazifasi",
        "description": "5-mashqni bajaring",
        "category": "TEXT",
        "fileUrl": null,
        "teacherId": "64a1b2c3d4e5f6g7h8i9j0k1",
        "groupId": "64a1b2c3d4e5f6g7h8i9j0k4",
        "studentId": null,
        "assignmentType": "group",
        "status": "new",
        "submission": {
          "_id": "64a1b2c3d4e5f6g7h8i9j0k7",
          "homeworkId": "64a1b2c3d4e5f6g7h8i9j0k6",
          "studentId": "64a1b2c3d4e5f6g7h8i9j0k3",
          "submissionType": "TEXT",
          "textContent": "Men vazifani bajardim...",
          "fileUrl": null,
          "status": "pending",
          "teacherComment": null,
          "submittedAt": "2024-01-16T10:30:00.000Z"
        },
        "canSubmit": false
      }
    ]
  }
}
```

---

## 7. GET ALL HOMEWORKS - Barcha Vazifalar

### Request (Teacher):
```javascript
GET /api/homework
Authorization: Bearer YOUR_TOKEN
```

### Response (Teacher):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k6",
      "name": "Matematika vazifasi",
      "description": "5-mashqni bajaring",
      "category": "TEXT",
      "fileUrl": null,
      "teacherId": "64a1b2c3d4e5f6g7h8i9j0k1",
      "groupId": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
        "name": "Matematika 1-guruh"
      },
      "studentId": null,
      "assignmentType": "group",
      "status": "new",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k8",
      "name": "Ingliz tili vazifasi",
      "description": "Essay yozing",
      "category": "FILE",
      "fileUrl": "/uploads/file/1234567890-abc123.pdf",
      "teacherId": "64a1b2c3d4e5f6g7h8i9j0k1",
      "groupId": null,
      "studentId": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
        "fullName": "Ali Valiyev"
      },
      "assignmentType": "individual",
      "status": "new",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

### Request (Student):
```javascript
GET /api/homework
Authorization: Bearer YOUR_TOKEN
```

### Response (Student):
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k6",
      "name": "Matematika vazifasi",
      "description": "5-mashqni bajaring",
      "category": "TEXT",
      "fileUrl": null,
      "groupId": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
        "name": "Matematika 1-guruh"
      },
      "assignmentType": "group",
      "status": "new",
      "submission": null,
      "canSubmit": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k8",
      "name": "Ingliz tili vazifasi",
      "description": "Essay yozing",
      "category": "FILE",
      "fileUrl": "/uploads/file/1234567890-abc123.pdf",
      "studentId": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
        "fullName": "Ali Valiyev"
      },
      "assignmentType": "individual",
      "status": "new",
      "submission": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k9",
        "status": "pending",
        "submittedAt": "2024-01-16T10:30:00.000Z"
      },
      "canSubmit": false,
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---

## 8. GET SINGLE HOMEWORK - Bitta Vazifa

### Request (Teacher):
```javascript
GET /api/homework/64a1b2c3d4e5f6g7h8i9j0k6
Authorization: Bearer YOUR_TOKEN
```

### Response (Group Assignment):
```json
{
  "success": true,
  "data": {
    "homework": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k6",
      "name": "Matematika vazifasi",
      "description": "5-mashqni bajaring",
      "category": "TEXT",
      "fileUrl": null,
      "teacherId": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
        "fullName": "Default Teacher"
      },
      "groupId": {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
        "name": "Matematika 1-guruh"
      },
      "assignmentType": "group",
      "status": "new"
    },
    "submissions": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k7",
        "homeworkId": "64a1b2c3d4e5f6g7h8i9j0k6",
        "studentId": {
          "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
          "fullName": "Ali Valiyev"
        },
        "submissionType": "TEXT",
        "textContent": "Men vazifani bajardim...",
        "status": "pending",
        "teacherComment": null,
        "submittedAt": "2024-01-16T10:30:00.000Z"
      }
    ],
    "groupStudents": [
      {
        "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
        "fullName": "Ali Valiyev",
        "phone": "+998901234567",
        "username": "student1"
      }
    ]
  }
}
```

### Request (Student):
```javascript
GET /api/homework/64a1b2c3d4e5f6g7h8i9j0k6
Authorization: Bearer YOUR_TOKEN
```

### Response (Student):
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k6",
    "name": "Matematika vazifasi",
    "description": "5-mashqni bajaring",
    "category": "TEXT",
    "fileUrl": null,
    "groupId": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k4",
      "name": "Matematika 1-guruh"
    },
    "assignmentType": "group",
    "status": "new",
    "submission": null,
    "canSubmit": true
  }
}
```

---

## 9. SUBMIT HOMEWORK - Vazifa Yuborish (Student)

### Request (TEXT):
```javascript
POST /api/homework/64a1b2c3d4e5f6g7h8i9j0k6/submit
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

textContent: "Men vazifani bajardim. Javoblar..."
```

### Request (FILE):
```javascript
POST /api/homework/64a1b2c3d4e5f6g7h8i9j0k8/submit
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

file: [binary file data]
```

### Response:
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k7",
    "homeworkId": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k6",
      "name": "Matematika vazifasi",
      "description": "5-mashqni bajaring",
      "category": "TEXT"
    },
    "studentId": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
      "fullName": "Ali Valiyev"
    },
    "submissionType": "TEXT",
    "textContent": "Men vazifani bajardim. Javoblar...",
    "fileUrl": null,
    "status": "pending",
    "teacherComment": null,
    "submittedAt": "2024-01-16T10:30:00.000Z"
  },
  "message": "Homework submitted successfully. You cannot change it after submission."
}
```

### Response (Xato - Qayta yuborishga urinish):
```json
{
  "success": false,
  "message": "Homework has already been submitted and cannot be resubmitted"
}
```

---

## 10. GET SUBMISSION - Vazifa Topshirish Ma'lumotlari

### Request:
```javascript
GET /api/homework/submissions/64a1b2c3d4e5f6g7h8i9j0k7
Authorization: Bearer YOUR_TOKEN
```

### Response:
```json
{
  "success": true,
  "data": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k7",
    "homeworkId": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k6",
      "name": "Matematika vazifasi",
      "description": "5-mashqni bajaring",
      "category": "TEXT",
      "fileUrl": null
    },
    "studentId": {
      "_id": "64a1b2c3d4e5f6g7h8i9j0k3",
      "fullName": "Ali Valiyev",
      "phone": "+998901234567"
    },
    "submissionType": "TEXT",
    "textContent": "Men vazifani bajardim. Javoblar...",
    "fileUrl": null,
    "status": "approved",
    "teacherComment": "Yaxshi ishladingiz!",
    "submittedAt": "2024-01-16T10:30:00.000Z",
    "createdAt": "2024-01-16T10:30:00.000Z",
    "updatedAt": "2024-01-16T11:00:00.000Z"
  }
}
```

---

## Frontend da Foydalanish Misollari

### JavaScript/Fetch bilan:

```javascript
// 1. Login qilish
async function login(username, password) {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  if (data.success) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }
  throw new Error(data.message);
}

// 2. Token bilan ma'lumot olish
async function getGroups() {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/groups', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.data; // groups array
}

// 3. Vazifalarni olish
async function getHomeworks() {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/homework', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.data; // homeworks array
}

// 4. Vazifa yuborish (File bilan)
async function submitHomework(homeworkId, file) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(
    `http://localhost:5000/api/homework/${homeworkId}/submit`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );
  
  const data = await response.json();
  return data;
}

// 5. TEXT vazifa yuborish
async function submitTextHomework(homeworkId, textContent) {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('textContent', textContent);
  
  const response = await fetch(
    `http://localhost:5000/api/homework/${homeworkId}/submit`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );
  
  const data = await response.json();
  return data;
}
```

### React Hook Misoli:

```javascript
import { useState, useEffect } from 'react';

function HomeworksList() {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchHomeworks() {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:5000/api/homework', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setHomeworks(data.data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHomeworks();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {homeworks.map(hw => (
        <div key={hw._id}>
          <h3>{hw.name}</h3>
          <p>{hw.description}</p>
          <p>Status: {hw.status}</p>
          {hw.submission && (
            <p>Topshirilgan: {hw.submission.status}</p>
          )}
          {hw.canSubmit && (
            <button>Vazifani yuborish</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Muhim Eslatmalar:

1. **Token**: Har bir request da `Authorization: Bearer TOKEN` header qo'shish kerak
2. **Response Format**: Barcha muvaffaqiyatli javoblar `{ success: true, data: ... }` formatida
3. **Xato Format**: Xatolar `{ success: false, message: "..." }` formatida
4. **File Upload**: File yuklashda `multipart/form-data` ishlatiladi
5. **Status Codes**: 
   - 200: Muvaffaqiyatli
   - 400: Noto'g'ri so'rov
   - 401: Autentifikatsiya xatosi
   - 403: Ruxsat yo'q
   - 404: Topilmadi
   - 500: Server xatosi

