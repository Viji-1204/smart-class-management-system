const express = require('express');
const router = express.Router();
const Mark = require('../models/Mark');
const User = require('../models/User');

// Submit/Update Marks (Faculty)
router.post('/submit', async (req, res) => {
    try {
        const { marks } = req.body; // Expecting array of mark records

        for (const m of marks) {
            // Remove old entry if exists (replacement logic from FacultyDashboard.tsx)
            await Mark.destroy({
                where: {
                    studentId: m.studentId,
                    internalNo: m.internalNo,
                    subjectCode: m.subjectCode,
                    semester: m.semester
                }
            });

            await Mark.create(m);
        }

        res.json({ success: true, message: 'Marks submitted successfully' });
    } catch (error) {
        console.error('Submit marks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

const smsService = require('../services/smsService');

// Publish Marks (Advisor)
router.post('/publish', async (req, res) => {
    try {
        const { internalNo, subjectCode, semester, department, year } = req.body;

        const where = {
            internalNo,
            status: 'SUBMITTED'
        };

        if (subjectCode) where.subjectCode = subjectCode;
        if (semester) where.semester = semester;

        // Find marks for students in this advisor's dept/year, including student phone details
        const marksToPublish = await Mark.findAll({
            include: [{
                model: User,
                as: 'student',
                where: { department, year }
            }],
            where
        });

        for (const m of marksToPublish) {
            m.status = 'PUBLISHED';
            m.publishedAt = new Date();
            await m.save();

            // Send SMS to Student (on publish)
            if (m.student && m.student.phone) {
                const message = `Smart Class: Hi ${m.student.name}, Internal ${m.internalNo} marks for ${m.subjectName} (${m.subjectCode}) is ${m.totalScore}/100. Attendance: ${m.attendance}%. Status: PUBLISHED.`;
                await smsService.sendSMS(m.student.phone, message, m.studentId, 'STUDENT');
            }
        }

        res.json({ success: true, count: marksToPublish.length });
    } catch (error) {
        console.error('Publish marks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send SMS to Parents (Advisor manual trigger)
router.post('/send-sms-parents', async (req, res) => {
    try {
        const { internalNo, subjectCode, semester, department, year } = req.body;

        const where = {
            internalNo,
            status: 'PUBLISHED'
        };

        if (subjectCode) where.subjectCode = subjectCode;
        if (semester) where.semester = semester;

        const marksToNotify = await Mark.findAll({
            include: [{
                model: User,
                as: 'student',
                where: { department, year }
            }],
            where
        });

        let successCount = 0;
        let errors = [];
        for (const m of marksToNotify) {
            if (m.student && m.student.parentPhone) {
                const message = `Smart Class: Hi ${m.student.name}'s parent, Internal ${m.internalNo} marks for ${m.subjectName} is ${m.totalScore}/100. Attendance: ${m.attendance}%. Published by Advisor.`;
                const sent = await smsService.sendSMS(m.student.parentPhone, message, m.studentId, 'PARENT');
                if (sent) {
                    successCount++;
                } else {
                    errors.push(`Failed for ${m.student.name}`);
                }
            }
        }

        res.json({
            success: true,
            count: successCount,
            total: marksToNotify.length,
            errors: errors.length > 0 ? errors : null
        });
    } catch (err) {
        console.error('Failed to send SMS to parents', err);
        res.status(500).json({ error: 'Failed to send SMS' });
    }
});

// Generic User Management (For HOD and Advisor)
router.post('/users', async (req, res) => {
    try {
        const { role, department, year, email } = req.body;

        if (role === 'ADVISOR') {
            // Check if this year already has an advisor
            const yearExists = await User.findOne({ where: { role: 'ADVISOR', department, year } });
            if (yearExists) {
                return res.status(400).json({ message: `An advisor is already assigned to Year ${year} in ${department} department.` });
            }

            // Check if this person (email) is already an advisor for another year
            const advisorExists = await User.findOne({ where: { role: 'ADVISOR', email } });
            if (advisorExists) {
                return res.status(400).json({ message: `This advisor is already assigned to Year ${advisorExists.year}.` });
            }
        }

        const user = await User.create(req.body);
        res.json({ success: true, user });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(400).json({ message: error.message });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role, department, year, email } = req.body;
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (role === 'ADVISOR') {
            // Check if another advisor is assigned to this target year
            const yearExists = await User.findOne({
                where: {
                    role: 'ADVISOR',
                    department,
                    year,
                    id: { [require('sequelize').Op.ne]: id }
                }
            });
            if (yearExists) {
                return res.status(400).json({ message: `An advisor is already assigned to Year ${year} in ${department} department.` });
            }
        }

        await user.update(req.body);
        res.json({ success: true, user });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(400).json({ message: error.message });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.destroy();
        res.json({ success: true });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
