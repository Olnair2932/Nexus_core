const admin = require("firebase-admin");

if (!admin.apps.length) {

    const serviceAccount = JSON.parse(
        process.env.FIREBASE_ADMIN_KEY
    );

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL:
            "https://nexus-core-42ebb-default-rtdb.firebaseio.com"
    });

}

module.exports = admin.database();
