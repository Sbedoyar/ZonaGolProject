const mysqlPool =
  require('../databases/mysqlDatabase')


// ============================================================
// CATÁLOGOS ACTUALES DE ZONAGOL
// ============================================================

const ESTADO_PAGO = {
  PENDIENTE: 1,
  APROBADO: 2,
  RECHAZADO: 3,
  ANULADO: 4,
}

const METODO_PAGO = {
  PSE: 1,
  NEQUI: 2,
  TARJETA: 4,
}

const TIPO_MOVIMIENTO = {
  RECARGA: 1,
}


// ============================================================
// MAPEAR MÉTODO WOMPI -> ZONAGOL
// ============================================================

function obtenerMetodoPagoId(
  paymentMethodType
) {

  const tipo =
    String(
      paymentMethodType || ''
    )
      .trim()
      .toUpperCase()


  const mapa = {
    CARD:
      METODO_PAGO.TARJETA,

    NEQUI:
      METODO_PAGO.NEQUI,

    PSE:
      METODO_PAGO.PSE,
  }


  return mapa[tipo] || null
}


// ============================================================
// EXTRAER USUARIO DE NUESTRA REFERENCIA
//
// Formato actual:
// ZG-{usuarioId}-{timestamp}-{aleatorio}
// ============================================================

function obtenerUsuarioIdDesdeReferencia(
  referencia
) {

  const coincidencia =
    /^ZG-(\d+)-/.exec(
      String(referencia || '')
    )


  if (!coincidencia) {

    throw new Error(
      'La referencia de Wompi no pertenece a ZonaGol'
    )
  }


  const usuarioId =
    Number(
      coincidencia[1]
    )


  if (
    !Number.isInteger(usuarioId) ||
    usuarioId <= 0
  ) {

    throw new Error(
      'La referencia contiene un usuario no válido'
    )
  }


  return usuarioId
}


// ============================================================
// PROCESAR RECARGA APROBADA
// ============================================================

