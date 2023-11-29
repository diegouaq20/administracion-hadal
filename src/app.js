const express = require("express");
const morgan = require("morgan");
const exphbs = require("express-handlebars");
const path = require("path");
const handlebarsHelpers = require("handlebars-helpers")();
const registroRouter = require("./routes/registro-usuarios"); // Importa tu enrutador "registro.js"
const inicioSesionRoutes = require("./routes/inicio-sesion");
const session = require("express-session");
const db = require("./routes/firebase");

const app = express();

// Configuración de la vista de Handlebars
app.set("views", path.join(__dirname, "views"));
app.engine(
  ".hbs",
  exphbs.engine({
    defaultLayout: "main", // Layout principal (si lo tienes)
    extname: ".hbs",
    layoutsDir: path.join(__dirname, "views/layouts"), // Directorio de layouts personalizados
    partialsDir: path.join(__dirname, "views/partials"), // Directorio de parciales
    helpers: handlebarsHelpers,
  })
);
app.set("view engine", ".hbs");

app.use(
  session({
    secret: "4ebb321f4cfef524e54ceecbe2c2c15fa6267f62b63d6049b5e02a35f6c593ad", // Cambia esto por una cadena de texto segura
    resave: false,
    saveUninitialized: false,
  })
);

// Middlewares
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));

function checkAuthentication(req, res, next) {

  if (req.session.isAuthenticated) {
    // Si el usuario está autenticado, permite continuar
    return next();
  }
  // Si el usuario no está autenticado, redirige a la página de inicio de sesión
  res.redirect("/inicio-sesion");
}
// Configura express-flash después de express-session

// Rutas estáticas
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  if (req.session.isAuthenticated) {
    res.render("index", { userName: req.session.userName }); // Pasar userName a la vista
  } else {
    res.redirect("/inicio-sesion");
  }
});

// En tu archivo app.js
app.use((req, res, next) => {
  res.locals.userName = req.session.userName || null;
  next();
});


app.use("/", inicioSesionRoutes.router); // Rutas relacionadas con inicio de sesión

app.get("/inicio-sesion", function (req, res) {
  res.render("inicio-sesion", { layout: "main-inicio-sesion" });
});

// Importar los routers
//Servicios
const basicosRouter = require("./routes/basicos");
const intermediosRouter = require("./routes/intermedios");
const avanzadosRouter = require("./routes/avanzados");
//Usuarios
const usuariosRouter = require("./routes/usuario-paciente");
const enfermerasRoutes = require("./routes/usuario-enfermera");
const editUserRoutes = require("./routes/registro-usuarios");

//Registro
// Middleware de autenticación para rutas protegidas
//Servicios
app.use("/servicios-basicos", checkAuthentication, basicosRouter);
app.use("/servicios-intermedios", checkAuthentication, intermediosRouter);
app.use("/servicios-avanzados", checkAuthentication, avanzadosRouter);
//Usuarios
app.use("/usuario-paciente", checkAuthentication, usuariosRouter);

app.use("/usuario-enfermera", checkAuthentication, enfermerasRoutes);
//Registro
app.use("/registro-usuarios", checkAuthentication, registroRouter); // Usa tu enrutador para esta ruta
//Actualizar user
app.use("/edit-usuarios", checkAuthentication, editUserRoutes); // Usa tu enrutador para esta ruta

// Usar los routers en las rutas correspondientes
app.use("/servicios-basicos", basicosRouter);
app.use("/servicios-intermedios", intermediosRouter);
app.use("/servicios-avanzados", avanzadosRouter);
app.use("/registro-usuarios", registroRouter);

app.use(require("./routes/basicos.js"));
app.use(require("./routes/intermedios.js"));
app.use(require("./routes/avanzados.js"));
app.use(require("./routes/registro-usuarios.js"));

app.use("/usuario-paciente", require("./routes/usuario-paciente"));
app.use("/usuario-enfermera", require("./routes/usuario-enfermera"));
app.use("/registro-usuarios", require("./routes/registro-usuarios"));

app.use(inicioSesionRoutes.checkAuthentication); // Middleware para verificar autenticación
app.use(registroRouter);

// En tu archivo principal de rutas (app.js u otro)
app.get("/deny", (req, res) => {
  res.render("deny"); // Esto renderizará una vista llamada "deny.hbs" o como la hayas nombrado
});

app.post("/logout", function (req, res) {
  // Destruye la sesión actual
  req.session.destroy(function () {
    // Redirige al usuario a la página de inicio de sesión u otra página deseada
    res.redirect("/inicio-sesion");
  });
});

// Puerto del servidor
app.set("port", process.env.PORT || 4000);

// Iniciar el servidor

module.exports = app; // Exportar la instancia de la aplicación