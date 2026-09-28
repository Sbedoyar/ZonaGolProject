const express = require('express')
const cors = require('cors')

// RUTAS
const sqlServerRoutes = require('./routes/sqlServerRoutes')
const googleAuthRoutes = require('./routes/googleAuthRoutes')
const mysqlRoutes = require('./routes/mysqlRoutes')
const mongoRoutes = require('./routes/mongoRoutes')
const firebaseRoutes = require('./routes/firebaseRoutes')
const postgresRoutes = require('./routes/postgresRoutes')
const sportsSyncRoutes = require('./routes/sportsSyncRoutes')

// CONEXIONES
const {
    connectMongo
} = require('./databases/mongoDatabase')

const {
    testPostgresConnection
} = require('./databases/postgresDatabase')

// SCHEDULER DEPORTIVO
const {
    iniciarSportsScheduler
} = require('./schedulers/sportsScheduler')


const app = express()


// =====================================
// MIDDLEWARES
// =====================================

app.use(cors())
app.use(express.json())


// =====================================
// RUTAS
// =====================================

// SQL SERVER / AUTENTICACIÓN TRADICIONAL
app.use('/api', sqlServerRoutes)

// GOOGLE SSO
app.use('/api', googleAuthRoutes)

// MYSQL
app.use('/api/mysql', mysqlRoutes)

// MONGODB
app.use('/api/mongo', mongoRoutes)

// FIREBASE / FIRESTORE
app.use('/api/firebase', firebaseRoutes)

// POSTGRESQL
app.use('/api/postgres', postgresRoutes)

// SINCRONIZACIÓN DEPORTIVA
app.use(
    '/api/sports-sync',
    sportsSyncRoutes
)


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


        // =================================
        // INICIAR SCHEDULER DEPORTIVO
        // =================================

        iniciarSportsScheduler()


        // =================================
        // INICIAR EXPRESS
        // =================================

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