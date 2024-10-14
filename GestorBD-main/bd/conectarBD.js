const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

let connection;

async function initializeDatabase() {
    connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root'
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS user_management`);
    await connection.changeUser({ database: 'user_management' });

    await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user'
        )
    `);

    const [rows] = await connection.query('SELECT * FROM users WHERE role = "admin"');
    if (rows.length === 0) {
        const hashedPassword = await bcrypt.hash('Password1_', 10);
        await connection.query('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', ['admin@example.com', hashedPassword, 'admin']);
        console.log('Administrador predeterminado creado con correo: admin@example.com y contraseña: Password1_');
    }
}

function getConnection() {
    if (!connection) {
        throw new Error('Database connection is not established.');
    }
    return connection;
}

module.exports = { initializeDatabase, getConnection };