const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    role: {
        type: DataTypes.ENUM('HOD', 'ADVISOR', 'FACULTY', 'STUDENT'),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    department: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.STRING
    },
    phone: {
        type: DataTypes.STRING
    },
    parentPhone: {
        type: DataTypes.STRING
    },
    subjectCode: {
        type: DataTypes.STRING
    },
    subjectName: {
        type: DataTypes.STRING
    },
    rollNo: {
        type: DataTypes.STRING,
        unique: true
    },
    registerNo: {
        type: DataTypes.STRING,
        unique: true
    },
    currentSem: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'users',
    timestamps: true
});

module.exports = User;
