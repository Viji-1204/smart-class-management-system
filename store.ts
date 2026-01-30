
import { AppState, User, MarkRecord, UserRole } from './types';

const STORAGE_KEY = 'smart_class_db_v1';

const defaultState: AppState = {
  currentUser: null,
  hods: [],
  advisors: [
    {
      id: "adv1",
      role: UserRole.ADVISOR,
      name: "Test Advisor",
      email: "advisor@test.com",
      password: "password",
      department: "CSE",
      year: "2" // Testing Year 2 -> Sem 3 & 4
    }
  ],
  faculty: [
    {
      id: 'fac1',
      role: UserRole.FACULTY,
      name: 'Test Faculty',
      email: 'faculty@test.com',
      password: 'password',
      department: 'CSE',
      year: '2',
      subjectCode: 'SUBJ101',
      subjectName: 'Introduction to Testing'
    }
  ],
  students: [
    {
      id: 'stu1',
      role: UserRole.STUDENT,
      name: 'Sample Student',
      email: 'student@test.com',
      password: '12345678',
      rollNo: 'R001',
      registerNo: 'REG001',
      phone: '9999999999',
      parentPhone: '8888888888',
      currentSem: '3',
      department: 'CSE',
      year: '2'
    }
  ],
  marks: [
    {
      id: 'm1',
      studentId: 'stu1',
      facultyId: 'fac1',
      advisorId: 'adv1',
      subjectCode: 'SUBJ101',
      subjectName: 'Introduction to Testing',
      semester: '3',
      internalNo: 1,
      testScoreRaw: 70,
      testScoreConverted: 42,
      assignmentScore: 36,
      totalScore: 78,
      attendance: 85,
      status: 'SUBMITTED'
    }
  ]
};

export const getStore = (): AppState => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultState;
  } catch (error) {
    console.error('Error loading store from localStorage:', error);
    return defaultState;
  }
};

export const saveStore = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const updateStore = (updater: (state: AppState) => Partial<AppState>) => {
  const current = getStore();
  const next = { ...current, ...updater(current) };
  saveStore(next);
  return next;
};

export const clearSession = () => {
  updateStore(() => ({ currentUser: null }));
};
