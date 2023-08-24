const { Router } = require('express');
const router = Router();
const { db, storage } = require('./firebase'); // Importar la instancia de Firebase desde firebase.js

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
                return `https://firebasestorage.googleapis.com/v0/b/node-firebase-yt.appspot.com/o/Basicos%2F${encodeURIComponent(fileName)}?alt=media`;
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
router.get('/edit-contact/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        const contactRef = db.collection('serviciosbasicos').doc(contactId);
        const docSnapshot = await contactRef.get();
        const contactData = docSnapshot.exists ? docSnapshot.data() : null;
        res.render('edit-basicos', { contact: contactData, contactId });
    } catch (error) {
        console.error('Error obteniendo el servicio para editar:', error);
        res.redirect('/servicios-basicos');
    }
});

// Ruta para actualizar un servicio básico
router.post('/update-contact/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        const updatedContact = {
            descripcion: req.body.descripcion,
            icono: req.body.icono,
            material: req.body.material,
            precio: req.body.precio,
            procedimiento: req.body.procedimiento,
            tiempo: req.body.tiempo,
        };
        const contactRef = db.collection('serviciosbasicos').doc(contactId);
        await contactRef.set(updatedContact, { merge: true });
        res.redirect('/servicios-basicos');
    } catch (error) {
        console.error('Error actualizando el servicio:', error);
        res.redirect('/servicios-basicos');
    }
});

module.exports = router;
