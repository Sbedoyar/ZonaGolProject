const jwt = require('jsonwebtoken')

require('dotenv').config()


// ============================================================
// VERIFICAR TOKEN JWT
// ============================================================
//
// Espera recibir:
//
// Authorization: Bearer eyJhbGciOi...
//
// Si el token es válido:
//   req.usuario contendrá los datos del JWT.
//
// Si falta, expiró o fue alterado:
//   la petición se rechaza.
// ============================================================

function verificarToken(req, res, next) {

    try {

        // =====================================================
        // LEER HEADER AUTHORIZATION
        // =====================================================

        const authorization =
            req.headers.authorization


        // =====================================================
        // VERIFICAR QUE EXISTA
        // =====================================================

        if (!authorization) {

            return res.status(401).json({
                success: false,
                message:
                    'Debes iniciar sesión para acceder a este recurso'
            })
        }


        // =====================================================
        // FORMATO ESPERADO:
        //
        // Bearer TOKEN
        // =====================================================

        const partes =
            authorization.split(' ')


        if (
            partes.length !== 2 ||
            partes[0] !== 'Bearer' ||
            !partes[1]
        ) {

            return res.status(401).json({
                success: false,
                message:
                    'Token de autenticación no válido'
            })
        }


        const token =
            partes[1]


        // =====================================================
        // VERIFICAR FIRMA Y EXPIRACIÓN
        // =====================================================

        const datosToken =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            )


        // =====================================================
        // GUARDAR USUARIO AUTENTICADO EN LA PETICIÓN
        //
        // Tendremos disponible:
        //
        // req.usuario.usuarioId
        // req.usuario.correo
        // req.usuario.rolId
        // =====================================================

        req.usuario =
            datosToken


        // =====================================================
        // CONTINUAR A LA RUTA
        // =====================================================

        next()

    } catch (error) {

        // =====================================================
        // TOKEN EXPIRADO
        // =====================================================

        if (
            error.name ===
            'TokenExpiredError'
        ) {

            return res.status(401).json({
                success: false,
                message:
                    'Tu sesión expiró. Inicia sesión nuevamente.'
            })
        }


        // =====================================================
        // TOKEN ALTERADO / FIRMA INVÁLIDA / OTRO ERROR JWT
        // =====================================================

        return res.status(401).json({
            success: false,
            message:
                'Token de autenticación no válido'
        })
    }
}

module.exports = {
    verificarToken
}

