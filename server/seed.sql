
-- Users
-- HOD (Generic Department Head for CSE)
INSERT INTO users (id, role, email, password, name, department, year) VALUES 
('hod1', 'HOD', 'hod@test.com', 'password', 'HOD CSE', 'CSE', NULL);

-- Advisor (CSE, Year 2)
INSERT INTO users (id, role, email, password, name, department, year) VALUES 
('adv1', 'ADVISOR', 'advisor@test.com', 'password', 'Test Advisor', 'CSE', '2');

-- Faculty (CSE, Year 2, Subject: Introduction to Testing)
INSERT INTO users (id, role, email, password, name, department, year, subjectCode, subjectName) VALUES 
('fac1', 'FACULTY', 'faculty@test.com', 'password', 'Test Faculty', 'CSE', '2', 'SUBJ101', 'Introduction to Testing');

-- Student (CSE, Year 2, Sem 3)
INSERT INTO users (id, role, email, password, name, department, year, rollNo, registerNo, phone, parentPhone, currentSem) VALUES 
('stu1', 'STUDENT', 'student@test.com', '12345678', 'Sample Student', 'CSE', '2', 'R001', 'REG001', '9999999999', '8888888888', '3');

-- Marks (Internal 1, Sem 3, Submitted by Faculty)
INSERT INTO marks (id, studentId, facultyId, advisorId, subjectCode, subjectName, semester, internalNo, testScoreRaw, testScoreConverted, assignmentScore, totalScore, attendance, status) VALUES 
('m1', 'stu1', 'fac1', 'adv1', 'SUBJ101', 'Introduction to Testing', '3', 1, 70, 42, 36, 78, 85, 'SUBMITTED');
