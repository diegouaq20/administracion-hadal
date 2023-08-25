const admin = require('firebase-admin');

var serviceAccount = require('../../node-firebase-yt-firebase-adminsdk-cxkhu-e6fd0e8c6b.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'hadal-8eb6f.appspot.com'
});

const db = admin.firestore();
const storage = admin.storage();

module.exports = { db, storage };
