// src/routes/course.routes.ts
import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// 1. API Lấy danh sách toàn bộ môn học (GET)
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách môn học',
      error,
    });
  }
});

// 2. API Thêm mới một môn học (POST)
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, credits, semester } = req.body;

    // Kiểm tra xem người dùng có nhập đủ thông tin không
    if (!code || !name || !credits) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ mã môn (code), tên môn (name) và số tín chỉ (credits)!',
      });
    }

    const newCourse = await prisma.course.create({
      data: { 
        code, 
        name, 
        credits: Number(credits),
        semester: semester || 'Học kỳ 1' // Mặc định nếu không truyền
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Thêm môn học thành công!',
      data: newCourse,
    });
  } catch (error: any) {
    // Nếu mã môn (code) bị trùng
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Mã môn học này đã tồn tại trong hệ thống!',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm môn học',
      error: error.message,
    });
  }
});

// 3. API Cập nhật thông tin môn học (PUT)
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, credits, semester } = req.body;

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        code,
        name,
        credits: Number(credits),
        semester
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật môn học thành công!',
      data: updatedCourse,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Mã môn học này đã tồn tại ở môn khác!',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Cập nhật môn học thất bại!',
      error: error.message,
    });
  }
});

// 4. API Xóa môn học (DELETE)
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.course.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Xóa môn học thành công!',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Xóa môn học thất bại!',
      error: error.message,
    });
  }
});

export default router;