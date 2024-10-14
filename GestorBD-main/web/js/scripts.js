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

// Funciones adicionales para la gestión de bases de datos y tablas

async function createDatabase(databaseName) {
    const conn = getConnection();
    await conn.query(`CREATE DATABASE ${databaseName}`);
}

async function createTable(databaseName, tableName, fieldNames, fieldTypes, fieldSizes) {
    const conn = getConnection();
    let fields = fieldNames.map((name, index) => `${name} ${fieldTypes[index]}(${fieldSizes[index]})`).join(', ');
    await conn.query(`CREATE TABLE ${databaseName}.${tableName} (${fields})`);
}

async function insertData(databaseName, tableName, data) {
    const conn = getConnection();
    let fields = Object.keys(data).join(', ');
    let values = Object.values(data);
    let placeholders = values.map(() => '?').join(', ');
    await conn.query(`INSERT INTO ${databaseName}.${tableName} (${fields}) VALUES (${placeholders})`, values);
}

async function updateData(databaseName, tableName, id, data) {
    const conn = getConnection();
    let updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    let values = Object.values(data);
    await conn.query(`UPDATE ${databaseName}.${tableName} SET ${updates} WHERE id = ?`, [...values, id]);
}

async function deleteData(databaseName, tableName, id) {
    const conn = getConnection();
    await conn.query(`DELETE FROM ${databaseName}.${tableName} WHERE id = ?`, [id]);
}

async function dropTable(databaseName, tableName) {
    const conn = getConnection();
    await conn.query(`DROP TABLE ${databaseName}.${tableName}`);
}

module.exports = {
    initializeDatabase,
    getConnection,
    createDatabase,
    createTable,
    insertData,
    updateData,
    deleteData,
    dropTable
};