const express = require('express')
const cors = require('cors')
const mongoRoutes = require('./routes/mongoRoutes')
const firebirdRoutes = require('./routes/firebirdRoutes')

const mysqlRoutes = require('./routes/mysqlRoutes')
const sqlServerRoutes = require('./routes/sqlServerRoutes')
const { connectMongo } = require('./databases/mongoDatabase')


const app = express()

app.use(cors())
app.use(express.json())


// RUTAS MYSQL
app.use('/api/mysql', mysqlRoutes)


// RUTAS SQL SERVER
app.use('/api', sqlServerRoutes)


// RUTAS MONGO
app.use('/api/mongo', mongoRoutes)


// RUTAS FIREBIRD
app.use('/api/firebird', firebirdRoutes)


// PRUEBA DEL BACKEND
app.get('/api/health', (req, res) => {
    res.json({
        message: 'Backend funcionando'
    })
})


const PORT = process.env.PORT || 5000

async function iniciarServidor() {
    try {
        await connectMongo()

        app.listen(PORT, () => {
            console.log(
                `Servidor ejecutándose en http://localhost:${PORT}`
            )
        })

    } catch (error) {
        console.error(
            'Error conectando a MongoDB:',
            error
        )
    }
}

iniciarServidor()