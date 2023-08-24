const { Router } = require('express');
const router = Router();
const admin = require('firebase-admin');

var serviceAccount = require("../../node-firebase-yt-firebase-adminsdk-cxkhu-e6fd0e8c6b.json");

admin.initializeApp({

    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://node-firebase-yt-default-rtdb.firebaseio.com/'
});

const db = admin.database();



router.get('/', (req, res) => {
    db.ref('contacts').once('value', (snapshot) => {
       const data = snapshot.val();
       res.render('index', { contacts: data });
    
    });
});

router.post('/new-contact', (req, res) => {

    console.log(req.body);
    const newContact = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        phone: req.body.phone
    };
    db.ref('contacts').push(newContact);
    res.redirect('/');
});

router.get('/delete-contact/:id', (req, res) => {
    db.ref('contacts/' + req.params.id).remove();
    res.redirect('/');
});


// Editar contacto - Renderiza el formulario de edición
router.get('/edit-contact/:id', (req, res) => {
    const contactId = req.params.id;
    db.ref('contacts/' + contactId).once('value', (snapshot) => {
        const contactData = snapshot.val();
        res.render('edit', { contact: contactData, contactId });
    });
});

// Actualizar contacto - Procesa la solicitud de actualización
router.post('/update-contact/:id', (req, res) => {
    const contactId = req.params.id;
    const updatedContact = {
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        phone: req.body.phone
    };
    db.ref('contacts/' + contactId).update(updatedContact);
    res.redirect('/');
});


module.exports = router;