const {
    postgresPool
} = require('../databases/postgresDatabase')

const {
    obtenerEquiposTemporada
} = require('./apiFootballService')


// ============================================================
// CONFIGURACIÓN
// ============================================================

const PROVEEDOR =
    'API_FOOTBALL'


// ============================================================
// NORMALIZAR TEXTO
//
// Solo se utiliza para intentar reutilizar registros internos
// cuando todavía no existe un mapping externo.
//
// El ID externo sigue siendo la identidad permanente.
// ============================================================

function normalizarTexto(valor) {

    return String(valor || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}


function normalizarNombreEquipo(
    valor
) {

    return normalizarTexto(valor)
        .replace(
            /\b(fc|f c|daf)\b/g,
            ''
        )
        .replace(/\s+/g, ' ')
        .trim()
}


// ============================================================
// OBTENER LIGA INTERNA DESDE API ID
// ============================================================

async function obtenerLigaInterna(
    client,
    leagueId
) {

    const result =
        await client.query(
            `
            SELECT
                LigaId

            FROM IdentificadorExterno

            WHERE Proveedor = $1
              AND TipoEntidad = 'LIGA'
              AND IdExterno = $2
              AND Estado = TRUE
            `,
            [
                PROVEEDOR,
                String(leagueId)
            ]
        )


    if (
        result.rows.length === 0
    ) {
        throw new Error(
            `No existe mapping de liga para API league.id=${leagueId}`
        )
    }


    if (
        result.rows.length > 1
    ) {
        throw new Error(
            `Existe más de un mapping para API league.id=${leagueId}`
        )
    }


    return Number(
        result.rows[0].ligaid
    )
}


// ============================================================
// BUSCAR MAPPING DE EQUIPO
// ============================================================

async function buscarEquipoMapeado(
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
        return null
    }


    return Number(
        result.rows[0].equipoid
    )
}


// ============================================================
// BUSCAR MAPPING DE ESTADIO
// ============================================================

async function buscarEstadioMapeado(
    client,
    apiVenueId
) {

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
        return null
    }


    return Number(
        result.rows[0].estadioid
    )
}


// ============================================================
// BUSCAR ESTADIO INTERNO POR NOMBRE
//
// Esto solamente se utiliza cuando todavía no existe mapping.
//
// Evita crear, por ejemplo:
//
// Estadio Atanasio Girardot
// y
// otro Atanasio Girardot duplicado.
//
// Una vez creado el mapping, el nombre deja de ser relevante
// para identificarlo.
// ============================================================

async function buscarEstadioExistente(
    client,
    venueApi
) {

    const result =
        await client.query(
            `
            SELECT
                EstadioId,
                Nombre,
                Ciudad

            FROM Estadio

            WHERE Estado = TRUE
            `
        )


    const nombreApi =
        normalizarTexto(
            venueApi.name
        )


    const ciudadApi =
        normalizarTexto(
            venueApi.city
        )


    const coincidencias =
        result.rows.filter(
            row => {

                const mismoNombre =
                    normalizarTexto(
                        row.nombre
                    ) === nombreApi


                if (!mismoNombre) {
                    return false
                }


                // Si alguna ciudad falta,
                // el nombre exacto normalizado basta.
                if (
                    !ciudadApi ||
                    !row.ciudad
                ) {
                    return true
                }


                return (
                    normalizarTexto(
                        row.ciudad
                    ) === ciudadApi
                )
            }
        )


    if (
        coincidencias.length === 1
    ) {
        return Number(
            coincidencias[0]
                .estadioid
        )
    }


    if (
        coincidencias.length > 1
    ) {
        throw new Error(
            `Más de un estadio interno coincide con "${venueApi.name}"`
        )
    }


    return null
}


// ============================================================
// BUSCAR EQUIPO INTERNO POR NOMBRE / NOMBRE CORTO / SIGLA
//
// Solo se usa si todavía no existe mapping externo.
// ============================================================

