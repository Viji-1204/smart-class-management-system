const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SmsLog = sequelize.define('SmsLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    recipientRole: {
        type: DataTypes.ENUM('STUDENT', 'PARENT'),
        allowNull: false
    },
    recipientPhone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    apiResponse: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'sms_logs',
    timestamps: true
});

module.exports = SmsLog;
