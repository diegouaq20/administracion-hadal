const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { db } = require("./firebase");
const { checkAuthentication } = require("./inicio-sesion");

// Ruta para procesar el formulario de registro
router.post("/registro-usuarios", async (req, res) => {
  const { username, password, master } = req.body;

  // Verifica si el usuario ya existe en la base de datos
  const userSnapshot = await db
    .collection("usuarioadmin")
    .where("usuario", "==", username)
    .get();

  if (!userSnapshot.empty) {
    // El usuario ya existe, muestra un mensaje de error en la vista de registro
    console.error("El usuario ya existe en la base de datos");
    return res.render("registro-usuarios", {
      error: "El usuario ya existe, elige otro nombre de usuario",
    });
  }

  // Hashea la contraseña antes de guardarla en la base de datos
  const hashedPassword = await bcrypt.hash(password, 10);

  // Crea un nuevo usuario en la base de datos, incluyendo el campo "master"
  await db.collection("usuarioadmin").add({
    usuario: username,
    contraseña: hashedPassword,
    master: master === "true", // Convierte el valor a booleano
    // Otros campos del usuario
  });

  // Redirecciona al usuario a la página de inicio de sesión
  res.redirect("/registro-usuarios");
});

// Ruta para mostrar la vista de registro de usuarios
// Ruta para mostrar la vista de registro de usuarios
router.get("/", checkAuthentication, async (req, res) => {
  try {
    if (req.session.isMaster) {
      // Si el usuario es "master," muestra la vista de registro
      // Obtener datos de la colección 'usuarioadmin' desde Firestore
      const usersSnapshot = await db.collection("usuarioadmin").get();
      const allUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        userData: doc.data(),
      }));

      res.render("registro-usuarios", { allUsers: allUsers });
      console.log("Usuarios recuperados de Firestore:", allUsers);
    } else {
      // Si el usuario no es "master," muestra un mensaje de acceso no autorizado
      res.redirect("/deny");
      return; // Agrega un return aquí para evitar que el código siga ejecutándose

      // Luego, redirige al usuario a la vista raíz después de 3 segundos (3000 milisegundos)
    }
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).send("Error al obtener usuarios");
  }
});

module.exports = router;
