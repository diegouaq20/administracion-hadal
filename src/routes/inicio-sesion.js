const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { db } = require("./firebase"); // Asegúrate de tener la ruta correcta

// Define la función checkAuthentication antes de su uso
function checkAuthentication(req, res, next) {
  if (req.session.isAuthenticated) {
    // Si el usuario está autenticado, permite continuar
    return next();
  }
  // Si el usuario no está autenticado, redirige a la página de inicio de sesión
  res.redirect("/inicio-sesion");
}

// Renderizar la página de inicio de sesión
router.get("/inicio-sesion", (req, res) => {
  res.render("inicio-sesion", { layout: "main-inicio-sesion" });
});

// Procesar el formulario de inicio de sesión
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Consultar la colección de usuarios en Firestore
  const userSnapshot = await db
    .collection("usuarioadmin")
    .where("usuario", "==", username)
    .get();

  if (userSnapshot.empty) {
    // Usuario no encontrado
    res.render("inicio-sesion", {
      layout: "main-inicio-sesion",
      error: "Usuario no encontrado",
    });
    return;
  }

  // Obtener el usuario de Firestore
  const user = userSnapshot.docs[0].data();

  // Verificar la contraseña utilizando bcrypt
  const passwordMatch = await bcrypt.compare(password, user.contraseña);

  if (!passwordMatch) {
    // Contraseña incorrecta
    res.render("inicio-sesion", {
      layout: "main-inicio-sesion",
      error: "Contraseña incorrecta",
    });
    return;
  }

  // Verificar si el usuario es superadministrador (supongamos que tienes un campo "master" en Firestore)
  if (user.master === true) {
    req.session.isAuthenticated = true; // Establecer la sesión como autenticada
    req.session.isMaster = true; // Establecer la variable isMaster como verdadera para superadministradores
    console.log("Superadministrador autenticado:", req.session.isAuthenticated);
    res.redirect("/"); // Redirigir a la vista de registro de usuarios
  } else {
    // Si no es superadministrador, aún debe tener isAuthenticated como verdadero
    req.session.isAuthenticated = true;
    req.session.isMaster = false; // Establecer la variable isMaster como falsa para no superadministradores
    console.log("Usuario autenticado:", req.session.isAuthenticated);
    res.redirect("/"); // Redirigir a otra vista que desees para usuarios no superadministradores
  }
});

module.exports = {
  router,
  checkAuthentication,
};
