require('dotenv').config()

const {
    initializeApp,
    applicationDefault,
    cert,
    getApps
} = require('firebase-admin/app')

const {
    getFirestore
} = require('firebase-admin/firestore')

function obtenerCredencialFirebase() {

    // Azure / entornos sin archivo físico de credenciales
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {

        const serviceAccount =
            JSON.parse(
                process.env.FIREBASE_SERVICE_ACCOUNT_JSON
            )

        return cert(serviceAccount)
    }

    // Docker/local:
    // GOOGLE_APPLICATION_CREDENTIALS apunta al archivo montado
    return applicationDefault()
}

function connectFirebase() {

    if (getApps().length === 0) {

        initializeApp({
            credential: obtenerCredencialFirebase(),
            projectId: process.env.FIREBASE_PROJECT_ID
        })

        console.log('Firebase inicializado correctamente')
    }

    return getFirestore()
}

const firebaseDb = connectFirebase()

module.exports = {
    firebaseDb
}