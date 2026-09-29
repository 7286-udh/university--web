// src/routes/student.routes.ts
import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// 1. API Lấy danh sách sinh viên (GET)
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const students = await prisma.student.findMany();
    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách sinh viên',
      error,
    });
  }
});

// 2. API Thêm mới sinh viên (POST)
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { mssv, fullName, email } = req.body;

    if (!mssv || !fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ mssv, fullName và email!',
      });
    }

    const newStudent = await prisma.student.create({
      data: { mssv, fullName, email },
    });

    return res.status(201).json({
      success: true,
      message: 'Thêm sinh viên thành công!',
      data: newStudent,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'MSSV hoặc Email này đã tồn tại trong hệ thống!',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi thêm sinh viên',
      error: error.message,
    });
  }
});

// 3. API Cập nhật thông tin sinh viên theo ID (PUT)
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { mssv, fullName, email } = req.body;

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { mssv, fullName, email },
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin sinh viên thành công!',
      data: updatedStudent,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên cần cập nhật!',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật sinh viên',
      error: error.message,
    });
  }
});

// 4. API Xóa sinh viên theo ID (DELETE)
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.student.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Xóa sinh viên thành công!',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên cần xóa!',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sinh viên',
      error: error.message,
    });
  }
});

export default router;