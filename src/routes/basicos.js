const { Router } = require('express');
const router = Router();
const { db, storage } = require('./firebase'); // Importar la instancia de Firebase desde firebase.js
const Handlebars = require('handlebars'); // Asegúrate de que handlebars esté instalado y requerido



// Ruta para mostrar todos los servicios básicos
router.get('/', async (req, res) => {
    try {
        // Obtener los datos de los servicios básicos desde Firestore
        const contactsSnapshot = await db.collection('serviciosbasicos').get();
        const contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Obtener las URL de los iconos desde Firebase Storage
        const [files] = await storage.bucket().getFiles({ prefix: 'Basicos/' });
        const iconUrls = files.map(file => {
            const fileName = file.name.replace('Basicos/', '');
            if (fileName) {
                return `https://firebasestorage.googleapis.com/v0/b/hadal-8eb6f.appspot.com/o/Basicos%2F${encodeURIComponent(fileName)}?alt=media`;
            }
            return null;
        }).filter(url => url !== null);

        // Renderizar la vista y pasar los datos
        res.render('index-basicos', { contacts, iconUrls });

    } catch (error) {
        console.error('Error obteniendo los servicios básicos:', error);
        res.render('index-basicos', { contacts: [], iconUrls: [] });
    }
});

// Ruta para agregar un nuevo servicio básico
router.post('/new-contact', async (req, res) => {
    try {
        const newContact = {
            descripcion: req.body.descripcion,
            icono: req.body.icono,
            material: req.body.material,
            precio: req.body.precio,
            procedimiento: req.body.procedimiento,
            tiempo: req.body.tiempo,
            tipoCategoria: 'Basico'
        };
        await db.collection('serviciosbasicos').add(newContact);
        res.redirect('/servicios-basicos');
    } catch (error) {
        console.error('Error creando un nuevo servicio:', error);
        res.redirect('/servicios-basicos');
    }
});

// Ruta para eliminar un servicio básico
router.get('/delete-contact/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        const contactRef = db.collection('serviciosbasicos').doc(contactId);
        await contactRef.delete();
        console.log('Contacto eliminado exitosamente');
        res.redirect('/servicios-basicos');
    } catch (error) {
        console.error('Error eliminando el servicio:', error);
        res.redirect('/servicios-basicos');
    }
});


// Ruta para editar un servicio básico
// Ruta para editar un servicio básico
router.get('/edit-contact/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        const contactRef = db.collection('serviciosbasicos').doc(contactId);
        const docSnapshot = await contactRef.get();

        if (docSnapshot.exists) {
            const contactData = docSnapshot.data();

            // Obtener las URL de los iconos desde Firebase Storage
            const [files] = await storage.bucket().getFiles({ prefix: 'Basicos/' });
            const iconUrls = files.map(file => {
                const fileName = file.name.replace('Basicos/', '');
                if (fileName) {
                    return `https://firebasestorage.googleapis.com/v0/b/hadal-8eb6f.appspot.com/o/Basicos%2F${encodeURIComponent(fileName)}?alt=media`;
                }
                return null;
            }).filter(url => url !== null);

            res.render('edit-basicos', { contact: contactData, contactId, iconUrls, selectedIcon: contactData.icono });
        } else {
            // Manejo de caso en el que el documento no existe
            res.status(404).send('El servicio no existe.');
        }
    } catch (error) {
        console.error('Error obteniendo el servicio para editar:', error);
        res.redirect('/servicios-basicos');
    }
});


Handlebars.registerHelper("ifCondIcono", function (v1, operator, v2, options) {
    if (typeof v1 !== 'undefined') {
      switch (operator) {
        case "===":
          return v1 === v2 ? options.fn(this) : options.inverse(this);
        // Agrega más casos para otros operadores si es necesario
      }
    }
  });
  


// Ruta para actualizar un servicio básico
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

        const contactRef = db.collection('serviciosbasicos').doc(contactId);
        await contactRef.set(updatedContact, { merge: true });
        res.redirect('/servicios-basicos');
    } catch (error) {
        console.error('Error actualizando el servicio:', error);
        res.redirect('/servicios-basicos');
    }
});


module.exports = router;
