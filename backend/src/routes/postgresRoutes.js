const express = require('express')
const { verificarToken } = require('../middlewares/authMiddleware')

const {
    autorizarRoles
} = require('../middlewares/roleMiddleware')

const {
    postgresPool
} = require('../databases/postgresDatabase')


const router = express.Router()


// ============================================================
// PRUEBA DE CONEXIÓN POSTGRESQL
// ============================================================

router.get('/prueba', async (req, res) => {

    try {

        const result =
            await postgresPool.query(`
                SELECT
                    current_database() AS base_datos,
                    current_user AS usuario,
                    NOW() AS fecha_actual
            `)


        return res.status(200).json({
            success: true,

            message:
                'PostgreSQL conectado correctamente',

            datos:
                result.rows[0]
        })

    } catch (error) {

        console.error(
            'Error PostgreSQL:',
            error
        )


        return res.status(500).json({
            success: false,

            message:
                'Error consultando PostgreSQL'
        })
    }
})


// ============================================================
// CONSULTAR DEPORTES
// PostgreSQL -> tabla Deporte
// ============================================================

router.get('/deportes', async (req, res) => {

    try {

        const result =
            await postgresPool.query(`
                SELECT *
                FROM Deporte
                ORDER BY DeporteId ASC
            `)


        return res.status(200).json({
            success: true,

            cantidad:
                result.rows.length,

            datos:
                result.rows
        })

    } catch (error) {

        console.error(
            'Error consultando deportes:',
            error
        )


        return res.status(500).json({
            success: false,

            message:
                'Error consultando los deportes'
        })
    }
})

router.get('/partidos/:partidoId', async (req, res) => {
    const partidoId = Number(req.params.partidoId)

    if (!Number.isInteger(partidoId) || partidoId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'El PartidoId no es válido'
        })
    }

    try {
        // =====================================================
        // 1. CONSULTAR INFORMACIÓN GENERAL DEL PARTIDO
        // =====================================================
        const partidoResult = await postgresPool.query(
            `
            SELECT
                p.PartidoId,
                p.CodigoPartido,
                p.TemporadaId,
                p.NumeroJornada,

                p.EquipoLocalId,
                local.Nombre AS EquipoLocal,
                local.NombreCorto AS NombreCortoLocal,
                local.Sigla AS SiglaLocal,

                p.EquipoVisitanteId,
                visitante.Nombre AS EquipoVisitante,
                visitante.NombreCorto AS NombreCortoVisitante,
                visitante.Sigla AS SiglaVisitante,

                p.EstadioId,
                estadio.Nombre AS Estadio,

                p.EstadoPartidoId,
                estado.Nombre AS EstadoPartido,

                p.FechaHoraInicio,
                p.GolesLocal,
                p.GolesVisitante

            FROM Partido p

            INNER JOIN Equipo local
                ON local.EquipoId = p.EquipoLocalId

            INNER JOIN Equipo visitante
                ON visitante.EquipoId = p.EquipoVisitanteId

            INNER JOIN Estadio estadio
                ON estadio.EstadioId = p.EstadioId

            INNER JOIN EstadoPartido estado
                ON estado.EstadoPartidoId = p.EstadoPartidoId

            WHERE p.PartidoId = $1
            `,
            [partidoId]
        )

        if (partidoResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Partido no encontrado'
            })
        }

        // =====================================================
        // 2. CONSULTAR OPCIONES DE APUESTA DEL PARTIDO
        // =====================================================
        const opcionesResult = await postgresPool.query(
            `
            SELECT
                pr.PartidoReglaId,
                pr.ReglaId,
                r.Nombre AS OpcionApuesta,
                r.TipoRegla,
                r.Descripcion,
                pr.Cuota,
                pr.Estado

            FROM PartidoRegla pr

            INNER JOIN Regla r
                ON r.ReglaId = pr.ReglaId

            WHERE pr.PartidoId = $1
              AND pr.Estado = TRUE
              AND r.Estado = TRUE

            ORDER BY
                r.TipoRegla,
                r.ReglaId
            `,
            [partidoId]
        )

        const partido = partidoResult.rows[0]

        partido.opcionesApuesta = opcionesResult.rows.map(opcion => ({
            ...opcion,
            cuota: Number(opcion.cuota)
        }))

        return res.status(200).json({
            success: true,
            datos: partido
        })

    } catch (error) {
        console.error('Error consultando partido:', error)

        return res.status(500).json({
            success: false,
            message: 'Error interno consultando el partido'
        })
    }
})

