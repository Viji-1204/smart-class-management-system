
const Sequelize = require("sequelize");
require("mysql2"); // Explicitly required for Vercel bundling
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "smart_class_db",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "password",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
    logging: false,
  }
);

module.exports = sequelize;
