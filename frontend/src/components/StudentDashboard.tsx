// src/components/StudentDashboard.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle, Plus, Trash2, Edit, Video, MapPin, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp, Lock, Bell, FileText, Upload, Award, Key } from 'lucide-react';

interface StudentDashboardProps {
  token: string;
  onLogout: () => void;
}

export default function StudentDashboard({ token, onLogout }: StudentDashboardProps) {
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'register' | 'schedule' | 'submissions' | 'grades'>('register');
  const [message, setMessage] = useState('');
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-09-28'));
  const [openSemesters, setOpenSemesters] = useState<{ [key: string]: boolean }>({});

  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // State đổi mật khẩu sinh viên
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // State nộp bài / đề tài
  const [projectTitle, setProjectTitle] = useState('');
  const [projectCourseId, setProjectCourseId] = useState('');
  const [productLink, setProductLink] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);

  // State điểm số toàn trường do Admin nhập
  const [studentGrades, setStudentGrades] = useState<any[]>([]);

  const [semesterRegistrationStatus, setSemesterRegistrationStatus] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('semesterRegistrationStatus');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('2026-09-28');
  const [dayOfWeek, setDayOfWeek] = useState('Thứ 2');
  const [session, setSession] = useState('Sáng');
  const [period, setPeriod] = useState('Tiết 1 - 3');
  const [room, setRoom] = useState('Phòng A101');
  const [isOnline, setIsOnline] = useState(false);
  const [type, setType] = useState('Lý thuyết');

  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editCourseId, setEditCourseId] = useState('');
  const [editScheduleDate, setEditScheduleDate] = useState('');
  const [editDayOfWeek, setEditDayOfWeek] = useState('');
  const [editSession, setEditSession] = useState('Sáng');
  const [editPeriod, setEditPeriod] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editIsOnline, setEditIsOnline] = useState(false);
  const [editType, setEditType] = useState('Lý thuyết');

  const getDaysInWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    const weekDays = [];
    const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      const year = nextDay.getFullYear();
      const month = String(nextDay.getMonth() + 1).padStart(2, '0');
      const dayNum = String(nextDay.getDate()).padStart(2, '0');
      
      weekDays.push({
        label: dayLabels[i],
        date: `${dayNum}/${month}/${year}`,
        rawDate: `${year}-${month}-${dayNum}`
      });
    }
    return weekDays;
  };

  const daysInWeek = getDaysInWeek(currentDate);

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  useEffect(() => {
    const storedStudent = localStorage.getItem('student');
    if (storedStudent) {
      const parsed = JSON.parse(storedStudent);
      setStudentInfo(parsed);
      if (parsed?.mssv) {
        const savedNotifs = JSON.parse(localStorage.getItem(`notifications_${parsed.mssv}`) || '[]');
        setNotifications(savedNotifs);
      }
    }

    try {
      const savedSubs = localStorage.getItem('student_submissions');
      if (savedSubs) setSubmissions(JSON.parse(savedSubs));

      const savedGrades = localStorage.getItem('student_academic_grades');
      if (savedGrades) setStudentGrades(JSON.parse(savedGrades));
    } catch (e) {}

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resCou, resSch, resEnr] = await Promise.all([
        axios.get('http://localhost:3000/api/courses', { headers }),
        axios.get('http://localhost:3000/api/schedules', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('http://localhost:3000/api/enrollments', { headers })
      ]);
      
      const courseList = resCou.data.data || resCou.data || [];
      setCourses(Array.isArray(courseList) ? courseList : []);

      const scheduleList = resSch.data.data || resSch.data || [];
      setSchedules(Array.isArray(scheduleList) ? scheduleList : []);

      const enrollList = resEnr.data.data || resEnr.data || [];
      setMyEnrollments(Array.isArray(enrollList) ? enrollList : []);

      if (courseList.length > 0 && !selectedCourseId) setSelectedCourseId(courseList[0].id);
      if (courseList.length > 0 && !projectCourseId) setProjectCourseId(courseList[0].id);

      const semMap: { [key: string]: boolean } = {};
      courseList.forEach((c: any) => { semMap[c.semester || 'Học kỳ 1'] = true; });
      setOpenSemesters(semMap);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    }
  };

  const toggleSemester = (sem: string) => {
    setOpenSemesters(prev => ({ ...prev, [sem]: !prev[sem] }));
  };

  const handleStudentChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('⚠️ Vui lòng nhập đầy đủ thông tin!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('⚠️ Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    const currentMssv = studentInfo?.mssv;
    const studentPasswords = JSON.parse(localStorage.getItem('student_passwords') || '{}');
    const currentCorrectPassword = studentPasswords[currentMssv] || '123456';

    if (oldPassword !== currentCorrectPassword) {
      setPasswordMessage('⚠️ Mật khẩu cũ không chính xác!');
      return;
    }

    studentPasswords[currentMssv] = newPassword;
    localStorage.setItem('student_passwords', JSON.stringify(studentPasswords));

    const savedStudents = localStorage.getItem('local_students_list');
    if (savedStudents) {
      const studentList = JSON.parse(savedStudents);
      const updatedList = studentList.map((s: any) => {
        if (s.mssv === currentMssv) {
          return { ...s, password: newPassword };
        }
        return s;
      });
      localStorage.setItem('local_students_list', JSON.stringify(updatedList));
    }

    setPasswordMessage('✅ Đổi mật khẩu thành công!');
    setTimeout(() => {
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('');
    }, 1500);
  };

  const handleRegisterCourse = async (courseId: string, semesterName: string) => {
    if (!studentInfo) return;
    const isOpen = !!semesterRegistrationStatus[semesterName];
    if (!isOpen) {
      setMessage(`⚠️ Cổng đăng ký học phần cho [${semesterName}] hiện đang bị KHÓA bởi Admin.`);
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/enrollments', { studentId: studentInfo.id, courseId }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Đăng ký học phần thành công!');
      fetchData();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Đăng ký thất bại!');
    }
  };

  const handleCreatePersonalSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !studentInfo) return;
    try {
      await axios.post('http://localhost:3000/api/schedules', {
        courseId: selectedCourseId, studentId: studentInfo.id, date: scheduleDate, dayOfWeek, session, period,
        room: isOnline ? 'Học trực tuyến (Online)' : room, isOnline, type
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Đã thêm lịch học cá nhân thành công!');
      fetchData();
    } catch (err: any) {
      setMessage('Thêm lịch học thất bại!');
    }
  };

  const handleStartEditSchedule = (sch: any) => {
    if (sch.type === 'Thi') {
      setMessage('⚠️ Sinh viên không có quyền chỉnh sửa hoặc thay đổi lịch thi!');
      return;
    }
    setEditingScheduleId(sch.id);
    setEditCourseId(sch.courseId || sch.course?.id || '');
    setEditScheduleDate(sch.date || '2026-09-28');
    setEditDayOfWeek(sch.dayOfWeek || 'Thứ 2');
    setEditSession(sch.session || 'Sáng');
    setEditPeriod(sch.period || 'Tiết 1 - 3');
    setEditRoom(sch.room || 'Phòng A101');
    setEditIsOnline(sch.isOnline || false);
    setEditType(sch.type || 'Lý thuyết');
  };

  const handleSaveEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScheduleId || !studentInfo) return;
    if (editType === 'Thi') {
      setMessage('⚠️ Sinh viên không được phép đổi lịch thành Lịch thi!');
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`http://localhost:3000/api/schedules/${editingScheduleId}`, { headers }).catch(() => {});
      await axios.post('http://localhost:3000/api/schedules', {
        studentId: studentInfo.id, courseId: editCourseId, date: editScheduleDate, dayOfWeek: editDayOfWeek,
        session: editSession, period: editPeriod, room: editRoom, isOnline: editIsOnline, type: editType
      }, { headers });
      setMessage('Cập nhật lịch học thành công!');
      setEditingScheduleId(null);
      fetchData();
    } catch (err) {
      setMessage('Cập nhật lịch thất bại!');
    }
  };

  const handleDeleteSchedule = async (sch: any) => {
    if (sch.type === 'Thi') {
      setMessage('⚠️ Sinh viên không có quyền xóa lịch thi do nhà trường quản lý!');
      return;
    }
    if (!window.confirm('Bạn có chắc muốn xóa lịch học này?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/schedules/${sch.id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Đã xóa lịch học!');
      fetchData();
    } catch (err) {
      setMessage('Xóa thất bại!');
    }
  };

  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle || !projectCourseId || !productLink) {
      setMessage('⚠️ Vui lòng điền đầy đủ thông tin đề tài và link sản phẩm!');
      return;
    }
    const selectedCourse = courses.find((c: any) => c.id === projectCourseId);
    const newSub = {
      id: Date.now().toString(), studentId: studentInfo?.id, mssv: studentInfo?.mssv,
      studentName: studentInfo?.fullName, courseId: projectCourseId,
      courseName: selectedCourse?.name || 'Môn học', courseCode: selectedCourse?.code || 'CODE',
      projectTitle, productLink, submittedAt: new Date().toLocaleString('vi-VN'),
      score: null, feedback: null, status: 'Đã nộp'
    };
    const updated = [newSub, ...submissions.filter(s => s.studentId !== studentInfo?.id || s.courseId !== projectCourseId)];
    setSubmissions(updated);
    localStorage.setItem('student_submissions', JSON.stringify(updated));
    setMessage('Đăng ký đề tài và nộp sản phẩm thành công!');
    setProjectTitle(''); setProductLink('');
  };

  const currentStudentEnrollments = myEnrollments.filter((en: any) => en.student?.mssv === studentInfo?.mssv);
  const registeredCourseIds = new Set(currentStudentEnrollments.map((en: any) => en.course?.id));
  
  const mySchedules = schedules.filter((sch: any) => 
    sch.studentId === studentInfo?.id || (!sch.studentId && registeredCourseIds.has(sch.courseId))
  );

  const mySubmissions = submissions.filter((s: any) => s.studentId === studentInfo?.id);
  const myGrades = studentGrades.filter((g: any) => g.studentId === studentInfo?.id);

  let totalGradePoints10 = 0;
  let totalGradePoints4 = 0;
  let totalCredits = 0;

  myGrades.forEach((g: any) => {
    if (g.score10 !== null && g.score10 !== undefined) {
      const cr = Number(g.credits) || 3;
      const sc10 = Number(g.score10);
      const sc4 = Number(g.score4) || 0;
      totalGradePoints10 += sc10 * cr;
      totalGradePoints4 += sc4 * cr;
      totalCredits += cr;
    }
  });

  const gpa10 = totalCredits > 0 ? (totalGradePoints10 / totalCredits).toFixed(2) : '0.00';
  const gpa4 = totalCredits > 0 ? (totalGradePoints4 / totalCredits).toFixed(2) : '0.00';

  const coursesBySemester = courses.reduce((acc: any, course: any) => {
    const sem = course.semester || 'Học kỳ 1';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(course);
    return acc;
  }, {});
  const sortedSemesters = Object.keys(coursesBySemester).sort();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e3a8a', color: 'white', padding: '12px 30px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>🎓 Cổng Thông Tin Sinh Viên</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setActiveTab('register')} style={{ padding: '6px 12px', background: activeTab === 'register' ? '#2563eb' : 'transparent', color: 'white', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Đăng Ký Học Phần</button>
            <button onClick={() => setActiveTab('schedule')} style={{ padding: '6px 12px', background: activeTab === 'schedule' ? '#2563eb' : 'transparent', color: 'white', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Thời Khóa Biểu Lưới</button>
            <button onClick={() => setActiveTab('submissions')} style={{ padding: '6px 12px', background: activeTab === 'submissions' ? '#2563eb' : 'transparent', color: 'white', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><FileText size={14} /> Đề Tài</button>
            <button onClick={() => setActiveTab('grades')} style={{ padding: '6px 12px', background: activeTab === 'grades' ? '#2563eb' : 'transparent', color: 'white', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}><Award size={14} /> Bảng Điểm & GPA</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '14px' }}>
          {/* Nút Đổi Mật Khẩu */}
          <button 
            onClick={() => setShowPasswordModal(true)} 
            style={{ padding: '6px 12px', backgroundColor: '#2563eb', color: 'white', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Key size={14} /> Đổi Mật Khẩu
          </button>

          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', padding: '6px' }}
              title="Thông báo"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span style={{ position: 'absolute', top: '0px', right: '0px', backgroundColor: '#dc2626', color: 'white', fontSize: '10px', fontWeight: 'bold', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={{ position: 'absolute', right: 0, top: '35px', width: '320px', backgroundColor: 'white', color: '#1f2937', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1100, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                  <span>🔔 Thông báo hệ thống ({notifications.length})</span>
                  <button onClick={() => { setNotifications([]); if (studentInfo?.mssv) localStorage.setItem(`notifications_${studentInfo.mssv}`, JSON.stringify([])); }} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Xóa tất cả</button>
                </div>
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>Không có thông báo mới</div>
                  ) : (
                    notifications.map((notif, idx) => (
                      <div key={idx} style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', lineHeight: '1.4', color: '#334155' }}>
                        {notif}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {studentInfo && <span>👤 <strong>{studentInfo.fullName}</strong></span>}
          <button onClick={onLogout} style={{ padding: '6px 12px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Đăng Xuất</button>
        </div>
      </nav>

      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
        {message && <div style={{ padding: '10px 15px', backgroundColor: message.includes('⚠️') ? '#fef2f2' : '#d1fae5', color: message.includes('⚠️') ? '#991b1b' : '#065f46', marginBottom: '20px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', border: message.includes('⚠️') ? '1px solid #fecaca' : 'none' }}>{message}</div>}

        {activeTab === 'register' ? (
          <div>
            <h3 style={{ marginBottom: '20px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={20} /> Đăng Ký Học Phần</h3>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {sortedSemesters.map((semName) => {
                const isOpen = openSemesters[semName] ?? true;
                const semCourses = coursesBySemester[semName];
                const isRegistrationOpen = !!semesterRegistrationStatus[semName];

                return (
                  <div key={semName} style={{ marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                    <div onClick={() => toggleSemester(semName)} style={{ backgroundColor: '#f3f4f6', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold', color: '#1e3a8a' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📌 {semName} ({semCourses.length} môn)
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: isRegistrationOpen ? '#dcfce7' : '#fee2e2', color: isRegistrationOpen ? '#15803d' : '#b91c1c' }}>
                          {isRegistrationOpen ? '🟢 Đang mở đăng ký' : '🔒 Đã khóa đăng ký'}
                        </span>
                      </span>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                    {isOpen && (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f9fafb', textAlign: 'left', color: '#4b5563', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '12px 20px' }}>Mã Môn</th>
                            <th style={{ padding: '12px 20px' }}>Tên Môn Học</th>
                            <th style={{ padding: '12px 20px' }}>Tín Chỉ</th>
                            <th style={{ padding: '12px 20px' }}>Học Kỳ</th>
                            <th style={{ padding: '12px 20px', textAlign: 'center' }}>Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {semCourses.map((c: any) => {
                            const isRegistered = registeredCourseIds.has(c.id);
                            return (
                              <tr key={c.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '12px 20px', fontWeight: 'bold' }}>{c.code}</td>
                                <td style={{ padding: '12px 20px' }}>{c.name}</td>
                                <td style={{ padding: '12px 20px' }}>{c.credits} TC</td>
                                <td style={{ padding: '12px 20px', color: '#2563eb', fontWeight: 'bold' }}>{c.semester}</td>
                                <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                  {isRegistered ? (
                                    <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={16} /> Đã đăng ký</span>
                                  ) : isRegistrationOpen ? (
                                    <button onClick={() => handleRegisterCourse(c.id, semName)} style={{ padding: '6px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Đăng Ký</button>
                                  ) : (
                                    <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Lock size={14} /> Đã khóa</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'schedule' ? (
          <div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px' }}>
              <h3 style={{ marginTop: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> Tự Đăng Ký Lịch Học / Xếp Lịch Cá Nhân</h3>
              <form onSubmit={handleCreatePersonalSchedule} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 1.2fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' }}>Chọn môn học</label>
                  <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px' }}>
                    {courses.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' }}>Chọn ngày học</label>
                  <input type="date" value={scheduleDate} onChange={e => {
                    const val = e.target.value;
                    setScheduleDate(val);
                    const d = new Date(val);
                    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                    setDayOfWeek(dayNames[d.getDay()]);
                  }} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' }}>Thứ</label>
                  <input type="text" value={dayOfWeek} readOnly style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' }}>Buổi</label>
                  <select value={session} onChange={e => setSession(e.target.value)} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px' }}>
                    <option value="Sáng">Sáng</option>
                    <option value="Chiều">Chiều</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' }}>Tiết</label>
                  <input type="text" value={period} onChange={e => setPeriod(e.target.value)} placeholder="Tiết 1 - 3" required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' }}>Phòng / Link</label>
                  <input type="text" value={room} onChange={e => setRoom(e.target.value)} placeholder="Phòng B302" required style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold' }}>Hình thức</label>
                  <select value={isOnline ? 'online' : 'offline'} onChange={e => setIsOnline(e.target.value === 'online')} style={{ width: '100%', padding: '7px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '12px' }}>
                    <option value="offline">Trực tiếp</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '8px 12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Thêm</button>
              </form>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#1e3a8a', color: 'white', padding: '15px 20px', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📅 Thời Khóa Biểu Theo Lưới Tuần ({daysInWeek[0].date} - {daysInWeek[6].date})</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handlePrevWeek} style={{ background: '#2563eb', color: 'white', border: '1px solid #93c5fd', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}><ChevronLeft size={14} /> Tuần trước</button>
                  <button onClick={() => setCurrentDate(new Date('2026-09-28'))} style={{ background: '#3b82f6', color: 'white', border: '1px solid #93c5fd', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Hôm nay</button>
                  <button onClick={handleNextWeek} style={{ background: '#2563eb', color: 'white', border: '1px solid #93c5fd', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 'bold' }}>Tuần sau <ChevronRight size={14} /></button>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e2e8f0', color: '#1f2937', textAlign: 'center', fontSize: '13px' }}>
                    <th style={{ padding: '10px', borderRight: '1px solid #cbd5e1', width: '90px' }}>Ca học</th>
                    {daysInWeek.map((d) => (
                      <th key={d.label} style={{ padding: '10px', borderRight: '1px solid #cbd5e1' }}>
                        <div style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{d.label}</div>
                        <div style={{ fontSize: '11px', color: '#4b5563' }}>{d.date}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['Sáng', 'Chiều'].map((sessionName) => (
                    <tr key={sessionName} style={{ borderBottom: '1px solid #cbd5e1', height: '180px' }}>
                      <td style={{ backgroundColor: '#f8fafc', textAlign: 'center', fontWeight: 'bold', color: '#1e3a8a', borderRight: '1px solid #cbd5e1', verticalAlign: 'middle' }}>{sessionName}</td>
                      {daysInWeek.map((d) => {
                        const slotSchedules = mySchedules.filter((sch: any) => sch.date === d.rawDate && sch.session === sessionName);
                        return (
                          <td key={d.label} style={{ verticalAlign: 'top', padding: '8px', borderRight: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                            {slotSchedules.map((sch: any) => {
                              let bgColor = '#eff6ff';
                              let borderColor = '#bfdbfe';
                              let textColor = '#1e3a8a';

                              if (sch.type === 'Thực hành') {
                                bgColor = '#fef3c7'; borderColor = '#fde68a'; textColor = '#b45309';
                              } else if (sch.type === 'Thi') {
                                bgColor = '#fee2e2'; borderColor = '#fecaca'; textColor = '#b91c1c';
                              } else if (sch.isOnline || sch.room?.includes('Online') || sch.room?.includes('trực tuyến')) {
                                bgColor = '#f5f3ff'; borderColor = '#ddd6fe'; textColor = '#7c3aed';
                              }

                              const isExam = sch.type === 'Thi';

                              return (
                                <div key={sch.id} style={{ 
                                  backgroundColor: bgColor, border: `1px solid ${borderColor}`, borderRadius: '6px', 
                                  padding: '8px', marginBottom: '8px', fontSize: '11px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'relative'
                                }}>
                                  <div style={{ fontWeight: 'bold', color: textColor, fontSize: '12px', paddingRight: isExam ? '4px' : '30px' }}>{sch.course?.name}</div>
                                  <div style={{ color: '#4b5563', marginTop: '2px' }}>Mã: {sch.course?.code}</div>
                                  <div style={{ color: '#374151', marginTop: '2px' }}>Tiết: {sch.period}</div>
                                  <div style={{ color: textColor, fontWeight: 'bold', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    {sch.isOnline ? <Video size={12} /> : <MapPin size={12} />} {sch.room}
                                  </div>
                                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '10px', background: sch.isOnline ? '#ede9fe' : '#dbeafe', color: sch.isOnline ? '#6d28d9' : '#1d4ed8', padding: '1px 4px', borderRadius: '3px' }}>
                                      {sch.isOnline ? 'Online' : 'Trực tiếp'}
                                    </span>
                                    <span style={{ fontSize: '10px', background: '#e2e8f0', color: '#334155', padding: '1px 4px', borderRadius: '3px' }}>
                                      {sch.type}
                                    </span>
                                  </div>
                                  
                                  {!isExam && (
                                    <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px' }}>
                                      <button onClick={() => handleStartEditSchedule(sch)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }} title="Sửa lịch">
                                        <Edit size={12} />
                                      </button>
                                      <button onClick={() => handleDeleteSchedule(sch)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }} title="Xóa lịch">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'submissions' ? (
          <div>
            <h3 style={{ marginBottom: '20px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={20} /> Đăng Ký Đề Tài Thuyết Trình / Tiểu Luận & Nộp Sản Phẩm</h3>
            
            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
              <h4 style={{ marginTop: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}><Upload size={18} /> Biểu Mẫu Nộp Bài Mới</h4>
              <form onSubmit={handleSubmitProject} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 2fr auto', gap: '15px', alignItems: 'end', marginTop: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>Chọn Môn Học</label>
                  <select value={projectCourseId} onChange={e => setProjectCourseId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                    {courses.map((c: any) => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>Tên Đề Tài Thuyết Trình / Tiểu Luận</label>
                  <input type="text" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder="VD: Nghiên cứu ứng dụng AI trong giáo dục" required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>Link Sản Phẩm (Driver, GitHub, Slide...)</label>
                  <input type="url" value={productLink} onChange={e => setProductLink(e.target.value)} placeholder="https://docs.google.com/..." required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
                </div>
                <button type="submit" style={{ padding: '9px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Nộp Bài</button>
              </form>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h4 style={{ marginTop: 0, color: '#1f2937', marginBottom: '15px' }}>Danh Sách Đề Tài & Điểm Số Của Bạn ({mySubmissions.length})</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', textAlign: 'left', color: '#4b5563', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 15px' }}>Môn Học</th>
                    <th style={{ padding: '12px 15px' }}>Tên Đề Tài</th>
                    <th style={{ padding: '12px 15px' }}>Sản Phẩm</th>
                    <th style={{ padding: '12px 15px' }}>Thời Gian Nộp</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center' }}>Điểm Đề Tài</th>
                    <th style={{ padding: '12px 15px' }}>Nhận Xét Từ Giảng Viên</th>
                  </tr>
                </thead>
                <tbody>
                  {mySubmissions.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Bạn chưa nộp đề tài hoặc tiểu luận nào.</td></tr>
                  ) : (
                    mySubmissions.map((sub: any) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#1e3a8a' }}>{sub.courseName}</td>
                        <td style={{ padding: '12px 15px' }}>{sub.projectTitle}</td>
                        <td style={{ padding: '12px 15px' }}><a href={sub.productLink} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Xem sản phẩm</a></td>
                        <td style={{ padding: '12px 15px', fontSize: '12px', color: '#6b7280' }}>{sub.submittedAt}</td>
                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                          {sub.score !== null && sub.score !== undefined ? (
                            <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold' }}>{sub.score} điểm</span>
                          ) : (
                            <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>Chưa chấm</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 15px', color: sub.feedback ? '#1f2937' : '#9ca3af', fontStyle: sub.feedback ? 'normal' : 'italic' }}>{sub.feedback || 'Chưa có nhận xét'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={22} color="#2563eb" /> Bảng Điểm Học Tập & Tổng Kết GPA</h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #2563eb' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'bold' }}>GPA (Thang 10)</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e3a8a' }}>{gpa10}</div>
                </div>
                <div style={{ backgroundColor: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: '4px solid #16a34a' }}>
                  <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'bold' }}>GPA (Thang 4)</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a34a' }}>{gpa4}</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', textAlign: 'left', color: '#4b5563', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 15px' }}>Mã Môn</th>
                    <th style={{ padding: '12px 15px' }}>Tên Môn Học</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center' }}>Tín Chỉ</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center' }}>Điểm Thang 10</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center' }}>Điểm Thang 4</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center' }}>Điểm Chữ</th>
                  </tr>
                </thead>
                <tbody>
                  {myGrades.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>Chưa có điểm số nào được cập nhật từ hệ thống trường.</td></tr>
                  ) : (
                    myGrades.map((g: any) => (
                      <tr key={g.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{g.courseCode}</td>
                        <td style={{ padding: '12px 15px' }}>{g.courseName}</td>
                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>{g.credits} TC</td>
                        <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: '#1e3a8a' }}>{g.score10 ?? '-'}</td>
                        <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>{g.score4 ?? '-'}</td>
                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                          <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold' }}>{g.letterGrade || '-'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Đổi Mật Khẩu Sinh Viên */}
        {showPasswordModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '380px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}><Key size={18} /> Đổi Mật Khẩu Tài Khoản</h3>
                <button onClick={() => { setShowPasswordModal(false); setPasswordMessage(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
              </div>

              {passwordMessage && (
                <div style={{ padding: '8px', marginBottom: '12px', backgroundColor: passwordMessage.startsWith('✅') ? '#d1fae5' : '#fee2e2', color: passwordMessage.startsWith('✅') ? '#065f46' : '#b91c1c', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>
                  {passwordMessage}
                </div>
              )}

              <form onSubmit={handleStudentChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Mật khẩu cũ</label>
                  <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Nhập mật khẩu hiện tại" required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Mật khẩu mới</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới" required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Xác nhận mật khẩu mới</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => { setShowPasswordModal(false); setPasswordMessage(''); }} style={{ padding: '8px 14px', background: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Hủy</button>
                  <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Xác Nhận</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Sửa Lịch */}
        {editingScheduleId && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#1e3a8a' }}>✏️ Chỉnh Sửa Lịch Học</h3>
                <button onClick={() => setEditingScheduleId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveEditSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Môn học</label>
                  <select value={editCourseId} onChange={e => setEditCourseId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                    {courses.map(c => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Ngày học</label>
                  <input type="date" value={editScheduleDate} onChange={e => {
                    const val = e.target.value;
                    setEditScheduleDate(val);
                    const d = new Date(val);
                    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                    setEditDayOfWeek(dayNames[d.getDay()]);
                  }} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Thứ</label>
                  <input type="text" value={editDayOfWeek} readOnly style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#f3f4f6', fontSize: '13px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Buổi</label>
                    <select value={editSession} onChange={e => setEditSession(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                      <option value="Sáng">Sáng</option><option value="Chiều">Chiều</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tiết / Giờ</label>
                    <input type="text" value={editPeriod} onChange={e => setEditPeriod(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Phòng / Link Online</label>
                  <input type="text" value={editRoom} onChange={e => setEditRoom(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Loại buổi học</label>
                    <select value={editType} onChange={e => {
                      if (e.target.value === 'Thi') {
                        alert('Sinh viên không được quyền đổi lịch thành Lịch thi!');
                        return;
                      }
                      setEditType(e.target.value);
                    }} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                      <option value="Lý thuyết">Lý thuyết</option>
                      <option value="Thực hành">Thực hành</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Hình thức</label>
                    <select value={editIsOnline ? 'online' : 'offline'} onChange={e => setEditIsOnline(e.target.value === 'online')} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                      <option value="offline">Trực tiếp</option><option value="online">Online</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setEditingScheduleId(null)} style={{ padding: '8px 16px', background: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
                  <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Lưu Thay Đổi</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}