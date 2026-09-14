const sql = require('mssql')
require('dotenv').config()

const config = {
	server: process.env.DB_SERVER,
	port: parseInt(process.env.DB_PORT, 10),
	database: process.env.DB_NAME,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	options: {
		encrypt: false,
		trustServerCertificate: true
	}
}

const poolPromise = sql.connect(config)

module.exports = {
	sql,
	poolPromise
}
