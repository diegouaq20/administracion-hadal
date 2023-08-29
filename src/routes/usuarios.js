const { Router } = require('express');
const router = Router();
const { db, storage } = require('./firebase'); // Asegúrate de importar la instancia de Firebase correctamente

// Ruta para mostrar todos los usuarios
router.get('/usuarios', async (req, res) => {
    try {
        // Obtener los datos de los usuarios desde Firestore
        const usersSnapshot = await db.collection('usuarios').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id }));

        // Renderizar la vista y pasar los datos
        res.render('index-usuarios', { users });

    } catch (error) {
        console.error('Error obteniendo los usuarios:', error);
        res.render('index-usuarios', { users: [] });
    }
});

module.exports = router;
