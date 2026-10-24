
require("dotenv").config();

const mysql = require("mysql2");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "project_2_dashboard",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((error, connection) => {
    if (error) {
        console.error("MySQL connection failed:", error.message);
        return;
    }

    console.log("MySQL database connected successfully!");

    connection.query(
        "SELECT DATABASE() AS databaseName",
        (queryError, results) => {
            if (queryError) {
                console.error("Database query failed:", queryError.message);
            } else {
                console.log(
                    "Connected database:",
                    results[0].databaseName
                );
            }

            connection.release();
        }
    );
});

module.exports = pool;
