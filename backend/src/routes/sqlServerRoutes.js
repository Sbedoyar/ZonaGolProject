const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const {
    autorizarRoles
} = require('../middlewares/roleMiddleware')

const {
    verificarToken
} = require('../middlewares/authMiddleware')

const {
    enviarCorreoRecuperacion
} = require('../services/emailService')

const {
    sql,
    poolPromise
} = require('../databases/sqlServerDatabase')

const mysqlPool = require('../databases/mysqlDatabase')

const {
    getMongoDb
} = require('../databases/mongoDatabase')


const router = express.Router()


// ============================================================
// LOGIN
//
// SQL SERVER:
// - valida Usuario + Login
// - actualiza IntentosFallidos
// - actualiza UltimoIngreso
//
// MONGODB:
// - registra historial de accesos
// ============================================================

router.post('/login', async (req, res) => {
    try {

        const {
            correo,
            password
        } = req.body


        // =====================================================
        // CONFIGURACIÓN DE BLOQUEO
        // =====================================================

        const MAX_INTENTOS_FALLIDOS = 5
        const MINUTOS_BLOQUEO = 15


        // =====================================================
        // VALIDAR CAMPOS
        // =====================================================

        if (!correo || !password) {
            return res.status(400).json({
                success: false,
                message:
                    'Correo y contraseña son obligatorios'
            })
        }


        const correoNormalizado =
            correo.trim().toLowerCase()


        const pool =
            await poolPromise


        // =====================================================
        // BUSCAR USUARIO
        //
        // SQL Server también determina si:
        // - actualmente está bloqueado
        // - tenía un bloqueo que ya expiró
        // =====================================================

        const result =
            await pool
                .request()
                .input(
                    'correo',
                    sql.NVarChar(150),
                    correoNormalizado
                )
                .query(`
                    SELECT
                        U.UsuarioId,
                        U.Correo,
                        U.RolId,
                        U.Estado,

                        L.PasswordHash,
                        L.IntentosFallidos,
                        L.BloqueadoHasta,
                        L.UltimoIngreso,

                        CASE
                            WHEN
                                L.BloqueadoHasta IS NOT NULL
                                AND L.BloqueadoHasta > SYSDATETIME()
                            THEN CAST(1 AS BIT)
                            ELSE CAST(0 AS BIT)
                        END AS EstaBloqueado,

                        CASE
                            WHEN
                                L.BloqueadoHasta IS NOT NULL
                                AND L.BloqueadoHasta <= SYSDATETIME()
                            THEN CAST(1 AS BIT)
                            ELSE CAST(0 AS BIT)
                        END AS BloqueoExpirado

                    FROM Usuario AS U

                    INNER JOIN [Login] AS L
                        ON L.UsuarioId = U.UsuarioId

                    WHERE U.Correo = @correo
                `)


        // =====================================================
        // OBTENER IP
        // =====================================================

        let direccionIP = null

        const forwardedFor =
            req.headers['x-forwarded-for']


        if (typeof forwardedFor === 'string') {

            direccionIP =
                forwardedFor
                    .split(',')[0]
                    .trim()

        } else {

            direccionIP =
                req.socket.remoteAddress || null
        }


        // =====================================================
        // OBTENER MONGODB
        // =====================================================

        const mongoDb =
            getMongoDb()


        // =====================================================
        // CORREO NO REGISTRADO
        // =====================================================

        if (result.recordset.length === 0) {

            await mongoDb
                .collection('historial_acceso')
                .insertOne({
                    usuarioId: null,

                    correoIntentado:
                        correoNormalizado,

                    fechaHora:
                        new Date(),

                    exitoso:
                        false,

                    direccionIP,

                    motivo:
                        'CORREO_NO_REGISTRADO'
                })


            return res.status(401).json({
                success: false,
                message:
                    'Correo o contraseña incorrectos'
            })
        }


        const usuario =
            result.recordset[0]


        // =====================================================
        // USUARIO INACTIVO
        // =====================================================

        if (!usuario.Estado) {

            await mongoDb
                .collection('historial_acceso')
                .insertOne({
                    usuarioId:
                        usuario.UsuarioId,

                    correoIntentado:
                        correoNormalizado,

                    fechaHora:
                        new Date(),

                    exitoso:
                        false,

                    direccionIP,

                    motivo:
                        'USUARIO_INACTIVO'
                })


            return res.status(401).json({
                success: false,
                message:
                    'Correo o contraseña incorrectos'
            })
        }


        // =====================================================
        // USUARIO ACTUALMENTE BLOQUEADO
        //
        // No comprobamos la contraseña mientras el bloqueo
        // continúe activo.
        // =====================================================

        if (usuario.EstaBloqueado) {

            await mongoDb
                .collection('historial_acceso')
                .insertOne({
                    usuarioId:
                        usuario.UsuarioId,

                    correoIntentado:
                        correoNormalizado,

                    fechaHora:
                        new Date(),

                    exitoso:
                        false,

                    direccionIP,

                    motivo:
                        'INTENTO_USUARIO_BLOQUEADO',

                    bloqueadoHasta:
                        usuario.BloqueadoHasta
                })


            return res.status(429).json({
                success: false,

                message:
                    'La cuenta está temporalmente bloqueada por varios intentos fallidos. Intenta nuevamente más tarde.'
            })
        }


        // =====================================================
        // BLOQUEO EXPIRADO
        //
        // Si pasaron los 15 minutos:
        // - quitamos el bloqueo
        // - reiniciamos los intentos
        // =====================================================

        if (usuario.BloqueoExpirado) {

            await pool
                .request()
                .input(
                    'usuarioId',
                    sql.Int,
                    usuario.UsuarioId
                )
                .query(`
                    UPDATE [Login]
                    SET
                        IntentosFallidos = 0,
                        BloqueadoHasta = NULL
                    WHERE UsuarioId = @usuarioId
                `)
        }


        // =====================================================
        // VALIDAR CONTRASEÑA CON BCRYPT
        // =====================================================

        const passwordCorrecta =
            await bcrypt.compare(
                password,
                usuario.PasswordHash
            )


        // =====================================================
        // CONTRASEÑA INCORRECTA
        // =====================================================

        if (!passwordCorrecta) {

            // =================================================
            // SQL SERVER
            //
            // Incrementamos el contador.
            //
            // Si llega al quinto intento:
            // BloqueadoHasta = ahora + 15 minutos.
            // =================================================

            const intentoResult =
                await pool
                    .request()
                    .input(
                        'usuarioId',
                        sql.Int,
                        usuario.UsuarioId
                    )
                    .input(
                        'maxIntentos',
                        sql.Int,
                        MAX_INTENTOS_FALLIDOS
                    )
                    .input(
                        'minutosBloqueo',
                        sql.Int,
                        MINUTOS_BLOQUEO
                    )
                    .query(`
                        UPDATE [Login]

                        SET
                            IntentosFallidos =
                                IntentosFallidos + 1,

                            BloqueadoHasta =
                                CASE
                                    WHEN
                                        IntentosFallidos + 1
                                        >= @maxIntentos
                                    THEN
                                        DATEADD(
                                            MINUTE,
                                            @minutosBloqueo,
                                            SYSDATETIME()
                                        )
                                    ELSE
                                        NULL
                                END

                        OUTPUT
                            inserted.IntentosFallidos,
                            inserted.BloqueadoHasta

                        WHERE UsuarioId = @usuarioId
                    `)


            const loginActualizado =
                intentoResult.recordset[0]


            const usuarioFueBloqueado =
                loginActualizado.IntentosFallidos
                >= MAX_INTENTOS_FALLIDOS


            // =================================================
            // MONGODB
            // =================================================

            await mongoDb
                .collection('historial_acceso')
                .insertOne({
                    usuarioId:
                        usuario.UsuarioId,

                    correoIntentado:
                        correoNormalizado,

                    fechaHora:
                        new Date(),

                    exitoso:
                        false,

                    direccionIP,

                    motivo:
                        usuarioFueBloqueado
                            ? 'USUARIO_BLOQUEADO'
                            : 'PASSWORD_INCORRECTA',

                    intentosFallidos:
                        loginActualizado.IntentosFallidos,

                    bloqueadoHasta:
                        loginActualizado.BloqueadoHasta
                })


            // =================================================
            // RESPUESTA CUANDO ALCANZA EL LÍMITE
            // =================================================

            if (usuarioFueBloqueado) {

                return res.status(429).json({
                    success: false,

                    message:
                        'La cuenta fue bloqueada temporalmente por varios intentos fallidos. Intenta nuevamente en 15 minutos.'
                })
            }


            // =================================================
            // RESPUESTA NORMAL DE PASSWORD INCORRECTA
            // =================================================

            return res.status(401).json({
                success: false,

                message:
                    'Correo o contraseña incorrectos'
            })
        }


        // =====================================================
        // LOGIN CORRECTO
        //
        // Reiniciar contador y cualquier bloqueo.
        // =====================================================

        await pool
            .request()
            .input(
                'usuarioId',
                sql.Int,
                usuario.UsuarioId
            )
            .query(`
                UPDATE [Login]

                SET
                    IntentosFallidos = 0,
                    BloqueadoHasta = NULL,
                    UltimoIngreso = SYSDATETIME()

                WHERE UsuarioId = @usuarioId
            `)


        // =====================================================
        // MONGODB:
        // GUARDAR LOGIN EXITOSO
        // =====================================================

        await mongoDb
            .collection('historial_acceso')
            .insertOne({
                usuarioId:
                    usuario.UsuarioId,

                correoIntentado:
                    correoNormalizado,

                fechaHora:
                    new Date(),

                exitoso:
                    true,

                direccionIP,

                motivo:
                    'LOGIN_EXITOSO'
            })
            // ============================================================
            // GENERAR JWT
            // ============================================================

            const token =
                jwt.sign(
                    {
                        usuarioId:
                            usuario.UsuarioId,

                        correo:
                            usuario.Correo,

                        rolId:
                            usuario.RolId
                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn:
                            process.env.JWT_EXPIRES_IN
                    }
                )


        // =====================================================
        // RESPUESTA
        // =====================================================

        return res.status(200).json({
            success: true,

            message:
                'Inicio de sesión exitoso',
            token,

            usuario: {
                id:
                    usuario.UsuarioId,

                correo:
                    usuario.Correo,

                rolId:
                    usuario.RolId
            }
        })

    } catch (error) {

        console.error(
            'Error login:',
            error
        )


        return res.status(500).json({
            success: false,

            message:
                'Error interno del servidor'
        })
    }
})


