import mysql from "mysql2/promise";  // ✅ Use promise-based MySQL2

const pool = mysql.createPool({
    host: "localhost",
    user: "root",      // Change if your MySQL username is different
    password: "root",      // Change if you have set a password
    database: "donation_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;
