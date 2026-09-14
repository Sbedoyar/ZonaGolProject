const express = require('express')
const { connectFirebird } = require('../databases/firebirdDatabase')

const router = express.Router()

router.get('/prueba', async (req, res) => {
    let db

    try {
        db = await connectFirebird()

        db.query(
            'SELECT CURRENT_TIMESTAMP AS FECHA_ACTUAL FROM RDB$DATABASE',
            (error, result) => {
                if (error) {
                    return res.status(500).json({
                        mensaje: 'Error consultando Firebird',
                        error: error.message
                    })
                }

                res.json({
                    mensaje: 'Conexión a Firebird correcta',
                    resultado: result
                })

                db.detach()
            }
        )

    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error conectando a Firebird',
            error: error.message
        })
    }
})

module.exports = router