// ============================================================
// REGISTRO
//
// SQL SERVER:
// - Usuario
// - Login
//
// MYSQL:
// - Cliente
//
// UsuarioId se crea en SQL Server y se reutiliza en MySQL.
// ============================================================

router.post('/registro', async (req, res) => {

    let sqlTransaction = null
    let mysqlConnection = null

    let mysqlCommitted = false
    let sqlCommitted = false

    let usuarioIdCreado = null


    try {

        const {
            nombres,
            apellidos,
            tipoDocumento,
            documento,
            fechaNacimiento,
            celular,
            correo,
            password
        } = req.body


        // =====================================================
        // VALIDACIONES
        // =====================================================

        if (
            !nombres ||
            !apellidos ||
            !documento ||
            !fechaNacimiento ||
            !celular ||
            !correo ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Todos los campos obligatorios deben estar completos'
            })
        }


        const correoNormalizado =
            correo.trim().toLowerCase()


        if (!/^\S+@\S+\.\S+$/.test(correoNormalizado)) {
            return res.status(400).json({
                success: false,
                message:
                    'El correo electrónico no es válido'
            })
        }


        if (!/^3\d{9}$/.test(celular)) {
            return res.status(400).json({
                success: false,
                message:
                    'El número de celular no es válido'
            })
        }


        if (!/^\d{6,12}$/.test(documento)) {
            return res.status(400).json({
                success: false,
                message:
                    'El documento no es válido'
            })
        }


        // =====================================================
        // VALIDAR EDAD
        // =====================================================

        const fechaNacimientoDate =
            new Date(
                `${fechaNacimiento}T12:00:00`
            )


        const hoy =
            new Date()


        let edad =
            hoy.getFullYear() -
            fechaNacimientoDate.getFullYear()


        const cumpleEsteAno =
            hoy.getMonth() >
                fechaNacimientoDate.getMonth() ||
            (
                hoy.getMonth() ===
                    fechaNacimientoDate.getMonth() &&
                hoy.getDate() >=
                    fechaNacimientoDate.getDate()
            )


        if (!cumpleEsteAno) {
            edad--
        }


        if (edad < 18) {
            return res.status(400).json({
                success: false,
                message:
                    'Debes ser mayor de 18 años para registrarte'
            })
        }


        // =====================================================
        // SEPARAR NOMBRES
        // =====================================================

        const nombresSeparados =
            nombres.trim().split(/\s+/)


        const apellidosSeparados =
            apellidos.trim().split(/\s+/)


        const primerNombre =
            nombresSeparados[0]


        const segundoNombre =
            nombresSeparados.length > 1
                ? nombresSeparados
                    .slice(1)
                    .join(' ')
                : null


        const primerApellido =
            apellidosSeparados[0]


        const segundoApellido =
            apellidosSeparados.length > 1
                ? apellidosSeparados
                    .slice(1)
                    .join(' ')
                : null


        // =====================================================
        // CONEXIONES
        // =====================================================

        const sqlPool =
            await poolPromise


        mysqlConnection =
            await mysqlPool.getConnection()


        // =====================================================
        // TRANSACCIONES
        // =====================================================

        sqlTransaction =
            new sql.Transaction(sqlPool)


        await sqlTransaction.begin()

        await mysqlConnection.beginTransaction()


        // =====================================================
        // OBTENER ROL CLIENTE
        // =====================================================

        const rolResult =
            await new sql.Request(sqlTransaction)
                .query(`
                    SELECT TOP 1
                        RolId
                    FROM Rol
                    WHERE UPPER(Nombre) = 'CLIENTE'
                      AND Estado = 1
                `)


        if (rolResult.recordset.length === 0) {

            await mysqlConnection.rollback()
            await sqlTransaction.rollback()


            return res.status(500).json({
                success: false,
                message:
                    'No existe un rol CLIENTE activo en la base de datos'
            })
        }


        const rolId =
            rolResult.recordset[0].RolId


        // =====================================================
        // VALIDAR CORREO EN SQL SERVER
        // =====================================================

        const usuarioExistente =
            await new sql.Request(sqlTransaction)
                .input(
                    'correo',
                    sql.NVarChar(150),
                    correoNormalizado
                )
                .query(`
                    SELECT TOP 1
                        UsuarioId
                    FROM Usuario
                    WHERE Correo = @correo
                `)


        if (usuarioExistente.recordset.length > 0) {

            await mysqlConnection.rollback()
            await sqlTransaction.rollback()


            return res.status(409).json({
                success: false,
                message:
                    'El correo ya está registrado'
            })
        }


        // =====================================================
        // VALIDAR DOCUMENTO EN MYSQL
        // =====================================================

        const [clienteExistente] =
            await mysqlConnection.execute(
                `
                    SELECT
                        UsuarioId
                    FROM Cliente
                    WHERE NumeroDocumento = ?
                    LIMIT 1
                `,
                [documento]
            )


        if (clienteExistente.length > 0) {

            await mysqlConnection.rollback()
            await sqlTransaction.rollback()


            return res.status(409).json({
                success: false,
                message:
                    'El número de documento ya está registrado'
            })
        }


        // =====================================================
        // GENERAR UsuarioId
        // =====================================================

        const idResult =
            await new sql.Request(sqlTransaction)
                .query(`
                    SELECT
                        ISNULL(MAX(UsuarioId), 0) + 1
                            AS NuevoUsuarioId
                    FROM Usuario
                    WITH (UPDLOCK, HOLDLOCK)
                `)


        const usuarioId =
            idResult.recordset[0].NuevoUsuarioId


        usuarioIdCreado =
            usuarioId


        // =====================================================
        // INSERTAR USUARIO
        // =====================================================

        await new sql.Request(sqlTransaction)
            .input(
                'usuarioId',
                sql.Int,
                usuarioId
            )
            .input(
                'rolId',
                sql.Int,
                rolId
            )
            .input(
                'correo',
                sql.NVarChar(150),
                correoNormalizado
            )
            .input(
                'celular',
                sql.VarChar(20),
                celular
            )
            .query(`
                INSERT INTO Usuario
                (
                    UsuarioId,
                    RolId,
                    Correo,
                    Celular,
                    Estado
                )
                VALUES
                (
                    @usuarioId,
                    @rolId,
                    @correo,
                    @celular,
                    1
                )
            `)
        // =====================================================
        // GENERAR HASH DE LA CONTRASEÑA
        // =====================================================

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            )

        // =====================================================
        // INSERTAR LOGIN
        // =====================================================

        await new sql.Request(sqlTransaction)
            .input(
                'usuarioId',
                sql.Int,
                usuarioId
            )
            .input(
                'passwordHash',
                sql.NVarChar(500),
                passwordHash
            )
            .query(`
                INSERT INTO [Login]
                (
                    UsuarioId,
                    PasswordHash,
                    IntentosFallidos
                )
                VALUES
                (
                    @usuarioId,
                    @passwordHash,
                    0
                )
            `)


        // =====================================================
        // INSERTAR CLIENTE EN MYSQL
        // =====================================================

        await mysqlConnection.execute(
            `
                INSERT INTO Cliente
                (
                    UsuarioId,
                    TipoDocumento,
                    NumeroDocumento,
                    PrimerNombre,
                    SegundoNombre,
                    PrimerApellido,
                    SegundoApellido,
                    FechaNacimiento
                )
                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
            `,
            [
                usuarioId,
                tipoDocumento || 'CC',
                documento,
                primerNombre,
                segundoNombre,
                primerApellido,
                segundoApellido,
                fechaNacimiento
            ]
        )


        // =====================================================
        // CONFIRMAR MYSQL
        // =====================================================

        await mysqlConnection.commit()

        mysqlCommitted = true


        // =====================================================
        // CONFIRMAR SQL SERVER
        // =====================================================

        await sqlTransaction.commit()

        sqlCommitted = true

        // =====================================================
        // GENERAR JWT PARA EL USUARIO RECIÉN REGISTRADO
        // =====================================================

        const token =
            jwt.sign(
                {
                    usuarioId:
                        usuarioId,

                    correo:
                        correoNormalizado,

                    rolId:
                        rolId
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        process.env.JWT_EXPIRES_IN
                }
            )


        return res.status(201).json({
            success: true,

            message:
                'Cuenta creada correctamente',

            token,

            usuario: {
                id:
                    usuarioId,

                correo:
                    correoNormalizado,

                rolId:
                    rolId
            }
        })

    } catch (error) {

        // =====================================================
        // ROLLBACK MYSQL
        // =====================================================

        if (
            mysqlConnection &&
            !mysqlCommitted
        ) {
            try {
                await mysqlConnection.rollback()
            } catch {
                // La transacción pudo cerrarse
            }
        }


        // =====================================================
        // ROLLBACK SQL SERVER
        // =====================================================

        if (
            sqlTransaction &&
            !sqlCommitted
        ) {
            try {
                await sqlTransaction.rollback()
            } catch {
                // La transacción pudo cerrarse
            }
        }


        // =====================================================
        // COMPENSACIÓN
        // =====================================================

        if (
            mysqlConnection &&
            mysqlCommitted &&
            !sqlCommitted &&
            usuarioIdCreado !== null
        ) {
            try {

                await mysqlConnection.execute(
                    `
                        DELETE FROM Cliente
                        WHERE UsuarioId = ?
                    `,
                    [usuarioIdCreado]
                )


                console.log(
                    'Cliente compensado en MySQL:',
                    usuarioIdCreado
                )

            } catch (compensationError) {

                console.error(
                    'Error compensando Cliente en MySQL:',
                    compensationError
                )
            }
        }


        console.error(
            'Error registro:',
            error
        )


        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message:
                    'El correo o número de documento ya está registrado'
            })
        }


        if (
            error.number === 2601 ||
            error.number === 2627
        ) {
            return res.status(409).json({
                success: false,
                message:
                    'El correo o número de documento ya está registrado'
            })
        }


        return res.status(500).json({
            success: false,
            message:
                'Error interno al crear la cuenta'
        })

    } finally {

        if (mysqlConnection) {
            mysqlConnection.release()
        }
    }
})


