const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('usuario-enfermera'); // Renderiza la vista usuario-enfermera.hbs
});

module.exports = router;
