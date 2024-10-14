const mysql = require('mysql2'); 
const { connection } = require('../bd/conectarBD');
const bcrypt = require('bcrypt');

async function createDatabase(databaseName) {
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(databaseName)}`);
}

async function createTable(databaseName, tableName, fieldNames, fieldTypes, fieldSizes) {
    await connection.changeUser({ database: databaseName });

    const fields = [];
    for (let i = 0; i < fieldNames.length; i++) {
        let field = `\`${fieldNames[i]}\` ${fieldTypes[i]}`;
        if (fieldTypes[i].toUpperCase() === 'VARCHAR') {
            field += `(${fieldSizes[i]})`;
        }
        fields.push(field);
    }

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ${fields.join(', ')}
        )
    `;
    await connection.query(createTableQuery);
}

async function insertData(databaseName, tableName, data) {
    await connection.changeUser({ database: databaseName });
    const fields = Object.keys(data);
    const values = Object.values(data);
    
    const columnDefinitions = await connection.query(`DESCRIBE ??`, [tableName]);
    const columnMap = columnDefinitions[0].reduce((map, col) => {
        map[col.Field] = col;
        return map;
    }, {});
    
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        const value = values[i];
        const column = columnMap[field];
        if (column && column.Type.startsWith('varchar')) {
            const maxLength = parseInt(column.Type.match(/\d+/)[0], 10);
            if (value.length > maxLength) {
                throw new Error(`Data too long for column '${field}'. Max length is ${maxLength}.`);
            }
        }
    }

    await connection.query(`INSERT INTO ?? (??) VALUES (?)`, [tableName, fields, values]);
}

async function updateData(databaseName, tableName, id, data) {
    await connection.changeUser({ database: databaseName });

    const fields = Object.keys(data).map(field => `\`${field}\` = ?`).join(', ');
    const values = Object.values(data).concat(id);

    const updateQuery = `UPDATE ?? SET ${fields} WHERE id = ?`;
    await connection.query(updateQuery, [tableName, ...values]);
}

async function deleteData(databaseName, tableName, id) {
    await connection.changeUser({ database: databaseName });
    await connection.query(`DELETE FROM ?? WHERE id = ?`, [tableName, id]);
}

async function dropTable(databaseName, tableName) {
    await connection.changeUser({ database: databaseName });
    await connection.query(`DROP TABLE IF EXISTS ??`, [tableName]);
}

module.exports = {
    createDatabase,
    createTable,
    insertData,
    updateData,
    deleteData,
    dropTable
};