// ============================================================
// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// SQL SERVER -> ZonaGolAuth
//
// En desarrollo devolvemos temporalmente el token original.
// Cuando implementemos correo real, esto se elimina.
// ============================================================

router.post(
    '/recuperar-password',
    async (req, res) => {

        try {

            const {
                correo
            } = req.body


            if (
                !correo ||
                !/^\S+@\S+\.\S+$/.test(correo)
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Ingresa un correo electrónico válido'
                })
            }


            const correoNormalizado =
                correo.trim().toLowerCase()


            const pool =
                await poolPromise


            const result =
                await pool
                    .request()
                    .input(
                        'correo',
                        sql.NVarChar(150),
                        correoNormalizado
                    )
                    .query(`
                        SELECT
                            U.UsuarioId
                        FROM Usuario AS U
                        INNER JOIN [Login] AS L
                            ON L.UsuarioId = U.UsuarioId
                        WHERE U.Correo = @correo
                          AND U.Estado = 1
                    `)


            // -------------------------------------------------
            // Siempre devolvemos una respuesta genérica
            // para no revelar si un correo existe.
            // -------------------------------------------------

            if (result.recordset.length === 0) {

                return res.status(200).json({
                    success: true,
                    message:
                        'Si el correo está registrado, la solicitud fue procesada'
                })
            }


            const usuarioId =
                result.recordset[0].UsuarioId


            // -------------------------------------------------
            // GENERAR TOKEN REAL
            // -------------------------------------------------

            const token =
                crypto
                    .randomBytes(32)
                    .toString('hex')


            // -------------------------------------------------
            // GUARDAR SOLAMENTE EL HASH
            // -------------------------------------------------

            const tokenHash =
                crypto
                    .createHash('sha256')
                    .update(token)
                    .digest('hex')
            // ============================================================
            // REVOCAR RECUPERACIONES ANTERIORES ACTIVAS
            //
            // Solo debe existir un enlace de recuperación válido
            // por usuario.
            // ============================================================

            await pool
                .request()
                .input(
                    'usuarioId',
                    sql.Int,
                    usuarioId
                )
                .query(`
                    UPDATE RecuperacionClave
                    SET FechaRevocacion = SYSDATETIME()
                    WHERE UsuarioId = @usuarioId
                    AND FechaUso IS NULL
                    AND FechaRevocacion IS NULL
                    AND FechaExpiracion > SYSDATETIME()
                `)


            await pool
                .request()
                .input(
                    'usuarioId',
                    sql.Int,
                    usuarioId
                )
                .input(
                    'tokenHash',
                    sql.NVarChar(500),
                    tokenHash
                )
                .query(`
                    INSERT INTO RecuperacionClave
                    (
                        UsuarioId,
                        TokenHash,
                        FechaSolicitud,
                        FechaExpiracion
                    )
                    VALUES
                    (
                        @usuarioId,
                        @tokenHash,
                        SYSDATETIME(),
                        DATEADD(
                            MINUTE,
                            30,
                            SYSDATETIME()
                        )
                    )
                `)
                // ============================================================
                // CREAR ENLACE DE RECUPERACIÓN
                // ============================================================

                const enlaceRecuperacion =
                    `http://localhost:5173/?token=${encodeURIComponent(token)}`


                // ============================================================
                // ENVIAR CORREO REAL
                // ============================================================

                await enviarCorreoRecuperacion(
                    correoNormalizado,
                    enlaceRecuperacion
                )


            return res.status(200).json({
                success: true,

                message:
                    'Si el correo está registrado, la solicitud fue procesada',

            })

        } catch (error) {

            console.error(
                'Error recuperación:',
                error
            )


            return res.status(500).json({
                success: false,
                message:
                    'Error interno al solicitar la recuperación'
            })
        }
    }
)


