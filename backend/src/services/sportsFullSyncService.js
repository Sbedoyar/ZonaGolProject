const {
    sincronizarMaestrosTemporada
} = require('./sportsMasterSyncService')


const {
    sincronizarRonda
} = require('./sportsSyncService')


// ============================================================
// ESTADO DE SINCRONIZACIÓN
//
// Se mantiene en memoria mientras el backend esté ejecutándose.
//
// Esto permite saber:
// - Si existe una sincronización en curso.
// - Cuál fue la última sincronización completada.
// - Si fue manual o automática.
// - Si terminó correctamente o con error.
// ============================================================

let sincronizacionEnCurso =
    false


let inicioSincronizacionActual =
    null


let ultimaSincronizacion =
    null


// ============================================================
// OBTENER ESTADO ACTUAL
// ============================================================

function obtenerEstadoSincronizacion() {

    return {
        enCurso:
            sincronizacionEnCurso,

        inicioActual:
            inicioSincronizacionActual,

        ultimaSincronizacion
    }
}


// ============================================================
// SINCRONIZACIÓN COMPLETA DE UNA RONDA
//
// Orden:
// 1. Equipos y estadios
// 2. Calendario
// 3. Partidos
//
// origen:
// - MANUAL
// - SCHEDULER
// ============================================================

async function sincronizarJornadaCompleta({
    leagueId,
    season,
    round,
    numeroJornada,
    origen = 'MANUAL'
}) {

    // ========================================================
    // EVITAR SINCRONIZACIONES SIMULTÁNEAS
    // ========================================================

    if (sincronizacionEnCurso) {

        throw new Error(
            'Ya existe una sincronización deportiva en curso'
        )
    }


    sincronizacionEnCurso =
        true


    const inicio =
        new Date()


    inicioSincronizacionActual =
        inicio.toISOString()


    const parametros = {
        leagueId:
            Number(leagueId),

        season:
            Number(season),

        round,

        numeroJornada:
            Number(numeroJornada)
    }


    try {

        // ====================================================
        // 1. MAESTROS
        // ====================================================

        const maestros =
            await sincronizarMaestrosTemporada({
                leagueId,
                season
            })


        // ====================================================
        // 2. CALENDARIO + PARTIDOS
        // ====================================================

        const partidos =
            await sincronizarRonda({
                leagueId,
                season,
                round,
                numeroJornada
            })


        // ====================================================
        // 3. RESULTADO UNIFICADO
        // ====================================================

        const resultado = {

            liga: {
                apiLeagueId:
                    Number(leagueId),

                season:
                    Number(season),

                ligaId:
                    maestros.ligaId
            },


            ronda: {
                nombre:
                    round,

                numeroJornada:
                    Number(numeroJornada)
            },


            maestros: {
                equiposRecibidos:
                    maestros.equiposRecibidos,

                equiposInsertados:
                    maestros.equiposInsertados,

                equiposReutilizados:
                    maestros.equiposReutilizados,

                estadiosRecibidos:
                    maestros.estadiosRecibidos,

                estadiosInsertados:
                    maestros.estadiosInsertados,

                estadiosReutilizados:
                    maestros.estadiosReutilizados
            },


            partidos: {
                recibidos:
                    partidos.recibidos,

                insertados:
                    partidos.insertados,

                actualizados:
                    partidos.actualizados
            }
        }


        // ====================================================
        // GUARDAR ÚLTIMA SINCRONIZACIÓN EXITOSA
        // ====================================================

        ultimaSincronizacion = {

            exito:
                true,

            origen,

            inicio:
                inicio.toISOString(),

            fin:
                new Date().toISOString(),

            parametros,

            resultado,

            error:
                null
        }


        return resultado


    } catch (error) {

        // ====================================================
        // GUARDAR ÚLTIMA SINCRONIZACIÓN FALLIDA
        // ====================================================

        ultimaSincronizacion = {

            exito:
                false,

            origen,

            inicio:
                inicio.toISOString(),

            fin:
                new Date().toISOString(),

            parametros,

            resultado:
                null,

            error:
                error.message
        }


        throw error


    } finally {

        sincronizacionEnCurso =
            false

        inicioSincronizacionActual =
            null
    }
}


// ============================================================
// EXPORTACIONES
// ============================================================

module.exports = {
    sincronizarJornadaCompleta,
    obtenerEstadoSincronizacion
}