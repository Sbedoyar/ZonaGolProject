const express = require('express')

const {
    firebaseDb
} = require('../databases/firebaseDatabase')

const {
    FieldValue
} = require('firebase-admin/firestore')

const router = express.Router()


// =====================================
// OBTENER DOCUMENTOS DE FIRESTORE
// =====================================

router.get('/pruebas', async (req, res) => {
    try {
        const snapshot =
            await firebaseDb
                .collection('pruebas')
                .get()

        const documentos =
            snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }))

        return res.status(200).json({
            success: true,
            cantidad: documentos.length,
            datos: documentos
        })

    } catch (error) {
        console.error(
            'Error consultando Firebase:',
            error
        )

        return res.status(500).json({
            success: false,
            message:
                'Error consultando Firebase'
        })
    }
})


// =====================================
// CREAR DOCUMENTO EN FIRESTORE
// =====================================

router.post('/pruebas', async (req, res) => {
    try {
        const datos = req.body

        const documento =
            await firebaseDb
                .collection('pruebas')
                .add({
                    ...datos,
                    fechaCreacion:
                        FieldValue.serverTimestamp()
                })

        return res.status(201).json({
            success: true,
            message:
                'Documento creado correctamente en Firebase',
            id: documento.id
        })

    } catch (error) {
        console.error(
            'Error guardando en Firebase:',
            error
        )

        return res.status(500).json({
            success: false,
            message:
                'Error guardando en Firebase'
        })
    }
})

module.exports = router