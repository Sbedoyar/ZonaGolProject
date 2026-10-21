const {
    postgresPool
} = require('../databases/postgresDatabase')

const {
    obtenerPartidosPorRonda
} = require('./apiFootballService')


// ============================================================
// CONFIGURACIÓN
// ============================================================

const PROVEEDOR =
    'API_FOOTBALL'

const TIMEZONE =
    'America/Bogota'


// ============================================================
// CONVERTIR FECHA DE API A HORA COLOMBIA
//
// Partido.FechaHoraInicio es:
// timestamp without time zone
//
// Por eso guardamos explícitamente la hora de Bogotá.
// ============================================================

function convertirFechaABogota(fechaApi) {

    const fecha =
        new Date(fechaApi)

    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {
        throw new Error(
            `Fecha inválida recibida desde API-Football: ${fechaApi}`
        )
    }


    const formatter =
        new Intl.DateTimeFormat(
            'en-CA',
            {
                timeZone:
                    TIMEZONE,

                year:
                    'numeric',

                month:
                    '2-digit',

                day:
                    '2-digit',

                hour:
                    '2-digit',

                minute:
                    '2-digit',

                second:
                    '2-digit',

                hourCycle:
                    'h23'
            }
        )


    const partes =
        formatter.formatToParts(
            fecha
        )


    const obtener =
        tipo =>
            partes.find(
                parte =>
                    parte.type === tipo
            )?.value


    return (
        `${obtener('year')}-` +
        `${obtener('month')}-` +
        `${obtener('day')} ` +
        `${obtener('hour')}:` +
        `${obtener('minute')}:` +
        `${obtener('second')}`
    )
}


// ============================================================
// MAPEAR ESTADO API -> ESTADOPARTIDO ZONAGOL
// ============================================================

function mapearEstadoPartido(
    estadoApi
) {

    const codigo =
        String(
            estadoApi || ''
        )
            .trim()
            .toUpperCase()


    const programados =
        new Set([
            'TBD',
            'NS'
        ])


    const enCurso =
        new Set([
            '1H',
            'HT',
            '2H',
            'ET',
            'BT',
            'P',
            'LIVE'
        ])


    const finalizados =
        new Set([
            'FT',
            'AET',
            'PEN'
        ])


    const suspendidos =
        new Set([
            'SUSP',
            'INT'
        ])


    const cancelados =
        new Set([
            'CANC'
        ])


    if (
        programados.has(
            codigo
        )
    ) {
        return 1
    }


    if (
        enCurso.has(
            codigo
        )
    ) {
        return 2
    }


    if (
        finalizados.has(
            codigo
        )
    ) {
        return 3
    }


    if (
        suspendidos.has(
            codigo
        )
    ) {
        return 4
    }


    if (
        cancelados.has(
            codigo
        )
    ) {
        return 5
    }


    // PST, ABD, AWD, WO, etc.
    // no se fuerzan a un estado incorrecto.
    throw new Error(
        `Estado de API-Football todavía no soportado: ${codigo}`
    )
}


// ============================================================
// BUSCAR TEMPORADA INTERNA
//
// No confiamos en nombres.
// Usamos:
//
// League API ID
//      ↓
// IdentificadorExterno
//      ↓
// LigaId
//      ↓
// Temporada.Anio
// ============================================================

async function obtenerTemporadaInterna(
    client,
    leagueId,
    season
) {

    const result =
        await client.query(
            `
            SELECT
                t.TemporadaId

            FROM IdentificadorExterno ie

            INNER JOIN Temporada t
                ON t.LigaId = ie.LigaId

            WHERE ie.Proveedor = $1
              AND ie.TipoEntidad = 'LIGA'
              AND ie.IdExterno = $2
              AND ie.Estado = TRUE
              AND t.Anio = $3
              AND t.Estado = TRUE
            `,
            [
                PROVEEDOR,
                String(leagueId),
                season
            ]
        )


    if (
        result.rows.length === 0
    ) {
        throw new Error(
            `No existe una temporada ZonaGol para API league=${leagueId}, season=${season}`
        )
    }


    if (
        result.rows.length > 1
    ) {
        throw new Error(
            `Existe más de una temporada para API league=${leagueId}, season=${season}`
        )
    }


    return Number(
        result.rows[0].temporadaid
    )
}


// ============================================================
// BUSCAR EQUIPO POR ID EXTERNO
// ============================================================

async function obtenerEquipoInterno(
    client,
    apiTeamId
) {

    const result =
        await client.query(
            `
            SELECT
                EquipoId

            FROM IdentificadorExterno

            WHERE Proveedor = $1
              AND TipoEntidad = 'EQUIPO'
              AND IdExterno = $2
              AND Estado = TRUE
            `,
            [
                PROVEEDOR,
                String(apiTeamId)
            ]
        )


    if (
        result.rows.length === 0
    ) {
        throw new Error(
            `No existe mapping para API team.id=${apiTeamId}`
        )
    }


    return Number(
        result.rows[0].equipoid
    )
}


