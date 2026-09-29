// src/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'university_secret_key_2026';

// 1. API Đăng ký tài khoản (Register)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, role } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ username, password và role (STUDENT hoặc ADMIN)!',
      });
    }

    // Kiểm tra xem username đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập (username) này đã tồn tại!',
      });
    }

    // Mã hóa mật khẩu trước khi lưu vào database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user mới trong cơ sở dữ liệu
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'STUDENT',
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: userWithoutPassword,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký tài khoản',
      error: error.message,
    });
  }
});

// 2. API Đăng nhập (Login cho Admin / User hệ thống)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp username và password!',
      });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác!',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác!',
      });
    }

    // Tạo JWT Token có hiệu lực trong 1 ngày
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      data: userWithoutPassword,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập',
      error: error.message,
    });
  }
});

// 3. API Đăng nhập dành riêng cho Sinh viên bằng MSSV
router.post('/student-login', async (req: Request, res: Response) => {
  try {
    const { mssv } = req.body;

    if (!mssv) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã số sinh viên (MSSV)!',
      });
    }

    // Tìm sinh viên trong bảng Student dựa vào mssv
    const student = await prisma.student.findUnique({
      where: { mssv },
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy mã số sinh viên này trong hệ thống!',
      });
    }

    // Tạo token xác thực cho sinh viên
    const token = jwt.sign(
      { studentId: student.id, mssv: student.mssv, role: 'STUDENT' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập sinh viên thành công!',
      token,
      data: student,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập sinh viên',
      error: error.message,
    });
  }
});

export default router;