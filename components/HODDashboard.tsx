
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getStore, updateStore } from '../store';
import { dashboardApi, userApi } from '../api';
import { Settings, Users, GraduationCap, LogOut, Search, UserPlus } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const HODDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'advisors' | 'students' | 'settings'>('advisors');
  const [advisors, setAdvisors] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<User[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);


  const [newAdv, setNewAdv] = useState({ name: '', email: '', password: '12345678', year: '1' });
  const [editingAdvisor, setEditingAdvisor] = useState<User | null>(null);
  const [advisorError, setAdvisorError] = useState('');
  const [profile, setProfile] = useState<User>(user);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dashboardApi.getData(user.role, user.id);
        setAdvisors(data.advisors || []);
        setStudents(data.students || []);
        setMarks(data.marks || []);
        setFaculty(data.faculty || []);
        setProfile(user);
      } catch (err) {
        console.error('Failed to fetch HOD data', err);
      }
    };
    fetchData();
  }, [user]);

  const handleRegisterAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdvisorError('');

    try {
      const newUser: User = {
        id: crypto.randomUUID(),
        role: UserRole.ADVISOR,
        name: newAdv.name,
        email: newAdv.email,
        password: newAdv.password,
        department: user.department,
        year: newAdv.year
      };

      await userApi.create(newUser);
      setAdvisors(prev => [...prev, newUser].sort((x, y) => Number(x.year) - Number(y.year)));
      setNewAdv({ name: '', email: '', password: '12345678', year: '1' });
    } catch (err: any) {
      console.error('Advisor registration failed:', err);
      const msg = err.response?.data?.message || 'Failed to register advisor';
      setAdvisorError(msg);
    }
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    try {
      const updateData: any = { name: profile.name, email: profile.email };
      if (newPassword) {
        if (currentPasswordInput !== user.password) {
          setProfileError('Current password incorrect');
          return;
        }
        updateData.password = newPassword;
      }

      await userApi.update(user.id, updateData);
      updateStore(s => ({
        currentUser: { ...user, ...updateData }
      }));
      setProfileSuccess('Updated successfully!');
      setCurrentPasswordInput('');
      setNewPassword('');
    } catch (err) {
      setProfileError('Failed to update profile');
    }
  };

  const getPerformance = (year: string) => {
    const yearStudents = students.filter(s => s.year === year);
    if (yearStudents.length === 0) return 0;
    const yearMarks = marks.filter(m => yearStudents.some(s => s.id === m.studentId) && m.status === 'PUBLISHED');
    if (yearMarks.length === 0) return 0;
    const total = yearMarks.reduce((acc, curr) => acc + curr.totalScore, 0);
    return (total / yearMarks.length).toFixed(1);
  };

  const deleteAdvisor = async (id: string) => {
    try {
      await userApi.delete(id);
      setAdvisors(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Failed to delete advisor');
    }
  };

  const updateAdvisor = async (id: string, updatedData: Partial<User>) => {
    setAdvisorError('');
    try {
      await userApi.update(id, updatedData);
      setAdvisors(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a).sort((x, y) => Number(x.year) - Number(y.year)));
      setEditingAdvisor(null);
    } catch (err: any) {
      console.error('Failed to update advisor', err);
      setAdvisorError(err.response?.data?.message || 'Failed to update advisor');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-blue-400">HOD Portal</h2>
          <p className="text-xs text-slate-400 mt-1">{user.department} Dept</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('advisors')} className={`w-full flex items-center space-x-3 p-3 rounded-lg ${activeTab === 'advisors' ? 'bg-blue-600' : ''}`}>
            <Users size={20} />
            <span>Class Advisors</span>
          </button>
          <button onClick={() => setActiveTab('students')} className={`w-full flex items-center space-x-3 p-3 rounded-lg ${activeTab === 'students' ? 'bg-blue-600' : ''}`}>
            <GraduationCap size={20} />
            <span>Performance</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 p-3 rounded-lg ${activeTab === 'settings' ? 'bg-blue-600' : ''}`}>
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>
        <button onClick={onLogout} className="p-6 border-t border-slate-800 flex items-center space-x-3">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800">Department Dashboard</h1>
          <div className="text-slate-600 font-medium bg-white px-4 py-2 rounded-lg border shadow-sm">
            Hi, <span className="text-blue-600 font-bold">{user.name}</span>
          </div>
        </header>

        {activeTab === 'advisors' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded border">
              <h3 className="font-bold mb-4">{editingAdvisor ? 'Edit Advisor' : 'Add Advisor'}</h3>
              <form
                onSubmit={editingAdvisor ? (e) => { e.preventDefault(); updateAdvisor(editingAdvisor.id, editingAdvisor); } : handleRegisterAdvisor}
                className="grid grid-cols-4 gap-2"
              >
                <input
                  required
                  placeholder="Name"
                  value={editingAdvisor ? editingAdvisor.name : newAdv.name}
                  onChange={e => editingAdvisor ? setEditingAdvisor({ ...editingAdvisor, name: e.target.value }) : setNewAdv({ ...newAdv, name: e.target.value })}
                  className="border p-2 rounded text-sm"
                />
                <input
                  required
                  type="email"
                  placeholder="Email"
                  value={editingAdvisor ? editingAdvisor.email : newAdv.email}
                  onChange={e => editingAdvisor ? setEditingAdvisor({ ...editingAdvisor, email: e.target.value }) : setNewAdv({ ...newAdv, email: e.target.value })}
                  className="border p-2 rounded text-sm"
                />
                <select
                  value={editingAdvisor ? editingAdvisor.year : newAdv.year}
                  onChange={e => editingAdvisor ? setEditingAdvisor({ ...editingAdvisor, year: e.target.value }) : setNewAdv({ ...newAdv, year: e.target.value })}
                  className="border p-2 rounded text-sm"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white rounded text-sm font-bold">
                    {editingAdvisor ? 'Update' : 'Add Advisor'}
                  </button>
                  {editingAdvisor && (
                    <button
                      type="button"
                      onClick={() => { setEditingAdvisor(null); setAdvisorError(''); }}
                      className="px-4 bg-slate-200 text-slate-700 rounded text-sm font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
              {advisorError && <p className="text-red-500 text-xs mt-2 font-semibold">{advisorError}</p>}
            </div>

            <div className="bg-white rounded border overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Year</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {advisors.map(adv => (
                    <tr key={adv.id}>
                      <td className="px-6 py-3 font-medium">{adv.name}</td>
                      <td className="px-6 py-3">{adv.year} Year</td>
                      <td className="px-6 py-3 flex gap-2">
                        <button onClick={() => setEditingAdvisor(adv)} className="text-blue-500 text-sm">Edit</button>
                        <button onClick={() => deleteAdvisor(adv.id)} className="text-red-500 text-sm">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            {!selectedYear ? (
              <div className="grid grid-cols-4 gap-4">
                {['1', '2', '3', '4'].map(year => (
                  <div
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg"
                  >
                    <h3 className="font-bold text-lg text-slate-800">{year}{year === '1' ? 'st' : year === '2' ? 'nd' : year === '3' ? 'rd' : 'th'} Year</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{getPerformance(year)}%</p>
                    <p className="text-xs text-slate-400 mt-1">Average Performance</p>
                    <p className="text-sm text-blue-500 mt-3 font-semibold">Click to view details →</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">
                    {selectedYear}{selectedYear === '1' ? 'st' : selectedYear === '2' ? 'nd' : selectedYear === '3' ? 'rd' : 'th'} Year Details
                  </h2>
                  <button
                    onClick={() => setSelectedYear(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold text-slate-700 transition-colors"
                  >
                    ← Back to All Years
                  </button>
                </div>

                {/* Advisor Section */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Users size={20} className="text-blue-600" />
                    Class Advisor
                  </h3>
                  {advisors.filter(a => a.year === selectedYear).map(advisor => (
                    <div key={advisor.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="font-bold text-lg text-blue-900">{advisor.name}</p>
                      <p className="text-sm text-blue-700">{advisor.email}</p>
                      <p className="text-xs text-blue-600 mt-1">Year {advisor.year} Advisor</p>
                    </div>
                  ))}
                  {advisors.filter(a => a.year === selectedYear).length === 0 && (
                    <p className="text-slate-500 text-sm italic">No advisor assigned to this year yet.</p>
                  )}
                </div>

                {/* Faculty Section */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <GraduationCap size={20} className="text-green-600" />
                    Faculty Members
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {faculty.filter(f => {
                      const yearNum = Number(selectedYear);
                      const semStart = (yearNum - 1) * 2 + 1;
                      const semEnd = semStart + 1;
                      return f.currentSem === semStart.toString() || f.currentSem === semEnd.toString();
                    }).map(fac => (
                      <div key={fac.id} className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="font-bold text-green-900">{fac.subjectName}</p>
                        <p className="text-sm text-green-700">{fac.name}</p>
                        <p className="text-xs text-green-600">Code: {fac.subjectCode}</p>
                        <p className="text-xs text-green-600">Sem: {fac.currentSem}</p>
                      </div>
                    ))}
                  </div>
                  {faculty.filter(f => {
                    const yearNum = Number(selectedYear);
                    const semStart = (yearNum - 1) * 2 + 1;
                    const semEnd = semStart + 1;
                    return f.currentSem === semStart.toString() || f.currentSem === semEnd.toString();
                  }).length === 0 && (
                      <p className="text-slate-500 text-sm italic">No faculty assigned to this year yet.</p>
                    )}
                </div>

                {/* Students Section */}
                <div className="bg-white p-6 rounded-xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Users size={20} className="text-purple-600" />
                    Students ({students.filter(s => {
                      const yearNum = Number(selectedYear);
                      const semStart = (yearNum - 1) * 2 + 1;
                      const semEnd = semStart + 1;
                      return s.currentSem === semStart.toString() || s.currentSem === semEnd.toString();
                    }).length})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 font-bold text-slate-600">Roll No</th>
                          <th className="px-4 py-3 font-bold text-slate-600">Name</th>
                          <th className="px-4 py-3 font-bold text-slate-600">Email</th>
                          <th className="px-4 py-3 font-bold text-slate-600">Semester</th>
                          <th className="px-4 py-3 font-bold text-slate-600">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {students
                          .filter(s => {
                            const yearNum = Number(selectedYear);
                            const semStart = (yearNum - 1) * 2 + 1;
                            const semEnd = semStart + 1;
                            return s.currentSem === semStart.toString() || s.currentSem === semEnd.toString();
                          })
                          .sort((a, b) => (a.rollNo || '').localeCompare(b.rollNo || '', undefined, { numeric: true }))
                          .map(student => (
                            <tr key={student.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-medium">{student.rollNo}</td>
                              <td className="px-4 py-3">{student.name}</td>
                              <td className="px-4 py-3 text-slate-600">{student.email}</td>
                              <td className="px-4 py-3 text-slate-600">Sem {student.currentSem}</td>
                              <td className="px-4 py-3 text-slate-600">{student.phone}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {students.filter(s => {
                    const yearNum = Number(selectedYear);
                    const semStart = (yearNum - 1) * 2 + 1;
                    const semEnd = semStart + 1;
                    return s.currentSem === semStart.toString() || s.currentSem === semEnd.toString();
                  }).length === 0 && (
                      <p className="text-slate-500 text-sm italic mt-4">No students enrolled in this year yet.</p>
                    )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded border max-w-lg">
            <h3 className="font-bold mb-4">Edit Profile</h3>
            <form onSubmit={updateProfile} className="space-y-4">
              <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="w-full border p-2 rounded" placeholder="Name" />
              <input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="w-full border p-2 rounded" placeholder="Email" />
              <input type="password" placeholder="Current Password" value={currentPasswordInput} onChange={e => setCurrentPasswordInput(e.target.value)} className="w-full border p-2 rounded" />
              <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border p-2 rounded" />
              <button className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Save Changes</button>
            </form>
            {profileSuccess && <p className="text-green-500 mt-2">{profileSuccess}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default HODDashboard;
