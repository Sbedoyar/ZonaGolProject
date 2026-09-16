const express = require('express')
const cors = require('cors')

// RUTAS
const sqlServerRoutes = require('./routes/sqlServerRoutes')
const mysqlRoutes = require('./routes/mysqlRoutes')
const mongoRoutes = require('./routes/mongoRoutes')
const firebaseRoutes = require('./routes/firebaseRoutes')
const postgresRoutes = require('./routes/postgresRoutes')

// CONEXIONES
const {
    connectMongo
} = require('./databases/mongoDatabase')

const {
    testPostgresConnection
} = require('./databases/postgresDatabase')


const app = express()


// =====================================
// MIDDLEWARES
// =====================================

app.use(cors())
app.use(express.json())


// =====================================
// RUTAS
// =====================================

// SQL SERVER
app.use('/api', sqlServerRoutes)

// MYSQL
app.use('/api/mysql', mysqlRoutes)

// MONGODB
app.use('/api/mongo', mongoRoutes)

// FIREBASE / FIRESTORE
app.use('/api/firebase', firebaseRoutes)

// POSTGRESQL
app.use('/api/postgres', postgresRoutes)


// =====================================
// PRUEBA DEL BACKEND
// =====================================

app.get('/api/health', (req, res) => {
    res.json({
        message: 'Backend funcionando'
    })
})


// =====================================
// INICIAR SERVIDOR
// =====================================

const PORT = process.env.PORT || 5000

async function iniciarServidor() {
    try {

        // Conectar MongoDB
        await connectMongo()

        // Probar conexión PostgreSQL
        await testPostgresConnection()

        app.listen(PORT, () => {
            console.log(
                `Servidor ejecutándose en http://localhost:${PORT}`
            )
        })

    } catch (error) {
        console.error(
            'Error iniciando el backend:',
            error
        )
    }
}

iniciarServidor()