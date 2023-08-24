const { Router } = require('express');
const router = Router();
const admin = require('firebase-admin');

var serviceAccount = require('../../node-firebase-yt-firebase-adminsdk-cxkhu-e6fd0e8c6b.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'node-firebase-yt.appspot.com'
});

const db = admin.firestore();
const storage = admin.storage();

router.get('/', async (req, res) => {
    try {
        const contactsSnapshot = await db.collection('serviciosbasicos').get();
        const contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const [files] = await storage.bucket().getFiles({ prefix: 'Basicos/' });
        const iconUrls = files.map(file => {
            const fileName = file.name.replace('Basicos/', '');
            if (fileName) {
                return `https://firebasestorage.googleapis.com/v0/b/node-firebase-yt.appspot.com/o/Basicos%2F${encodeURIComponent(fileName)}?alt=media`;
            }
            return null;
        }).filter(url => url !== null);

        res.render('index', { contacts, iconUrls });

    } catch (error) {
        console.error('Error getting contacts:', error);
        res.render('index', { contacts: [], iconUrls: [] });
    }
});

router.get('/servicios-basicos', async (req, res) => {
    try {
        const contactsSnapshot = await db.collection('serviciosbasicos').get();
        const contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const [files] = await storage.bucket().getFiles({ prefix: 'Basicos/' });
        const iconUrls = files.map(file => {
            const fileName = file.name.replace('Basicos/', '');
            if (fileName) {
                return `https://firebasestorage.googleapis.com/v0/b/node-firebase-yt.appspot.com/o/Basicos%2F${encodeURIComponent(fileName)}?alt=media`;
            }
            return null;
        }).filter(url => url !== null);

        res.render('index-basicos', { contacts, iconUrls });

    } catch (error) {
        console.error('Error getting contacts:', error);
        res.render('index-basicos', { contacts: [], iconUrls: [] });
    }
});

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
        console.error('Error creating new service:', error);
        res.redirect('/servicios-basicos');
    }
});

router.get('/delete-contact/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        const contactRef = db.collection('serviciosbasicos').doc(contactId);
        await contactRef.delete();
        res.redirect('/servicios-basicos');
    } catch (error) {
        console.error('Error deleting service:', error);
        res.redirect('/servicios-basicos');
    }
});

router.get('/edit-contact/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        const contactRef = db.collection('serviciosbasicos').doc(contactId);
        const docSnapshot = await contactRef.get();
        const contactData = docSnapshot.exists ? docSnapshot.data() : null;
        res.render('edit', { contact: contactData, contactId });
    } catch (error) {
        console.error('Error fetching service for edit:', error);
        res.redirect('/servicios-basicos');
    }
});

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
        console.error('Error updating service:', error);
        res.redirect('/servicios-basicos');
    }
});

module.exports = router;
