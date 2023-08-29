const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');

const app = express();

// Configuración de la vista de Handlebars
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs.engine ({
    defaultLayout: 'main',
    extname: '.hbs'
 }));
app.set('view engine', '.hbs');

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));

// Rutas estáticas
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index'); // Renderiza la vista index.hbs
});
// Importar los routers
const basicosRouter = require('./routes/basicos');
const intermediosRouter = require('./routes/intermedios');
const avanzadosRouter = require('./routes/avanzados');

// Usar los routers en las rutas correspondientes
app.use('/servicios-basicos', basicosRouter);
app.use('/servicios-intermedios', intermediosRouter);
app.use('/servicios-avanzados', avanzadosRouter);

app.use(require('./routes/basicos.js'));
app.use(require('./routes/intermedios.js'));
app.use(require('./routes/avanzados.js'));

app.use('/usuario-paciente', require('./routes/usuario-paciente'));
app.use('/usuario-enfermera', require('./routes/usuario-enfermera'));


// Puerto del servidor
app.set('port', process.env.PORT || 4000);



// Iniciar el servidor

module.exports = app; // Exportar la instancia de la aplicación
