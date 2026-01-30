import React, { useState, useEffect } from 'react';
import { UserRole, User } from './types';
import { getStore, clearSession } from './store';
import LoginPage from './components/LoginPage';
import HODDashboard from './components/HODDashboard';
import AdvisorDashboard from './components/AdvisorDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import StudentDashboard from './components/StudentDashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const store = getStore();
    setCurrentUser(store.currentUser);
  }, []);

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
  };

  const refreshUser = () => {
    const store = getStore();
    setCurrentUser(store.currentUser);
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={refreshUser} />;
  }

  const renderDashboard = () => {
    switch (currentUser.role) {
      case UserRole.HOD:
        return <HODDashboard user={currentUser} onLogout={handleLogout} />;
      case UserRole.ADVISOR:
        return <AdvisorDashboard user={currentUser} onLogout={handleLogout} />;
      case UserRole.FACULTY:
        return <FacultyDashboard user={currentUser} onLogout={handleLogout} />;
      case UserRole.STUDENT:
        return <StudentDashboard user={currentUser} onLogout={handleLogout} />;
      default:
        return <div>Invalid Role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {renderDashboard()}
    </div>
  );
};

export default App;
