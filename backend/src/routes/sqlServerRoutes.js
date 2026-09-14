const express = require('express')
const { sql, poolPromise } = require('../databases/sqlServerDatabase')
const crypto = require('crypto')

const router = express.Router()


// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { correo, password } = req.body

        if (!correo || !password) {
            return res.status(400).json({
                success: false,
                message: 'Correo y contraseña son obligatorios'
            })
        }

        const pool = await poolPromise

        const result = await pool
            .request()
            .input('correo', sql.NVarChar(150), correo)
            .input('password', sql.NVarChar(500), password)
            .query(`
                SELECT
                    U.UsuarioId,
                    U.Correo,
                    U.RolId,
                    U.Estado
                FROM Usuario AS U
                INNER JOIN [Login] AS L
                    ON L.UsuarioId = U.UsuarioId
                WHERE U.Correo = @correo
                  AND L.PasswordHash = @password
                  AND U.Estado = 1
            `)

        if (result.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Correo o contraseña incorrectos'
            })
        }

        const usuario = result.recordset[0]

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            usuario: {
                id: usuario.UsuarioId,
                correo: usuario.Correo,
                rolId: usuario.RolId
            }
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        })
    }
})


// REGISTRO
router.post('/registro', async (req, res) => {
    let transaction

    try {
        const {
            nombres,
            apellidos,
            tipoDocumento,
            documento,
            fechaNacimiento,
            celular,
            correo,
            password,
        } = req.body

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
                message: 'Todos los campos obligatorios deben estar completos',
            })
        }

        if (!/^\S+@\S+\.\S+$/.test(correo)) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico no es válido',
            })
        }

        if (!/^3\d{9}$/.test(celular)) {
            return res.status(400).json({
                success: false,
                message: 'El número de celular no es válido',
            })
        }

        if (!/^\d{6,12}$/.test(documento)) {
            return res.status(400).json({
                success: false,
                message: 'El documento no es válido',
            })
        }

        const fechaNacimientoDate =
            new Date(`${fechaNacimiento}T12:00:00`)

        const hoy = new Date()

        let edad =
            hoy.getFullYear() -
            fechaNacimientoDate.getFullYear()

        const cumpleEsteAno =
            hoy.getMonth() > fechaNacimientoDate.getMonth() ||
            (
                hoy.getMonth() === fechaNacimientoDate.getMonth() &&
                hoy.getDate() >= fechaNacimientoDate.getDate()
            )

        if (!cumpleEsteAno) {
            edad--
        }

        if (edad < 18) {
            return res.status(400).json({
                success: false,
                message: 'Debes ser mayor de 18 años para registrarte',
            })
        }

        const nombresSeparados =
            nombres.trim().split(/\s+/)

        const apellidosSeparados =
            apellidos.trim().split(/\s+/)

        const primerNombre =
            nombresSeparados[0]

        const segundoNombre =
            nombresSeparados.length > 1
                ? nombresSeparados.slice(1).join(' ')
                : null

        const primerApellido =
            apellidosSeparados[0]

        const segundoApellido =
            apellidosSeparados.length > 1
                ? apellidosSeparados.slice(1).join(' ')
                : null

        const pool = await poolPromise

        transaction =
            new sql.Transaction(pool)

        await transaction.begin()

        const rolResult =
            await new sql.Request(transaction)
                .query(`
                    SELECT TOP 1
                        RolId
                    FROM Rol
                    WHERE UPPER(Nombre) = 'CLIENTE'
                      AND Estado = 1
                `)

        if (rolResult.recordset.length === 0) {
            await transaction.rollback()

            return res.status(500).json({
                success: false,
                message: 'No existe un rol CLIENTE activo en la base de datos',
            })
        }

        const rolId =
            rolResult.recordset[0].RolId

        const existente =
            await new sql.Request(transaction)
                .input(
                    'correo',
                    sql.NVarChar(150),
                    correo.trim().toLowerCase()
                )
                .input(
                    'documento',
                    sql.VarChar(30),
                    documento
                )
                .query(`
                    SELECT TOP 1
                        U.UsuarioId,
                        U.Correo,
                        C.NumeroDocumento
                    FROM Usuario AS U
                    LEFT JOIN Cliente AS C
                        ON C.UsuarioId = U.UsuarioId
                    WHERE U.Correo = @correo
                       OR C.NumeroDocumento = @documento
                `)

        if (existente.recordset.length > 0) {
            await transaction.rollback()

            return res.status(409).json({
                success: false,
                message: 'El correo o número de documento ya está registrado',
            })
        }

        const idResult =
            await new sql.Request(transaction)
                .query(`
                    SELECT
                        ISNULL(MAX(UsuarioId), 0) + 1
                            AS NuevoUsuarioId
                    FROM Usuario
                    WITH (UPDLOCK, HOLDLOCK)
                `)

        const usuarioId =
            idResult.recordset[0].NuevoUsuarioId

        await new sql.Request(transaction)
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
                correo.trim().toLowerCase()
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

        await new sql.Request(transaction)
            .input(
                'usuarioId',
                sql.Int,
                usuarioId
            )
            .input(
                'tipoDocumento',
                sql.VarChar(20),
                tipoDocumento || 'CC'
            )
            .input(
                'documento',
                sql.VarChar(30),
                documento
            )
            .input(
                'primerNombre',
                sql.NVarChar(60),
                primerNombre
            )
            .input(
                'segundoNombre',
                sql.NVarChar(60),
                segundoNombre
            )
            .input(
                'primerApellido',
                sql.NVarChar(60),
                primerApellido
            )
            .input(
                'segundoApellido',
                sql.NVarChar(60),
                segundoApellido
            )
            .input(
                'fechaNacimiento',
                sql.Date,
                fechaNacimiento
            )
            .query(`
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
                    @usuarioId,
                    @tipoDocumento,
                    @documento,
                    @primerNombre,
                    @segundoNombre,
                    @primerApellido,
                    @segundoApellido,
                    @fechaNacimiento
                )
            `)

        await new sql.Request(transaction)
            .input(
                'usuarioId',
                sql.Int,
                usuarioId
            )
            .input(
                'password',
                sql.NVarChar(500),
                password
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
                    @password,
                    0
                )
            `)

        await transaction.commit()

        return res.status(201).json({
            success: true,
            message: 'Cuenta creada correctamente',
            usuario: {
                id: usuarioId,
                correo: correo.trim().toLowerCase(),
                rolId,
            },
        })

    } catch (error) {
        if (transaction) {
            try {
                await transaction.rollback()
            } catch {
                // La transacción ya pudo haberse cerrado
            }
        }

        console.error('Error registro:', error)

        return res.status(500).json({
            success: false,
            message: 'Error interno al crear la cuenta',
        })
    }
})


// RECUPERAR CONTRASEÑA
router.post('/recuperar-password', async (req, res) => {
    try {
        const { correo } = req.body

        if (
            !correo ||
            !/^\S+@\S+\.\S+$/.test(correo)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Ingresa un correo electrónico válido',
            })
        }

        const pool = await poolPromise

        const result =
            await pool
                .request()
                .input(
                    'correo',
                    sql.NVarChar(150),
                    correo.trim().toLowerCase()
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

        if (result.recordset.length > 0) {
            const usuarioId =
                result.recordset[0].UsuarioId

            const token =
                crypto
                    .randomBytes(32)
                    .toString('hex')

            const tokenHash =
                crypto
                    .createHash('sha256')
                    .update(token)
                    .digest('hex')

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
        }

        return res.status(200).json({
            success: true,
            message: 'Si el correo está registrado, la solicitud fue procesada',
        })

    } catch (error) {
        console.error(
            'Error recuperación:',
            error
        )

        return res.status(500).json({
            success: false,
            message: 'Error interno al solicitar la recuperación',
        })
    }
})


module.exports = router