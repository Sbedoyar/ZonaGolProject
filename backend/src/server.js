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
const googleDriveRoutes =  require('./routes/googleDriveRoutes')

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

const wompiRoutes =
    require('./routes/wompiRoutes')

const app = express()


// =====================================
// MIDDLEWARES
// =====================================

const allowedOrigins = [
    'http://localhost:5173',
    'https://zonagolproject.sbedor12.workers.dev'
]

app.use(cors({
    origin: (origin, callback) => {

        // Permitir solicitudes sin Origin:
        // Postman, PowerShell, webhooks, comunicación servidor-servidor, etc.
        if (!origin) {
            return callback(null, true)
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true)
        }

        return callback(
            new Error('Origen no permitido por CORS')
        )
    }
}))
app.use(express.json())


// =====================================
// RUTAS
// =====================================

// SQL SERVER / AUTENTICACIÓN TRADICIONAL
app.use('/api', sqlServerRoutes)

// GOOGLE SSO
app.use('/api', googleAuthRoutes)

// GOOGLE DRIVE
app.use('/api/google-drive', googleDriveRoutes)

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

// WOMPI / RECARGAS
app.use(
    '/api/pagos/wompi',
    wompiRoutes
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
// MANEJO GLOBAL DE ERRORES
// =====================================

app.use((err, req, res, next) => {

    console.error('Error procesando solicitud:', err.message)

    res.status(500).json({
        success: false,
        message: 'Error procesando la solicitud'
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