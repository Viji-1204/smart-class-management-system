
import React, { useState } from 'react';
import { UserRole } from '../types';
import { getStore, updateStore } from '../store';
import { authApi } from '../api';

interface Props {
  onLoginSuccess: () => void;
}

const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.HOD);
  const [isSignup, setIsSignup] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  const handleHODSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await authApi.signup({
        email,
        password,
        name,
        department
      });

      if (response.success) {
        setIsSignup(false);
        setError('Signup successful! Please login.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await authApi.login({
        email,
        password,
        name,
        department,
        year,
        role: activeRole
      });

      if (response.success) {
        // We still use updateStore for session management in App.tsx
        updateStore(() => ({ currentUser: response.user }));
        onLoginSuccess();
      } else {
        setError(response.message || 'Invalid credentials.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="p-8">
          <h1 className="mb-2 text-center text-3xl font-bold text-slate-800">Government College of Engineering</h1>
          <p className="mb-6 text-center text-slate-500">Welcome back! Please login to your account.</p>

          {!isSignup && (
            <div className="mb-8 flex space-x-1 rounded-lg bg-slate-100 p-1">
              {[UserRole.HOD, UserRole.ADVISOR, UserRole.FACULTY, UserRole.STUDENT].map((role) => (
                <button
                  key={role}
                  onClick={() => { setActiveRole(role); setError(''); }}
                  className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${activeRole === role ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className={`mb-4 rounded-lg p-3 text-sm ${error.includes('successful') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          <form onSubmit={isSignup ? handleHODSignup : handleLogin} className="space-y-4">
            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Enter full name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-all"
                placeholder="email@college.edu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {isSignup && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Department</label>
                <select
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-indigo-500 focus:ring-indigo-500 outline-none transition-all bg-white"
                >
                  <option value="">Select Department</option>
                  <option value="CSE">Computer Science & Engineering</option>
                  <option value="ECE">Electronics & Communication Engineering</option>
                  <option value="ME">Mechanical Engineering</option>
                  <option value="CE">Civil Engineering</option>
                  <option value="IT">Information Technology</option>
                  <option value="AE">Automobile Engineering</option>
                  <option value="EEE">Electrical and Electronics Engineering</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-[0.98] focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {isSignup ? 'Create HOD Account' : `Login as ${activeRole}`}
            </button>
          </form>

          {activeRole === UserRole.HOD && (
            <div className="mt-6 text-center text-sm">
              <span className="text-slate-500">
                {isSignup ? 'Already have an account?' : 'New HOD?'}
              </span>
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="ml-1 font-bold text-indigo-600 hover:underline"
              >
                {isSignup ? 'Login here' : 'Sign up now'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
