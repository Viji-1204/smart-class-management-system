
import React, { useState, useEffect } from 'react';
import { User, UserRole, MarkRecord } from '../types';
import { getStore, updateStore } from '../store';
import { authApi, dashboardApi, marksApi, userApi } from '../api';
import * as XLSX from 'xlsx';
import {
  Users, UserCheck, BookOpen, Settings, LogOut,
  Upload, UserPlus, Trash2, CheckCircle, Smartphone,
  Mail, Briefcase, Calendar, Phone, Shield,
  Edit2, Save, X
} from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const AdvisorDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'faculty' | 'marks' | 'settings'>('students');
  const [students, setStudents] = useState<User[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [selectedVerifyInternal, setSelectedVerifyInternal] = useState<1 | 2>(1);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  const [newStudent, setNewStudent] = useState<Partial<User>>({ name: '', rollNo: '', registerNo: '', email: '', password: '12345678', phone: '', parentPhone: '', currentSem: '1' });
  const [newFaculty, setNewFaculty] = useState<Partial<User>>({ name: '', email: '', password: '12345678', subjectCode: '', subjectName: '', year: '1', currentSem: '1' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [publishMessage, setPublishMessage] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editingFaculty, setEditingFaculty] = useState<User | null>(null);
  const [studentError, setStudentError] = useState('');
  const [facultyError, setFacultyError] = useState('');
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);
  const [uploadConfirmData, setUploadConfirmData] = useState<{ added: User[]; skipped: { row: string; reason: string }[] } | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfileData, setEditingProfileData] = useState({ name: '', phone: '' });
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });

  const sortStudents = (st: User[]) => [...st].sort((a, b) =>
    (a.rollNo || '').localeCompare(b.rollNo || '', undefined, { numeric: true, sensitivity: 'base' })
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dashboardApi.getData(user.role, user.id);
        setStudents(sortStudents(data.students || []));
        setFaculty(data.faculty || []);
        setMarks(data.marks || []);

        // Initial setup for semesters
        const yearNum = typeof user.year === 'string' ? Number(user.year) : user.year;
        const startSem = (yearNum! - 1) * 2 + 1;
        setNewFaculty(prev => ({ ...prev, year: startSem.toString(), currentSem: startSem.toString() }));
        setNewStudent(prev => ({ ...prev, currentSem: startSem.toString() }));
        if (!selectedSemester) setSelectedSemester(startSem.toString());
      } catch (err) {
        console.error('Failed to fetch advisor data', err);
      }
    };
    fetchData();

    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const isValidPhone = (phone: string): boolean => {
    return /^\d{10}$/.test(phone);
  };

  const getSemesterOptions = () => {
    const advisorYear = user?.year ? (typeof user.year === 'string' ? Number(user.year) : user.year) : 1;
    const startSem = (advisorYear - 1) * 2 + 1;
    return [
      { value: startSem.toString(), label: `Sem ${startSem}` },
      { value: (startSem + 1).toString(), label: `Sem ${startSem + 1}` }
    ];
  };

  const handleManualStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    try {
      if (newStudent.phone && newStudent.parentPhone && newStudent.phone === newStudent.parentPhone) {
        setStudentError('Student phone number and parent phone number cannot be the same.');
        return;
      }

      if (!/^\d{10}$/.test(newStudent.phone || '') || !/^\d{10}$/.test(newStudent.parentPhone || '')) {
        setStudentError('Both phone numbers must be exactly 10 digits.');
        return;
      }

      const student: User = {
        ...newStudent as User,
        id: crypto.randomUUID(),
        role: UserRole.STUDENT,
        department: user.department,
        year: user.year!
      };

      await userApi.create(student);
      setStudents(prev => sortStudents([...prev, student]));
      setNewStudent({ name: '', rollNo: '', registerNo: '', email: '', password: '12345678', phone: '', parentPhone: '', currentSem: '1' });
    } catch (err: any) {
      setStudentError(err.response?.data?.message || 'Failed to register student');
    }
  };

  const removeStudent = async (id: string) => {
    try {
      await userApi.delete(id);
      setStudents(prev => prev.filter(st => st.id !== id));
    } catch (err) {
      alert('Failed to delete student');
    }
  };

  const updateStudent = async (id: string, updatedData: Partial<User>) => {
    try {
      if (updatedData.phone && updatedData.parentPhone && updatedData.phone === updatedData.parentPhone) {
        setStudentError('Student phone number and parent phone number cannot be the same.');
        return;
      }

      if ((updatedData.phone && !/^\d{10}$/.test(updatedData.phone)) || (updatedData.parentPhone && !/^\d{10}$/.test(updatedData.parentPhone))) {
        setStudentError('Both phone numbers must be exactly 10 digits.');
        return;
      }

      await userApi.update(id, updatedData);
      setStudents(prev => sortStudents(prev.map(st => st.id === id ? { ...st, ...updatedData } : st)));
      setEditingStudent(null);
    } catch (err) {
      setStudentError('Failed to update student');
    }
  };

  const handleManualFacultyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacultyError('');

    try {
      const facultyObj: User = {
        ...newFaculty as User,
        id: crypto.randomUUID(),
        role: UserRole.FACULTY,
        department: user.department,
        year: user.year!
      };

      await userApi.create(facultyObj);
      setFaculty(prev => [...prev, facultyObj]);
      setNewFaculty({ name: '', email: '', password: '12345678', subjectCode: '', subjectName: '', year: '1' });
    } catch (err: any) {
      setFacultyError(err.response?.data?.message || 'Failed to register faculty');
    }
  };

  const removeFaculty = async (id: string) => {
    try {
      await userApi.delete(id);
      setFaculty(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      alert('Failed to delete faculty');
    }
  };

  const updateFaculty = async (id: string, updatedData: Partial<User>) => {
    try {
      await userApi.update(id, updatedData);
      setFaculty(prev => prev.map(f => f.id === id ? { ...f, ...updatedData } : f));
      setEditingFaculty(null);
    } catch (err) {
      alert('Failed to update faculty');
    }
  };

  const startEditingProfile = () => {
    setEditingProfileData({
      name: user.name,
      phone: user.phone || ''
    });
    setIsEditingProfile(true);
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await authApi.updateProfile({
        id: user.id,
        ...editingProfileData
      });

      if (response.success) {
        // Update local user object (This affects the header and profile display)
        Object.assign(user, response.user);
        setIsEditingProfile(false);
        setProfileMessage({ text: 'Profile updated successfully!', type: 'success' });
        setTimeout(() => setProfileMessage({ text: '', type: '' }), 3000);
      }
    } catch (err) {
      console.error('Failed to update profile', err);
      setProfileMessage({ text: 'Failed to update profile details', type: 'error' });
    }
  };

  const sendSmsToParents = async () => {
    try {
      const response = await marksApi.sendSmsParents({
        internalNo: selectedVerifyInternal,
        semester: selectedSemester,
        department: user.department,
        year: user.year
      });

      if (response.success) {
        if (response.count === 0 && response.total > 0) {
          setSmsMessage(`Alert: 0/%SAME% parents notified. (API Error: Please check server logs)`);
        } else if (response.count < response.total) {
          setSmsMessage(`Partially Sent: ${response.count} of ${response.total} parents notified.`);
        } else {
          setSmsMessage(`SMS Sent Successfully to ${response.count} parents`);
        }
        setTimeout(() => setSmsMessage(''), 5000);
      }
    } catch (err) {
      console.error('Failed to send SMS', err);
      alert('Error sending SMS to parents');
    }
  };

  const publishMarks = async (internalNo: 1 | 2, subjectCode?: string | null, semester?: string | null) => {
    // Check if there are any marks to publish
    const marksToPublish = marks.filter(m =>
      m.internalNo === internalNo &&
      (!semester || m.semester === semester) &&
      (!subjectCode || m.subjectCode === subjectCode) &&
      m.status === 'SUBMITTED'
    );

    if (marksToPublish.length === 0) {
      const alreadyPublished = marks.some(m =>
        m.internalNo === internalNo &&
        (!semester || m.semester === semester) &&
        (!subjectCode || m.subjectCode === subjectCode) &&
        m.status === 'PUBLISHED'
      );

      if (alreadyPublished) {
        setPublishMessage('Marks already published');
      } else {
        setPublishMessage('No marks submitted for publication');
      }
      setTimeout(() => setPublishMessage(''), 3000);
      return;
    }

    try {
      const response = await marksApi.publish({
        internalNo,
        subjectCode,
        semester,
        department: user.department,
        year: user.year
      });

      if (response.success) {
        const data = await dashboardApi.getData(user.role, user.id);
        setMarks(data.marks || []);
        setPublishMessage('Published Successfully');
        setTimeout(() => setPublishMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to publish marks', err);
      alert('Error publishing marks');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.currentPassword !== user.password) {
      setPasswordError('Current password is incorrect');
      return;
    }

    try {
      await userApi.update(user.id, { password: passwordData.newPassword });
      updateStore(s => ({
        currentUser: { ...user, password: passwordData.newPassword }
      }));
      setPasswordData({ currentPassword: '', newPassword: '' });
      setPasswordSuccess('Password changed successfully');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError('Failed to change password.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        const added: User[] = [];
        const skipped: { row: string; reason: string }[] = [];
        const seenRollNos = new Set(students.map(s => s.rollNo));

        for (const row of rawData) {
          const name = String(row.name || row.Name || '');
          const rollNo = String(row.rollNo || row.RollNo || '');
          const registerNo = String(row.registerNo || row.RegisterNo || '');
          const email = String(row.email || row.Email || '');
          const phone = String(row.phone || row.Phone || '');
          const parentPhone = String(row.parentPhone || row.ParentPhone || '');
          const currentSem = String(row.currentSem || row.CurrentSem || '1');

          if (!name || !rollNo || !email) {
            skipped.push({ row: rollNo || name || 'Unknown', reason: 'Missing Name, Roll No, or Email' });
            continue;
          }

          if (seenRollNos.has(rollNo)) {
            skipped.push({ row: rollNo, reason: 'Duplicate Roll No' });
            continue;
          }

          if (!/^\d{10}$/.test(phone) || !/^\d{10}$/.test(parentPhone)) {
            skipped.push({ row: rollNo, reason: 'Phone numbers must be 10 digits' });
            continue;
          }

          if (phone === parentPhone) {
            skipped.push({ row: rollNo, reason: 'Student and Parent phone numbers cannot be the same' });
            continue;
          }

          const student: User = {
            id: crypto.randomUUID(),
            role: UserRole.STUDENT,
            name,
            rollNo,
            registerNo,
            email,
            password: '12345678',
            phone,
            parentPhone,
            currentSem,
            department: user.department,
            year: user.year!
          };

          added.push(student);
          seenRollNos.add(rollNo);
        }

        setUploadConfirmData({ added, skipped });
        setShowUploadConfirm(true);
      } catch (err) {
        console.error('File parsing failed', err);
        setStudentError('Failed to parse file. Please ensure it is a valid Excel or CSV file.');
      }
    };
    reader.readAsBinaryString(file);
    // Reset input
    e.target.value = '';
  };

  const confirmBulkUpload = async () => {
    if (!uploadConfirmData) return;

    setStudentError('');
    let successCount = 0;
    const newAdded: User[] = [];

    for (const student of uploadConfirmData.added) {
      try {
        await userApi.create(student);
        newAdded.push(student);
        successCount++;
      } catch (err: any) {
        console.error('Failed to register student', student.rollNo, err);
      }
    }

    setStudents(prev => sortStudents([...prev, ...newAdded]));
    setPublishMessage(`Successfully uploaded ${successCount} students.`);
    setTimeout(() => setPublishMessage(''), 5000);
    setShowUploadConfirm(false);
    setUploadConfirmData(null);
  };

  const getAttendanceSummary = () => {
    const relevant = marks.filter(m => m.status === 'PUBLISHED');
    if (!relevant.length) return 0;
    return (relevant.reduce((a, b) => a + b.attendance, 0) / relevant.length).toFixed(1);
  };

  const getAverageClassPerformance = () => {
    const relevant = marks.filter(m => m.status === 'PUBLISHED');
    if (!relevant.length) return 0;
    const uniqueStudents = [...new Set(relevant.map(m => m.studentId))];
    const studentAverages = uniqueStudents.map(studentId => {
      const studentMarks = relevant.filter(m => m.studentId === studentId);
      return studentMarks.reduce((sum, m) => sum + m.totalScore, 0) / studentMarks.length;
    });
    return (studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length).toFixed(1);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-blue-400">Advisor Portal</h2>
          <p className="text-xs text-slate-400 mt-1">{user.department} Dept | Year {user.year}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('students')} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'students' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <Users size={20} />
            <span>Students</span>
          </button>
          <button onClick={() => setActiveTab('faculty')} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'faculty' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <BookOpen size={20} />
            <span>Faculty & Subjects</span>
          </button>
          <button onClick={() => setActiveTab('marks')} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'marks' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <UserCheck size={20} />
            <span>Verification</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>
        <button onClick={onLogout} className="p-6 border-t border-slate-800 flex items-center space-x-3 hover:text-blue-400">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {activeTab === 'students' ? 'Student Management' : activeTab === 'faculty' ? 'Faculty Management' : activeTab === 'marks' ? 'Verify & Publish' : 'Profile Settings'}
          </h1>
          <div className="text-slate-600 font-medium bg-white px-4 py-2 rounded-lg border shadow-sm">
            Hi, <span className="text-blue-600 font-bold">{user.name}</span>
          </div>
        </header>

        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Upload size={18} /> Bulk Upload</h3>
                <input accept=".csv,.xlsx,.xls" type="file" onChange={handleFileUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {publishMessage && <p className="text-green-600 text-sm mt-2 font-medium">{publishMessage}</p>}
                {studentError && <p className="text-red-600 text-sm mt-2 font-medium">{studentError}</p>}
              </div>
              <div className="flex-[2] bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><UserPlus size={18} /> Manual Registration</h3>
                {studentError && <p className="text-red-500 text-sm mb-2">{studentError}</p>}
                <form onSubmit={handleManualStudentRegister} className="grid grid-cols-2 gap-3">
                  <input required placeholder="Name" value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} className="border rounded p-2 text-sm" />
                  <input required placeholder="Roll No" value={newStudent.rollNo} onChange={e => setNewStudent({ ...newStudent, rollNo: e.target.value })} className="border rounded p-2 text-sm" />
                  <input required placeholder="Reg No" value={newStudent.registerNo} onChange={e => setNewStudent({ ...newStudent, registerNo: e.target.value })} className="border rounded p-2 text-sm" />
                  <input required type="email" placeholder="Email" value={newStudent.email} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} className="border rounded p-2 text-sm" />
                  <input required placeholder="Student Phone (10 digits)" value={newStudent.phone} onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })} className="border rounded p-2 text-sm" />
                  <input required placeholder="Parent Phone (10 digits)" value={newStudent.parentPhone} onChange={e => setNewStudent({ ...newStudent, parentPhone: e.target.value })} className="border rounded p-2 text-sm" />
                  <select value={newStudent.currentSem} onChange={e => setNewStudent({ ...newStudent, currentSem: e.target.value })} className="border rounded p-2 text-sm">
                    {getSemesterOptions().map(sem => <option key={sem.value} value={sem.value}>{sem.label}</option>)}
                  </select>
                  <button className="bg-blue-600 text-white rounded text-sm py-2 hover:bg-blue-700 font-bold">Add Student</button>
                </form>
              </div>
            </div>

            {showUploadConfirm && uploadConfirmData && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 bg-blue-50/30">
                <h3 className="text-lg font-bold text-blue-800 mb-2">Confirm Bulk Upload</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-slate-500">To be added</p>
                    <p className="text-2xl font-bold text-green-600">{uploadConfirmData.added.length}</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-slate-500">Skipped/Duplicate</p>
                    <p className="text-2xl font-bold text-orange-500">{uploadConfirmData.skipped.length}</p>
                  </div>
                </div>

                {uploadConfirmData.skipped.length > 0 && (
                  <div className="mb-4 max-h-32 overflow-auto bg-white p-3 rounded border text-xs">
                    <p className="font-bold mb-1">Skipping details:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      {uploadConfirmData.skipped.map((s, i) => (
                        <li key={i}><span className="font-bold">{s.row}</span>: {s.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={confirmBulkUpload}
                    className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-lg"
                  >
                    Confirm Upload {uploadConfirmData.added.length} Students
                  </button>
                  <button
                    onClick={() => { setShowUploadConfirm(false); setUploadConfirmData(null); }}
                    className="px-6 bg-slate-200 text-slate-700 font-bold py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {editingStudent && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold mb-4">Edit Student Details</h3>
                <form onSubmit={(e) => { e.preventDefault(); updateStudent(editingStudent.id, editingStudent); }} className="grid grid-cols-3 gap-3">
                  <input placeholder="Name" value={editingStudent.name} onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })} className="border rounded p-2 text-sm" />
                  <input placeholder="Roll No" value={editingStudent.rollNo} onChange={e => setEditingStudent({ ...editingStudent, rollNo: e.target.value })} className="border rounded p-2 text-sm" />
                  <input placeholder="Reg No" value={editingStudent.registerNo} onChange={e => setEditingStudent({ ...editingStudent, registerNo: e.target.value })} className="border rounded p-2 text-sm" />
                  <input placeholder="Email" value={editingStudent.email} onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })} className="border rounded p-2 text-sm" />
                  <input placeholder="Student Phone" value={editingStudent.phone} onChange={e => setEditingStudent({ ...editingStudent, phone: e.target.value })} className="border rounded p-2 text-sm" />
                  <input placeholder="Parent Phone" value={editingStudent.parentPhone} onChange={e => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })} className="border rounded p-2 text-sm" />
                  <select value={editingStudent.currentSem} onChange={e => setEditingStudent({ ...editingStudent, currentSem: e.target.value })} className="border rounded p-2 text-sm">
                    {getSemesterOptions().map(sem => <option key={sem.value} value={sem.value}>{sem.label}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-green-600 text-white rounded text-sm font-bold">Save</button>
                    <button type="button" onClick={() => setEditingStudent(null)} className="flex-1 bg-slate-400 text-white rounded text-sm font-bold">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Roll No</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Student Phone</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Parent Phone</th>
                    <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{s.rollNo}</td>
                      <td className="px-4 py-3">{s.name}</td>
                      <td className="px-4 py-3 text-sm">{s.phone}</td>
                      <td className="px-4 py-3 text-sm">{s.parentPhone}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => setEditingStudent(s)} className="text-blue-500 text-sm">Edit</button>
                        <button onClick={() => removeStudent(s.id)} className="text-red-500"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'faculty' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold mb-4">{editingFaculty ? 'Edit Faculty' : 'Register Faculty'}</h3>
              {facultyError && <p className="text-red-500 text-sm mb-2">{facultyError}</p>}
              <form
                onSubmit={editingFaculty ? (e) => { e.preventDefault(); updateFaculty(editingFaculty.id, editingFaculty); } : handleManualFacultyRegister}
                className="grid grid-cols-3 gap-4"
              >
                <input required placeholder="Name" value={editingFaculty ? editingFaculty.name : newFaculty.name} onChange={e => editingFaculty ? setEditingFaculty({ ...editingFaculty, name: e.target.value }) : setNewFaculty({ ...newFaculty, name: e.target.value })} className="border rounded p-2" />
                <input required placeholder="Email" value={editingFaculty ? editingFaculty.email : newFaculty.email} onChange={e => editingFaculty ? setEditingFaculty({ ...editingFaculty, email: e.target.value }) : setNewFaculty({ ...newFaculty, email: e.target.value })} className="border rounded p-2" />
                <input required placeholder="Subject Code" value={editingFaculty ? editingFaculty.subjectCode : newFaculty.subjectCode} onChange={e => editingFaculty ? setEditingFaculty({ ...editingFaculty, subjectCode: e.target.value }) : setNewFaculty({ ...newFaculty, subjectCode: e.target.value })} className="border rounded p-2" />
                <input required placeholder="Subject Name" value={editingFaculty ? editingFaculty.subjectName : newFaculty.subjectName} onChange={e => editingFaculty ? setEditingFaculty({ ...editingFaculty, subjectName: e.target.value }) : setNewFaculty({ ...newFaculty, subjectName: e.target.value })} className="border rounded p-2" />
                <select required value={editingFaculty ? editingFaculty.currentSem : newFaculty.currentSem} onChange={e => editingFaculty ? setEditingFaculty({ ...editingFaculty, currentSem: e.target.value }) : setNewFaculty({ ...newFaculty, currentSem: e.target.value })} className="border rounded p-2">
                  {getSemesterOptions().map(sem => <option key={sem.value} value={sem.value}>{sem.label}</option>)}
                </select>
                <div className="flex gap-2">
                  <button className="flex-1 bg-indigo-600 text-white rounded font-bold">
                    {editingFaculty ? 'Update' : 'Add'}
                  </button>
                  {editingFaculty && (
                    <button type="button" onClick={() => setEditingFaculty(null)} className="flex-1 bg-slate-400 text-white rounded font-bold">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {faculty.map(f => (
                <div key={f.id} className="bg-white p-4 rounded border shadow-sm flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">{f.subjectName}</h4>
                    <p className="text-sm text-slate-500">{f.name}</p>
                    <p className="text-xs text-slate-400">Code: {f.subjectCode}</p>
                    <p className="text-xs text-slate-400">Semester: {f.currentSem}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t flex justify-end gap-3">
                    <button onClick={() => setEditingFaculty(f)} className="text-blue-500 text-sm font-semibold">Edit</button>
                    <button onClick={() => removeFaculty(f.id)} className="text-red-500 font-semibold"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'marks' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><CheckCircle size={18} /> Verification Filters</h3>
              <div className="grid grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Internal</label>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedVerifyInternal(1)} className={`flex-1 py-2 rounded font-bold transition-colors ${selectedVerifyInternal === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Int 1</button>
                    <button onClick={() => setSelectedVerifyInternal(2)} className={`flex-1 py-2 rounded font-bold transition-colors ${selectedVerifyInternal === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Int 2</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Semester</label>
                  <select
                    value={selectedSemester || ''}
                    onChange={e => setSelectedSemester(e.target.value)}
                    className="w-full border rounded p-2 text-sm bg-slate-50"
                  >
                    <option value="">All Semesters</option>
                    {getSemesterOptions().map(sem => (
                      <option key={sem.value} value={sem.value}>{sem.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => publishMarks(selectedVerifyInternal, null, selectedSemester)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2 rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm h-[40px] flex items-center justify-center gap-2 flex-1"
                  >
                    <CheckCircle size={16} />
                    Publish
                  </button>
                  <button
                    onClick={sendSmsToParents}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-5 py-2 rounded-xl font-bold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-sm h-[40px] flex items-center justify-center gap-2 flex-1"
                  >
                    <Smartphone size={16} />
                    Notify Parents
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {publishMessage && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-bold text-sm flex items-center gap-2 shadow-sm"><CheckCircle size={16} /> {publishMessage}</div>}
              {smsMessage && <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 font-bold text-sm flex items-center gap-2 shadow-sm"><Smartphone size={16} /> {smsMessage}</div>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Class Average Performance</p>
                <p className="text-2xl font-bold text-blue-600">{getAverageClassPerformance()}%</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Class Average Attendance</p>
                <p className="text-2xl font-bold text-indigo-600">{getAttendanceSummary()}%</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">Detailed Marks View</h3>
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  Internal {selectedVerifyInternal}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase sticky left-0 bg-slate-50 z-10">Roll No</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase sticky left-[100px] bg-slate-50 z-10 border-r">Student Name</th>
                      {faculty.map(f => (
                        <th key={f.subjectCode} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center min-w-[100px]">
                          {f.subjectCode}
                          <div className="text-[10px] font-normal normal-case opacity-60 truncate max-w-[100px]">{f.subjectName}</div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-center">Avg Attn %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map(s => {
                      const studentMarks = marks.filter(m => m.studentId === s.id && m.internalNo === selectedVerifyInternal);
                      const avgAttn = studentMarks.length > 0 ? (studentMarks.reduce((a, b) => a + b.attendance, 0) / studentMarks.length).toFixed(1) : '-';

                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50">{s.rollNo}</td>
                          <td className="px-4 py-3 text-slate-600 sticky left-[100px] bg-white group-hover:bg-slate-50 border-r">{s.name}</td>
                          {faculty.map(f => {
                            const mark = studentMarks.find(m => m.subjectCode === f.subjectCode);
                            return (
                              <td key={f.subjectCode} className="px-4 py-3 text-center">
                                {mark ? (
                                  <div className="flex flex-col items-center">
                                    <span className={`font-bold ${mark.totalScore < 50 ? 'text-red-600' : 'text-green-600'}`}>
                                      {mark.totalScore}
                                    </span>
                                    <span className="text-[10px] text-slate-400">{mark.attendance}% attn</span>
                                    <span className={`text-[8px] font-bold px-1 rounded ${mark.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                      {mark.status}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center">
                            <span className={`font-medium ${Number(avgAttn) < 75 ? 'text-orange-600' : 'text-slate-600'}`}>
                              {avgAttn}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={faculty.length + 3} className="px-4 py-8 text-center text-slate-400 italic">No students found for this year/department.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="text-indigo-600" size={20} />
                  Advisor Profile Details
                </h3>
                {!isEditingProfile ? (
                  <button
                    onClick={startEditingProfile}
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                  >
                    <Edit2 size={14} /> Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleProfileUpdate}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center gap-1.5"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                )}
              </div>

              {profileMessage.text && (
                <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 text-sm font-medium border ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                  }`}>
                  {profileMessage.type === 'success' ? <CheckCircle size={16} /> : <X size={16} />}
                  {profileMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Users size={18} className="text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={editingProfileData.name}
                        onChange={e => setEditingProfileData({ ...editingProfileData, name: e.target.value })}
                        className="w-full mt-1 border border-slate-200 p-1.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    ) : (
                      <p className="font-semibold text-slate-700">{user.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Mail size={18} className="text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                    <p className="font-semibold text-slate-500 italic">{user.email} (Read only)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Briefcase size={18} className="text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
                    <p className="font-semibold text-slate-500 italic">{user.department} (Read only)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Calendar size={18} className="text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Year</p>
                    <p className="font-semibold text-slate-500 italic">Year {user.year} (Read only)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Phone size={18} className="text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={editingProfileData.phone}
                        onChange={e => setEditingProfileData({ ...editingProfileData, phone: e.target.value })}
                        placeholder="Enter phone number"
                        className="w-full mt-1 border border-slate-200 p-1.5 rounded text-sm bg-white outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    ) : (
                      <p className="font-semibold text-slate-700">{user.phone || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <UserCheck size={18} className="text-teal-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</p>
                    <p className="font-semibold text-slate-500 italic">{user.role} (Read only)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Settings className="text-blue-600" size={20} />
                Security Settings
              </h3>

              <div className="max-w-md">
                <p className="text-sm text-slate-500 mb-4">Update your password to keep your account secure.</p>
                {passwordError && (
                  <div className="mb-4 p-2 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100 italic">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="mb-4 p-2 bg-green-50 text-green-600 text-xs font-bold rounded border border-green-100 italic">
                    {passwordSuccess}
                  </div>
                )}

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordData.newPassword}
                      onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full border border-slate-200 p-2.5 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvisorDashboard;
