// src/components/Dashboard.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, Home, LogOut, PlusCircle, ClipboardList, Trash2, Edit, Calendar, ChevronDown, ChevronUp, Video, MapPin, ChevronLeft, ChevronRight, Lock, Unlock, Award, Key, X } from 'lucide-react';

interface DashboardProps {
  token: string;
  onLogout: () => void;
}

export default function Dashboard({ token, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'students' | 'courses' | 'schedules' | 'enrollments' | 'grading' | 'academic_grades'>('home');
  
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [academicGrades, setAcademicGrades] = useState<any[]>([]);
  
  const [mssv, setMssv] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [credits, setCredits] = useState(3);
  const [semester, setSemester] = useState('Học kỳ 1 - Năm học 2026-2027');

  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-09-28'));

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('2026-09-28');
  const [dayOfWeek, setDayOfWeek] = useState('Thứ 2');
  const [session, setSession] = useState('Sáng');
  const [period, setPeriod] = useState('Tiết 1 - 3');
  const [room, setRoom] = useState('Phòng B302');
  const [isOnline, setIsOnline] = useState(false);
  const [type, setType] = useState('Lý thuyết');
  
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const [message, setMessage] = useState('');
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Đăng ký nhầm môn');

  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editMssv, setEditMssv] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editCourseName, setEditCourseName] = useState('');
  const [editCredits, setEditCredits] = useState(3);
  const [editSemester, setEditSemester] = useState('');

  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [inputScore, setInputScore] = useState<number | ''>('');
  const [inputFeedback, setInputFeedback] = useState('');

  const [gradeStudentId, setGradeStudentId] = useState('');
  const [gradeCourseId, setGradeCourseId] = useState('');
  const [gradeInput10, setGradeInput10] = useState<number | ''>('');
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [openSemesters, setOpenSemesters] = useState<{ [key: string]: boolean }>({});
  
  const [semesterRegistrationStatus, setSemesterRegistrationStatus] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('semesterRegistrationStatus');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const cancelReasonsList = [
    'Đăng ký nhầm môn',
    'Không đủ điều kiện tiên quyết',
    'Trùng lịch học',
    'Lớp học phần đã đầy/bị hủy',
    'Lý do khác'
  ];

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

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resCou, resSch, resEnr] = await Promise.all([
        axios.get('https://university-web-u1xo.onrender.com/api/courses', { headers }),
        axios.get('https://university-web-u1xo.onrender.com/api/schedules', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('https://university-web-u1xo.onrender.com/api/enrollments', { headers })
      ]);

      const savedStudents = localStorage.getItem('local_students_list');
      const studentList = savedStudents ? JSON.parse(savedStudents) : [
        { id: '1', mssv: '2029260145', fullName: 'Nguyễn Minh Đăng Huy', email: 'huy@student.edu.vn', password: '123' },
        { id: '2', mssv: '11111111', fullName: 'tu', email: 'nguyenminhtoan787@gmail.com', password: '123456' }
      ];

      setStudents(studentList);

      const courseList = resCou.data.data || resCou.data || [];
      setCourses(courseList);
      setSchedules(resSch.data.data || []);
      setEnrollments(resEnr.data.data || []);

      const savedSubs = localStorage.getItem('student_submissions');
      if (savedSubs) setSubmissions(JSON.parse(savedSubs));

      const savedGrades = localStorage.getItem('student_academic_grades');
      if (savedGrades) setAcademicGrades(JSON.parse(savedGrades));

      if (studentList.length > 0) {
        if (!selectedStudentId) setSelectedStudentId(studentList[0].id);
        if (!gradeStudentId) setGradeStudentId(studentList[0].id);
      }
      if (courseList.length > 0) {
        if (!selectedCourseId) setSelectedCourseId(courseList[0].id);
      }

      const semMap: { [key: string]: boolean } = {};
      courseList.forEach((c: any) => { semMap[c.semester || 'Học kỳ 1'] = true; });
      setOpenSemesters(semMap);
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage('⚠️ Vui lòng nhập đầy đủ thông tin mật khẩu!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('⚠️ Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    // Lưu thẳng mật khẩu mới vào localStorage mà không bắt bẻ mật khẩu cũ nữa
    localStorage.setItem('admin_password', newPassword);
    setMessage('🔒 Đổi mật khẩu tài khoản Admin thành công!');
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const toggleSemester = (sem: string) => {
    setOpenSemesters(prev => ({ ...prev, [sem]: !prev[sem] }));
  };

  const handleToggleSemesterRegistration = (semName: string) => {
    const currentStatus = !!semesterRegistrationStatus[semName];
    const newStatus = !currentStatus;

    const updated = { ...semesterRegistrationStatus, [semName]: newStatus };
    setSemesterRegistrationStatus(updated);
    localStorage.setItem('semesterRegistrationStatus', JSON.stringify(updated));

    const timeString = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
    const actionText = newStatus ? 'đã MỞ' : 'đã KHÓA';
    const notifMessage = `Thông báo từ Admin: Cổng đăng ký học phần cho [${semName}] ${actionText} lúc ${timeString}.`;

    students.forEach((s: any) => {
      if (s.mssv) {
        const existingNotifs = JSON.parse(localStorage.getItem(`notifications_${s.mssv}`) || '[]');
        localStorage.setItem(`notifications_${s.mssv}`, JSON.stringify([notifMessage, ...existingNotifs]));
      }
    });

    setMessage(`Đã ${newStatus ? 'mở' : 'khóa'} đăng ký cho học phần [${semName}] và gửi thông báo thành công tới sinh viên!`);
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mssv || !fullName || !email) {
      setMessage('⚠️ Vui lòng điền đầy đủ thông tin sinh viên!');
      return;
    }

    const newStudent = {
      id: Date.now().toString(),
      mssv,
      fullName,
      email,
      password: password || '123456'
    };

    const updatedStudents = [...students, newStudent];
    setStudents(updatedStudents);
    localStorage.setItem('local_students_list', JSON.stringify(updatedStudents));

    const studentPasswords = JSON.parse(localStorage.getItem('student_passwords') || '{}');
    studentPasswords[mssv] = password || '123456';
    localStorage.setItem('student_passwords', JSON.stringify(studentPasswords));

    setMessage('Thêm sinh viên và thiết lập mật khẩu thành công!');
    setMssv(''); setFullName(''); setEmail(''); setPassword('');
  };

  const handleDeleteStudent = (id: string, targetMssv: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa sinh viên này?')) return;
    
    const updatedStudents = students.filter((s: any) => s.id !== id);
    setStudents(updatedStudents);
    localStorage.setItem('local_students_list', JSON.stringify(updatedStudents));

    const studentPasswords = JSON.parse(localStorage.getItem('student_passwords') || '{}');
    delete studentPasswords[targetMssv];
    localStorage.setItem('student_passwords', JSON.stringify(studentPasswords));

    setMessage('Xóa sinh viên thành công!');
  };

  const handleStartEditStudent = (s: any) => {
    setEditingStudentId(s.id);
    setEditMssv(s.mssv);
    setEditFullName(s.fullName);
    setEditEmail(s.email);
    setEditPassword(s.password || '123456');
  };

  const handleSaveEditStudent = (id: string, oldMssv: string) => {
    const updatedStudents = students.map((s: any) => {
      if (s.id === id) {
        return { ...s, mssv: editMssv, fullName: editFullName, email: editEmail, password: editPassword || '123456' };
      }
      return s;
    });

    setStudents(updatedStudents);
    localStorage.setItem('local_students_list', JSON.stringify(updatedStudents));

    const studentPasswords = JSON.parse(localStorage.getItem('student_passwords') || '{}');
    if (oldMssv !== editMssv) {
      delete studentPasswords[oldMssv];
    }
    studentPasswords[editMssv] = editPassword || '123456';
    localStorage.setItem('student_passwords', JSON.stringify(studentPasswords));

    setMessage('Cập nhật thông tin và mật khẩu sinh viên thành công!');
    setEditingStudentId(null);
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('https://university-web-u1xo.onrender.com/api/courses', { code: courseCode, name: courseName, credits: Number(credits), semester }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Thêm môn học thành công!');
      setCourseCode(''); setCourseName(''); setCredits(3);
      fetchData(); 
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Thêm môn học thất bại!');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Xóa môn học này sẽ xóa cả lịch học và đăng ký liên quan?')) return;
    try {
      await axios.delete(`https://university-web-u1xo.onrender.com/api/courses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Xóa môn học thành công!');
      fetchData();
    } catch (err: any) {
      setMessage('Xóa môn học thất bại!');
    }
  };

  const handleStartEditCourse = (c: any) => {
    setEditingCourseId(c.id);
    setEditCourseCode(c.code);
    setEditCourseName(c.name);
    setEditCredits(c.credits);
    setEditSemester(c.semester || 'Học kỳ 1');
  };

  const handleSaveEditCourse = async (id: string) => {
    try {
      await axios.put(`https://university-web-u1xo.onrender.com/api/courses/${id}`, { code: editCourseCode, name: editCourseName, credits: Number(editCredits), semester: editSemester }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Cập nhật môn học thành công!');
      setEditingCourseId(null);
      fetchData();
    } catch (err: any) {
      setMessage('Cập nhật thất bại!');
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setMessage('Vui lòng chọn môn học!');
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (editingScheduleId) {
        await axios.delete(`https://university-web-u1xo.onrender.com/api/schedules/${editingScheduleId}`, { headers }).catch(() => {});
      }
      await axios.post('https://university-web-u1xo.onrender.com/api/schedules', { 
        studentId: selectedStudentId, courseId: selectedCourseId, date: scheduleDate, dayOfWeek, session, period, 
        room: isOnline ? 'Học trực tuyến (Online)' : room, isOnline, type 
      }, { headers });

      setMessage(editingScheduleId ? 'Cập nhật lịch học thành công!' : 'Xếp lịch học thành công!');
      setEditingScheduleId(null);
      fetchData();
    } catch (err: any) {
      setMessage('Xếp lịch thất bại!');
    }
  };

  const handleStartEditSchedule = (sch: any) => {
    setEditingScheduleId(sch.id);
    setSelectedStudentId(sch.studentId || sch.student?.id || '');
    setSelectedCourseId(sch.courseId || sch.course?.id || '');
    setScheduleDate(sch.date || '2026-09-28');
    setDayOfWeek(sch.dayOfWeek || 'Thứ 2');
    setSession(sch.session || 'Sáng');
    setPeriod(sch.period || 'Tiết 1 - 3');
    setRoom(sch.room || 'Phòng B302');
    setIsOnline(sch.isOnline || false);
    setType(sch.type || 'Lý thuyết');
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa lịch học này?')) return;
    try {
      await axios.delete(`https://university-web-u1xo.onrender.com/api/schedules/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Đã xóa lịch học!');
      fetchData();
    } catch (err) {
      setMessage('Xóa thất bại!');
    }
  };

  const handleCancelEnrollmentWithReason = async (id: string, enrollmentInfo: any) => {
    try {
      await axios.delete(`https://university-web-u1xo.onrender.com/api/enrollments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const studentMssv = enrollmentInfo.student?.mssv;
      const courseName = enrollmentInfo.course?.name;
      if (studentMssv) {
        const timeString = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
        const notifMessage = `Học phần [${courseName}] đã bị Admin hủy. Lý do: ${cancelReason} (${timeString})`;
        const existingNotifs = JSON.parse(localStorage.getItem(`notifications_${studentMssv}`) || '[]');
        localStorage.setItem(`notifications_${studentMssv}`, JSON.stringify([notifMessage, ...existingNotifs]));
      }
      setMessage(`Đã hủy đăng ký thành công!`);
      setCancelingId(null);
      fetchData();
    } catch (err: any) {
      setMessage('Hủy đăng ký thất bại!');
    }
  };

  const handleSaveGrading = (subId: string, studentMssv: string, courseName: string) => {
    if (inputScore === '' || inputScore < 0 || inputScore > 10) {
      setMessage('⚠️ Vui lòng nhập điểm hợp lệ từ 0 đến 10!');
      return;
    }
    const updated = submissions.map((sub: any) => {
      if (sub.id === subId) return { ...sub, score: Number(inputScore), feedback: inputFeedback };
      return sub;
    });
    setSubmissions(updated);
    localStorage.setItem('student_submissions', JSON.stringify(updated));

    const timeString = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
    const notifMessage = `Điểm tiểu luận/thuyết trình môn [${courseName}] của bạn đã được cập nhật: ${inputScore} điểm. Nhận xét: "${inputFeedback || 'Không có'}" (${timeString})`;
    const existingNotifs = JSON.parse(localStorage.getItem(`notifications_${studentMssv}`) || '[]');
    localStorage.setItem(`notifications_${studentMssv}`, JSON.stringify([notifMessage, ...existingNotifs]));

    setMessage(`Chấm điểm thành công cho sinh viên ${studentMssv}!`);
    setGradingSubId(null);
    setInputScore(''); setInputFeedback('');
  };

  const handleDeleteSubmission = (subId: string, studentMssv: string, courseName: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa đề tài / bài nộp này của sinh viên?')) return;
    const updated = submissions.filter((sub: any) => sub.id !== subId);
    setSubmissions(updated);
    localStorage.setItem('student_submissions', JSON.stringify(updated));

    const timeString = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
    const notifMessage = `Đề tài / bài nộp môn [${courseName}] của bạn đã bị Admin xóa. Vui lòng nộp lại! (${timeString})`;
    const existingNotifs = JSON.parse(localStorage.getItem(`notifications_${studentMssv}`) || '[]');
    localStorage.setItem(`notifications_${studentMssv}`, JSON.stringify([notifMessage, ...existingNotifs]));
    setMessage('Đã xóa bài nộp của sinh viên thành công!');
  };

  const convertScore = (sc10: number) => {
    if (sc10 >= 8.5) return { score4: 4.0, letter: 'A' };
    if (sc10 >= 8.0) return { score4: 3.5, letter: 'B+' };
    if (sc10 >= 7.0) return { score4: 3.0, letter: 'B' };
    if (sc10 >= 6.5) return { score4: 2.5, letter: 'C+' };
    if (sc10 >= 5.5) return { score4: 2.0, letter: 'C' };
    if (sc10 >= 5.0) return { score4: 1.5, letter: 'D+' };
    if (sc10 >= 4.0) return { score4: 1.0, letter: 'D' };
    return { score4: 0.0, letter: 'F' };
  };

  const handleSaveAcademicGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (gradeInput10 === '' || gradeInput10 < 0 || gradeInput10 > 10) {
      setMessage('⚠️ Vui lòng nhập điểm hệ 10 từ 0 đến 10 hợp lệ!');
      return;
    }

    const selectedStu = students.find((s: any) => s.id === gradeStudentId);
    const selectedCou = courses.find((c: any) => c.id === gradeCourseId);
    if (!selectedStu || !selectedCou) return;

    const sc10 = Number(gradeInput10);
    const { score4, letter } = convertScore(sc10);

    let updated = [...academicGrades];
    if (editingGradeId) {
      updated = updated.map((g: any) => {
        if (g.id === editingGradeId) {
          return {
            ...g, studentId: gradeStudentId, courseId: gradeCourseId,
            mssv: selectedStu.mssv, studentName: selectedStu.fullName,
            courseCode: selectedCou.code, courseName: selectedCou.name, credits: selectedCou.credits,
            score10: sc10, score4, letterGrade: letter
          };
        }
        return g;
      });
      setEditingGradeId(null);
    } else {
      const exists = updated.find((g: any) => g.studentId === gradeStudentId && g.courseId === gradeCourseId);
      if (exists) {
        setMessage('⚠️ Sinh viên này đã có điểm môn học này rồi. Vui lòng bấm Sửa!');
        return;
      }
      const newGrade = {
        id: Date.now().toString(),
        studentId: gradeStudentId, courseId: gradeCourseId,
        mssv: selectedStu.mssv, studentName: selectedStu.fullName,
        courseCode: selectedCou.code, courseName: selectedCou.name, credits: selectedCou.credits,
        score10: sc10, score4, letterGrade: letter
      };
      updated.push(newGrade);
    }

    setAcademicGrades(updated);
    localStorage.setItem('student_academic_grades', JSON.stringify(updated));

    const timeString = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
    const notifMessage = `Điểm tổng kết môn [${selectedCou.name}] đã được cập nhật: ${sc10} (Hệ 4: ${score4} - Điểm chữ: ${letter}) (${timeString})`;
    const existingNotifs = JSON.parse(localStorage.getItem(`notifications_${selectedStu.mssv}`) || '[]');
    localStorage.setItem(`notifications_${selectedStu.mssv}`, JSON.stringify([notifMessage, ...existingNotifs]));

    setMessage('Cập nhật điểm số thành công cho sinh viên!');
    setGradeInput10('');
  };

  const handleDeleteAcademicGrade = (gradeId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa điểm số môn này?')) return;
    const updated = academicGrades.filter((g: any) => g.id !== gradeId);
    setAcademicGrades(updated);
    localStorage.setItem('student_academic_grades', JSON.stringify(updated));
    setMessage('Đã xóa điểm thành công!');
  };

  const selectedStudentEnrollments = enrollments.filter((en: any) => en.student?.id === selectedStudentId);
  const registeredCourseIdsForSelectedStudent = new Set(selectedStudentEnrollments.map((en: any) => en.course?.id));
  const availableCoursesForStudent = courses.filter(c => registeredCourseIdsForSelectedStudent.has(c.id));

  const gradeStudentEnrollments = enrollments.filter((en: any) => en.student?.id === gradeStudentId);
  const registeredCourseIdsForGradeStudent = new Set(gradeStudentEnrollments.map((en: any) => en.course?.id));
  const availableCoursesForGradeStudent = courses.filter(c => registeredCourseIdsForGradeStudent.has(c.id));

  const coursesBySemester = courses.reduce((acc: any, course: any) => {
    const sem = course.semester || 'Học kỳ 1';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(course);
    return acc;
  }, {});
  const sortedSemesters = Object.keys(coursesBySemester).sort();

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '260px', backgroundColor: '#1f2937', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ padding: '20px', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #374151', textAlign: 'center' }}>
            🎓 Quản Lý Đại Học (Admin)
          </div>
          <div style={{ padding: '15px' }}>
            <button onClick={() => setActiveTab('home')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: activeTab === 'home' ? '#374151' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '8px', textAlign: 'left', fontWeight: 'bold' }}><Home size={18} /> Tổng Quan</button>
            <button onClick={() => setActiveTab('students')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: activeTab === 'students' ? '#374151' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '8px', textAlign: 'left', fontWeight: 'bold' }}><Users size={18} /> Quản Lý Sinh Viên</button>
            <button onClick={() => setActiveTab('courses')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: activeTab === 'courses' ? '#374151' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '8px', textAlign: 'left', fontWeight: 'bold' }}><BookOpen size={18} /> Quản Lý Môn Học</button>
            <button onClick={() => setActiveTab('schedules')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: activeTab === 'schedules' ? '#374151' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '8px', textAlign: 'left', fontWeight: 'bold' }}><Calendar size={18} /> Quản Lý Lịch Học</button>
            <button onClick={() => setActiveTab('enrollments')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: activeTab === 'enrollments' ? '#374151' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '8px', textAlign: 'left', fontWeight: 'bold' }}><ClipboardList size={18} /> Quản Lý Đăng Ký</button>
            <button onClick={() => setActiveTab('grading')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: activeTab === 'grading' ? '#374151' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '8px', textAlign: 'left', fontWeight: 'bold' }}><Award size={18} /> Chấm Đề Tài / Tiểu Luận</button>
            <button onClick={() => setActiveTab('academic_grades')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: activeTab === 'academic_grades' ? '#374151' : 'transparent', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold' }}><Award size={18} /> Bảng Điểm & GPA (10 & 4)</button>
          </div>
        </div>
        <div style={{ padding: '20px', borderTop: '1px solid #374151' }}>
          <button onClick={onLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '10px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}><LogOut size={18} /> Đăng Xuất</button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ padding: '20px 30px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#1f2937', textTransform: 'uppercase', fontSize: '18px' }}>
            {activeTab === 'home' && 'Trang Tổng Quan Quản Trị'}
            {activeTab === 'students' && 'Phân Hệ Quản Lý Sinh Viên & Mật Khẩu'}
            {activeTab === 'courses' && 'Phân Hệ Quản Lý Môn Học & Cổng Đăng Ký'}
            {activeTab === 'schedules' && 'Phân Hệ Quản Lý Lịch Học & Thời Khóa Biểu'}
            {activeTab === 'enrollments' && 'Phân Hệ Giám Sát Đăng Ký Học Phần'}
            {activeTab === 'grading' && 'Phân Hệ Chấm Điểm & Quản Lý Đề Tài / Tiểu Luận'}
            {activeTab === 'academic_grades' && 'Phân Hệ Nhập Điểm Học Tập (Thang 10 & 4) & Tính GPA'}
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={() => setShowPasswordModal(true)} 
              style={{ padding: '6px 14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Key size={14} /> Đổi Mật Khẩu Admin
            </button>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>Xin chào, Admin</span>
          </div>
        </div>

        <div style={{ padding: '30px' }}>
          {message && <div style={{ padding: '12px', marginBottom: '20px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '6px', fontWeight: 'bold' }}>{message}</div>}

          {activeTab === 'home' && (
            <div style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: '#2563eb', marginTop: 0 }}>Chào mừng bạn đến với Cổng thông tin Quản Trị!</h3>
              <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Sử dụng menu bên trái để quản lý sinh viên, mật khẩu tài khoản, môn học, thời khóa biểu, duyệt đăng ký, chấm đề tài và nhập điểm tổng kết (thang 10 & 4).</p>
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px' }}>
                <h3 style={{ marginTop: 0, color: '#1f2937' }}><PlusCircle size={20} color="#2563eb" style={{ verticalAlign: 'middle' }} /> Thêm Sinh Viên Mới & Cấp Mật Khẩu</h3>
                <form onSubmit={handleAddStudent} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1.5fr 1.2fr auto', gap: '15px', alignItems: 'end' }}>
                  <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>MSSV</label><input type="text" value={mssv} onChange={e => setMssv(e.target.value)} required placeholder="VD: 2029260145" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} /></div>
                  <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Họ và tên</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Nguyễn Văn A" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} /></div>
                  <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@student.edu.vn" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} /></div>
                  <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Mật khẩu đăng nhập</label><input type="text" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mặc định: 123456" style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} /></div>
                  <button type="submit" style={{ padding: '9px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Thêm</button>
                </form>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0 }}>Danh Sách Tài Khoản Sinh Viên ({students.length})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>MSSV</th>
                      <th style={{ padding: '10px' }}>Họ tên</th>
                      <th style={{ padding: '10px' }}>Email</th>
                      <th style={{ padding: '10px' }}>Mật khẩu</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s: any) => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        {editingStudentId === s.id ? (
                          <>
                            <td style={{ padding: '10px' }}><input type="text" value={editMssv} onChange={e => setEditMssv(e.target.value)} style={{ width: '90%', padding: '6px' }} /></td>
                            <td style={{ padding: '10px' }}><input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} style={{ width: '90%', padding: '6px' }} /></td>
                            <td style={{ padding: '10px' }}><input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} style={{ width: '90%', padding: '6px' }} /></td>
                            <td style={{ padding: '10px' }}><input type="text" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Mật khẩu mới" style={{ width: '90%', padding: '6px' }} /></td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <button onClick={() => handleSaveEditStudent(s.id, s.mssv)} style={{ padding: '5px 10px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', marginRight: '5px' }}>Lưu</button>
                              <button onClick={() => setEditingStudentId(null)} style={{ padding: '5px 10px', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px' }}>Hủy</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '10px', fontWeight: 'bold' }}>{s.mssv}</td>
                            <td style={{ padding: '10px' }}>{s.fullName}</td>
                            <td style={{ padding: '10px', color: '#6b7280' }}>{s.email}</td>
                            <td style={{ padding: '10px', fontFamily: 'monospace', color: '#b45309', fontWeight: 'bold' }}>{s.password || '123456'}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              <button onClick={() => handleStartEditStudent(s)} style={{ padding: '5px 10px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', marginRight: '6px', fontWeight: 'bold' }}><Edit size={14} /> Sửa</button>
                              <button onClick={() => handleDeleteStudent(s.id, s.mssv)} style={{ padding: '5px 10px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', fontWeight: 'bold' }}><Trash2 size={14} /> Xóa</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px' }}>
                <h3 style={{ marginTop: 0 }}><PlusCircle size={20} color="#2563eb" style={{ verticalAlign: 'middle' }} /> Thêm Môn Học Mới</h3>
                <form onSubmit={handleAddCourse} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1.5fr auto', gap: '15px', alignItems: 'end' }}>
                  <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Mã môn</label><input type="text" value={courseCode} onChange={e => setCourseCode(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} /></div>
                  <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Tên môn học</label><input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} /></div>
                  <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Tín chỉ</label><input type="number" value={credits} onChange={e => setCredits(Number(e.target.value))} min={1} max={10} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} /></div>
                  <div><label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Học kỳ</label><input type="text" value={semester} onChange={e => setSemester(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }} /></div>
                  <button type="submit" style={{ padding: '9px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Thêm</button>
                </form>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Danh Sách Môn Học & Quản Lý Cổng Đăng Ký Theo Học Kỳ ({courses.length})</h3>
                {sortedSemesters.map((semName) => {
                  const isOpen = openSemesters[semName] ?? true;
                  const semCourses = coursesBySemester[semName];
                  const isRegistrationOpen = !!semesterRegistrationStatus[semName];

                  return (
                    <div key={semName} style={{ marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ backgroundColor: '#f3f4f6', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span onClick={() => toggleSemester(semName)} style={{ cursor: 'pointer', fontWeight: 'bold', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          📌 {semName} ({semCourses.length} môn)
                          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: isRegistrationOpen ? '#16a34a' : '#dc2626' }}>
                            {isRegistrationOpen ? '🟢 Cổng đang Mở' : '🔒 Cổng đang Khóa'}
                          </span>
                          <button 
                            onClick={() => handleToggleSemesterRegistration(semName)}
                            style={{ 
                              padding: '6px 14px', backgroundColor: isRegistrationOpen ? '#dc2626' : '#16a34a', color: 'white', 
                              border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px'
                            }}
                          >
                            {isRegistrationOpen ? <Lock size={14} /> : <Unlock size={14} />}
                            {isRegistrationOpen ? 'Khóa Đăng Ký' : 'Mở Đăng Ký'}
                          </button>
                        </div>
                      </div>

                      {isOpen && (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left', color: '#4b5563' }}>
                              <th style={{ padding: '10px 20px' }}>Mã Môn</th><th style={{ padding: '10px 20px' }}>Tên Môn Học</th><th style={{ padding: '10px 20px' }}>Tín Chỉ</th><th style={{ padding: '10px 20px' }}>Học Kỳ</th><th style={{ padding: '10px 20px', textAlign: 'center' }}>Thao Tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {semCourses.map((c: any) => (
                              <tr key={c.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                {editingCourseId === c.id ? (
                                  <>
                                    <td style={{ padding: '12px 20px' }}><input type="text" value={editCourseCode} onChange={e => setEditCourseCode(e.target.value)} style={{ padding: '6px', width: '90%' }} /></td>
                                    <td style={{ padding: '12px 20px' }}><input type="text" value={editCourseName} onChange={e => setEditCourseName(e.target.value)} style={{ padding: '6px', width: '95%' }} /></td>
                                    <td style={{ padding: '12px 20px' }}><input type="number" value={editCredits} onChange={e => setEditCredits(Number(e.target.value))} style={{ padding: '6px', width: '55px' }} /></td>
                                    <td style={{ padding: '12px 20px' }}><input type="text" value={editSemester} onChange={e => setEditSemester(e.target.value)} style={{ padding: '6px', width: '95%' }} /></td>
                                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                      <button onClick={() => handleSaveEditCourse(c.id)} style={{ padding: '6px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', marginRight: '5px' }}>Lưu</button>
                                      <button onClick={() => setEditingCourseId(null)} style={{ padding: '6px 10px', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px' }}>Hủy</button>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td style={{ padding: '12px 20px', fontWeight: 'bold' }}>{c.code}</td>
                                    <td style={{ padding: '12px 20px' }}>{c.name}</td>
                                    <td style={{ padding: '12px 20px' }}>{c.credits} TC</td>
                                    <td style={{ padding: '12px 20px', color: '#2563eb', fontWeight: 'bold' }}>{c.semester}</td>
                                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                      <button onClick={() => handleStartEditCourse(c)} style={{ padding: '5px 10px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', marginRight: '6px', fontWeight: 'bold' }}><Edit size={14} /> Sửa</button>
                                      <button onClick={() => handleDeleteCourse(c.id)} style={{ padding: '5px 10px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', fontWeight: 'bold' }}><Trash2 size={14} /> Xóa</button>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'schedules' && (
            <div>
              <div style={{ background: editingScheduleId ? '#eff6ff' : 'white', border: editingScheduleId ? '2px dashed #2563eb' : '1px solid #e5e7eb', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#1e3a8a' }}>
                    <Calendar size={20} style={{ verticalAlign: 'middle' }} /> 
                    {editingScheduleId ? ' ✏️ Chỉnh Sửa Nhanh Lịch Học' : ' Xếp Lịch Học Cho Sinh Viên'}
                  </h3>
                  {editingScheduleId && (
                    <button onClick={() => { setEditingScheduleId(null); }} style={{ background: '#9ca3af', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Hủy Sửa</button>
                  )}
                </div>

                <form onSubmit={handleAddSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Chọn Sinh Viên</label>
                      <select value={selectedStudentId} onChange={e => {
                        setSelectedStudentId(e.target.value);
                        const stuEnrs = enrollments.filter((en: any) => en.student?.id === e.target.value);
                        if (stuEnrs.length > 0) setSelectedCourseId(stuEnrs[0].course?.id);
                        else if (courses.length > 0) setSelectedCourseId(courses[0].id);
                      }} style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                        {students.map((s: any) => <option key={s.id} value={s.id}>[{s.mssv}] {s.fullName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Chọn Môn Học Đã Đăng Ký</label>
                      <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                        {availableCoursesForStudent.length === 0 ? (
                          <option value="">-- Sinh viên chưa đăng ký môn nào --</option>
                        ) : (
                          availableCoursesForStudent.map((c: any) => <option key={c.id} value={c.id}>[{c.code}] {c.name}</option>)
                        )}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Ngày học</label>
                      <input type="date" value={scheduleDate} onChange={e => {
                        const val = e.target.value; setScheduleDate(val);
                        const d = new Date(val);
                        const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                        setDayOfWeek(dayNames[d.getDay()]);
                      }} style={{ width: '100%', padding: '7px', fontSize: '12px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Thứ</label>
                      <input type="text" value={dayOfWeek} readOnly style={{ width: '100%', padding: '7px', fontSize: '12px', backgroundColor: '#f3f4f6', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Buổi</label>
                      <select value={session} onChange={e => setSession(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                        <option value="Sáng">Sáng</option><option value="Chiều">Chiều</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.2fr 1.2fr auto', gap: '12px', alignItems: 'end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Tiết học</label>
                      <input type="text" value={period} onChange={e => setPeriod(e.target.value)} placeholder="Tiết 1-3" required style={{ width: '100%', padding: '7px', fontSize: '12px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Phòng học / Link Online</label>
                      <input type="text" value={room} onChange={e => setRoom(e.target.value)} placeholder="Phòng B302" required style={{ width: '100%', padding: '7px', fontSize: '12px', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Loại buổi</label>
                      <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                        <option value="Lý thuyết">Lý thuyết</option><option value="Thực hành">Thực hành</option><option value="Thi">Thi</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>Hình thức</label>
                      <select value={isOnline ? 'online' : 'offline'} onChange={e => setIsOnline(e.target.value === 'online')} style={{ width: '100%', padding: '8px', fontSize: '12px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                        <option value="offline">Trực tiếp</option><option value="online">Online</option>
                      </select>
                    </div>
                    <button type="submit" style={{ padding: '9px 24px', background: editingScheduleId ? '#16a34a' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                      {editingScheduleId ? 'Lưu Thay Đổi' : 'Xếp Lịch'}
                    </button>
                  </div>
                </form>
              </div>

              <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#1e3a8a', color: 'white', padding: '15px 20px', fontWeight: 'bold', fontSize: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📅 Thời Khóa Biểu Toàn Trường Theo Lưới Tuần ({daysInWeek[0].date} - {daysInWeek[6].date})</span>
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
                          const slotSchedules = schedules.filter((sch: any) => sch.date === d.rawDate && sch.session === sessionName);
                          return (
                            <td key={d.label} style={{ verticalAlign: 'top', padding: '6px', borderRight: '1px solid #cbd5e1', backgroundColor: '#fff' }}>
                              {slotSchedules.map((sch: any) => {
                                let bgColor = '#eff6ff'; let borderColor = '#bfdbfe'; let textColor = '#1e3a8a';
                                if (sch.type === 'Thực hành') { bgColor = '#fef3c7'; borderColor = '#fde68a'; textColor = '#b45309'; }
                                else if (sch.type === 'Thi') { bgColor = '#fee2e2'; borderColor = '#fecaca'; textColor = '#b91c1c'; }
                                else if (sch.isOnline || sch.room?.includes('Online')) { bgColor = '#f5f3ff'; borderColor = '#ddd6fe'; textColor = '#7c3aed'; }

                                return (
                                  <div key={sch.id} style={{ 
                                    backgroundColor: bgColor, border: `1px solid ${borderColor}`, borderRadius: '6px', 
                                    padding: '8px', marginBottom: '8px', fontSize: '11px', position: 'relative', wordBreak: 'break-word'
                                  }}>
                                    <div style={{ fontWeight: 'bold', color: textColor, fontSize: '12px', paddingRight: '35px' }}>{sch.course?.name}</div>
                                    <div style={{ color: '#4b5563', marginTop: '2px' }}>Mã: {sch.course?.code}</div>
                                    <div style={{ color: '#374151', marginTop: '2px' }}>SV: <strong>{sch.student?.fullName || 'Chung'}</strong></div>
                                    <div style={{ color: '#374151', marginTop: '2px' }}>Tiết: {sch.period}</div>
                                    <div style={{ color: textColor, fontWeight: 'bold', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      {sch.isOnline ? <Video size={12} /> : <MapPin size={12} />} {sch.room}
                                    </div>
                                    <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px', background: bgColor, padding: '2px' }}>
                                      <button onClick={() => handleStartEditSchedule(sch)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '2px' }} title="Sửa nhanh"><Edit size={13} /></button>
                                      <button onClick={() => handleDeleteSchedule(sch.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }} title="Xóa"><Trash2 size={13} /></button>
                                    </div>
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
          )}

          {activeTab === 'enrollments' && (
            <div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0 }}>Giám Sát Đăng Ký Học Phần Toàn Trường ({enrollments.length})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>MSSV</th><th style={{ padding: '10px' }}>Họ Tên</th><th style={{ padding: '10px' }}>Mã Môn</th><th style={{ padding: '10px' }}>Tên Môn</th><th style={{ padding: '10px' }}>Tín Chỉ</th><th style={{ padding: '10px', textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((en: any) => (
                      <tr key={en.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{en.student?.mssv}</td>
                        <td style={{ padding: '10px' }}>{en.student?.fullName}</td>
                        <td style={{ padding: '10px', fontWeight: 'bold' }}>{en.course?.code}</td>
                        <td style={{ padding: '10px' }}>{en.course?.name}</td>
                        <td style={{ padding: '10px' }}>{en.course?.credits} TC</td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          {cancelingId === en.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                              <select value={cancelReason} onChange={e => setCancelReason(e.target.value)} style={{ padding: '4px', fontSize: '12px', width: '150px' }}>
                                {cancelReasonsList.map((r, i) => <option key={i} value={r}>{r}</option>)}
                              </select>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => handleCancelEnrollmentWithReason(en.id, en)} style={{ padding: '3px 8px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px' }}>Xác nhận</button>
                                <button onClick={() => setCancelingId(null)} style={{ padding: '3px 8px', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', fontSize: '11px' }}>Đóng</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setCancelingId(en.id)} style={{ padding: '5px 10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}><Trash2 size={14} /> Hủy</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'grading' && (
            <div>
              <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={22} /> Chấm Điểm & Quản Lý Đề Tài / Tiểu Luận Sinh Viên</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left', color: '#4b5563' }}>
                      <th style={{ padding: '12px 15px' }}>MSSV</th><th style={{ padding: '12px 15px' }}>Họ Tên</th><th style={{ padding: '12px 15px' }}>Môn Học</th><th style={{ padding: '12px 15px' }}>Tên Đề Tài</th><th style={{ padding: '12px 15px' }}>Sản Phẩm</th><th style={{ padding: '12px 15px', textAlign: 'center' }}>Điểm Đề Tài</th><th style={{ padding: '12px 15px' }}>Nhận Xét</th><th style={{ padding: '12px 15px', textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: '25px', textAlign: 'center', color: '#6b7280' }}>Chưa có sinh viên nào nộp đề tài hoặc tiểu luận.</td></tr>
                    ) : (
                      submissions.map((sub: any) => (
                        <tr key={sub.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{sub.mssv}</td>
                          <td style={{ padding: '12px 15px' }}>{sub.studentName}</td>
                          <td style={{ padding: '12px 15px', color: '#2563eb', fontWeight: 'bold' }}>{sub.courseName}</td>
                          <td style={{ padding: '12px 15px' }}>{sub.projectTitle}</td>
                          <td style={{ padding: '12px 15px' }}><a href={sub.productLink} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Xem Link</a></td>
                          <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                            {gradingSubId === sub.id ? (
                              <input type="number" min="0" max="10" step="0.1" value={inputScore} onChange={e => setInputScore(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Điểm" style={{ width: '60px', padding: '6px', textAlign: 'center' }} />
                            ) : (
                              <span style={{ fontWeight: 'bold', color: sub.score !== null ? '#15803d' : '#b45309', background: sub.score !== null ? '#dcfce7' : '#fef3c7', padding: '4px 10px', borderRadius: '4px' }}>
                                {sub.score !== null && sub.score !== undefined ? `${sub.score}đ` : 'Chưa chấm'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 15px' }}>
                            {gradingSubId === sub.id ? (
                              <input type="text" value={inputFeedback} onChange={e => setInputFeedback(e.target.value)} placeholder="Nhận xét..." style={{ width: '95%', padding: '6px' }} />
                            ) : (
                              <span style={{ color: sub.feedback ? '#1f2937' : '#9ca3af', fontStyle: sub.feedback ? 'normal' : 'italic' }}>{sub.feedback || 'Chưa có nhận xét'}</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                            {gradingSubId === sub.id ? (
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                <button onClick={() => handleSaveGrading(sub.id, sub.mssv, sub.courseName)} style={{ padding: '6px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Lưu</button>
                                <button onClick={() => setGradingSubId(null)} style={{ padding: '6px 10px', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button onClick={() => { setGradingSubId(sub.id); setInputScore(sub.score ?? ''); setInputFeedback(sub.feedback ?? ''); }} style={{ padding: '6px 10px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Chấm</button>
                                <button onClick={() => handleDeleteSubmission(sub.id, sub.mssv, sub.courseName)} style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Xóa</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'academic_grades' && (
            <div>
              <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '25px' }}>
                <h3 style={{ marginTop: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={20} /> {editingGradeId ? '✏️ Sửa Điểm Học Tập' : '➕ Nhập Điểm Môn Học Cho Sinh Viên'}</h3>
                
                <form onSubmit={handleSaveAcademicGrade} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '15px', alignItems: 'end', marginTop: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>Chọn Sinh Viên</label>
                    <select value={gradeStudentId} onChange={e => {
                      setGradeStudentId(e.target.value);
                      const stuEnrs = enrollments.filter((en: any) => en.student?.id === e.target.value);
                      if (stuEnrs.length > 0) setGradeCourseId(stuEnrs[0].course?.id);
                      else setGradeCourseId('');
                    }} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                      {students.map((s: any) => <option key={s.id} value={s.id}>[{s.mssv}] {s.fullName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>Chọn Môn Học Đã Đăng Ký</label>
                    <select value={gradeCourseId} onChange={e => setGradeCourseId(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }}>
                      {availableCoursesForGradeStudent.length === 0 ? (
                        <option value="">-- Sinh viên chưa đăng ký môn nào --</option>
                      ) : (
                        availableCoursesForGradeStudent.map((c: any) => <option key={c.id} value={c.id}>[{c.code}] {c.name} ({c.credits} TC)</option>)
                      )}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>Điểm Thang 10 (0 - 10)</label>
                    <input type="number" min="0" max="10" step="0.1" value={gradeInput10} onChange={e => setGradeInput10(e.target.value === '' ? '' : Number(e.target.value))} placeholder="8.5" required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" style={{ padding: '9px 20px', backgroundColor: editingGradeId ? '#16a34a' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                      {editingGradeId ? 'Lưu Sửa' : 'Nhập Điểm'}
                    </button>
                    {editingGradeId && (
                      <button type="button" onClick={() => { setEditingGradeId(null); setGradeInput10(''); }} style={{ padding: '9px 15px', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Hủy</button>
                    )}
                  </div>
                </form>
              </div>

              <div style={{ background: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0, color: '#1f2937', marginBottom: '15px' }}>Bảng Tổng Hợp Điểm Số Toàn Trường ({academicGrades.length})</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb', textAlign: 'left', color: '#4b5563', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 15px' }}>MSSV</th>
                      <th style={{ padding: '12px 15px' }}>Họ Tên</th>
                      <th style={{ padding: '12px 15px' }}>Môn Học</th>
                      <th style={{ padding: '12px 15px', textAlign: 'center' }}>Tín Chỉ</th>
                      <th style={{ padding: '12px 15px', textAlign: 'center' }}>Điểm Hệ 10</th>
                      <th style={{ padding: '12px 15px', textAlign: 'center' }}>Điểm Hệ 4</th>
                      <th style={{ padding: '12px 15px', textAlign: 'center' }}>Điểm Chữ</th>
                      <th style={{ padding: '12px 15px', textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {academicGrades.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: '25px', textAlign: 'center', color: '#6b7280' }}>Chưa có điểm môn học nào được nhập.</td></tr>
                    ) : (
                      academicGrades.map((g: any) => (
                        <tr key={g.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{g.mssv}</td>
                          <td style={{ padding: '12px 15px' }}>{g.studentName}</td>
                          <td style={{ padding: '12px 15px', color: '#1e3a8a', fontWeight: 'bold' }}>[{g.courseCode}] {g.courseName}</td>
                          <td style={{ padding: '12px 15px', textAlign: 'center' }}>{g.credits} TC</td>
                          <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: '#2563eb' }}>{g.score10}</td>
                          <td style={{ padding: '12px 15px', textAlign: 'center', fontWeight: 'bold', color: '#16a34a' }}>{g.score4}</td>
                          <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                            <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '4px', fontWeight: 'bold' }}>{g.letterGrade}</span>
                          </td>
                          <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button onClick={() => { setEditingGradeId(g.id); setGradeStudentId(g.studentId); setGradeCourseId(g.courseId); setGradeInput10(g.score10); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ padding: '6px 10px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                                <Edit size={13} style={{ verticalAlign: 'middle' }} /> Sửa
                              </button>
                              <button onClick={() => handleDeleteAcademicGrade(g.id)} style={{ padding: '6px 10px', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                                <Trash2 size={13} style={{ verticalAlign: 'middle' }} /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Đổi Mật Khẩu Admin */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}><Key size={18} /> Đổi Mật Khẩu Quản Trị</h3>
              <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Mật khẩu hiện tại</label>
                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Nhập mật khẩu cũ" required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '13px' }} />
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
                <button type="button" onClick={() => setShowPasswordModal(false)} style={{ padding: '8px 14px', background: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Hủy</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>Xác Nhận Đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}