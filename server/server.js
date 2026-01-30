const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/db');
const User = require('./models/User');
const Mark = require('./models/Mark');
const SmsLog = require('./models/SmsLog');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Associations
User.hasMany(Mark, { foreignKey: 'studentId' });
Mark.belongsTo(User, { as: 'student', foreignKey: 'studentId' });

User.hasMany(Mark, { foreignKey: 'facultyId' });
Mark.belongsTo(User, { as: 'faculty', foreignKey: 'facultyId' });

User.hasMany(SmsLog, { foreignKey: 'studentId' });
SmsLog.belongsTo(User, { as: 'student', foreignKey: 'studentId' });

// Enhanced Health Check
app.get('/api/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
    }
});

// Import Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/marks', require('./routes/marks'));

// Initial Database Sync
sequelize.sync({ alter: true })
    .then(() => console.log('Database & tables integrated!'))
    .catch(err => console.error('Unable to connect to the database:', err));

// Export for Vercel Serverless
module.exports = app;

// Only start the server locally if not running as a serverless function
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