// ============================================================
// RESTABLECER CONTRASEÑA
// SQL SERVER -> ZonaGolAuth
// ============================================================

router.post(
    '/restablecer-password',
    async (req, res) => {

        let transaction = null

        try {

            const {
                token,
                nuevaPassword
            } = req.body


            // =================================================
            // VALIDACIONES
            // =================================================

            if (!token || !nuevaPassword) {

                return res.status(400).json({
                    success: false,
                    message:
                        'El token y la nueva contraseña son obligatorios'
                })
            }


            if (nuevaPassword.length < 6) {

                return res.status(400).json({
                    success: false,
                    message:
                        'La nueva contraseña debe tener al menos 6 caracteres'
                })
            }


            // =================================================
            // CALCULAR HASH DEL TOKEN RECIBIDO
            // =================================================

            const tokenHash =
                crypto
                    .createHash('sha256')
                    .update(token)
                    .digest('hex')


            const pool =
                await poolPromise


            // =================================================
            // BUSCAR TOKEN VÁLIDO
            // =================================================

            const tokenResult =
                await pool
                    .request()
                    .input(
                        'tokenHash',
                        sql.NVarChar(500),
                        tokenHash
                    )
                    .query(`
                        SELECT TOP 1
                            UsuarioId,
                            FechaSolicitud,
                            FechaExpiracion,
                            FechaUso,
                            FechaRevocacion
                        FROM RecuperacionClave
                        WHERE TokenHash = @tokenHash
                          AND FechaUso IS NULL
                          AND FechaRevocacion IS NULL
                          AND FechaExpiracion > SYSDATETIME()
                        ORDER BY FechaSolicitud DESC
                    `)


            if (tokenResult.recordset.length === 0) {

                return res.status(400).json({
                    success: false,
                    message:
                        'El enlace de recuperación no es válido o ya expiró'
                })
            }


            const recuperacion =
                tokenResult.recordset[0]

            // =================================================
            // GENERAR HASH DE LA NUEVA CONTRASEÑA
            // =================================================

            const passwordHash =
                await bcrypt.hash(
                    nuevaPassword,
                    12
                )

            // =================================================
            // TRANSACCIÓN SQL SERVER
            // =================================================

            transaction =
                new sql.Transaction(pool)

            await transaction.begin()


            // =================================================
            // CAMBIAR CONTRASEÑA
            //
            // Por ahora PasswordHash sigue almacenando texto
            // como en el proyecto actual.
            // Después implementaremos hashing real.
            // =================================================

            await new sql.Request(transaction)
                .input(
                    'usuarioId',
                    sql.Int,
                    recuperacion.UsuarioId
                )
                .input(
                    'passwordHash',
                    sql.NVarChar(500),
                    passwordHash
                )
                .query(`
                    UPDATE [Login]
                    SET
                        PasswordHash = @passwordHash,
                        IntentosFallidos = 0,
                        BloqueadoHasta = NULL
                    WHERE UsuarioId = @usuarioId
                `)


            // =================================================
            // MARCAR TOKEN COMO UTILIZADO
            // =================================================

            await new sql.Request(transaction)
                .input(
                    'usuarioId',
                    sql.Int,
                    recuperacion.UsuarioId
                )
                .input(
                    'tokenHash',
                    sql.NVarChar(500),
                    tokenHash
                )
                .query(`
                    UPDATE RecuperacionClave
                    SET FechaUso = SYSDATETIME()
                    WHERE UsuarioId = @usuarioId
                    AND TokenHash = @tokenHash
                    AND FechaUso IS NULL
                    AND FechaRevocacion IS NULL
                `)


            await transaction.commit()


            return res.status(200).json({
                success: true,
                message:
                    'La contraseña fue actualizada correctamente'
            })

        } catch (error) {

            if (transaction) {
                try {
                    await transaction.rollback()
                } catch {
                    // Puede haber terminado previamente
                }
            }


            console.error(
                'Error restableciendo contraseña:',
                error
            )


            return res.status(500).json({
                success: false,
                message:
                    'Error interno al restablecer la contraseña'
            })
        }
    }
)

// ============================================================
// RUTA PROTEGIDA DE PRUEBA
// ============================================================

router.get(
    '/perfil-protegido',
    verificarToken,
    async (req, res) => {

        try {

            return res.status(200).json({
                success: true,

                message:
                    'Acceso autorizado',

                usuario: {
                    usuarioId:
                        req.usuario.usuarioId,

                    correo:
                        req.usuario.correo,

                    rolId:
                        req.usuario.rolId
                }
            })

        } catch (error) {

            console.error(
                'Error en ruta protegida:',
                error
            )

            return res.status(500).json({
                success: false,
                message:
                    'Error interno del servidor'
            })
        }
    }
)

// ============================================================
// RUTA EXCLUSIVA PARA ADMINISTRADOR
//
// Rol 1 = ADMINISTRADOR
// ============================================================

router.get(
    '/solo-admin',

    verificarToken,

    autorizarRoles(1),

    async (req, res) => {

        return res.status(200).json({
            success: true,

            message:
                'Acceso exclusivo de administrador',

            usuario: {
                usuarioId:
                    req.usuario.usuarioId,

                correo:
                    req.usuario.correo,

                rolId:
                    req.usuario.rolId
            }
        })
    }
)

module.exports = router