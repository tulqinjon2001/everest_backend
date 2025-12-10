# API Usage Examples

## Authentication

### Login (Teacher)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teacher",
    "password": "teacher123"
  }'
```

### Login (Student)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Groups (Teacher only)

### Create Group
```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Matematika 1-guruh",
    "startTime": "09:00",
    "endTime": "10:30",
    "daysOfWeek": ["Monday", "Wednesday", "Friday"]
  }'
```

### Get All Groups
```bash
curl -X GET http://localhost:5000/api/groups \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Group
```bash
curl -X PUT http://localhost:5000/api/groups/GROUP_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Group Name"
  }'
```

## Students (Teacher only)

### Create Student
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ali Valiyev",
    "phone": "+998901234567",
    "username": "student1",
    "password": "password123"
  }'
```

### Get All Students
```bash
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Add Student to Group
```bash
curl -X POST http://localhost:5000/api/groups/GROUP_ID/students/STUDENT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Homework

### Create Homework (Group Assignment - TEXT)
```bash
curl -X POST http://localhost:5000/api/homework \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Matematika vazifasi" \
  -F "description=5-mashqni bajaring" \
  -F "category=TEXT" \
  -F "assignmentType=group" \
  -F "groupId=GROUP_ID"
```

### Create Homework (Individual - FILE)
```bash
curl -X POST http://localhost:5000/api/homework \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Ingliz tili vazifasi" \
  -F "category=FILE" \
  -F "assignmentType=individual" \
  -F "studentId=STUDENT_ID" \
  -F "file=@/path/to/file.pdf"
```

### Create Homework (AUDIO)
```bash
curl -X POST http://localhost:5000/api/homework \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "name=Audio vazifa" \
  -F "category=AUDIO" \
  -F "assignmentType=group" \
  -F "groupId=GROUP_ID" \
  -F "file=@/path/to/audio.mp3"
```

### Get All Homeworks (Student)
```bash
curl -X GET http://localhost:5000/api/homework \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Submit Homework (TEXT)
```bash
curl -X POST http://localhost:5000/api/homework/HOMEWORK_ID/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "textContent=Men vazifani bajardim. Javoblar..."
```

### Submit Homework (FILE)
```bash
curl -X POST http://localhost:5000/api/homework/HOMEWORK_ID/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/submission.pdf"
```

### Review Submission (Teacher)
```bash
curl -X PUT http://localhost:5000/api/homework/submissions/SUBMISSION_ID/review \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "teacherComment": "Yaxshi ishladingiz!"
  }'
```

## Using with JavaScript/Fetch

### Login Example
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'teacher',
    password: 'teacher123'
  })
});

const data = await response.json();
const token = data.token;
localStorage.setItem('token', token);
```

### Create Homework with File Upload
```javascript
const formData = new FormData();
formData.append('name', 'Matematika vazifasi');
formData.append('description', '5-mashqni bajaring');
formData.append('category', 'FILE');
formData.append('assignmentType', 'group');
formData.append('groupId', 'GROUP_ID');
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:5000/api/homework', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
```

### Submit Homework
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch(`http://localhost:5000/api/homework/${homeworkId}/submit`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const data = await response.json();
if (data.success) {
  alert('Vazifa yuborildi! Endi uni o\'zgartirib bo\'lmaydi.');
}
```

