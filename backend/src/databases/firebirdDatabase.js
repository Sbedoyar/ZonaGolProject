const Firebird = require('node-firebird')
require('dotenv').config()

const options = {
    host: process.env.FIREBIRD_HOST,
    port: parseInt(process.env.FIREBIRD_PORT, 10),
    database: process.env.FIREBIRD_DATABASE,
    user: process.env.FIREBIRD_USER,
    password: process.env.FIREBIRD_PASSWORD
}

function connectFirebird() {
    return new Promise((resolve, reject) => {
        Firebird.attach(options, (error, db) => {
            if (error) {
                return reject(error)
            }

            resolve(db)
        })
    })
}

module.exports = {
    connectFirebird
}