router.get('/partidos', async (req, res) => {
    const jornada = req.query.jornada
        ? Number(req.query.jornada)
        : null

    if (
        jornada !== null &&
        (!Number.isInteger(jornada) || jornada <= 0)
    ) {
        return res.status(400).json({
            success: false,
            message: 'La jornada no es válida'
        })
    }

    try {
        let consulta = `
            SELECT
                p.PartidoId,
                p.CodigoPartido,
                p.TemporadaId,
                p.NumeroJornada,

                p.EquipoLocalId,
                local.Nombre AS EquipoLocal,
                local.NombreCorto AS NombreCortoLocal,
                local.Sigla AS SiglaLocal,

                p.EquipoVisitanteId,
                visitante.Nombre AS EquipoVisitante,
                visitante.NombreCorto AS NombreCortoVisitante,
                visitante.Sigla AS SiglaVisitante,

                p.EstadioId,
                estadio.Nombre AS Estadio,

                p.EstadoPartidoId,
                estado.Nombre AS EstadoPartido,

                p.FechaHoraInicio,
                p.GolesLocal,
                p.GolesVisitante

            FROM Partido p

            INNER JOIN Equipo local
                ON local.EquipoId = p.EquipoLocalId

            INNER JOIN Equipo visitante
                ON visitante.EquipoId = p.EquipoVisitanteId

            INNER JOIN Estadio estadio
                ON estadio.EstadioId = p.EstadioId

            INNER JOIN EstadoPartido estado
                ON estado.EstadoPartidoId = p.EstadoPartidoId

            WHERE p.TemporadaId = 1
        `

        const parametros = []

        if (jornada !== null) {
            parametros.push(jornada)

            consulta += `
                AND p.NumeroJornada = $1
            `
        }

        consulta += `
            ORDER BY
                p.NumeroJornada ASC,
                p.FechaHoraInicio ASC
        `

        const result = await postgresPool.query(
            consulta,
            parametros
        )

        return res.status(200).json({
            success: true,
            cantidad: result.rows.length,
            datos: result.rows
        })

    } catch (error) {
        console.error('Error consultando partidos:', error)

        return res.status(500).json({
            success: false,
            message: 'Error interno consultando los partidos'
        })
    }
})

// ============================================================
// FINALIZAR PARTIDO
// ============================================================

