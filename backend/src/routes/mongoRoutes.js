const express = require('express')

const {
    getMongoDb
} = require('../databases/mongoDatabase')


const router = express.Router()


// ============================================================
// PRUEBA - CONSULTAR DOCUMENTOS
// ============================================================

router.get('/prueba', async (req, res) => {
    try {

        const db = getMongoDb()

        const coleccion =
            db.collection('pruebas')

        const datos =
            await coleccion
                .find()
                .toArray()


        res.json(datos)

    } catch (error) {

        console.error(
            'Error consultando MongoDB:',
            error
        )


        res.status(500).json({
            success: false,
            mensaje:
                'Error consultando MongoDB'
        })
    }
})


// ============================================================
// PRUEBA - CREAR DOCUMENTO
// ============================================================

router.post('/prueba', async (req, res) => {
    try {

        const db = getMongoDb()

        const coleccion =
            db.collection('pruebas')


        const resultado =
            await coleccion.insertOne(
                req.body
            )


        res.status(201).json({
            success: true,
            mensaje:
                'Documento creado correctamente',

            id:
                resultado.insertedId
        })

    } catch (error) {

        console.error(
            'Error creando documento en MongoDB:',
            error
        )


        res.status(500).json({
            success: false,
            mensaje:
                'Error creando documento en MongoDB'
        })
    }
})


// ============================================================
// HISTORIAL DE ACCESO
//
// Colección creada automáticamente por MongoDB cuando
// sqlServerRoutes.js registra el primer intento de login.
//
// Ejemplos:
// - LOGIN_EXITOSO
// - PASSWORD_INCORRECTA
// - CORREO_NO_REGISTRADO
// - USUARIO_INACTIVO
// ============================================================

router.get(
    '/historial-acceso',
    async (req, res) => {

        try {

            const db =
                getMongoDb()


            const coleccion =
                db.collection(
                    'historial_acceso'
                )


            const historial =
                await coleccion
                    .find()
                    .sort({
                        fechaHora: -1
                    })
                    .toArray()


            res.status(200).json({
                success: true,

                cantidad:
                    historial.length,

                datos:
                    historial
            })

        } catch (error) {

            console.error(
                'Error consultando historial de acceso:',
                error
            )


            res.status(500).json({
                success: false,
                mensaje:
                    'Error consultando el historial de acceso'
            })
        }
    }
)


module.exports = router