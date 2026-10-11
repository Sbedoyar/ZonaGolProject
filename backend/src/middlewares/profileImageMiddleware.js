const multer = require('multer')


// ============================================================
// CONFIGURACIÓN DE ALMACENAMIENTO
//
// La imagen permanece temporalmente en memoria.
// No se crea ningún archivo físico en el backend.
// ============================================================

const storage =
    multer.memoryStorage()


// ============================================================
// TIPOS DE IMAGEN PERMITIDOS
// ============================================================

const tiposPermitidos =
    new Set([
        'image/jpeg',
        'image/png',
        'image/webp'
    ])


// ============================================================
// FILTRO DE ARCHIVOS
// ============================================================

function validarImagen(
    req,
    file,
    callback
) {

    if (!tiposPermitidos.has(file.mimetype)) {

        const error =
            new Error(
                'Formato de imagen no permitido. Usa JPG, PNG o WEBP.'
            )

        error.codigo =
            'PROFILE_IMAGE_INVALID_TYPE'

        return callback(
            error,
            false
        )
    }


    return callback(
        null,
        true
    )
}


// ============================================================
// MIDDLEWARE DE FOTO DE PERFIL
//
// Máximo: 5 MB
// ============================================================

const subirFotoPerfil =
    multer({
        storage,

        fileFilter:
            validarImagen,

        limits: {
            fileSize:
                5 * 1024 * 1024,

            files:
                1
        }
    })


module.exports = {
    subirFotoPerfil
}