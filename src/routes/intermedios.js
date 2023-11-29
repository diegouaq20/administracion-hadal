const { Router } = require('express');
const router = Router();
const { db, storage } = require('./firebase'); // Importar la instancia de Firebase desde firebase.js

// Ruta para mostrar todos los servicios intermedios
router.get('/', async (req, res) => {
    try {
        // Obtener los datos de los servicios intermedios desde Firestore
        const contactsSnapshot = await db.collection('serviciosintermedios').get();
        const contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Obtener las URL de los iconos desde Firebase Storage
        const [files] = await storage.bucket().getFiles({ prefix: 'Intermedios/' });
        const iconUrls = files.map(file => {
            const fileName = file.name.replace('Intermedios/', '');
            if (fileName) {
                return `https://firebasestorage.googleapis.com/v0/b/node-firebase-yt.appspot.com/o/Intermedios%2F${encodeURIComponent(fileName)}?alt=media`;
            }
            return null;
        }).filter(url => url !== null);

        // Renderizar la vista y pasar los datos
        res.render('index-intermedios', { contacts, iconUrls });

    } catch (error) {
        console.error('Error obteniendo los servicios intermedios:', error);
        res.render('index-intermedios', { contacts: [], iconUrls: [] });
    }
});

// Ruta para agregar un nuevo servicio intermedio
router.post('/new-contact', async (req, res) => {
    try {
        const newContact = {
            descripcion: req.body.descripcion,
            icono: req.body.icono,
            material: req.body.material,
            precio: req.body.precio,
            procedimiento: req.body.procedimiento,
            tiempo: req.body.tiempo,
            tipoCategoria: 'Intermedio'
        };
        await db.collection('serviciosintermedios').add(newContact);
        res.redirect('/servicios-intermedios');
    } catch (error) {
        console.error('Error creando un nuevo servicio:', error);
        res.redirect('/servicios-intermedios');
    }
});

// Ruta para eliminar un servicio intermedio
router.get('/delete-contact/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        const contactRef = db.collection('serviciosintermedios').doc(contactId);
        await contactRef.delete();
        console.log('Contacto eliminado exitosamente');
        res.redirect('/servicios-intermedios');
    } catch (error) {
        console.error('Error eliminando el servicio:', error);
        res.redirect('/servicios-intermedios');
    }
});

// Ruta para editar un servicio intermedio
router.get("/edit-contact/:id", async (req, res) => {
    try {
      const contactId = req.params.id;
      const contactRef = db.collection("serviciosintermedios").doc(contactId);
      const docSnapshot = await contactRef.get();
  
      if (docSnapshot.exists) {
        const contactData = docSnapshot.data();
  
        // Obtener las URL de los iconos desde Firebase Storage
        const [files] = await storage.bucket().getFiles({ prefix: "Intermedios/" });
        const iconUrls = files
          .map((file) => {
            const fileName = file.name.replace("Intermedios/", "");
            if (fileName) {
              return `https://firebasestorage.googleapis.com/v0/b/node-firebase-yt.appspot.com/o/Intermedios%2F${encodeURIComponent(
                fileName
              )}?alt=media`;
            }
            return null;
          })
          .filter((url) => url !== null);
  
        res.render("edit-intermedios", {
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
      res.redirect("/servicios-intermedios");
    }
  });


// Ruta para actualizar un servicio intermedio
router.post('/update-contact/:id', async (req, res) => {
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
  
        const contactRef = db.collection('serviciosintermedios').doc(contactId);
        await contactRef.set(updatedContact, { merge: true });
        res.redirect('/servicios-intermedios');
    } catch (error) {
        console.error('Error actualizando el servicio:', error);
        res.redirect('/servicios-intermedios');
    }
  });
  
  

module.exports = router;
