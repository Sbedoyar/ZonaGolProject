const express = require('express')

const mysqlPool =
    require('../databases/mysqlDatabase')

const {
    verificarToken
} = require('../middlewares/authMiddleware')

const {
    autorizarRoles
} = require('../middlewares/roleMiddleware')

const {
    prepararCheckoutWompi
} = require('../services/wompiService')


const router = express.Router()

const {
  validarFirmaEventoWompi,
} = require(
  '../services/wompiWebhookService'
)

const {
    procesarRecargaAprobada
} = require(
    '../services/wompiPaymentService'
)

const {
    registrarEventoPagoWompi
} = require(
    '../services/wompiFirebaseService'
)

// ============================================================
// WEBHOOK DE EVENTOS WOMPI
//
// NO lleva JWT.
//
// Wompi necesita poder acceder a este endpoint
// directamente desde Internet.
//
// POST /api/pagos/wompi/evento
// ============================================================

router.post(
  '/evento',

  async (req, res) => {

    try {

      const evento =
        req.body


      const checksumHeader =
        req.get(
          'X-Event-Checksum'
        )


      const firmaValida =
        validarFirmaEventoWompi({
          evento,
          checksumHeader,
        })


      if (!firmaValida) {

        console.warn(
          'Webhook Wompi rechazado: firma inválida'
        )


        return res
          .status(401)
          .json({
            success: false,
            message:
              'Firma de evento no válida',
          })
      }


      const transaccion =
        evento?.data?.transaction


      console.log(
        'Webhook Wompi válido:',
        {
            evento:
                evento?.event,

            id:
                transaccion?.id,

            status:
                transaccion?.status,

            reference:
                transaccion?.reference,

            amountInCents:
                transaccion?.amount_in_cents,

            currency:
                transaccion?.currency,

            paymentMethodType:
                transaccion?.payment_method_type
        }
    )


    // ============================================================
    // PROCESAR RECARGA APROBADA EN MYSQL
    // ============================================================

    const resultado =
        await procesarRecargaAprobada(
            transaccion
        )


    console.log(
        'Resultado recarga Wompi:',
        resultado
    )
    // ============================================================
    // REGISTRAR TRAZABILIDAD DEL EVENTO EN FIREBASE
    // ============================================================

    const resultadoFirebase =
        await registrarEventoPagoWompi({
            evento,
            transaccion,
            resultadoMySQL:
                resultado
        })


    console.log(
        'Evento Wompi registrado en Firebase:',
        resultadoFirebase
    )


      return res
        .status(200)
        .json({
          success: true,
        })

    } catch (error) {

      console.error(
        'Error procesando webhook Wompi:',
        error
      )


      return res
        .status(400)
        .json({
          success: false,
          message:
            'Evento Wompi no válido',
        })
    }
  }
)

// ============================================================
// PREPARAR CHECKOUT DE RECARGA WOMPI
//
// Solo CLIENTE:
// RolId = 3
//
// POST /api/pagos/wompi/checkout
//
// Body:
//
// {
//     "monto": 50000
// }
// ============================================================

router.post(
    '/checkout',
    verificarToken,
    autorizarRoles(3),
    async (req, res) => {

        const usuarioId =
            Number(
                req.usuario.usuarioId
            )

        const monto =
            Number(
                req.body.monto
            )


        // ====================================================
        // VALIDAR USUARIO
        // ====================================================

        if (
            !Number.isInteger(usuarioId) ||
            usuarioId <= 0
        ) {

            return res.status(401).json({
                success: false,
                message:
                    'Usuario no válido'
            })
        }


        // ====================================================
        // VALIDAR MONTO
        // ====================================================

        if (
            !Number.isFinite(monto) ||
            monto <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'El monto de la recarga no es válido'
            })
        }


        try {

            // =================================================
            // COMPROBAR QUE EL CLIENTE TENGA CUENTA DE SALDO
            // =================================================

            const [saldos] =
                await mysqlPool.query(
                    `
                    SELECT
                        UsuarioId

                    FROM Saldo

                    WHERE UsuarioId = ?

                    LIMIT 1
                    `,
                    [usuarioId]
                )


            if (saldos.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        'El usuario no tiene una cuenta de saldo'
                })
            }


            // =================================================
            // PREPARAR DATOS DEL CHECKOUT
            // =================================================

            const checkout =
                prepararCheckoutWompi({
                    usuarioId,
                    montoPesos:
                        monto
                })


            // =================================================
            // RESPUESTA SEGURA PARA REACT
            //
            // Solo enviamos:
            // - llave pública
            // - referencia
            // - moneda
            // - monto
            // - firma
            //
            // NUNCA:
            // - llave privada
            // - secreto de integridad
            // - secreto de eventos
            // =================================================

            return res.status(200).json({
                success: true,

                datos: {

                    referencia:
                        checkout.referencia,

                    moneda:
                        checkout.moneda,

                    monto:
                        monto,

                    montoEnCentavos:
                        checkout.montoEnCentavos,

                    publicKey:
                        checkout.publicKey,

                    firmaIntegridad:
                        checkout.firmaIntegridad
                }
            })


        } catch (error) {

            console.error(
                'Error preparando checkout Wompi:',
                error
            )


            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    'No fue posible preparar la recarga'
            })
        }
    }
)


module.exports = router