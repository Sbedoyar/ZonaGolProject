const {
    firebaseDb
} = require('../databases/firebaseDatabase')

const {
    FieldValue
} = require('firebase-admin/firestore')


// ============================================================
// REGISTRAR EVENTO WOMPI EN FIREBASE
//
// Firebase se utiliza para trazabilidad.
//
// NO es la fuente de verdad financiera.
// El saldo, pago y movimiento viven en MySQL.
//
// No almacenamos:
// - datos de tarjeta
// - customer_email
// - customer_data
// - billing_data
// - payment_method completo
// ============================================================

async function registrarEventoPagoWompi({
    evento,
    transaccion,
    resultadoMySQL
}) {

    if (
        !transaccion ||
        typeof transaccion !== 'object'
    ) {

        throw new Error(
            'La transacción de Wompi no es válida'
        )
    }


    const transaccionId =
        String(
            transaccion.id || ''
        )


    if (!transaccionId) {

        throw new Error(
            'La transacción de Wompi no contiene ID'
        )
    }


    const montoEnCentavos =
        Number(
            transaccion.amount_in_cents
        )


    const montoPesos =
        Number.isFinite(montoEnCentavos)
            ? montoEnCentavos / 100
            : null


    // ========================================================
    // DATOS MÍNIMOS Y SEGUROS PARA TRAZABILIDAD
    // ========================================================

    const datos = {

        proveedor:
            'WOMPI',

        tipoEvento:
            String(
                evento?.event || ''
            ),

        transaccionId,

        referencia:
            String(
                transaccion.reference || ''
            ),

        estado:
            String(
                transaccion.status || ''
            ),

        metodoPago:
            String(
                transaccion.payment_method_type || ''
            ),

        moneda:
            String(
                transaccion.currency || ''
            ),

        montoEnCentavos,

        montoPesos,

        usuarioId:
            resultadoMySQL?.usuarioId ?? null,

        pagoId:
            resultadoMySQL?.pagoId ?? null,

        procesadoMySQL:
            resultadoMySQL?.procesado === true,

        duplicado:
            resultadoMySQL?.duplicado === true,

        fechaRegistro:
            FieldValue.serverTimestamp()
    }


    const documento =
        await firebaseDb
            .collection('logs_pago')
            .add(datos)


    return {
        registrado: true,
        documentoId:
            documento.id
    }
}


module.exports = {
    registrarEventoPagoWompi
}