// ============================================================
// BUSCAR ESTADIO POR ID EXTERNO
// ============================================================

async function obtenerEstadioInterno(
    client,
    apiVenueId
) {

    if (
        apiVenueId === null ||
        apiVenueId === undefined
    ) {
        throw new Error(
            'El partido recibido no tiene venue.id'
        )
    }


    const result =
        await client.query(
            `
            SELECT
                EstadioId

            FROM IdentificadorExterno

            WHERE Proveedor = $1
              AND TipoEntidad = 'ESTADIO'
              AND IdExterno = $2
              AND Estado = TRUE
            `,
            [
                PROVEEDOR,
                String(apiVenueId)
            ]
        )


    if (
        result.rows.length === 0
    ) {
        throw new Error(
            `No existe mapping para API venue.id=${apiVenueId}`
        )
    }


    return Number(
        result.rows[0].estadioid
    )
}


// ============================================================
// CREAR / ACTUALIZAR CALENDARIO
// ============================================================

// ============================================================
// CREAR / ACTUALIZAR CALENDARIO
//
// CodigoCalendario es una columna GENERATED ALWAYS
// en PostgreSQL, por lo tanto NO se inserta ni actualiza.
// ============================================================

async function sincronizarCalendario(
    client,
    {
        temporadaId,
        numeroJornada,
        partidos
    }
) {

    const fechas =
        partidos.map(
            partido =>
                convertirFechaABogota(
                    partido.fixture.date
                )
        )


    const fechasSoloDia =
        fechas.map(
            fecha =>
                fecha.substring(
                    0,
                    10
                )
        )


    const fechasOrdenadas =
        fechasSoloDia
            .slice()
            .sort()


    const fechaInicio =
        fechasOrdenadas[0]


    const fechaFin =
        fechasOrdenadas[
            fechasOrdenadas.length - 1
        ]


    await client.query(
        `
        INSERT INTO Calendario (
            TemporadaId,
            NumeroJornada,
            FechaInicio,
            FechaFin,
            Estado
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            TRUE
        )

        ON CONFLICT (
            TemporadaId,
            NumeroJornada
        )
        DO UPDATE SET
            FechaInicio =
                EXCLUDED.FechaInicio,

            FechaFin =
                EXCLUDED.FechaFin,

            Estado =
                TRUE
        `,
        [
            temporadaId,
            numeroJornada,
            fechaInicio,
            fechaFin
        ]
    )
}

// ============================================================
// SINCRONIZAR UNA RONDA
// ============================================================

