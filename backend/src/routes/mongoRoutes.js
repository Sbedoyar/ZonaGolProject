const express = require('express')

const { verificarToken } = require('../middlewares/authMiddleware')

const {
    autorizarRoles
} = require('../middlewares/roleMiddleware')

const {
    getMongoDb
} = require('../databases/mongoDatabase')


const router = express.Router()


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
    verificarToken,
    autorizarRoles(1),
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