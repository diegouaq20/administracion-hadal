const { Router } = require('express');
const router = Router();
const admin = require('firebase-admin');

// Inicializa Firebase Admin con tus credenciales
var serviceAccount = require('../../node-firebase-yt-firebase-adminsdk-cxkhu-e6fd0e8c6b.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

router.get('/', async (req, res) => {
    try {
        const contactsSnapshot = await db.collection('contacts').get();
        const contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.render('index', { contacts });
    } catch (error) {
        console.error('Error getting contacts:', error);
        res.render('index', { contacts: [] });
    }
});

router.post('/new-contact', async (req, res) => {
    try {
        const newContact = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            phone: req.body.phone
        };
        await db.collection('contacts').add(newContact);
        res.redirect('/');
    } catch (error) {
        console.error('Error creating new contact:', error);
        res.redirect('/');
    }
});

router.get('/delete-contact/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        const contactRef = db.collection('contacts').doc(contactId);
        await contactRef.delete();
        res.redirect('/');
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.redirect('/');
    }
});

router.get('/edit-contact/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        const contactRef = db.collection('contacts').doc(contactId);
        const docSnapshot = await contactRef.get();
        const contactData = docSnapshot.exists ? docSnapshot.data() : null;
        res.render('edit', { contact: contactData, contactId });
    } catch (error) {
        console.error('Error fetching contact for edit:', error);
        res.redirect('/');
    }
});

router.post('/update-contact/:id', async (req, res) => {
    try {
        const contactId = req.params.id;
        const updatedContact = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            phone: req.body.phone
        };
        const contactRef = db.collection('contacts').doc(contactId);
        await contactRef.set(updatedContact, { merge: true });
        res.redirect('/');
    } catch (error) {
        console.error('Error updating contact:', error);
        res.redirect('/');
    }
});

module.exports = router;
