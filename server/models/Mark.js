const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Mark = sequelize.define('Mark', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    facultyId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    advisorId: {
        type: DataTypes.STRING
    },
    subjectCode: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subjectName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    semester: {
        type: DataTypes.STRING,
        allowNull: false
    },
    internalNo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    testScoreRaw: {
        type: DataTypes.FLOAT
    },
    testScoreConverted: {
        type: DataTypes.FLOAT
    },
    assignmentScore: {
        type: DataTypes.FLOAT
    },
    totalScore: {
        type: DataTypes.FLOAT
    },
    attendance: {
        type: DataTypes.FLOAT
    },
    status: {
        type: DataTypes.ENUM('DRAFT', 'SUBMITTED', 'PUBLISHED'),
        defaultValue: 'DRAFT'
    },
    publishedAt: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'marks',
    timestamps: true
});

module.exports = Mark;
