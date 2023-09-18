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

//Eliminar usuario
// Ruta para eliminar usuario (ahora maneja una solicitud POST)
router.post("/eliminar-usuarios/:id", checkAuthentication, async (req, res) => {
  try {
    const contactId = req.params.id;

    // Verifica que el ID sea válido antes de intentar eliminar
    if (!contactId) {
      console.error("ID de usuario no válido");
      res.redirect("/registro-usuarios");
      return;
    }

    // Obtiene la referencia al documento de Firebase que corresponde al ID
    const contactRef = db.collection("usuarioadmin").doc(contactId);

    // Verifica si el documento existe antes de intentar eliminarlo
    const contactDoc = await contactRef.get();
    if (!contactDoc.exists) {
      console.error("El usuario no existe en la base de datos");
      res.redirect("/registro-usuarios");
      return;
    }

    // Realiza la eliminación del documento
    await contactRef.delete();
    console.log("Usuario eliminado exitosamente");
    res.redirect("/registro-usuarios");
  } catch (error) {
    console.error("Error eliminando el usuario:", error);
    res.redirect("/registro-usuarios");
  }
});

// Ruta para procesar la actualización de información de usuario (POST)
// Ruta para mostrar la vista de edición de usuarios
// Ruta para mostrar la vista de edición de usuarios
// Ruta para mostrar la vista de edición de usuarios
router.get("/edit-usuarios/:id", checkAuthentication, async (req, res) => {
  try {
    const userId = req.params.id;

    // Obtén los datos del usuario desde Firestore
    const userSnapshot = await db.collection("usuarioadmin").doc(userId).get();

    if (!userSnapshot.exists) {
      console.error("El usuario no existe en la base de datos");
      res.redirect("/registro-usuarios");
      return;
    }

    const userData = userSnapshot.data();

    // Verifica si el usuario es un maestro
    if (req.session.isMaster) {
      // Si es un maestro, permite el acceso y muestra la vista de edición
      res.render("edit-usuarios", { userData: userData, userId: userId });
    } else {
      // Si no es un maestro, redirige a la página de acceso denegado
      res.redirect("/deny");
    }
  } catch (error) {
    console.error("Error obteniendo datos del usuario:", error);
    res.redirect("/registro-usuarios");
  }
});


// Ruta para procesar la actualización de información de usuario (POST)
router.post("/update-usuarios/:id", checkAuthentication, async (req, res) => {
  try {
    const userId = req.params.id;
    const { usuario, password, master } = req.body;

    // Verifica si el usuario existe en la base de datos antes de actualizar
    const userRef = db.collection("usuarioadmin").doc(userId);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      console.error("El usuario no existe en la base de datos");
      res.redirect("/registro-usuarios");
      return;
    }

    // Define los datos actualizados del usuario
    const updatedUserData = {
      usuario: usuario,
      master: master === "true",
      // Otros campos que desees actualizar
    };

    // Si se proporcionó una nueva contraseña, la hasheamos y la actualizamos
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatedUserData.contraseña = hashedPassword;
    }

    // Actualiza los datos del usuario en la base de datos
    await userRef.update(updatedUserData);

    console.log("Usuario actualizado exitosamente");

    // Redirige al usuario a donde desees después de la edición
    res.redirect("/registro-usuarios");
  } catch (error) {
    console.error("Error al editar el usuario:", error);
    res.redirect("/registro-usuarios");
  }
});

module.exports = router;
