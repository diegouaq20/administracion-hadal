const express = require("express");
const router = express.Router();
const Handlebars = require("handlebars");
const { db } = require("./firebase"); // Importa la instancia de Firestore correctamente

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {
  switch (operator) {
    case '===':
      return (v1 === v2) ? options.fn(this) : options.inverse(this);
    case '!==':
      return (v1 !== v2) ? options.fn(this) : options.inverse(this);
    // Agrega más operadores según sea necesario
  }
});

Handlebars.registerHelper("truncateDecimal", function (value) {
  // Verificar si es un número
  if (typeof value === "number") {
    // Truncar a dos decimales
    return Math.trunc(value * 100) / 100;
  } else {
    // Si no es un número, devolver el valor original
    return value;
  }
});

Handlebars.registerHelper("multiply", function (value, multiplier) {
  return value * multiplier;
});

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
    const userSnapshot = await db.collection("usuarioenfermera").doc(userId).get();
    const userData = userSnapshot.exists
      ? { id: userSnapshot.id, ...userSnapshot.data() }
      : null;

    if (userData) {
      // Obtener todos los documentos de la colección 'historial' para la enfermera actual
      const historialSnapshot = await db.collection("historial").where("enfermeraId", "==", userId).get();
      
      // Mapear los documentos de historial
      const historialData = await Promise.all(
        historialSnapshot.docs.map(async (doc, index) => {
          const historial = { id: doc.id, historialData: { ...doc.data(), numeroFila: index + 1 } };

          // Obtener nombre del paciente
          historial.historialData.nombrePaciente = await getNombrePaciente(historial.historialData.pacienteId);

          return historial;
        })
      );

      // Calcular el número total de filas
      const totalFilas = historialData.length;

      // Calcular la sumatoria total de ganancias
      const sumaTotal = historialData.reduce((total, item) => total + item.historialData.total * 0.75, 0);

      res.render("edit-enfermeras", { user: userData, historial: historialData, totalFilas, sumaTotal });
    } else {
      res.status(404).send("Usuario no encontrado");
    }
  } catch (error) {
    console.error("Error obteniendo información del usuario:", error);
    res.status(500).send("Error al obtener información del usuario");
  }
});

//Funcion para obtener el id del paciente
async function getNombrePaciente(pacienteId) {
  try {
    const pacienteSnapshot = await db.collection("usuariopaciente").doc(pacienteId).get();
    if (pacienteSnapshot.exists) {
      const pacienteData = pacienteSnapshot.data();
      return `${pacienteData.nombre} ${pacienteData.primerApellido}`;
    }
    return "Paciente no encontrado";
  } catch (error) {
    console.error("Error obteniendo nombre del paciente:", error);
    return "Error al obtener nombre del paciente";
  }
}

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

//cambiar estado de la enferemra
router.post("/cambiar-estado/:id/:nuevoEstado", async (req, res) => {
  try {
    const userId = req.params.id;
    const nuevoEstado = req.params.nuevoEstado;

    // Actualizar el campo de categoría en Firestore
    await db.collection("usuarioenfermera").doc(userId).update({
      acceso: nuevoEstado,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error al cambiar el estado:", error);
    res.json({ success: false });
  }
});


module.exports = router;
