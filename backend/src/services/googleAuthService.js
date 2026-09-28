const {
    OAuth2Client
} = require('google-auth-library')


const googleClient =
    new OAuth2Client()


// ============================================================
// VERIFICAR CREDENCIAL DE GOOGLE
//
// Recibe:
// - credential: ID token entregado por Google Identity Services
//
// Valida:
// - firma del token
// - expiración
// - audience de ZonaGol
//
// Devuelve:
// - identificador estable de Google (sub)
// - correo
// - estado de verificación del correo
// - nombres disponibles en el perfil
//
// IMPORTANTE:
// Este servicio NO guarda:
// - access tokens
// - refresh tokens
// - contraseñas de Google
// - ID tokens
// ============================================================

async function verificarCredencialGoogle(
    credential
) {

    // ========================================================
    // VALIDAR CREDENCIAL
    // ========================================================

    if (
        typeof credential !== 'string' ||
        !credential.trim()
    ) {
        const error =
            new Error(
                'La credencial de Google es obligatoria'
            )

        error.codigo =
            'GOOGLE_CREDENTIAL_REQUIRED'

        throw error
    }


    // ========================================================
    // VALIDAR CONFIGURACIÓN LOCAL
    // ========================================================

    const googleClientId =
        process.env.GOOGLE_CLIENT_ID


    if (!googleClientId) {

        const error =
            new Error(
                'Google SSO no está configurado en el servidor'
            )

        error.codigo =
            'GOOGLE_SSO_NOT_CONFIGURED'

        throw error
    }


    // ========================================================
    // VERIFICAR ID TOKEN CON GOOGLE
    // ========================================================

    let ticket

    try {

        ticket =
            await googleClient.verifyIdToken({
                idToken:
                    credential.trim(),

                audience:
                    googleClientId
            })

    } catch {

        const error =
            new Error(
                'La credencial de Google no es válida o expiró'
            )

        error.codigo =
            'GOOGLE_CREDENTIAL_INVALID'

        throw error
    }


    // ========================================================
    // OBTENER PAYLOAD VERIFICADO
    // ========================================================

    const payload =
        ticket.getPayload()


    if (!payload) {

        const error =
            new Error(
                'Google no devolvió información de identidad válida'
            )

        error.codigo =
            'GOOGLE_PAYLOAD_INVALID'

        throw error
    }


    // ========================================================
    // IDENTIFICADOR ESTABLE DE GOOGLE
    //
    // Nunca utilizamos el correo como identificador principal.
    // El identificador estable es "sub".
    // ========================================================

    const proveedorUsuarioId =
        payload.sub


    const correo =
        typeof payload.email === 'string'
            ? payload.email
                .trim()
                .toLowerCase()
            : null


    const correoVerificado =
        payload.email_verified === true


    if (
        !proveedorUsuarioId ||
        !correo ||
        !correoVerificado
    ) {

        const error =
            new Error(
                'La cuenta de Google no tiene un correo verificado válido'
            )

        error.codigo =
            'GOOGLE_IDENTITY_INCOMPLETE'

        throw error
    }


    // ========================================================
    // DATOS OPCIONALES DEL PERFIL
    //
    // Se utilizarán después únicamente para facilitar
    // el registro de un usuario nuevo.
    // ========================================================

    const nombre =
        typeof payload.given_name === 'string'
            ? payload.given_name.trim()
            : null


    const apellido =
        typeof payload.family_name === 'string'
            ? payload.family_name.trim()
            : null


    // ========================================================
    // RESPUESTA NORMALIZADA
    // ========================================================

    return {
        proveedor:
            'GOOGLE',

        proveedorUsuarioId,

        correo,

        correoVerificado,

        nombre,

        apellido
    }
}


module.exports = {
    verificarCredencialGoogle
}