const express = require('express')
const jwt = require('jsonwebtoken')

const {
    sql,
    poolPromise
} = require('../databases/sqlServerDatabase')

const mysqlPool =
    require('../databases/mysqlDatabase')

const {
    verificarCredencialGoogle
} = require('../services/googleAuthService')

const {
    verificarToken
} = require('../middlewares/authMiddleware')

const router = express.Router()


// ============================================================
// LOGIN CON GOOGLE
//
// Este endpoint NO crea usuarios.
//
// Posibles resultados:
// - AUTENTICADO
// - VINCULACION_REQUERIDA
// - REGISTRO_REQUERIDO
// ============================================================

router.post('/login/google', async (req, res) => {

    try {

        const {
            credential
        } = req.body


        // =====================================================
        // VERIFICAR IDENTIDAD CON GOOGLE
        // =====================================================

        const identidadGoogle =
            await verificarCredencialGoogle(
                credential
            )


        const pool =
            await poolPromise


        // =====================================================
        // BUSCAR IDENTIDAD GOOGLE YA VINCULADA
        // =====================================================

        const identidadResult =
            await pool
                .request()
                .input(
                    'proveedor',
                    sql.VarChar(30),
                    identidadGoogle.proveedor
                )
                .input(
                    'proveedorUsuarioId',
                    sql.NVarChar(255),
                    identidadGoogle.proveedorUsuarioId
                )
                .query(`
                    SELECT TOP 1
                        IE.UsuarioId,
                        IE.Estado AS IdentidadEstado,
                        U.Correo,
                        U.RolId,
                        U.Estado AS UsuarioEstado,
                        U.Celular,
                        U.FechaRegistro,
                        U.FotoPerfilDriveId

                    FROM IdentidadExterna AS IE

                    INNER JOIN Usuario AS U
                        ON U.UsuarioId = IE.UsuarioId

                    WHERE IE.Proveedor = @proveedor
                      AND IE.ProveedorUsuarioId =
                          @proveedorUsuarioId
                `)


        // =====================================================
        // IDENTIDAD GOOGLE YA VINCULADA
        // =====================================================

        if (
            identidadResult.recordset.length > 0
        ) {

            const usuario =
                identidadResult.recordset[0]


            if (
                !usuario.IdentidadEstado ||
                !usuario.UsuarioEstado
            ) {

                return res.status(401).json({
                    success: false,
                    message:
                        'La cuenta no está disponible'
                })
            }


            // =================================================
            // ACTUALIZAR ÚLTIMO INGRESO
            // =================================================

            await pool
                .request()
                .input(
                    'proveedor',
                    sql.VarChar(30),
                    identidadGoogle.proveedor
                )
                .input(
                    'proveedorUsuarioId',
                    sql.NVarChar(255),
                    identidadGoogle.proveedorUsuarioId
                )
                .query(`
                    UPDATE IdentidadExterna

                    SET UltimoIngreso =
                        SYSDATETIME()

                    WHERE Proveedor =
                        @proveedor

                    AND ProveedorUsuarioId =
                        @proveedorUsuarioId
                `)


            // =================================================
            // JWT PROPIO DE ZONAGOL
            // =================================================

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


            return res.status(200).json({
                success: true,

                estado:
                    'AUTENTICADO',

                message:
                    'Inicio de sesión con Google exitoso',

                token,

                usuario: {
                    id: usuario.UsuarioId,
                    correo: usuario.Correo,
                    rolId: usuario.RolId,
                    celular: usuario.Celular,
                    fechaRegistro: usuario.FechaRegistro,
                    tieneFotoPerfil:
                        Boolean(
                            usuario.FotoPerfilDriveId
                        )
                }
            })
        }


        // =====================================================
        // NO ESTÁ VINCULADO:
        // BUSCAR SI EL CORREO YA EXISTE
        // =====================================================

        const usuarioResult =
            await pool
                .request()
                .input(
                    'correo',
                    sql.NVarChar(150),
                    identidadGoogle.correo
                )
                .query(`
                    SELECT TOP 1
                        UsuarioId,
                        Correo,
                        RolId,
                        Estado

                    FROM Usuario

                    WHERE Correo = @correo
                `)


        // =====================================================
        // CORREO YA EXISTENTE
        // =====================================================

        if (
            usuarioResult.recordset.length > 0
        ) {

            const usuario =
                usuarioResult.recordset[0]


            if (!usuario.Estado) {

                return res.status(401).json({
                    success: false,
                    message:
                        'La cuenta no está disponible'
                })
            }


            return res.status(200).json({
                success: true,

                estado:
                    'VINCULACION_REQUERIDA',

                message:
                    'Ya existe una cuenta ZonaGol con este correo. Inicia sesión con tu contraseña de ZonaGol para vincular Google.',

                correo:
                    identidadGoogle.correo
            })
        }


        // =====================================================
        // USUARIO NUEVO
        //
        // Todavía NO se crea nada.
        // El frontend deberá completar el registro.
        // =====================================================

        return res.status(200).json({
            success: true,

            estado:
                'REGISTRO_REQUERIDO',

            message:
                'Completa los datos requeridos para crear tu cuenta ZonaGol',

            perfilGoogle: {
                correo:
                    identidadGoogle.correo,

                nombre:
                    identidadGoogle.nombre,

                apellido:
                    identidadGoogle.apellido
            }
        })

    } catch (error) {

        console.error(
            'Error login Google:',
            error
        )


        // =====================================================
        // ERRORES CONTROLADOS GOOGLE
        // =====================================================

        if (
            error.codigo ===
            'GOOGLE_CREDENTIAL_REQUIRED'
        ) {

            return res.status(400).json({
                success: false,
                message:
                    error.message
            })
        }


        if (
            error.codigo ===
                'GOOGLE_CREDENTIAL_INVALID' ||
            error.codigo ===
                'GOOGLE_IDENTITY_INCOMPLETE'
        ) {

            return res.status(401).json({
                success: false,
                message:
                    error.message
            })
        }


        if (
            error.codigo ===
            'GOOGLE_SSO_NOT_CONFIGURED'
        ) {

            return res.status(500).json({
                success: false,
                message:
                    'Google SSO no está configurado en el servidor'
            })
        }


        return res.status(500).json({
            success: false,
            message:
                'Error interno al iniciar sesión con Google'
        })
    }
})


