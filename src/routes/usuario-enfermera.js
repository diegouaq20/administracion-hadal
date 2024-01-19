const express = require("express");
const router = express.Router();
const Handlebars = require("handlebars");
const { db } = require("./firebase"); // Importa la instancia de Firestore correctamente
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
  switch (operator) {
    case "===":
      return v1 === v2 ? options.fn(this) : options.inverse(this);
    case "!==":
      return v1 !== v2 ? options.fn(this) : options.inverse(this);
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
    // Obtener datos de la colección 'usuarioenfermera' desde Firestore
    const usersSnapshot = await db.collection("usuarioenfermera").get();
    const allUsers = [];

    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;

      // Obtener el total de servicios para esta enfermera
      const serviciosSnapshot = await db
        .collection("historial")
        .where("enfermeraId", "==", userId)
        .get();
      const totalServicios = serviciosSnapshot.size;

      allUsers.push({
        id: userId,
        userData: userData,
        totalServicios: totalServicios,
      });
    }

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
      // Obtener todos los documentos de la colección 'historial' para la enfermera actual
      const historialSnapshot = await db
        .collection("historial")
        .where("enfermeraId", "==", userId)
        .get();

      // Mapear los documentos de historial
      const historialData = await Promise.all(
        historialSnapshot.docs.map(async (doc, index) => {
          const historial = {
            id: doc.id,
            historialData: { ...doc.data(), numeroFila: index + 1 },
          };

          // Obtener nombre del paciente
          historial.historialData.nombrePaciente = await getNombrePaciente(
            historial.historialData.pacienteId
          );

          return historial;
        })
      );

      // Calcular el número total de filas
      const totalFilas = historialData.length;

      // Calcular la sumatoria total de ganancias
      const sumaTotal = historialData.reduce(
        (total, item) => total + item.historialData.total * 0.75,
        0
      );

      res.render("edit-enfermeras", {
        user: userData,
        historial: historialData,
        totalFilas,
        sumaTotal,
      });
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
    const pacienteSnapshot = await db
      .collection("usuariopaciente")
      .doc(pacienteId)
      .get();
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

router.post("/eliminar-enfermera/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Verifica que el ID sea válido antes de intentar eliminar
    if (!userId) {
      console.error("ID de enfermera no válido");
      res.redirect("/usuario-enfermera");
      return;
    }

    // Obtiene la referencia al documento de Firebase que corresponde al ID
    const contactRef = db.collection("usuarioenfermera").doc(userId);

    // Verifica si el documento existe antes de intentar eliminarlo
    const contactDoc = await contactRef.get();
    if (!contactDoc.exists) {
      console.error("La enfermera no existe en la base de datos");
      res.redirect("/usuario-enfermera");
      return;
    }

    // Realiza la eliminación del documento
    await contactRef.delete();
    console.log("Enfermera eliminada exitosamente");

    // Show a native alert to the user
    res.send(
      "<script>alert('Enfermera eliminada exitosamente'); window.location='/usuario-enfermera';</script>"
    );
  } catch (error) {
    console.error("Error eliminando a la enfermera:", error);

    // Send an error message
    res.status(500).send("Hubo un error eliminando a la enfermera");
  }
});
// Ruta para generar el informe en formato Excel o PDF
router.post("/generar-informe/:id/:anio/:fecha", async (req, res) => {
  try {
    const userId = req.params.id;
    const anioSeleccionado = req.params.anio;
    const fechaSeleccionada = req.params.fecha;

    // Obtener servicios completados para la fecha y el año seleccionados
    const serviciosSnapshot = await db
      .collection("historial")
      .where("mes", "==", fechaSeleccionada)
      .where("ano", "==", anioSeleccionado)
      .where("enfermeraId", "==", userId) // Filter services for the specific nurse
      .get();

    const serviciosData = serviciosSnapshot.docs.map(doc => doc.data());

    // Check if there are services for the nurse
    if (serviciosData.length === 0) {
      return res.status(404).send("No se encontraron servicios para la enfermera");
    }

    // Check the requested format (PDF or Excel)
    const requestedFormat = req.query.format;
    if (requestedFormat === "pdf") {
      // Generate PDF and send to the client
      const pdfDoc = new PDFDocument();
      pdfDoc.pipe(res);

      // Add PDF content
      pdfDoc.text('Informe de Servicios Completados', 50, 50);
      serviciosData.forEach(servicio => {
        pdfDoc.text(`${servicio.fecha} - ${servicio.hora} - ${servicio.servicio} - ${servicio.tipoCategoria} - ${servicio.tipoServicio} - ${servicio.total} - ${servicio.nombrePaciente}`);
      });

      // Finalize the PDF document
      pdfDoc.end();
    } else if (requestedFormat === "excel") {
      // Generate Excel and send to the client
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('InformeServicios');

      // Add headers
      worksheet.addRow(['Fecha', 'Hora', 'Servicio', 'Categoría', 'Tipo', 'Total', 'Paciente']);

      // Add data
      serviciosData.forEach(servicio => {
        worksheet.addRow([
          servicio.fecha,
          servicio.hora,
          servicio.servicio,
          servicio.tipoCategoria,
          servicio.tipoServicio,
          servicio.total,
          servicio.nombrePaciente
        ]);
      });

      // Send the Excel report to the client
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=InformeServicios.xlsx');
      await workbook.xlsx.write(res);
    } else {
      // Handle invalid format selection
      res.status(400).send("Formato de documento solicitado no válido");
    }

  } catch (error) {
    console.error("Error al generar el informe:", error);
    res.status(500).send("Error al generar el informe");
  }
});

module.exports = router;
