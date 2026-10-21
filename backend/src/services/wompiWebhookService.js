const crypto = require('crypto')

const {
  obtenerConfiguracionWompi,
} = require('./wompiService')


// ============================================================
// OBTENER UN VALOR MEDIANTE UNA RUTA
//
// Ejemplo:
//
// ruta:
// transaction.amount_in_cents
//
// objeto:
// evento.data
// ============================================================

function obtenerValorPorRuta(
  objeto,
  ruta
) {

  const partes =
    String(ruta)
      .split('.')


  let valor =
    objeto


  for (const parte of partes) {

    if (
      valor === null ||
      valor === undefined ||
      !Object.prototype.hasOwnProperty.call(
        valor,
        parte
      )
    ) {

      throw new Error(
        `Propiedad de firma no encontrada: ${ruta}`
      )
    }


    valor =
      valor[parte]
  }


  return valor
}


// ============================================================
// CALCULAR CHECKSUM DEL EVENTO WOMPI
// ============================================================

function calcularChecksumEvento(
  evento
) {

  const {
    eventsSecret,
  } =
    obtenerConfiguracionWompi()


  const propiedades =
    evento?.signature?.properties


  if (
    !Array.isArray(propiedades) ||
    propiedades.length === 0
  ) {

    throw new Error(
      'El evento no contiene propiedades de firma válidas'
    )
  }


  if (
    evento.timestamp === null ||
    evento.timestamp === undefined
  ) {

    throw new Error(
      'El evento no contiene timestamp'
    )
  }


  let cadena =
    ''


  for (
    const propiedad
    of propiedades
  ) {

    const valor =
      obtenerValorPorRuta(
        evento.data,
        propiedad
      )


    cadena +=
      String(valor)
  }


  cadena +=
    String(
      evento.timestamp
    )


  cadena +=
    eventsSecret


  return crypto
    .createHash('sha256')
    .update(
      cadena,
      'utf8'
    )
    .digest('hex')
}


// ============================================================
// COMPARACIÓN SEGURA
// ============================================================

function compararChecksums(
  calculado,
  recibido
) {

  if (
    !calculado ||
    !recibido
  ) {

    return false
  }


  const esperado =
    String(calculado)
      .trim()
      .toLowerCase()


  const recibidoNormalizado =
    String(recibido)
      .trim()
      .toLowerCase()


  if (
    esperado.length !==
    recibidoNormalizado.length
  ) {

    return false
  }


  return crypto.timingSafeEqual(
    Buffer.from(
      esperado,
      'utf8'
    ),

    Buffer.from(
      recibidoNormalizado,
      'utf8'
    )
  )
}


// ============================================================
// VALIDAR FIRMA DEL EVENTO
// ============================================================

function validarFirmaEventoWompi({
  evento,
  checksumHeader,
}) {

  if (
    !evento ||
    typeof evento !== 'object'
  ) {

    return false
  }


  const checksumBody =
    evento?.signature?.checksum


  const checksumCalculado =
    calcularChecksumEvento(
      evento
    )


  const headerValido =
    checksumHeader
      ? compararChecksums(
          checksumCalculado,
          checksumHeader
        )
      : false


  const bodyValido =
    checksumBody
      ? compararChecksums(
          checksumCalculado,
          checksumBody
        )
      : false


  return (
    headerValido ||
    bodyValido
  )
}


module.exports = {
  obtenerValorPorRuta,
  calcularChecksumEvento,
  validarFirmaEventoWompi,
}