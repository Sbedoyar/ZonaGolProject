const express = require('express')

const {
    postgresPool
} = require('../databases/postgresDatabase')

const router = express.Router()


// =====================================
// PRUEBA DE CONEXIÓN POSTGRESQL
// =====================================

router.get('/prueba', async (req, res) => {
    try {
        const result = await postgresPool.query(`
            SELECT
                current_database() AS base_datos,
                current_user AS usuario,
                NOW() AS fecha_actual
        `)

        return res.status(200).json({
            success: true,
            message: 'PostgreSQL conectado correctamente',
            datos: result.rows[0]
        })

    } catch (error) {
        console.error(
            'Error PostgreSQL:',
            error
        )

        return res.status(500).json({
            success: false,
            message:
                'Error consultando PostgreSQL'
        })
    }
})


module.exports = router