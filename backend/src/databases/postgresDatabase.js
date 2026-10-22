require('dotenv').config()

const { Pool } = require('pg')

const postgresPool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT),
    database: process.env.POSTGRES_DATABASE,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: process.env.POSTGRES_SSL === 'true'
        ? { rejectUnauthorized: true }
        : false
})

async function testPostgresConnection() {
    try {
        const result = await postgresPool.query(
            'SELECT NOW() AS fecha_actual'
        )

        console.log(
            'PostgreSQL conectado correctamente:',
            result.rows[0].fecha_actual
        )

    } catch (error) {
        console.error(
            'Error conectando a PostgreSQL:',
            error.message
        )

        throw error
    }
}

module.exports = {
    postgresPool,
    testPostgresConnection
}