router.post(
    '/partidos/:partidoId/finalizar',
    verificarToken,
    autorizarRoles(1, 2),
    async (req, res) => {

        const partidoId =
            Number(req.params.partidoId)

        const golesLocal =
            Number(req.body.golesLocal)

        const golesVisitante =
            Number(req.body.golesVisitante)


        // =====================================================
        // VALIDACIONES
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


        if (
            !Number.isInteger(golesLocal) ||
            golesLocal < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Los goles del equipo local no son válidos'
            })
        }


        if (
            !Number.isInteger(golesVisitante) ||
            golesVisitante < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Los goles del equipo visitante no son válidos'
            })
        }


        try {

            // =================================================
            // BUSCAR PARTIDO ACTUAL
            // =================================================

            const partidoResult =
                await postgresPool.query(
                    `
                    SELECT
                        p.PartidoId,
                        p.CodigoPartido,
                        p.EstadoPartidoId,

                        local.Nombre
                            AS EquipoLocal,

                        visitante.Nombre
                            AS EquipoVisitante

                    FROM Partido p

                    INNER JOIN Equipo local
                        ON local.EquipoId =
                           p.EquipoLocalId

                    INNER JOIN Equipo visitante
                        ON visitante.EquipoId =
                           p.EquipoVisitanteId

                    WHERE p.PartidoId = $1
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


            // =================================================
            // EVITAR FINALIZAR DOS VECES
            // =================================================

            if (
                Number(
                    partido.estadopartidoid
                ) === 3
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        'El partido ya está finalizado'
                })
            }


            // =================================================
            // NO FINALIZAR CANCELADOS
            // =================================================

            if (
                Number(
                    partido.estadopartidoid
                ) === 5
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        'No se puede finalizar un partido cancelado'
                })
            }


            // =================================================
            // ACTUALIZAR MARCADOR Y ESTADO
            // =================================================

            const updateResult =
                await postgresPool.query(
                    `
                    UPDATE Partido

                    SET
                        GolesLocal = $1,
                        GolesVisitante = $2,
                        EstadoPartidoId = 3

                    WHERE PartidoId = $3

                    RETURNING
                        PartidoId,
                        CodigoPartido,
                        EstadoPartidoId,
                        GolesLocal,
                        GolesVisitante
                    `,
                    [
                        golesLocal,
                        golesVisitante,
                        partidoId
                    ]
                )


            // =================================================
            // CERRAR MERCADOS DEL PARTIDO
            // =================================================

            await postgresPool.query(
                `
                UPDATE PartidoRegla

                SET Estado = FALSE

                WHERE PartidoId = $1
                `,
                [partidoId]
            )


            const actualizado =
                updateResult.rows[0]


            return res.status(200).json({

                success: true,

                message:
                    'Partido finalizado correctamente',

                datos: {

                    partidoId:
                        actualizado.partidoid,

                    codigoPartido:
                        actualizado.codigopartido,

                    equipoLocal:
                        partido.equipolocal,

                    equipoVisitante:
                        partido.equipovisitante,

                    golesLocal:
                        Number(
                            actualizado.goleslocal
                        ),

                    golesVisitante:
                        Number(
                            actualizado.golesvisitante
                        ),

                    estadoPartidoId:
                        Number(
                            actualizado.estadopartidoid
                        ),

                    estado:
                        'FINALIZADO'
                }
            })


        } catch (error) {

            console.error(
                'Error finalizando partido:',
                error
            )


            return res.status(500).json({
                success: false,
                message:
                    'Error interno finalizando el partido'
            })
        }
    }
)

// ============================================================
// EVALUAR REGLAS DE UN PARTIDO FINALIZADO
// ============================================================

router.get(
    '/partidos/:partidoId/evaluar-reglas',
    verificarToken,
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


        try {

            // =================================================
            // 1. CONSULTAR PARTIDO
            // =================================================

            const partidoResult =
                await postgresPool.query(
                    `
                    SELECT
                        p.PartidoId,
                        p.CodigoPartido,
                        p.EstadoPartidoId,
                        p.GolesLocal,
                        p.GolesVisitante,

                        local.Nombre
                            AS EquipoLocal,

                        visitante.Nombre
                            AS EquipoVisitante

                    FROM Partido p

                    INNER JOIN Equipo local
                        ON local.EquipoId =
                           p.EquipoLocalId

                    INNER JOIN Equipo visitante
                        ON visitante.EquipoId =
                           p.EquipoVisitanteId

                    WHERE p.PartidoId = $1
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


            // =================================================
            // 2. SOLO EVALUAR PARTIDOS FINALIZADOS
            // =================================================

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
            // 3. CONSULTAR REGLAS DEL PARTIDO
            // =================================================

            const reglasResult =
                await postgresPool.query(
                    `
                    SELECT
                        pr.PartidoReglaId,
                        pr.ReglaId,
                        pr.Cuota,

                        r.Nombre,
                        r.TipoRegla

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
            // 4. CONSULTAR CONFIGURACIONES
            // =================================================

            const configuracionesResult =
                await postgresPool.query(
                    `
                    SELECT
                        ReglaId,
                        Parametro,
                        Valor,
                        Unidad

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
            // 5. EVALUAR CADA REGLA
            // =================================================

            const resultados = []


            for (
                const regla
                of reglasResult.rows
            ) {

                const reglaId =
                    Number(
                        regla.reglaid
                    )


                let ganada = false


                // ---------------------------------------------
                // REGLA 1
                // GANADOR LOCAL
                // ---------------------------------------------

                if (reglaId === 1) {

                    ganada =
                        golesLocal >
                        golesVisitante
                }


                // ---------------------------------------------
                // REGLA 2
                // EMPATE
                // ---------------------------------------------

                else if (reglaId === 2) {

                    ganada =
                        golesLocal ===
                        golesVisitante
                }


                // ---------------------------------------------
                // REGLA 3
                // GANADOR VISITANTE
                // ---------------------------------------------

                else if (reglaId === 3) {

                    ganada =
                        golesVisitante >
                        golesLocal
                }


                // ---------------------------------------------
                // REGLA 4
                // MÁS DE 2.5 GOLES
                // ---------------------------------------------

                else if (reglaId === 4) {

                    const config =
                        configuraciones.get(
                            reglaId
                        )


                    const linea =
                        Number(
                            config
                                ?.LINEA_GOLES
                        )


                    ganada =
                        golesTotales >
                        linea
                }


                // ---------------------------------------------
                // REGLA 5
                // MENOS DE 2.5 GOLES
                // ---------------------------------------------

                else if (reglaId === 5) {

                    const config =
                        configuraciones.get(
                            reglaId
                        )


                    const linea =
                        Number(
                            config
                                ?.LINEA_GOLES
                        )


                    ganada =
                        golesTotales <
                        linea
                }


                // ---------------------------------------------
                // REGLA 6
                // AMBOS MARCAN - SÍ
                // ---------------------------------------------

                else if (reglaId === 6) {

                    ganada =
                        golesLocal > 0 &&
                        golesVisitante > 0
                }


                // ---------------------------------------------
                // REGLA 7
                // AMBOS MARCAN - NO
                // ---------------------------------------------

                else if (reglaId === 7) {

                    ganada =
                        golesLocal === 0 ||
                        golesVisitante === 0
                }


                // ---------------------------------------------
                // RESULTADO
                // ---------------------------------------------

                resultados.push({

                    partidoReglaId:
                        Number(
                            regla.partidoreglaid
                        ),

                    reglaId,

                    nombre:
                        regla.nombre,

                    tipoRegla:
                        regla.tiporegla,

                    cuota:
                        Number(
                            regla.cuota
                        ),

                    resultado:
                        ganada
                            ? 'GANADA'
                            : 'PERDIDA'
                })
            }


            // =================================================
            // RESPUESTA
            // =================================================

            return res.status(200).json({

                success: true,

                datos: {

                    partidoId:
                        Number(
                            partido.partidoid
                        ),

                    codigoPartido:
                        partido.codigopartido,

                    equipoLocal:
                        partido.equipolocal,

                    equipoVisitante:
                        partido.equipovisitante,

                    golesLocal,

                    golesVisitante,

                    golesTotales,

                    reglas:
                        resultados
                }
            })


        } catch (error) {

            console.error(
                'Error evaluando reglas:',
                error
            )


            return res.status(500).json({
                success: false,
                message:
                    'Error interno evaluando las reglas del partido'
            })
        }
    }
)

module.exports = router