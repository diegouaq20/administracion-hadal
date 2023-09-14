// helpers.js

// Importa Handlebars si aún no lo has hecho
const Handlebars = require('handlebars');

// Define el helper personalizado
Handlebars.registerHelper('toUpperCase', function (text) {
  // Convierte el texto a mayúsculas
  return text.toUpperCase();
});

module.exports = Handlebars;
