const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { getConnection } = require('../bd/conectarBD');
const { checkAuthenticated, checkAdmin } = require('../clases/accionesClases');
const {
    createDatabase,
    createTable,
    insertData,
    updateData,
    deleteData,
    dropTable
} = require('../bd/accionesBD');

// Ruta para la página de autenticación
router.get('/auth', (req, res) => {
    res.render('auth');
});

// Ruta para la página principal, solo accesible para usuarios autenticados
router.get('/index', checkAuthenticated, async (req, res) => {
    const connection = getConnection(); // Obtener la conexión

    try {
        const [databases] = await connection.query('SHOW DATABASES');
        const databaseNames = databases.map(db => db.Database);
        res.render('index', { databases: databaseNames, user: req.session.user });
    } catch (err) {
        res.status(500).send('Error fetching databases: ' + err.message);
    }
});

// Ruta para redirigir a /home
router.get('/', (req, res) => {
    res.redirect('/home');
});

// Ruta para la página de inicio
router.get('/home', (req, res) => {
    res.render('home');
});

// Ruta para gestionar usuarios, solo accesible para administradores
router.get('/manage-users', checkAdmin, async (req, res) => {
    const connection = getConnection(); // Obtener la conexión

    try {
        const [users] = await connection.query('SELECT id, email, role FROM users WHERE role != "admin"');
        res.render('manage-users', { users });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).send('Error del servidor');
    }
});

// Ruta para registrar usuarios
router.post('/register', async (req, res) => {
    const { nombre, correo, contra } = req.body;
    const connection = getConnection(); // Obtener la conexión

    try {
        const hashedPassword = await bcrypt.hash(contra, 10);
        await connection.query('INSERT INTO users (email, password) VALUES (?, ?)', [correo, hashedPassword]);

        return res.send(`
            <script>
                alert("El usuario se creó con éxito");
                window.location.href = "/index";
            </script>
        `);
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).send('Error del servidor');
    }
});

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
    const { correo, password } = req.body;
    const connection = getConnection(); // Obtener la conexión

    try {
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [correo]);
        if (rows.length > 0) {
            const user = rows[0];
            const match = await bcrypt.compare(password, user.password);

            if (match) {
                req.session.user = user;  // Guardar el usuario en la sesión
                res.redirect('/index');
            } else {
                res.status(401).send('Email or password incorrect');
            }
        } else {
            res.status(401).send('Email or password incorrect');
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).send('Error del servidor');
    }
});

// Ruta para crear una base de datos
router.post('/create-database', async (req, res) => {
    try {
        const { databaseName } = req.body;
        await createDatabase(databaseName);
        res.send(`
            <script>
                alert("La base de datos se creó con éxito");
                window.location.href = "/index";
            </script>
        `);
    } catch (err) {
        res.status(500).send('Error creating database: ' + err.message);
    }
});

// Ruta para crear una tabla
router.post('/create-table', async (req, res) => {
    try {
        const { databaseName, tableName, fieldNames, fieldTypes, fieldSizes } = req.body;
        await createTable(databaseName, tableName, fieldNames, fieldTypes, fieldSizes);
        res.send(`
            <script>
                alert("La tabla se creó con éxito");
                window.location.href = "/index";
            </script>
        `);
    } catch (err) {
        res.status(500).send('Error creating table: ' + err.message);
    }
});

// Ruta para insertar datos en una tabla
router.post('/insert-data', async (req, res) => {
    try {
        const { databaseName, tableName, ...data } = req.body;
        await insertData(databaseName, tableName, data);
        res.send(`
            <script>
                alert("Los datos se insertaron con éxito");
                window.location.href = "/index";
            </script>
        `);
    } catch (err) {
        res.status(500).send('Error inserting data: ' + err.message);
    }
});

// Ruta para actualizar datos en una tabla
router.post('/update-data', async (req, res) => {
    try {
        const { databaseName, tableName, id, ...data } = req.body;
        await updateData(databaseName, tableName, id, data);
        res.send(`
            <script>
                alert("Los datos se actualizaron con éxito");
                window.location.href = "/index";
            </script>
        `);
    } catch (err) {
        res.status(500).send('Error updating data: ' + err.message);
    }
});

// Ruta para eliminar datos de una tabla
router.post('/delete-data', async (req, res) => {
    try {
        const { databaseName, tableName, id } = req.body;
        await deleteData(databaseName, tableName, id);
        res.send(`
            <script>
                alert("Los datos se eliminaron con éxito");
                window.location.href = "/index";
            </script>
        `);
    } catch (err) {
        res.status(500).send('Error deleting data: ' + err.message);
    }
});

// Ruta para eliminar una tabla
router.post('/drop-table', async (req, res) => {
    try {
        const { databaseName, tableName } = req.body;
        await dropTable(databaseName, tableName);
        res.send(`
            <script>
                alert("La tabla se eliminó con éxito");
                window.location.href = "/index";
            </script>
        `);
    } catch (err) {
        res.status(500).send('Error dropping table: ' + err.message);
    }
});

module.exports = router;