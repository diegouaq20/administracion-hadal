const express = require("express");
const router = express.Router();
const Handlebars = require("handlebars");
const { db } = require("./firebase"); // Importa la instancia de Firestore correctamente

// Ruta para mostrar la lista de usuarios
router.get("/", async (req, res) => {
  try {
    // Obtener datos de la colección 'usuariopaciente' desde Firestore
    const usersSnapshot = await db.collection("usuarioenfermera").get();
    const allUsers = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      userData: doc.data(),
    }));

    res.render("usuario-enfermera", { allUsers });
  } catch (error) {
    console.error("Error obteniendo enfermeras:", error);
    res.status(500).send("Error al obtener enfermeras");
  }
});

// Ruta para ver información completa de un usuario
router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    // Obtener información de usuario por ID desde Firestore
    const userSnapshot = await db
      .collection("usuarioenfermera")
      .doc(userId)
      .get();
    const userData = userSnapshot.exists
      ? { id: userSnapshot.id, ...userSnapshot.data() }
      : null;

    if (userData) {
      res.render("edit-enfermeras", { user: userData }); // Asegúrate de pasar el ID como parte del objeto
    } else {
      res.status(404).send("Usuario no encontrado");
    }
  } catch (error) {
    console.error("Error obteniendo información del usuario:", error);
    res.status(500).send("Error al obtener información del usuario");
  }
});

// Ruta para anular un documento
router.post("/anular-documento/:id/:tipoDocumento", async (req, res) => {
  try {
    const userId = req.params.id;
    const tipoDocumento = req.params.tipoDocumento;

    // Actualizar el campo del documento a null en Firestore
    await db
      .collection("usuarioenfermera")
      .doc(userId)
      .update({
        [tipoDocumento]: null,
      });

    res.json({ success: true });
  } catch (error) {
    console.error("Error al anular el documento:", error);
    res.json({ success: false });
  }
});

Handlebars.registerHelper("ifCondEdit", function (v1, operator, v2, options) {
  switch (operator) {
    case "===":
      return v1 === v2 ? options.fn(this) : options.inverse(this);
    // Add more cases for other operators if needed
  }
  return options.inverse(this);
});

router.post("/actualizar-categoria/:id/:nuevaCategoria", async (req, res) => {
  try {
    const userId = req.params.id;
    const nuevaCategoria = req.params.nuevaCategoria;

    // Actualizar el campo de categoría en Firestore
    await db.collection("usuarioenfermera").doc(userId).update({
      categoria: nuevaCategoria,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar la categoría:", error);
    res.json({ success: false });
  }
});

module.exports = router;
