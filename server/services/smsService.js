const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const LOG_FILE = path.join(__dirname, '../sms_logs.txt');
const API_KEY = process.env.SMS_API_KEY;

const SmsLog = require('../models/SmsLog');

const smsService = {
    /**
     * Sends a real SMS using Fast2SMS Dev API and logs to DB.
     * @param {string} to - Recipient phone number (10 digits).
     * @param {string} message - Message content.
     * @param {string} studentId - Related student ID.
     * @param {string} recipientRole - 'STUDENT' or 'PARENT'.
     */
    sendSMS: async (to, message, studentId, recipientRole) => {
        const timestamp = new Date().toLocaleString();
        let logStatus = 'PENDING';
        let apiResponse = null;

        if (!API_KEY || API_KEY.includes('placeholder')) {
            console.warn('[SMS SERVICE] No API Key found. Falling back to simulation.');
            logStatus = 'SIMULATED';
        } else {
            try {
                // Fast2SMS URL: https://www.fast2sms.com/dev/bulkV2
                const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
                    route: 'q',
                    message: message,
                    language: 'english',
                    numbers: to
                }, {
                    headers: {
                        'authorization': API_KEY,
                        'Content-Type': 'application/json'
                    }
                });

                apiResponse = response.data;
                if (apiResponse.return === true) {
                    logStatus = 'SUCCESS';
                } else {
                    logStatus = 'FAILED';
                }
            } catch (err) {
                logStatus = 'ERROR';
                apiResponse = err.response ? err.response.data : err.message;
            }
        }

        // Log to DB
        try {
            await SmsLog.create({
                studentId,
                recipientRole,
                recipientPhone: to,
                message,
                status: logStatus,
                apiResponse: apiResponse ? apiResponse : null
            });
        } catch (dbErr) {
            console.error('[SMS SERVICE] Failed to save DB log:', dbErr.message);
        }

        // Log to file (Legacy support)
        const logEntry = `[${timestamp}] STATUS: ${logStatus} | TO: ${to} | ROLE: ${recipientRole} | MSG: ${message}\n`;
        try {
            fs.appendFileSync(LOG_FILE, logEntry);
        } catch (err) { }

        return logStatus === 'SUCCESS' || logStatus === 'SIMULATED';
    }
};

module.exports = smsService;