async function buscarEquipoExistente(
    client,
    ligaId,
    teamApi
) {

    const result =
        await client.query(
            `
            SELECT
                EquipoId,
                Nombre,
                NombreCorto,
                Sigla

            FROM Equipo

            WHERE LigaId = $1
              AND Estado = TRUE
            `,
            [
                ligaId
            ]
        )


    const nombreApi =
        normalizarNombreEquipo(
            teamApi.name
        )


    let coincidencias =
        result.rows.filter(
            row => {

                const nombre =
                    normalizarNombreEquipo(
                        row.nombre
                    )


                const nombreCorto =
                    normalizarNombreEquipo(
                        row.nombrecorto
                    )


                return (
                    nombre === nombreApi ||
                    nombreCorto === nombreApi
                )
            }
        )


    if (
        coincidencias.length === 1
    ) {
        return Number(
            coincidencias[0]
                .equipoid
        )
    }


    if (
        coincidencias.length > 1
    ) {
        throw new Error(
            `Más de un equipo interno coincide con "${teamApi.name}"`
        )
    }


    // Segunda comprobación:
    // sigla exacta y única.
    if (teamApi.code) {

        const codigoApi =
            String(
                teamApi.code
            )
                .trim()
                .toUpperCase()


        coincidencias =
            result.rows.filter(
                row =>
                    row.sigla &&
                    String(row.sigla)
                        .trim()
                        .toUpperCase() ===
                        codigoApi
            )


        if (
            coincidencias.length === 1
        ) {
            return Number(
                coincidencias[0]
                    .equipoid
            )
        }


        if (
            coincidencias.length > 1
        ) {
            throw new Error(
                `Más de un equipo interno utiliza la sigla "${teamApi.code}"`
            )
        }
    }


    return null
}


// ============================================================
// ENRIQUECER ESTADIO EXISTENTE
//
// No sobrescribimos información interna ya existente.
//
// Solo llenamos Dirección o Capacidad si actualmente están NULL.
// ============================================================

async function enriquecerEstadio(
    client,
    estadioId,
    venueApi
) {

    await client.query(
        `
        UPDATE Estadio

        SET
            Direccion =
                COALESCE(
                    Direccion,
                    $1
                ),

            Capacidad =
                COALESCE(
                    Capacidad,
                    $2
                )

        WHERE EstadioId = $3
        `,
        [
            venueApi.address ||
                null,

            venueApi.capacity ??
                null,

            estadioId
        ]
    )
}


// ============================================================
// INSERTAR MAPPING
// ============================================================

async function insertarMappingEquipo(
    client,
    apiTeamId,
    equipoId
) {

    await client.query(
        `
        INSERT INTO IdentificadorExterno (
            Proveedor,
            TipoEntidad,
            IdExterno,
            EquipoId
        )
        VALUES (
            $1,
            'EQUIPO',
            $2,
            $3
        )
        `,
        [
            PROVEEDOR,
            String(apiTeamId),
            equipoId
        ]
    )
}


async function insertarMappingEstadio(
    client,
    apiVenueId,
    estadioId
) {

    await client.query(
        `
        INSERT INTO IdentificadorExterno (
            Proveedor,
            TipoEntidad,
            IdExterno,
            EstadioId
        )
        VALUES (
            $1,
            'ESTADIO',
            $2,
            $3
        )
        `,
        [
            PROVEEDOR,
            String(apiVenueId),
            estadioId
        ]
    )
}


// ============================================================
// SINCRONIZAR MAESTROS DE UNA TEMPORADA
// ============================================================

