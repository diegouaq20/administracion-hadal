const crypto = require('crypto');

// Genera una cadena de 64 bytes como secret
const secret = crypto.randomBytes(32).toString('hex');
console.log(secret);