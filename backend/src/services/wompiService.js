const crypto = require('crypto')


// ============================================================
// CONFIGURACIÓN WOMPI
// ============================================================

const obtenerConfiguracionWompi = () => {

    const baseUrl =
        process.env.WOMPI_BASE_URL

    const publicKey =
        process.env.WOMPI_PUBLIC_KEY

    const privateKey =
        process.env.WOMPI_PRIVATE_KEY

    const integritySecret =
        process.env.WOMPI_INTEGRITY_SECRET

    const eventsSecret =
        process.env.WOMPI_EVENTS_SECRET


    if (
        !baseUrl ||
        !publicKey ||
        !privateKey ||
        !integritySecret ||
        !eventsSecret
    ) {

        throw new Error(
            'La configuración de Wompi está incompleta'
        )
    }


    return {
        baseUrl,
        publicKey,
        privateKey,
        integritySecret,
        eventsSecret
    }
}


// ============================================================
// GENERAR REFERENCIA ÚNICA
//
// Ejemplo:
//
// ZG-25-1791512345678-a31f9d4b2c10
// ============================================================

const generarReferenciaPago = (
    usuarioId
) => {

    const usuario =
        Number(usuarioId)


    if (
        !Number.isInteger(usuario) ||
        usuario <= 0
    ) {

        throw new Error(
            'El usuario no es válido para generar la referencia'
        )
    }


    const timestamp =
        Date.now()


    const aleatorio =
        crypto
            .randomBytes(6)
            .toString('hex')


    return (
        `ZG-${usuario}-${timestamp}-${aleatorio}`
    )
}


// ============================================================
// CONVERTIR PESOS COLOMBIANOS A CENTAVOS
//
// $50.000 COP
//        ↓
// 5.000.000 centavos
// ============================================================

const convertirACentavos = (
    montoPesos
) => {

    const monto =
        Number(montoPesos)


    if (
        !Number.isFinite(monto) ||
        monto <= 0
    ) {

        throw new Error(
            'El monto de la recarga no es válido'
        )
    }


    const centavos =
        Math.round(
            monto * 100
        )


    if (
        !Number.isSafeInteger(centavos) ||
        centavos <= 0
    ) {

        throw new Error(
            'El monto de la recarga no es válido'
        )
    }


    return centavos
}


// ============================================================
// GENERAR FIRMA DE INTEGRIDAD
//
// Orden requerido por Wompi:
//
// referencia
// + montoEnCentavos
// + moneda
// + secretoIntegridad
// ============================================================

const generarFirmaIntegridad = ({
    referencia,
    montoEnCentavos,
    moneda = 'COP'
}) => {

    const {
        integritySecret
    } =
        obtenerConfiguracionWompi()


    if (
        !referencia ||
        !Number.isSafeInteger(
            montoEnCentavos
        ) ||
        montoEnCentavos <= 0
    ) {

        throw new Error(
            'No fue posible generar la firma de integridad'
        )
    }


    const cadena =
        `${referencia}${montoEnCentavos}${moneda}${integritySecret}`


    return crypto
        .createHash('sha256')
        .update(
            cadena,
            'utf8'
        )
        .digest('hex')
}


// ============================================================
// PREPARAR CHECKOUT WOMPI
//
// Esta función devuelve únicamente datos seguros
// para enviar al frontend.
//
// NUNCA devuelve:
// - llave privada
// - secreto de integridad
// - secreto de eventos
// ============================================================

const prepararCheckoutWompi = ({
    usuarioId,
    montoPesos
}) => {

    const {
        publicKey
    } =
        obtenerConfiguracionWompi()


    const referencia =
        generarReferenciaPago(
            usuarioId
        )


    const montoEnCentavos =
        convertirACentavos(
            montoPesos
        )


    const moneda =
        'COP'


    const firmaIntegridad =
        generarFirmaIntegridad({
            referencia,
            montoEnCentavos,
            moneda
        })


    return {
        referencia,
        moneda,
        montoEnCentavos,
        publicKey,
        firmaIntegridad
    }
}


// ============================================================
// EXPORTACIONES
// ============================================================

module.exports = {
    obtenerConfiguracionWompi,
    generarReferenciaPago,
    convertirACentavos,
    generarFirmaIntegridad,
    prepararCheckoutWompi
}