const fs = require('fs')
const { google } = require('googleapis')
const { Readable } = require('stream')
require('dotenv').config()


// ============================================================
// CONFIGURACIÓN OAUTH 2.0 DE GOOGLE DRIVE
// ============================================================

const oauth2Client =
    new google.auth.OAuth2(
        process.env.GOOGLE_DRIVE_CLIENT_ID,
        process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        process.env.GOOGLE_DRIVE_REDIRECT_URI
    )


// Si ya existe el refresh token, lo configuramos para que Google
// pueda generar automáticamente nuevos access tokens.
if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {

    oauth2Client.setCredentials({
        refresh_token:
            process.env.GOOGLE_DRIVE_REFRESH_TOKEN
    })
}


const drive =
    google.drive({
        version: 'v3',
        auth: oauth2Client
    })


// ============================================================
// GENERAR URL DE AUTORIZACIÓN
// ============================================================

function generarUrlAutorizacion() {

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',

        scope: [
            'https://www.googleapis.com/auth/drive'
        ]
    })
}


// ============================================================
// ESCAPAR VALORES PARA CONSULTAS DE DRIVE
// ============================================================

function escaparValorDrive(valor) {

    return valor
        .trim()
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
}


// ============================================================
// BUSCAR CARPETA POR NOMBRE
// ============================================================

async function buscarCarpetaPorNombre(
    nombre
) {

    if (
        typeof nombre !== 'string' ||
        !nombre.trim()
    ) {

        const error =
            new Error(
                'El nombre de la carpeta es obligatorio'
            )

        error.codigo =
            'DRIVE_FOLDER_NAME_REQUIRED'

        throw error
    }


    const nombreNormalizado =
        escaparValorDrive(nombre)


    const respuesta =
        await drive.files.list({
            q:
                `name = '${nombreNormalizado}' ` +
                `and mimeType = 'application/vnd.google-apps.folder' ` +
                `and trashed = false`,

            fields:
                'files(id, name, parents)',

            pageSize:
                10
        })


    return respuesta.data.files || []
}


// ============================================================
// BUSCAR SUBCARPETA DENTRO DE UNA CARPETA PADRE
// ============================================================

async function buscarSubcarpeta(
    carpetaPadreId,
    nombre
) {

    if (
        typeof carpetaPadreId !== 'string' ||
        !carpetaPadreId.trim()
    ) {

        const error =
            new Error(
                'El identificador de la carpeta padre es obligatorio'
            )

        error.codigo =
            'DRIVE_PARENT_FOLDER_REQUIRED'

        throw error
    }


    if (
        typeof nombre !== 'string' ||
        !nombre.trim()
    ) {

        const error =
            new Error(
                'El nombre de la subcarpeta es obligatorio'
            )

        error.codigo =
            'DRIVE_FOLDER_NAME_REQUIRED'

        throw error
    }


    const nombreNormalizado =
        escaparValorDrive(nombre)


    const respuesta =
        await drive.files.list({
            q:
                `name = '${nombreNormalizado}' ` +
                `and '${carpetaPadreId.trim()}' in parents ` +
                `and mimeType = 'application/vnd.google-apps.folder' ` +
                `and trashed = false`,

            fields:
                'files(id, name, parents)',

            pageSize:
                10
        })


    return respuesta.data.files || []
}


// ============================================================
// SUBIR IMAGEN A GOOGLE DRIVE
// ============================================================

async function subirImagen(
    rutaArchivo,
    nombreArchivo,
    mimeType,
    carpetaDestinoId
) {

    if (!fs.existsSync(rutaArchivo)) {

        const error =
            new Error(
                'El archivo que se intenta subir no existe'
            )

        error.codigo =
            'DRIVE_FILE_NOT_FOUND'

        throw error
    }


    if (
        typeof carpetaDestinoId !== 'string' ||
        !carpetaDestinoId.trim()
    ) {

        const error =
            new Error(
                'La carpeta de destino es obligatoria'
            )

        error.codigo =
            'DRIVE_DESTINATION_REQUIRED'

        throw error
    }


    const respuesta =
        await drive.files.create({
            requestBody: {
                name:
                    nombreArchivo,

                parents: [
                    carpetaDestinoId.trim()
                ]
            },

            media: {
                mimeType,

                body:
                    fs.createReadStream(
                        rutaArchivo
                    )
            },

            fields:
                'id, name, mimeType, parents'
        })


    return respuesta.data
}
// ============================================================
// SUBIR IMAGEN DESDE MEMORIA A GOOGLE DRIVE
// ============================================================

async function subirImagenBuffer(
    buffer,
    nombreArchivo,
    mimeType,
    carpetaDestinoId
) {

    if (!Buffer.isBuffer(buffer)) {

        const error =
            new Error(
                'La imagen recibida no es válida'
            )

        error.codigo =
            'DRIVE_INVALID_BUFFER'

        throw error
    }


    if (
        typeof nombreArchivo !== 'string' ||
        !nombreArchivo.trim()
    ) {

        const error =
            new Error(
                'El nombre del archivo es obligatorio'
            )

        error.codigo =
            'DRIVE_FILE_NAME_REQUIRED'

        throw error
    }


    if (
        typeof mimeType !== 'string' ||
        !mimeType.trim()
    ) {

        const error =
            new Error(
                'El tipo MIME es obligatorio'
            )

        error.codigo =
            'DRIVE_MIME_TYPE_REQUIRED'

        throw error
    }


    if (
        typeof carpetaDestinoId !== 'string' ||
        !carpetaDestinoId.trim()
    ) {

        const error =
            new Error(
                'La carpeta de destino es obligatoria'
            )

        error.codigo =
            'DRIVE_DESTINATION_REQUIRED'

        throw error
    }


    const stream =
        Readable.from(buffer)


    const respuesta =
        await drive.files.create({
            requestBody: {
                name:
                    nombreArchivo.trim(),

                parents: [
                    carpetaDestinoId.trim()
                ]
            },

            media: {
                mimeType:
                    mimeType.trim(),

                body:
                    stream
            },

            fields:
                'id, name, mimeType, parents'
        })


    return respuesta.data
}
// ============================================================
// ELIMINAR ARCHIVO DE GOOGLE DRIVE
// ============================================================

async function eliminarArchivo(
    archivoId
) {

    if (
        typeof archivoId !== 'string' ||
        !archivoId.trim()
    ) {

        const error =
            new Error(
                'El identificador del archivo es obligatorio'
            )

        error.codigo =
            'DRIVE_FILE_ID_REQUIRED'

        throw error
    }


    await drive.files.delete({
        fileId:
            archivoId.trim()
    })


    return true
}

// ============================================================
// OBTENER ARCHIVO PRIVADO DE GOOGLE DRIVE
// ============================================================

async function obtenerArchivo(
    archivoId
) {

    if (
        typeof archivoId !== 'string' ||
        !archivoId.trim()
    ) {

        const error =
            new Error(
                'El identificador del archivo es obligatorio'
            )

        error.codigo =
            'DRIVE_FILE_ID_REQUIRED'

        throw error
    }


    const respuesta =
        await drive.files.get(
            {
                fileId:
                    archivoId.trim(),

                alt:
                    'media'
            },
            {
                responseType:
                    'stream'
            }
        )


    return respuesta
}

module.exports = {
    drive,
    oauth2Client,
    generarUrlAutorizacion,
    buscarCarpetaPorNombre,
    buscarSubcarpeta,
    subirImagen,
    subirImagenBuffer,
    eliminarArchivo,
    obtenerArchivo
}