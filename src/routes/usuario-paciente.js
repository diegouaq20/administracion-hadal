const express = require("express");
const router = express.Router();
const Handlebars = require("handlebars");
const { db } = require("./firebase"); // Importa la instancia de Firestore correctamente

Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
  switch (operator) {
    case "===":
      return v1 === v2 ? options.fn(this) : options.inverse(this);
    case "!==":
      return v1 !== v2 ? options.fn(this) : options.inverse(this);
    // Agrega más operadores según sea necesario
    default:
      return options.inverse(this);
  }
});
// Ruta para mostrar la lista de usuarios
router.get("/", async (req, res) => {
  try {
    // Obtener datos de la colección 'usuariopaciente' desde Firestore
    const usersSnapshot = await db.collection("usuariopaciente").get();
    const allUsers = []

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;

      // Obtener el total de servicios para esta enfermera
      const serviciosSnapshot = await db.collection("historial").where("pacienteId", "==", userId).get();
      const totalServicios = serviciosSnapshot.size;

      allUsers.push({
        id: userId,
        userData: userData,
        totalServicios: totalServicios,
      });
    }

    res.render("usuario-paciente", { allUsers });
    console.log("Usuarios recuperados de Firestore:", allUsers);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).send("Error al obtener usuarios");
  }
});

// Ruta para ver información completa de un usuario
router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    // Obtener información de usuario por ID desde Firestore
    const userSnapshot = await db
      .collection("usuariopaciente")
      .doc(userId)
      .get();
    const userData = userSnapshot.exists
      ? { id: userSnapshot.id, ...userSnapshot.data() }
      : null;

    if (userData) {
      // Obtener todos los documentos de la colección 'historial'
      const historialSnapshot = await db.collection("historial").where("pacienteId", "==", userId).get();

      // Mapear los documentos de historial
      const historialData = await Promise.all(
        historialSnapshot.docs.map(async (doc, index) => {
          const historial = { id: doc.id, historialData: { ...doc.data(), numeroFila: index + 1 } };

          // Obtener nombre de la enfermera
          historial.historialData.nombreEnfermera = await getNombreEnfermera(historial.historialData.enfermeraId);

          return historial;
        })
      );

      // Calcular el número total de filas
      const totalFilas = historialData.length;

      res.render("edit-pacientes", { user: userData, historial: historialData, totalFilas }); // Asegúrate de pasar el ID como parte del objeto
    } else {
      res.status(404).send("Usuario no encontrado");
    }
  } catch (error) {
    console.error("Error obteniendo información del usuario:", error);
    res.status(500).send("Error al obtener información del usuario");
  }
});

//Funcion para obtener el id del enfermero
async function getNombreEnfermera(enfermeraId) {
  try {
    const enfermeraSnapshot = await db.collection("usuarioenfermera").doc(enfermeraId).get();
    if (enfermeraSnapshot.exists) {
      const enfermeraData = enfermeraSnapshot.data();
      return `${enfermeraData.nombre} ${enfermeraData.primerApellido}`;
    }
    return "Enfermera no encontrada";
  } catch (error) {
    console.error("Error obteniendo nombre del enfermero:", error);
    return "Error al obtener nombre del enfermero";
  }
}

// Ruta para anular un documento
router.post("/anular-documento/:id/:tipoDocumento", async (req, res) => {
  try {
    const userId = req.params.id;
    const tipoDocumento = req.params.tipoDocumento;

    // Actualizar el campo del documento a null en Firestore
    await db
      .collection("usuariopaciente")
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

// Ruta para cambiar el estado de un usuario
router.post("/cambiar-estado/:id/:nuevoEstado", async (req, res) => {
  try {
    const userId = req.params.id;
    const nuevoEstado = req.params.nuevoEstado;

    // Actualizar el campo de categoría en Firestore
    await db.collection("usuariopaciente").doc(userId).update({
      acceso: nuevoEstado,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error al cambiar el estado:", error);
    res.json({ success: false });
  }
});

router.post("/eliminar-paciente/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Verifica que el ID sea válido antes de intentar eliminar
    if (!userId) {
      console.error("ID de paciente no válido");
      res.redirect("/usuario-paciente");
      return;
    }

    // Obtiene la referencia al documento de Firebase que corresponde al ID
    const contactRef = db.collection("usuariopaciente").doc(userId);

    // Verifica si el documento existe antes de intentar eliminarlo
    const contactDoc = await contactRef.get();
    if (!contactDoc.exists) {
      console.error("El paciente no existe en la base de datos");
      res.redirect("/usuario-paciente");
      return;
    }

    // Realiza la eliminación del documento
    await contactRef.delete();
    console.log("Paciente eliminado exitosamente");

    // Show a native alert to the user
    res.send(
      "<script>alert('Paciente eliminado exitosamente'); window.location='/usuario-paciente';</script>"
    );
  } catch (error) {
    console.error("Error eliminando al paciente:", error);

    // Send an error message
    res.status(500).send("Hubo un error eliminando al paciente");
  }
});

module.exports = router;
