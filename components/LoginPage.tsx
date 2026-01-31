
import React, { useState } from 'react';
import { UserRole } from '../types';
import { getStore, updateStore } from '../store';
import { authApi } from '../api';
import { GraduationCap, Lock, Mail, User, Building2, Calendar } from 'lucide-react';

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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">GCE</h1>
              <p className="text-blue-100 text-sm">Smart Management</p>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Government College of<br />Engineering
            </h2>
            <p className="text-xl text-blue-100 leading-relaxed max-w-md">
              Empowering education through intelligent class management and seamless collaboration.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
            <div className="p-2 bg-white/20 rounded-lg mt-1">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Multi-Department Support</h3>
              <p className="text-blue-100 text-sm">Manage multiple departments with ease</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
            <div className="p-2 bg-white/20 rounded-lg mt-1">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Secure & Reliable</h3>
              <p className="text-blue-100 text-sm">Your data is protected with enterprise-grade security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="p-3 bg-indigo-600 rounded-xl">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">GCE</h1>
              <p className="text-slate-600 text-sm">Smart Management</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 p-8 border border-slate-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-slate-500">
                {isSignup ? 'Register as HOD to get started' : 'Sign in to continue to your dashboard'}
              </p>
            </div>

            {!isSignup && (
              <div className="mb-6 grid grid-cols-4 gap-2 p-1.5 bg-slate-100 rounded-xl">
                {[UserRole.HOD, UserRole.ADVISOR, UserRole.FACULTY, UserRole.STUDENT].map((role) => (
                  <button
                    key={role}
                    onClick={() => { setActiveRole(role); setError(''); }}
                    className={`py-2.5 px-2 text-xs font-semibold rounded-lg transition-all duration-200 ${activeRole === role
                        ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100'
                        : 'text-slate-600 hover:text-slate-800'
                      }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className={`mb-6 rounded-xl p-4 text-sm font-medium flex items-start gap-3 ${error.includes('successful')
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                <span className="text-lg">{error.includes('successful') ? '✓' : '⚠'}</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={isSignup ? handleHODSignup : handleLogin} className="space-y-5">
              {isSignup && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                    placeholder="email@college.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {isSignup && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Department</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-800 bg-white appearance-none cursor-pointer"
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
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-300 active:scale-[0.98] mt-6"
              >
                {isSignup ? 'Create HOD Account' : `Sign in as ${activeRole}`}
              </button>
            </form>

            {activeRole === UserRole.HOD && (
              <div className="mt-8 text-center">
                <span className="text-slate-600 text-sm">
                  {isSignup ? 'Already have an account?' : 'New HOD?'}
                </span>
                <button
                  onClick={() => setIsSignup(!isSignup)}
                  className="ml-2 font-bold text-indigo-600 hover:text-indigo-700 text-sm hover:underline transition-colors"
                >
                  {isSignup ? 'Sign in here' : 'Create account'}
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            © 2026 Government College of Engineering. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
