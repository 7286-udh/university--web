// src/components/Login.tsx
import { useState } from 'react';
import axios from 'axios';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [loginType, setLoginType] = useState<'admin' | 'student'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // State đăng nhập sinh viên
  const [mssv, setMssv] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  
  const [error, setError] = useState('');

  // Xử lý đăng nhập Admin
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const customAdminPassword = localStorage.getItem('admin_password');
    if (username === 'admin' && customAdminPassword) {
      if (password !== customAdminPassword) {
        setError('Mật khẩu quản trị không chính xác!');
        return;
      } else {
        const fakeToken = 'mock-admin-token-' + Date.now();
        localStorage.setItem('token', fakeToken);
        localStorage.setItem('role', 'ADMIN');
        onLoginSuccess(fakeToken);
        return;
      }
    }

    try {
      const response = await axios.post('https://university-web-u1xo.onrender.com/api/auth/login', {
        username,
        password,
      });
      
      const token = response.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('role', 'ADMIN');
      onLoginSuccess(token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập Admin thất bại!');
    }
  };

  // Xử lý đăng nhập Sinh viên bằng MSSV và Mật khẩu
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      // 1. Kiểm tra trong danh sách sinh viên lưu ở localStorage trước
      const savedStudents = localStorage.getItem('local_students_list');
      const studentList = savedStudents ? JSON.parse(savedStudents) : [];
      const foundStudent = studentList.find((s: any) => s.mssv === mssv);

      let studentData: any = null;
      let token = 'mock-student-token-' + Date.now();

      if (foundStudent) {
        // Kiểm tra mật khẩu trong từ điển hoặc từ thông tin sinh viên
        const studentPasswords = JSON.parse(localStorage.getItem('student_passwords') || '{}');
        const correctPassword = studentPasswords[mssv] || foundStudent.password || '123456';

        if (studentPassword !== correctPassword) {
          setError('Mật khẩu sinh viên không chính xác!');
          return;
        }
        studentData = foundStudent;
      } else {
        // Nếu không có trong danh sách local, thử gọi API backend xác thực MSSV
        try {
          const response = await axios.post('https://university-web-u1xo.onrender.com/api/auth/student-login', { mssv });
          studentData = response.data.data;
          token = response.data.token;

          const studentPasswords = JSON.parse(localStorage.getItem('student_passwords') || '{}');
          const correctPassword = studentPasswords[mssv] || '123456';

          if (studentPassword !== correctPassword) {
            setError('Mật khẩu sinh viên không chính xác!');
            return;
          }
        } catch {
          setError('Không tìm thấy tài khoản sinh viên với MSSV này!');
          return;
        }
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', 'STUDENT');
      localStorage.setItem('student', JSON.stringify(studentData)); 
      onLoginSuccess(token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập sinh viên thất bại!');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' }}>
      <form onSubmit={loginType === 'admin' ? handleAdminLogin : handleStudentLogin} style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '380px' }}>
        <h2 style={{ marginBottom: '15px', textAlign: 'center', color: '#1f2937' }}>Đăng Nhập Hệ Thống</h2>
        
        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #e5e7eb' }}>
          <button 
            type="button" 
            onClick={() => { setLoginType('admin'); setError(''); }}
            style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: loginType === 'admin' ? '2px solid #2563eb' : 'none', color: loginType === 'admin' ? '#2563eb' : '#6b7280', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Quản Trị Viên
          </button>
          <button 
            type="button" 
            onClick={() => { setLoginType('student'); setError(''); }}
            style={{ flex: 1, padding: '10px', background: 'none', border: 'none', borderBottom: loginType === 'student' ? '2px solid #2563eb' : 'none', color: loginType === 'student' ? '#2563eb' : '#6b7280', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Sinh Viên
          </button>
        </div>
        
        {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '13px', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
        
        {loginType === 'admin' ? (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Tên đăng nhập</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                placeholder="Nhập username..."
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Mật khẩu</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                placeholder="Nhập password..."
                required
              />
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Mã Số Sinh Viên (MSSV)</label>
              <input 
                type="text" 
                value={mssv} 
                onChange={(e) => setMssv(e.target.value)} 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                placeholder="Nhập MSSV..."
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>Mật khẩu sinh viên</label>
              <input 
                type="password" 
                value={studentPassword} 
                onChange={(e) => setStudentPassword(e.target.value)} 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                placeholder="Nhập mật khẩu (mặc định: 123456)..."
                required
              />
            </div>
          </>
        )}

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
          {loginType === 'admin' ? 'Đăng Nhập Quản Trị' : 'Đăng Nhập Sinh Viên'}
        </button>
      </form>
    </div>
  );
}