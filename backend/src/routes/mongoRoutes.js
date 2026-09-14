const express = require('express')
const { getMongoDb } = require('../databases/mongoDatabase')

const router = express.Router()

router.get('/prueba', async (req, res) => {
    try {
        const db = getMongoDb()

        const coleccion = db.collection('pruebas')

        const datos = await coleccion.find().toArray()

        res.json(datos)

    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error consultando MongoDB'
        })
    }
})

router.post('/prueba', async (req, res) => {
    try {
        const db = getMongoDb()

        const coleccion = db.collection('pruebas')

        const resultado = await coleccion.insertOne(req.body)

        res.status(201).json({
            mensaje: 'Documento creado correctamente',
            id: resultado.insertedId
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error creando documento en MongoDB'
        })
    }
})

module.exports = router