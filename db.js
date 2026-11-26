require("dotenv").config()
const mysql = require("mysql2/promise")

const config = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "escola",
    database: process.env.DB_DATABASE || "Godoy3DSC",
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10
}

const pool = mysql.createPool(config)

module.exports = Object.freeze({ config, pool })
