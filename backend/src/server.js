const express = require('express')
const cors = require('cors')
const { sql, poolPromise } = require('./database')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
    res.json({
        message: 'Backend funcionando'
    })
})

app.get('/api/users', async (req, res) => {
    try {
        const pool = await poolPromise

        const result = await pool.request().query(`
            SELECT
                id,
                name,
                email,
                created_at
            FROM users
        `)

        res.json(result.recordset)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            message: 'Error al consultar usuarios'
        })
    }
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`)
})
