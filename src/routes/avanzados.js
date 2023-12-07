const { Router } = require("express");
const router = Router();
const { db, storage } = require("./firebase"); // Importar la instancia de Firebase desde firebase.js

// Ruta para mostrar todos los servicios avanzados
router.get("/", async (req, res) => {
  try {
    // Obtener los datos de los servicios avanzados desde Firestore
    const contactsSnapshot = await db.collection("serviciosavanzados").get();
    const contacts = contactsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Obtener las URL de los iconos desde Firebase Storage
    const [files] = await storage.bucket().getFiles({ prefix: "Avanzados/" });
    const iconUrls = files
      .map((file) => {
        const fileName = file.name.replace("Avanzados/", "");
        if (fileName) {
          return `https://firebasestorage.googleapis.com/v0/b/hadal-8eb6f.appspot.com/o/Avanzados%2F${encodeURIComponent(
            fileName
          )}?alt=media`;
        }
        return null;
      })
      .filter((url) => url !== null);

    // Renderizar la vista y pasar los datos
    res.render("index-avanzados", { contacts, iconUrls });
  } catch (error) {
    console.error("Error obteniendo los servicios avanzados:", error);
    res.render("index-avanzados", { contacts: [], iconUrls: [] });
  }
});

// Ruta para agregar un nuevo servicio avanzado
router.post("/new-contact", async (req, res) => {
  try {
    const newContact = {
      descripcion: req.body.descripcion,
      icono: req.body.icono,
      material: req.body.material,
      precio: req.body.precio,
      procedimiento: req.body.procedimiento,
      tiempo: req.body.tiempo,
      tipoCategoria: "Avanzado",
    };
    await db.collection("serviciosavanzados").add(newContact);
    res.redirect("/servicios-avanzados");
  } catch (error) {
    console.error("Error creando un nuevo servicio:", error);
    res.redirect("/servicios-avanzados");
  }
});

// Ruta para eliminar un servicio avanzado
router.get("/delete-contact/:id", async (req, res) => {
  try {
    const contactId = req.params.id;
    const contactRef = db.collection("serviciosavanzados").doc(contactId);
    await contactRef.delete();
    res.redirect("/servicios-avanzados");
  } catch (error) {
    console.error("Error eliminando el servicio:", error);
    res.redirect("/servicios-avanzados");
  }
});

router.get("/edit-contact/:id", async (req, res) => {
  try {
    const contactId = req.params.id;
    const contactRef = db.collection("serviciosavanzados").doc(contactId);
    const docSnapshot = await contactRef.get();

    if (docSnapshot.exists) {
      const contactData = docSnapshot.data();

      // Obtener las URL de los iconos desde Firebase Storage
      const [files] = await storage.bucket().getFiles({ prefix: "Avanzados/" });
      const iconUrls = files
        .map((file) => {
          const fileName = file.name.replace("Avanzados/", "");
          if (fileName) {
            return `https://firebasestorage.googleapis.com/v0/b/hadal-8eb6f.appspot.com/o/Avanzados%2F${encodeURIComponent(
              fileName
            )}?alt=media`;
          }
          return null;
        })
        .filter((url) => url !== null);
      console.log("Files in storage:", files);
      console.log("Icon URLs:", iconUrls);

      res.render("edit-avanzados", {
        contact: contactData,
        contactId,
        iconUrls,
        selectedIcon: contactData.icono,
      });
    } else {
      // Manejo de caso en el que el documento no existe
      res.status(404).send("El servicio no existe.");
    }
  } catch (error) {
    console.error("Error obteniendo el servicio para editar:", error);
    res.redirect("/servicios-avanzados");
  }
});

// Ruta para actualizar un servicio avanzado
router.post("/update-contact/:id", async (req, res) => {
  try {
    const contactId = req.params.id;
    const updatedContact = {
      descripcion: req.body.descripcion,
      material: req.body.material,
      precio: req.body.precio,
      procedimiento: req.body.procedimiento,
      tiempo: req.body.tiempo,
    };

    // Verificar si se ha seleccionado un nuevo icono
    if (req.body.icono) {
      updatedContact.icono = req.body.icono;
    }

    const contactRef = db.collection("serviciosavanzados").doc(contactId);
    await contactRef.set(updatedContact, { merge: true });
    res.redirect("/servicios-avanzados");
  } catch (error) {
    console.error("Error actualizando el servicio:", error);
    res.redirect("/servicios-avanzados");
  }
});

module.exports = router;
