const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Mark = require('../models/Mark');
const { Op } = require('sequelize');

// General Dashboard Data (simplified pattern)
router.get('/:role/:id', async (req, res) => {
    try {
        const { role, id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let dashboardData = {};

        if (role === 'HOD') {
            const advisors = await User.findAll({ where: { role: 'ADVISOR', department: user.department } });
            const students = await User.findAll({ where: { role: 'STUDENT', department: user.department } });
            const marks = await Mark.findAll({
                include: [{
                    model: User,
                    as: 'student',
                    where: { department: user.department },
                    attributes: ['name', 'rollNo']
                }]
            });
            const flattenedMarks = marks.map(m => ({
                ...m.toJSON(),
                studentName: m.student?.name,
                rollNo: m.student?.rollNo
            }));
            dashboardData = { advisors, students, marks: flattenedMarks };
        }
        else if (role === 'ADVISOR') {
            const students = await User.findAll({ where: { role: 'STUDENT', department: user.department, year: user.year } });
            const faculty = await User.findAll({ where: { role: 'FACULTY', department: user.department, year: user.year } });
            const marks = await Mark.findAll({
                include: [{
                    model: User,
                    as: 'student',
                    where: { department: user.department, year: user.year },
                    attributes: ['name', 'rollNo']
                }]
            });
            const flattenedMarks = marks.map(m => ({
                ...m.toJSON(),
                studentName: m.student?.name,
                rollNo: m.student?.rollNo
            }));
            dashboardData = { students, faculty, marks: flattenedMarks };
        }
        else if (role === 'FACULTY') {
            const students = await User.findAll({ where: { department: user.department, year: user.year, role: 'STUDENT' } });
            const marks = await Mark.findAll({ where: { facultyId: user.id } });
            dashboardData = { students, marks };
        }
        else if (role === 'STUDENT') {
            const marks = await Mark.findAll({ where: { studentId: user.id, status: 'PUBLISHED' } });
            // To match frontend, we also need to check if faculty still exists
            const facultyIds = marks.map(m => m.facultyId);
            const activeFaculty = await User.findAll({ where: { id: facultyIds, role: 'FACULTY' } });
            const activeFacultyIds = new Set(activeFaculty.map(f => f.id));

            const filteredMarks = marks.filter(m => activeFacultyIds.has(m.facultyId));
            dashboardData = { marks: filteredMarks };
        }

        res.json(dashboardData);
    } catch (error) {
        console.error('Dashboard data error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
