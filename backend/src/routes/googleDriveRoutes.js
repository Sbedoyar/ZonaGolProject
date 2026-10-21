const express = require('express')
const fs = require('fs')
const path = require('path')

const {
    oauth2Client,
    generarUrlAutorizacion
} = require('../services/googleDriveService')


const router = express.Router()


// ============================================================
// INICIAR AUTORIZACIÓN DE GOOGLE DRIVE
// ============================================================

router.get('/oauth', (req, res) => {

    try {

        const urlAutorizacion =
            generarUrlAutorizacion()

        return res.redirect(
            urlAutorizacion
        )

    } catch (error) {

        console.error(
            'Error iniciando OAuth de Google Drive:',
            error.message
        )

        return res.status(500).json({
            message:
                'No fue posible iniciar la autorización de Google Drive'
        })
    }
})


// ============================================================
// CALLBACK DE GOOGLE DRIVE
// ============================================================

router.get('/oauth/callback', async (req, res) => {

    try {

        const { code } = req.query


        if (!code) {

            return res.status(400).json({
                message:
                    'Google no devolvió el código de autorización'
            })
        }


        const {
            tokens
        } =
            await oauth2Client.getToken(
                code
            )


        if (!tokens.refresh_token) {

            return res.status(400).json({
                message:
                    'Google no devolvió un refresh token. Vuelve a iniciar la autorización.'
            })
        }


        // ====================================================
        // GUARDAR REFRESH TOKEN EN .ENV
        // ====================================================

        const envPath =
            path.resolve(
                __dirname,
                '../../.env'
            )


        let envContenido =
            fs.readFileSync(
                envPath,
                'utf8'
            )


        const nuevaVariable =
            `GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`


        if (
            /^GOOGLE_DRIVE_REFRESH_TOKEN=.*$/m.test(
                envContenido
            )
        ) {

            envContenido =
                envContenido.replace(
                    /^GOOGLE_DRIVE_REFRESH_TOKEN=.*$/m,
                    nuevaVariable
                )

        } else {

            envContenido =
                `${envContenido.trimEnd()}\n${nuevaVariable}\n`
        }


        fs.writeFileSync(
            envPath,
            envContenido,
            'utf8'
        )


        return res.json({
            message:
                'Google Drive autorizado correctamente',

            refreshTokenGuardado:
                true
        })

    } catch (error) {

        console.error(
            'Error procesando OAuth de Google Drive:',
            error.message
        )

        return res.status(500).json({
            message:
                'No fue posible completar la autorización de Google Drive'
        })
    }
})


module.exports = router