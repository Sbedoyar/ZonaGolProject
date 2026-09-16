require('dotenv').config()

const {
    initializeApp,
    applicationDefault,
    getApps
} = require('firebase-admin/app')

const {
    getFirestore
} = require('firebase-admin/firestore')

function connectFirebase() {
    if (getApps().length === 0) {
        initializeApp({
            credential: applicationDefault(),
            projectId: process.env.FIREBASE_PROJECT_ID
        })

        console.log('Firebase conectado correctamente')
    }

    return getFirestore()
}

const firebaseDb = connectFirebase()

module.exports = {
    firebaseDb
}