const express = require('express')

const {
    verificarToken
} = require('../middlewares/authMiddleware')

const {
    autorizarRoles
} = require('../middlewares/roleMiddleware')

const {
    sincronizarJornadaCompleta,
    obtenerEstadoSincronizacion
} = require('../services/sportsFullSyncService')


const router = express.Router()


// ============================================================
// CONSULTAR ESTADO DE SINCRONIZACIÓN DEPORTIVA
//
// Solo:
// 1 = ADMINISTRADOR
// 2 = OPERADOR
//
// GET /api/sports-sync/estado
// ============================================================

router.get(
    '/estado',
    verificarToken,
    autorizarRoles(1, 2),
    (req, res) => {

        const estado =
            obtenerEstadoSincronizacion()


        return res.status(200).json({
            success: true,

            datos: {

                automatica: {

                    habilitada:
                        String(
                            process.env.SPORTS_SYNC_ENABLED || ''
                        )
                            .trim()
                            .toLowerCase() === 'true',

                    cron:
                        process.env.SPORTS_SYNC_CRON ||
                        '0 */2 * * *',

                    timezone:
                        'America/Bogota',

                    leagueId:
                        Number(
                            process.env.SPORTS_SYNC_LEAGUE_ID ||
                            239
                        ),

                    season:
                        Number(
                            process.env.SPORTS_SYNC_SEASON ||
                            2024
                        ),

                    round:
                        process.env.SPORTS_SYNC_ROUND ||
                        'Apertura - 1',

                    numeroJornada:
                        Number(
                            process.env.SPORTS_SYNC_NUMERO_JORNADA ||
                            1
                        )
                },


                ejecucion:
                    estado
            }
        })
    }
)


// ============================================================
// SINCRONIZAR UNA JORNADA DESDE API-FOOTBALL
//
// Solo:
// 1 = ADMINISTRADOR
// 2 = OPERADOR
//
// Ejemplo:
// POST /api/sports-sync/jornada
//
// {
//     "leagueId": 239,
//     "season": 2024,
//     "round": "Apertura - 1",
//     "numeroJornada": 1
// }
// ============================================================

router.post(
    '/jornada',
    verificarToken,
    autorizarRoles(1, 2),
    async (req, res) => {

        const leagueId =
            Number(req.body.leagueId)

        const season =
            Number(req.body.season)

        const round =
            typeof req.body.round === 'string'
                ? req.body.round.trim()
                : ''

        const numeroJornada =
            Number(req.body.numeroJornada)


        // ====================================================
        // VALIDACIONES
        // ====================================================

        if (
            !Number.isInteger(leagueId) ||
            leagueId <= 0
        ) {

            return res.status(400).json({
                success: false,

                message:
                    'El leagueId no es válido'
            })
        }


        if (
            !Number.isInteger(season) ||
            season <= 0
        ) {

            return res.status(400).json({
                success: false,

                message:
                    'La temporada no es válida'
            })
        }


        if (!round) {

            return res.status(400).json({
                success: false,

                message:
                    'La ronda es obligatoria'
            })
        }


        if (
            !Number.isInteger(numeroJornada) ||
            numeroJornada <= 0
        ) {

            return res.status(400).json({
                success: false,

                message:
                    'El número de jornada no es válido'
            })
        }


        try {

            // ================================================
            // SINCRONIZACIÓN
            // ================================================

            const resultado =
                await sincronizarJornadaCompleta({
                    leagueId,
                    season,
                    round,
                    numeroJornada,
                    origen:
                        'MANUAL'
                })


            return res.status(200).json({
                success: true,

                message:
                    'Jornada sincronizada correctamente',

                datos:
                    resultado
            })


        } catch (error) {

            console.error(
                'Error sincronizando jornada:',
                error
            )


            return res.status(500).json({
                success: false,

                message:
                    error.message ||
                    'Error sincronizando la jornada'
            })
        }
    }
)


module.exports = router