async function sincronizarRonda({
    leagueId,
    season,
    round,
    numeroJornada
}) {

    if (
        !Number.isInteger(
            Number(leagueId)
        ) ||
        !Number.isInteger(
            Number(season)
        ) ||
        !Number.isInteger(
            Number(numeroJornada)
        ) ||
        Number(numeroJornada) <= 0 ||
        !round
    ) {
        throw new Error(
            'Parámetros de sincronización inválidos'
        )
    }


    // ========================================================
    // 1. CONSULTAR API
    // ========================================================

    const partidos =
        await obtenerPartidosPorRonda({
            leagueId,
            season,
            round,
            timezone:
                TIMEZONE
        })


    if (
        !Array.isArray(partidos) ||
        partidos.length === 0
    ) {
        throw new Error(
            `API-Football no devolvió partidos para ${round}`
        )
    }


    // ========================================================
    // 2. INICIAR TRANSACCIÓN POSTGRESQL
    // ========================================================

    const client =
        await postgresPool.connect()


    let insertados =
        0

    let actualizados =
        0


    try {

        await client.query(
            'BEGIN'
        )


        const temporadaId =
            await obtenerTemporadaInterna(
                client,
                leagueId,
                season
            )


        // ====================================================
        // 3. CALENDARIO
        // ====================================================

        await sincronizarCalendario(
            client,
            {
                temporadaId,
                numeroJornada:
                    Number(numeroJornada),

                partidos
            }
        )


        // ====================================================
        // 4. BLOQUEO PARA GENERAR PARTIDOID MANUALMENTE
        //
        // PartidoId no usa secuencia.
        // ====================================================

        await client.query(
            `
            LOCK TABLE Partido
            IN SHARE ROW EXCLUSIVE MODE
            `
        )


        const maxResult =
            await client.query(
                `
                SELECT
                    COALESCE(
                        MAX(PartidoId),
                        0
                    ) AS max_partidoid

                FROM Partido
                `
            )


        let siguientePartidoId =
            Number(
                maxResult.rows[0]
                    .max_partidoid
            ) + 1


        // ====================================================
        // 5. RECORRER FIXTURES
        // ====================================================

        for (
            const partidoApi
            of partidos
        ) {

            const fixtureId =
                partidoApi.fixture?.id


            if (
                fixtureId === null ||
                fixtureId === undefined
            ) {
                throw new Error(
                    'API-Football devolvió un fixture sin fixture.id'
                )
            }


            const equipoLocalId =
                await obtenerEquipoInterno(
                    client,
                    partidoApi.teams?.home?.id
                )


            const equipoVisitanteId =
                await obtenerEquipoInterno(
                    client,
                    partidoApi.teams?.away?.id
                )


            const estadioId =
                await obtenerEstadioInterno(
                    client,
                    partidoApi.fixture
                        ?.venue
                        ?.id
                )


            const estadoPartidoId =
                mapearEstadoPartido(
                    partidoApi.fixture
                        ?.status
                        ?.short
                )


            const fechaHoraInicio =
                convertirFechaABogota(
                    partidoApi.fixture.date
                )


            const golesLocal =
                partidoApi.goals?.home ??
                null


            const golesVisitante =
                partidoApi.goals?.away ??
                null


            // =================================================
            // 6. ¿YA EXISTE ESTE FIXTURE?
            // =================================================

            const mappingResult =
                await client.query(
                    `
                    SELECT
                        PartidoId

                    FROM IdentificadorExterno

                    WHERE Proveedor = $1
                      AND TipoEntidad = 'PARTIDO'
                      AND IdExterno = $2
                      AND Estado = TRUE

                    FOR UPDATE
                    `,
                    [
                        PROVEEDOR,
                        String(fixtureId)
                    ]
                )


            // =================================================
            // 7A. EXISTE -> UPDATE
            // =================================================

            if (
                mappingResult.rows.length > 0
            ) {

                const partidoId =
                    Number(
                        mappingResult
                            .rows[0]
                            .partidoid
                    )


                await client.query(
                    `
                    UPDATE Partido

                    SET
                        TemporadaId = $1,
                        NumeroJornada = $2,
                        EquipoLocalId = $3,
                        EquipoVisitanteId = $4,
                        EstadioId = $5,
                        EstadoPartidoId = $6,
                        FechaHoraInicio = $7,
                        GolesLocal = $8,
                        GolesVisitante = $9

                    WHERE PartidoId = $10
                    `,
                    [
                        temporadaId,
                        Number(numeroJornada),
                        equipoLocalId,
                        equipoVisitanteId,
                        estadioId,
                        estadoPartidoId,
                        fechaHoraInicio,
                        golesLocal,
                        golesVisitante,
                        partidoId
                    ]
                )


                actualizados +=
                    1


                continue
            }


            // =================================================
            // 7B. NO EXISTE -> INSERT
            // =================================================

            const nuevoPartidoId =
                siguientePartidoId


            siguientePartidoId +=
                1


            await client.query(
                `
                INSERT INTO Partido (
                    PartidoId,
                    TemporadaId,
                    NumeroJornada,
                    EquipoLocalId,
                    EquipoVisitanteId,
                    EstadioId,
                    EstadoPartidoId,
                    FechaHoraInicio,
                    GolesLocal,
                    GolesVisitante
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9,
                    $10
                )
                `,
                [
                    nuevoPartidoId,
                    temporadaId,
                    Number(numeroJornada),
                    equipoLocalId,
                    equipoVisitanteId,
                    estadioId,
                    estadoPartidoId,
                    fechaHoraInicio,
                    golesLocal,
                    golesVisitante
                ]
            )


            await client.query(
                `
                INSERT INTO IdentificadorExterno (
                    Proveedor,
                    TipoEntidad,
                    IdExterno,
                    PartidoId
                )
                VALUES (
                    $1,
                    'PARTIDO',
                    $2,
                    $3
                )
                `,
                [
                    PROVEEDOR,
                    String(fixtureId),
                    nuevoPartidoId
                ]
            )


            insertados +=
                1
        }


        // ====================================================
        // 8. COMMIT
        // ====================================================

        await client.query(
            'COMMIT'
        )


        return {
            leagueId:
                Number(leagueId),

            season:
                Number(season),

            round,

            temporadaId,

            numeroJornada:
                Number(numeroJornada),

            recibidos:
                partidos.length,

            insertados,

            actualizados
        }


    } catch (error) {

        await client.query(
            'ROLLBACK'
        )


        throw error


    } finally {

        client.release()
    }
}


// ============================================================
// EXPORTACIONES
// ============================================================

module.exports = {
    sincronizarRonda,
    convertirFechaABogota,
    mapearEstadoPartido
}