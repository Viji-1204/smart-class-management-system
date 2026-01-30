
import React, { useState, useEffect } from 'react';
import { User, MarkRecord, UserRole } from '../types';
import { getStore, updateStore } from '../store';
import { dashboardApi, marksApi, userApi } from '../api';
import { ClipboardList, Users, Settings, LogOut, CheckCircle } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const FacultyDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'marks' | 'settings'>('students');
  const [students, setStudents] = useState<User[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>('1');
  const [selectedInternal, setSelectedInternal] = useState<1 | 2>(1);
  const [localMarks, setLocalMarks] = useState<Record<string, { test: number | string, assignment: number | string, attendance: number | string }>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dashboardApi.getData(user.role, user.id);
        const classStudents = data.students || [];
        setStudents(classStudents);

        // Initialize local marks state from backend data
        const initialMarks: any = {};
        classStudents.forEach((s: any) => {
          const existing = (data.marks || []).find((m: any) =>
            m.studentId === s.id &&
            m.internalNo === selectedInternal &&
            m.subjectCode === user.subjectCode &&
            m.semester === selectedSemester
          );
          initialMarks[s.id] = existing ? {
            test: existing.testScoreRaw,
            assignment: existing.assignmentScore,
            attendance: existing.attendance
          } : { test: '', assignment: '', attendance: '' };
        });
        setLocalMarks(initialMarks);
      } catch (err) {
        console.error('Failed to fetch faculty data', err);
      }
    };
    fetchData();
  }, [user, selectedInternal, selectedSemester]);

  const updateLocalMark = (studentId: string, field: 'test' | 'assignment' | 'attendance', value: number | string) => {
    let finalValue = value;

    // Validate and enforce limits
    if (field === 'test' && value !== '') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue) && numValue > 100) {
        finalValue = 100;
      } else if (!isNaN(numValue) && numValue < 0) {
        finalValue = 0;
      }
    } else if (field === 'assignment' && value !== '') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue) && numValue > 40) {
        finalValue = 40;
      } else if (!isNaN(numValue) && numValue < 0) {
        finalValue = 0;
      }
    } else if (field === 'attendance' && value !== '') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(numValue) && numValue > 100) {
        finalValue = 100;
      } else if (!isNaN(numValue) && numValue < 0) {
        finalValue = 0;
      }
    }

    setLocalMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: finalValue }
    }));
  };

  const calculateFinal = (test: number | string, assignment: number | string) => {
    const testNum = typeof test === 'string' ? (test === '' ? NaN : parseFloat(test)) : test;
    const assignmentNum = typeof assignment === 'string' ? (assignment === '' ? NaN : parseFloat(assignment)) : assignment;

    // If both fields are empty, return empty string to avoid showing 0
    if (isNaN(testNum) && isNaN(assignmentNum)) return '';

    const t = isNaN(testNum) ? 0 : testNum;
    const a = isNaN(assignmentNum) ? 0 : assignmentNum;
    const convertedTest = (t / 100) * 60;
    return parseFloat((convertedTest + a).toFixed(1)).toString();
  };

  // Fixed TypeScript errors by explicitly typing the dataEntry object
  const handleSubmitMarks = async () => {
    const marksToSubmit: MarkRecord[] = [];
    const submittedIds: string[] = [];

    Object.entries(localMarks).forEach(([studentId, dataEntry]) => {
      const data = dataEntry as { test: number | string; assignment: number | string; attendance: number | string };
      const student = students.find(st => st.id === studentId);
      if (!student) return;

      if (data.test === '' || data.assignment === '' || data.attendance === '') {
        return;
      }

      const testNum = typeof data.test === 'string' ? parseFloat(data.test) : data.test;
      const assignmentNum = typeof data.assignment === 'string' ? parseFloat(data.assignment) : data.assignment;
      const attendanceNum = typeof data.attendance === 'string' ? parseFloat(data.attendance) : data.attendance;

      const testConverted = (testNum / 100) * 60;
      const total = testConverted + assignmentNum;

      const record: MarkRecord = {
        id: crypto.randomUUID(),
        studentId,
        facultyId: user.id,
        advisorId: '', // Will be handled/derived if needed on backend or kept for compatibility
        subjectCode: user.subjectCode!,
        subjectName: user.subjectName!,
        semester: selectedSemester,
        internalNo: selectedInternal,
        testScoreRaw: testNum,
        testScoreConverted: testConverted,
        assignmentScore: assignmentNum,
        totalScore: total,
        attendance: attendanceNum,
        status: 'SUBMITTED'
      };
      marksToSubmit.push(record);
      submittedIds.push(studentId);
    });

    if (marksToSubmit.length === 0) {
      setSuccessMessage('No new marks to submit');
      return;
    }

    try {
      await marksApi.submit(marksToSubmit);

      // Clear submitted inputs
      setLocalMarks(prev => {
        const next = { ...prev };
        submittedIds.forEach(id => {
          next[id] = { test: '', assignment: '', attendance: '' };
        });
        return next;
      });

      setSuccessMessage(`Marks submitted successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to submit marks', err);
      setSuccessMessage('Error submitting marks. Please try again.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (passwordData.currentPassword !== user.password) {
      setPasswordError('Current password is incorrect');
      return;
    }

    if (!passwordData.newPassword) {
      setPasswordError('New password is required');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('New password cannot be the same as current password');
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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out`}>
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-blue-400">Faculty Portal</h2>
          <p className="text-xs text-slate-400 mt-1">{user.subjectName}</p>
          <p className="text-xs text-slate-500">{user.year} Year | {user.department}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => { setActiveTab('students'); setMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'students' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <Users size={20} />
            <span>Class Students</span>
          </button>
          <button onClick={() => { setActiveTab('marks'); setMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'marks' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <ClipboardList size={20} />
            <span>Internal Marks</span>
          </button>
          <button onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>
        <button onClick={onLogout} className="p-6 border-t border-slate-800 flex items-center space-x-3 hover:text-blue-400">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-800">Faculty Portal</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        <div className="p-4 lg:p-8">
          <header className="mb-6 lg:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
              {activeTab === 'students' ? 'Student List' : activeTab === 'marks' ? 'Enter Assessment Marks' : 'Settings'}
            </h1>
            <div className="text-slate-500 text-sm lg:text-base">Faculty: {user.name}</div>
          </header>

          {activeTab === 'students' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Roll No</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium">{s.rollNo}</td>
                      <td className="px-6 py-4">{s.name}</td>
                      <td className="px-6 py-4 text-slate-500">{s.email}</td>
                      <td className="px-6 py-4">{s.currentSem}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'marks' && (
            <div className="space-y-6">
              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">{successMessage}</p>
                </div>
              )}
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="font-semibold">Select Semester:</span>
                {[1, 2].map(num => (
                  <button
                    key={num}
                    onClick={() => setSelectedSemester(num.toString())}
                    className={`px-4 py-1 rounded-full text-sm font-bold transition ${selectedSemester === num.toString() ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                  >
                    Semester {num}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="font-semibold">Select Internal:</span>
                {[1, 2].map(num => (
                  <button
                    key={num}
                    onClick={() => setSelectedInternal(num as 1 | 2)}
                    className={`px-4 py-1 rounded-full text-sm font-bold transition ${selectedInternal === num ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                  >
                    Internal {num}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Test (100)</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Conv (60)</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Assign (40)</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Total (100)</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Attend (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map(s => {
                      const m = localMarks[s.id] || { test: '', assignment: '', attendance: '' };
                      const testNum = typeof m.test === 'string' ? (m.test === '' ? NaN : parseFloat(m.test)) : m.test;
                      return (
                        <tr key={s.id}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-sm">{s.name}</p>
                            <p className="text-xs text-slate-400">{s.rollNo}</p>
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" max="100" value={m.test} onChange={e => updateLocalMark(s.id, 'test', e.target.value)} className="w-16 border rounded p-1 text-sm" placeholder="0" />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {isNaN(testNum) ? '' : ((testNum / 100) * 60).toFixed(1)}
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" max="40" value={m.assignment} onChange={e => updateLocalMark(s.id, 'assignment', e.target.value)} className="w-16 border rounded p-1 text-sm" placeholder="0" />
                          </td>
                          <td className="px-4 py-3 font-bold text-blue-600">
                            {calculateFinal(m.test, m.assignment)}
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" max="100" value={m.attendance} onChange={e => updateLocalMark(s.id, 'attendance', e.target.value)} className="w-16 border rounded p-1 text-sm" placeholder="0" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmitMarks}
                  className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-green-700 transition"
                >
                  <CheckCircle size={20} /> Submit Internal {selectedInternal} Marks
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-2xl space-y-6">
              {/* Profile Settings */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold mb-6">Profile Settings</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Name</label>
                    <input type="text" defaultValue={user.name} className="mt-1 block w-full border rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Email (Restricted)</label>
                    <input disabled value={user.email} className="mt-1 block w-full border rounded-lg p-2 bg-slate-50 cursor-not-allowed" />
                  </div>
                  <button disabled className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold opacity-70">Update Profile</button>
                </form>
              </div>

              {/* Password Change */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold mb-6">Change Password</h3>
                {passwordError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">{passwordError}</p>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm font-medium">{passwordSuccess}</p>
                  </div>
                )}
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter your current password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="mt-1 block w-full border rounded-lg p-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="mt-1 block w-full border rounded-lg p-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold">Change Password</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
