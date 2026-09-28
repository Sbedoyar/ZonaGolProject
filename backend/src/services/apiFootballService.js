const API_BASE_URL =
    'https://v3.football.api-sports.io'


// ============================================================
// VALIDAR CONFIGURACIÓN
// ============================================================

function obtenerApiKey() {

    const apiKey =
        process.env.API_FOOTBALL_KEY

    if (!apiKey) {
        const error = new Error(
            'API_FOOTBALL_KEY no está configurada'
        )

        error.code =
            'API_FOOTBALL_NOT_CONFIGURED'

        throw error
    }

    return apiKey
}


// ============================================================
// PETICIÓN GENÉRICA A API-FOOTBALL
// ============================================================

async function solicitarApiFootball(
    endpoint,
    parametros = {}
) {

    const apiKey =
        obtenerApiKey()

    const url =
        new URL(
            `${API_BASE_URL}${endpoint}`
        )


    Object.entries(parametros)
        .forEach(([clave, valor]) => {

            if (
                valor !== undefined &&
                valor !== null &&
                valor !== ''
            ) {
                url.searchParams.set(
                    clave,
                    String(valor)
                )
            }

        })


    const response =
        await fetch(
            url,
            {
                method: 'GET',

                headers: {
                    'x-apisports-key':
                        apiKey
                }
            }
        )


    if (!response.ok) {

        const error =
            new Error(
                `API-Football respondió HTTP ${response.status}`
            )

        error.code =
            'API_FOOTBALL_HTTP_ERROR'

        throw error
    }


    const data =
        await response.json()


    // API-Football normalmente devuelve los errores
    // dentro de la propiedad "errors".
    const tieneErrores =
        data.errors &&
        (
            Array.isArray(data.errors)
                ? data.errors.length > 0
                : Object.keys(data.errors).length > 0
        )


    if (tieneErrores) {

        const error =
            new Error(
                `Error de API-Football: ${JSON.stringify(data.errors)}`
            )

        error.code =
            'API_FOOTBALL_API_ERROR'

        error.apiErrors =
            data.errors

        throw error
    }


    return data
}


// ============================================================
// EQUIPOS DE UNA LIGA / TEMPORADA
// ============================================================

async function obtenerEquiposTemporada({
    leagueId,
    season
}) {

    const data =
        await solicitarApiFootball(
            '/teams',
            {
                league:
                    leagueId,

                season
            }
        )


    return data.response
}


// ============================================================
// PARTIDOS DE UNA RONDA
// ============================================================

async function obtenerPartidosPorRonda({
    leagueId,
    season,
    round,
    timezone = 'America/Bogota'
}) {

    const data =
        await solicitarApiFootball(
            '/fixtures',
            {
                league:
                    leagueId,

                season,

                round,

                timezone
            }
        )


    return data.response
}


// ============================================================
// ESTADIO POR ID EXTERNO
// ============================================================

async function obtenerEstadioPorId(
    venueId
) {

    const data =
        await solicitarApiFootball(
            '/venues',
            {
                id:
                    venueId
            }
        )


    return data.response[0] || null
}


// ============================================================
// EXPORTACIONES
// ============================================================

module.exports = {
    solicitarApiFootball,
    obtenerEquiposTemporada,
    obtenerPartidosPorRonda,
    obtenerEstadioPorId
}