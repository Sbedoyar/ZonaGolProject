const { MongoClient } = require('mongodb')
require('dotenv').config()

const client = new MongoClient(process.env.MONGO_URI)

let db

async function connectMongo() {
    await client.connect()

    db = client.db(process.env.MONGO_DB_NAME)

    console.log('Conectado a MongoDB')

    return db
}

function getMongoDb() {
    return db
}

module.exports = {
    connectMongo,
    getMongoDb
}