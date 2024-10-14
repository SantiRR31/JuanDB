const express = require('express');
const path = require('path');
const session = require('express-session');
const rutas = require('./routes/accionesRutas');
const { initializeDatabase } = require('./bd/conectarBD');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'web')));
app.set('view engine', 'ejs');

// Configurar el middleware de sesiones
app.use(session({
    secret: 'mi_clave_secreta', // Cambia esto por una clave secreta segura
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // En producción, deberías configurar esto como true y usar HTTPS
}));

// Inicializar la base de datos
initializeDatabase()
    .then(() => {
        console.log('Base de datos inicializada');
        // Configurar las rutas después de inicializar la base de datos
        app.use('/', rutas);

        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Servidor escuchando en http://127.0.0.1:${port}`);
        });
    })
    .catch(err => {
        console.error('Error al inicializar la base de datos:', err);
    });