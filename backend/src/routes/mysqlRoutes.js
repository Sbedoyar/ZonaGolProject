const express = require('express')
const mysqlPool = require('../databases/mysqlDatabase')

const router = express.Router()

router.get('/empleados', async (req, res) => {
    try {
        const [empleados] = await mysqlPool.query(
            'SELECT * FROM empleado'
        )

        res.json(empleados)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error consultando empleados en MySQL'
        })
    }
})

router.get('/empleados/:documento', async (req, res) => {
    try {
        const [filas] = await mysqlPool.query(
            'SELECT * FROM empleado WHERE documento = ?',
            [req.params.documento]
        )

        if (filas.length === 0) {
            return res.status(404).json({
                mensaje: 'Empleado no encontrado'
            })
        }

        res.json(filas[0])

    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error consultando empleado'
        })
    }
})

router.post('/empleados', async (req, res) => {
    try {
        const {
            documento,
            tipo_documento,
            nombres,
            apellidos,
            correo,
            fecha_nacimiento,
            salario
        } = req.body

        await mysqlPool.query(
            `INSERT INTO empleado
            (documento, tipo_documento, nombres, apellidos, correo, fecha_nacimiento, salario)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                documento,
                tipo_documento,
                nombres,
                apellidos,
                correo,
                fecha_nacimiento,
                salario
            ]
        )

        res.status(201).json({
            mensaje: 'Empleado creado correctamente'
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error creando empleado'
        })
    }
})

router.put('/empleados/:documento', async (req, res) => {
    try {
        const {
            nombres,
            apellidos,
            correo,
            salario
        } = req.body

        const [resultado] = await mysqlPool.query(
            `UPDATE empleado
            SET nombres = ?, apellidos = ?, correo = ?, salario = ?
            WHERE documento = ?`,
            [
                nombres,
                apellidos,
                correo,
                salario,
                req.params.documento
            ]
        )

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'Empleado no encontrado'
            })
        }

        res.json({
            mensaje: 'Empleado actualizado correctamente'
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error actualizando empleado'
        })
    }
})

router.delete('/empleados/:documento', async (req, res) => {
    try {
        const [resultado] = await mysqlPool.query(
            'DELETE FROM empleado WHERE documento = ?',
            [req.params.documento]
        )

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'Empleado no encontrado'
            })
        }

        res.json({
            mensaje: 'Empleado eliminado correctamente'
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error eliminando empleado'
        })
    }
})

module.exports = router