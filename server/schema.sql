
CREATE DATABASE IF NOT EXISTS smart_class_db;
USE smart_class_db;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  role ENUM('HOD', 'ADVISOR', 'FACULTY', 'STUDENT') NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  year VARCHAR(50), -- For Advisor, Faculty, Student
  phone VARCHAR(20), -- For Student
  parentPhone VARCHAR(20), -- For Student
  subjectCode VARCHAR(50), -- For Faculty
  subjectName VARCHAR(255), -- For Faculty
  rollNo VARCHAR(50) UNIQUE, -- For Student
  registerNo VARCHAR(50) UNIQUE, -- For Student
  currentSem VARCHAR(50), -- For Student
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marks (
  id VARCHAR(255) PRIMARY KEY,
  studentId VARCHAR(255) NOT NULL,
  facultyId VARCHAR(255) NOT NULL,
  advisorId VARCHAR(255), -- Optional, can be derived
  subjectCode VARCHAR(50) NOT NULL,
  subjectName VARCHAR(255) NOT NULL,
  semester VARCHAR(50) NOT NULL,
  internalNo INT NOT NULL, -- 1 or 2
  testScoreRaw FLOAT,
  testScoreConverted FLOAT,
  assignmentScore FLOAT,
  totalScore FLOAT,
  attendance FLOAT,
  status ENUM('DRAFT', 'SUBMITTED', 'PUBLISHED') DEFAULT 'DRAFT',
  publishedAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (facultyId) REFERENCES users(id) ON DELETE CASCADE
);
