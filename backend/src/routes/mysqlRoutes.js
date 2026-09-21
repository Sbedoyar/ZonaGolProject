const express = require('express')
const mysqlPool = require('../databases/mysqlDatabase')
const { postgresPool } = require('../databases/postgresDatabase')
const { verificarToken } = require('../middlewares/authMiddleware')
const router = express.Router()

const {
    autorizarRoles
} = require('../middlewares/roleMiddleware')

router.get('/empleados', async (req, res) => {
    try {
        const [empleados] = await mysqlPool.query(
            'SELECT * FROM empleado'
        )

        res.json(empleados)
    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error consultando empleados en MySQL'
        })
    }
})

router.get('/empleados/:documento', async (req, res) => {
    try {
        const [filas] = await mysqlPool.query(
            'SELECT * FROM empleado WHERE documento = ?',
            [req.params.documento]
        )

        if (filas.length === 0) {
            return res.status(404).json({
                mensaje: 'Empleado no encontrado'
            })
        }

        res.json(filas[0])

    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error consultando empleado'
        })
    }
})

router.post('/empleados', async (req, res) => {
    try {
        const {
            documento,
            tipo_documento,
            nombres,
            apellidos,
            correo,
            fecha_nacimiento,
            salario
        } = req.body

        await mysqlPool.query(
            `INSERT INTO empleado
            (documento, tipo_documento, nombres, apellidos, correo, fecha_nacimiento, salario)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                documento,
                tipo_documento,
                nombres,
                apellidos,
                correo,
                fecha_nacimiento,
                salario
            ]
        )

        res.status(201).json({
            mensaje: 'Empleado creado correctamente'
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error creando empleado'
        })
    }
})

router.put('/empleados/:documento', async (req, res) => {
    try {
        const {
            nombres,
            apellidos,
            correo,
            salario
        } = req.body

        const [resultado] = await mysqlPool.query(
            `UPDATE empleado
            SET nombres = ?, apellidos = ?, correo = ?, salario = ?
            WHERE documento = ?`,
            [
                nombres,
                apellidos,
                correo,
                salario,
                req.params.documento
            ]
        )

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'Empleado no encontrado'
            })
        }

        res.json({
            mensaje: 'Empleado actualizado correctamente'
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error actualizando empleado'
        })
    }
})

router.delete('/empleados/:documento', async (req, res) => {
    try {
        const [resultado] = await mysqlPool.query(
            'DELETE FROM empleado WHERE documento = ?',
            [req.params.documento]
        )

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'Empleado no encontrado'
            })
        }

        res.json({
            mensaje: 'Empleado eliminado correctamente'
        })

    } catch (error) {
        console.error(error)

        res.status(500).json({
            mensaje: 'Error eliminando empleado'
        })
    }
})

// ============================================================
// CREAR APUESTA
// ============================================================

router.post(
    '/apuestas',
    verificarToken,
    async (req, res) => {

        const usuarioId =
            Number(req.usuario.usuarioId)

        const montoApostado =
            Number(req.body.montoApostado)

        const partidoReglaIds =
            Array.isArray(req.body.partidoReglaIds)
                ? req.body.partidoReglaIds.map(Number)
                : []


        // =====================================================
        // VALIDACIONES BÁSICAS
        // =====================================================

        if (
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no válido'
            })
        }


        if (
            !Number.isFinite(montoApostado) ||
            montoApostado < 1000
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'El valor mínimo de la apuesta es $1.000'
            })
        }


        if (partidoReglaIds.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    'Debes seleccionar al menos una opción de apuesta'
            })
        }


        if (
            partidoReglaIds.some(
                id =>
                    !Number.isInteger(id) ||
                    id <= 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Una de las selecciones no es válida'
            })
        }


        // =====================================================
        // EVITAR IDs REPETIDOS
        // =====================================================

        const idsUnicos =
            [...new Set(partidoReglaIds)]


        if (
            idsUnicos.length !==
            partidoReglaIds.length
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Hay selecciones repetidas en el cupón'
            })
        }


        let connection = null


        try {

            // =================================================
            // 1. VALIDAR SELECCIONES EN POSTGRESQL
            //
            // NO confiamos en la cuota enviada por React.
            // Leemos nuevamente la cuota oficial guardada
            // en PartidoRegla.
            // =================================================

            const opcionesResult =
                await postgresPool.query(
                    `
                    SELECT
                        pr.PartidoReglaId,
                        pr.PartidoId,
                        pr.ReglaId,
                        pr.Cuota,
                        pr.Estado,

                        p.EstadoPartidoId,
                        p.FechaHoraInicio,

                        r.Nombre AS NombreRegla

                    FROM PartidoRegla pr

                    INNER JOIN Partido p
                        ON p.PartidoId = pr.PartidoId

                    INNER JOIN Regla r
                        ON r.ReglaId = pr.ReglaId

                    WHERE
                        pr.PartidoReglaId =
                        ANY($1::int[])
                    `,
                    [idsUnicos]
                )


            // =================================================
            // TODOS LOS IDs DEBEN EXISTIR
            // =================================================

            if (
                opcionesResult.rows.length !==
                idsUnicos.length
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Una o más selecciones ya no existen'
                })
            }


            // =================================================
            // VALIDAR QUE SIGAN ACTIVAS
            //
            // EstadoPartidoId = 1 -> PROGRAMADO
            // =================================================

            const seleccionNoDisponible =
                opcionesResult.rows.find(
                    opcion =>
                        opcion.estado !== true ||
                        opcion.estadopartidoid !== 1
                )


            if (seleccionNoDisponible) {
                return res.status(409).json({
                    success: false,
                    message:
                        'Una de las selecciones ya no está disponible para apostar'
                })
            }


            // =================================================
            // SOLO UNA SELECCIÓN POR PARTIDO
            //
            // Ejemplo inválido:
            //
            // Nacional gana
            // +
            // Empate
            //
            // para el mismo partido dentro del mismo cupón.
            // =================================================

            const partidosSeleccionados =
                opcionesResult.rows.map(
                    opcion =>
                        opcion.partidoid
                )


            const partidosUnicos =
                new Set(
                    partidosSeleccionados
                )


            if (
                partidosUnicos.size !==
                partidosSeleccionados.length
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Solo puedes seleccionar una opción por partido'
                })
            }


            // =================================================
            // 2. INICIAR TRANSACCIÓN EN MYSQL
            // =================================================

            connection =
                await mysqlPool.getConnection()

            await connection.beginTransaction()


            // =================================================
            // 3. VALIDAR QUE EL USUARIO SEA CLIENTE
            // =================================================

            const [clientes] =
                await connection.query(
                    `
                    SELECT UsuarioId
                    FROM Cliente
                    WHERE UsuarioId = ?
                    LIMIT 1
                    `,
                    [usuarioId]
                )


            if (clientes.length === 0) {
                await connection.rollback()

                return res.status(404).json({
                    success: false,
                    message:
                        'El cliente no está registrado'
                })
            }


            // =================================================
            // 4. LEER Y BLOQUEAR SALDO
            //
            // FOR UPDATE evita que dos apuestas simultáneas
            // gasten el mismo saldo.
            // =================================================

            const [saldos] =
                await connection.query(
                    `
                    SELECT
                        UsuarioId,
                        SaldoDisponible,
                        SaldoRetenido

                    FROM Saldo

                    WHERE UsuarioId = ?

                    FOR UPDATE
                    `,
                    [usuarioId]
                )


            if (saldos.length === 0) {
                await connection.rollback()

                return res.status(400).json({
                    success: false,
                    message:
                        'El usuario no tiene una cuenta de saldo'
                })
            }


            const saldoDisponible =
                Number(
                    saldos[0].SaldoDisponible
                )


            if (
                saldoDisponible <
                montoApostado
            ) {
                await connection.rollback()

                return res.status(400).json({
                    success: false,
                    message:
                        'Saldo insuficiente para realizar la apuesta'
                })
            }


            // =================================================
            // 5. CREAR APUESTA
            //
            // EstadoApuestaId = 1 -> PENDIENTE
            // =================================================

            const [apuestaResult] =
                await connection.query(
                    `
                    INSERT INTO Apuesta
                    (
                        ClienteUsuarioId,
                        EstadoApuestaId,
                        MontoApostado
                    )
                    VALUES (?, 1, ?)
                    `,
                    [
                        usuarioId,
                        montoApostado
                    ]
                )


            const apuestaId =
                apuestaResult.insertId


            // =================================================
            // 6. GENERAR CÓDIGO DE APUESTA
            // =================================================

            const codigoApuesta =
                `AP${apuestaId}`


            await connection.query(
                `
                UPDATE Apuesta
                SET CodigoApuesta = ?
                WHERE ApuestaId = ?
                `,
                [
                    codigoApuesta,
                    apuestaId
                ]
            )


            // =================================================
            // 7. CREAR DETALLES
            //
            // EstadoDetalleApuestaId = 1 -> PENDIENTE
            //
            // CuotaAceptada se guarda como fotografía de la
            // cuota existente al momento de apostar.
            // =================================================

            for (
                const opcion
                of opcionesResult.rows
            ) {

                await connection.query(
                    `
                    INSERT INTO DetalleApuesta
                    (
                        ApuestaId,
                        PartidoReglaId,
                        EstadoDetalleApuestaId,
                        CuotaAceptada
                    )
                    VALUES (?, ?, 1, ?)
                    `,
                    [
                        apuestaId,
                        opcion.partidoreglaid,
                        Number(opcion.cuota)
                    ]
                )
            }


            // =================================================
            // 8. DESCONTAR SALDO
            // =================================================

            await connection.query(
                `
                UPDATE Saldo
                SET
                    SaldoDisponible =
                        SaldoDisponible - ?,

                    FechaActualizacion =
                        CURRENT_TIMESTAMP(6)

                WHERE UsuarioId = ?
                `,
                [
                    montoApostado,
                    usuarioId
                ]
            )


            // =================================================
            // 9. REGISTRAR MOVIMIENTO
            //
            // TipoMovimientoSaldoId = 4 -> APUESTA / SALIDA
            // =================================================

            await connection.query(
                `
                INSERT INTO MovimientoSaldo
                (
                    UsuarioId,
                    TipoMovimientoSaldoId,
                    PagoId,
                    ApuestaId,
                    Monto,
                    Descripcion
                )
                VALUES
                (
                    ?,
                    4,
                    NULL,
                    ?,
                    ?,
                    ?
                )
                `,
                [
                    usuarioId,
                    apuestaId,
                    montoApostado,
                    `Apuesta ${codigoApuesta}`
                ]
            )


            // =================================================
            // 10. CONSULTAR SALDO FINAL
            // =================================================

            const [saldoFinalResult] =
                await connection.query(
                    `
                    SELECT
                        SaldoDisponible,
                        SaldoRetenido

                    FROM Saldo

                    WHERE UsuarioId = ?
                    `,
                    [usuarioId]
                )


            const saldoFinal =
                Number(
                    saldoFinalResult[0]
                        .SaldoDisponible
                )


            // =================================================
            // 11. CONFIRMAR TODO
            // =================================================

            await connection.commit()


            // =================================================
            // CALCULAR CUOTA TOTAL
            //
            // En una apuesta combinada las cuotas se
            // multiplican.
            // =================================================

            const cuotaTotal =
                opcionesResult.rows.reduce(
                    (total, opcion) =>
                        total *
                        Number(opcion.cuota),
                    1
                )


            const retornoPotencial =
                montoApostado *
                cuotaTotal


            return res.status(201).json({
                success: true,

                message:
                    'Apuesta realizada correctamente',

                datos: {
                    apuestaId,

                    codigoApuesta,

                    estado:
                        'PENDIENTE',

                    montoApostado,

                    cantidadSelecciones:
                        opcionesResult.rows.length,

                    cuotaTotal:
                        Number(
                            cuotaTotal.toFixed(4)
                        ),

                    retornoPotencial:
                        Number(
                            retornoPotencial.toFixed(2)
                        ),

                    saldoDisponible:
                        saldoFinal
                }
            })


        } catch (error) {

            // =================================================
            // SI ALGO FALLA, DESHACEMOS MYSQL
            // =================================================

            if (connection) {
                try {
                    await connection.rollback()
                } catch (rollbackError) {
                    console.error(
                        'Error realizando rollback:',
                        rollbackError
                    )
                }
            }


            console.error(
                'Error creando apuesta:',
                error
            )


            return res.status(500).json({
                success: false,
                message:
                    'Error interno realizando la apuesta'
            })

        } finally {

            if (connection) {
                connection.release()
            }
        }
    }
)

// ============================================================
// CONSULTAR SALDO DEL USUARIO AUTENTICADO
// ============================================================

router.get(
    '/saldo',
    verificarToken,
    async (req, res) => {

        const usuarioId =
            Number(req.usuario.usuarioId)

        if (
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no válido'
            })
        }


        try {

            const [rows] =
                await mysqlPool.query(
                    `
                    SELECT
                        UsuarioId,
                        SaldoDisponible,
                        SaldoRetenido,
                        FechaActualizacion

                    FROM Saldo

                    WHERE UsuarioId = ?

                    LIMIT 1
                    `,
                    [usuarioId]
                )


            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        'El usuario no tiene una cuenta de saldo'
                })
            }


            const saldo =
                rows[0]


            return res.status(200).json({
                success: true,

                datos: {
                    usuarioId:
                        saldo.UsuarioId,

                    saldoDisponible:
                        Number(
                            saldo.SaldoDisponible
                        ),

                    saldoRetenido:
                        Number(
                            saldo.SaldoRetenido
                        ),

                    fechaActualizacion:
                        saldo.FechaActualizacion
                }
            })

        } catch (error) {

            console.error(
                'Error consultando saldo:',
                error
            )


            return res.status(500).json({
                success: false,
                message:
                    'Error interno consultando el saldo'
            })
        }
    }
)

// ============================================================
// MIS APUESTAS
// ============================================================

router.get(
    '/apuestas/mias',
    verificarToken,
    async (req, res) => {

        const usuarioId =
            Number(req.usuario.usuarioId)


        if (
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no válido'
            })
        }


        try {

            // =================================================
            // 1. CONSULTAR APUESTAS Y DETALLES EN MYSQL
            // =================================================

            const [rows] =
                await mysqlPool.query(
                    `
                    SELECT
                        a.ApuestaId,
                        a.CodigoApuesta,
                        a.ClienteUsuarioId,
                        a.EstadoApuestaId,
                        ea.Nombre AS EstadoApuesta,
                        a.FechaApuesta,
                        a.MontoApostado,

                        da.DetalleApuestaId,
                        da.PartidoReglaId,
                        da.EstadoDetalleApuestaId,
                        eda.Nombre AS EstadoDetalle,
                        da.CuotaAceptada

                    FROM Apuesta a

                    INNER JOIN EstadoApuesta ea
                        ON ea.EstadoApuestaId =
                           a.EstadoApuestaId

                    INNER JOIN DetalleApuesta da
                        ON da.ApuestaId =
                           a.ApuestaId

                    INNER JOIN EstadoDetalleApuesta eda
                        ON eda.EstadoDetalleApuestaId =
                           da.EstadoDetalleApuestaId

                    WHERE a.ClienteUsuarioId = ?

                    ORDER BY
                        a.ApuestaId ASC,
                        da.DetalleApuestaId ASC
                    `,
                    [usuarioId]
                )


            // =================================================
            // SI NO TIENE APUESTAS
            // =================================================

            if (rows.length === 0) {
                return res.status(200).json({
                    success: true,
                    cantidad: 0,
                    datos: []
                })
            }


            // =================================================
            // 2. OBTENER TODOS LOS PartidoReglaId
            // =================================================

            const partidoReglaIds =
                [
                    ...new Set(
                        rows.map(
                            row =>
                                Number(
                                    row.PartidoReglaId
                                )
                        )
                    )
                ]


            // =================================================
            // 3. CONSULTAR INFORMACIÓN DEPORTIVA
            //    EN POSTGRESQL
            // =================================================

            const postgresResult =
                await postgresPool.query(
                    `
                    SELECT
                        pr.PartidoReglaId,
                        pr.PartidoId,
                        pr.ReglaId,

                        r.Nombre AS OpcionApuesta,
                        r.TipoRegla,

                        p.NumeroJornada,
                        p.FechaHoraInicio,

                        local.Nombre AS EquipoLocal,
                        local.Sigla AS SiglaLocal,

                        visitante.Nombre AS EquipoVisitante,
                        visitante.Sigla AS SiglaVisitante,

                        ep.Nombre AS EstadoPartido

                    FROM PartidoRegla pr

                    INNER JOIN Regla r
                        ON r.ReglaId =
                           pr.ReglaId

                    INNER JOIN Partido p
                        ON p.PartidoId =
                           pr.PartidoId

                    INNER JOIN Equipo local
                        ON local.EquipoId =
                           p.EquipoLocalId

                    INNER JOIN Equipo visitante
                        ON visitante.EquipoId =
                           p.EquipoVisitanteId

                    INNER JOIN EstadoPartido ep
                        ON ep.EstadoPartidoId =
                           p.EstadoPartidoId

                    WHERE
                        pr.PartidoReglaId =
                        ANY($1::int[])
                    `,
                    [partidoReglaIds]
                )


            // =================================================
            // 4. CREAR MAPA PartidoReglaId -> DATOS DEPORTIVOS
            // =================================================

            const mapaOpciones =
                new Map()


            for (
                const opcion
                of postgresResult.rows
            ) {
                mapaOpciones.set(
                    Number(
                        opcion.partidoreglaid
                    ),
                    opcion
                )
            }


            // =================================================
            // 5. AGRUPAR DETALLES POR APUESTA
            // =================================================

            const mapaApuestas =
                new Map()


            for (const row of rows) {

                const apuestaId =
                    Number(row.ApuestaId)


                if (
                    !mapaApuestas.has(
                        apuestaId
                    )
                ) {
                    mapaApuestas.set(
                        apuestaId,
                        {
                            apuestaId,

                            codigoApuesta:
                                row.CodigoApuesta,

                            estadoApuestaId:
                                Number(
                                    row.EstadoApuestaId
                                ),

                            estado:
                                row.EstadoApuesta,

                            fechaApuesta:
                                row.FechaApuesta,

                            montoApostado:
                                Number(
                                    row.MontoApostado
                                ),

                            selecciones: []
                        }
                    )
                }


                const opcion =
                    mapaOpciones.get(
                        Number(
                            row.PartidoReglaId
                        )
                    )


                mapaApuestas
                    .get(apuestaId)
                    .selecciones
                    .push({
                        detalleApuestaId:
                            Number(
                                row.DetalleApuestaId
                            ),

                        partidoReglaId:
                            Number(
                                row.PartidoReglaId
                            ),

                        estadoDetalleApuestaId:
                            Number(
                                row.EstadoDetalleApuestaId
                            ),

                        estadoDetalle:
                            row.EstadoDetalle,

                        cuotaAceptada:
                            Number(
                                row.CuotaAceptada
                            ),

                        partidoId:
                            opcion
                                ? Number(
                                    opcion.partidoid
                                )
                                : null,

                        jornada:
                            opcion
                                ? Number(
                                    opcion.numerojornada
                                )
                                : null,

                        equipoLocal:
                            opcion
                                ?.equipolocal ||
                                null,

                        siglaLocal:
                            opcion
                                ?.siglalocal ||
                                null,

                        equipoVisitante:
                            opcion
                                ?.equipovisitante ||
                                null,

                        siglaVisitante:
                            opcion
                                ?.siglavisitante ||
                                null,

                        opcionApuesta:
                            opcion
                                ?.opcionapuesta ||
                                null,

                        tipoRegla:
                            opcion
                                ?.tiporegla ||
                                null,

                        fechaHoraInicio:
                            opcion
                                ?.fechahorainicio ||
                                null,

                        estadoPartido:
                            opcion
                                ?.estadopartido ||
                                null
                    })
            }


            // =================================================
            // 6. CALCULAR CUOTA TOTAL Y RETORNO POTENCIAL
            // =================================================

            const apuestas =
                Array.from(
                    mapaApuestas.values()
                ).map(
                    apuesta => {

                        const cuotaTotal =
                            apuesta
                                .selecciones
                                .reduce(
                                    (
                                        total,
                                        seleccion
                                    ) =>
                                        total *
                                        seleccion
                                            .cuotaAceptada,
                                    1
                                )


                        return {
                            ...apuesta,

                            cantidadSelecciones:
                                apuesta
                                    .selecciones
                                    .length,

                            cuotaTotal:
                                Number(
                                    cuotaTotal
                                        .toFixed(4)
                                ),

                            retornoPotencial:
                                Number(
                                    (
                                        apuesta
                                            .montoApostado *
                                        cuotaTotal
                                    ).toFixed(2)
                                )
                        }
                    }
                )


            // =================================================
            // RESPUESTA
            // =================================================

            return res.status(200).json({
                success: true,
                cantidad:
                    apuestas.length,
                datos:
                    apuestas
            })


        } catch (error) {

            console.error(
                'Error consultando apuestas:',
                error
            )


            return res.status(500).json({
                success: false,
                message:
                    'Error interno consultando las apuestas'
            })
        }
    }
)

// ============================================================
// LIQUIDAR APUESTAS DE UN PARTIDO FINALIZADO
// ============================================================

router.post(
    '/apuestas/liquidar-partido/:partidoId',
    verificarToken,
    autorizarRoles(1, 2),
    async (req, res) => {

        const partidoId =
            Number(req.params.partidoId)

        if (
            !Number.isInteger(partidoId) ||
            partidoId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'PartidoId no válido'
            })
        }


        let connection


        try {

            // =================================================
            // 1. CONSULTAR EL PARTIDO EN POSTGRESQL
            // =================================================

            const partidoResult =
                await postgresPool.query(
                    `
                    SELECT
                        PartidoId,
                        CodigoPartido,
                        EstadoPartidoId,
                        GolesLocal,
                        GolesVisitante

                    FROM Partido

                    WHERE PartidoId = $1
                    `,
                    [partidoId]
                )


            if (
                partidoResult.rows.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        'El partido no existe'
                })
            }


            const partido =
                partidoResult.rows[0]


            if (
                Number(
                    partido.estadopartidoid
                ) !== 3
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        'El partido todavía no está finalizado'
                })
            }


            if (
                partido.goleslocal === null ||
                partido.golesvisitante === null
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        'El partido no tiene marcador registrado'
                })
            }


            const golesLocal =
                Number(
                    partido.goleslocal
                )

            const golesVisitante =
                Number(
                    partido.golesvisitante
                )

            const golesTotales =
                golesLocal +
                golesVisitante


            // =================================================
            // 2. CONSULTAR REGLAS DEL PARTIDO
            // =================================================

            const reglasResult =
                await postgresPool.query(
                    `
                    SELECT
                        pr.PartidoReglaId,
                        pr.ReglaId,
                        r.Nombre

                    FROM PartidoRegla pr

                    INNER JOIN Regla r
                        ON r.ReglaId =
                           pr.ReglaId

                    WHERE pr.PartidoId = $1

                    ORDER BY pr.ReglaId
                    `,
                    [partidoId]
                )


            // =================================================
            // 3. CONFIGURACIONES DE REGLAS
            // =================================================

            const configuracionesResult =
                await postgresPool.query(
                    `
                    SELECT
                        ReglaId,
                        Parametro,
                        Valor

                    FROM ConfiguracionRegla

                    WHERE ReglaId IN (4, 5)
                    `
                )


            const configuraciones =
                new Map()


            for (
                const config
                of configuracionesResult.rows
            ) {

                const reglaId =
                    Number(
                        config.reglaid
                    )


                if (
                    !configuraciones.has(
                        reglaId
                    )
                ) {
                    configuraciones.set(
                        reglaId,
                        {}
                    )
                }


                configuraciones
                    .get(reglaId)[
                        config.parametro
                    ] =
                    config.valor
            }


            // =================================================
            // 4. EVALUAR LAS REGLAS
            // =================================================

            const resultadosReglas = []


            for (
                const regla
                of reglasResult.rows
            ) {

                const reglaId =
                    Number(
                        regla.reglaid
                    )

                let ganada = false


                // GANADOR LOCAL
                if (reglaId === 1) {

                    ganada =
                        golesLocal >
                        golesVisitante
                }


                // EMPATE
                else if (reglaId === 2) {

                    ganada =
                        golesLocal ===
                        golesVisitante
                }


                // GANADOR VISITANTE
                else if (reglaId === 3) {

                    ganada =
                        golesVisitante >
                        golesLocal
                }


                // MÁS DE 2.5
                else if (reglaId === 4) {

                    const linea =
                        Number(
                            configuraciones
                                .get(4)
                                ?.LINEA_GOLES
                        )

                    ganada =
                        golesTotales >
                        linea
                }


                // MENOS DE 2.5
                else if (reglaId === 5) {

                    const linea =
                        Number(
                            configuraciones
                                .get(5)
                                ?.LINEA_GOLES
                        )

                    ganada =
                        golesTotales <
                        linea
                }


                // AMBOS MARCAN - SÍ
                else if (reglaId === 6) {

                    ganada =
                        golesLocal > 0 &&
                        golesVisitante > 0
                }


                // AMBOS MARCAN - NO
                else if (reglaId === 7) {

                    ganada =
                        golesLocal === 0 ||
                        golesVisitante === 0
                }


                resultadosReglas.push({

                    partidoReglaId:
                        Number(
                            regla.partidoreglaid
                        ),

                    reglaId,

                    nombre:
                        regla.nombre,

                    ganada,

                    estadoDetalleApuestaId:
                        ganada
                            ? 2
                            : 3
                })
            }


            // =================================================
            // 5. ABRIR TRANSACCIÓN EN MYSQL
            // =================================================

            connection =
                await mysqlPool.getConnection()


            await connection.beginTransaction()


            const apuestasAfectadas =
                new Set()

            let detallesActualizados = 0


            // =================================================
            // 6. ACTUALIZAR DETALLEAPUESTA
            // =================================================

            for (
                const resultado
                of resultadosReglas
            ) {

                const [detalles] =
                    await connection.query(
                        `
                        SELECT
                            DetalleApuestaId,
                            ApuestaId

                        FROM DetalleApuesta

                        WHERE
                            PartidoReglaId = ?
                            AND EstadoDetalleApuestaId = 1

                        FOR UPDATE
                        `,
                        [
                            resultado
                                .partidoReglaId
                        ]
                    )


                if (
                    detalles.length === 0
                ) {
                    continue
                }


                const [updateDetalle] =
                    await connection.query(
                        `
                        UPDATE DetalleApuesta

                        SET
                            EstadoDetalleApuestaId = ?

                        WHERE
                            PartidoReglaId = ?
                            AND EstadoDetalleApuestaId = 1
                        `,
                        [
                            resultado
                                .estadoDetalleApuestaId,

                            resultado
                                .partidoReglaId
                        ]
                    )


                detallesActualizados +=
                    updateDetalle.affectedRows


                for (
                    const detalle
                    of detalles
                ) {
                    apuestasAfectadas.add(
                        Number(
                            detalle.ApuestaId
                        )
                    )
                }
            }


            // =================================================
            // 7. REVISAR ESTADO GENERAL DE CADA APUESTA
            // =================================================

            const liquidaciones = []


            for (
                const apuestaId
                of apuestasAfectadas
            ) {

                // ---------------------------------------------
                // BLOQUEAR APUESTA
                // ---------------------------------------------

                const [apuestas] =
                    await connection.query(
                        `
                        SELECT
                            ApuestaId,
                            CodigoApuesta,
                            ClienteUsuarioId,
                            EstadoApuestaId,
                            MontoApostado

                        FROM Apuesta

                        WHERE ApuestaId = ?

                        FOR UPDATE
                        `,
                        [apuestaId]
                    )


                if (
                    apuestas.length === 0
                ) {
                    continue
                }


                const apuesta =
                    apuestas[0]


                // ---------------------------------------------
                // TODOS LOS DETALLES
                // ---------------------------------------------

                const [detalles] =
                    await connection.query(
                        `
                        SELECT
                            DetalleApuestaId,
                            EstadoDetalleApuestaId,
                            CuotaAceptada

                        FROM DetalleApuesta

                        WHERE ApuestaId = ?

                        ORDER BY DetalleApuestaId

                        FOR UPDATE
                        `,
                        [apuestaId]
                    )


                const tienePerdida =
                    detalles.some(
                        detalle =>
                            Number(
                                detalle
                                    .EstadoDetalleApuestaId
                            ) === 3
                    )


                const todasGanadas =
                    detalles.length > 0 &&
                    detalles.every(
                        detalle =>
                            Number(
                                detalle
                                    .EstadoDetalleApuestaId
                            ) === 2
                    )


                let estadoFinal =
                    Number(
                        apuesta.EstadoApuestaId
                    )

                let premio = 0

                let premioAcreditado = 0


                // =================================================
                // APUESTA PERDIDA
                // =================================================

                if (
                    estadoFinal === 1 &&
                    tienePerdida
                ) {

                    await connection.query(
                        `
                        UPDATE Apuesta

                        SET EstadoApuestaId = 3

                        WHERE ApuestaId = ?
                        `,
                        [apuestaId]
                    )


                    estadoFinal = 3
                }


                // =================================================
                // APUESTA GANADA
                // =================================================

                else if (
                    estadoFinal === 1 &&
                    todasGanadas
                ) {

                    const cuotaTotal =
                        detalles.reduce(
                            (
                                total,
                                detalle
                            ) =>
                                total *
                                Number(
                                    detalle
                                        .CuotaAceptada
                                ),
                            1
                        )


                    const montoApostado =
                        Number(
                            apuesta
                                .MontoApostado
                        )


                    premio =
                        Number(
                            (
                                montoApostado *
                                cuotaTotal
                            ).toFixed(4)
                        )


                    // ---------------------------------------------
                    // MARCAR APUESTA COMO GANADA
                    // ---------------------------------------------

                    await connection.query(
                        `
                        UPDATE Apuesta

                        SET EstadoApuestaId = 2

                        WHERE ApuestaId = ?
                        `,
                        [apuestaId]
                    )


                    estadoFinal = 2


                    // ---------------------------------------------
                    // EVITAR PAGAR DOS VECES
                    // ---------------------------------------------

                    const [premiosExistentes] =
                        await connection.query(
                            `
                            SELECT
                                MovimientoSaldoId

                            FROM MovimientoSaldo

                            WHERE
                                ApuestaId = ?
                                AND TipoMovimientoSaldoId = 2

                            LIMIT 1
                            `,
                            [apuestaId]
                        )


                    if (
                        premiosExistentes.length === 0
                    ) {

                        // -----------------------------------------
                        // BLOQUEAR SALDO DEL USUARIO
                        // -----------------------------------------

                        const [saldos] =
                            await connection.query(
                                `
                                SELECT
                                    UsuarioId,
                                    SaldoDisponible

                                FROM Saldo

                                WHERE UsuarioId = ?

                                FOR UPDATE
                                `,
                                [
                                    apuesta
                                        .ClienteUsuarioId
                                ]
                            )


                        if (
                            saldos.length === 0
                        ) {
                            throw new Error(
                                `No existe saldo para el usuario ${apuesta.ClienteUsuarioId}`
                            )
                        }


                        // -----------------------------------------
                        // ACREDITAR PREMIO
                        // -----------------------------------------

                        await connection.query(
                            `
                            UPDATE Saldo

                            SET
                                SaldoDisponible =
                                    SaldoDisponible + ?,

                                FechaActualizacion =
                                    CURRENT_TIMESTAMP(6)

                            WHERE UsuarioId = ?
                            `,
                            [
                                premio,

                                apuesta
                                    .ClienteUsuarioId
                            ]
                        )


                        // -----------------------------------------
                        // MOVIMIENTO DE PREMIO
                        // TipoMovimientoSaldoId = 2
                        // -----------------------------------------

                        await connection.query(
                            `
                            INSERT INTO MovimientoSaldo
                            (
                                UsuarioId,
                                TipoMovimientoSaldoId,
                                PagoId,
                                ApuestaId,
                                Monto,
                                Descripcion
                            )
                            VALUES
                            (
                                ?,
                                2,
                                NULL,
                                ?,
                                ?,
                                ?
                            )
                            `,
                            [
                                apuesta
                                    .ClienteUsuarioId,

                                apuestaId,

                                premio,

                                `Premio apuesta ${apuesta.CodigoApuesta}`
                            ]
                        )


                        premioAcreditado =
                            premio
                    }
                }


                // =================================================
                // NOMBRE DEL ESTADO
                // =================================================

                let nombreEstado =
                    'PENDIENTE'


                if (estadoFinal === 2) {
                    nombreEstado =
                        'GANADA'
                }

                else if (
                    estadoFinal === 3
                ) {
                    nombreEstado =
                        'PERDIDA'
                }

                else if (
                    estadoFinal === 4
                ) {
                    nombreEstado =
                        'ANULADA'
                }


                liquidaciones.push({

                    apuestaId,

                    codigoApuesta:
                        apuesta.CodigoApuesta,

                    estadoApuestaId:
                        estadoFinal,

                    estado:
                        nombreEstado,

                    premio:

                        Number(
                            premio.toFixed(2)
                        ),

                    premioAcreditado:

                        Number(
                            premioAcreditado
                                .toFixed(2)
                        )
                })
            }


            // =================================================
            // 8. CONFIRMAR TRANSACCIÓN
            // =================================================

            await connection.commit()


            return res.status(200).json({

                success: true,

                message:
                    'Apuestas liquidadas correctamente',

                datos: {

                    partidoId,

                    marcador: {
                        golesLocal,
                        golesVisitante
                    },

                    detallesActualizados,

                    apuestasAfectadas:
                        liquidaciones.length,

                    liquidaciones
                }
            })


        } catch (error) {

            if (connection) {

                try {
                    await connection.rollback()
                } catch (
                    rollbackError
                ) {
                    console.error(
                        'Error haciendo rollback:',
                        rollbackError
                    )
                }
            }


            console.error(
                'Error liquidando apuestas:',
                error
            )


            return res.status(500).json({
                success: false,
                message:
                    'Error interno liquidando las apuestas'
            })


        } finally {

            if (connection) {
                connection.release()
            }
        }
    }
)

// ============================================================
// ESTADO DE LIQUIDACIÓN DE UN PARTIDO
// ============================================================

router.get(
    '/apuestas/estado-liquidacion/:partidoId',
    verificarToken,
    autorizarRoles(1, 2),
    async (req, res) => {

        const partidoId =
            Number(req.params.partidoId)


        // =====================================================
        // VALIDAR PARTIDO ID
        // =====================================================

        if (
            !Number.isInteger(partidoId) ||
            partidoId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'PartidoId no válido'
            })
        }


        try {

            // =================================================
            // 1. CONSULTAR PARTIDO Y SUS PartidoRegla EN POSTGRES
            // =================================================

            const partidoResult =
                await postgresPool.query(
                    `
                    SELECT
                        p.PartidoId,
                        p.EstadoPartidoId,
                        pr.PartidoReglaId

                    FROM Partido p

                    LEFT JOIN PartidoRegla pr
                        ON pr.PartidoId =
                           p.PartidoId

                    WHERE p.PartidoId = $1

                    ORDER BY pr.PartidoReglaId
                    `,
                    [partidoId]
                )


            if (
                partidoResult.rows.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        'El partido no existe'
                })
            }


            const estadoPartidoId =
                Number(
                    partidoResult.rows[0]
                        .estadopartidoid
                )


            // =================================================
            // SI NO ESTÁ FINALIZADO
            // =================================================

            if (
                estadoPartidoId !== 3
            ) {
                return res.status(200).json({
                    success: true,

                    datos: {
                        partidoId,
                        estadoPartidoId,
                        estadoLiquidacion:
                            'NO_FINALIZADO',
                        totalDetalles: 0,
                        pendientes: 0,
                        puedeLiquidar: false
                    }
                })
            }


            // =================================================
            // 2. OBTENER PartidoReglaId
            // =================================================

            const partidoReglaIds =
                partidoResult.rows
                    .filter(
                        row =>
                            row.partidoreglaid !==
                            null
                    )
                    .map(
                        row =>
                            Number(
                                row.partidoreglaid
                            )
                    )


            if (
                partidoReglaIds.length === 0
            ) {
                return res.status(200).json({
                    success: true,

                    datos: {
                        partidoId,
                        estadoPartidoId,
                        estadoLiquidacion:
                            'SIN_APUESTAS',
                        totalDetalles: 0,
                        pendientes: 0,
                        puedeLiquidar: false
                    }
                })
            }


            // =================================================
            // 3. CREAR PLACEHOLDERS MYSQL
            // =================================================

            const placeholders =
                partidoReglaIds
                    .map(() => '?')
                    .join(', ')


            // =================================================
            // 4. CONSULTAR DETALLES DE APUESTAS
            // =================================================

            const [rows] =
                await mysqlPool.query(
                    `
                    SELECT
                        COUNT(*) AS TotalDetalles,

                        SUM(
                            CASE
                                WHEN EstadoDetalleApuestaId = 1
                                THEN 1
                                ELSE 0
                            END
                        ) AS Pendientes,

                        SUM(
                            CASE
                                WHEN EstadoDetalleApuestaId = 2
                                THEN 1
                                ELSE 0
                            END
                        ) AS Ganadas,

                        SUM(
                            CASE
                                WHEN EstadoDetalleApuestaId = 3
                                THEN 1
                                ELSE 0
                            END
                        ) AS Perdidas,

                        SUM(
                            CASE
                                WHEN EstadoDetalleApuestaId = 4
                                THEN 1
                                ELSE 0
                            END
                        ) AS Anuladas

                    FROM DetalleApuesta

                    WHERE PartidoReglaId IN (
                        ${placeholders}
                    )
                    `,
                    partidoReglaIds
                )


            const resumen =
                rows[0]


            const totalDetalles =
                Number(
                    resumen.TotalDetalles || 0
                )

            const pendientes =
                Number(
                    resumen.Pendientes || 0
                )

            const ganadas =
                Number(
                    resumen.Ganadas || 0
                )

            const perdidas =
                Number(
                    resumen.Perdidas || 0
                )

            const anuladas =
                Number(
                    resumen.Anuladas || 0
                )


            // =================================================
            // 5. DETERMINAR ESTADO
            // =================================================

            let estadoLiquidacion
            let puedeLiquidar


            if (
                totalDetalles === 0
            ) {
                estadoLiquidacion =
                    'SIN_APUESTAS'

                puedeLiquidar =
                    false
            }

            else if (
                pendientes > 0
            ) {
                estadoLiquidacion =
                    'PENDIENTE'

                puedeLiquidar =
                    true
            }

            else {
                estadoLiquidacion =
                    'LIQUIDADO'

                puedeLiquidar =
                    false
            }


            // =================================================
            // RESPUESTA
            // =================================================

            return res.status(200).json({
                success: true,

                datos: {
                    partidoId,
                    estadoPartidoId,
                    estadoLiquidacion,
                    totalDetalles,
                    pendientes,
                    ganadas,
                    perdidas,
                    anuladas,
                    puedeLiquidar
                }
            })


        } catch (error) {

            console.error(
                'Error consultando estado de liquidación:',
                error
            )


            return res.status(500).json({
                success: false,
                message:
                    'Error interno consultando el estado de liquidación'
            })
        }
    }
)

module.exports = router