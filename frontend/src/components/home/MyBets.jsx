import { useEffect, useState } from 'react'

import {
  obtenerMisApuestas,
} from '../../services/authService'

import API_URL from '../../config/api'

function MyBets({
  onNotify,
}) {
  const [apuestas, setApuestas] =
    useState([])

  const [cargando, setCargando] =
    useState(true)

  const [error, setError] =
    useState('')
  
  const [
    apuestaDetalle,
    setApuestaDetalle,
  ] = useState(null)

  // ============================================================
  // FORMATO MONEDA
  // ============================================================

  const formatoCOP =
    new Intl.NumberFormat(
      'es-CO',
      {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }
    )


  // ============================================================
  // FORMATO FECHA
  // ============================================================

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return ''
    }

    return new Intl.DateTimeFormat(
      'es-CO',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone:
          'America/Bogota',
      }
    ).format(
      new Date(fecha)
    )
  }


  // ============================================================
  // CARGAR APUESTAS
  // ============================================================

  useEffect(() => {
    let activo = true


    const cargarApuestas =
      async () => {

        try {
          setCargando(true)
          setError('')


          const respuesta =
            await obtenerMisApuestas()


          if (activo) {
            setApuestas(
              respuesta.datos || []
            )
          }

        } catch (error) {

          console.error(
            'Error cargando apuestas:',
            error
          )


          if (activo) {
            setError(
              error.message ||
                'No fue posible cargar tus apuestas.'
            )
          }

        } finally {

          if (activo) {
            setCargando(false)
          }
        }
      }


    cargarApuestas()


    return () => {
      activo = false
    }

  }, [])


  // ============================================================
  // CLASE SEGÚN ESTADO
  // ============================================================

  const obtenerClaseEstado = (
    estado
  ) => {

    switch (estado) {

      case 'GANADA':
        return 'bet-status bet-status--won'

      case 'PERDIDA':
        return 'bet-status bet-status--lost'

      case 'ANULADA':
        return 'bet-status bet-status--cancelled'

      default:
        return 'bet-status bet-status--pending'
    }
  }


  // ============================================================
  // RENDER
  // ============================================================

  return (
    <section className="my-bets-page">

      <header className="my-bets-heading">

        <div>
          <span className="eyebrow">
            <i></i>

            ZONAGOL
          </span>

          <h1>
            Mis apuestas
          </h1>

          <p>
            Consulta tus apuestas realizadas,
            selecciones, cuotas y posibles retornos.
          </p>
        </div>


        {!cargando && !error && (
          <span className="my-bets-total">
            {apuestas.length}{' '}

            {apuestas.length === 1
              ? 'apuesta'
              : 'apuestas'}
          </span>
        )}

      </header>


      {cargando ? (

        <div className="my-bets-state">

          <strong>
            Cargando tus apuestas...
          </strong>

          <p>
            Estamos consultando tu historial en ZonaGol.
          </p>

        </div>

      ) : error ? (

        <div className="my-bets-state">

          <strong>
            No pudimos cargar tus apuestas
          </strong>

          <p>
            {error}
          </p>

        </div>

      ) : apuestas.length === 0 ? (

        <div className="my-bets-state">

          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3v3Z" />
            <path d="M13 8v2M13 14v2" />
          </svg>

          <strong>
            Aún no tienes apuestas
          </strong>

          <p>
            Cuando realices una apuesta aparecerá aquí.
          </p>

        </div>

      ) : (

        <div className="my-bets-list">

          {apuestas.map(
            (apuesta) => (

              <article
                key={
                  apuesta.apuestaId
                }
                className="my-bet-card"
              >

                {/* ==============================================
                    CABECERA
                   ============================================== */}

                <header className="my-bet-card__header">

                  <div>

                    <span className="my-bet-code">
                      {
                        apuesta.codigoApuesta
                      }
                    </span>

                    <small>
                      {
                        formatearFecha(
                          apuesta.fechaApuesta
                        )
                      }
                    </small>

                  </div>


                  <span
                    className={
                      obtenerClaseEstado(
                        apuesta.estado
                      )
                    }
                  >
                    {apuesta.estado}
                  </span>

                </header>


                {/* ==============================================
                    RESUMEN
                   ============================================== */}

                <div className="my-bet-summary">

                  <div>
                    <small>
                      Apostado
                    </small>

                    <strong>
                      {
                        formatoCOP.format(
                          apuesta.montoApostado
                        )
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      Cuota total
                    </small>

                    <strong>
                      {
                        Number(
                          apuesta.cuotaTotal
                        ).toFixed(2)
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      Selecciones
                    </small>

                    <strong>
                      {
                        apuesta
                          .cantidadSelecciones
                      }
                    </strong>
                  </div>


                  <div>
                    <small>
                      Retorno potencial
                    </small>

                    <strong className="my-bet-potential">
                      {
                        formatoCOP.format(
                          apuesta
                            .retornoPotencial
                        )
                      }
                    </strong>
                  </div>

                </div>


                {/* ==============================================
                    SELECCIONES
                   ============================================== */}

                <div className="my-bet-selections">

                  {apuesta.selecciones
                    .slice(0, 1)
                    .map(
                      (seleccion) => (

                      <div
                        key={
                          seleccion
                            .detalleApuestaId
                        }
                        className="my-bet-selection"
                      >

                        <div className="my-bet-selection__match">

                          <span className="my-bet-team">

                            <b>
                              <img
                                src={`${API_URL}/postgres/equipos/${seleccion.equipoLocalId}/logo`}
                                alt={`Escudo de ${seleccion.equipoLocal}`}
                              />
                            </b>

                            {
                              seleccion
                                .equipoLocal
                            }

                          </span>


                          <span className="my-bet-vs">
                            vs
                          </span>


                          <span className="my-bet-team">

                            <b>
                              <img
                                src={`${API_URL}/postgres/equipos/${seleccion.equipoVisitanteId}/logo`}
                                alt={`Escudo de ${seleccion.equipoVisitante}`}
                              />
                            </b>

                            {
                              seleccion
                                .equipoVisitante
                            }

                          </span>

                        </div>


                        <div className="my-bet-selection__info">

                          <div>
                            <small>
                              Selección
                            </small>

                            <strong>
                              {
                                seleccion
                                  .opcionApuesta
                              }
                            </strong>
                          </div>


                          <div>
                            <small>
                              Cuota aceptada
                            </small>

                            <strong>
                              {
                                Number(
                                  seleccion
                                    .cuotaAceptada
                                ).toFixed(2)
                              }
                            </strong>
                          </div>


                          <div>
                            <small>
                              Jornada
                            </small>

                            <strong>
                              {
                                seleccion
                                  .jornada
                              }
                            </strong>
                          </div>


                          <div>
                            <small>
                              Estado
                            </small>

                            <strong>
                              {
                                seleccion
                                  .estadoDetalle
                              }
                            </strong>
                          </div>

                        </div>

                      </div>
                    )
                  )}

                  <button
                    type="button"
                    className="my-bet-details-button"
                    onClick={() =>
                      setApuestaDetalle(apuesta)
                    }
                  >
                    Ver{' '}
                    {apuesta.selecciones.length === 1
                      ? 'la selección'
                      : `las ${apuesta.selecciones.length} selecciones`}

                    <span aria-hidden="true">
                      →
                    </span>
                  </button>

                </div>


                <footer className="my-bet-card__footer">

                  <span>
                    {apuesta.estado ===
                    'PENDIENTE'
                      ? 'La apuesta se liquidará cuando finalicen sus selecciones.'
                      : `Apuesta ${apuesta.estado.toLowerCase()}.`}
                  </span>

                </footer>

              </article>
            )
          )}

        </div>
      )}
      

      {apuestaDetalle && (
        <div
          className="my-bet-modal-overlay"
          onClick={() =>
            setApuestaDetalle(null)
          }
        >
          <div
            className="my-bet-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="my-bet-modal-title"
            onClick={(evento) =>
              evento.stopPropagation()
            }
          >

            <header className="my-bet-modal__header">

              <div>
                <span>
                  DETALLE DE APUESTA
                </span>

                <h2 id="my-bet-modal-title">
                  {apuestaDetalle.codigoApuesta}
                </h2>

                <p>
                  {
                    apuestaDetalle
                      .selecciones.length
                  }{' '}
                  {apuestaDetalle
                    .selecciones.length === 1
                    ? 'selección'
                    : 'selecciones'}
                </p>
              </div>

              <button
                type="button"
                className="my-bet-modal__close"
                onClick={() =>
                  setApuestaDetalle(null)
                }
                aria-label="Cerrar detalle de apuesta"
              >
                ×
              </button>

            </header>


            <div className="my-bet-modal__summary">

              <div>
                <small>
                  Apostado
                </small>

                <strong>
                  {formatoCOP.format(
                    apuestaDetalle
                      .montoApostado
                  )}
                </strong>
              </div>

              <div>
                <small>
                  Cuota total
                </small>

                <strong>
                  {Number(
                    apuestaDetalle
                      .cuotaTotal
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <small>
                  Retorno potencial
                </small>

                <strong>
                  {formatoCOP.format(
                    apuestaDetalle
                      .retornoPotencial
                  )}
                </strong>
              </div>

            </div>


            <div className="my-bet-modal__selections">

              {apuestaDetalle.selecciones.map(
                (seleccion, indice) => (

                  <article
                    key={
                      seleccion
                        .detalleApuestaId
                    }
                    className="my-bet-modal-selection"
                  >

                    <div className="my-bet-modal-selection__number">
                      {indice + 1}
                    </div>


                    <div className="my-bet-modal-selection__content">

                      <div className="my-bet-modal-selection__match">

                        <strong className="my-bet-modal-team">
                          <img
                            src={`${API_URL}/postgres/equipos/${seleccion.equipoLocalId}/logo`}
                            alt={`Escudo de ${seleccion.equipoLocal}`}
                          />

                          <span>
                            {seleccion.equipoLocal}
                          </span>
                        </strong>

                        <span className="my-bet-modal-vs">
                          vs
                        </span>

                        <strong className="my-bet-modal-team my-bet-modal-team--away">
                          <img
                            src={`${API_URL}/postgres/equipos/${seleccion.equipoVisitanteId}/logo`}
                            alt={`Escudo de ${seleccion.equipoVisitante}`}
                          />

                          <span>
                            {seleccion.equipoVisitante}
                          </span>
                        </strong>

                      </div>


                      <div className="my-bet-modal-selection__data">

                        <div>
                          <small>
                            Selección
                          </small>

                          <strong>
                            {
                              seleccion
                                .opcionApuesta
                            }
                          </strong>
                        </div>


                        <div>
                          <small>
                            Cuota
                          </small>

                          <strong>
                            {Number(
                              seleccion
                                .cuotaAceptada
                            ).toFixed(2)}
                          </strong>
                        </div>


                        <div>
                          <small>
                            Jornada
                          </small>

                          <strong>
                            {
                              seleccion
                                .jornada
                            }
                          </strong>
                        </div>


                        <div>
                          <small>
                            Estado
                          </small>

                          <strong>
                            {
                              seleccion
                                .estadoDetalle
                            }
                          </strong>
                        </div>

                      </div>

                    </div>

                  </article>
                )
              )}

            </div>

          </div>
        </div>
      )}

    </section>
  )
}

export default MyBets