// src/App.tsx
import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentDashboard from './components/StudentDashboard';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));

  const handleLoginSuccess = (_newToken: string) => {
    setToken(localStorage.getItem('token'));
    setRole(localStorage.getItem('role'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('student');
    setToken(null);
    setRole(null);
  };

  // Nếu chưa đăng nhập, hiển thị màn hình Login
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Nếu là sinh viên, hiển thị giao diện StudentDashboard
  if (role === 'STUDENT') {
    return <StudentDashboard token={token} onLogout={handleLogout} />;
  }

  // Mặc định hiển thị giao diện Quản trị viên (Admin)
  return <Dashboard token={token} onLogout={handleLogout} />;
}