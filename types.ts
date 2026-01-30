
export enum UserRole {
  HOD = 'HOD',
  ADVISOR = 'ADVISOR',
  FACULTY = 'FACULTY',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  role: UserRole;
  email: string;
  password: string;
  name: string;
  department: string;
  year?: string; // For Advisor & Student
  phone?: string;
  subjectCode?: string; // For Faculty
  subjectName?: string; // For Faculty
  rollNo?: string; // For Student
  registerNo?: string; // For Student
  currentSem?: string; // For Student
  parentPhone?: string; // For Student
}

export interface MarkRecord {
  id: string;
  studentId: string;
  facultyId: string;
  advisorId: string;
  subjectCode: string;
  subjectName: string;
  semester: string;
  internalNo: 1 | 2;
  testScoreRaw: number; // 0-100
  testScoreConverted: number; // 0-60
  assignmentScore: number; // 0-40
  totalScore: number; // 0-100
  attendance: number; // 0-100
  status: 'DRAFT' | 'SUBMITTED' | 'PUBLISHED';
  publishedAt?: string;
  studentName?: string; // Opt-in from backend join
  rollNo?: string;      // Opt-in from backend join
}

export interface AppState {
  currentUser: User | null;
  hods: User[];
  advisors: User[];
  faculty: User[];
  students: User[];
  marks: MarkRecord[];
}
