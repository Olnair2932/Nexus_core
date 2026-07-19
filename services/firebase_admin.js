const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");

if (getApps().length === 0) {

    if (!process.env.FIREBASE_ADMIN_KEY) {
        throw new Error("FIREBASE_ADMIN_KEY não configurada");
    }

    const serviceAccount = JSON.parse(
        process.env.FIREBASE_ADMIN_KEY
    );

    initializeApp({
        credential: cert(serviceAccount),
        databaseURL:
            "https://nexus-core-42ebb-default-rtdb.firebaseio.com"
    });

}

module.exports = getDatabase();
