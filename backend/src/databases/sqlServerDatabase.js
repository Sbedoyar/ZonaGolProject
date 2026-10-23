const sql = require('mssql')
require('dotenv').config()

console.log('[Diagnóstico SQL Server]', {
    DB_SERVER_definido: Boolean(process.env.DB_SERVER?.trim()),
    DB_PORT_definido: Boolean(process.env.DB_PORT),
    DB_NAME_definido: Boolean(process.env.DB_NAME),
    DB_USER_definido: Boolean(process.env.DB_USER),
    DB_PASSWORD_definido: Boolean(process.env.DB_PASSWORD)
})

const config = {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeout: 60000,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_ENCRYPT !== 'true'
    }
}

const poolPromise = sql.connect(config)

module.exports = {
	sql,
	poolPromise
}
