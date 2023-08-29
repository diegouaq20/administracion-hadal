const express = require('express');
const router = express.Router();
const { db } = require('./firebase'); // Importa la instancia de Firestore correctamente

// Ruta para mostrar la lista de usuarios
router.get('/', async (req, res) => {
    try {
        // Obtener datos de la colección 'usuariopaciente' desde Firestore
        const usersSnapshot = await db.collection('usuariopaciente').get();
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, userData: doc.data() }));

        res.render('usuario-paciente', { allUsers });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).send('Error al obtener usuarios');
    }
});

// Ruta para ver información completa de un usuario
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        // Obtener información de usuario por ID desde Firestore
        const userSnapshot = await db.collection('usuariopaciente').doc(userId).get();
        const userData = userSnapshot.exists ? userSnapshot.data() : null;

        if (userData) {
            res.render('edit-pacientes', { user: userData });
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    } catch (error) {
        console.error('Error obteniendo información del usuario:', error);
        res.status(500).send('Error al obtener información del usuario');
    }
});

module.exports = router;
