// src/routes/enrollment.routes.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma'; // Import từ tệp cấu hình dùng chung

const router = Router();

// 1. Lấy danh sách đăng ký học phần toàn trường (Kèm theo thông tin sinh viên và môn học)
router.get('/', async (req, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        student: true,
        course: true,
      },
    });
    res.json({ success: true, data: enrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đăng ký học phần' });
  }
});

// 2. Đăng ký học phần mới
router.post('/', async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const newEnrollment = await prisma.enrollment.create({
      data: { studentId, courseId },
      include: {
        student: true,
        course: true,
      },
    });
    res.status(201).json({ success: true, message: 'Đăng ký học phần thành công!', data: newEnrollment });
  } catch (error: any) {
    res.status(400).json({ success: false, message: 'Sinh viên đã đăng ký môn học này rồi!' });
  }
});

// 3. Hủy đăng ký học phần (Dành cho Admin hủy khi sinh viên đăng ký nhầm)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.enrollment.delete({
      where: { id },
    });
    res.json({ success: true, message: 'Hủy đăng ký học phần thành công!' });
  } catch (error) {
    console.error('Lỗi khi hủy đăng ký:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi hủy đăng ký học phần' });
  }
});

export default router;