async function procesarRecargaAprobada(
  transaccion
) {

  if (
    !transaccion ||
    typeof transaccion !== 'object'
  ) {

    throw new Error(
      'La transacción de Wompi no es válida'
    )
  }


  if (
    String(
      transaccion.status
    ).toUpperCase() !==
    'APPROVED'
  ) {

    return {
      procesado: false,
      motivo:
        'La transacción no está aprobada',
    }
  }


  if (
    transaccion.currency !== 'COP'
  ) {

    throw new Error(
      'La moneda de la transacción no es COP'
    )
  }


  const montoEnCentavos =
    Number(
      transaccion.amount_in_cents
    )


  if (
    !Number.isSafeInteger(
      montoEnCentavos
    ) ||
    montoEnCentavos <= 0
  ) {

    throw new Error(
      'El monto recibido de Wompi no es válido'
    )
  }


  const montoPesos =
    montoEnCentavos / 100


  const referencia =
    String(
      transaccion.reference || ''
    )


  const wompiTransactionId =
    String(
      transaccion.id || ''
    )


  if (!wompiTransactionId) {

    throw new Error(
      'La transacción no contiene ID de Wompi'
    )
  }


  const usuarioId =
    obtenerUsuarioIdDesdeReferencia(
      referencia
    )


  const metodoPagoId =
    obtenerMetodoPagoId(
      transaccion.payment_method_type
    )


  if (!metodoPagoId) {

    throw new Error(
      `Método de pago Wompi no soportado: ${transaccion.payment_method_type}`
    )
  }


  const connection =
    await mysqlPool.getConnection()


  try {

    await connection.beginTransaction()


    // ========================================================
    // 1. BUSCAR PAGO POR ID DE TRANSACCIÓN WOMPI
    //
    // ReferenciaTransaccion tiene UNIQUE en tu esquema.
    // Además usamos FOR UPDATE para serializar el procesamiento.
    // ========================================================

    const [pagosExistentes] =
      await connection.query(
        `
          SELECT
            PagoId,
            ClienteUsuarioId,
            EstadoPagoId,
            Monto

          FROM Pago

          WHERE ReferenciaTransaccion = ?

          FOR UPDATE
        `,
        [
          wompiTransactionId,
        ]
      )


    let pagoId


    if (
      pagosExistentes.length > 0
    ) {

      pagoId =
        pagosExistentes[0]
          .PagoId


      // ======================================================
      // SI YA EXISTE MOVIMIENTO DE RECARGA PARA ESTE PAGO,
      // EL WEBHOOK YA FUE PROCESADO.
      // ======================================================

      const [movimientosExistentes] =
        await connection.query(
          `
            SELECT
              MovimientoSaldoId

            FROM MovimientoSaldo

            WHERE
              PagoId = ?
              AND TipoMovimientoSaldoId = ?

            LIMIT 1
          `,
          [
            pagoId,
            TIPO_MOVIMIENTO.RECARGA,
          ]
        )


      if (
        movimientosExistentes.length > 0
      ) {

        await connection.commit()


        return {
          procesado: false,
          duplicado: true,
          pagoId,
          usuarioId,
          montoPesos,
        }
      }


      await connection.query(
        `
          UPDATE Pago

          SET
            EstadoPagoId = ?,
            MetodoPagoId = ?

          WHERE PagoId = ?
        `,
        [
          ESTADO_PAGO.APROBADO,
          metodoPagoId,
          pagoId,
        ]
      )

    } else {

      // ======================================================
      // 2. CREAR PAGO APROBADO
      // ======================================================

      const [pagoResult] =
        await connection.query(
          `
            INSERT INTO Pago
            (
              ClienteUsuarioId,
              MetodoPagoId,
              EstadoPagoId,
              Monto,
              ReferenciaTransaccion
            )

            VALUES
            (
              ?,
              ?,
              ?,
              ?,
              ?
            )
          `,
          [
            usuarioId,
            metodoPagoId,
            ESTADO_PAGO.APROBADO,
            montoPesos,
            wompiTransactionId,
          ]
        )


      pagoId =
        pagoResult.insertId


      // CodigoPago es nullable, pero aprovechamos el patrón
      // que ya utiliza ZonaGol para generar códigos legibles.

      const codigoPago =
        `PG${pagoId}`


      await connection.query(
        `
          UPDATE Pago

          SET CodigoPago = ?

          WHERE PagoId = ?
        `,
        [
          codigoPago,
          pagoId,
        ]
      )
    }


    // ========================================================
    // 3. BLOQUEAR SALDO
    // ========================================================

    const [saldos] =
      await connection.query(
        `
          SELECT
            UsuarioId,
            SaldoDisponible,
            SaldoRetenido

          FROM Saldo

          WHERE UsuarioId = ?

          FOR UPDATE
        `,
        [
          usuarioId,
        ]
      )


    if (saldos.length === 0) {

      throw new Error(
        `No existe saldo para el usuario ${usuarioId}`
      )
    }


    // ========================================================
    // 4. ACREDITAR RECARGA
    // ========================================================

    await connection.query(
      `
        UPDATE Saldo

        SET
          SaldoDisponible =
            SaldoDisponible + ?,

          FechaActualizacion =
            CURRENT_TIMESTAMP(6)

        WHERE UsuarioId = ?
      `,
      [
        montoPesos,
        usuarioId,
      ]
    )


    // ========================================================
    // 5. REGISTRAR MOVIMIENTO
    // ========================================================

    await connection.query(
      `
        INSERT INTO MovimientoSaldo
        (
          UsuarioId,
          TipoMovimientoSaldoId,
          PagoId,
          ApuestaId,
          Monto,
          Descripcion
        )

        VALUES
        (
          ?,
          ?,
          ?,
          NULL,
          ?,
          ?
        )
      `,
      [
        usuarioId,
        TIPO_MOVIMIENTO.RECARGA,
        pagoId,
        montoPesos,
        `Recarga Wompi ${referencia}`,
      ]
    )


    // ========================================================
    // 6. CONSULTAR SALDO RESULTANTE
    // ========================================================

    const [saldoFinalResult] =
      await connection.query(
        `
          SELECT
            SaldoDisponible,
            SaldoRetenido

          FROM Saldo

          WHERE UsuarioId = ?
        `,
        [
          usuarioId,
        ]
      )


    const saldoDisponible =
      Number(
        saldoFinalResult[0]
          .SaldoDisponible
      )


    // ========================================================
    // 7. CONFIRMAR TODO
    // ========================================================

    await connection.commit()


    return {
      procesado: true,
      duplicado: false,
      pagoId,
      usuarioId,
      metodoPagoId,
      montoPesos,
      saldoDisponible,
      referencia,
      wompiTransactionId,
    }

  } catch (error) {

    await connection.rollback()

    throw error

  } finally {

    connection.release()
  }
}


module.exports = {
  procesarRecargaAprobada,
  obtenerMetodoPagoId,
  obtenerUsuarioIdDesdeReferencia,
}