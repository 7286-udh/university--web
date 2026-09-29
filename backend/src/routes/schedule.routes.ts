// src/routes/schedule.routes.ts
import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// Lấy danh sách toàn bộ lịch học
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const schedules = await prisma.schedule.findMany({
      include: { course: true, student: true }
    });
    return res.status(200).json({ success: true, data: schedules });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Lỗi lấy lịch học', error: error.message });
  }
});

// Thêm lịch học
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, studentId, date, dayOfWeek, session, period, room, isOnline, type } = req.body;

    if (!courseId || !date || !dayOfWeek || !session || !period || !room) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin lịch học!' });
    }

    const newSchedule = await prisma.schedule.create({
      data: {
        courseId,
        studentId: studentId || null,
        date,
        dayOfWeek,
        session,
        period,
        room,
        isOnline: Boolean(isOnline),
        type: type || 'Lý thuyết'
      },
      include: { course: true, student: true }
    });

    return res.status(201).json({
      success: true,
      message: 'Thêm lịch học thành công!',
      data: newSchedule,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Thêm lịch học thất bại',
      error: error.message,
    });
  }
});

// Xóa lịch học
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.schedule.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Xóa lịch học thành công!' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Xóa lịch học thất bại', error: error.message });
  }
});

export default router;