async function sincronizarMaestrosTemporada({
    leagueId,
    season
}) {

    if (
        !Number.isInteger(
            Number(leagueId)
        ) ||
        !Number.isInteger(
            Number(season)
        )
    ) {
        throw new Error(
            'LeagueId o season inválidos'
        )
    }


    // ========================================================
    // 1. API-FOOTBALL
    // ========================================================

    const respuestaEquipos =
        await obtenerEquiposTemporada({
            leagueId,
            season
        })


    if (
        !Array.isArray(
            respuestaEquipos
        ) ||
        respuestaEquipos.length === 0
    ) {
        throw new Error(
            `API-Football no devolvió equipos para league=${leagueId}, season=${season}`
        )
    }


    // ========================================================
    // EXTRAER ESTADIOS ÚNICOS
    // ========================================================

    const estadiosApi =
        new Map()


    for (
        const item
        of respuestaEquipos
    ) {

        const venue =
            item.venue


        if (
            venue?.id !== null &&
            venue?.id !== undefined
        ) {

            estadiosApi.set(
                String(venue.id),
                venue
            )
        }
    }


    // ========================================================
    // 2. TRANSACCIÓN
    // ========================================================

    const client =
        await postgresPool.connect()


    let equiposInsertados =
        0

    let equiposReutilizados =
        0

    let estadiosInsertados =
        0

    let estadiosReutilizados =
        0


    try {

        await client.query(
            'BEGIN'
        )


        const ligaId =
            await obtenerLigaInterna(
                client,
                leagueId
            )


        // ====================================================
        // BLOQUEAR TABLAS PORQUE LOS IDs SON MANUALES
        // ====================================================

        await client.query(
            `
            LOCK TABLE Equipo
            IN SHARE ROW EXCLUSIVE MODE
            `
        )


        await client.query(
            `
            LOCK TABLE Estadio
            IN SHARE ROW EXCLUSIVE MODE
            `
        )


        // ====================================================
        // SIGUIENTES IDs INTERNOS
        // ====================================================

        const maxEquipo =
            await client.query(
                `
                SELECT
                    COALESCE(
                        MAX(EquipoId),
                        0
                    ) AS max_id

                FROM Equipo
                `
            )


        let siguienteEquipoId =
            Number(
                maxEquipo
                    .rows[0]
                    .max_id
            ) + 1


        const maxEstadio =
            await client.query(
                `
                SELECT
                    COALESCE(
                        MAX(EstadioId),
                        0
                    ) AS max_id

                FROM Estadio
                `
            )


        let siguienteEstadioId =
            Number(
                maxEstadio
                    .rows[0]
                    .max_id
            ) + 1


        // ====================================================
        // 3. ESTADIOS
        // ====================================================

        for (
            const venue
            of estadiosApi.values()
        ) {

            let estadioId =
                await buscarEstadioMapeado(
                    client,
                    venue.id
                )


            // Ya existe mapping externo.
            if (estadioId) {

                await enriquecerEstadio(
                    client,
                    estadioId,
                    venue
                )


                estadiosReutilizados +=
                    1


                continue
            }


            // No existe mapping:
            // comprobamos si el estadio ya estaba en ZonaGol.
            estadioId =
                await buscarEstadioExistente(
                    client,
                    venue
                )


            if (estadioId) {

                await insertarMappingEstadio(
                    client,
                    venue.id,
                    estadioId
                )


                await enriquecerEstadio(
                    client,
                    estadioId,
                    venue
                )


                estadiosReutilizados +=
                    1


                continue
            }


            // =================================================
            // ESTADIO COMPLETAMENTE NUEVO
            // =================================================

            const nuevoEstadioId =
                siguienteEstadioId


            siguienteEstadioId +=
                1


            await client.query(
                `
                INSERT INTO Estadio (
                    EstadioId,
                    Nombre,
                    Ciudad,
                    Direccion,
                    Capacidad,
                    Estado
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    TRUE
                )
                `,
                [
                    nuevoEstadioId,
                    venue.name,
                    venue.city ||
                        'POR DEFINIR',
                    venue.address ||
                        null,
                    venue.capacity ??
                        null
                ]
            )


            await insertarMappingEstadio(
                client,
                venue.id,
                nuevoEstadioId
            )


            estadiosInsertados +=
                1
        }


        // ====================================================
        // 4. EQUIPOS
        // ====================================================

        for (
            const item
            of respuestaEquipos
        ) {

            const team =
                item.team


            const venue =
                item.venue


            if (
                !team?.id ||
                !team?.name
            ) {
                throw new Error(
                    'API-Football devolvió un equipo sin id o nombre'
                )
            }


            let equipoId =
                await buscarEquipoMapeado(
                    client,
                    team.id
                )


            // Ya existe mapping.
            if (equipoId) {

                equiposReutilizados +=
                    1

                continue
            }


            // No hay mapping.
            // Intentamos reutilizar un equipo interno existente.
            equipoId =
                await buscarEquipoExistente(
                    client,
                    ligaId,
                    team
                )


            if (equipoId) {

                await insertarMappingEquipo(
                    client,
                    team.id,
                    equipoId
                )


                equiposReutilizados +=
                    1


                continue
            }


            // =================================================
            // EQUIPO COMPLETAMENTE NUEVO
            // =================================================

            const nuevoEquipoId =
                siguienteEquipoId


            siguienteEquipoId +=
                1


            await client.query(
                `
                INSERT INTO Equipo (
                    EquipoId,
                    LigaId,
                    Nombre,
                    NombreCorto,
                    Sigla,
                    Ciudad,
                    FechaFundacion,
                    Estado
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    NULL,
                    TRUE
                )
                `,
                [
                    nuevoEquipoId,
                    ligaId,
                    team.name,
                    team.name,
                    team.code ||
                        null,
                    venue?.city ||
                        null
                ]
            )


            // FechaFundacion queda NULL:
            // API-Football entrega solo el año.
            // No inventamos día ni mes.


            await insertarMappingEquipo(
                client,
                team.id,
                nuevoEquipoId
            )


            equiposInsertados +=
                1
        }


        // ====================================================
        // 5. COMMIT
        // ====================================================

        await client.query(
            'COMMIT'
        )


        return {
            leagueId:
                Number(leagueId),

            season:
                Number(season),

            ligaId,

            equiposRecibidos:
                respuestaEquipos.length,

            equiposInsertados,

            equiposReutilizados,

            estadiosRecibidos:
                estadiosApi.size,

            estadiosInsertados,

            estadiosReutilizados
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
    sincronizarMaestrosTemporada
}