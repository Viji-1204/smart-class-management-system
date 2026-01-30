
import React, { useState, useEffect } from 'react';
import { User, MarkRecord } from '../types';
import { getStore, updateStore } from '../store';
import { dashboardApi, userApi } from '../api';
import { UserCircle, BarChart3, Settings, LogOut, Award, Calendar } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const StudentDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'profile' | 'settings'>('performance');
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [phone, setPhone] = useState(user.phone || '');
  const [parentPhone, setParentPhone] = useState(user.parentPhone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dashboardApi.getData(user.role, user.id);
        setMarks(data.marks || []);
      } catch (err) {
        console.error('Failed to fetch student data', err);
      }
    };
    fetchData();
  }, [user]);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }

    if (currentPassword !== user.password) {
      setPasswordError('Current password is incorrect');
      return;
    }

    if (!newPassword) {
      setPasswordError('New password is required');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password cannot be the same as current password');
      return;
    }

    try {
      await userApi.update(user.id, { password: newPassword });
      updateStore(s => ({
        currentUser: { ...user, password: newPassword }
      }));
      setCurrentPassword('');
      setNewPassword('');
      setPasswordSuccess('Password changed successfully!');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      setPasswordError('Failed to change password. Please try again.');
    }
  };

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneSuccess('');

    // Check if any changes occurred
    if (phone === user.phone && parentPhone === user.parentPhone) {
      setPhoneError('No changes to update');
      return;
    }

    // Validate phone numbers are 10 digits
    if (phone && !/^\d{10}$/.test(phone)) {
      setPhoneError('Student phone must be 10 digits');
      return;
    }

    if (parentPhone && !/^\d{10}$/.test(parentPhone)) {
      setPhoneError('Parent phone must be 10 digits');
      return;
    }

    if (phone === parentPhone) {
      setPhoneError('Parent phone cannot be the same as student phone');
      return;
    }

    try {
      await userApi.update(user.id, { phone, parentPhone });
      updateStore(s => ({
        currentUser: { ...user, phone, parentPhone }
      }));
      setPhoneSuccess('Phone no updated');
      setTimeout(() => setPhoneSuccess(''), 3000);
    } catch (err) {
      setPhoneError('Failed to update phone numbers.');
    }
  };

  const getGPA = () => {
    if (!marks.length) return 0;
    const avg = marks.reduce((a, b) => a + b.totalScore, 0) / marks.length;
    return (avg / 10).toFixed(1);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-blue-400">Student Portal</h2>
          <p className="text-xs text-slate-400 mt-1">{user.rollNo}</p>
          <p className="text-xs text-slate-500">{user.department} | Sem {user.currentSem}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('performance')} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'performance' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <BarChart3 size={20} />
            <span>Academic Performance</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
            <UserCircle size={20} />
            <span>Profile Details</span>
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
            {activeTab === 'performance' ? 'My Performance' : activeTab === 'profile' ? 'My Profile' : 'Settings'}
          </h1>
          <div className="text-slate-500 text-sm">Hi, {user.name}</div>
        </header>

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-2">Internal GPA (Estimated)</p>
                <div className="flex items-center gap-3">
                  <Award className="text-yellow-500" size={32} />
                  <span className="text-4xl font-black text-slate-800">{getGPA()}</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-sm text-slate-400 uppercase font-bold tracking-wider mb-2">Overall Attendance</p>
                <div className="flex items-center gap-3">
                  <Calendar className="text-blue-500" size={32} />
                  <span className="text-4xl font-black text-slate-800">
                    {marks.length ? (marks.reduce((a, b) => a + b.attendance, 0) / marks.length).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold">Internal 1 Assessment</h3>
              </div>
              <table className="w-full text-left">
                <thead className="bg-white border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Subject</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Mark (100)</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marks.filter(m => m.internalNo === 1).length === 0 ? (
                    <tr><td colSpan={3} className="p-12 text-center text-slate-400">No marks published yet.</td></tr>
                  ) : (
                    marks.filter(m => m.internalNo === 1).map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700">{m.subjectName}</p>
                          <p className="text-xs text-slate-400">{m.subjectCode}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-black ${m.totalScore < 50 ? 'text-red-500' : 'text-green-600'}`}>{m.totalScore.toFixed(1)}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600">{m.attendance}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold">Internal 2 Assessment</h3>
              </div>
              <table className="w-full text-left">
                <thead className="bg-white border-b">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Subject</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Mark (100)</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marks.filter(m => m.internalNo === 2).length === 0 ? (
                    <tr><td colSpan={3} className="p-12 text-center text-slate-400">No marks published yet.</td></tr>
                  ) : (
                    marks.filter(m => m.internalNo === 2).map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700">{m.subjectName}</p>
                          <p className="text-xs text-slate-400">{m.subjectCode}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-black ${m.totalScore < 50 ? 'text-red-500' : 'text-green-600'}`}>{m.totalScore.toFixed(1)}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600">{m.attendance}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-4xl">
            <div className="h-32 bg-indigo-600"></div>
            <div className="px-8 pb-8">
              <div className="relative -mt-12 mb-6">
                <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                  <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold text-3xl">
                    {user.name.charAt(0)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Basic Info</h3>
                  <div className="space-y-4">
                    <div><p className="text-xs text-slate-400">Full Name</p><p className="font-medium">{user.name}</p></div>
                    <div><p className="text-xs text-slate-400">Register Number</p><p className="font-medium">{user.registerNo}</p></div>
                    <div><p className="text-xs text-slate-400">Roll Number</p><p className="font-medium">{user.rollNo}</p></div>
                    <div><p className="text-xs text-slate-400">Email Address</p><p className="font-medium">{user.email}</p></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 border-b pb-2">Academic & Contact</h3>
                  <div className="space-y-4">
                    <div><p className="text-xs text-slate-400">Department</p><p className="font-medium">{user.department}</p></div>
                    <div><p className="text-xs text-slate-400">Current Year / Semester</p><p className="font-medium">{user.year} Year / {user.currentSem} Sem</p></div>
                    <div><p className="text-xs text-slate-400">Personal Phone</p><p className="font-medium">{user.phone}</p></div>
                    <div><p className="text-xs text-slate-400">Parent/Guardian Phone</p><p className="font-medium">{user.parentPhone}</p></div>
                  </div>
                </div>
              </div>
              <p className="mt-8 text-xs text-slate-400 bg-slate-50 p-3 rounded italic">Note: Student details can only be modified by the Class Advisor.</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl space-y-6">
            {/* Student Information */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold mb-6">Student Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Full Name</label>
                  <input type="text" disabled value={user.name} className="mt-1 block w-full border rounded-lg p-2 bg-slate-50 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Roll No</label>
                  <input type="text" disabled value={user.rollNo} className="mt-1 block w-full border rounded-lg p-2 bg-slate-50 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Register No</label>
                  <input type="text" disabled value={user.registerNo} className="mt-1 block w-full border rounded-lg p-2 bg-slate-50 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email</label>
                  <input type="email" disabled value={user.email} className="mt-1 block w-full border rounded-lg p-2 bg-slate-50 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Department</label>
                  <input type="text" disabled value={user.department} className="mt-1 block w-full border rounded-lg p-2 bg-slate-50 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Semester</label>
                  <input type="text" disabled value={`Sem ${user.currentSem}`} className="mt-1 block w-full border rounded-lg p-2 bg-slate-50 cursor-not-allowed" />
                </div>
              </div>
            </div>

            {/* Contact Information - Editable */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-bold mb-6">Contact Information</h3>
              <form onSubmit={handleUpdatePhone} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Student Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10 digit number"
                    className="mt-1 block w-full border rounded-lg p-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Parent/Guardian Phone Number</label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="10 digit number"
                    className="mt-1 block w-full border rounded-lg p-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold">Update Phone Numbers</button>
              </form>
              {phoneError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{phoneError}</p>
                </div>
              )}
              {phoneSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm font-medium">{phoneSuccess}</p>
                </div>
              )}
            </div>

            {/* Change Password */}
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
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="mt-1 block w-full border rounded-lg p-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-1 block w-full border rounded-lg p-2 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold">Change Password</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