// ============================================================
// REGISTRO CON GOOGLE
//
// SQL SERVER:
// - Usuario
// - IdentidadExterna
//
// MYSQL:
// - Cliente
//
// NO crea Login.
// NO crea PasswordHash.
// NO almacena tokens de Google.
// ============================================================

router.post('/registro/google', async (req, res) => {

    let sqlTransaction = null
    let mysqlConnection = null

    let mysqlCommitted = false
    let sqlCommitted = false

    let usuarioIdCreado = null


    try {

        const {
            credential,
            nombres,
            apellidos,
            tipoDocumento,
            documento,
            fechaNacimiento,
            celular
        } = req.body


        // =====================================================
        // VALIDACIONES
        //
        // Se mantiene la misma lógica utilizada actualmente
        // por /api/registro.
        // =====================================================

        if (
            !credential ||
            !nombres ||
            !apellidos ||
            !documento ||
            !fechaNacimiento ||
            !celular
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Todos los campos obligatorios deben estar completos'
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
        // VERIFICAR NUEVAMENTE GOOGLE
        //
        // El correo y sub NO se confían al frontend.
        // Se obtienen otra vez del token verificado.
        // =====================================================

        const identidadGoogle =
            await verificarCredencialGoogle(
                credential
            )


        const correoNormalizado =
            identidadGoogle.correo


        // =====================================================
        // SEPARAR NOMBRES
        //
        // Misma lógica del registro tradicional actual.
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
            new sql.Transaction(
                sqlPool
            )


        await sqlTransaction.begin()

        await mysqlConnection.beginTransaction()


        // =====================================================
        // OBTENER ROL CLIENTE
        // =====================================================

        const rolResult =
            await new sql.Request(
                sqlTransaction
            )
                .query(`
                    SELECT TOP 1
                        RolId

                    FROM Rol

                    WHERE UPPER(Nombre) =
                        'CLIENTE'

                    AND Estado = 1
                `)


        if (
            rolResult.recordset.length === 0
        ) {

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
        // VALIDAR IDENTIDAD GOOGLE
        //
        // No puede existir ya una vinculación con el mismo sub.
        // =====================================================

        const identidadExistente =
            await new sql.Request(
                sqlTransaction
            )
                .input(
                    'proveedor',
                    sql.VarChar(30),
                    identidadGoogle.proveedor
                )
                .input(
                    'proveedorUsuarioId',
                    sql.NVarChar(255),
                    identidadGoogle.proveedorUsuarioId
                )
                .query(`
                    SELECT TOP 1
                        UsuarioId

                    FROM IdentidadExterna
                    WITH (
                        UPDLOCK,
                        HOLDLOCK
                    )

                    WHERE Proveedor =
                        @proveedor

                    AND ProveedorUsuarioId =
                        @proveedorUsuarioId
                `)


        if (
            identidadExistente
                .recordset
                .length > 0
        ) {

            await mysqlConnection.rollback()

            await sqlTransaction.rollback()


            return res.status(409).json({
                success: false,
                message:
                    'Esta cuenta de Google ya está vinculada a ZonaGol'
            })
        }


        // =====================================================
        // VALIDAR CORREO EN SQL SERVER
        //
        // Si existe, debe pasar por el futuro flujo de
        // vinculación. NO se crea un duplicado.
        // =====================================================

        const usuarioExistente =
            await new sql.Request(
                sqlTransaction
            )
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


        if (
            usuarioExistente
                .recordset
                .length > 0
        ) {

            await mysqlConnection.rollback()

            await sqlTransaction.rollback()


            return res.status(409).json({
                success: false,
                message:
                    'Ya existe una cuenta ZonaGol con este correo. Debes vincular tu cuenta de Google.'
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
                [
                    documento
                ]
            )


        if (
            clienteExistente.length > 0
        ) {

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
        //
        // Se conserva el mecanismo que ya usa ZonaGol porque
        // Usuario.UsuarioId NO es IDENTITY.
        // =====================================================

        const idResult =
            await new sql.Request(
                sqlTransaction
            )
                .query(`
                    SELECT
                        ISNULL(
                            MAX(UsuarioId),
                            0
                        ) + 1 AS NuevoUsuarioId

                    FROM Usuario

                    WITH (
                        UPDLOCK,
                        HOLDLOCK
                    )
                `)


        const usuarioId =
            idResult
                .recordset[0]
                .NuevoUsuarioId


        usuarioIdCreado =
            usuarioId


        // =====================================================
        // INSERTAR USUARIO
        //
        // NO se crea Login.
        // =====================================================

        await new sql.Request(
            sqlTransaction
        )
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
        // INSERTAR IDENTIDAD EXTERNA
        //
        // Guardamos solamente:
        // - proveedor
        // - Google sub
        // - usuario ZonaGol
        //
        // No guardamos token Google.
        // =====================================================

        await new sql.Request(
            sqlTransaction
        )
            .input(
                'proveedor',
                sql.VarChar(30),
                identidadGoogle.proveedor
            )
            .input(
                'proveedorUsuarioId',
                sql.NVarChar(255),
                identidadGoogle.proveedorUsuarioId
            )
            .input(
                'usuarioId',
                sql.Int,
                usuarioId
            )
            .query(`
                INSERT INTO IdentidadExterna
                (
                    Proveedor,
                    ProveedorUsuarioId,
                    UsuarioId,
                    UltimoIngreso
                )
                VALUES
                (
                    @proveedor,
                    @proveedorUsuarioId,
                    @usuarioId,
                    SYSDATETIME()
                )
            `)


        // =====================================================
        // INSERTAR CLIENTE EN MYSQL
        //
        // Misma estructura usada actualmente por /api/registro.
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
        // CREAR SALDO INICIAL DEL CLIENTE
        // =====================================================

        await mysqlConnection.execute(
            `
                INSERT INTO Saldo
                (
                    UsuarioId
                )
                VALUES
                (
                    ?
                )
            `,
            [
                usuarioId
            ]
        )


        // =====================================================
        // CONFIRMAR MYSQL
        //
        // Conservamos el mismo orden que utiliza actualmente
        // el registro tradicional.
        // =====================================================

        await mysqlConnection.commit()

        mysqlCommitted = true


        // =====================================================
        // CONFIRMAR SQL SERVER
        // =====================================================

        await sqlTransaction.commit()

        sqlCommitted = true


        // =====================================================
        // OBTENER DATOS FINALES DEL USUARIO
        // =====================================================

        const usuarioCreado =
            await sqlPool
                .request()
                .input(
                    'usuarioId',
                    sql.Int,
                    usuarioId
                )
                .query(`
                    SELECT
                        Celular,
                        FechaRegistro,
                        FotoPerfilDriveId
                    FROM Usuario
                    WHERE UsuarioId = @usuarioId
                `)


        const celularRegistrado =
            usuarioCreado
                .recordset[0]
                .Celular


        const fechaRegistro =
            usuarioCreado
                .recordset[0]
                .FechaRegistro


        const tieneFotoPerfil =
            Boolean(
                usuarioCreado
                    .recordset[0]
                    .FotoPerfilDriveId
            )


        // =====================================================
        // GENERAR JWT PROPIO DE ZONAGOL
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

            estado:
                'AUTENTICADO',

            message:
                'Cuenta creada correctamente con Google',

            token,

            usuario: {
                id:
                    usuarioId,

                correo:
                    correoNormalizado,

                rolId:
                    rolId,

                celular:
                    celularRegistrado,

                fechaRegistro,

                tieneFotoPerfil
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

                // Puede haberse cerrado previamente.

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

                // Puede haberse cerrado previamente.

            }
        }


        // =====================================================
        // COMPENSACIÓN
        //
        // Si MySQL confirmó y SQL Server no, eliminamos el
        // Cliente de MySQL para evitar inconsistencia entre
        // motores.
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
                    [
                        usuarioIdCreado
                    ]
                )


                console.log(
                    'Cliente Google compensado en MySQL:',
                    usuarioIdCreado
                )

            } catch (compensationError) {

                console.error(
                    'Error compensando Cliente Google en MySQL:',
                    compensationError
                )
            }
        }


        console.error(
            'Error registro Google:',
            error
        )


        // =====================================================
        // ERRORES GOOGLE CONTROLADOS
        // =====================================================

        if (
            error.codigo ===
            'GOOGLE_CREDENTIAL_REQUIRED'
        ) {

            return res.status(400).json({
                success: false,
                message:
                    error.message
            })
        }


        if (
            error.codigo ===
                'GOOGLE_CREDENTIAL_INVALID' ||
            error.codigo ===
                'GOOGLE_IDENTITY_INCOMPLETE'
        ) {

            return res.status(401).json({
                success: false,
                message:
                    error.message
            })
        }


        if (
            error.codigo ===
            'GOOGLE_SSO_NOT_CONFIGURED'
        ) {

            return res.status(500).json({
                success: false,
                message:
                    'Google SSO no está configurado en el servidor'
            })
        }


        // =====================================================
        // DUPLICADOS MYSQL
        // =====================================================

        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {

            return res.status(409).json({
                success: false,
                message:
                    'El correo, documento o identidad Google ya está registrado'
            })
        }


        // =====================================================
        // DUPLICADOS SQL SERVER
        // =====================================================

        if (
            error.number === 2601 ||
            error.number === 2627
        ) {

            return res.status(409).json({
                success: false,
                message:
                    'El correo o identidad Google ya está registrado'
            })
        }


        return res.status(500).json({
            success: false,
            message:
                'Error interno al crear la cuenta con Google'
        })

    } finally {

        if (mysqlConnection) {

            mysqlConnection.release()

        }
    }
})
// ============================================================
// VINCULAR GOOGLE A UN USUARIO ZONAGOL EXISTENTE
//
// Requiere:
// - JWT válido de ZonaGol
// - credencial Google válida
//
// El usuario primero debe haberse autenticado mediante
// el login tradicional de ZonaGol.
//
// No recibe contraseña.
// No almacena tokens de Google.
// ============================================================

router.post(
    '/google/vincular',
    verificarToken,
    async (req, res) => {

        let transaction = null

        try {

            const {
                credential
            } = req.body


            // =================================================
            // VERIFICAR GOOGLE
            // =================================================

            const identidadGoogle =
                await verificarCredencialGoogle(
                    credential
                )


            const usuarioId =
                req.usuario.usuarioId


            const pool =
                await poolPromise


            // =================================================
            // INICIAR TRANSACCIÓN SQL SERVER
            // =================================================

            transaction =
                new sql.Transaction(pool)


            await transaction.begin()


            // =================================================
            // OBTENER USUARIO AUTENTICADO
            //
            // No confiamos únicamente en los datos del JWT.
            // Volvemos a consultar el usuario actual.
            // =================================================

            const usuarioResult =
                await new sql.Request(
                    transaction
                )
                    .input(
                        'usuarioId',
                        sql.Int,
                        usuarioId
                    )
                    .query(`
                        SELECT TOP 1
                            UsuarioId,
                            Correo,
                            Estado

                        FROM Usuario

                        WHERE UsuarioId = @usuarioId
                    `)


            if (
                usuarioResult
                    .recordset
                    .length === 0
            ) {

                await transaction.rollback()

                transaction = null


                return res.status(401).json({
                    success: false,
                    message:
                        'El usuario autenticado no existe'
                })
            }


            const usuario =
                usuarioResult.recordset[0]


            if (!usuario.Estado) {

                await transaction.rollback()

                transaction = null


                return res.status(401).json({
                    success: false,
                    message:
                        'La cuenta no está disponible'
                })
            }


            // =================================================
            // EL CORREO GOOGLE DEBE COINCIDIR
            //
            // Este flujo existe precisamente porque Google
            // encontró una cuenta tradicional con el mismo
            // correo.
            // =================================================

            const correoZonaGol =
                usuario.Correo
                    .trim()
                    .toLowerCase()


            const correoGoogle =
                identidadGoogle.correo
                    .trim()
                    .toLowerCase()


            if (
                correoZonaGol !==
                correoGoogle
            ) {

                await transaction.rollback()

                transaction = null


                return res.status(409).json({
                    success: false,
                    message:
                        'La cuenta de Google debe usar el mismo correo registrado en ZonaGol'
                })
            }


            // =================================================
            // COMPROBAR SI LA IDENTIDAD GOOGLE YA ESTÁ VINCULADA
            // =================================================

            const identidadExistente =
                await new sql.Request(
                    transaction
                )
                    .input(
                        'proveedor',
                        sql.VarChar(30),
                        identidadGoogle.proveedor
                    )
                    .input(
                        'proveedorUsuarioId',
                        sql.NVarChar(255),
                        identidadGoogle.proveedorUsuarioId
                    )
                    .query(`
                        SELECT TOP 1
                            UsuarioId

                        FROM IdentidadExterna
                        WITH (
                            UPDLOCK,
                            HOLDLOCK
                        )

                        WHERE Proveedor =
                            @proveedor

                        AND ProveedorUsuarioId =
                            @proveedorUsuarioId
                    `)


            if (
                identidadExistente
                    .recordset
                    .length > 0
            ) {

                const usuarioVinculado =
                    identidadExistente
                        .recordset[0]
                        .UsuarioId


                // =============================================
                // YA ESTABA VINCULADA AL MISMO USUARIO
                //
                // Lo tratamos de forma idempotente.
                // =============================================

                if (
                    usuarioVinculado ===
                    usuarioId
                ) {

                    await transaction.commit()

                    transaction = null


                    return res.status(200).json({
                        success: true,

                        estado:
                            'VINCULADA',

                        message:
                            'La cuenta de Google ya estaba vinculada a tu cuenta ZonaGol'
                    })
                }


                // =============================================
                // ESTÁ VINCULADA A OTRO USUARIO
                // =============================================

                await transaction.rollback()

                transaction = null


                return res.status(409).json({
                    success: false,
                    message:
                        'Esta cuenta de Google ya está vinculada a otra cuenta ZonaGol'
                })
            }


            // =================================================
            // COMPROBAR SI ESTE USUARIO YA TIENE OTRA CUENTA
            // GOOGLE VINCULADA
            //
            // También lo protege:
            // UNIQUE (UsuarioId, Proveedor)
            // =================================================

            const proveedorExistente =
                await new sql.Request(
                    transaction
                )
                    .input(
                        'usuarioId',
                        sql.Int,
                        usuarioId
                    )
                    .input(
                        'proveedor',
                        sql.VarChar(30),
                        identidadGoogle.proveedor
                    )
                    .query(`
                        SELECT TOP 1
                            ProveedorUsuarioId

                        FROM IdentidadExterna
                        WITH (
                            UPDLOCK,
                            HOLDLOCK
                        )

                        WHERE UsuarioId =
                            @usuarioId

                        AND Proveedor =
                            @proveedor
                    `)


            if (
                proveedorExistente
                    .recordset
                    .length > 0
            ) {

                await transaction.rollback()

                transaction = null


                return res.status(409).json({
                    success: false,
                    message:
                        'Tu cuenta ZonaGol ya tiene una cuenta de Google vinculada'
                })
            }


            // =================================================
            // CREAR VINCULACIÓN
            // =================================================

            await new sql.Request(
                transaction
            )
                .input(
                    'proveedor',
                    sql.VarChar(30),
                    identidadGoogle.proveedor
                )
                .input(
                    'proveedorUsuarioId',
                    sql.NVarChar(255),
                    identidadGoogle.proveedorUsuarioId
                )
                .input(
                    'usuarioId',
                    sql.Int,
                    usuarioId
                )
                .query(`
                    INSERT INTO IdentidadExterna
                    (
                        Proveedor,
                        ProveedorUsuarioId,
                        UsuarioId,
                        UltimoIngreso
                    )
                    VALUES
                    (
                        @proveedor,
                        @proveedorUsuarioId,
                        @usuarioId,
                        SYSDATETIME()
                    )
                `)


            await transaction.commit()

            transaction = null


            return res.status(201).json({
                success: true,

                estado:
                    'VINCULADA',

                message:
                    'Cuenta de Google vinculada correctamente'
            })

        } catch (error) {

            if (transaction) {

                try {
                    await transaction.rollback()
                } catch {
                    // La transacción puede haberse cerrado.
                }
            }


            console.error(
                'Error vinculando Google:',
                error
            )


            // =================================================
            // ERRORES GOOGLE
            // =================================================

            if (
                error.codigo ===
                'GOOGLE_CREDENTIAL_REQUIRED'
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        error.message
                })
            }


            if (
                error.codigo ===
                    'GOOGLE_CREDENTIAL_INVALID' ||
                error.codigo ===
                    'GOOGLE_IDENTITY_INCOMPLETE'
            ) {

                return res.status(401).json({
                    success: false,
                    message:
                        error.message
                })
            }


            if (
                error.codigo ===
                'GOOGLE_SSO_NOT_CONFIGURED'
            ) {

                return res.status(500).json({
                    success: false,
                    message:
                        'Google SSO no está configurado en el servidor'
                })
            }


            // =================================================
            // RESTRICCIONES UNIQUE / PK DE SQL SERVER
            // =================================================

            if (
                error.number === 2601 ||
                error.number === 2627
            ) {

                return res.status(409).json({
                    success: false,
                    message:
                        'La cuenta de Google ya está vinculada'
                })
            }


            return res.status(500).json({
                success: false,
                message:
                    'Error interno al vincular la cuenta de Google'
            })
        }
    }
)

module.exports = router