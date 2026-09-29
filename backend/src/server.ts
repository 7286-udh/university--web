// src/server.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import studentRoutes from './routes/student.routes';
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import enrollmentRoutes from './routes/enrollment.routes';
import scheduleRoutes from './routes/schedule.routes'; // <-- 1. Import route schedule

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Gắn các đường dẫn API
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/schedules', scheduleRoutes); // <-- 2. Đăng ký route schedule tại đây

app.get('/', (req, res) => {
  res.send('API University System is running smoothly!');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});